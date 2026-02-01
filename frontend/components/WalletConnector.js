import { useState } from 'react';
import { ethers } from 'ethers';
import { MetaMaskIcon, CoinbaseIcon, WalletIcon, LinkIcon } from './WalletIcons';
import WalletInstaller from './WalletInstaller';

const WALLETS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: MetaMaskIcon,
    connector: async () => {
      if (window.ethereum?.isMetaMask) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      // Try to detect any injected provider as MetaMask
      if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('MetaMask not detected');
    },
    installUrl: 'https://metamask.io/download/',
    popular: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: CoinbaseIcon,
    connector: async () => {
      if (window.ethereum?.isCoinbaseWallet) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      // Try Coinbase Wallet extension
      if (window.coinbaseWalletExtension) {
        return new ethers.BrowserProvider(window.coinbaseWalletExtension);
      }
      throw new Error('Coinbase Wallet not detected');
    },
    installUrl: 'https://www.coinbase.com/wallet',
    popular: true
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: WalletIcon,
    connector: async () => {
      if (window.ethereum?.isTrust) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('Trust Wallet not detected');
    },
    installUrl: 'https://trustwallet.com/'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: LinkIcon,
    connector: async () => {
      // For WalletConnect, we'd need the WalletConnect library
      // This is a simplified version that uses injected provider
      if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('WalletConnect not available');
    },
    installUrl: 'https://walletconnect.com/'
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: WalletIcon,
    connector: async () => {
      if (window.ethereum?.isBraveWallet) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('Brave Wallet not detected');
    },
    installUrl: 'https://brave.com/wallet/'
  },
  {
    id: 'injected',
    name: 'Other Wallet',
    icon: WalletIcon,
    connector: async () => {
      if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      throw new Error('No wallet detected');
    },
    installUrl: null
  }
];

export default function WalletConnector({ onConnect, onClose }) {
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [showInstaller, setShowInstaller] = useState(false);

  const connectWallet = async (wallet) => {
    setConnecting(wallet.id);
    setError(null);

    // Check if wallet is available before trying to connect
    if (wallet.id === 'metamask' && !window.ethereum?.isMetaMask && !window.ethereum) {
      setError({
        message: `${wallet.name} is not installed`,
        wallet: wallet,
        needsInstall: true
      });
      setConnecting(null);
      return;
    }

    if (wallet.id === 'coinbase' && !window.ethereum?.isCoinbaseWallet && !window.coinbaseWalletExtension && !window.ethereum) {
      setError({
        message: `${wallet.name} is not installed`,
        wallet: wallet,
        needsInstall: true
      });
      setConnecting(null);
      return;
    }

    if (wallet.id === 'brave' && !window.ethereum?.isBraveWallet && !window.ethereum) {
      setError({
        message: `${wallet.name} is not installed`,
        wallet: wallet,
        needsInstall: true
      });
      setConnecting(null);
      return;
    }

    try {
      const provider = await wallet.connector();
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      if (onConnect) {
        onConnect({
          address,
          provider,
          walletName: wallet.name,
          chainId: network.chainId
        });
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Connection error:', err);
      
      // Check if it's a "not detected" error
      if (err.message.includes('not detected') || err.message.includes('not available') || err.message.includes('No wallet detected')) {
        setError({
          message: `${wallet.name} is not installed or not detected`,
          wallet: wallet,
          needsInstall: true
        });
      } else if (err.code === 4001) {
        // User rejected the request
        setError({
          message: 'Connection request was rejected',
          wallet: null,
          needsInstall: false
        });
      } else {
        setError({
          message: err.message || 'Failed to connect wallet',
          wallet: null,
          needsInstall: false
        });
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleInstall = (wallet) => {
    if (wallet.installUrl) {
      window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
      setError(null);
    }
  };

  // Detect available wallets
  const hasInjectedProvider = typeof window !== 'undefined' && window.ethereum;
  const isMetaMask = hasInjectedProvider && window.ethereum.isMetaMask;
  const isCoinbase = hasInjectedProvider && (window.ethereum.isCoinbaseWallet || window.coinbaseWalletExtension);
  const isTrust = hasInjectedProvider && window.ethereum.isTrust;
  const isBrave = hasInjectedProvider && window.ethereum.isBraveWallet;
  const hasOtherWallet = hasInjectedProvider && !isMetaMask && !isCoinbase && !isTrust && !isBrave;

  const availableWallets = WALLETS.filter(wallet => {
    if (wallet.id === 'metamask') {
      return true; // Always show MetaMask
    }
    if (wallet.id === 'coinbase') {
      return true; // Always show Coinbase
    }
    if (wallet.id === 'trust') {
      return isTrust || true; // Show if detected or always show
    }
    if (wallet.id === 'brave') {
      return isBrave || true; // Show if detected or always show
    }
    if (wallet.id === 'walletconnect') {
      return true; // Always show WalletConnect
    }
    if (wallet.id === 'injected') {
      return hasOtherWallet; // Only show if there's an unknown injected wallet
    }
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-4 rounded-xl border-2 ${
            error.needsInstall 
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {error.needsInstall ? (
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  error.needsInstall ? 'text-blue-900' : 'text-red-700'
                }`}>
                  {error.message}
                </p>
                {error.needsInstall && error.wallet && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleInstall(error.wallet)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold"
                    >
                      Install {error.wallet.name}
                    </button>
                    <button
                      onClick={() => setShowInstaller(true)}
                      className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-all text-sm font-medium"
                    >
                      View All Wallets
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {availableWallets.map((wallet) => {
            const IconComponent = wallet.icon;
            return (
              <button
                key={wallet.id}
                onClick={() => connectWallet(wallet)}
                disabled={connecting === wallet.id}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex-shrink-0">
                  <IconComponent className="w-8 h-8" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {wallet.name}
                    {wallet.popular && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    {wallet.id === 'metamask' && !window.ethereum?.isMetaMask && !window.ethereum && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        Not Installed
                      </span>
                    )}
                    {wallet.id === 'coinbase' && !window.ethereum?.isCoinbaseWallet && !window.coinbaseWalletExtension && !window.ethereum && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                        Not Installed
                      </span>
                    )}
                  </div>
                  {wallet.id === 'metamask' && (
                    <div className="text-xs text-gray-500">
                      {window.ethereum?.isMetaMask || window.ethereum ? 'Most popular wallet' : 'Click to install'}
                    </div>
                  )}
                </div>
                {connecting === wallet.id && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                {connecting !== wallet.id && (
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          <button
            onClick={() => setShowInstaller(true)}
            className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all font-medium text-sm"
          >
            Don't have a wallet? Install one →
          </button>
          <p className="text-xs text-gray-500 text-center">
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy.
            <br />
            New to crypto?{' '}
            <a href="https://ethereum.org/en/wallets/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Learn about wallets
            </a>
          </p>
        </div>
      </div>

      {/* Wallet Installer Modal */}
      {showInstaller && (
        <WalletInstaller onClose={() => setShowInstaller(false)} />
      )}
    </div>
  );
}
