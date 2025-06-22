import { useState, useEffect, useRef } from "react";
import Masonry from "react-masonry-css";
import ArrowDropDownCircleOutlinedIcon from '@mui/icons-material/ArrowDropDownCircleOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';

interface Dex {
    name: string;
    price: number;
    tvl: number;
    poolAddress: string;
}

interface Token {
    icon: string;
    name: string;
    address: string;
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    dexes: Dex[];
}

const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

const CardDisplay: React.FC<{ token : Token }> = ({ token }) => {
    const priceChange = token.currentPrice - token.previousPrice;
    const priceChangePercentage = (priceChange / token.previousPrice) * 100;
    const minPrice = token.dexes.reduce((min: number, dex: Dex) => Math.min(min, dex.price), Infinity);

    const [expandedIndexes, setExpandedIndexes] = useState<number[]>([]);

    const handleDropDown = (index: number) => {
        setExpandedIndexes(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    }

    return (
    <div className="bg-zinc-900 text-gray-100 p-4 rounded-lg shadow-lg mb-4 border border-zinc-700 w-[17.5vw]">
        {/* Token Icon and Name */}
        <div className="flex items-center gap-2">
            <img src={token.icon} alt={token.name} className="w-10 h-10 rounded-full mr-2" />
            <div>
                <div className="font-bold text-lg">{token.name}</div>
                <div className="text-sm text-gray-400">
                    {truncateAddress(token.address)}
                    <div className="inline-block ml-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(token.address)}>
                        <ContentCopyOutlinedIcon className="inline-block" style={{ fontSize: '0.875rem' }} />
                    </div>
                </div>
            </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-700"></div>

        {/* Best price Information */}
        <div className="mt-2">
            <div className="text-2xl font-bold">{minPrice.toFixed(2)} {token.name}</div>
            <div className="flex justify-between items-center text-sm text-gray-500">
                <span style={{color: priceChange >= 0 ? 'green' : 'red'}}>
                    {priceChangePercentage >= 0 ? '↑' : '↓'} {priceChangePercentage.toFixed(2)}%
                </span>
                <span>({priceChange.toFixed(2)})</span>
            </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-gray-700"></div>

        {/* DEX Prices */}
        <div className="mt-2">
            <h3 className="text-xs font-bold uppercase text-gray-300 mb-2">DEX Prices</h3>
            <ul className="text-sm text-gray-400">
            {token.dexes.map((dex, index) => (
                <li key={index}>
                    <div className="flex justify-between my-2">
                        <span>{dex.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-white">{dex.price.toFixed(2)} {token.name}</span>
                            <div onClick={() => handleDropDown(index)}>
                                <ArrowDropDownCircleOutlinedIcon className="text-gray-500 transition-all ease duration-300 cursor-pointer" style={{fontSize: '1.25rem', transform: expandedIndexes.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)'}}/>
                            </div>
                        </div>
                    </div>
                    <div className='transition-all duration-300 ease overflow-hidden' style={{ maxHeight: expandedIndexes.includes(index) ? '200px' : '0', opacity: expandedIndexes.includes(index) ? 1 : 0 }}>
                        <div className="flex justify-between flex-col gap-1 mt-2 text-xs text-gray-400 bg-zinc-800 p-2 rounded">
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
                        <div className="my-2 border-t border-gray-700"></div>
                    </div>
                </li>
            ))}
            </ul>
        </div>
    </div>
    )
}

const CardDisplayList: React.FC<{ tokens: Token[] }> = ({ tokens }) => {
    const breakpointColumnsObj = {
        default: 4,
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