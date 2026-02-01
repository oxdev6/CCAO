import { useState } from 'react';
import { ethers } from 'ethers';
import { PlusIcon } from './Icons';

export default function CreateAuction({ account, provider, onAuctionCreated }) {
  const [assetToken, setAssetToken] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [biddingDuration, setBiddingDuration] = useState('24');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleCreate = async () => {
    if (!account || !provider || !assetToken || !assetAmount || !reservePrice) {
      setStatus('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      // In production, call contract
      // const contract = new ethers.Contract(auctionAddress, abi, signer);
      // const tx = await contract.createAuction(
      //   assetToken,
      //   ethers.parseEther(assetAmount),
      //   ethers.parseEther(reservePrice),
      //   parseInt(biddingDuration) * 3600
      // );
      // await tx.wait();

      setStatus('✓ Auction created successfully!');
      
      // Reset form
      setAssetToken('');
      setAssetAmount('');
      setReservePrice('');
      setBiddingDuration('24');
      
      if (onAuctionCreated) {
        onAuctionCreated();
      }
    } catch (error) {
      console.error('Error creating auction:', error);
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
          <PlusIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Create New Auction</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Token Address
          </label>
          <input
            type="text"
            value={assetToken}
            onChange={(e) => setAssetToken(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
            placeholder="0x..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Amount
            </label>
            <input
              type="number"
              step="0.001"
              value={assetAmount}
              onChange={(e) => setAssetAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reserve Price (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bidding Duration (hours)
          </label>
          <input
            type="number"
            value={biddingDuration}
            onChange={(e) => setBiddingDuration(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="24"
          />
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !account}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Creating...' : 'Create Auction'}
        </button>

        {status && (
          <div className={`p-3 rounded-lg ${
            status.startsWith('✓') 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
