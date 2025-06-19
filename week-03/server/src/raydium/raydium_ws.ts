import * as WebSocket from 'ws';
import { SOLANA_MAINNET_WS, SOL_MINT } from './CONSTANTS.js';
import decodePoolWithNode from './decode_pool.js';
import Decimal from 'decimal.js';
import { RaydiumWebsocketConfig } from './interfaces.js';

import { Socket } from 'socket.io';

// Set Decimal.js precision to 40 to handle large numbers accurately
Decimal.set({precision: 40});

function decodeTokenAccount(data: string): string{
    const rawData = Buffer.from(data, 'base64');
    const amountBytes = rawData.subarray(64, 72); // 8 bytes
    const hexString = '0x' + amountBytes.reverse().toString('hex');
    const decimalAmount = new Decimal(hexString);
    // Convert back to bigint for compatibility with the rest of the code
    return decimalAmount.toString();
}

function roundToNearest(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}

class RaydiumWebsocket {
    private vaultA: string;
    private vaultB: string;
    private decimalsA: number;
    private decimalsB: number;
    private mintA: string;
    private mintB: string;
    private mintASymbolName: string;
    private mintBSymbolName: string;
    private tvl: string;
    private poolType: string;
    private sqrtPriceX64: string | null;
    private liquidity: string | null;
    private poolId: string;
    private amountA: string | null;
    private amountB: string | null;
    private subMap: Map<number, string>;
    private ws: WebSocket | null;

    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectInterval: number = 5000; // 5 seconds
    private pingInterval: NodeJS.Timeout | null = null;

    private client: Socket;

