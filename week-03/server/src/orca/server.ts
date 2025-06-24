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

interface SubscriptionData {
  poolAddress: Address;
  tokenMint: string;
  client: Socket;
  subscriptionId: string;
  currentPrice: number;
  tokenSymbol: string;
}

// Singleton class to manage a single WebSocket connection with multiple subscriptions
class OrcaPoolManager {
  private static instance: OrcaPoolManager;
  private rpc: RpcMainnet<SolanaRpcApiMainnet>;
  private rpcSubscriptions: RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>;
  private subscriptions: Map<string, SubscriptionData> = new Map();
  private clientTokens: Map<string, string[]> = new Map();
  private abortController: AbortController | null = null;
  private isConnected: boolean = false;

  private constructor() {
    this.rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
    this.rpcSubscriptions = createSolanaRpcSubscriptions(
      mainnet("wss://api.mainnet-beta.solana.com")
    );
    this.abortController = new AbortController();
  }

  public static getInstance(): OrcaPoolManager {
    if (!OrcaPoolManager.instance) {
      OrcaPoolManager.instance = new OrcaPoolManager();
    }
    return OrcaPoolManager.instance;
  }

  private async connectIfNeeded(): Promise<void> {
    if (!this.isConnected) {
      console.log("[Orca] Initializing WebSocket connection...");
      this.isConnected = true;
    }
  }

  public async addPoolSubscription(tokenMint: string, client: Socket): Promise<void> {
    try {
      await this.connectIfNeeded();

      // Track this token for the client
      if (!this.clientTokens.has(client.id)) {
        this.clientTokens.set(client.id, []);
      }
      this.clientTokens.get(client.id)?.push(tokenMint);

      // Find the pool for this token
      const poolData = await this.findLargestTVLPool(tokenMint);
      if (!poolData) {
        console.error(`[Orca] Could not find pool for token: ${tokenMint}`);
        return;
      }

      const poolAddress = address(poolData.poolAddress);
      
      // Subscribe to this pool
      const subscription = await this.rpcSubscriptions
        .accountNotifications(poolAddress, {
          commitment: "confirmed",
          encoding: "jsonParsed",
        })
        .subscribe({ abortSignal: this.abortController ? this.abortController.signal : new AbortController().signal });
      
      // Store subscription info
      const subscriptionId = String(Date.now()); // Generate a unique ID
      this.subscriptions.set(subscriptionId, {
        poolAddress,
        tokenMint,
        client,
        subscriptionId,
        currentPrice: poolData.price,
        tokenSymbol: poolData.tokenSymbol
      });

      // Process subscription updates
      this.monitorSubscription(subscriptionId, subscription);
      
      console.log(`[Orca] Added subscription for token ${tokenMint}, client ${client.id}`);
      console.log(`[Orca] Now monitoring ${this.subscriptions.size} pools`);
    } catch (error) {
      console.error(`[Orca] Error adding subscription for token ${tokenMint}:`, error);
      client.emit('error', {
        message: 'Failed to add pool subscription',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async monitorSubscription(
    subscriptionId: string, 
    subscription: AsyncIterable<any>
  ): Promise<void> {
    try {
      for await (const _ of subscription) {
        const subData = this.subscriptions.get(subscriptionId);
        if (!subData) {
          console.log(`[Orca] Subscription ${subscriptionId} no longer exists, stopping monitor`);
          break;
        }

        const poolData = await this.fetchPoolData(subData.poolAddress);
        if (poolData.price !== subData.currentPrice) {
          // Update current price
          subData.currentPrice = poolData.price;
          this.subscriptions.set(subscriptionId, subData);

          // Emit update to client
          subData.client.emit('update', {
            platform: 'Orca',
            poolAddress: poolData.poolAddress,
            price: poolData.price,
            tvl: poolData.tvl,
            symbolName: poolData.tokenSymbol,
            mintB: poolData.tokenAddress,
          });

          console.log(`[Orca] Price update for ${subData.tokenSymbol}: ${poolData.price}`);
        }
      }
    } catch (error) {
      console.error(`[Orca] Error in subscription ${subscriptionId}:`, error);
      const subData = this.subscriptions.get(subscriptionId);
      if (subData) {
        subData.client.emit('error', {
          message: 'Pool monitoring error',
          details: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  public removeClientSubscriptions(client: Socket): void {
    const clientId = client.id;
    
    // Find all subscriptions for this client
    const subscriptionsToRemove: string[] = [];
    for (const [id, subData] of this.subscriptions.entries()) {
      if (subData.client.id === clientId) {
        subscriptionsToRemove.push(id);
      }
    }
    
    // Remove each subscription
    for (const id of subscriptionsToRemove) {
      this.subscriptions.delete(id);
    }
    
    // Remove client from token tracking
    this.clientTokens.delete(clientId);
    
    console.log(`[Orca] Removed ${subscriptionsToRemove.length} subscriptions for client ${clientId}`);
    
    // If no more subscriptions, close the connection
    if (this.subscriptions.size === 0 && this.abortController) {
      this.abortController.abort();
      this.abortController = new AbortController();
      this.isConnected = false;
      console.log("[Orca] No more active subscriptions, closed WebSocket connection");
    }
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

      console.log(`🏆 Largest TVL pool: ${pool.poolAddress}`);
      console.log(`💰 Liquidity: ${pool.liquidity}`);
      console.log(`TVL: ${pool.tvl}`);
      console.log(`📊 Current price: ${pool.price}`);

      return pool;
    } catch (error) {
      console.error("[Orca] Error finding largest TVL pool:", error);
      return null;
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
}

// Export the public API functions
async function startMonitor(tokenMint: string, client: Socket) {
  try {
    const manager = OrcaPoolManager.getInstance();
    await manager.addPoolSubscription(tokenMint, client);
  } catch (error) {
    console.error("[Orca] Error starting monitor:", error);
  }
}

async function stopMonitor(client: Socket) {
  try {
    const manager = OrcaPoolManager.getInstance();
    manager.removeClientSubscriptions(client);
  } catch (error) {
    console.error("[Orca] Error stopping monitor:", error);
  }
}

export { startMonitor, stopMonitor }