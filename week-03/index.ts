import { PublicKey } from "@solana/web3.js";
import * as fs from 'fs';
import * as path from 'path';
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

function readTokensFromFile(): string[] {
  const filePath = path.join(__dirname, 'token.txt');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'));
  } catch (error) {
    console.error(`Error reading token.txt: ${error}`);
    return [];
  }
}

async function trackSingleToken(tokenAddress: string): Promise<void> {
  try {
    const result = await getRealtimeSwapPrice(new PublicKey(tokenAddress));
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[${timestamp}] Token: ${tokenAddress}`);
    console.log(JSON.stringify(result, null, 2));
    console.log('---');
  } catch (error: any) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Token: ${tokenAddress}`);
    console.log(JSON.stringify({ error: error.message }, null, 2));
    console.log('---');
  }
}

async function main() {
  const tokenAddresses = readTokensFromFile();
  
  if (tokenAddresses.length === 0) {
    console.error('No valid token addresses found in token.txt');
    return;
  }

  console.log(`Starting price tracking for tokens\n`);

  // Track all tokens in parallel
  const trackingPromises = tokenAddresses.map((tokenAddress, index) => {
    const trackToken = async () => {
      // Stagger start times
      await new Promise(resolve => setTimeout(resolve, index * 300));
      
      while (true) {
        await trackSingleToken(tokenAddress);
        // Different intervals for each token to spread load
        const interval = 3000 + (index * 500);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    };
    return trackToken();
  });

  await Promise.all(trackingPromises);
}

main().catch(console.error);