# METEORA PRICE MONITOR

This program monitors price fluctuations for METEORA with the highest TVL for a specific SOL/token pair.

## Features

- 🔍 Find the pool with largest TVL for a given SOL/token pair on METEORA.
- 📊 Monitor real-time price fluctuations using Meteora TypeScript SDK, DAMM v2 API and DLMM API.
- 📈 Display price fluctuations with pool address, price, TVL, token mint and token symbol.

## Setup

1. Install dependencies:

```bash
npm install
```

## Usage

1. Run the program:

```bash
npx ts-node index.ts
```

2. Enter the token mint in here: 
```bash
Enter token mint address: <TOKEN_MINT_ADDRESS>
```

### Examples

#### Monitor SOL/MIRAI pool:

- Run program
```bash
npx ts-node index.ts
```

- After program builds successfully, enter token address that you want to monitor
```bash
Enter token mint address: 5evN2exivZXJfLaA1KhHfiJKWfwH8znqyH36w1SFz89Y 
```

#### Monitor SOL/LABUBU pool:

- Run program
```bash
npx ts-node index.ts
```

- After program builds successfully, enter token address that you want to monitor
```bash
Enter token mint address: JB2wezZLdzWfnaCfHxLg193RS3Rh51ThiXxEDWQDpump
```

## Output

- The program will:

1. Finds the pool with the largest TVL
2. Starts monitoring price fluctuations in real-time
3. Displays price updates with:
   - Pool address
   - Price
   - TVL
   - Symbol name
   - MintB

- Example output:
```bash
# [8:51:50 PM] SOL → Token Swap Info:
# {
#   "Pool address": "Ao6DRFQ39ey3y18q3nzFbcwhsDhtcd6yx8EkgmeWjztD",
#   "Price": "15335.505779",
#   "TVL": 848180.7547967688,
#   "Symbol name": "MIRAI",
#   "MintB": "5evN2exivZXJfLaA1KhHfiJKWfwH8znqyH36w1SFz89Y"
# }
```

## How it works

The application follows this workflow:

1. **Input Token Address**: Validates the provided token mint address
2. **Pool Discovery**: 
   - [`DLMMPriceTracker`](dlmm_swapInfo.ts) searches DLMM pools via Meteora DLMM API
   - [`DAMMPriceTracker`](dammv2_swapInfo.ts) searches DAMMv2 pools via Meteora DAMMv2 API
3. **Pool Selection**: Compares TVL and selects the pool having the best TVL
4. **Price Calculation**: 
   - For DLMM: Uses active bin pricing with `binStep` calculations, particularly, the formula is: `price = ((1 + binStep/10000) ** activedBinID) * (tokenA.decimals - tokenB.decimals)`
   - For DAMMv2: Uses sqrt price formula from CP-AMM SDK, `getQuote` `getPriceFromSqrtPrice` methods
5. **Real-time Updates**: Refreshes data every second with live price information

## Project Structure

```
├── index.ts              # Main entry point and user interface
├── dlmm_swapInfo.ts      # DLMM protocol price tracking
├── dammv2_swapInfo.ts    # DAMMv2 protocol price tracking
├── CONSTANTS.ts          # Configuration and type definitions
├── token.txt             # Sample token addresses for testing
├── package.json          # Dependencies and project configuration
├── package-lock.json     # Lock file for dependencies
├── tsconfig.json         # TypeScript configuration
├── .gitignore            # Git ignore file
└── README.md             # Check overview and metadata
```

## Dependencies

### Core Dependencies
- `@meteora-ag/dlmm`: DLMM protocol SDK
- `@meteora-ag/cp-amm-sdk`: DAMMv2 protocol SDK
- `@solana/web3.js`: Solana blockchain interaction
- `@solana/spl-token`: SPL token utilities
- `bignumber.js`: Precise decimal calculations
- `bn.js`: Big number arithmetic

### Development Dependencies
- `typescript`: TypeScript compiler
- `ts-node`: TypeScript execution environment
- `@types/node`: Node.js type definitions

## Notes

- The program uses the Solana mainnet RPC endpoint by default
- Prices are calculated as tokens received per 1 SOL
- Press Ctrl+C to stop monitoring