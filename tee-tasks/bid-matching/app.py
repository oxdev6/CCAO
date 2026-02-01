#!/usr/bin/env python3
"""
iExec TEE Task: Confidential Sealed-Bid Matching
This task runs inside a TEE to confidentially match bids and determine winners.
"""

import json
import sys
import os
from typing import List, Dict, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64

# TEE environment variables
IEXEC_IN = os.getenv("IEXEC_IN", "/iexec_in")
IEXEC_OUT = os.getenv("IEXEC_OUT", "/iexec_out")
IEXEC_DATASET_FILENAME = os.getenv("IEXEC_DATASET_FILENAME", "")


class BidMatcher:
    """Confidential bid matching engine"""
    
    def __init__(self, auction_id: str, reserve_price: float):
        self.auction_id = auction_id
        self.reserve_price = reserve_price
        self.bids: List[Dict] = []
    
    def add_encrypted_bid(self, bidder: str, encrypted_bid: bytes, decryption_key: bytes):
        """
        Decrypt and add a bid to the matching pool
        In production, decryption key would come from secure key management
        """
        try:
            # Decrypt bid (simplified - in production use proper key derivation)
            nonce = encrypted_bid[:12]
            ciphertext = encrypted_bid[12:]
            
            aesgcm = AESGCM(decryption_key)
            decrypted = aesgcm.decrypt(nonce, ciphertext, None)
            
            bid_data = json.loads(decrypted.decode('utf-8'))
            
            self.bids.append({
                'bidder': bidder,
                'price': float(bid_data['price']),
                'amount': float(bid_data.get('amount', 1.0)),
                'timestamp': bid_data.get('timestamp', 0)
            })
        except Exception as e:
            print(f"Error decrypting bid from {bidder}: {e}", file=sys.stderr)
            raise
    
    def match_bids(self) -> Dict:
        """
        Match bids and determine winner
        Returns winner and price, with attestation data
        """
        if not self.bids:
            return {
                'winner': None,
                'winning_price': 0,
                'status': 'no_bids'
            }
        
        # Sort bids by price (descending) and timestamp (ascending for tie-breaking)
        sorted_bids = sorted(
            self.bids,
            key=lambda x: (-x['price'], x['timestamp'])
        )
        
        # Find highest bid above reserve price
        winner_bid = None
        for bid in sorted_bids:
            if bid['price'] >= self.reserve_price:
                winner_bid = bid
                break
        
        if not winner_bid:
            return {
                'winner': None,
                'winning_price': 0,
                'status': 'reserve_not_met',
                'highest_bid': sorted_bids[0]['price'] if sorted_bids else 0
            }
        
        # Generate attestation hash (in production, this would be a proper TEE attestation)
        attestation_data = {
            'auction_id': self.auction_id,
            'winner': winner_bid['bidder'],
            'winning_price': winner_bid['price'],
            'total_bids': len(self.bids),
            'reserve_price': self.reserve_price
        }
        
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(json.dumps(attestation_data, sort_keys=True).encode())
        attestation_hash = digest.finalize()
        
        return {
            'winner': winner_bid['bidder'],
            'winning_price': winner_bid['price'],
            'status': 'matched',
            'attestation': base64.b64encode(attestation_hash).decode('utf-8'),
            'attestation_data': attestation_data,
            'total_bids': len(self.bids)
        }


def main():
    """Main TEE task entry point"""
    try:
        # Read input parameters
        input_file = os.path.join(IEXEC_IN, "input.json")
        if not os.path.exists(input_file):
            print("Error: input.json not found", file=sys.stderr)
            sys.exit(1)
        
        with open(input_file, 'r') as f:
            params = json.load(f)
        
        auction_id = params.get('auction_id')
        reserve_price = float(params.get('reserve_price', 0))
        encrypted_bids = params.get('encrypted_bids', [])
        
        if not auction_id:
            print("Error: auction_id required", file=sys.stderr)
            sys.exit(1)
        
        # Initialize matcher
        matcher = BidMatcher(auction_id, reserve_price)
        
        # Process encrypted bids
        # In production, decryption keys would come from secure key management
        # For demo purposes, we assume bids are pre-decrypted or use a shared key
        decryption_key = params.get('decryption_key', b'default_key_32_bytes_long_for_demo')
        if isinstance(decryption_key, str):
            decryption_key = decryption_key.encode()[:32].ljust(32, b'0')
        
        for bid_data in encrypted_bids:
            bidder = bid_data['bidder']
            encrypted = base64.b64decode(bid_data['encrypted_bid'])
            matcher.add_encrypted_bid(bidder, encrypted, decryption_key)
        
        # Perform matching
        result = matcher.match_bids()
        
        # Write output
        output_file = os.path.join(IEXEC_OUT, "output.json")
        os.makedirs(IEXEC_OUT, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)
        
        # Write completion marker
        completion_file = os.path.join(IEXEC_OUT, "computed.json")
        with open(completion_file, 'w') as f:
            json.dump({
                'deterministic-output-path': 'output.json'
            }, f)
        
        print(f"Matching complete: {result['status']}")
        if result.get('winner'):
            print(f"Winner: {result['winner']}, Price: {result['winning_price']}")
        
    except Exception as e:
        print(f"Error in TEE task: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
