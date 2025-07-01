import { Socket } from 'socket.io';

export interface IPoolMonitor {
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