# ORCA Whirlpool Price Monitor

This program monitors price changes for ORCA whirlpools with the largest TVL for a given SOL/token pair.

## Features

- 🔍 Finds the pool with largest TVL for a given SOL/token pair on ORCA
- 📊 Monitors real-time price changes using Solana websocket and ORCA API
- 📈 Displays price changes with pool address, price, TVL, liquidity, and token symbol

## Setup

1. Install dependencies:

```bash
npm install
```

## Usage

Run the program with one or more token addresses:

```bash
npm start <TOKEN_ADDRESS_1> <TOKEN_ADDRESS_2> ...
```

### Examples

Monitor SOL/USDC pool:

```bash
npm start EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

Monitor SOL/USDT and SOL/BONK pools simultaneously:

```bash
npm start Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```

## Output

The program will:

1. For each token address provided, finds the pool with the largest TVL
2. Starts monitoring price changes in real-time for each pool
3. Displays price updates for each pool with:
   - Pool address
   - Price
   - TVL
   - Liquidity
   - Token symbol

## How it works

1. **Pool Discovery**: Uses `fetchLargestTVLPool` to efficiently find the largest TVL pool for the token/SOL pair
2. **Price Monitoring**: Subscribes to account changes using Solana websocket
3. **Price Calculation**: Converts sqrtPrice to actual price using the formula: `price = (sqrtPrice * sqrtPrice) >> 64 / 10 ** (tokenA.decimals - tokenB.decimals)`

## Dependencies

- `@orca-so/whirlpools`: ORCA whirlpool SDK
- `@orca-so/whirlpools-client`: ORCA whirlpool client
- `@orca-so/whirlpools-core`: ORCA whirlpool core
- `@solana/kit`: Solana kit
- `typescript`: TypeScript compiler
- `ts-node`: TypeScript execution engine

## Notes

- The program uses the Solana mainnet RPC endpoint by default
- Price is calculated in token terms (how much token per SOL)
- You can monitor as many tokens as you want in parallel (each in its own pool)
- Press Ctrl+C to stop monitoring all pools
