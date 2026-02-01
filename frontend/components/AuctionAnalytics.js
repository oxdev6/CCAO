import { useState, useEffect } from 'react';
import { ChartIcon } from './Icons';

export default function AuctionAnalytics({ account, provider }) {
  const [analytics, setAnalytics] = useState({
    successRate: 87.5,
    avgBidCount: 8.3,
    avgSettlementTime: '2.4 hours',
    topAssets: [
      { name: 'Tokenized Bond #1', volume: '450 ETH', auctions: 12 },
      { name: 'Property Share #5', volume: '320 ETH', auctions: 8 },
      { name: 'Private Equity #3', volume: '280 ETH', auctions: 6 }
    ]
  });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Success Rate</div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{analytics.successRate}%</div>
          <div className="text-xs text-gray-500">Auctions completed successfully</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Avg Bids per Auction</div>
          <div className="text-4xl font-bold text-green-600 mb-2">{analytics.avgBidCount}</div>
          <div className="text-xs text-gray-500">Average participation</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Avg Settlement Time</div>
          <div className="text-4xl font-bold text-purple-600 mb-2">{analytics.avgSettlementTime}</div>
          <div className="text-xs text-gray-500">Cross-chain processing</div>
        </div>
      </div>

      {/* Top Assets */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-5 text-lg">Top Performing Assets</h3>
        <div className="space-y-3">
          {analytics.topAssets.map((asset, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-4">
              <div>
                <div className="font-medium">{asset.name}</div>
                <div className="text-sm text-gray-500">{asset.auctions} auctions</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary-600">{asset.volume}</div>
                <div className="text-xs text-gray-500">Total volume</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Volume Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center">
            <ChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <div className="font-medium">Volume chart visualization</div>
            <div className="text-xs mt-2 text-gray-500">(Integration with charting library)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
