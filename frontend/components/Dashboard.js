import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AuctionAnalytics from './AuctionAnalytics';
import SettlementTracker from './SettlementTracker';
import AttestationViewer from './AttestationViewer';
import { ChartIcon, BuildingIcon, ArrowPathIcon, KeyIcon } from './Icons';

export default function Dashboard({ account, provider }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalAuctions: 0,
    activeAuctions: 0,
    totalVolume: '0',
    settlementsPending: 0
  });

  useEffect(() => {
    if (provider) {
      loadStats();
    }
  }, [provider, account]);

  const loadStats = async () => {
    // In production, fetch from contracts
    setStats({
      totalAuctions: 12,
      activeAuctions: 5,
      totalVolume: '1,234.56',
      settlementsPending: 3
    });
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartIcon },
    { id: 'auctions', label: 'Auctions', icon: BuildingIcon },
    { id: 'settlements', label: 'Settlements', icon: ArrowPathIcon },
    { id: 'attestations', label: 'TEE Proofs', icon: KeyIcon }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <ChartIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Institutional Dashboard</h2>
            <p className="text-blue-100 text-sm mt-1">Real-time monitoring and analytics</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b bg-gray-50">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Auctions</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalAuctions}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active</div>
          <div className="text-3xl font-bold text-green-600">{stats.activeAuctions}</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Total Volume</div>
          <div className="text-3xl font-bold text-purple-600">{stats.totalVolume} ETH</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Pending Settlements</div>
          <div className="text-3xl font-bold text-orange-600">{stats.settlementsPending}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex overflow-x-auto bg-white">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium">Auction #{i} Matched</div>
                        <div className="text-gray-500">2 minutes ago</div>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Completed</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">Portfolio Value</h3>
                <div className="text-3xl font-bold text-primary-600 mb-2">$2,456,789</div>
                <div className="text-sm text-gray-600">
                  <span className="text-green-600">+12.5%</span> from last month
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auctions' && <AuctionAnalytics account={account} provider={provider} />}
        {activeTab === 'settlements' && <SettlementTracker account={account} provider={provider} />}
        {activeTab === 'attestations' && <AttestationViewer account={account} provider={provider} />}
      </div>
    </div>
  );
}
