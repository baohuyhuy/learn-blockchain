export interface Dex {
    name: string;
    prevPrice: number;
    price: number;
    tvl: number;
    poolAddress: string;
}

export interface Token {
    icon: string;
    name: string;
    address: string;
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    dexes: Dex[];
}

export const RaydiumPoolURL = "https://raydium.io/liquidity-pools/?tab=all&token=";
export const OrcaPoolURL = "https://orca.so/pools?token=";
export const MeteoraPoolURL = "https://v2.meteora.ag/pools/dlmm?search=";