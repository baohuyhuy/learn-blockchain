import RaydiumWebsocket from "./raydium_ws.js";
import fetchHighestTVLPool from "./fetch_pool.js";
import decodePoolWithNode from "./decode_pool.js";
import { RaydiumWebsocketConfig } from "./interfaces.js";
import { Socket } from 'socket.io';

const raydiumWsList: RaydiumWebsocket[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
    try {
        const poolData = await fetchHighestTVLPool(tokenMint);
        console.log("Fetched pool data:", poolData);

        const poolId = poolData.id;
        const poolType = poolData.type;
        const poolTvl = poolData.tvl;
        const mintASymbolName = poolData.mintA.symbolName;
        const mintBSymbolName = poolData.mintB.symbolName;

        // Decode the pool using the node method
        const decodedPool = await decodePoolWithNode(poolId, poolType);
        if (!decodedPool) {
            console.error("Failed to decode the pool.");
            return;
        }

        const config: RaydiumWebsocketConfig = {
            poolId: poolId,
            poolType: poolType,
            poolTvl: poolTvl,
            vaultA: decodedPool.vaultA,
            mintA: decodedPool.mintA,
            decimalsA: decodedPool.decimalsA,
            mintASymbolName: mintASymbolName,
            vaultB: decodedPool.vaultB,
            mintB: decodedPool.mintB,
            decimalsB: decodedPool.decimalsB,
            mintBSymbolName: mintBSymbolName,
            sqrtPriceX64: decodedPool.sqrtPriceX64,
            liquidity: decodedPool.liquidity,
            client: client
        };

        // Create a new RaydiumWebsocket instance
        const raydiumWs = new RaydiumWebsocket(config);

        // Connect to the WebSocket
        raydiumWs.connect();

        // Add the new RaydiumWebsocket instance to the list
        raydiumWsList.push(raydiumWs);
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

async function stopMonitor() {
    // Disconnect all RaydiumWebsocket instances
    raydiumWsList.forEach((ws) => {
        if (ws) {
            ws.disconnect();
        }
    });
}

export {startMonitor, stopMonitor};