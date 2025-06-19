import { PublicKey } from "@solana/web3.js";
import * as readline from 'readline';
import { DLMMPriceTracker } from "./dlmm_swapInfo";
import { DAMMPriceTracker } from "./dammv2_swapInfo";

async function getRealtimeSwapPrice(tokenAddress: PublicKey): Promise<any> {
  const dlmmTracker = new DLMMPriceTracker(tokenAddress);
  const dammTracker = new DAMMPriceTracker(tokenAddress);

  const [dlmmResult, dammResult] = await Promise.allSettled([
    dlmmTracker.getHighestTvlPool(),
    dammTracker.getHighestTvlPool()
  ]);

  const dlmmPool = dlmmResult.status === 'fulfilled' && !dlmmResult.value.error ? dlmmResult.value : null;
  const dammPool = dammResult.status === 'fulfilled' && !dammResult.value.error ? dammResult.value : null;

  if (!dlmmPool && !dammPool) {
    return { error: "No pools found from both DLMM and DAMM protocols" };
  }

  if (dlmmPool && dammPool) {
    return dlmmPool.TVL > dammPool.TVL ? dlmmPool : dammPool;
  }

  return dlmmPool || dammPool;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const tokenAddressInput = await new Promise<string>(resolve => {
    rl.question("Enter token mint address: ", answer => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!tokenAddressInput) {
    console.error("No token address provided. Exiting.");
    return;
  }

  console.log("Waiting for fetching data");

  try {
    const tokenAddress = new PublicKey(tokenAddressInput);

    while (true) {
      const result = await getRealtimeSwapPrice(tokenAddress);
      console.clear();
      console.log(`[${new Date().toLocaleTimeString()}] SOL → Token Swap Info:`);
      console.log(JSON.stringify(result, null, 2));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);