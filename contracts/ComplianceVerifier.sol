// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceVerifier
 * @notice Stores and verifies compliance proofs from TEE-based KYC/AML checks
 * @dev Compliance checks run confidentially in TEE, only proofs published on-chain
 */
contract ComplianceVerifier is Ownable {
    enum ComplianceStatus { Pending, Verified, Rejected, Expired }

    struct ComplianceProof {
        address participant;          // Participant address
        bytes32 complianceHash;       // Hash of compliance data
        bytes32 teeAttestation;       // TEE execution attestation
        bytes zkProof;                // Zero-knowledge proof (optional)
        ComplianceStatus status;      // Verification status
        uint256 timestamp;            // Proof creation time
        uint256 expiryTime;           // Proof expiry time
    }

    // Participant => Compliance Proof
    mapping(address => ComplianceProof) public complianceProofs;
    
    // Compliance hash => is valid
    mapping(bytes32 => bool) public validComplianceHashes;
    
    // TEE attestation => is verified
    mapping(bytes32 => bool) public verifiedAttestations;

    // Compliance requirements
    uint256 public complianceExpiryDuration = 365 days;
    bool public requireCompliance = true;

    // Events
    event ComplianceProofSubmitted(
        address indexed participant,
        bytes32 complianceHash,
        bytes32 teeAttestation,
        bytes zkProof
    );

    event ComplianceVerified(
        address indexed participant,
        bytes32 complianceHash,
        bytes32 teeAttestation
    );

    event ComplianceRejected(
        address indexed participant,
        bytes32 complianceHash,
        string reason
    );

    event ComplianceExpired(address indexed participant);

    /**
     * @notice Submit a compliance proof from TEE execution
     */
    function submitComplianceProof(
        address participant,
        bytes32 complianceHash,
        bytes32 teeAttestation,
        bytes calldata zkProof
    ) external onlyOwner {
        require(participant != address(0), "Invalid participant");

        ComplianceProof storage proof = complianceProofs[participant];
        proof.participant = participant;
        proof.complianceHash = complianceHash;
        proof.teeAttestation = teeAttestation;
        proof.zkProof = zkProof;
        proof.status = ComplianceStatus.Pending;
        proof.timestamp = block.timestamp;
        proof.expiryTime = block.timestamp + complianceExpiryDuration;

        emit ComplianceProofSubmitted(participant, complianceHash, teeAttestation, zkProof);
    }

    /**
     * @notice Verify a compliance proof
     * @dev In production, verify TEE attestation and ZK proof here
     */
    function verifyCompliance(
        address participant,
        bytes32 expectedComplianceHash
    ) external onlyOwner {
        ComplianceProof storage proof = complianceProofs[participant];
        
        require(proof.status == ComplianceStatus.Pending, "Invalid status");
        require(proof.complianceHash == expectedComplianceHash, "Hash mismatch");
        require(block.timestamp < proof.expiryTime, "Proof expired");

        // In production, verify TEE attestation signature and ZK proof here
        // For now, we trust the owner (should be replaced with proper verification)

        proof.status = ComplianceStatus.Verified;
        validComplianceHashes[proof.complianceHash] = true;
        verifiedAttestations[proof.teeAttestation] = true;

        emit ComplianceVerified(participant, proof.complianceHash, proof.teeAttestation);
    }

    /**
     * @notice Reject a compliance proof
     */
    function rejectCompliance(
        address participant,
        string calldata reason
    ) external onlyOwner {
        ComplianceProof storage proof = complianceProofs[participant];
        
        require(proof.status == ComplianceStatus.Pending, "Invalid status");

        proof.status = ComplianceStatus.Rejected;

        emit ComplianceRejected(participant, proof.complianceHash, reason);
    }

    /**
     * @notice Check if a participant is compliant
     */
    function isCompliant(address participant) external view returns (bool) {
        if (!requireCompliance) return true;

        ComplianceProof storage proof = complianceProofs[participant];
        
        return proof.status == ComplianceStatus.Verified &&
               block.timestamp < proof.expiryTime;
    }

    /**
     * @notice Mark compliance as expired
     */
    function expireCompliance(address participant) external {
        ComplianceProof storage proof = complianceProofs[participant];
        
        require(proof.status == ComplianceStatus.Verified, "Not verified");
        require(block.timestamp >= proof.expiryTime, "Not expired yet");

        proof.status = ComplianceStatus.Expired;
        validComplianceHashes[proof.complianceHash] = false;

        emit ComplianceExpired(participant);
    }

    /**
     * @notice Get compliance proof for a participant
     */
    function getComplianceProof(address participant) external view returns (
        bytes32 complianceHash,
        bytes32 teeAttestation,
        ComplianceStatus status,
        uint256 timestamp,
        uint256 expiryTime
    ) {
        ComplianceProof storage proof = complianceProofs[participant];
        return (
            proof.complianceHash,
            proof.teeAttestation,
            proof.status,
            proof.timestamp,
            proof.expiryTime
        );
    }

    /**
     * @notice Set compliance requirements
     */
    function setComplianceExpiryDuration(uint256 duration) external onlyOwner {
        complianceExpiryDuration = duration;
    }

    function setRequireCompliance(bool required) external onlyOwner {
        requireCompliance = required;
    }
}
