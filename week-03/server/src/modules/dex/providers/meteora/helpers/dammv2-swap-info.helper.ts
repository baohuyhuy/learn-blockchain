import { PublicKey } from "@solana/web3.js";
import { CpAmm, getPriceFromSqrtPrice } from "@meteora-ag/cp-amm-sdk";
import { getMint } from "@solana/spl-token";
import { BN } from "bn.js";
import BigNumber from "bignumber.js";
import { SOL_MINT, DAMM_API_URL, connection } from "../constants/meteora.constant";
import { IDAMMPoolData } from "../interfaces/meteora.interface";

// This class tracks prices from DAMMv2 pools on Meteora
export class DAMMPriceTracker {
  private cpAmm: CpAmm;
  private tokenAddress: PublicKey;

  constructor(tokenAddress: PublicKey) {
    this.cpAmm = new CpAmm(connection);
    this.tokenAddress = tokenAddress;
  }

  // Method to fetch all SOL-token pools from DAMMv2 API
  private async fetchSolTokenPools(): Promise<IDAMMPoolData[]> {
    const matchedPools: IDAMMPoolData[] = [];
    const seenPoolIds = new Set<string>();

    for (const field of ["token_a_mint", "token_b_mint"]) {
      let offset = 0;
      while (true) {
        try {
          const params = new URLSearchParams({
            limit: "50",
            offset: offset.toString(),
            order_by: "tvl",
            order: "desc",
            [field]: this.tokenAddress.toBase58(),
            timestamp: Date.now().toString(),
          });

          const response = await fetch(`${DAMM_API_URL}?${params.toString()}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const { data: pools } = await response.json() as { data: IDAMMPoolData[] };
          if (pools.length === 0) break;

          for (const pool of pools) {
            const poolId = pool.pool_address;
            if (!seenPoolIds.has(poolId) &&
              [pool.token_a_mint, pool.token_b_mint].includes(SOL_MINT.toBase58())) {
              seenPoolIds.add(poolId);
              matchedPools.push(pool);
            }
          }

          offset += 50;
        } catch (error) {
          console.error("[DAMM] Error fetching pools:", error);
          break;
        }
      }
    }

    return matchedPools;
  }

  // Method to find the pool with the highest TVL in DAMMv2 pools
  private findHighestTvlPool(pools: IDAMMPoolData[]): IDAMMPoolData | null {
    return pools.length > 0 ? pools.reduce((max, curr) =>
      parseFloat(curr.tvl || "0") > parseFloat(max.tvl || "0") ? curr : max
    ) : null;
  }

  // Method to get the highest TVL pool
  async getHighestTvlPool(): Promise<any> {
    const pools = await this.fetchSolTokenPools();
    const pool = this.findHighestTvlPool(pools);
    if (!pool) return { error: "No DAMM SOL-token pool found." };

  }
  async getPriceByPool(pool: IDAMMPoolData): Promise<any> {
    try {
      const poolState = await this.cpAmm.fetchPoolState(new PublicKey(pool.pool_address));
      if (!poolState || Object.keys(poolState).length === 0) {
        return { error: "Could not fetch pool state" };
      }

      const isSolTokenA = pool.token_a_mint === SOL_MINT.toBase58();

      const [inputMint, outputMint] = await Promise.all([
        getMint(connection, SOL_MINT),
        getMint(connection, new PublicKey(isSolTokenA ? pool.token_b_mint : pool.token_a_mint))
      ]);

      const quote = await this.cpAmm.getQuote({
        inAmount: new BN(1_000_000_000), // 1 SOL in lamports
        inputTokenMint: SOL_MINT,
        inputTokenInfo: {
          mint: inputMint,
          currentEpoch: (await connection.getEpochInfo()).epoch
        },
        outputTokenInfo: {
          mint: outputMint,
          currentEpoch: (await connection.getEpochInfo()).epoch
        },
        slippage: 0.5,
        poolState,
        currentSlot: await connection.getSlot(),
        currentTime: Math.floor(Date.now() / 1000),
      });

      const amountOut = new BigNumber(quote.swapOutAmount.toString()).dividedBy(
        new BigNumber(10).pow(outputMint.decimals)
      );

      const [tokenAMint, tokenBMint] = await Promise.all([
        getMint(connection, new PublicKey(pool.token_a_mint)),
        getMint(connection, new PublicKey(pool.token_b_mint))
      ]);

      const rawPrice = getPriceFromSqrtPrice(
        poolState.sqrtPrice,
        tokenAMint.decimals,
        tokenBMint.decimals
      );

      let finalPrice: BigNumber;
      if (this.tokenAddress.toBase58() === pool.token_a_mint) {
        finalPrice = new BigNumber(1).dividedBy(rawPrice);
      } else {
        finalPrice = new BigNumber(rawPrice);
      }

      return {
        platform: "Meteora",
        poolAddress: pool.pool_address,
        price: Number(amountOut.toFixed(6)),
        tvl: parseFloat(pool.tvl || "0"),
        symbolName: this.tokenAddress.toBase58() === pool.token_a_mint ? 
          pool.token_a_symbol || 'UNKNOWN' : pool.token_b_symbol || 'UNKNOWN',
        mintB: this.tokenAddress.toBase58(),
      };
    } catch (error: any) {
      console.error("[DAMM] Pool calculation failed:", error.message);
      return { error: `DAMM pool calculation failed: ${error.message}` };
    }
  }
}