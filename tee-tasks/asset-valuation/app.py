#!/usr/bin/env python3
"""
iExec TEE Task: Private Asset Valuation for RWA
This task runs inside a TEE to confidentially value real-world assets.
"""

import json
import sys
import os
from typing import Dict, List
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64


class AssetValuator:
    """Confidential asset valuation engine"""
    
    def __init__(self):
        self.valuation_models = {}
    
    def load_valuation_model(self, asset_type: str, model_data: Dict):
        """Load a valuation model (confidentially stored in TEE)"""
        self.valuation_models[asset_type] = model_data
    
    def value_asset(
        self,
        asset_type: str,
        asset_data: Dict,
        market_data: Dict = None
    ) -> Dict:
        """
        Value an asset using confidential models
        Returns valuation result with attestation
        """
        if asset_type not in self.valuation_models:
            # Default valuation model
            return self._default_valuation(asset_data, market_data)
        
        model = self.valuation_models[asset_type]
        
        # Apply confidential valuation logic
        # In production, this would use sophisticated financial models
        base_value = float(asset_data.get('base_value', 0))
        
        # Apply model factors
        factors = model.get('factors', {})
        adjusted_value = base_value
        
        for factor_name, factor_value in factors.items():
            if factor_name in asset_data:
                adjusted_value *= (1 + float(factor_value) * float(asset_data[factor_name]))
        
        # Apply market data adjustments
        if market_data:
            market_multiplier = float(market_data.get('multiplier', 1.0))
            adjusted_value *= market_multiplier
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(asset_data, model)
        
        # Generate attestation
        attestation_data = {
            'asset_type': asset_type,
            'valuation': adjusted_value,
            'risk_score': risk_score,
            'base_value': base_value,
            'model_version': model.get('version', '1.0')
        }
        
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(json.dumps(attestation_data, sort_keys=True).encode())
        attestation_hash = digest.finalize()
        
        return {
            'valuation': adjusted_value,
            'risk_score': risk_score,
            'attestation': base64.b64encode(attestation_hash).decode('utf-8'),
            'attestation_data': attestation_data,
            'currency': asset_data.get('currency', 'USD')
        }
    
    def _default_valuation(self, asset_data: Dict, market_data: Dict) -> Dict:
        """Default valuation when no model is loaded"""
        base_value = float(asset_data.get('base_value', 0))
        
        # Simple risk calculation
        risk_score = self._calculate_risk_score(asset_data, {})
        
        attestation_data = {
            'valuation': base_value,
            'risk_score': risk_score,
            'model': 'default'
        }
        
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(json.dumps(attestation_data, sort_keys=True).encode())
        attestation_hash = digest.finalize()
        
        return {
            'valuation': base_value,
            'risk_score': risk_score,
            'attestation': base64.b64encode(attestation_hash).decode('utf-8'),
            'attestation_data': attestation_data,
            'currency': asset_data.get('currency', 'USD')
        }
    
    def _calculate_risk_score(self, asset_data: Dict, model: Dict) -> float:
        """Calculate risk score (0-100, lower is better)"""
        risk_factors = asset_data.get('risk_factors', {})
        
        # Simple risk aggregation
        total_risk = 0.0
        count = 0
        
        for factor, value in risk_factors.items():
            if isinstance(value, (int, float)):
                total_risk += float(value)
                count += 1
        
        if count == 0:
            return 50.0  # Default medium risk
        
        avg_risk = total_risk / count
        return min(100.0, max(0.0, avg_risk))


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
        
        asset_type = params.get('asset_type', 'generic')
        asset_data = params.get('asset_data', {})
        market_data = params.get('market_data', {})
        model_data = params.get('model_data')
        
        # Initialize valuator
        valuator = AssetValuator()
        
        # Load model if provided
        if model_data:
            valuator.load_valuation_model(asset_type, model_data)
        
        # Perform valuation
        result = valuator.value_asset(asset_type, asset_data, market_data)
        
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
        
        print(f"Valuation complete: {result['valuation']} {result['currency']}")
        print(f"Risk score: {result['risk_score']}")
        
    except Exception as e:
        print(f"Error in TEE task: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
