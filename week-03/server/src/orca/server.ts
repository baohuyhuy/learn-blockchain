import {
  mainnet,
  address,
  Address,
  createSolanaRpcSubscriptions,
  RpcSubscriptionsMainnet,
  SolanaRpcSubscriptionsApi,
  RpcMainnet,
  SolanaRpcApiMainnet,
  createSolanaRpc,
} from "@solana/kit";
import { WSOL } from "./CONTANTS";
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";
import { Socket } from 'socket.io';


interface PoolData {
  poolAddress: string;
  price: number;
  tvl: number;
  liquidity: number;
  tokenSymbol: string;
  tokenAddress: string;
}

class OrcaPoolMonitor {
  private currentPrice: number = 0;
  private abortController: AbortController | null = null;
  private poolAddress: Address | null = null;
  private rpc: RpcMainnet<SolanaRpcApiMainnet>;
  private rpcSubscriptions: RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>;
  private client: Socket;

  constructor(client: Socket) {
    this.rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
    this.rpcSubscriptions = createSolanaRpcSubscriptions(
      mainnet("wss://api.mainnet-beta.solana.com")
    );
    this.client = client;
  }

	private clientEmit(event: string, data: any) {
	if (this.client) {
		this.client.emit(event, data);
	}
}

  async fetchPoolAddress(tokenMint: string, solMint: string): Promise<Address> {
    const params = new URLSearchParams();
    params.append("sortBy", "tvl");
    params.append("sortDirection", "desc");
    params.append("tokensBothOf", [tokenMint, solMint].join(","));
    const response = await fetch(
      `https://api.orca.so/v2/solana/pools?${params}`
    );
    const { data } = await response.json();
    return address(data[0].address);
  }

  async findLargestTVLPool(token: string): Promise<PoolData | null> {
    try {
      console.log(`🔍 Searching for pools with token: ${token}`);

      const tokenMintAddress = token;
      const solMintAddress = WSOL; // Wrapped SOL

      const poolAddress = await this.fetchPoolAddress(
        tokenMintAddress,
        solMintAddress
      );

      const pool = await this.fetchPoolData(poolAddress);

      this.poolAddress = address(pool.poolAddress);

      console.log(`🏆 Largest TVL pool: ${this.poolAddress.toString()}`);
      console.log(`💰 Liquidity: ${pool.liquidity}`);
      console.log(`TVL: ${pool.tvl}`);
      console.log(`📊 Current price: ${pool.price}`);

      return pool;
    } catch (error) {
      console.error("[Orca] Error finding largest TVL pool:", error);
      return null;
    }
  }

  async fetchPoolData(poolAddress: Address): Promise<PoolData> {
    const response = await fetch(
      `https://api.orca.so/v2/solana/pools/${poolAddress.toString()}`
    );
    const {
      data: { tvlUsdc, tokenA, tokenB },
    } = await response.json();

    const whirlpool = await fetchWhirlpool(this.rpc, poolAddress, {
      commitment: "finalized",
    });

    const { data } = whirlpool;

    const price = sqrtPriceToPrice(
      data.sqrtPrice,
      tokenA.decimals,
      tokenB.decimals
    );
    return {
      poolAddress: whirlpool.address,
      price: tokenA.symbol === "SOL" ? price : 1 / price,
      tvl: Number(tvlUsdc),
      liquidity: Number(data.liquidity),
      tokenSymbol: tokenA.symbol === "SOL" ? tokenB.symbol : tokenA.symbol,
	  tokenAddress: tokenA.symbol === "SOL" ? tokenB.address : tokenA.address,
    };
  }

  async monitorPoolPrice(poolAddress: Address | null = this.poolAddress): Promise<void> {
      if (!poolAddress) {
        console.log("[Orca] No pool address to monitor");
        return;
      }

      // Set up an abort controller
      this.abortController = new AbortController();

      try {
        // Subscribe to account notifications
        const accountNotifications = await this.rpcSubscriptions
          .accountNotifications(poolAddress, {
            commitment: "confirmed",
            encoding: "jsonParsed",
          })
          .subscribe({ abortSignal: this.abortController.signal });

        // Consume notifications
        try {
          for await (const _ of accountNotifications) {
            const poolData = await this.fetchPoolData(poolAddress);
            const newPrice = poolData.price;
            if (newPrice !== this.currentPrice) {
              this.currentPrice = newPrice;
              console.log(poolData);

              this.clientEmit('update', {
                platform: 'Orca',
                poolAddress: poolData.poolAddress,
                price: poolData.price,
                tvl: poolData.tvl,
                symbolName: poolData.tokenSymbol,
                mintB: poolData.tokenAddress,
              });
            }
          }
        } catch (error) {
          console.error("[Orca] Error in notification loop:", error);
          // Emit error to client
          this.clientEmit('error', {
            message: 'Pool monitoring error',
            details: error instanceof Error ? error.message : String(error)
          });
          // Implement retry logic or cleanup
          this.stopMonitoring();
        }
      } catch (error) {
        console.error("[Orca] WebSocket connection error:", error);
        // Emit error to client
        this.clientEmit('error', {
          message: 'WebSocket connection failed',
          details: error instanceof Error ? error.message : String(error)
        });
        // Clean up
        if (this.abortController) {
          this.abortController.abort();
        }
        // Optional: Implement exponential backoff retry
        await this.handleConnectionError();
      }
  }

  // Add this helper method for handling connection errors
  private async handleConnectionError(): Promise<void> {
      const retryDelay = 3000; // 5 seconds
      console.log(`[Orca] Retrying connection in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await this.monitorPoolPrice();
  }

  stopMonitoring(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log(`[Orca] Monitoring stopped for pool: ${this.poolAddress}`);
    }
  }
}

const monitors: OrcaPoolMonitor[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
    try {
      	const monitor = new OrcaPoolMonitor(client);
      	const pool = await monitor.findLargestTVLPool(tokenMint);

        console.log("[Orca] Fetched pool data:", pool);

      	monitor.monitorPoolPrice();
		monitors.push(monitor);
    } catch (error) {
        console.error("[Orca] Error in main function:", error);
    }
}

async function stopMonitor() {
	// Disconnect all OrcaPoolMonitor instances
	monitors.forEach((monitor) => {
		monitor.stopMonitoring();
	});

  // Clear the monitors array
  monitors.length = 0;
  console.log("[Orca] All pool monitors stopped.");
}

export { startMonitor, stopMonitor}