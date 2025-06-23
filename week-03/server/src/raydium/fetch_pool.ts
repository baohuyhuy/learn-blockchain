import { SOL_MINT } from "./CONSTANTS.js";

async function fetchHighestTVLPool(tokenMint: string): Promise<any> {
    const response = await fetch(`https://api-v3.raydium.io/pools/info/mint?mint1=${SOL_MINT}&mint2=${tokenMint}&poolType=all&poolSortField=liquidity&sortType=desc&pageSize=1&page=1`);

    if (!response.ok) {
        throw new Error(`Error fetching pool data: ${response.statusText}`);
    }

    const res = await response.json();
    const data = res.data;

    if (data && data.data && data.data.length > 0) {
        const pool = data.data[0];

        return {
            id: pool.id,
            type: pool.type.toLowerCase(), // Ensure type is in lowercase
            logoURI: pool.mintB.logoURI,
            tvl: pool.tvl.toString(),
            mintA: {
                address: pool.mintA.address,
                symbolName: pool.mintA.symbol.trim(),
                decimals: pool.mintA.decimals
            },
            mintB: {
                address: pool.mintB.address,
                symbolName: pool.mintB.symbol.trim(),
                decimals: pool.mintB.decimals
            }
        }
    } else {
        throw new Error("No pools found for the specified token mint.");
    }
}

export default fetchHighestTVLPool;