    constructor (config: RaydiumWebsocketConfig) {
        this.vaultA = config.vaultA;
        this.decimalsA = config.decimalsA;
        this.mintA = config.mintA;
        this.mintASymbolName = config.mintASymbolName;
        this.vaultB = config.vaultB;
        this.decimalsB = config.decimalsB;
        this.mintB = config.mintB;
        this.mintBSymbolName = config.mintBSymbolName;
        this.poolId = config.poolId;
        this.poolType = config.poolType;
        this.tvl = config.poolTvl;
        this.sqrtPriceX64 = config.sqrtPriceX64 || null;
        this.liquidity = config.liquidity || null;
        this.client = config.client;
        this.amountA = '';
        this.amountB = '';
        this.subMap = new Map<number, string>();
        this.ws = null;
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

    private cleanupData() {
        this.subMap.clear(); // Clear subscriptions on close
        this.amountA = ''; // Reset amounts on close
        this.amountB = ''; // Reset amounts on close
        this.sqrtPriceX64 = ''; // Reset sqrtPriceX64 on close
        this.liquidity = ''; // Reset liquidity on close
        this.poolId = ''; // Reset poolId on close
        this.mintA = ''; // Reset mintA on close
        this.mintB = ''; // Reset mintB on close
        this.decimalsA = 0; // Reset decimalsA on close
        this.decimalsB = 0; // Reset decimalsB on close
        this.poolType = ''; // Reset poolType on close
        this.vaultA = ''; // Reset vaultA on close
        this.vaultB = ''; // Reset vaultB on close
    }

    private clientEmit(event: string, data: any) {
        if (this.client) {
            this.client.emit(event, data);
        }
    }

    onMessage = (message: string) => {
        const data = JSON.parse(message);
        
        // This is a subscription message
        if ('result' in data && 'id' in data) {
            const sub_id = data.result;
            
            if (this.poolType === 'classic' || this.poolType === 'standard') {
                if (data.id === 1) {
                    this.subMap[sub_id] = 'A';
                    console.log(`Subscribed to vaultA (${this.vaultA}) successfully.`);
                } else if (data.id === 2) {
                    this.subMap[sub_id] = 'B';
                    console.log(`Subscribed to vaultB (${this.vaultB}) successfully.`);
                }
            } else if (this.poolType === 'clmm' || this.poolType === 'concentrated') {
                if (data.id === 3) {
                    this.subMap[sub_id] = 'POOL';
                    console.log(`Subscribed to pool (${this.poolId}) successfully.`);
                }
            }
        } else if ('method' in data && data.method === 'accountNotification') {
            const sub_id = data.params.subscription;
            const accountData = data.params.result.value.data[0];
            
            if (this.poolType === 'classic' || this.poolType === 'standard') {
                // Decode the account data for vaultA and vaultB
                if (this.subMap[sub_id] === 'A') {
                    this.amountA = decodeTokenAccount(accountData);
                } else if (this.subMap[sub_id] === 'B') {
                    this.amountB = decodeTokenAccount(accountData);
                }

                const amountA = new Decimal(this.amountA || '0');
                const amountB = new Decimal(this.amountB || '0');

                // Log the amounts
                if (amountA > Decimal(0) && amountB > Decimal(0)) {
                    console.log('Real-time price update:');
                    let price: Decimal;

                    console.log(amountA, amountB);

                    if (this.mintA === SOL_MINT) {
                        price = amountB
                            .div(amountA)
                            .mul(new Decimal(10).pow(this.decimalsA - this.decimalsB));
                    } else if (this.mintB === SOL_MINT) {
                        price =  amountA
                            .div(amountB)
                            .mul(new Decimal(10).pow(this.decimalsB - this.decimalsA));
                    } else {
                        console.log('Unsupported mint for price calculation');
                        return;
                    }

                    console.log(`1 SOL = ${price} ${this.mintA === SOL_MINT ? this.mintB : this.mintA}`);
                    this.clientEmit('update', {
                        poolAddres: this.poolId,
                        symbolName: this.mintBSymbolName,
                        price: roundToNearest(Number(price), 6),
                        tvl: roundToNearest(Number(this.tvl), 2),
                        mintB: this.mintB,
                    });
                }
            } else if (this.poolType === 'clmm' || this.poolType === 'concentrated') {
                if (this.subMap[sub_id] === 'POOL') {
                    // Decode the account data for the CLMM pool
                    decodePoolWithNode(this.poolId, this.poolType)
                        .then((result) => {
                            if (result) {
                                this.sqrtPriceX64 = result.sqrtPriceX64;
                                this.liquidity = result.liquidity;
                                this.decimalsA = result.decimalsA;
                                this.decimalsB = result.decimalsB;
                                this.mintA = result.mintA;
                                this.mintB = result.mintB;

                                const sqrtPriceX64 = new Decimal(this.sqrtPriceX64 || '0');
                                const liquidity = new Decimal(this.liquidity || '0');
                                const Q64 = new Decimal(2).pow(64);
                                const sqrtPrice = new Decimal(sqrtPriceX64).div(Q64);

                                const amountInSol = new Decimal(1); // 1 SOL for price calculation
                                const decimalsIn = this.decimalsA;
                                const decimalsOut = this.decimalsB;
                                const feeRate = new Decimal(0); // Raydium pools do not include fee rate in the pool data

                                // Convert amountInSol to atomic units
                                const amountInAtomic = amountInSol.mul(new Decimal(10).pow(decimalsIn));
                                const amountInAfterFee =  amountInAtomic.mul(new Decimal(1).sub(feeRate));

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
                                if (this.mintA === SOL_MINT) {
                                    price = new Decimal(amountOut.toString())
                                        .div(new Decimal(amountInSol.toString()))
                                        .mul(new Decimal(10).pow(decimalsIn - decimalsOut));
                                } else if (this.mintB === SOL_MINT) {
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
                                console.log(`1 SOL = ${price} ${this.mintA === SOL_MINT ? this.mintB : this.mintA}`);
                                this.clientEmit('update', {
                                    poolAddres: this.poolId,
                                    symbolName: this.mintBSymbolName,
                                    price: roundToNearest(Number(price), 6),
                                    tvl: roundToNearest(Number(this.tvl), 2),
                                    mintB: this.mintB,
                                });
                            }
                        })
                        .catch((error) => {
                            console.error('Error decoding CLMM pool:', error);
                        });
                }
            }
        } else {
            console.log('Received message:', data);
        }
    }

    onError = (error: Error) => {
        console.error('WebSocket error:', error);
    }

    onClose = () => {
        console.log('WebSocket connection closed.');
        
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        this.ws = null;
        // this.reconnect(); // Attempt to reconnect if needed

        this.cleanupData(); // Clean up data on close
    }

    onOpen = () => {
        console.log('WebSocket connection opened.');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.setupPingInterval();

        if (this.poolType === 'classic' || this.poolType === 'standard') {
            // Subscribe to vaultA and vaultB
            this.ws?.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'accountSubscribe',
                params: [this.vaultA, { encoding: 'base64', commitment: 'confirmed' }]
            }));

            this.ws?.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'accountSubscribe',
                params: [this.vaultB, { encoding: 'base64', commitment: 'confirmed' }]
            }));
        } else if (this.poolType === 'clmm' || this.poolType === 'concentrated') {
            // Subscribe to the CLMM pool
            this.ws?.send(JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'accountSubscribe',
                params: [this.poolId, { encoding: 'base64', commitment: 'confirmed' }]
            }));
        }
    }

    connect = () => {
        if (this.ws) {
            console.log('WebSocket is already connected.');
            return;
        }

        this.ws = new WebSocket(SOLANA_MAINNET_WS);

        this.ws.on('open', this.onOpen);
        this.ws.on('message', this.onMessage);
        this.ws.on('error', this.onError);
        this.ws.on('close', this.onClose);
        this.ws.on('pong', () => {
            console.log('Received pong from WebSocket server.');
        });
    }

    disconnect = () => {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            console.log('WebSocket connection closed.');
        } else {
            console.log('WebSocket is not connected.');
        }

        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }

        this.cleanupData(); // Clean up data on disconnect
    }
}

export default RaydiumWebsocket;