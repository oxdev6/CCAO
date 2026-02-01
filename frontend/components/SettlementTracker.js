import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function SettlementTracker({ account, provider }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider) {
      loadSettlements();
    }
  }, [provider]);

  const loadSettlements = async () => {
    setLoading(true);
    // Mock data - in production, fetch from contract
    setTimeout(() => {
      setSettlements([
        {
          id: '0x1234...5678',
          sourceChain: 'Arbitrum',
          targetChain: 'Sepolia',
          amount: '125.5',
          token: 'ETH',
          status: 'Verified',
          timestamp: Date.now() - 3600000,
          teeAttestation: '0xabcd...efgh'
        },
        {
          id: '0x2345...6789',
          sourceChain: 'Sepolia',
          targetChain: 'Arbitrum',
          amount: '89.2',
          token: 'USDC',
          status: 'Executed',
          timestamp: Date.now() - 7200000,
          teeAttestation: '0xbcde...fghi'
        },
        {
          id: '0x3456...7890',
          sourceChain: 'Arbitrum',
          targetChain: 'Sepolia',
          amount: '200.0',
          token: 'ETH',
          status: 'Pending',
          timestamp: Date.now() - 1800000,
          teeAttestation: '0xcdef...ghij'
        }
      ]);
      setLoading(false);
    }, 500);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Verified':
        return 'bg-blue-100 text-blue-800';
      case 'Executed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-gray-900 text-lg">Cross-Chain Settlements</h3>
        <button
          onClick={loadSettlements}
          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading settlements...</div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No settlements found</div>
      ) : (
        <div className="space-y-3">
          {settlements.map((settlement, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-mono text-sm text-gray-600 mb-1">
                    {settlement.id.slice(0, 20)}...
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{settlement.sourceChain}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">{settlement.targetChain}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(settlement.status)}`}>
                  {settlement.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-semibold">
                    {settlement.amount} {settlement.token}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Time:</span>
                  <span className="ml-2">{formatTime(settlement.timestamp)}</span>
                </div>
              </div>

              {settlement.teeAttestation && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">TEE Attestation:</div>
                  <div className="font-mono text-xs break-all text-primary-600">
                    {settlement.teeAttestation}
                  </div>
                </div>
              )}

              {/* Progress indicator */}
              <div className="mt-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className={`h-2 w-2 rounded-full ${
                    settlement.status === 'Executed' ? 'bg-green-500' :
                    settlement.status === 'Verified' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span>
                    {settlement.status === 'Pending' && 'Awaiting verification...'}
                    {settlement.status === 'Verified' && 'Ready for execution...'}
                    {settlement.status === 'Executed' && 'Settlement complete'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
