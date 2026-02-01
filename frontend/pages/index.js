import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Head from 'next/head';
import BidSubmission from '../components/BidSubmission';
import AuctionList from '../components/AuctionList';
import ComplianceCheck from '../components/ComplianceCheck';
import Dashboard from '../components/Dashboard';
import CreateAuction from '../components/CreateAuction';
import { GlobeIcon, LockIcon, ChartIcon, CheckIcon } from '../components/Icons';
import WalletConnector from '../components/WalletConnector';
import WalletInstaller from '../components/WalletInstaller';

export default function Home() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateAuction, setShowCreateAuction] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInstaller, setShowInstaller] = useState(false);
  const [walletName, setWalletName] = useState(null);

  useEffect(() => {
    // Check if already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setProvider(provider);
          setAccount(accounts[0].address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const handleWalletConnect = (walletData) => {
    setProvider(walletData.provider);
    setAccount(walletData.address);
    setWalletName(walletData.walletName);
    setIsConnected(true);
    setShowWalletModal(false);
  };

  const connectWallet = () => {
    setShowWalletModal(true);
  };

  const disconnectWallet = () => {
    setProvider(null);
    setAccount(null);
    setIsConnected(false);
    setWalletName(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Head>
        <title>CCAO - Confidential Cross-Chain Asset Orchestrator</title>
        <meta name="description" content="Privacy-preserving cross-chain asset processing and settlement" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <GlobeIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  CCAO
                </h1>
                <p className="text-sm text-gray-600 font-medium mt-1">
                  Confidential Cross-Chain Asset Orchestrator
                </p>
              </div>
            </div>
            <div>
              {isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-gray-100 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-0.5">{walletName || 'Wallet'}</div>
                    <span className="text-sm font-mono text-gray-700">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={connectWallet}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Connect Wallet
                  </button>
                  <button
                    onClick={() => setShowInstaller(true)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium text-sm"
                    title="Install Wallets"
                  >
                    Install
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Dashboard for connected users */}
          {isConnected && (
            <div className="mb-6">
              <Dashboard account={account} provider={provider} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Compliance & Info */}
            <div className="lg:col-span-1 space-y-6">
              <ComplianceCheck account={account} provider={provider} />
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <LockIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Privacy Features</h2>
                </div>
                <ul className="space-y-3">
                  {[
                    'Encrypted bid submission',
                    'TEE-based confidential matching',
                    'Private asset valuation',
                    'Zero-knowledge compliance',
                    'Cross-chain settlement',
                    'Escrow-based commitments',
                    'Batch processing'
                  ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                      <div className="mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckIcon className="w-3 h-3 text-green-600" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <ChartIcon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">Platform Statistics</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Total Auctions', value: '1,234', color: 'text-blue-100' },
                    { label: 'Total Volume', value: '45,678 ETH', color: 'text-blue-100' },
                    { label: 'Active Bidders', value: '892', color: 'text-blue-100' },
                    { label: 'Success Rate', value: '94.2%', color: 'text-green-300' }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center pb-3 border-b border-white/10 last:border-0">
                      <span className="text-sm text-blue-100 font-medium">{stat.label}</span>
                      <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Auctions */}
            <div className="lg:col-span-2 space-y-6">
              {showCreateAuction ? (
                <CreateAuction 
                  account={account} 
                  provider={provider}
                  onAuctionCreated={() => setShowCreateAuction(false)}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold text-gray-900">Auctions</h2>
                    {isConnected && (
                      <button
                        onClick={() => setShowCreateAuction(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                      >
                        <PlusIcon className="w-4 h-4" />
                        Create Auction
                      </button>
                    )}
                  </div>
                  <AuctionList account={account} provider={provider} />
                  <BidSubmission account={account} provider={provider} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">
          Powered by <span className="font-semibold text-gray-700">iExec TEE</span> • Built for Privacy-First DeFi
        </p>
      </footer>

      {/* Wallet Connector Modal */}
      {showWalletModal && (
        <WalletConnector
          onConnect={handleWalletConnect}
          onClose={() => setShowWalletModal(false)}
        />
      )}

      {/* Wallet Installer Modal */}
      {showInstaller && (
        <WalletInstaller onClose={() => setShowInstaller(false)} />
      )}
    </div>
  );
}
