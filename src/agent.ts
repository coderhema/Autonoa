import { config as loadEnv } from 'dotenv';
loadEnv();

import type {
  AutonoaConfig,
  CMCSignal,
  CMCResponse,
  TWAKInstance,
  BNBInstance,
  AgentState,
  TWAKRiskScore,
} from './types';
import {
  defaultState, ELIGIBLE_TOKENS, MoltbookConfig
} from './types';
import { MoltbookClient } from './moltbook';

function loadConfig(): AutonoaConfig {
  const cfg: AutonoaConfig = {
    bnb: {
      apiKey: requireEnv('BNB_API_KEY'),
      network: (process.env.BNB_NETWORK as 'bsc-mainnet' | 'bsc-testnet') || 'bsc-mainnet',
    },
    trustWallet: {
      apiKey: requireEnv('TRUST_WALLET_API_KEY'),
      walletType: 'self-custody',
      privateKey: process.env.PRIVATE_KEY,
    },
    cmc: {
      apiKey: requireEnv('CMC_API_KEY'),
    },
    moltbook: {
      apiKey: process.env.MOLTBOOK_API_KEY || '',
      agentName: process.env.MOLTBOOK_AGENT_NAME || 'Autonoa',
      submoltName: process.env.MOLTBOOK_SUBMOLT || 'algotrading',
      enabled: !!process.env.MOLTBOOK_API_KEY,
    },
    trading: {
      maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || '30'),
      maxDailyTrades: parseInt(process.env.MAX_DAILY_TRADES || '10', 10),
      maxPerTrade: process.env.MAX_PER_TRADE || '0.5',
      slippage: parseFloat(process.env.SLIPPAGE || '0.5'),
      minVolume24h: parseFloat(process.env.MIN_VOLUME_24H || '100000'),
    },
  };
  return cfg;
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function determineSentiment(change24h: number, volumeChange: number): 'bullish' | 'bearish' | 'neutral' {
  if (change24h > 5 && volumeChange > 10) return 'bullish';
  if (change24h < -5 && volumeChange > 10) return 'bearish';
  return 'neutral';
}

function createTWAK(cfg: AutonoaConfig['trustWallet']): TWAKInstance {
  try {
    const mod = require('@trustwallet/agent-kit');
    return new mod.TrustWalletAgentKit({
      apiKey: cfg.apiKey,
      walletConfig: { type: 'self-custody' },
    }) as unknown as TWAKInstance;
  } catch {
    console.warn('[Autonoa] @trustwallet/agent-kit not found, using mock adapter');
    return createMockTWAK(cfg);
  }
}

function createMockTWAK(cfg: AutonoaConfig['trustWallet']): TWAKInstance {
  const mockAddress = `0x${'0'.repeat(40)}`;
  return {
    wallet: {
      async address() { return mockAddress; },
      async balance() { return '10.0'; },
    },
    risk: {
      async score(_tokenAddress: string): Promise<TWAKRiskScore> {
        return { score: 15, flags: [], isMalicious: false, summary: 'Mock: low risk' };
      },
    },
    transactions: {
      async swap(params) {
        console.log(`[MockTWAK] swap ${params.fromToken} → ${params.toToken} amt=${params.amount}`);
        return {
          hash: `0x${Date.now().toString(16)}${'0'.repeat(48)}`,
          fromAmount: params.amount,
          toAmount: (parseFloat(params.amount) * 100).toString(),
          fee: '0.0005',
          chainId: 56,
        };
      },
    },
  };
}

function createBNBSDK(cfg: AutonoaConfig['bnb']): BNBInstance {
  try {
    const mod = require('@bnb-chain/bnb-ai-agent-sdk');
    return new mod.BNBAgentSDK({
      apiKey: cfg.apiKey,
      network: cfg.network,
    }) as unknown as BNBInstance;
  } catch {
    console.warn('[Autonoa] @bnb-chain/bnb-ai-agent-sdk not found, using mock adapter');
    return createMockBNBSDKI(cfg);
  }
}

function createMockBNBSDKI(cfg: AutonoaConfig['bnb']): BNBInstance {
  return {
    identity: {
      async register(info) {
        return {
          id: `agent_${Date.now()}`,
          address: `0x${'0'.repeat(40)}`,
          name: info.name,
          role: info.role,
          createdAt: Date.now(),
        };
      },
    },
    commerce: {
      async recordTrade(record) {
        console.log(`[MockBNB] Trade recorded: ${record.txHash} (${record.track})`);
      },
    },
  };
}

export class Autonoa {
  private cfg: AutonoaConfig;
  private state: AgentState;
  private twak!: TWAKInstance;
  private bnbSDK!: BNBInstance;
  private moltbook: MoltbookClient;
  private startedAt: number;

