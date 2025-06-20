import { PublicKey } from "@solana/web3.js";
import { DLMMPriceTracker } from "./dlmm_swapInfo";
import { DAMMPriceTracker } from "./dammv2_swapInfo";
import { Socket } from 'socket.io';

async function getRealtimeSwapPrice(tokenAddress: PublicKey): Promise<any> {
  const dlmmTracker = new DLMMPriceTracker(tokenAddress);
  const dammTracker = new DAMMPriceTracker(tokenAddress);

  const [dlmmResult, dammResult] = await Promise.allSettled([
    dlmmTracker.getHighestTvlPool(),
    dammTracker.getHighestTvlPool()
  ]);

  console.log("DLMM Result:", dlmmResult);
  console.log("DAMM Result:", dammResult);

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

class TokenTracker {
  private stop: boolean = false;
  private tokenMint: string;
  private client: Socket;

  constructor(tokenMint: string, client: Socket) {
    this.tokenMint = tokenMint;
    this.client = client;
  }

  private clientEmit(event: string, data: any) {
    if (this.client) {
      this.client.emit(event, data);
    }
  }

  async start() {
    console.log(`[Meteora] Starting tracking for token: ${this.tokenMint}`);
    
    while (!this.stop) {
      try {
        const result = await getRealtimeSwapPrice(new PublicKey(this.tokenMint));

        if (result.error) {
          console.error(`[Meteora] [Error] Token: ${this.tokenMint}`, result.error);
          continue;
        }

        console.log(`[Meteora] [Token: ${this.tokenMint}]`, result);
        this.clientEmit('update', result);
      } catch (error: any) {
        console.error(`[Meteora] [Error] Token: ${this.tokenMint}`, error.message);
      }

      // Wait for a fixed interval before the next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  stopTracking() {
    console.log(`[Meteora] Stopping tracking for token: ${this.tokenMint}`);
    this.stop = true;
  }
}

const tokenList: { tracker: TokenTracker; promise: Promise<void> }[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
    try {
        const tracker = new TokenTracker(tokenMint, client);
        const promise = tracker.start();

        // Store the tracker and its promise in the tokenList
        tokenList.push({ tracker, promise }); // Ignore 'await' here to avoid running only first tracker
    } catch (error) {
        console.error("[Meteora] Error in startMonitor:", error);
    }
}

async function stopMonitor() {
    for (const { tracker } of tokenList) {
        tracker.stopTracking();
    }

    // Wait for all trackers to finish their start loops
    await Promise.all(tokenList.map(({ promise }) => promise));
    console.log("[Meteora] All token trackers stopped.");

    tokenList.length = 0; // Clear the list
}


export { startMonitor, stopMonitor };