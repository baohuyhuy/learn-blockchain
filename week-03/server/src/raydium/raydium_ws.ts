import * as WebSocket from 'ws';
import { SOLANA_MAINNET_WS, SOL_MINT } from './CONSTANTS.js';
import decodePoolWithNode from './decode_pool.js';
import Decimal from 'decimal.js';
import { RaydiumWebsocketConfig } from './interfaces.js';

import { Socket } from 'socket.io';

// Set Decimal.js precision to 40 to handle large numbers accurately
Decimal.set({precision: 40});

// This class now handles a single websocket with multiple subscriptions
class RaydiumWebsocket {
    private ws: WebSocket | null;
    private subMap: Map<number, {
        poolId: string,
        poolType: string,
        poolLogoURI: string,
        tvl: string,
        mintA: string,
        mintB: string,
        decimalsA: number,
        decimalsB: number,
        mintASymbolName: string,
        mintBSymbolName: string,
        sqrtPriceX64?: string,
        liquidity?: string,
        client: Socket
    }>;
    
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectInterval: number = 5000; // 5 seconds  
    private pingInterval: NodeJS.Timeout | null = null;
    private nextId: number = 1;

    constructor() {
        this.ws = null;
        this.subMap = new Map();
    }

    private setupPingInterval() {
        // Clear any existing ping interval
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Send a ping every 30 seconds to keep the connection alive
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.ping();
            }
        }, 30000);
    }

    private reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached. Please check your connection.');
        }
    }

    onMessage = (message: string) => {
        if (!this.ws) {
            console.error('WebSocket is not initialized. Cannot process message.');
            return;
        }

        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not open. Cannot process message.');
            return;
        }

        const data = JSON.parse(message);
        
        // This is a subscription response message
        if ('result' in data && 'id' in data) {
            const sub_id = data.result;
            const request_id = data.id;
            
            // Update our map with the subscription ID from the server
            for (const [id, poolData] of this.subMap.entries()) {
                if (id === request_id) {
                    // Create a new entry with the subscription ID and remove the old one
                    this.subMap.set(sub_id, poolData);
                    this.subMap.delete(id);
                    
                    console.log(`Subscribed to ${poolData.poolType} pool (${poolData.poolId}) successfully.`);
                    break;
                }
            }
        } 
        // This is a notification for a subscribed account
        else if ('method' in data && data.method === 'accountNotification') {
            const sub_id = data.params.subscription;
            
            if (this.subMap.has(sub_id)) {
                const poolData = this.subMap.get(sub_id);
                if (!poolData) return;
                
                if (poolData.poolType === 'classic' || poolData.poolType === 'standard') {
                    // Decode the account data for the AMM pool
                    this.handleAmmPoolUpdate(poolData);
                } 
                else if (poolData.poolType === 'clmm' || poolData.poolType === 'concentrated') {
                    // Decode the account data for the CLMM pool
                    this.handleClmmPoolUpdate(poolData);
                }
            }
        } else {
            console.log('Received message:', data);
        }
    }

    private handleAmmPoolUpdate(poolData: any) {
        decodePoolWithNode(poolData.poolId, poolData.poolType)
            .then((result) => {
                if (result) {
                    const mintA = result.mintA;
                    const mintB = result.mintB;
                    const decimalsA = result.decimalsA;
                    const decimalsB = result.decimalsB;

                    const amountA = Decimal(result.mintAmountA || '0');
                    const amountB = Decimal(result.mintAmountB || '0');

                    // Log the amounts
                    if (amountA > Decimal(0) && amountB > Decimal(0)) {
                        console.log('Real-time price update:');
                        let price: Decimal;

                        console.log(amountA, amountB);

                        if (mintA === SOL_MINT) {
                            price = amountB.div(amountA)
                        } else if (mintB === SOL_MINT) {
                            price = amountA.div(amountB)
                        } else {
                            console.log('Unsupported mint for price calculation');
                            return;
                        }

                        console.log(`1 SOL = ${price} ${mintA === SOL_MINT ? mintB : mintA}`);
                        poolData.client.emit('update', {
                            platform: 'Raydium',
                            logoURI: poolData.poolLogoURI,
                            poolAddress: poolData.poolId,
                            symbolName: poolData.mintBSymbolName,
                            price: Number(price),
                            tvl: Number(poolData.tvl),
                            mintB: mintB,
                        });
                    }
                }
            })
            .catch((error) => {
                console.error('Error decoding AMM pool:', error);
            });
    }

    private handleClmmPoolUpdate(poolData: any) {
        decodePoolWithNode(poolData.poolId, poolData.poolType)
            .then((result) => {
                if (result) {
                    const sqrtPriceX64 = new Decimal(result.sqrtPriceX64 || '0');
                    const liquidity = new Decimal(result.liquidity || '0');
                    const decimalsA = result.decimalsA;
                    const decimalsB = result.decimalsB;
                    const mintA = result.mintA;
                    const mintB = result.mintB;

                    const Q64 = new Decimal(2).pow(64);
                    const sqrtPrice = new Decimal(sqrtPriceX64).div(Q64);

                    const amountInSol = new Decimal(1); // 1 SOL for price calculation
                    const decimalsIn = decimalsA;
                    const decimalsOut = decimalsB;
                    const feeRate = new Decimal(0); // Raydium pools do not include fee rate in the pool data

                    // Convert amountInSol to atomic units
                    const amountInAtomic = amountInSol.mul(new Decimal(10).pow(decimalsIn));
                    const amountInAfterFee = amountInAtomic.mul(new Decimal(1).sub(feeRate));

                    // Calculate sqrtPriceNew and amount out using Decimal
                    const one = new Decimal(1);

                    // sqrt_price_new = 1 / (1 / sqrt_price + Δx / L)
                    const sqrtPriceNew = one.div(
                        one.div(sqrtPrice).add(amountInAfterFee.div(liquidity))
                    );

                    // Δy = L * (sqrt_price_new - sqrt_price)
                    const deltaY = liquidity.mul(sqrtPriceNew.sub(sqrtPrice));

                    // Convert to human-readable units
                    const amountOut = deltaY.div(new Decimal(10).pow(decimalsOut));

                    let price: Decimal;
                    if (mintA === SOL_MINT) {
                        price = new Decimal(amountOut.toString())
                            .div(new Decimal(amountInSol.toString()))
                            .mul(new Decimal(10).pow(decimalsIn - decimalsOut));
                    } else if (mintB === SOL_MINT) {
                        price = new Decimal(amountInSol.toString())
                            .div(new Decimal(amountOut.toString()))
                            .mul(new Decimal(10).pow(decimalsOut - decimalsIn));
                    } else {
                        console.log('Unsupported mint for price calculation');
                        return;
                    }

                    // Price is negative because it's the amount taken out of the pool
                    price = price.negated();

                    console.log('Real-time price update:');
                    console.log(`1 SOL = ${price} ${mintA === SOL_MINT ? mintB : mintA}`);
                    poolData.client.emit('update', {
                        platform: 'Raydium',
                        poolAddress: poolData.poolId,
                        logoURI: poolData.poolLogoURI,
                        symbolName: poolData.mintBSymbolName,
                        price: Number(price),
                        tvl: Number(poolData.tvl),
                        mintB: mintB,
                    });
                }
            })
            .catch((error) => {
                console.error('Error decoding CLMM pool:', error);
            });
    }

    onError = (error: Error) => {
        console.error('WebSocket error:', error);
    }

    onClose = () => {
        console.log('WebSocket connection closed.');
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        this.ws = null;

        // Optional: Add reconnection logic if needed
        // this.reconnect();
    }

    onOpen = () => {
        console.log('WebSocket connection opened.');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.setupPingInterval();

        // Resubscribe to all pools if the connection was reestablished
        for (const [id, poolData] of this.subMap.entries()) {
            // Only resubscribe to pools that have numeric IDs (not subscription IDs)
            if (typeof id === 'number' && id < 1000) {
                this.subscribeToPool(poolData.poolId);
            }
        }
    }

    connect = async () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('WebSocket is already connected.');
            return;
        }

        this.ws = new WebSocket(SOLANA_MAINNET_WS);

        while (!this.ws) {
            console.log('Websocket not initialized, retrying...');
            this.ws = new WebSocket(SOLANA_MAINNET_WS);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }


        this.ws.on('open', this.onOpen);
        this.ws.on('message', this.onMessage);
        this.ws.on('error', this.onError);
        this.ws.on('close', this.onClose);
        this.ws.on('pong', () => {
            console.log('Received pong from WebSocket server.');
        });
    }

    subscribeToPool = (poolId: string) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected. Cannot subscribe.');
            return false;
        }

        const requestId = this.nextId++;
        
        this.ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'accountSubscribe',
            params: [poolId, { encoding: 'base64', commitment: 'confirmed' }]
        }));

        return requestId;
    }

    addPool = (config: RaydiumWebsocketConfig) => {
        // Ensure WebSocket is connected
        if (!this.ws) {
            this.connect();
        } else if (this.ws.readyState !== WebSocket.OPEN) {
            // If websocket exists but not open, reconnect
            this.connect();
        }

        // Create a temporary map entry with the request ID
        const requestId = this.subscribeToPool(config.poolId);
        
        if (requestId) {
            this.subMap.set(requestId, {
                poolId: config.poolId,
                poolType: config.poolType,
                poolLogoURI: config.poolLogoURI,
                tvl: config.poolTvl,
                mintA: config.mintA,
                mintB: config.mintB,
                decimalsA: config.decimalsA,
                decimalsB: config.decimalsB,
                mintASymbolName: config.mintASymbolName,
                mintBSymbolName: config.mintBSymbolName,
                sqrtPriceX64: config.sqrtPriceX64,
                liquidity: config.liquidity,
                client: config.client
            });
            
            return true;
        }
        
        return false;
    }

    unsubscribeFromPool = (subId: number) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected. Cannot unsubscribe.');
            return;
        }

        this.ws.send(JSON.stringify({
            jsonrpc: '2.0',
            id: this.nextId++,
            method: 'accountUnsubscribe',
            params: [subId]
        }));

        this.subMap.delete(subId);
    }

    disconnect = () => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // Unsubscribe from all accounts before closing
            const subscriptions = Array.from(this.subMap.keys()).filter(id => typeof id === 'number' && id > 1000);
            
            subscriptions.forEach(subId => {
                this.unsubscribeFromPool(subId);
            });

            // Wait briefly for unsubscribe messages to be sent
            setTimeout(() => {
                if (this.ws) {
                    this.ws.close();
                    this.ws = null;
                    console.log('WebSocket connection closed after unsubscribing.');
                }
            }, 100);
        } else {
            console.log('WebSocket is not connected.');
        }

        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        // Clear the subscription map
        this.subMap.clear();
    }

    removeAllPoolsForClient(client: Socket) {
        // Find all subscriptions for this client
        const subscriptionsToRemove: number[] = [];
        
        for (const [subId, poolData] of this.subMap.entries()) {
            if (poolData.client.id === client.id) {
                subscriptionsToRemove.push(Number(subId));
            }
        }
        
        // Unsubscribe from each pool
        subscriptionsToRemove.forEach(subId => {
            this.unsubscribeFromPool(subId);
        });
        
        console.log(`Removed ${subscriptionsToRemove.length} subscriptions for client ${client.id}`);
        
        // If no more subscriptions, disconnect the websocket
        if (this.subMap.size === 0) {
            this.disconnect();
        }
    }
}

export default RaydiumWebsocket;