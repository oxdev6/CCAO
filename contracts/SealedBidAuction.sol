// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SealedBidAuction
 * @notice Manages sealed-bid auctions with confidential matching via iExec TEE
 * @dev Bids are encrypted and matching happens off-chain in TEE, only results published on-chain
 */
contract SealedBidAuction is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    enum AuctionStatus { Created, BiddingOpen, BiddingClosed, Matched, Settled, Cancelled }

    struct Auction {
        address assetToken;           // Token being auctioned
        uint256 assetAmount;          // Amount of asset
        uint256 reservePrice;         // Minimum acceptable price
        uint256 startTime;            // Bidding start time
        uint256 endTime;              // Bidding end time
        AuctionStatus status;         // Current auction status
        address[] bidders;            // List of bidders
        mapping(address => bytes) encryptedBids; // Encrypted bid data
        mapping(address => address) escrowAddresses; // TEE-generated escrow per bidder (SUAVE-style)
        mapping(address => uint256) escrowDeposits; // Deposits in escrow addresses
        mapping(address => bool) hasBid;         // Bid submission tracking
        address winner;               // Winner address (set after TEE matching)
        uint256 winningPrice;         // Winning price (set after TEE matching)
        bytes32 teeAttestation;       // TEE execution attestation
        bool settlementComplete;      // Cross-chain settlement status
        uint256 totalBidValue;        // Total value of all bids (for analytics)
    }

    struct BidSubmission {
        address bidder;
        bytes encryptedBid;           // Encrypted bid data
        bytes signature;              // Signature for verification
        uint256 timestamp;
    }

    // Auction ID => Auction
    mapping(uint256 => Auction) public auctions;
    uint256 public auctionCounter;

    // Events
    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed assetToken,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime
    );

    event BidSubmitted(
        uint256 indexed auctionId,
        address indexed bidder,
        address indexed escrowAddress,
        bytes encryptedBid,
        uint256 escrowDeposit,
        uint256 timestamp
    );

    event AuctionMatched(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningPrice,
        bytes32 teeAttestation
    );

    event SettlementInitiated(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 amount
    );

    modifier onlyValidAuction(uint256 auctionId) {
        require(auctions[auctionId].assetToken != address(0), "Auction does not exist");
        _;
    }

    /**
     * @notice Create a new sealed-bid auction
     */
    function createAuction(
        address assetToken,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 biddingDuration
    ) external onlyOwner returns (uint256 auctionId) {
        require(assetToken != address(0), "Invalid asset token");
        require(assetAmount > 0, "Invalid asset amount");
        require(biddingDuration > 0, "Invalid duration");

        auctionId = auctionCounter++;
        Auction storage auction = auctions[auctionId];
        
        auction.assetToken = assetToken;
        auction.assetAmount = assetAmount;
        auction.reservePrice = reservePrice;
        auction.startTime = block.timestamp;
        auction.endTime = block.timestamp + biddingDuration;
        auction.status = AuctionStatus.BiddingOpen;

        emit AuctionCreated(
            auctionId,
            assetToken,
            assetAmount,
            reservePrice,
            auction.startTime,
            auction.endTime
        );

        return auctionId;
    }

    /**
     * @notice Submit an encrypted bid with escrow commitment (SUAVE-style)
     * @dev Bid must be encrypted with the auction's public key
     * @param escrowAddress TEE-generated escrow address for this bid (provides additional privacy)
     * @param escrowDeposit Amount deposited in escrow as commitment
     */
    function submitBid(
        uint256 auctionId,
        bytes calldata encryptedBid,
        address escrowAddress,
        uint256 escrowDeposit,
        bytes calldata signature
    ) external payable nonReentrant onlyValidAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.BiddingOpen, "Bidding not open");
        require(block.timestamp >= auction.startTime, "Auction not started");
        require(block.timestamp <= auction.endTime, "Bidding closed");
        require(!auction.hasBid[msg.sender], "Already submitted bid");
        require(escrowAddress != address(0), "Invalid escrow address");
        require(msg.value >= escrowDeposit, "Insufficient escrow deposit");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            auctionId, 
            msg.sender, 
            encryptedBid, 
            escrowAddress,
            escrowDeposit,
            block.timestamp
        ));
        address signer = messageHash.toEthSignedMessageHash().recover(signature);
        require(signer == msg.sender, "Invalid signature");

        auction.bidders.push(msg.sender);
        auction.encryptedBids[msg.sender] = encryptedBid;
        auction.escrowAddresses[msg.sender] = escrowAddress;
        auction.escrowDeposits[msg.sender] = escrowDeposit;
        auction.hasBid[msg.sender] = true;
        auction.totalBidValue += escrowDeposit;

        // Transfer escrow deposit to escrow address
        if (escrowDeposit > 0) {
            (bool success, ) = escrowAddress.call{value: escrowDeposit}("");
            require(success, "Escrow transfer failed");
        }

        // Refund excess
        if (msg.value > escrowDeposit) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - escrowDeposit}("");
            require(refundSuccess, "Refund failed");
        }

        emit BidSubmitted(auctionId, msg.sender, escrowAddress, encryptedBid, escrowDeposit, block.timestamp);
    }

    /**
     * @notice Batch submit bids (gas optimization for multiple bidders)
     */
    function batchSubmitBids(
        uint256 auctionId,
        address[] calldata bidders,
        bytes[] calldata encryptedBids,
        address[] calldata escrowAddresses,
        uint256[] calldata escrowDeposits,
        bytes[] calldata signatures
    ) external payable nonReentrant onlyValidAuction(auctionId) {
        require(bidders.length == encryptedBids.length, "Array length mismatch");
        require(bidders.length == escrowAddresses.length, "Array length mismatch");
        require(bidders.length == escrowDeposits.length, "Array length mismatch");
        require(bidders.length == signatures.length, "Array length mismatch");

        uint256 totalDeposit = 0;
        for (uint256 i = 0; i < escrowDeposits.length; i++) {
            totalDeposit += escrowDeposits[i];
        }
        require(msg.value >= totalDeposit, "Insufficient total deposit");

        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.BiddingOpen, "Bidding not open");

        for (uint256 i = 0; i < bidders.length; i++) {
            if (!auction.hasBid[bidders[i]] && 
                block.timestamp >= auction.startTime && 
                block.timestamp <= auction.endTime) {
                
                bytes32 messageHash = keccak256(abi.encodePacked(
                    auctionId,
                    bidders[i],
                    encryptedBids[i],
                    escrowAddresses[i],
                    escrowDeposits[i],
                    block.timestamp
                ));
                address signer = messageHash.toEthSignedMessageHash().recover(signatures[i]);
                
                if (signer == bidders[i] && escrowAddresses[i] != address(0)) {
                    auction.bidders.push(bidders[i]);
                    auction.encryptedBids[bidders[i]] = encryptedBids[i];
                    auction.escrowAddresses[bidders[i]] = escrowAddresses[i];
                    auction.escrowDeposits[bidders[i]] = escrowDeposits[i];
                    auction.hasBid[bidders[i]] = true;
                    auction.totalBidValue += escrowDeposits[i];

                    if (escrowDeposits[i] > 0) {
                        (bool success, ) = escrowAddresses[i].call{value: escrowDeposits[i]}("");
                        if (success) {
                            emit BidSubmitted(
                                auctionId, 
                                bidders[i], 
                                escrowAddresses[i], 
                                encryptedBids[i], 
                                escrowDeposits[i], 
                                block.timestamp
                            );
                        }
                    }
                }
            }
        }

        // Refund excess
        if (msg.value > totalDeposit) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - totalDeposit}("");
            require(refundSuccess, "Refund failed");
        }
    }

    /**
     * @notice Close bidding and trigger TEE matching
     * @dev Only owner can close bidding; actual matching happens in TEE
     */
    function closeBidding(uint256 auctionId) external onlyOwner onlyValidAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.BiddingOpen, "Not in bidding phase");
        require(block.timestamp >= auction.endTime, "Bidding still open");

        auction.status = AuctionStatus.BiddingClosed;
    }

    /**
     * @notice Publish TEE matching results
     * @dev Called after TEE task completes matching; includes attestation proof
     */
    function publishMatchingResult(
        uint256 auctionId,
        address winner,
        uint256 winningPrice,
        bytes32 teeAttestation
    ) external onlyOwner onlyValidAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.BiddingClosed, "Bidding must be closed");
        require(winner != address(0), "Invalid winner");
        require(winningPrice >= auction.reservePrice, "Price below reserve");
        require(auction.hasBid[winner], "Winner must have bid");

        auction.winner = winner;
        auction.winningPrice = winningPrice;
        auction.teeAttestation = teeAttestation;
        auction.status = AuctionStatus.Matched;

        emit AuctionMatched(auctionId, winner, winningPrice, teeAttestation);
    }

    /**
     * @notice Initiate cross-chain settlement
     */
    function initiateSettlement(uint256 auctionId) external onlyOwner onlyValidAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Matched, "Auction must be matched");
        require(!auction.settlementComplete, "Already settled");

        auction.status = AuctionStatus.Settled;
        auction.settlementComplete = true;

        emit SettlementInitiated(auctionId, auction.winner, auction.winningPrice);
    }

    /**
     * @notice Get auction details
     */
    function getAuction(uint256 auctionId) external view returns (
        address assetToken,
        uint256 assetAmount,
        uint256 reservePrice,
        uint256 startTime,
        uint256 endTime,
        AuctionStatus status,
        address winner,
        uint256 winningPrice,
        uint256 bidderCount
    ) {
        Auction storage auction = auctions[auctionId];
        return (
            auction.assetToken,
            auction.assetAmount,
            auction.reservePrice,
            auction.startTime,
            auction.endTime,
            auction.status,
            auction.winner,
            auction.winningPrice,
            auction.bidders.length
        );
    }

    /**
     * @notice Get encrypted bid for a bidder (for TEE processing)
     * @dev Only accessible by owner/TEE for processing
     */
    function getEncryptedBid(uint256 auctionId, address bidder) external view onlyOwner returns (bytes memory) {
        return auctions[auctionId].encryptedBids[bidder];
    }

    /**
     * @notice Get all bidders for an auction
     */
    function getBidders(uint256 auctionId) external view returns (address[] memory) {
        return auctions[auctionId].bidders;
    }

    /**
     * @notice Get escrow address for a bidder
     */
    function getEscrowAddress(uint256 auctionId, address bidder) external view returns (address) {
        return auctions[auctionId].escrowAddresses[bidder];
    }

    /**
     * @notice Get auction statistics
     */
    function getAuctionStats(uint256 auctionId) external view returns (
        uint256 totalBidValue,
        uint256 bidderCount,
        uint256 timeRemaining
    ) {
        Auction storage auction = auctions[auctionId];
        uint256 remaining = auction.endTime > block.timestamp ? auction.endTime - block.timestamp : 0;
        return (auction.totalBidValue, auction.bidders.length, remaining);
    }
}
