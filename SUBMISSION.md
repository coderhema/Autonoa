# DoraHacks Submission — Autonoa

## Track

**Track 1: Autonomous Trading Agents** ($24,000)
Also eligible for: Best Use of TWAK, Best Use of Agent Hub, Best Use of BNB AI Agent SDK

---

## Project Name

**Autonoa** — Autonomous AI Trading Agent

## Tagline

An AI trading agent that reads markets, executes on-chain, and posts every trade to Moltbook.

## Description

Autonoa is a fully autonomous AI trading agent competing in the BNB Hack. It integrates three layers into a single self-contained stack:

1. **CoinMarketCap AI Agent Hub** — Fetches real-time price, volume, and momentum data for 38 eligible BEP-20 tokens. Scores each by price change + volume delta and filters for bullish signals.

2. **Trust Wallet Agent Kit (TWAK)** — Self-custody signing and execution. Every swap is locally signed — private keys never leave the agent. Includes TWAK risk scoring to avoid malicious contracts before trading.

3. **BNB AI Agent SDK** — Registers agent identity on-chain and records all trades for competition monitoring.

4. **Moltbook (Social Layer)** — Posts every trade to m/autonoa-trades with full signal details, reasoning, and tx hash. Also reads Moltbook community sentiment to adjust confidence levels. This makes the agent fully transparent and participatory.

**Strategy:** Momentum-volume breakout. Scan eligible tokens → score by 24h price change + volume delta → execute via TWAK with self-custody signing → enforce drawdown cap (30%), daily trade limit (10), and per-trade max.

## GitHub

https://github.com/coderhema/Autonoa

## Demo

https://www.moltbook.com/u/autonoa — live trade posts from the agent

## Strategy Description

The agent runs a continuous loop every 5 minutes:

1. Fetch quotes for 38 eligible BEP-20 tokens from CMC Pro API
2. Filter by minimum 24h volume ($100k)
3. Score remaining tokens by price change × volume momentum confidence formula
4. Optionally read Moltbook sentiment to boost/reduce confidence
5. Execute bullish signals above confidence threshold via TWAK swap
6. Post trade report to Moltbook m/autonoa-trades
7. Enforce risk limits: max 30% drawdown, max 10 trades/day

Risk management features:
- TWAK risk scoring on every token before execution
- Configurable drawdown cap (hard pause if breached)
- Daily trade limit
- Per-trade amount cap
- Slippage protection

## BNB AI Agent SDK Integration

The agent registers its identity via the BNB AI Agent SDK at startup and records every trade as a commerce event for competition monitoring.

## On-Chain Registration

Agent wallet address: [FILL IN AFTER REGISTRATION]
Competition contract: 0x212c61b9b72c95d95bf29cf032f5e5635629aed5
