import { Injectable } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { Socket } from 'socket.io';
import { IDexProvider } from '../../../../core/interfaces/price-monitor.interface';
import { IPoolMonitor } from './interfaces/meteora.interface';
import { DLMMPriceTracker } from './helpers/dlmm-swap-info.helper';
import { DAMMPriceTracker } from './helpers/dammv2-swap-info.helper';

@Injectable()
export class MeteoraProvider implements IDexProvider {  
  private clientMonitors = new Map<string, IPoolMonitor[]>();

	private async findHighestTvlPool(tokenAddress: PublicKey): Promise<{
		pool: any;
		tracker: DLMMPriceTracker | DAMMPriceTracker;
		protocolType: 'dlmm' | 'damm';
	} | { error: string }> {
		const dlmmTracker = new DLMMPriceTracker(tokenAddress);
		const dammTracker = new DAMMPriceTracker(tokenAddress);

		const [dlmmResult, dammResult] = await Promise.allSettled([
			dlmmTracker.getHighestTvlPool(),
			dammTracker.getHighestTvlPool()
		]);

		// console.log("[Meteora] DLMM Result:", dlmmResult);
		// console.log("[Meteora] DAMM Result:", dammResult);

		// Extract pool data, handling potential errors
		const dlmmPool = dlmmResult.status === 'fulfilled' && dlmmResult.value ? dlmmResult.value : null;
		const dammPool = dammResult.status === 'fulfilled' && dammResult.value ? dammResult.value : null;

		// If both protocols returned errors, return an error
		if (!dlmmPool && !dammPool) {
			return { error: "No pools found from both DLMM and DAMM protocols" };
		}

		// If one protocol has an error but the other doesn't, return the successful one
		if (!dlmmPool && dammPool) {
			console.log(`[Meteora] DLMM returned error, using DAMM pool`);
			return { pool: dammPool, tracker: dammTracker, protocolType: 'damm' };
		}

		if (dlmmPool && !dammPool) {
			console.log(`[Meteora] DAMM returned error, using DLMM pool`);
			return { pool: dlmmPool, tracker: dlmmTracker, protocolType: 'dlmm' };
		}

		// If both protocols returned valid pools, compare TVL and return the one with higher TVL
		const dlmmTvl = parseFloat(dlmmPool.tvl || "0");
		const dammTvl = parseFloat(dammPool.tvl || "0");
		console.log(`[Meteora] Comparing TVL - DLMM: ${dlmmTvl}, DAMM: ${dammTvl}`);
		
		if (dlmmTvl > dammTvl) {
			return { pool: dlmmPool, tracker: dlmmTracker, protocolType: 'dlmm' };
		} else {
			return { pool: dammPool, tracker: dammTracker, protocolType: 'damm' };
		}
	}

	private async pollPoolData(monitor: IPoolMonitor) {
		try {
			if (!monitor.pool || !monitor.tracker) {
				console.error(`[Meteora] Missing pool or tracker for token ${monitor.tokenMint}`);
				return;
			}

			let result: any;
			// Determine which tracker to use based on the protocol type
			if (monitor.protocolType === 'dlmm') {
				result = await (monitor.tracker as DLMMPriceTracker).getPriceByPool(monitor.pool);
			} else {
				result = await (monitor.tracker as DAMMPriceTracker).getPriceByPool(monitor.pool);
			}

			if (result.error) {
				console.error(`[Meteora] Error polling for token ${monitor.tokenMint}:`, result.error);
				return;
			}

			console.log(`[Meteora] Price update for token ${monitor.tokenMint}:`, result);
			
			monitor.client.emit('update', result);

		} catch (error) {
			console.error(`[Meteora] Error polling for token ${monitor.tokenMint}:`, error);
		}
	}

  async startMonitor(
    tokenMint: string, 
    client: Socket, 
    pollingInterval: number,
  ): Promise<void> {
		  try {
				// First, find the highest TVL pool
				const highestTvlPoolResult = await this.findHighestTvlPool(new PublicKey(tokenMint));

				if ('error' in highestTvlPoolResult) {
					console.error(`[Meteora] Error finding highest TVL pool for token ${tokenMint}:`, highestTvlPoolResult.error);
					return;
				}
				
				// Create the monitor object with the pool and tracker information
				const monitor: IPoolMonitor = {
					tokenMint,
					client,
					pool: highestTvlPoolResult.pool,
					tracker: highestTvlPoolResult.tracker,
					protocolType: highestTvlPoolResult.protocolType
				};
				
				// Start polling
				const intervalId = setInterval(() => this.pollPoolData(monitor), pollingInterval);
				monitor.intervalId = intervalId;
				
				// Store the monitor
				if (!this.clientMonitors.has(client.id)) {
					this.clientMonitors.set(client.id, []);
				}
				this.clientMonitors.get(client.id)?.push(monitor);
				
				console.log(`[Meteora] Started polling for token ${tokenMint}, client ${client.id}`);
			} catch (error) {
				console.error("[Meteora] Error in startMonitor:", error);
				client.emit('error', {
					message: 'Failed to start Meteora monitoring',
					details: error instanceof Error ? error.message : String(error)
				});
			}
	}

  async stopMonitor(client: Socket): Promise<void> {
		try {
			const monitors = this.clientMonitors.get(client.id) || [];
			
			// Stop all intervals for this client
			for (const monitor of monitors) {
				if (monitor.intervalId) {
					clearInterval(monitor.intervalId);
					console.log(`[Meteora] Stopped polling for token ${monitor.tokenMint}`);
				}
			}
			
			// Remove client from map
			this.clientMonitors.delete(client.id);
			
			console.log(`[Meteora] Stopped ${monitors.length} monitors for client: ${client.id}`);
		} catch (error) {
			console.error(`[Meteora] Error stopping monitors for client ${client.id}:`, error);
		}
  }
}
