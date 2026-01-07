# 🎯 Arbitrum Founder's Dilemma Workshop

> [!NOTE]
> Learn strategic decision-making and smart contract development on Arbitrum using Stylus (Rust). Build and deploy a multiplayer game theory simulation exploring cooperation vs. competition in business, with ETH staking and iterative strategy building. Perfect for founders learning about incentive design, behavioral economics, and strategic partnerships. All in a preconfigured Codespace!

<div align="center">
  <img src="screenshot.png" alt="Prisoner's Dilemma Game Screenshot" width="50%">
</div>

| Learning Outcomes |
|---|
| Understand game theory, strategic cooperation, and competitive dynamics in business |
| Learn incentive design principles applicable to partnerships, pricing, and market strategy |
| Explore behavioral economics (Kahneman's loss aversion) in founder decision-making |
| Deploy and interact with Stylus (Rust) smart contracts on Arbitrum |
| Build strategic multiplayer simulations with token staking and iterative rounds |
| Use cargo stylus, foundry (cast), and viem + wagmi for Web3 development |
| Apply game theory concepts to real-world founder challenges |

## 🎮 Game Rules: The Founder's Dilemma


The Founder's Dilemma is a classic game theory scenario adapted for business strategy. Two founders repeatedly choose between **partnering** and **competing** over multiple rounds, without knowing the other's choice in each round. This simulation mirrors real-world decisions around collaboration vs. competition in markets, partnerships, and strategic positioning. Players can adapt their strategy based on previous outcomes—just like in business.

### How It Works

1. **Enter a Deal**: Players stake ETH to create or join a business deal (game instance). Each deal is assigned a random number of rounds (between 2 and 5) for iterative strategy.
2. **Make Strategic Choices**: In each round, both players secretly choose to **Partner** (collaborate) or **Compete** (capture market share). Choices are revealed simultaneously.
3. **Continue or Exit**: After each round, both players must independently decide whether to continue to the next round or exit the deal. The game continues only if both agree and the maximum rounds haven't been reached.
4. **Payouts & Results**: After the final round or if a player exits, payouts are distributed based on the cumulative results of all rounds played in the deal.


### Payoff Matrix (Per Round)

| Your Strategy | Their Strategy | Your Payout | Their Payout |
|-----------|-----------------|-------------|-------------------|
| 🤝 Partner | 🤝 Partner | **1.0x stake** | **1.0x stake** |
| 🤝 Partner | ⚔️ Compete | **0.5x stake** | **1.5x stake** |
| ⚔️ Compete | 🤝 Partner | **1.5x stake** | **0.5x stake** |
| ⚔️ Compete | ⚔️ Compete | **0.5x stake** | **0.5x stake** |


### Business Strategy Considerations

- **Memory & Adaptation**: Players can adjust their strategy based on previous rounds (e.g., reciprocal partnership, aggressive competition, collaborative approach).
- **Continuation Decisions**: After each round, both players must opt-in to continue the deal. If either exits, the deal ends and payouts are distributed—mirroring real business relationships.
- **Strategic Uncertainty**: Each deal has a random number of rounds (2-5), so players cannot always predict when negotiations will end, increasing strategic complexity.
- **Strategic Partnership**: Both founders grow together (1.0x per round) - the collaborative approach
- **Price War**: Both lose market value (0.5x per round) - the competitive trap
- **Market Capture**: The aggressive player gains (1.5x per round), while the partner loses (0.5x per round) - exploitation risk

**The Founder's Dilemma**: While mutual partnership yields the best collective outcome, individual incentives push toward competition—especially as the relationship nears its end. This mirrors real-world challenges in business alliances, pricing strategy, and strategic partnerships.

## 🚀 Quick Start (Hosted Version - For Non-Technical Founders)

Want to experience the Founder's Dilemma without any setup? Try the hosted version!

**Requirements:**
- MetaMask or another Web3 wallet
- Arbitrum Sepolia testnet ETH (free from faucets)

**Get Started:**
1. Get Arbitrum Sepolia testnet ETH:
   - Bridge Sepolia ETH to Arbitrum Sepolia: [bridge.arbitrum.io](https://bridge.arbitrum.io/?destinationChain=arbitrum-sepolia&sourceChain=sepolia)
   - Get Sepolia ETH first from: [sepoliafaucet.com](https://www.sepoliafaucet.com/) or [faucets.chain.link/sepolia](https://faucets.chain.link/sepolia)
2. Visit the hosted application (URL will be provided after deployment)
3. Connect your wallet
4. Start making strategic business decisions!

**Network Details:**
- Network: Arbitrum Sepolia
- Chain ID: 421614
- RPC: https://sepolia-rollup.arbitrum.io/rpc

## Quick Start (GitHub Codespaces - For Developers)

Run the full workshop in a preconfigured Codespace — complete development environment!

[![Open in Codespaces](https://img.shields.io/badge/Open%20in-GitHub%20Codespaces-blue?logo=github&logoColor=white&style=for-the-badge)](https://codespaces.new/hummusonrails/arbitrum-prisoners-dilemma-workshop)

**Steps:**
1. Click the button above.
2. Wait for initialization.
3. Open a terminal (Terminal → New Terminal).
4. Follow the workshop steps below.

## What You'll Do

- ✅ Set up a local Arbitrum Nitro Devnode
- ✅ Deploy and interact with a Stylus (Rust) Prisoner's Dilemma contract
- ✅ Use cargo stylus and foundry (cast) for contract deployment
- ✅ Connect the game contract to a React + Vite + TypeScript frontend
- ✅ Implement strategic gameplay with local testnet ETH staking
- ✅ Practice game theory concepts in a blockchain environment

## Local Requirements (Skip if using Codespaces)

For running locally:
- [pnpm](https://pnpm.io/installation)
- [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- [rust](https://rustup.rs/)
- [foundry](https://book.getfoundry.sh/getting-started/installation)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Nitro-devnode](https://github.com/OffchainLabs/nitro-devnode?tab=readme-ov-file#usage)

## Project Structure Overview

```bash
contracts/
└── prisoners-dilemma/         # Stylus (Rust) Prisoner's Dilemma contract
  ├── src/
  │   ├── lib.rs             # Main contract implementation
  │   └── main.rs            # (if present, entry point for bin)
  ├── Cargo.toml             # Rust dependencies
  ├── rust-toolchain.toml    # Rust toolchain config
  ├── package.json           # Build and deploy scripts
  └── target/                # Build output
frontend/                      # React + Vite + TS frontend
├── public/
└── src/
  ├── abi/                   # Contract ABI
  │   └── PrisonersDilemmaContract.json
  ├── components/            # Game UI components (CellView, GameLobby, MoveButtons, etc.)
  ├── contexts/              # Web3 context and state
  ├── hooks/                 # Custom hooks for cell/game state
  ├── lib/                   # Contract interaction logic (contract.ts)
  ├── types/                 # TypeScript types
  ├── utils/                 # CellManager and helpers for round/cell logic
  ├── App.tsx
nitro-devnode/                 # Local Arbitrum node
scripts/
├── funds.sh                   # Fund test accounts
└── package.json               # Script utilities
```

## Workshop Exercises

### 1. Install Dependencies

```bash
pnpm install -r
```

### 2. Start Local Arbitrum Node

> [!NOTE]
> Codespaces users: This is mostly handled for you, but you still need to manually start the devnode.

```bash
cd nitro-devnode
./run-dev-node.sh
```

### 3. Build & Deploy Prisoner's Dilemma Contract

* The Stylus contract is implemented in `contracts/prisoners-dilemma/src/lib.rs`.
* Build and deploy locally:

```bash
pnpm --filter prisoners-dilemma-contract deploy:local
```

* **Important**: Copy the deployed contract address from the output for later use.

### 4. Export Contract ABI (for Frontend Integration)

* Use cargo stylus to export the ABI for frontend integration:

```bash
cd contracts/prisoners-dilemma
cargo stylus export-abi --json > ../../frontend/src/abi/PrisonersDilemma.json
```

* Open the exported ABI file and ensure it contains only the ABI in JSON format.

### 5. Connect Frontend to Contract

* The frontend is in `frontend/`.
* Update the contract address in your `contract.ts` file:

```typescript
// frontend/src/lib/contract.ts
const CONTRACT_ADDRESS = '0x...' as `0x${string}`;
```

### 6. Frontend Workshop 🌐 (Strategic Business Simulation)

> [!TIP]
> **Main Learning Focus**: The contract is complete! Your task is to study and understand the strategic decision-making implementation, deal continuation logic, and how Web3 enables trustless business simulations.

#### 📚 **Learning Objectives for Founders**
- Master strategic interaction patterns applicable to real business scenarios
- Understand stake-based incentive mechanisms and payout distributions
- Learn how blockchain enables trustless multi-party agreements
- Practice advanced smart contract interaction patterns
- Apply game theory concepts to founder decision-making

#### 🔍 **Study These Business Strategy Components**

The frontend demonstrates strategic business mechanics:

**1. Strategic Decision Making (Partner vs. Compete)**
- 📋 **Task 1**: Explore the partner vs. compete choice interface for each round
- 🔄 **Task 2**: Study how deal continuation decisions mirror real business relationships
- 🔗 **Task 3**: Learn how the frontend and contract maintain trustless synchronization across multiple rounds

**2. Payout Distribution & Incentive Design**
- 📖 **Task 1**: Understand cumulative payout calculations across multiple rounds
- ✍️ **Task 2**: Study the payoff matrix implementation and how it creates strategic tension
- 🎯 **Task 3**: Learn transaction confirmation and state update patterns for multi-round deals

#### 🎯 **Game Theory Concepts for Founders**

**Nash Equilibrium in Business**
- Both founders competing in every round is the Nash equilibrium, but collaborative strategies like tit-for-tat can outperform in repeated business relationships.

**Pareto Efficiency**
- Mutual partnership in every round is Pareto optimal (best collective outcome), but individual competitive incentives and uncertainty about the final round often prevent this—just like in real markets.

**Risk vs Reward in Business Strategy**
- **Partnership**: Builds long-term value but vulnerable to exploitation if the other party competes late
- **Competition**: Captures short-term gains but may destroy long-term relationship value and miss collaborative opportunities

#### 🚀 **Workshop Tasks for Founders**
1. **Simulate Strategic Scenarios**: Create deals and test different strategies (always partner, always compete, tit-for-tat, adaptive)
2. **Analyze Business Outcomes**: Track your wins/losses and cumulative returns with different approaches
3. **Study Incentive Structures**: Understand why founders might choose partnership vs. competition in different contexts
4. **Test Stake Dynamics**: What happens with different stake amounts? How does risk affect strategy?
5. **Explore Behavioral Psychology**: How does relationship uncertainty and anonymity affect strategic choices?
6. **Design Better Incentives**: Think about how to modify the deal structure to encourage desired behaviors

### 7. Start the Frontend (with Real-Time Strategic Deal Interface)

```bash
pnpm --filter frontend dev
```

### 9. Test Accounts & Funding

**Deployer Account:**
* Address: `0x3f1Eae7D46d88F08fc2F8ed27FCb2AB183EB2d0E`
* Private Key: `0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659`

**Test Users:**

| Index  | Address | Private Key |
| ------------- | ------------- | ----------- |
| 0  | 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 | 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 |
| 1  | 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 | 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d |
| 2  | 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC | 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a |
| 3  | 0x90F79bf6EB2c4f870365E785982E1f101E93b906 | 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6 |
| 4  | 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 | 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a |
| 5  | 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc | 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba |
| 6  | 0x976EA74026E726554dB657fA54763abd0C3a0aa9 | 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e |
| 7  | 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955 | 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356 |
| 8  | 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f | 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97 |
| 9  | 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720 | 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6 |

**Fund User Wallets:**

```bash
./scripts/funds.sh
```

### 10. Testing and Checking Contracts

To check if the contract compiles and is valid, run:

```bash
pnpm --filter prisoners-dilemma-contract check
```

To estimate gas for deployment, run:

```bash
pnpm --filter prisoners-dilemma-contract estimate-gas
```

To test the contract, run:

```bash
pnpm --filter prisoners-dilemma-contract test
```

## Network Settings

**Local Network:**
- Name: Localhost-Nitro
- RPC: http://localhost:8547
- Chain ID: 412346

**Codespaces RPC:**
- Use the forwarded port URL from the "Ports" tab (e.g., `https://your-codespace-8547.app.github.dev`)

## 🧠 Game Theory for Founders

The Founder's Dilemma illustrates fundamental concepts in strategic business decision-making:

- **Partnership Strategy**: When to collaborate vs. when to compete for market share
- **Pricing Decisions**: Premium positioning vs. price wars with competitors
- **Resource Allocation**: Shared infrastructure vs. proprietary development
- **Market Entry**: Cooperative ecosystem building vs. aggressive competition
- **Behavioral Economics**: Loss aversion and risk preferences (Kahneman's research)

### Strategies to Explore

1. **Always Partner**: Collaborative but vulnerable to exploitation - builds trust over time
2. **Always Compete**: Aggressive but may miss partnership opportunities - captures short-term gains
3. **Tit-for-Tat**: Start collaborative, then mirror opponent's previous move - establishes reciprocity
4. **Strategic Flexibility**: Adapt based on context and relationship history

### Real-World Founder Applications

**Strategic Partnerships:**
- **Co-opetition**: When Microsoft and Apple collaborate on standards while competing in markets
- **Joint Ventures**: Shared investment in new markets vs. going it alone
- **API Integration**: Open platforms vs. walled gardens

**Pricing & Competition:**
- **Price Wars**: Uber vs. Lyft subsidizing rides - both lose money (compete/compete outcome)
- **Premium Positioning**: Maintaining margins vs. undercutting competitors
- **Bundling Strategies**: Complementary vs. competing product strategies

**Talent & Resources:**
- **Hiring Wars**: Bidding up salaries vs. collaborative hiring practices
- **Acqui-hires**: Acquiring for talent vs. organic team building
- **Contractor Networks**: Shared talent pools vs. exclusive arrangements

**Fundraising & Growth:**
- **Cap Table**: Competitive vs. collaborative funding rounds
- **Market Expansion**: First-mover aggression vs. collaborative market development
- **Platform Dynamics**: Network effects and ecosystem incentives

### Kahneman's Insights on Founder Decision-Making

Daniel Kahneman's research on behavioral economics reveals critical patterns in how founders make decisions under uncertainty:

- **Loss Aversion**: Founders fear losses more than they value equivalent gains, often leading to overly competitive strategies to avoid losing market share
- **Anchoring**: Initial partnership terms or pricing decisions heavily influence future strategy
- **Overconfidence**: Founders often overestimate their ability to "win" in competitive scenarios
- **Framing Effects**: How choices are framed (partnership opportunity vs. competition threat) dramatically affects decisions

## 🧑‍💻 Workshop Tips for Founders

- **Simulate Real Scenarios**: Use different accounts to test partnership vs. competition dynamics
- **Stake Matters**: Try various stake amounts - higher stakes often mirror higher-risk business decisions
- **Track Your Strategy**: Experiment with different approaches and analyze outcomes across multiple deals
- **Psychology of Business**: Consider how relationship uncertainty and anonymity affect strategic choices
- **Incentive Design**: Think about how deal structures could be modified to encourage long-term partnerships
- **Reputation Systems**: In repeated games with the same partner, reputation emerges - just like in business networks
- **End-Game Dynamics**: Notice how behavior changes near the final round - this mirrors last-mover advantages in business

**Questions to Explore:**
- When does competition destroy value for both parties?
- How do repeated interactions build (or destroy) trust?
- What role does strategic uncertainty play in maintaining cooperation?
- How would adding reputation scores change behavior?
- What parallels do you see with your own founder challenges?

## 🌐 Deploying Your Own Hosted Version

Want to deploy your own version on Arbitrum Sepolia with Vercel? Follow these steps:

### 1. Deploy Contract to Arbitrum Sepolia

First, ensure you have Sepolia ETH in your deployer wallet, then:

```bash
cd contracts/prisoners-dilemma
DEPLOY_PRIVATE_KEY=your_private_key_here pnpm deploy:sepolia
```

Copy the deployed contract address from the output.

### 2. Configure Frontend for Sepolia

Create a `.env` file in the `frontend/` directory:

```bash
# frontend/.env
VITE_USE_SEPOLIA=true
VITE_CONTRACT_ADDRESS=your_deployed_contract_address_here
```

### 3. Deploy to Vercel

The frontend is pre-configured for Vercel deployment with `vercel.json`.

**Option A: Using Vercel CLI**
```bash
cd frontend
npm install -g vercel
vercel
```

**Option B: Using Vercel Dashboard**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `VITE_USE_SEPOLIA=true`
   - `VITE_CONTRACT_ADDRESS=your_contract_address`
5. Deploy!

### 4. Initialize the Contract

After deployment, visit your hosted application and:
1. Connect your wallet (the deployer wallet)
2. Click "Initialize Contract"
3. Set the minimum stake (e.g., 0.01 ETH)
4. Confirm the transaction

Your Founder's Dilemma game is now live on Arbitrum Sepolia!

### Network Configuration

The application automatically switches between:
- **Local Development**: `VITE_USE_SEPOLIA=false` (or unset) - uses localhost:8547
- **Production/Sepolia**: `VITE_USE_SEPOLIA=true` - uses Arbitrum Sepolia testnet

Happy strategizing! 🎯
