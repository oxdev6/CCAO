import { MetaMaskIcon, CoinbaseIcon, WalletIcon, LinkIcon } from './WalletIcons';

const WALLET_INSTALLS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: MetaMaskIcon,
    description: 'The most popular Ethereum wallet',
    installUrl: 'https://metamask.io/download/',
    mobileUrl: 'https://metamask.io/download/',
    category: 'Browser Extension'
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: CoinbaseIcon,
    description: 'Secure wallet by Coinbase',
    installUrl: 'https://www.coinbase.com/wallet',
    mobileUrl: 'https://www.coinbase.com/wallet',
    category: 'Browser Extension & Mobile'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: WalletIcon,
    description: 'Mobile-first crypto wallet',
    installUrl: 'https://trustwallet.com/',
    mobileUrl: 'https://trustwallet.com/download',
    category: 'Mobile App'
  },
  {
    id: 'brave',
    name: 'Brave Wallet',
    icon: WalletIcon,
    description: 'Built into Brave browser',
    installUrl: 'https://brave.com/wallet/',
    mobileUrl: 'https://brave.com/wallet/',
    category: 'Browser Built-in'
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: LinkIcon,
    description: 'Connect any wallet via QR code',
    installUrl: 'https://walletconnect.com/',
    mobileUrl: 'https://walletconnect.com/',
    category: 'Protocol'
  }
];

export default function WalletInstaller({ onClose }) {
  const handleInstall = (wallet) => {
    // Open install URL in new tab
    window.open(wallet.installUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMobileInstall = (wallet) => {
    // Open mobile install URL
    window.open(wallet.mobileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Install Wallets</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a wallet to get started</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WALLET_INSTALLS.map((wallet) => {
              const IconComponent = wallet.icon;
              return (
                <div
                  key={wallet.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-12 h-12" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{wallet.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{wallet.description}</p>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {wallet.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleInstall(wallet)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                    >
                      Install for Browser
                    </button>
                    {wallet.mobileUrl && (
                      <button
                        onClick={() => handleMobileInstall(wallet)}
                        className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm"
                      >
                        Get Mobile App
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-2">Why do I need a wallet?</h4>
            <p className="text-sm text-blue-800">
              A crypto wallet is required to interact with blockchain applications. It stores your private keys
              and allows you to sign transactions securely. Choose any wallet above to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
