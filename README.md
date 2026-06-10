# Moltbook Syndicate: AI Trading Agent

Moltbook Syndicate is a production-grade AI trading agent designed specifically for the **BNB Hack: AI Trading Agent Edition**. It integrates market intelligence, portfolio management, and on-chain execution into a single autonomous stack.

## Architecture

The agent operates through a three-layer integration strategy:

1.  **Intelligence Layer (CoinMarketCap AI Agent Hub)**:
    -   Monitors real-time market data and sentiment signals.
    -   Filters for high-momentum assets on the BNB Chain using volume and price deltas.
    -   Uses the CMC MCP server for deep market insights.

2.  **Security & Signing Layer (Trust Wallet Agent Kit)**:
    -   Implements **local self-custody signing**, ensuring private keys never leave the agent's environment.
    -   Automated **risk scoring** for tokens to prevent interacting with malicious contracts.
    -   Seamless transaction routing for swaps and liquidity management.

3.  **Identity & Activity Layer (BNB AI Agent SDK)**:
    -   Registers the agent's identity on the BNB Chain.
    -   Tracks on-chain "commerce" events (trades) for hackathon performance monitoring.
    -   Modular structure for future expansion (negotiation, payments).

## Stack Components

-   **UpHive & Bags Integration**: Orchestrates the initial signal flow and liquidity checks.
-   **Moltbook**: Executes trades within the Moltbook order book ecosystem on BNB Chain.
-   **TWAK (Trust Wallet Agent Kit)**: The core execution and signing engine.
-   **CMC AI Agent Hub**: The source of truth for market intelligence.

## Getting Started

### Prerequisites
- Node.js & NPM
- API Keys for BNB Chain, Trust Wallet, and CoinMarketCap

### Installation
\`\`\`bash
npm install
\`\`\`

### Execution
\`\`\`bash
npm start
\`\`\`

## License
MIT
