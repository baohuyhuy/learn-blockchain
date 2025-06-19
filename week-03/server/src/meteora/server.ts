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

// async function trackSingleToken(tokenAddress: string): Promise<void> {
//   try {
//     const result = await getRealtimeSwapPrice(new PublicKey(tokenAddress));
//     const timestamp = new Date().toLocaleTimeString();
    
//     console.log(`[${timestamp}] Token: ${tokenAddress}`);
//     console.log(JSON.stringify(result, null, 2));
//     console.log('---');
//   } catch (error: any) {
//     const timestamp = new Date().toLocaleTimeString();
//     console.log(`[${timestamp}] Token: ${tokenAddress}`);
//     console.log(JSON.stringify({ error: error.message }, null, 2));
//     console.log('---');
//   }
// }

// async function main() {
  
//   if (tokenAddresses.length === 0) {
//     console.error('No valid token addresses found in token.txt');
//     return;
//   }

//   console.log(`Starting price tracking for tokens\n`);

//   // Track all tokens in parallel
//   const trackingPromises = tokenAddresses.map((tokenAddress, index) => {
//     const trackToken = async () => {
//       // Stagger start times
//       await new Promise(resolve => setTimeout(resolve, index * 300));
      
//       while (true) {
//         if (stop) {
//           console.log(`Stopping tracking for token: ${tokenAddress}`);
//           break;
//         }

//         await trackSingleToken(tokenAddress);
//         // Different intervals for each token to spread load
//         const interval = 3000 + (index * 500);
//         await new Promise(resolve => setTimeout(resolve, interval));
//       }
//     };
//     return trackToken();
//   });

//   await Promise.all(trackingPromises);
// }

class TokenTracker {
  private abortController: AbortController;
  private tokenMint: string;
  private client: Socket;

  constructor(tokenMint: string, client: Socket) {
    this.tokenMint = tokenMint;
    this.client = client;
    this.abortController = new AbortController();
  }

  private clientEmit(event: string, data: any) {
    if (this.client) {
      this.client.emit(event, data);
    }
  }

  async start() {
    console.log(`Starting tracking for token: ${this.tokenMint}`);
    
    while (!this.abortController.signal.aborted) {
      try {
        const result = await getRealtimeSwapPrice(new PublicKey(this.tokenMint));
        this.clientEmit('update', result);
        
        // Use abortable timeout
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 3000)),
          new Promise((_, reject) => {
            this.abortController.signal.addEventListener('abort', () => 
              reject(new Error('Tracking aborted'))
            );
          })
        ]);

      } catch (error: any) {
        if (this.abortController.signal.aborted) {
          console.log(`Tracking aborted for token: ${this.tokenMint}`);
          break;
        }
        console.error(`[${new Date().toLocaleTimeString()}] Error tracking token ${this.tokenMint}: ${error.message}`);
      }
    }
  }

  stopTracking() {
    console.log(`Stopping tracking for token: ${this.tokenMint}`);
    this.abortController.abort();
  }
}

const tokenList: TokenTracker[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
    try {
        const tracker = new TokenTracker(tokenMint, client);
        tokenList.push(tracker);
        await tracker.start();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

async function stopMonitor() {
    for (const tracker of tokenList) {
        tracker.stopTracking();
    }
    tokenList.length = 0; // Clear the list
}

export { startMonitor, stopMonitor };