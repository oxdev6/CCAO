// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CrossChainSettlement
 * @notice Handles cross-chain asset settlement with TEE-verified results
 * @dev Settlement amounts are computed confidentially in TEE, only results published
 */
contract CrossChainSettlement is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum SettlementStatus { Pending, Verified, Executed, Failed }

    struct Settlement {
        uint256 sourceChainId;        // Source chain ID
        uint256 targetChainId;        // Target chain ID
        address assetToken;            // Token to settle
        address recipient;             // Recipient address
        uint256 amount;                // Settlement amount
        bytes32 teeAttestation;        // TEE execution proof
        bytes32 messageHash;           // Cross-chain message hash
        SettlementStatus status;       // Settlement status
        uint256 timestamp;             // Creation timestamp
    }

    // Settlement ID => Settlement
    mapping(bytes32 => Settlement) public settlements;
    
    // Chain ID => Bridge address (for cross-chain messaging)
    mapping(uint256 => address) public bridgeAddresses;
    
    // Supported tokens
    mapping(address => bool) public supportedTokens;

    // Events
    event SettlementCreated(
        bytes32 indexed settlementId,
        uint256 sourceChainId,
        uint256 targetChainId,
        address indexed recipient,
        address assetToken,
        uint256 amount,
        bytes32 teeAttestation
    );

    event SettlementVerified(
        bytes32 indexed settlementId,
        bytes32 teeAttestation
    );

    event SettlementExecuted(
        bytes32 indexed settlementId,
        address indexed recipient,
        uint256 amount
    );

    event BridgeAddressSet(uint256 chainId, address bridge);

    modifier onlyBridge(uint256 chainId) {
        require(bridgeAddresses[chainId] == msg.sender, "Not authorized bridge");
        _;
    }

    /**
     * @notice Set bridge address for a chain
     */
    function setBridgeAddress(uint256 chainId, address bridge) external onlyOwner {
        require(bridge != address(0), "Invalid bridge address");
        bridgeAddresses[chainId] = bridge;
        emit BridgeAddressSet(chainId, bridge);
    }

    /**
     * @notice Add/remove supported token
     */
    function setSupportedToken(address token, bool supported) external onlyOwner {
        supportedTokens[token] = supported;
    }

    /**
     * @notice Create a new settlement request
     * @dev Called after TEE computes settlement amounts
     */
    function createSettlement(
        uint256 sourceChainId,
        uint256 targetChainId,
        address assetToken,
        address recipient,
        uint256 amount,
        bytes32 teeAttestation
    ) external onlyOwner returns (bytes32 settlementId) {
        require(supportedTokens[assetToken], "Token not supported");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        settlementId = keccak256(abi.encodePacked(
            sourceChainId,
            targetChainId,
            assetToken,
            recipient,
            amount,
            teeAttestation,
            block.timestamp
        ));

        Settlement storage settlement = settlements[settlementId];
        settlement.sourceChainId = sourceChainId;
        settlement.targetChainId = targetChainId;
        settlement.assetToken = assetToken;
        settlement.recipient = recipient;
        settlement.amount = amount;
        settlement.teeAttestation = teeAttestation;
        settlement.status = SettlementStatus.Pending;
        settlement.timestamp = block.timestamp;

        emit SettlementCreated(
            settlementId,
            sourceChainId,
            targetChainId,
            recipient,
            assetToken,
            amount,
            teeAttestation
        );

        return settlementId;
    }

    /**
     * @notice Verify settlement with TEE attestation
     */
    function verifySettlement(
        bytes32 settlementId,
        bytes32 teeAttestation
    ) external onlyOwner {
        Settlement storage settlement = settlements[settlementId];
        
        require(settlement.status == SettlementStatus.Pending, "Invalid status");
        require(settlement.teeAttestation == teeAttestation, "Attestation mismatch");

        // In production, verify TEE attestation signature here
        // For now, we trust the owner (should be replaced with proper verification)

        settlement.status = SettlementStatus.Verified;

        emit SettlementVerified(settlementId, teeAttestation);
    }

    /**
     * @notice Execute settlement on target chain
     * @dev Called by bridge after cross-chain message verification
     */
    function executeSettlement(
        bytes32 settlementId,
        bytes32 messageHash
    ) external nonReentrant {
        Settlement storage settlement = settlements[settlementId];
        
        require(settlement.status == SettlementStatus.Verified, "Not verified");
        require(settlement.messageHash == bytes32(0) || settlement.messageHash == messageHash, "Invalid message");
        
        settlement.messageHash = messageHash;
        settlement.status = SettlementStatus.Executed;

        IERC20 token = IERC20(settlement.assetToken);
        token.safeTransfer(settlement.recipient, settlement.amount);

        emit SettlementExecuted(settlementId, settlement.recipient, settlement.amount);
    }

    /**
     * @notice Cross-chain message handler
     * @dev Called by bridge when receiving settlement from another chain
     */
    function receiveSettlement(
        uint256 sourceChainId,
        address assetToken,
        address recipient,
        uint256 amount,
        bytes32 teeAttestation,
        bytes32 messageHash
    ) external onlyBridge(sourceChainId) nonReentrant {
        require(supportedTokens[assetToken], "Token not supported");
        require(recipient != address(0), "Invalid recipient");

        bytes32 settlementId = keccak256(abi.encodePacked(
            sourceChainId,
            block.chainid,
            assetToken,
            recipient,
            amount,
            teeAttestation,
            block.timestamp
        ));

        Settlement storage settlement = settlements[settlementId];
        settlement.sourceChainId = sourceChainId;
        settlement.targetChainId = block.chainid;
        settlement.assetToken = assetToken;
        settlement.recipient = recipient;
        settlement.amount = amount;
        settlement.teeAttestation = teeAttestation;
        settlement.messageHash = messageHash;
        settlement.status = SettlementStatus.Executed;
        settlement.timestamp = block.timestamp;

        IERC20 token = IERC20(assetToken);
        token.safeTransfer(recipient, amount);

        emit SettlementExecuted(settlementId, recipient, amount);
    }

    /**
     * @notice Batch create settlements (gas optimization)
     */
    function batchCreateSettlements(
        uint256 sourceChainId,
        uint256 targetChainId,
        address[] calldata assetTokens,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32[] calldata teeAttestations
    ) external onlyOwner returns (bytes32[] memory settlementIds) {
        require(
            assetTokens.length == recipients.length &&
            recipients.length == amounts.length &&
            amounts.length == teeAttestations.length,
            "Array length mismatch"
        );

        settlementIds = new bytes32[](assetTokens.length);

        for (uint256 i = 0; i < assetTokens.length; i++) {
            if (supportedTokens[assetTokens[i]] && recipients[i] != address(0) && amounts[i] > 0) {
                bytes32 settlementId = keccak256(abi.encodePacked(
                    sourceChainId,
                    targetChainId,
                    assetTokens[i],
                    recipients[i],
                    amounts[i],
                    teeAttestations[i],
                    block.timestamp,
                    i
                ));

                Settlement storage settlement = settlements[settlementId];
                settlement.sourceChainId = sourceChainId;
                settlement.targetChainId = targetChainId;
                settlement.assetToken = assetTokens[i];
                settlement.recipient = recipients[i];
                settlement.amount = amounts[i];
                settlement.teeAttestation = teeAttestations[i];
                settlement.status = SettlementStatus.Pending;
                settlement.timestamp = block.timestamp;

                emit SettlementCreated(
                    settlementId,
                    sourceChainId,
                    targetChainId,
                    recipients[i],
                    assetTokens[i],
                    amounts[i],
                    teeAttestations[i]
                );

                settlementIds[i] = settlementId;
            }
        }

        return settlementIds;
    }

    /**
     * @notice Batch execute settlements (gas optimization)
     */
    function batchExecuteSettlements(
        bytes32[] calldata settlementIds,
        bytes32[] calldata messageHashes
    ) external nonReentrant {
        require(settlementIds.length == messageHashes.length, "Array length mismatch");

        for (uint256 i = 0; i < settlementIds.length; i++) {
            Settlement storage settlement = settlements[settlementIds[i]];
            
            if (settlement.status == SettlementStatus.Verified &&
                (settlement.messageHash == bytes32(0) || settlement.messageHash == messageHashes[i])) {
                
                settlement.messageHash = messageHashes[i];
                settlement.status = SettlementStatus.Executed;

                IERC20 token = IERC20(settlement.assetToken);
                token.safeTransfer(settlement.recipient, settlement.amount);

                emit SettlementExecuted(settlementIds[i], settlement.recipient, settlement.amount);
            }
        }
    }

    /**
     * @notice Get settlement details
     */
    function getSettlement(bytes32 settlementId) external view returns (
        uint256 sourceChainId,
        uint256 targetChainId,
        address assetToken,
        address recipient,
        uint256 amount,
        SettlementStatus status
    ) {
        Settlement storage settlement = settlements[settlementId];
        return (
            settlement.sourceChainId,
            settlement.targetChainId,
            settlement.assetToken,
            settlement.recipient,
            settlement.amount,
            settlement.status
        );
    }
}
