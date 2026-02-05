import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function AuctionList({ account, provider, onSelectAuction }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // For now we always load mock auctions so the UI
    // works even before a wallet is connected.
    loadAuctions();
  }, [provider]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      // In production, fetch from smart contract
      // For demo, use mock data
      const mockAuctions = [
        {
          id: 1,
          assetToken: '0x1234...5678',
          assetAmount: '100',
          reservePrice: '10',
          status: 'BiddingOpen',
          endTime: Date.now() + 86400000, // 24 hours
          bidderCount: 5
        },
        {
          id: 2,
          assetToken: '0xabcd...efgh',
          assetAmount: '50',
          reservePrice: '5',
          status: 'Matched',
          winner: '0x9876...5432',
          winningPrice: '12.5',
          bidderCount: 8
        }
      ];
      setAuctions(mockAuctions);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BiddingOpen':
        return 'bg-green-100 text-green-800';
      case 'BiddingClosed':
        return 'bg-yellow-100 text-yellow-800';
      case 'Matched':
        return 'bg-blue-100 text-blue-800';
      case 'Settled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Auctions</h2>
        <button
          onClick={loadAuctions}
          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition text-sm"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading auctions...</div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No auctions available</div>
      ) : (
        <div className="space-y-4">
          {auctions.map((auction) => (
            <button
              key={auction.id}
              type="button"
              onClick={() => onSelectAuction && onSelectAuction(auction.id)}
              className="w-full text-left border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-400 transition focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">Auction #{auction.id}</h3>
                  <p className="text-sm text-gray-600">
                    Asset: {auction.assetToken.slice(0, 10)}...
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(auction.status)}`}>
                  {auction.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-medium">{auction.assetAmount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Reserve:</span>
                  <span className="ml-2 font-medium">{auction.reservePrice} ETH</span>
                </div>
                <div>
                  <span className="text-gray-600">Bidders:</span>
                  <span className="ml-2 font-medium">{auction.bidderCount}</span>
                </div>
                {auction.winner && (
                  <div>
                    <span className="text-gray-600">Winner:</span>
                    <span className="ml-2 font-medium">{auction.winner.slice(0, 10)}...</span>
                  </div>
                )}
              </div>

              {auction.winningPrice && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-semibold text-primary-600">
                    Winning Price: {auction.winningPrice} ETH
                  </span>
                </div>
              )}

              {auction.endTime && (
                <div className="mt-2 text-xs text-gray-500">
                  Ends: {new Date(auction.endTime).toLocaleString()}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
