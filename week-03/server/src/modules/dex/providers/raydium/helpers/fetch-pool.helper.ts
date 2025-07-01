import { BLOCKCHAIN_CONSTANTS } from "../../../../../core/constants/blockchain.constants";

async function fetchHighestTVLPool(tokenMint: string): Promise<any> {
    const response = await fetch(`https://api-v3.raydium.io/pools/info/mint?mint1=${BLOCKCHAIN_CONSTANTS.SOL_MINT}&mint2=${tokenMint}&poolType=all&poolSortField=liquidity&sortType=desc&pageSize=1&page=1`);

    if (!response.ok) {
        throw new Error(`Error fetching pool data: ${response.statusText}`);
    }

    const res = await response.json();
    const data = res.data;

    if (data && data.data && data.data.length > 0) {
        const pool = data.data[0];

        // Ensure mintA is SOL, mintB is token 
        let mintA = pool.mintA;
        let mintB = pool.mintB;
        if (mintA.address !== BLOCKCHAIN_CONSTANTS.SOL_MINT && mintB.address === BLOCKCHAIN_CONSTANTS.SOL_MINT) {
            [mintA, mintB] = [mintB, mintA];
        }

        return {
            id: pool.id,
            type: pool.type.toLowerCase(), // Ensure type is in lowercase
            logoURI: mintB.logoURI,
            tvl: pool.tvl.toString(),
            mintA: {
                address: mintA.address,
                symbolName: mintA.symbol.trim(),
                decimals: mintA.decimals
            },
            mintB: {
                address: mintB.address,
                symbolName: mintB.symbol.trim(),
                decimals: mintB.decimals
            }
        }
    } else {
        throw new Error("No pools found for the specified token mint.");
    }
}

export default fetchHighestTVLPool;