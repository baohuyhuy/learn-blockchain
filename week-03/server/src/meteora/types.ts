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

export interface PoolResult {
  poolAddress: string;
  tvl: number;
  tokenSymbol: string;
  tokenAddress: string;
  price: number | null;
}

export interface DAMMPoolData {
  pool_address: string;
  token_a_mint: string;
  token_b_mint: string;
  token_a_amount: string;
  token_b_amount: string;
  tvl: string;
  fee_bps: number;
  token_a_symbol?: string;
  token_b_symbol?: string;
  pool_price?: string;
}

export interface DLMMPoolData {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  liquidity: string;
  current_price: number;
  mint_x_symbol?: string;
  mint_y_symbol?: string;
}
