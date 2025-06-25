import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import DLMM from "@meteora-ag/dlmm";
import { BN } from "bn.js";
import BigNumber from "bignumber.js";
import { SOL_MINT, DLMM_API_URL, connection, DLMMPoolData } from "./types";

// This class tracks prices from DLMM pools on Meteora
export class DLMMPriceTracker {
  private tokenAddress: PublicKey;

  constructor(tokenAddress: PublicKey) {
    this.tokenAddress = tokenAddress;
  }

  // Method to fetch all SOL-token pools from DLMM API
  private async fetchSolTokenPools(): Promise<DLMMPoolData[]> {
    const matchedPools: DLMMPoolData[] = [];
    const tokenAddressStr = this.tokenAddress.toBase58().toLowerCase().trim();
    const solAddressStr = SOL_MINT.toBase58().toLowerCase();

    try {
      const response = await fetch(DLMM_API_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const allPools: DLMMPoolData[] = await response.json();

      for (const pool of allPools) {
        const mintX = pool.mint_x.toLowerCase().trim();
        const mintY = pool.mint_y.toLowerCase().trim();
        const liquidity = parseFloat(pool.liquidity || "0");

        const isSolToToken = (mintX === solAddressStr && mintY === tokenAddressStr) ||
                            (mintY === solAddressStr && mintX === tokenAddressStr);
        const hasLiquidity = liquidity > 0;
        const hasReserves = pool.reserve_x_amount > 0 && pool.reserve_y_amount > 0;

        if (isSolToToken && hasLiquidity && hasReserves) {
          matchedPools.push(pool);
        }
      }

      return matchedPools;
    } catch (error) {
      console.error("[DLMM] Error fetching pools:", error);
      return [];
    }
  }

  // Method to find the pool with the highest liquidity in DLMM pools
  private findHighestLiquidityPool(pools: DLMMPoolData[]): DLMMPoolData | null {
    if (pools.length === 0) return null;
    
    return pools.reduce((max, curr) => {
      const liquidityA = parseFloat(max.liquidity || "0");
      const liquidityB = parseFloat(curr.liquidity || "0");
      return liquidityB > liquidityA ? curr : max;
    });
  }

  // Helper method to parse the token symbol from the pool name
  private parseTokenSymbol(poolName: string): string {
    const parts = poolName.split('-');
    if (parts.length >= 2) {
      return parts.find(part => part.toUpperCase() !== 'SOL') || 'UNKNOWN';
    }
    return 'UNKNOWN';
  }

  // Method to get the highest TVL pool 
  async getHighestTvlPool(): Promise<any> {
    const pools = await this.fetchSolTokenPools();
    const pool = this.findHighestLiquidityPool(pools);
    if (!pool) return { error: "No DLMM SOL-token pool found." };

    return pool;

  }

  async getPriceByPool(pool: DLMMPoolData):  Promise<any> {
    try {
      const pairAddress = new PublicKey(pool.address);
      const dlmmPool = await DLMM.create(connection, pairAddress);

      const [mintX, mintY] = await Promise.all([
        getMint(connection, new PublicKey(pool.mint_x)),
        getMint(connection, new PublicKey(pool.mint_y))
      ]);

      const solIsMintX = pool.mint_x.toLowerCase().trim() === SOL_MINT.toBase58().toLowerCase();
      const tokenMint = solIsMintX ? mintY : mintX;
      const tokenSymbol = solIsMintX ? pool.mint_y_symbol : pool.mint_x_symbol;

      const swapAmount = new BN(1 * 10 ** 9); 
      const swapYtoX = solIsMintX ? false : true;

      let realTimePrice: number | null = null;
      let activeBinId: number | null = null;

      try {
        const poolState = dlmmPool.lbPair;
        if (poolState && poolState.activeId !== undefined) {
          activeBinId = poolState.activeId;
          const binStep = poolState.binStep;

          const priceOfYinX = new BigNumber(Math.pow(1 + binStep / 10000, activeBinId))
            .multipliedBy(new BigNumber(10).pow(mintX.decimals - mintY.decimals));

          if (solIsMintX) {
            realTimePrice = priceOfYinX.toNumber();
          } else {
            if (!priceOfYinX.isZero()) {
              realTimePrice = new BigNumber(1).dividedBy(priceOfYinX).toNumber();
            }
          }
        }
      } catch (priceError) {
        console.log("[DLMM] Could not calculate real-time price:", priceError);
      }

      const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
      const swapQuote = await dlmmPool.swapQuote(swapAmount, swapYtoX, new BN(1), binArrays);

      const tokenDecimals = tokenMint.decimals;
      const tokenAmountOut = new BigNumber(swapQuote.minOutAmount.toString()).dividedBy(
        new BigNumber(10).pow(tokenDecimals)
      );

      return {
        platform: 'Meteora',
        poolAddress: pool.address,
        price: realTimePrice ? parseFloat(realTimePrice.toFixed(6)) : null,
        tvl: parseFloat(pool.liquidity || "0"),
        symbolName: this.parseTokenSymbol(pool.name),
        mintB: this.tokenAddress.toBase58(),
      };
    } catch (error: any) {
      //console.error("[DLMM] Swap calculation failed:", error.message);
      return { error: `DLMM swap calculation failed: ${error.message}` };
    }
  }
}