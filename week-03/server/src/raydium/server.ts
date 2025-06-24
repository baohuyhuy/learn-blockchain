import RaydiumWebsocket from "./raydium_ws.js";
import fetchHighestTVLPool from "./fetch_pool.js";
import decodePoolWithNode from "./decode_pool.js";
import { RaydiumWebsocketConfig } from "./interfaces.js";
import { Socket } from 'socket.io';

// Create a single shared WebSocket instance
let raydiumWs: RaydiumWebsocket | null = null;

// Map to track clients and their tokens
const clientTokenMap = new Map<string, string[]>();

async function startMonitor(tokenMint: string, client: Socket) {
    try {
        // Initialize the WebSocket if it doesn't exist
        if (!raydiumWs) {
            raydiumWs = new RaydiumWebsocket();
        }
        
        // Track this token for the client
        if (!clientTokenMap.has(client.id)) {
            clientTokenMap.set(client.id, []);
        }
        clientTokenMap.get(client.id)?.push(tokenMint);

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

        // Add the pool to the websocket instance
        raydiumWs.addPool(config);

    } catch (error) {
        console.error("[Raydium] Error in startMonitor:", error);
    }
}

async function stopMonitor(client: Socket) {
    if (!raydiumWs) {
        console.log("[Raydium] No active WebSocket connection to stop.");
        return;
    }

    // Remove all pools for this client
    raydiumWs.removeAllPoolsForClient(client);
    
    // Clean up the client token map
    clientTokenMap.delete(client.id);
    
    console.log(`[Raydium] Stopped monitoring for client: ${client.id}`);
}

export { startMonitor, stopMonitor };