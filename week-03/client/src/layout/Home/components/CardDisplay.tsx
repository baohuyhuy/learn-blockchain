import { useState, useEffect, useRef } from "react";
import Masonry from "react-masonry-css";
import ArrowDropDownCircleOutlinedIcon from '@mui/icons-material/ArrowDropDownCircleOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { Token, Dex } from "../../../config/interfaces";

import { RaydiumPoolURL, OrcaPoolURL, MeteoraPoolURL } from "../../../config/interfaces";

const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

const CardDisplay: React.FC<{ token : Token }> = ({ token }) => {
    const priceChangePercentage = (token.priceChange / token.previousPrice) * 100;
    const minPrice = token.currentPrice;

    const poolLink: { [key: string]: string } = {
        Raydium: `${RaydiumPoolURL}${token.address}`,
        Orca: `${OrcaPoolURL}${token.address}`,
        Meteora: `${MeteoraPoolURL}${token.address}`
    };

    const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

    const handleDropDown = (index: number) => {
        setExpandedIndexes(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    }

    // Store dex blink states
    const [dexBlinkStates, setDexBlinkStates] = useState<{
        [key: number]: { isBlinking: boolean; isIncrease: boolean }
    }>({});
    
    // Store previous values for comparison
    const prevDexValues = useRef<{ [key: number]: number }>({});

    // Check for price changes and trigger blink effect
    useEffect(() => {
        const newBlinkStates: { [key: number]: { isBlinking: boolean; isIncrease: boolean } } = {};
        let hasChanges = false;
        
        token.dexes.forEach((dex, index) => {
            const prevPrice = prevDexValues.current[index] || 0;
            
            // If we have a previous price and it's different, trigger blink
            if (prevPrice !== 0) {
                newBlinkStates[index] = {
                    isBlinking: true,
                    isIncrease: dex.price >= prevPrice
                };
                hasChanges = true;
            }
            
            // Update previous price reference
            prevDexValues.current[index] = dex.price;
        });
        
        if (hasChanges) {
            // Set the blink states
            setDexBlinkStates(newBlinkStates);
            
            // Clear blink after animation completes
            const timer = setTimeout(() => {
                setDexBlinkStates({});
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [token.dexes[0].price, token.dexes[1].price, token.dexes[2].price]);

    return (
    <div className="bg-zinc-900 text-gray-100 p-4 rounded-lg shadow-lg mb-4 border border-zinc-700 w-[17.5vw]
        transition-all duration-300 ease-in-out group
        hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-[#222225]">
        {/* Token Icon and Name */}
        <div className="flex items-center gap-2">
            <img src={token.icon} alt={token.name} className="w-10 h-10 rounded-full mr-2" />
            <div>
                <div className="font-bold text-lg">{token.name}</div>
                <div className="text-sm text-zinc-400">
                    {truncateAddress(token.address)}
                    <div className="inline-block ml-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(token.address)}>
                        <ContentCopyOutlinedIcon className="inline-block" style={{ fontSize: '0.875rem' }} />
                    </div>
                </div>
            </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-zinc-700"></div>

        {/* Best price Information */}
        <div className="mt-2">
            <div className="text-2xl font-bold">{minPrice.toFixed(6)} {token.name}</div>
            <div className="flex justify-between items-center text-sm text-zinc-500">
                <span style={{color: token.priceChange >= 0 ? 'limegreen' : 'red'}}>
                    {priceChangePercentage >= 0 ? '↑' : '↓'} {priceChangePercentage.toFixed(2)}%
                </span>
                <span>({token.priceChange.toFixed(2)})</span>
            </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-700"></div>

        {/* DEX Prices */}
        <div className="mt-2">
            <h3 className="text-xs font-bold uppercase text-gray-300 mb-2">DEX Prices</h3>
            <ul className="text-sm text-gray-400">
            {token.dexes.map((dex: Dex, index) => {
                // Get blink state for this dex
                const blinkState = dexBlinkStates[index];
                const isBlinking = blinkState?.isBlinking || false;
                const isIncrease = blinkState?.isIncrease || false;
                
                // Apply the appropriate class
                const rowClass = `flex justify-between my-2 rounded-md p-1 ${
                    isBlinking 
                        ? (isIncrease ? 'blink-green' : 'blink-red')
                        : ''
                }`;

                return (
                <li key={index}>
                    <div className={rowClass}>
                        <a href={poolLink[dex.name]} target="_blank">
                            <span>{dex.name}</span>
                        </a>
                        <div className="flex items-center gap-2">
                            <span className="text-white">{dex.price.toFixed(6)}</span>
                            <div onClick={() => handleDropDown(index)}>
                                <ArrowDropDownCircleOutlinedIcon className="text-gray-500 transition-all ease duration-300 cursor-pointer" style={{fontSize: '1.25rem', transform: expandedIndexes.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)'}}/>
                            </div>
                        </div>
                    </div>

                    <div className='transition-all duration-300 ease overflow-hidden' style={{ maxHeight: expandedIndexes.includes(index) ? '200px' : '0', opacity: expandedIndexes.includes(index) ? 1 : 0 }}>
                        <div className="flex justify-between flex-col gap-1 mt-2 text-xs text-zinc-400 bg-zinc-800 p-2 rounded group-hover:bg-zinc-700 transition-all duration-300 ease-in-out">
                            <div className="flex justify-between">
                                <span>TVL</span>
                                <span className="font-semibold">${dex.tvl.toLocaleString()}</span>
                            </div>
                            <div className="my-1 border-t border-zinc-600"></div>
                            <div className="flex justify-between">
                                <span>Pool</span>
                                <div>
                                    <span className="font-semibold">{truncateAddress(dex.poolAddress)}</span>
                                    <div className="inline-block ml-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(token.address)}>
                                        <ContentCopyOutlinedIcon className="inline-block" style={{ fontSize: '0.75rem' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="my-2 border-t border-zinc-700"></div>
                    </div>
                </li>
            )})}
            </ul>
        </div>
    </div>
    )
}

const CardDisplayList: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
    const breakpointColumnsObj = {
        default: tokens.length > 3 ? 4 : tokens.length,
        1100: 2,
        700: 1
    };

    return (
        <Masonry
            breakpointCols={breakpointColumnsObj}
            className="flex -m-4"
            columnClassName="m-4 w-full"
        >
            {tokens.map((token, index) => (
                <CardDisplay key={index} token={token} />
            ))}
        </Masonry>
    );
}

export default CardDisplayList;