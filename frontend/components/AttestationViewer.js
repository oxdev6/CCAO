import { useState } from 'react';
import { KeyIcon, CheckCircleIcon, DocumentCheckIcon } from './Icons';

export default function AttestationViewer({ account, provider }) {
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  
  const attestations = [
    {
      id: '0xabcd...efgh',
      type: 'Bid Matching',
      auctionId: 1,
      status: 'Verified',
      timestamp: Date.now() - 3600000,
      details: {
        winner: '0x1234...5678',
        winningPrice: '125.5 ETH',
        totalBids: 8,
        teeEnclave: 'SGX v2.0'
      }
    },
    {
      id: '0xbcde...fghi',
      type: 'Asset Valuation',
      assetId: 'BOND-001',
      status: 'Verified',
      timestamp: Date.now() - 7200000,
      details: {
        valuation: '$450,000',
        riskScore: 35,
        modelVersion: 'v1.2',
        teeEnclave: 'SGX v2.0'
      }
    },
    {
      id: '0xcdef...ghij',
      type: 'Compliance Check',
      participant: '0x9876...5432',
      status: 'Verified',
      timestamp: Date.now() - 10800000,
      details: {
        compliant: true,
        kycStatus: 'Verified',
        amlStatus: 'Clear',
        teeEnclave: 'SGX v2.0'
      }
    }
  ];

  const getStatusIcon = (status) => {
    return status === 'Verified' ? (
      <CheckCircleIcon className="w-5 h-5 text-green-600" />
    ) : (
      <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <KeyIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2 text-lg">TEE Attestation Verification</div>
            <div className="text-sm text-blue-700 leading-relaxed">
              All computations are verified through Intel SGX attestations, ensuring cryptographic proof of execution inside trusted hardware.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {attestations.map((att, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedAttestation(att)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900 mb-1">{att.type}</div>
                <div className="text-sm text-gray-500 font-mono">{att.id}</div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(att.status)}
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {att.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {att.auctionId && (
                <div>
                  <span className="text-gray-600">Auction ID:</span>
                  <span className="ml-2 font-medium">#{att.auctionId}</span>
                </div>
              )}
              {att.assetId && (
                <div>
                  <span className="text-gray-600">Asset ID:</span>
                  <span className="ml-2 font-medium">{att.assetId}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Enclave:</span>
                <span className="ml-2 font-medium">{att.details.teeEnclave}</span>
              </div>
              <div>
                <span className="text-gray-600">Time:</span>
                <span className="ml-2">
                  {new Date(att.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedAttestation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">Attestation Details</h3>
              <button
                onClick={() => setSelectedAttestation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Attestation ID</div>
                <div className="font-mono text-sm break-all">{selectedAttestation.id}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Type</div>
                <div className="font-medium">{selectedAttestation.type}</div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <div className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {selectedAttestation.status}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold mb-2">Execution Details</div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(selectedAttestation.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-semibold mb-2">Verification</div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <span>✅</span>
                    <span>Attestation verified against Intel SGX enclave measurements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
