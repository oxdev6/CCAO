# 🌐 Confidential Cross-Chain Asset Orchestrator (CCAO)

A privacy-preserving cross-chain asset processing and settlement engine that enables confidential sealed-bid mechanisms and private order matching for high-value assets across multiple Layer-2 networks using **iExec's Confidential Compute stack and TEEs**.

---

## 👉 For Judges

**What we built:** A full-stack demo for confidential sealed-bid auctions: React/Next.js frontend, Solidity contracts (Foundry), and three iExec TEE tasks (Python + Docker) for bid matching, asset valuation, and compliance. Bids are encrypted; matching runs in TEE; settlement is designed for cross-chain (Arbitrum, Sepolia).

**Quick run (local):**
```bash
git clone https://github.com/oxdev6/CCAO.git && cd CCAO
npm install && cd frontend && npm install && npm run dev
```
Open **http://localhost:3000**. Connect a wallet (MetaMask recommended). Click an auction card to prefill the bid form, enter amount, and submit (demo mode; contract deployment is documented below).

**Where to look:**
| What | Where |
|------|--------|
| **iExec application** | [`tee-tasks/bid-matching/`](tee-tasks/bid-matching/) — manifest: [`iexec.json`](tee-tasks/bid-matching/iexec.json) |
| **Smart contracts** | [`contracts/`](contracts/) — `SealedBidAuction.sol`, `CrossChainSettlement.sol`, `ComplianceVerifier.sol` |
| **Frontend** | [`frontend/`](frontend/) — Next.js, `pages/index.js`, `components/` |
| **Deploy scripts** | [`scripts/`](scripts/) — `iexec-deploy.js`, `deploy-sepolia.js`, `deploy-arbitrum.js` |
| **Hackathon feedback** | [`feedback.md`](feedback.md) |

**Tech stack:** Next.js 14, Ethers.js, Solidity (OpenZeppelin), Foundry, Python 3.11, Docker, iExec SDK.  
**License:** MIT.

---

### Where is the iExec application?

The **iExec application** is the TEE task that runs confidential bid matching. It lives here:

- **App root:** [`tee-tasks/bid-matching/`](tee-tasks/bid-matching/)
- **Manifest:** [`tee-tasks/bid-matching/iexec.json`](tee-tasks/bid-matching/iexec.json) — iExec app descriptor (owner, name, type, Docker image, TEE framework)
- **Entrypoint:** [`tee-tasks/bid-matching/app.py`](tee-tasks/bid-matching/app.py) — runs in the container; reads `IEXEC_IN`, writes `IEXEC_OUT`
- **Image:** [`tee-tasks/bid-matching/Dockerfile`](tee-tasks/bid-matching/Dockerfile) — build and push to Docker Hub, then set `app.multiaddr` and `app.checksum` in `iexec.json` before deploying with `scripts/iexec-deploy.js` or the iExec SDK.

Two other iExec TEE tasks in this repo: `tee-tasks/asset-valuation/` and `tee-tasks/compliance-check/`; each has its own `iexec.json` for deployment.

## 💡 Vision

CCAO solves two critical unsolved problems in current DeFi & RWA systems:

1. **Confidential decision logic** for orders or evaluations (e.g., sealed bids or private pricing) without exposing sensitive inputs on public chains.
2. **Secure cross-chain settlement** where execution and validation happen inside a trusted computing environment, and only verifiable outcomes are published on-chain.

## ⚙️ Core Features

### 🔐 1. Confidential Sealed-Bid Matching
- Encrypted bid submission
- TEE-based bid aggregation, sorting, and winner determination
- On-chain outcome publication with attestation proofs
- Prevents front-running and strategy leakage

### ⚖️ 2. Private Asset Valuation for RWA
- Confidential valuation and risk analysis inside TEE
- Sensitive data (valuation models, financial details) stays off-chain
- Only proofs of correct execution and summary results posted on-chain
- Supports regulated use cases

### ♻️ 3. Cross-Chain Settlement Bridge
- Confidential compute determines settlement amounts
- Cryptographically attested settlement results broadcast to multiple chains
- Supports Arbitrum, Sepolia, and other EVM chains

### 🔄 4. Verifiable Compliance Layer
- Private compliance checks on encrypted identity proofs
- Zero-knowledge compliance proofs without raw data exposure
- Enables regulated, privacy-first asset markets

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend UI   │
│  (Bid Submit)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Smart Contract │◄─────┤  iExec TEE Task  │
│   (Arbitrum)    │      │ (Confidential)   │
└────────┬────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Cross-Chain     │
│ Settlement      │
└─────────────────┘
```

## 📁 Project Structure

```
CCAO/
├── contracts/          # Solidity smart contracts
├── tee-tasks/          # iExec TEE confidential compute tasks
├── frontend/           # React/Next.js UI
├── bridge/             # Cross-chain messaging logic
├── scripts/            # Deployment and utility scripts
└── docs/               # Documentation

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Foundry (for contract compilation)
- iExec SDK and account
- MetaMask or compatible wallet
- Python 3.11+ (for TEE tasks)

### Installation

