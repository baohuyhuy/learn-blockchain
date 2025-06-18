import RaydiumWebsocket from "./raydium_ws.js";
import fetchHighestTVLPool from "./fetch_pool.js";
import decodePoolWithNode from "./decode_pool.js";
import { Socket } from 'socket.io';

const raydiumWsList: RaydiumWebsocket[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
    try {
        const poolData = await fetchHighestTVLPool(tokenMint);
        console.log("Fetched pool data:", poolData);

        const { id: poolId, mintA, mintB, decimalsA, decimalsB, type: poolType } = poolData;

        // Decode the pool using the node method
        const decodedPool = await decodePoolWithNode(poolId, poolType);
        if (!decodedPool) {
            console.error("Failed to decode the pool.");
            return;
        }

        // Create a new RaydiumWebsocket instance
        const raydiumWs = new RaydiumWebsocket(
            decodedPool.vaultA,
            decodedPool.vaultB,
            decodedPool.decimalsA,
            decodedPool.decimalsB,
            decodedPool.mintA,
            decodedPool.mintB,
            poolType,
            decodedPool.sqrtPriceX64,
            decodedPool.liquidity,
            poolId,
            client
        );

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