#!/usr/bin/env python3
"""
iExec TEE Task: Verifiable Compliance Check
This task runs inside a TEE to confidentially verify KYC/AML compliance.
"""

import json
import sys
import os
from typing import Dict
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64


class ComplianceChecker:
    """Confidential compliance verification engine"""
    
    def __init__(self):
        self.compliance_rules = {}
        self.blacklist = set()  # In production, this would be encrypted/secure
    
    def load_compliance_rules(self, rules: Dict):
        """Load compliance rules (confidentially stored in TEE)"""
        self.compliance_rules = rules
    
    def check_compliance(
        self,
        participant_id: str,
        encrypted_identity_data: bytes,
        decryption_key: bytes = None
    ) -> Dict:
        """
        Verify compliance without exposing identity data
        Returns compliance proof with attestation
        """
        # In production, decrypt identity data using secure key management
        # For demo, we assume data is already processed
        
        # Extract compliance-relevant fields (without exposing full identity)
        # This is a simplified version - in production, use proper ZK proofs
        
        # Check against blacklist
        if participant_id in self.blacklist:
            return {
                'compliant': False,
                'reason': 'blacklisted',
                'attestation': None
            }
        
        # Apply compliance rules
        rules = self.compliance_rules.get('rules', {})
        
        # Simplified compliance checks
        # In production, this would verify:
        # - KYC status
        # - AML screening
        # - Jurisdictional restrictions
        # - Accreditation status
        # etc.
        
        compliant = True
        reasons = []
        
        # Check minimum requirements
        if rules.get('require_kyc', False):
            # In production, verify KYC status from encrypted data
            compliant = True  # Simplified
        
        if rules.get('require_aml', False):
            # In production, verify AML screening
            compliant = True  # Simplified
        
        if rules.get('min_age', 0) > 0:
            # In production, extract and verify age from encrypted data
            pass
        
        # Generate compliance proof
        compliance_data = {
            'participant_id': participant_id,
            'compliant': compliant,
            'timestamp': int(os.path.getmtime(__file__)),  # Use actual timestamp
            'rules_version': rules.get('version', '1.0')
        }
        
        # Generate attestation hash
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(json.dumps(compliance_data, sort_keys=True).encode())
        attestation_hash = digest.finalize()
        
        # In production, generate ZK proof here
        zk_proof = None  # Placeholder for ZK proof
        
        return {
            'compliant': compliant,
            'compliance_hash': base64.b64encode(attestation_hash[:16]).hex(),
            'attestation': base64.b64encode(attestation_hash).decode('utf-8'),
            'attestation_data': compliance_data,
            'zk_proof': zk_proof,
            'reasons': reasons if not compliant else None
        }


def main():
    """Main TEE task entry point"""
    try:
        # Read input parameters
        input_file = os.path.join(os.getenv("IEXEC_IN", "/iexec_in"), "input.json")
        if not os.path.exists(input_file):
            print("Error: input.json not found", file=sys.stderr)
            sys.exit(1)
        
        with open(input_file, 'r') as f:
            params = json.load(f)
        
        participant_id = params.get('participant_id')
        encrypted_identity = params.get('encrypted_identity')
        compliance_rules = params.get('compliance_rules', {})
        
        if not participant_id:
            print("Error: participant_id required", file=sys.stderr)
            sys.exit(1)
        
        # Initialize checker
        checker = ComplianceChecker()
        checker.load_compliance_rules(compliance_rules)
        
        # Decrypt identity if needed
        encrypted_bytes = None
        if encrypted_identity:
            encrypted_bytes = base64.b64decode(encrypted_identity)
        
        # Perform compliance check
        result = checker.check_compliance(participant_id, encrypted_bytes)
        
        # Write output
        output_dir = os.getenv("IEXEC_OUT", "/iexec_out")
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, "output.json")
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        # Write completion marker
        completion_file = os.path.join(output_dir, "computed.json")
        with open(completion_file, 'w') as f:
            json.dump({
                'deterministic-output-path': 'output.json'
            }, f)
        
        status = "COMPLIANT" if result['compliant'] else "NON-COMPLIANT"
        print(f"Compliance check complete: {status}")
        if not result['compliant']:
            print(f"Reason: {result.get('reason', 'unknown')}")
        
    except Exception as e:
        print(f"Error in TEE task: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