```bash
# Clone and setup
git clone <repository-url>
cd CCAO

# Install root dependencies
npm install

# Install OpenZeppelin contracts
cd contracts
forge install OpenZeppelin/openzeppelin-contracts@v4.9.6
forge install foundry-rs/forge-std

# Compile contracts
forge build --via-ir

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

1. **Environment Variables** (`.env`):
   - `PRIVATE_KEY`: Your wallet private key
   - `ARBITRUM_RPC_URL`: Arbitrum RPC endpoint
   - `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
   - `IEXEC_APP_ADDRESS`: iExec app addresses (after deployment)
   - `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: WalletConnect project ID

2. **Deploy Contracts**:
   ```bash
   # Deploy to Arbitrum
   npm run deploy:arbitrum
   
   # Deploy to Sepolia
   npm run deploy:sepolia
   ```

### Deployed Contracts

#### Arbitrum Sepolia (chainId: `421614`)

Deployed: `2026-02-07`  
Deployer: `0x2b8Cc3b41B5a52C46A3550d15F4DE997E5e3DB9D`

| Contract | Address |
| --- | --- |
| `SealedBidAuction` | `0xEc428110548F129A8c62E5BF1Cb4Bd1638a15328` |
| `CrossChainSettlement` | `0x5b461b398B44E7c05180b3F20CB1B7f601d29A63` |
| `ComplianceVerifier` | `0xD886398499dd7bA5A638d01b1c794E6820a5943d` |

Deployment record: [`deployments/arbitrum-sepolia.json`](deployments/arbitrum-sepolia.json)

**Quick interactions (Foundry `cast`):**
```bash
RPC_URL="https://arb-sepolia.g.alchemy.com/v2/<ALCHEMY_API_KEY>"

cast call 0xEc428110548F129A8c62E5BF1Cb4Bd1638a15328 "auctionCounter()(uint256)" --rpc-url "$RPC_URL"
cast call 0x5b461b398B44E7c05180b3F20CB1B7f601d29A63 "owner()(address)" --rpc-url "$RPC_URL"
cast call 0xD886398499dd7bA5A638d01b1c794E6820a5943d "requireCompliance()(bool)" --rpc-url "$RPC_URL"
```

**Deploying with Foundry (recommended):**
```bash
export PRIVATE_KEY="<YOUR_PRIVATE_KEY>"
export RPC_URL="https://arb-sepolia.g.alchemy.com/v2/<ALCHEMY_API_KEY>"

cd contracts
forge build --via-ir

forge create SealedBidAuction.sol:SealedBidAuction --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --via-ir
forge create CrossChainSettlement.sol:CrossChainSettlement --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --via-ir
forge create ComplianceVerifier.sol:ComplianceVerifier --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast --via-ir
```

**Security note:** never commit `.env`, private keys, or RPC provider API keys. The deployment JSON uses a placeholder RPC URL.

3. **Deploy TEE Tasks**:
   ```bash
   # Build Docker images for each TEE task
   cd tee-tasks/bid-matching
   docker build -t ccao-bid-matching .
   
   # Deploy to iExec (requires iExec SDK setup)
   node ../../scripts/iexec-deploy.js
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Usage

1. **Create an Auction**:
   - Connect wallet as owner
   - Call `createAuction()` on `SealedBidAuction` contract
   - Set asset token, amount, reserve price, and duration

2. **Submit Encrypted Bid**:
   - Connect wallet
   - Encrypt bid with auction's public key
   - Submit via frontend or directly to contract
   - Bid is stored encrypted on-chain

3. **Match Bids**:
   - Owner closes bidding period
   - Trigger iExec TEE task with encrypted bids
   - TEE matches bids confidentially
   - Results published on-chain with attestation

4. **Settle Cross-Chain**:
   - Settlement computed in TEE
   - Cross-chain message sent
   - Settlement executed on target chain

## 🔐 Security

- All sensitive computations run inside iExec TEEs
- Encrypted bid submission with public key cryptography
- Verifiable attestation proofs for all TEE executions
- Zero-knowledge compliance proofs

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md) - Detailed system architecture
- Smart Contract documentation in `contracts/`
- TEE Task documentation in `tee-tasks/`

## 🔧 Development

### Testing

```bash
# Test contracts
cd contracts
forge test

# Test TEE tasks locally
cd tee-tasks/bid-matching
python app.py  # With test input.json
```

### Project Structure Details

- **contracts/**: Solidity smart contracts for auctions, settlement, and compliance
- **tee-tasks/**: Python TEE tasks for confidential compute
  - `bid-matching/`: Sealed-bid matching logic
  - `asset-valuation/`: RWA valuation engine
  - `compliance-check/`: KYC/AML verification
- **frontend/**: Next.js React application
- **bridge/**: Cross-chain messaging utilities
- **scripts/**: Deployment and utility scripts

## 🎯 Use Cases

### Institutional Tokenized Bonds
- Private pricing discovery
- Confidential order matching
- Cross-chain settlement

### Real Estate Tokenization
- Confidential property valuation
- Private auction mechanisms
- Secure cross-chain transfers

### Private Equity
- Sealed-bid fundraising
- Confidential investor matching
- Privacy-preserving compliance

## 🤝 Contributing

This is a research and development project. Contributions welcome!

## 📄 License

MIT

## 🙏 Acknowledgments

- iExec for TEE infrastructure
- OpenZeppelin for secure contract libraries
- The DeFi and RWA communities
