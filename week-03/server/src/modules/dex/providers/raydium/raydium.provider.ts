import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { IDexProvider } from '../../../../core/interfaces/price-monitor.interface';
import { BLOCKCHAIN_CONSTANTS } from '../../../../core/constants';
import { IPoolMonitor } from './interfaces/raydium.interface';

// Import existing Raydium functions (we'll move these here)
import fetchHighestTVLPool from './helpers/fetch-pool.helper';
import decodePoolWithNode from './helpers/decode-pool.helper';

import { Decimal } from 'decimal.js';

Decimal.set({precision: 40});

@Injectable()
export class RaydiumProvider implements IDexProvider {
  
  // Store active monitors by client ID
  private clientMonitors = new Map<string, IPoolMonitor[]>();

  private async pollPoolData(monitor: IPoolMonitor) {
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
					if (mintA === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
						price = amountB.div(amountA);
					} else if (mintB === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
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


				if (mintA === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
					price = poolPrice
				} else if (mintB === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
					price = new Decimal(1).div(poolPrice);
				}
			}

			if (price) {
				const numericPrice = Number(price);

				console.log(`[Raydium] Price update for ${monitor.mintBSymbolName}: ${numericPrice}`);

				monitor.client.emit('update', {
					platform: 'Raydium',
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

  async startMonitor(
    tokenMint: string, 
    client: Socket, 
    pollingInterval: number
  ): Promise<void> {
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

			// Ensure mintA is SOL, mintB is token
			let finalDecoded = decodedPool;
			let finalMintASymbolName = mintASymbolName;
			let finalMintBSymbolName = mintBSymbolName;
			if (decodedPool.mintA !== BLOCKCHAIN_CONSTANTS.SOL_MINT && decodedPool.mintB === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
				finalDecoded = {
					...decodedPool,
					mintA: decodedPool.mintB,
					mintB: decodedPool.mintA,
					decimalsA: decodedPool.decimalsB,
					decimalsB: decodedPool.decimalsA,

				};
				finalMintASymbolName = decodedPool.mintBSymbolName;
				finalMintBSymbolName = decodedPool.mintASymbolName;
			}

			// Create the monitor object
			const monitor: IPoolMonitor = {
				poolId,
				poolType,
				poolLogoURI,
				tvl: poolTvl,
				mintA: finalDecoded.mintA,
				mintB: finalDecoded.mintB,
				decimalsA: finalDecoded.decimalsA,
				decimalsB: finalDecoded.decimalsB,
				mintASymbolName: finalMintASymbolName,
				mintBSymbolName: finalMintBSymbolName,
				sqrtPriceX64: finalDecoded.sqrtPriceX64,
				liquidity: finalDecoded.liquidity,
				client
			};

			// Start polling
			const intervalId = setInterval(() => this.pollPoolData(monitor), pollingInterval);
			monitor.intervalId = intervalId;

			// Store the monitor
			if (!this.clientMonitors.has(client.id)) {
				this.clientMonitors.set(client.id, []);
			}
			this.clientMonitors.get(client.id)?.push(monitor);

			console.log(`[Raydium] Started polling for token ${tokenMint}, client ${client.id}`);
		} catch (error) {
			console.error("[Raydium] Error in startMonitor:", error);
		}
  }

  async stopMonitor(client: Socket): Promise<void> {
		try {
			const monitors = this.clientMonitors.get(client.id) || [];

			// Stop all intervals for this client
			for (const monitor of monitors) {
				if (monitor.intervalId) {
					clearInterval(monitor.intervalId);
				}
			}

			// Remove client from map
			this.clientMonitors.delete(client.id);

			console.log(`[Raydium] Stopped ${monitors.length} monitors for client: ${client.id}`);
		} catch (error) {
			console.error(`[Raydium] Error stopping monitors for client ${client.id}:`, error);
		}
  }
}
