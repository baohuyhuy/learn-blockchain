import fetchHighestTVLPool from "./fetch_pool.js";
import decodePoolWithNode from "./decode_pool.js";
import { Socket } from 'socket.io';
import { SOL_MINT } from './CONSTANTS.js';
import Decimal from 'decimal.js';

// Set Decimal.js precision to 40 to handle large numbers accurately
Decimal.set({precision: 40});

interface PoolMonitor {
    poolId: string;
    poolType: string;
    poolLogoURI: string;
    tvl: string;
    mintA: string;
    mintB: string;
    decimalsA: number;
    decimalsB: number;
    mintASymbolName: string;
    mintBSymbolName: string;
    sqrtPriceX64?: string;
    liquidity?: string;
    client: Socket;
    lastPrice?: number;
    intervalId?: NodeJS.Timeout;
}

// Store active monitors by client ID
const clientMonitors = new Map<string, PoolMonitor[]>();

async function pollPoolData(monitor: PoolMonitor) {
	try {
		const result = await decodePoolWithNode(monitor.poolId, monitor.poolType);
		
		if (!result) {
			console.error(`[Raydium] Failed to decode pool ${monitor.poolId}`);
			return;
		}
		
		let price: Decimal | undefined;
		
		if (monitor.poolType === 'classic' || monitor.poolType === 'standard') {
			// Handle AMM pool
			const mintA = result.mintA;
			const mintB = result.mintB;
			
			const amountA = Decimal(result.mintAmountA || '0');
			const amountB = Decimal(result.mintAmountB || '0');
			
			if (amountA > Decimal(0) && amountB > Decimal(0)) {
				if (mintA === SOL_MINT) {
					price = amountB.div(amountA);
				} else if (mintB === SOL_MINT) {
					price = amountA.div(amountB);
				}
			}
		} 
		else if (monitor.poolType === 'clmm' || monitor.poolType === 'concentrated') {
			// Handle CLMM pool
			const poolPrice = new Decimal(result.price || '0');
			const decimalsA = result.decimalsA;
			const decimalsB = result.decimalsB;
			const mintA = result.mintA;
			const mintB = result.mintB;
			
			
			if (mintA === SOL_MINT) {
				price = poolPrice
			} else if (mintB === SOL_MINT) {
				price =  new Decimal(1).div(poolPrice);
			}
		}
		
		if (price) {
			const numericPrice = Number(price);
			
			console.log(`[Raydium] Price update for ${monitor.mintBSymbolName}: ${numericPrice}`);
			
			monitor.client.emit('update', {
				platform: 'Raydium',
				logoURI: monitor.poolLogoURI,
				poolAddress: monitor.poolId,
				symbolName: monitor.mintBSymbolName,
				price: numericPrice,
				tvl: Number(monitor.tvl),
				mintB: monitor.mintB,
			});
			
		}
	} catch (error) {
		console.error(`[Raydium] Error polling pool ${monitor.poolId}:`, error);
	}
}

async function startMonitor(tokenMint: string, client: Socket, pollingInterval: number) {
	try {
		const poolData = await fetchHighestTVLPool(tokenMint);
		console.log("[Raydium] Fetched pool data:", poolData);

		if (!poolData) {
			console.error("[Raydium] No pool data found for the given token.");
			return;
		}

		const poolId = poolData.id;
		const poolType = poolData.type;
		const poolLogoURI = poolData.logoURI;
		const poolTvl = poolData.tvl;
		const mintASymbolName = poolData.mintA.symbolName;
		const mintBSymbolName = poolData.mintB.symbolName;

		// Decode the pool using the node method
		const decodedPool = await decodePoolWithNode(poolId, poolType);
		if (!decodedPool) {
			console.error("[Raydium] Failed to decode the pool.");
			return;
		}

		// Create the monitor object
		const monitor: PoolMonitor = {
			poolId,
			poolType,
			poolLogoURI,
			tvl: poolTvl,
			mintA: decodedPool.mintA,
			mintB: decodedPool.mintB,
			decimalsA: decodedPool.decimalsA,
			decimalsB: decodedPool.decimalsB,
			mintASymbolName,
			mintBSymbolName,
			sqrtPriceX64: decodedPool.sqrtPriceX64,
			liquidity: decodedPool.liquidity,
			client
		};

		// Get initial price
		await pollPoolData(monitor);

		// Start polling
		const intervalId = setInterval(() => pollPoolData(monitor), pollingInterval);
		monitor.intervalId = intervalId;

		// Store the monitor
		if (!clientMonitors.has(client.id)) {
			clientMonitors.set(client.id, []);
		}
		clientMonitors.get(client.id)?.push(monitor);

		console.log(`[Raydium] Started polling for token ${tokenMint}, client ${client.id}`);
	} catch (error) {
		console.error("[Raydium] Error in startMonitor:", error);
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
		
		console.log(`[Raydium] Stopped ${monitors.length} monitors for client: ${client.id}`);
	} catch (error) {
		console.error(`[Raydium] Error stopping monitors for client ${client.id}:`, error);
	}
}

export { startMonitor, stopMonitor };