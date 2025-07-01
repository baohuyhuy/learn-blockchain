import { Injectable } from '@nestjs/common';
import {
  mainnet,
  address,
  Address,
  createSolanaRpc,
} from "@solana/kit";
import { BLOCKCHAIN_CONSTANTS } from '../../../../core/constants/blockchain.constants';
import { fetchWhirlpool } from "@orca-so/whirlpools-client";
import { sqrtPriceToPrice } from "@orca-so/whirlpools-core";
import { Socket } from 'socket.io';
import { IDexProvider } from '../../../../core/interfaces/price-monitor.interface';
import { IPoolMonitor, IPoolData } from './interfaces/orca.interface';

@Injectable()
export class OrcaProvider implements IDexProvider {
		private rpc = createSolanaRpc(mainnet(BLOCKCHAIN_CONSTANTS.SOLANA_MAINNET_RPC));
  	private clientMonitors = new Map<string, IPoolMonitor[]>();

    private async fetchPoolAddress(tokenMint: string, solMint: string): Promise<Address> {
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

    private async fetchIPoolData(poolAddress: Address): Promise<IPoolData> {
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
				imgURL: tokenA.symbol === "SOL" ? tokenB.imageUrl : tokenA.imageUrl,
			};
    }

    private async pollIPoolData(monitor: IPoolMonitor) {
			try {
				const IPoolData = await this.fetchIPoolData(monitor.poolAddress);
				
				console.log(`[Orca] Price update for ${monitor.tokenSymbol}: ${IPoolData.price}`);
				
				monitor.client.emit('update', {
					platform: 'Orca',
					poolAddress: IPoolData.poolAddress,
					price: IPoolData.price,
					tvl: IPoolData.tvl,
					symbolName: IPoolData.tokenSymbol,
					mintB: IPoolData.tokenAddress,
					logoURI: IPoolData.imgURL,
				});
					
			} catch (error) {
				console.error(`[Orca] Error polling pool ${monitor.poolAddress}:`, error);
			}
			}

			private async findLargestTVLPool(token: string): Promise<IPoolData | null> {
				try {
					console.log(`🔍 [Orca] Searching for pools with token: ${token}`);

					const tokenMintAddress = token;
					const solMintAddress = BLOCKCHAIN_CONSTANTS.SOL_MINT;

					const poolAddress = await this.fetchPoolAddress(
					tokenMintAddress,
					solMintAddress
					);

					const pool = await this.fetchIPoolData(poolAddress);

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

  async startMonitor(
    tokenMint: string, 
    client: Socket, 
    pollingInterval: number
  ): Promise<void> {
		try {
			const IPoolData = await this.findLargestTVLPool(tokenMint);
			
			if (!IPoolData) {
				console.error(`[Orca] Could not find pool for token: ${tokenMint}`);
				return;
			}
			
			const poolAddress = address(IPoolData.poolAddress);
			
			// Create the monitor object
			const monitor: IPoolMonitor = {
				poolAddress,
				tokenMint,
				tokenSymbol: IPoolData.tokenSymbol,
				client,
				lastPrice: IPoolData.price
			};
			
			// Start polling
			const intervalId = setInterval(() => this.pollIPoolData(monitor), pollingInterval);
			monitor.intervalId = intervalId;
			
			// Store the monitor
			if (!this.clientMonitors.has(client.id)) {
				this.clientMonitors.set(client.id, []);
			}
			this.clientMonitors.get(client.id)?.push(monitor);
			
			console.log(`[Orca] Started polling for token ${tokenMint}, client ${client.id}`);
			
			// Send initial update immediately
			await this.pollIPoolData(monitor);
			
		} catch (error) {
			console.error(`[Orca] Error starting monitor for token ${tokenMint}:`, error);
			client.emit('error', {
				message: 'Failed to start pool monitoring',
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
				}
			}
			
			// Remove client from map
			this.clientMonitors.delete(client.id);
			
			console.log(`[Orca] Stopped ${monitors.length} monitors for client: ${client.id}`);
		} catch (error) {
			console.error(`[Orca] Error stopping monitors for client ${client.id}:`, error);
		}
  }
}
