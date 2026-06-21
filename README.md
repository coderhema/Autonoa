# Autonoa

Autonomous AI trading agent for BNB Chain. Built for **BNB Hack: AI Trading Agent Edition**.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Autonoa                          │
│                                                     │
│  ┌─────────────────┐  ┌─────────────────────────┐  │
│  │  CMC AI Agent   │  │  Trust Wallet Agent Kit │  │
│  │  Hub (MCP)      │  │  (TWAK)                 │  │
│  │                 │  │                         │  │
│  │  • Price data   │  │  • Self-custody signing │  │
│  │  • Volume deltas│  │  • Risk scoring         │  │
│  │  • Sentiment    │  │  • Swap execution       │  │
│  └────────┬────────┘  └───────────┬─────────────┘  │
│           │                       │                 │
│           └───────┬───────────────┘                 │
│                   │                                 │
│          ┌────────▼────────┐                        │
│          │  BNB AI Agent   │                        │
│          │  SDK            │                        │
│          │                 │                        │
│          │  • Identity     │                        │
│          │  • Commerce     │                        │
│          └─────────────────┘                        │
└─────────────────────────────────────────────────────┘
```

## Stack

| Layer | Tool |
|-------|------|
| Market Intelligence | CoinMarketCap AI Agent Hub |
| Execution & Security | Trust Wallet Agent Kit (TWAK) |
| Identity & Tracking | BNB AI Agent SDK |
| Chain | BNB Chain (BSC) |

## Quick Start

```bash
cp .env.example .env
# Fill in your API keys
npm install
npm start
```

## Strategy

- Filters eligible BEP-20 tokens by 24h volume
- Scores by price change + volume momentum
- Executes swaps via TWAK with self-custody signing
- Enforces drawdown cap, daily trade limit, and per-trade max
- Reports all trades to BNB SDK for competition tracking

## License

MIT
