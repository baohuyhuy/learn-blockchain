import {
  mainnet,
  address,
  Address,
  createSolanaRpc,
} from "@solana/kit";
import { WSOL } from "./constants";
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

interface PoolMonitor {
  poolAddress: Address;
  tokenMint: string;
  tokenSymbol: string;
  client: Socket;
  lastPrice: number;
  intervalId?: NodeJS.Timeout;
}

// Create a shared RPC client
const rpc = createSolanaRpc(mainnet("https://api.mainnet-beta.solana.com"));

// Map of active monitors by client ID
const clientMonitors = new Map<string, PoolMonitor[]>();

async function fetchPoolAddress(tokenMint: string, solMint: string): Promise<Address> {
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

async function fetchPoolData(poolAddress: Address): Promise<PoolData> {
  const response = await fetch(
    `https://api.orca.so/v2/solana/pools/${poolAddress.toString()}`
  );
  const {
    data: { tvlUsdc, tokenA, tokenB },
  } = await response.json();

  const whirlpool = await fetchWhirlpool(rpc, poolAddress, {
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

async function pollPoolData(monitor: PoolMonitor) {
  try {
    const poolData = await fetchPoolData(monitor.poolAddress);
     
    console.log(`[Orca] Price update for ${monitor.tokenSymbol}: ${poolData.price}`);
    
    monitor.client.emit('update', {
      platform: 'Orca',
      poolAddress: poolData.poolAddress,
      price: poolData.price,
      tvl: poolData.tvl,
      symbolName: poolData.tokenSymbol,
      mintB: poolData.tokenAddress,
    });
    
  } catch (error) {
    console.error(`[Orca] Error polling pool ${monitor.poolAddress}:`, error);
  }
}

async function findLargestTVLPool(token: string): Promise<PoolData | null> {
  try {
    console.log(`🔍 [Orca] Searching for pools with token: ${token}`);

    const tokenMintAddress = token;
    const solMintAddress = WSOL; // Wrapped SOL

    const poolAddress = await fetchPoolAddress(
      tokenMintAddress,
      solMintAddress
    );

    const pool = await fetchPoolData(poolAddress);

    console.log(`🏆 [Orca] Largest TVL pool: ${pool.poolAddress}`);
    console.log(`💰 [Orca] Liquidity: ${pool.liquidity}`);
    console.log(`[Orca] TVL: ${pool.tvl}`);
    console.log(`📊 [Orca] Current price: ${pool.price}`);

    return pool;
  } catch (error) {
    console.error("[Orca] Error finding largest TVL pool:", error);
    return null;
  }
}

async function startMonitor(tokenMint: string, client: Socket, pollingInterval: number) {
  try {
    const poolData = await findLargestTVLPool(tokenMint);
    
    if (!poolData) {
      console.error(`[Orca] Could not find pool for token: ${tokenMint}`);
      return;
    }
    
    const poolAddress = address(poolData.poolAddress);
    
    // Create the monitor object
    const monitor: PoolMonitor = {
      poolAddress,
      tokenMint,
      tokenSymbol: poolData.tokenSymbol,
      client,
      lastPrice: poolData.price
    };
    
    // Start polling
    const intervalId = setInterval(() => pollPoolData(monitor), pollingInterval);
    monitor.intervalId = intervalId;
    
    // Store the monitor
    if (!clientMonitors.has(client.id)) {
      clientMonitors.set(client.id, []);
    }
    clientMonitors.get(client.id)?.push(monitor);
    
    console.log(`[Orca] Started polling for token ${tokenMint}, client ${client.id}`);
    
    // Send initial update immediately
    await pollPoolData(monitor);
    
  } catch (error) {
    console.error(`[Orca] Error starting monitor for token ${tokenMint}:`, error);
    client.emit('error', {
      message: 'Failed to start pool monitoring',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function stopMonitor(client: Socket) {
  try {
    const monitors = clientMonitors.get(client.id) || [];
    
    // Stop all intervals for this client
    for (const monitor of monitors) {
      if (monitor.intervalId) {
        clearInterval(monitor.intervalId);
      }
    }
    
    // Remove client from map
    clientMonitors.delete(client.id);
    
    console.log(`[Orca] Stopped ${monitors.length} monitors for client: ${client.id}`);
  } catch (error) {
    console.error(`[Orca] Error stopping monitors for client ${client.id}:`, error);
  }
}

export { startMonitor, stopMonitor };