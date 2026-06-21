import { Autonoa } from './agent';

async function main() {
  const agent = new Autonoa();
  await agent.run();
}

main().catch((err) => {
  console.error('[Autonoa] Fatal error:', err);
  process.exit(1);
});
