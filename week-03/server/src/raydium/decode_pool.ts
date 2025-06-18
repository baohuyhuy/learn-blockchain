//console.log("Raydium SDK keys:", Object.keys(pkg));
import { LIQUIDITY_STATE_LAYOUT_V4, PoolInfoLayout } from "@raydium-io/raydium-sdk";
import { Connection, PublicKey } from "@solana/web3.js";

async function decodePoolWithNode(poolId: string, poolType: string): Promise<any> {
  const connection = new Connection("https://api.mainnet-beta.solana.com");

  const accountInfo = await connection.getAccountInfo(new PublicKey(poolId));
  if (!accountInfo) {
    console.error("No account info");
    return;
  }

  if (poolType === "classic" || poolType === "standard") {
    try {
      const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);
      const result = {
        type: "classic",
        mintA: poolState.baseMint.toBase58(),
        mintB: poolState.quoteMint.toBase58(),
        vaultA: poolState.baseVault.toBase58(),
        vaultB: poolState.quoteVault.toBase58(),
        decimalsA: poolState.baseDecimal,
        decimalsB: poolState.quoteDecimal,
      };
      return result;
    } catch (e) {
      console.error("Failed to decode classic pool.");
      return;
    }
  } else if (poolType === "clmm" || poolType === "concentrated") {
    try {
      const clmmState = PoolInfoLayout.decode(accountInfo.data);
      const result = {
        type: "clmm",
        mintA: clmmState.mintA.toBase58(),
        mintB: clmmState.mintB.toBase58(),
        vaultA: clmmState.vaultA.toBase58(),
        vaultB: clmmState.vaultB.toBase58(),
        decimalsA: clmmState.mintDecimalsA,
        decimalsB: clmmState.mintDecimalsB,
        sqrtPriceX64: clmmState.sqrtPriceX64.toString(),
        liquidity: clmmState.liquidity.toString(), 
      };
      return result;
    } catch (e) {
      console.error("Failed to decode CLMM pool.");
      return;
    }
  } else {
    console.error("Unknown or missing pool type. Please specify 'classic' (or 'standard') or 'clmm' (or 'concentrated').");
    return;
  }
}

export default decodePoolWithNode;