  constructor() {
    this.cfg = loadConfig();
    this.state = defaultState();
    this.moltbook = new MoltbookClient(this.cfg.moltbook);
    this.startedAt = Date.now();
  }

  async initialize(): Promise<void> {
    console.log('[Autonoa] Initializing...');

    this.twak = createTWAK(this.cfg.trustWallet);
    this.state.walletAddress = await this.twak.wallet.address();
    this.state.balance = await this.twak.wallet.balance();

    this.bnbSDK = createBNBSDK(this.cfg.bnb);
    this.state.identity = await this.bnbSDK.identity.register({
      name: 'Autonoa Agent',
      role: 'TradingBot',
    });

    this.state.peakPortfolioValue = parseFloat(this.state.balance);

    if (this.moltbook.enabled) {
      try {
        const profile = await this.moltbook.getProfile();
        console.log(`[Autonoa] Moltbook: @${profile.name} (${profile.karma} karma)`);
      } catch (err) {
        console.warn(`[Autonoa] Moltbook init failed:`, err);
      }
    } else {
      console.log('[Autonoa] Moltbook: disabled (set MOLTBOOK_API_KEY to enable)');
    }

    console.log(`[Autonoa] Identity: ${this.state.identity!.id}`);
    console.log(`[Autonoa] Wallet: ${this.state.walletAddress} | Balance: ${this.state.balance}`);
  }

  private async fetchCMCSignals(): Promise<CMCSignal[]> {
    console.log('[Autonoa] Fetching CMC market data...');

    const symbols = ELIGIBLE_TOKENS.join(',');
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;

    const res = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.cfg.cmc.apiKey,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CMC API error ${res.status}: ${text}`);
    }

    const body: CMCResponse = await res.json();

    if (body.status.error_code !== 0) {
      throw new Error(`CMC API error: ${body.status.error_message}`);
    }

    const signals: CMCSignal[] = [];

    for (const entry of Object.values(body.data)) {
      const tokenAddress = entry.platform?.token_address || '';
      if (!tokenAddress) continue;

      const change24h = entry.quote.USD.percent_change_24h;
      const vol24h = entry.quote.USD.volume_24h;
      const volChange = entry.quote.USD.volume_change_24h;

      if (vol24h < this.cfg.trading.minVolume24h) continue;

      signals.push({
        symbol: entry.symbol,
        name: entry.name,
        price: entry.quote.USD.price,
        priceChange24h: change24h,
        volume24h: vol24h,
        volumeChange24h: volChange,
        marketCap: entry.quote.USD.market_cap,
        tokenAddress,
        chain: 'bsc',
        sentiment: determineSentiment(change24h, volChange),
        confidence: Math.min(Math.abs(change24h) * 3 + Math.min(volChange / 2, 50), 95),
      });
    }

    signals.sort((a, b) => b.confidence - a.confidence);
    console.log(`[Autonoa] Got ${signals.length} signals, top: ${signals[0]?.symbol ?? 'none'}`);
    return signals;
  }

  private async checkRisk(tokenAddress: string): Promise<TWAKRiskScore> {
    return this.twak.risk.score(tokenAddress);
  }

  private async executeTrade(signal: CMCSignal): Promise<void> {
    const risk = await this.checkRisk(signal.tokenAddress);
    if (risk.isMalicious) {
      console.warn(`[Autonoa] SKIP ${signal.symbol} — flagged malicious by TWAK`);
      return;
    }
    if (risk.score > 70) {
      console.warn(`[Autonoa] SKIP ${signal.symbol} — risk score ${risk.score}/100`);
      return;
    }

    const tx = await this.twak.transactions.swap({
      fromToken: 'BNB',
      toToken: signal.tokenAddress,
      amount: this.cfg.trading.maxPerTrade,
      slippage: this.cfg.trading.slippage,
    });

    this.state.tradesToday.push(tx.hash);
    this.state.dailyTradeCount++;
    this.state.lastTradeAt = Date.now();

    const newBalance = parseFloat(this.state.balance) - parseFloat(tx.fee);
    this.state.balance = newBalance.toString();

    if (newBalance > this.state.peakPortfolioValue) {
      this.state.peakPortfolioValue = newBalance;
    }

    this.state.currentPortfolioValue = newBalance;
    this.state.currentDrawdown = this.computeDrawdown();

    await this.bnbSDK.commerce.recordTrade({
      txHash: tx.hash,
      agentId: this.state.identity!.id,
      track: 'Autonomous Trading Agent',
      timestamp: Date.now(),
      strategy: 'momentum-volume',
    });

    console.log(`[Autonoa] EXECUTED ${signal.symbol} | tx: ${tx.hash} | risk: ${risk.score}`);

    await this.postTradeToMoltbook(signal, tx.hash, risk.score);
  }

  private async postTradeToMoltbook(signal: CMCSignal, txHash: string, riskScore: number): Promise<void> {
    if (!this.moltbook.enabled) return;

    const dir = signal.sentiment === 'bullish' ? 'LONG' : 'SHORT';
    const title = `${dir} ${signal.symbol} @ $${signal.price.toFixed(2)} | confidence ${signal.confidence}%`;
    const body = [
      `**Signal:** ${signal.symbol} (${signal.name})`,
      `**Direction:** ${dir}`,
      `**Price:** $${signal.price.toFixed(6)}`,
      `**24h Change:** ${signal.priceChange24h > 0 ? '+' : ''}${signal.priceChange24h.toFixed(2)}%`,
      `**Volume 24h:** $${(signal.volume24h / 1_000_000).toFixed(1)}M`,
      `**Confidence:** ${signal.confidence}/100`,
      `**TWAK Risk:** ${riskScore}/100`,
      ``,
      `**TX:** \`${txHash}\``,
      `**Strategy:** momentum-volume breakout`,
      `**Chain:** BSC`,
    ].join('\n');

