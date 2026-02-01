/**
 * Cross-Chain Bridge Configuration
 */

module.exports = {
    chains: [
        {
            id: 42161, // Arbitrum One
            name: 'Arbitrum',
            rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
            settlementAddress: process.env.ARBITRUM_SETTLEMENT_ADDRESS || '',
            explorer: 'https://arbiscan.io'
        },
        {
            id: 11155111, // Sepolia
            name: 'Sepolia',
            rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
            settlementAddress: process.env.SEPOLIA_SETTLEMENT_ADDRESS || '',
            explorer: 'https://sepolia.etherscan.io'
        }
    ],
    bridge: {
        // In production, configure actual bridge addresses
        // e.g., LayerZero, Wormhole, or custom bridge
        type: 'custom', // 'layerzero', 'wormhole', 'custom'
        address: process.env.BRIDGE_ADDRESS || ''
    }
};
