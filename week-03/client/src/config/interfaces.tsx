export interface Dex {
    name: string;
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