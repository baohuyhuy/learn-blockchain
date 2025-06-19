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

      console.log(`🏆 Largest TVL pool: ${pool.poolAddress}`);
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
      commitment: "confirmed",
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

  async monitorPoolPrice(poolAddress: Address): Promise<void> {
    console.log(
      `🔍 Starting price monitoring for pool: ${poolAddress.toString()}`
    );
    console.log("📈 Price changes will be displayed below:");
    console.log("─".repeat(80));

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
      console.log("\n🛑 Monitoring stopped");
    }
  }
}

async function main() {
  // Get token address from command line arguments
  const tokenAddress = (globalThis as any).process?.argv?.[2];

  if (!tokenAddress) {
    console.log("❌ Please provide a token address as an argument");
    console.log("Usage: npm start <TOKEN_ADDRESS>");
    console.log(
      "Example: npm start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    ); // USDC
    (globalThis as any).process?.exit(1);
    return;
  }

  // Validate token address format
  try {
    address(tokenAddress);
  } catch (error) {
    console.log("❌ Invalid token address format");
    (globalThis as any).process?.exit(1);
    return;
  }

  await setWhirlpoolsConfig("solanaMainnet");
  const monitor = new OrcaPoolMonitor();

  // Set up a promise that resolves on SIGINT
  let stopPromiseResolve: (() => void) | null = null;
  const stopPromise = new Promise<void>((resolve) => {
    stopPromiseResolve = resolve;
    (globalThis as any).process?.on("SIGINT", () => {
      monitor.stopMonitoring();
      resolve();
    });
  });

  try {
    // Find the largest TVL pool
    const pool = await monitor.findLargestTVLPool(tokenAddress);

    if (!pool) {
      console.log("❌ Could not find a suitable pool");
      (globalThis as any).process?.exit(1);
      return;
    }

    // Start monitoring (do not await, let it run)
    monitor.monitorPoolPrice(address(pool.poolAddress));

    // Wait until SIGINT is received
    await stopPromise;
    console.log("👋 Exiting...");
    // (globalThis as any).process?.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    (globalThis as any).process?.exit(1);
  }
}

// Run the program
main().catch(console.error);
