import { Socket } from 'socket.io';
import { DLMMPriceTracker } from '../helpers/dlmm-swap-info.helper';
import { DAMMPriceTracker } from '../helpers/dammv2-swap-info.helper';

export interface IPoolResult {
  poolAddress: string;
  tvl: number;
  tokenSymbol: string;
  tokenAddress: string;
  price: number | null;
}

export interface IDAMMPoolData {
  pool_address: string;
  token_a_mint: string;
  token_b_mint: string;
  token_a_amount: string;
  token_b_amount: string;
  tvl: string;
  fee_bps: number;
  token_a_symbol?: string;
  token_b_symbol?: string;
  pool_price?: string;
}

export interface IDLMMPoolData {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  liquidity: string;
  current_price: number;
  mint_x_symbol?: string;
  mint_y_symbol?: string;
}

export interface IPoolMonitor {
  tokenMint: string;
  client: Socket;
  lastPrice?: number;
  pool?: any;
  tracker?: DLMMPriceTracker | DAMMPriceTracker;
  protocolType?: 'dlmm' | 'damm';
  intervalId?: NodeJS.Timeout;
}