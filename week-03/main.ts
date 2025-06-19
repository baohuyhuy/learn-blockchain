import { setWhirlpoolsConfig } from "@orca-so/whirlpools";
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

interface PoolData {
  poolAddress: string;
  price: number;
  tvl: number;
  liquidity: number;
  tokenSymbol: string;
}

class OrcaPoolMonitor {
  private currentPrice: number = 0;
  private abortController: AbortController | null = null;
  private poolAddress: Address | null = null;
  private rpc: RpcMainnet<SolanaRpcApiMainnet>;
  private rpcSubscriptions: RpcSubscriptionsMainnet<SolanaRpcSubscriptionsApi>;

  constructor() {
    this.rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));
    this.rpcSubscriptions = createSolanaRpcSubscriptions(
      mainnet("wss://api.mainnet-beta.solana.com")
    );
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
      console.error("Error finding largest TVL pool:", error);
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
    };
  }

  async monitorPoolPrice(
    poolAddress: Address | null = this.poolAddress
  ): Promise<void> {
    if (!poolAddress) {
      console.log("❌ No pool address to monitor");
      return;
    }

    // Set up an abort controller
    this.abortController = new AbortController();

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
        }
      }
    } catch (error) {
      if (this.abortController) {
        this.abortController.abort();
      }
      console.error("Error monitoring pool price:", error);
    }
  }

  stopMonitoring(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log(`🛑 Monitoring stopped for pool: ${this.poolAddress}`);
    }
  }
}

async function main() {
  // Get token addresses from command line arguments (skip first two argv entries)
  const tokenAddresses = (globalThis as any).process?.argv?.slice(2);

  if (!tokenAddresses || tokenAddresses.length === 0) {
    console.log("❌ Please provide at least one token address as an argument");
    console.log("Usage: npm start <TOKEN_ADDRESS_1> <TOKEN_ADDRESS_2> ...");
    console.log(
      "Example: npm start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"
    ); // USDC, USDT
    (globalThis as any).process?.exit(1);
    return;
  }

  // Validate token address formats
  for (const tokenAddress of tokenAddresses) {
    try {
      address(tokenAddress);
    } catch (error) {
      console.log(`❌ Invalid token address format: ${tokenAddress}`);
      (globalThis as any).process?.exit(1);
      return;
    }
  }

  await setWhirlpoolsConfig("solanaMainnet");
  const monitors: OrcaPoolMonitor[] = [];
  const monitorTasks: Promise<void>[] = [];

  // Set up a promise that resolves on SIGINT
  let stopPromiseResolve: (() => void) | null = null;
  const stopPromise = new Promise<void>((resolve) => {
    stopPromiseResolve = resolve;
    (globalThis as any).process?.on("SIGINT", () => {
      for (const monitor of monitors) {
        monitor.stopMonitoring();
      }
      resolve();
    });
  });

  try {
    for (const tokenAddress of tokenAddresses) {
      const monitor = new OrcaPoolMonitor();
      monitors.push(monitor);
      // Find the largest TVL pool for this token
      const pool = await monitor.findLargestTVLPool(tokenAddress);
      if (!pool) {
        console.log(
          `❌ Could not find a suitable pool for token: ${tokenAddress}`
        );
        continue;
      }
    }
    console.log("─".repeat(80) + "\n");
    console.log("Pools retrieved successfully");
    console.log("📈 Price changes will be displayed below:");
    console.log("─".repeat(80) + "\n");
    for (const monitor of monitors) {
      monitor.monitorPoolPrice();
    }

    // Wait until SIGINT is received
    await stopPromise;
    console.log("👋 Exiting...");
    (globalThis as any).process?.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    (globalThis as any).process?.exit(1);
  }
}

// Run the program
main().catch(console.error);
