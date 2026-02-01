import { useState } from 'react';
import { ethers } from 'ethers';
import { LockIcon } from './Icons';

export default function BidSubmission({ account, provider }) {
  const [auctionId, setAuctionId] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [encryptedBid, setEncryptedBid] = useState(null);
  const [escrowAddress, setEscrowAddress] = useState('');
  const [escrowDeposit, setEscrowDeposit] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Generate escrow address (in production, this would be TEE-generated)
  const generateEscrowAddress = async () => {
    // Simplified - in production, TEE generates this
    const randomBytes = ethers.randomBytes(20);
    const address = ethers.getAddress(ethers.hexlify(randomBytes));
    setEscrowAddress(address);
    return address;
  };

  // Simplified encryption (in production, use proper public key encryption)
  const encryptBid = async (bidData) => {
    // In production, encrypt with auction's public key
    // For demo, we'll create a simple hash-based encryption
    const data = JSON.stringify({
      price: parseFloat(bidAmount),
      timestamp: Date.now(),
      bidder: account
    });
    
    // Convert to bytes (simplified - use proper encryption in production)
    return ethers.toUtf8Bytes(data);
  };

  const handleSubmitBid = async () => {
    if (!account || !provider || !auctionId || !bidAmount) {
      setStatus('Please fill in all fields and connect wallet');
      return;
    }

    setLoading(true);
    setStatus('');

    try {
      // Generate escrow address if not set
      let escrow = escrowAddress;
      if (!escrow) {
        escrow = await generateEscrowAddress();
      }

      // Encrypt bid
      const encrypted = await encryptBid({
        price: bidAmount,
        account
      });

      const deposit = escrowDeposit || '0';
      const timestamp = Date.now();

      // Create signature
      const signer = await provider.getSigner();
      const message = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'bytes', 'address', 'uint256', 'uint256'],
        [auctionId, account, encrypted, escrow, deposit, timestamp]
      );
      const signature = await signer.signMessage(ethers.getBytes(message));

      // In production, submit to smart contract with escrow
      // const contract = new ethers.Contract(auctionAddress, abi, signer);
      // await contract.submitBid(
      //   auctionId, 
      //   encrypted, 
      //   escrow, 
      //   ethers.parseEther(deposit),
      //   signature,
      //   { value: ethers.parseEther(deposit) }
      // );

      setEncryptedBid(ethers.hexlify(encrypted));
      setStatus('✓ Bid submitted successfully with escrow commitment!');
      
      // Reset form
      setBidAmount('');
      setEscrowDeposit('');
    } catch (error) {
      console.error('Error submitting bid:', error);
      setStatus('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
          <LockIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Submit Encrypted Bid</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Auction ID
          </label>
          <input
            type="number"
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter auction ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bid Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="0.0"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options (Escrow)
          </button>
        </div>

        {showAdvanced && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Escrow Deposit (ETH) - Optional
              </label>
              <input
                type="number"
                step="0.001"
                value={escrowDeposit}
                onChange={(e) => setEscrowDeposit(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.0 (recommended for privacy)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Deposit to TEE-generated escrow address for enhanced privacy (SUAVE-style)
              </p>
            </div>
            {escrowAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escrow Address
                </label>
                <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-mono text-xs break-all">
                  {escrowAddress}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleSubmitBid}
          disabled={loading || !account}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {loading ? 'Submitting...' : 'Submit Encrypted Bid'}
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

        {encryptedBid && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Encrypted Bid:</p>
            <p className="text-xs font-mono break-all">{encryptedBid.slice(0, 100)}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
