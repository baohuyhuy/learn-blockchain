import { Address } from "@solana/kit";
import { Socket } from 'socket.io';

export interface IPoolData {
  poolAddress: string;
  price: number;
  tvl: number;
  liquidity: number;
  tokenSymbol: string;
  tokenAddress: string;
  imgURL: string;
}

export interface IPoolMonitor {
  poolAddress: Address;
  tokenMint: string;
  tokenSymbol: string;
  client: Socket;
  lastPrice: number;
  intervalId?: NodeJS.Timeout;
}