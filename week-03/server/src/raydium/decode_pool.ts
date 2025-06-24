//console.log("Raydium SDK keys:", Object.keys(pkg));
import { PoolInfoLayout, LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_MAINNET_HTTP } from "./CONSTANTS";

async function decodePoolWithNode(poolId: string, poolType: string): Promise<any> {
  const connection = new Connection(SOLANA_MAINNET_HTTP, "finalized");

  const accountInfo = await connection.getAccountInfo(new PublicKey(poolId));
  if (!accountInfo) {
    console.error("No account info");
    return;
  }

  if (poolType === "classic" || poolType === "standard") {
    try {
      let ammState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);
      const baseVault = ammState.baseVault;
      const quoteVault = ammState.quoteVault;

      const [baseReserve, quoteReserve] = await Promise.all([
        connection.getTokenAccountBalance(baseVault),
        connection.getTokenAccountBalance(quoteVault),
      ]);

      const result = {
        type: "classic",
        mintA: ammState.baseMint.toBase58(),
        mintB: ammState.quoteMint.toBase58(),
        decimalsA: ammState.baseDecimal.toNumber(),
        decimalsB: ammState.quoteDecimal.toNumber(),
        mintAmountA: baseReserve.value.uiAmountString,
        mintAmountB: quoteReserve.value.uiAmountString,
      };
      console.log("Decoded classic pool:", result);
      return result;
    } catch (e) {
      console.error("Failed to decode classic pool:", e);
      return;
    }
  } else if (poolType === "clmm" || poolType === "concentrated") {
    try {
      const clmmState = PoolInfoLayout.decode(accountInfo.data);
      const result = {
        type: "clmm",
        mintA: clmmState.mintA.toBase58(),
        mintB: clmmState.mintB.toBase58(),
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