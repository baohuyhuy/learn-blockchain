import RaydiumWebsocket from "./raydium_ws.js";
import fetchHighestTVLPool from "./fetch_pool.js";
import decodePoolWithNode from "./decode_pool.js";
import { RaydiumWebsocketConfig } from "./interfaces.js";
import { Socket } from 'socket.io';

const raydiumWsList: RaydiumWebsocket[] = [];

async function startMonitor(tokenMint: string, client: Socket) {
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

        const config: RaydiumWebsocketConfig = {
            poolId: poolId,
            poolType: poolType,
            poolLogoURI: poolLogoURI,
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
        console.error("[Raydium] Error in main function:", error);
    }
}

async function stopMonitor() {
    // Disconnect all RaydiumWebsocket instances
    raydiumWsList.forEach((ws) => {
        if (ws) {
            ws.disconnect();
        }
    });

    // Clear the list of RaydiumWebsocket instances
    raydiumWsList.length = 0;
    console.log("[Raydium] All WebSocket connections stopped.");
}

export {startMonitor, stopMonitor};