    try {
      const postId = await this.moltbook.createPost(title, body);
      console.log(`[Autonoa] Posted trade to Moltbook: ${postId}`);
    } catch (err) {
      console.warn(`[Autonoa] Moltbook post failed:`, err);
    }
  }

  private computeDrawdown(): number {
    if (this.state.peakPortfolioValue === 0) return 0;
    return ((this.state.peakPortfolioValue - this.state.currentPortfolioValue) / this.state.peakPortfolioValue) * 100;
  }

  private checkRiskLimits(): boolean {
    if (this.state.currentDrawdown >= this.cfg.trading.maxDrawdown) {
      this.state.isPaused = true;
      console.error(
        `[Autonoa] PAUSED — drawdown ${this.state.currentDrawdown.toFixed(1)}% >= ${this.cfg.trading.maxDrawdown}%`,
      );
      return false;
    }
    if (this.state.dailyTradeCount >= this.cfg.trading.maxDailyTrades) {
      console.warn(`[Autonoa] PAUSED — hit ${this.cfg.trading.maxDailyTrades} daily trades`);
      return false;
    }
    return true;
  }

  private async fetchMoltbookSentiment(): Promise<string | null> {
    if (!this.moltbook.enabled) return null;
    try {
      const results = await this.moltbook.searchSentiment('BNB Chain trading market sentiment');
      if (results.length === 0) return null;

      const bullish = results.filter((r) => r.similarity > 0.6).length;
      const total = results.length;
      return bullish / total > 0.5 ? 'bullish' : 'bearish';
    } catch {
      return null;
    }
  }

  private async tick(): Promise<void> {
    if (this.state.isPaused) {
      console.log('[Autonoa] Paused, skipping tick');
      return;
    }

    const mbSentiment = await this.fetchMoltbookSentiment();
    if (mbSentiment) {
      console.log(`[Autonoa] Moltbook sentiment: ${mbSentiment}`);
    }

    const signals = await this.fetchCMCSignals();

    const enriched = signals.map((s) => {
      if (mbSentiment && s.sentiment === mbSentiment) {
        return { ...s, confidence: Math.min(s.confidence + 10, 99) };
      }
      if (mbSentiment && s.sentiment !== mbSentiment) {
        return { ...s, confidence: Math.max(s.confidence - 10, 0) };
      }
      return s;
    });

    const targets = enriched.filter(
      (s) => s.sentiment === 'bullish' && s.confidence > 50 && s.volumeChange24h > 10,
    );

    console.log(`[Autonoa] ${targets.length} actionable signals this tick`);

    for (const signal of targets) {
      if (!this.checkRiskLimits()) return;
      try {
        await this.executeTrade(signal);
      } catch (err) {
        console.error(`[Autonoa] Trade failed for ${signal.symbol}:`, err);
      }
    }
  }

  async run(): Promise<void> {
    await this.initialize();

    console.log('[Autonoa] Entering strategy loop...');
    console.log(`[Autonoa] Max drawdown: ${this.cfg.trading.maxDrawdown}%`);
    console.log(`[Autonoa] Max daily trades: ${this.cfg.trading.maxDailyTrades}`);
    console.log(`[Autonoa] Min volume 24h: $${this.cfg.trading.minVolume24h}`);
    console.log('');

    while (true) {
      await this.tick();
      console.log(`[Autonoa] Sleeping 300s...\n`);
      await sleep(300_000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
