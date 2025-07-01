import { Connection, PublicKey } from "@solana/web3.js";

export const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
export const DLMM_API_URL = "https://dlmm-api.meteora.ag/pair/all";
export const DAMM_API_URL = "https://dammv2-api.meteora.ag/pools";
export const connection = new Connection("https://api.mainnet-beta.solana.com");

export const displayNames: Record<string, string> = {
  "Pool address": "Pool Address",
  "Price": "Price",
  "TVL": "TVL",
  "Symbol name": "Symbol Name",
  "MintB": "Token Address"
};