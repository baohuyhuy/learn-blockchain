import { Socket } from 'socket.io';

export interface RaydiumWebsocketConfig {
    // Pool information
    poolId: string;
    poolType: string;
    poolTvl: string;

    // Token A details
    vaultA: string;
    mintA: string;
    decimalsA: number;
    mintASymbolName: string;

    // Token B details
    vaultB: string;
    mintB: string;
    decimalsB: number;
    mintBSymbolName: string;

    // CLMM specific
    sqrtPriceX64?: string;
    liquidity?: string;

    // Socket connection
    client: Socket;
}