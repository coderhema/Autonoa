export interface MoltbookConfig {
  apiKey: string;
  agentName: string;
  submoltName: string;
  enabled: boolean;
}

export interface AutonoaConfig {
  bnb: {
    apiKey: string;
    network: 'bsc-mainnet' | 'bsc-testnet';
  };
  trustWallet: {
    apiKey: string;
    walletType: 'self-custody';
    privateKey?: string;
  };
  cmc: {
    apiKey: string;
  };
  moltbook: MoltbookConfig;
  trading: {
    maxDrawdown: number;
    maxDailyTrades: number;
    maxPerTrade: string;
    slippage: number;
    minVolume24h: number;
  };
}

export interface CMCSignal {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  tokenAddress: string;
  chain: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
}

export interface CMCQuote {
  symbol: string;
  name: string;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_24h: number;
      market_cap: number;
    };
  };
  platform?: {
    token_address: string;
  };
}

export interface CMCResponse {
  status: { error_code: number; error_message: string | null };
  data: Record<string, CMCQuote>;
}

export interface TWAKRiskScore {
  score: number;
  flags: string[];
  isMalicious: boolean;
  summary: string;
}

export interface TWAKSwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}

export interface TWAKSwapResult {
  hash: string;
  fromAmount: string;
  toAmount: string;
  fee: string;
  chainId: number;
}

export interface TWAKInstance {
  risk: {
    score(tokenAddress: string): Promise<TWAKRiskScore>;
  };
  transactions: {
    swap(params: TWAKSwapParams): Promise<TWAKSwapResult>;
  };
  wallet: {
    address(): Promise<string>;
    balance(): Promise<string>;
  };
}

export interface BNBSDKIdentity {
  id: string;
  address: string;
  name: string;
  role: string;
  createdAt: number;
}

export interface BNBSDKConfig {
  apiKey: string;
  network: string;
}

export interface BNBCommerceRecord {
  txHash: string;
  agentId: string;
  track: string;
  timestamp: number;
  strategy: string;
}

export interface BNBInstance {
  identity: {
    register(info: { name: string; role: string }): Promise<BNBSDKIdentity>;
  };
  commerce: {
    recordTrade(record: BNBCommerceRecord): Promise<void>;
  };
}

export interface AgentState {
  identity: BNBSDKIdentity | null;
  walletAddress: string;
  balance: string;
  dailyTradeCount: number;
  peakPortfolioValue: number;
  currentPortfolioValue: number;
  currentDrawdown: number;
  isPaused: boolean;
  lastTradeAt: number | null;
  tradesToday: string[];
}

export function defaultState(): AgentState {
  return {
    identity: null,
    walletAddress: '',
    balance: '0',
    dailyTradeCount: 0,
    peakPortfolioValue: 0,
    currentPortfolioValue: 0,
    currentDrawdown: 0,
    isPaused: false,
    lastTradeAt: null,
    tradesToday: [],
  };
}

export interface MoltbookAgent {
  name: string;
  description: string;
  karma: number;
  follower_count: number;
  following_count: number;
  posts_count: number;
  is_claimed: boolean;
  is_active: boolean;
}

export interface MoltbookPost {
  post_id: string;
  title: string;
  content_preview: string;
  submolt_name: string;
  author_name: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
}

export interface MoltbookSearchResult {
  id: string;
  type: 'post' | 'comment';
  title: string | null;
  content: string;
  upvotes: number;
  similarity: number;
  author: { name: string };
  submolt?: { name: string; display_name: string };
}

export interface MoltbookHomeResponse {
  your_account: { name: string; karma: number; unread_notification_count: number };
  posts_from_accounts_you_follow: { posts: MoltbookPost[] };
  latest_moltbook_announcement: { post_id: string; title: string; preview: string } | null;
}

export interface MoltbookApiResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export const ELIGIBLE_TOKENS = [
  'ETH', 'USDT', 'USDC', 'XRP', 'TRX', 'DOGE', 'ZEC', 'ADA', 'LINK', 'BCH',
  'DAI', 'TON', 'BNB', 'SHIB', 'DOT', 'UNI', 'AAVE', 'ATOM', 'FIL', 'INJ',
  'CAKE', 'LUNC', 'FLOKI', 'LDO', 'PENDLE', 'AXS', 'TWT', 'COMP', 'APE',
  '1INCH', 'SNX', 'YFI', 'ZIL', 'ZETA', 'ROSE', 'SUSHI', 'KAVA',
];
