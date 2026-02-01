import { useState } from 'react';
import { ethers } from 'ethers';
import { ShieldIcon, CheckCircleIcon, XCircleIcon } from './Icons';

export default function ComplianceCheck({ account, provider }) {
  const [compliant, setCompliant] = useState(null);
  const [checking, setChecking] = useState(false);
  const [proof, setProof] = useState(null);

  const checkCompliance = async () => {
    if (!account || !provider) {
      alert('Please connect your wallet first');
      return;
    }

    setChecking(true);
    try {
      // In production, this would:
      // 1. Encrypt identity data
      // 2. Submit to iExec TEE task
      // 3. Receive compliance proof
      // 4. Verify on-chain

      // Mock compliance check
      const mockCompliant = Math.random() > 0.2; // 80% compliant
      
      setCompliant(mockCompliant);
      setProof({
        complianceHash: ethers.hexlify(ethers.randomBytes(16)),
        attestation: ethers.hexlify(ethers.randomBytes(32)),
        timestamp: Date.now()
      });

      // In production, submit proof to ComplianceVerifier contract
      // const contract = new ethers.Contract(complianceAddress, abi, signer);
      // await contract.submitComplianceProof(...);
    } catch (error) {
      console.error('Error checking compliance:', error);
      alert('Error checking compliance: ' + error.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
          <ShieldIcon className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Compliance Status</h2>
      </div>
      
      {!account ? (
        <p className="text-sm text-gray-500">Connect wallet to check compliance</p>
      ) : compliant === null ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Verify your compliance status to participate in auctions
          </p>
          <button
            onClick={checkCompliance}
            disabled={checking}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check Compliance'}
          </button>
        </div>
      ) : (
        <div>
          <div className={`p-5 rounded-xl mb-4 border-2 ${
            compliant 
              ? 'bg-green-50 border-green-300' 
              : 'bg-red-50 border-red-300'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {compliant ? (
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              ) : (
                <XCircleIcon className="w-6 h-6 text-red-600" />
              )}
              <span className={`font-bold text-lg ${
                compliant ? 'text-green-700' : 'text-red-700'
              }`}>
                {compliant ? 'Compliant' : 'Non-Compliant'}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {compliant 
                ? 'You are eligible to participate in auctions'
                : 'Please complete KYC/AML verification'}
            </p>
          </div>

          {proof && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Compliance Proof:</p>
              <div className="space-y-1 text-xs font-mono">
                <p>Hash: {proof.complianceHash.slice(0, 20)}...</p>
                <p>Attestation: {proof.attestation.slice(0, 20)}...</p>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setCompliant(null);
              setProof(null);
            }}
            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
          >
            Re-check
          </button>
        </div>
      )}
    </div>
  );
}
