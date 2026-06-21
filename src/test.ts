/**
 * Autonoa — dry-run test
 * Runs one full cycle (init → fetch → filter → execute) with mocks.
 * No API keys required.
 */
process.env.BNB_API_KEY = 'test_bnb_key';
process.env.TRUST_WALLET_API_KEY = 'test_twak_key';
process.env.CMC_API_KEY = 'test_cmc_key';

import { Autonoa } from './agent';

async function test() {
  const agent = new Autonoa();

  // Override CMC fetch to return mock signals
  (agent as any).fetchCMCSignals = async () => [
    {
      symbol: 'BNB',
      name: 'BNB',
      price: 580,
      priceChange24h: 8.2,
      volume24h: 2_500_000_000,
      volumeChange24h: 22.5,
      marketCap: 88_000_000_000,
      tokenAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      chain: 'bsc',
      sentiment: 'bullish',
      confidence: 78,
    },
    {
      symbol: 'CAKE',
      name: 'PancakeSwap',
      price: 2.4,
      priceChange24h: -3.1,
      volume24h: 180_000_000,
      volumeChange24h: 5.2,
      marketCap: 620_000_000,
      tokenAddress: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      chain: 'bsc',
      sentiment: 'bearish',
      confidence: 12,
    },
    {
      symbol: 'TWT',
      name: 'Trust Wallet Token',
      price: 1.1,
      priceChange24h: 12.5,
      volume24h: 95_000_000,
      volumeChange24h: 45.0,
      marketCap: 460_000_000,
      tokenAddress: '0x4B0F1812e5Df2A09796481Ff14017e6005508003',
      chain: 'bsc',
      sentiment: 'bullish',
      confidence: 85,
    },
  ];

  await agent.initialize();
  console.log('\n[test] Running one tick...\n');
  await (agent as any).tick();
  console.log('\n[test] Done.');
}

test().catch((err) => {
  console.error('[test] Failed:', err);
  process.exit(1);
});
