import React, { useEffect, useState, useRef } from 'react';
import CardDisplayList from './components/CardDisplay'
import Input from './components/Input';
import ScrollToTop from './components/ScrollToTop';
import { io, Socket } from 'socket.io-client';

import {Token, Dex} from '../../config/interfaces';

// const tokens = [
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
// 		name: 'USDC',
// 		address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
// 		currentPrice: 1.00,
// 		previousPrice: 0.99,
// 		priceChange: 1.01,
// 		dexes: [
// 			{ name: 'Raydium', price: 1.01, tvl: 1200000, poolAddress: '0x1111111111111111111111111111111111111111' },
// 			{ name: 'Orca', price: 1.00, tvl: 900000, poolAddress: '0x2222222222222222222222222222222222222222' },
// 			{ name: 'Meteora', price: 0.99, tvl: 850000, poolAddress: '0x3333333333333333333333333333333333333333' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB.png',
// 		name: 'USDT',
// 		address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
// 		currentPrice: 1.00,
// 		previousPrice: 1.01,
// 		priceChange: -0.99,
// 		dexes: [
// 			{ name: 'Raydium', price: 1.01, tvl: 1100000, poolAddress: '0x4444444444444444444444444444444444444444' },
// 			{ name: 'Orca', price: 1.00, tvl: 870000, poolAddress: '0x5555555555555555555555555555555555555555' },
// 			{ name: 'Meteora', price: 0.99, tvl: 800000, poolAddress: '0x6666666666666666666666666666666666666666' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E.png',
// 		name: 'BTC',
// 		address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
// 		currentPrice: 66000,
// 		previousPrice: 65000,
// 		priceChange: 1.54,
// 		dexes: [
// 			{ name: 'Raydium', price: 66100, tvl: 950000, poolAddress: '0x7777777777777777777777777777777777777777' },
// 			{ name: 'Orca', price: 65900, tvl: 940000, poolAddress: '0x8888888888888888888888888888888888888888' },
// 			{ name: 'Meteora', price: 66000, tvl: 900000, poolAddress: '0x9999999999999999999999999999999999999999' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk.png',
// 		name: 'ETH',
// 		address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
// 		currentPrice: 3300,
// 		previousPrice: 3200,
// 		priceChange: 3.13,
// 		dexes: [
// 			{ name: 'Raydium', price: 3310, tvl: 870000, poolAddress: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
// 			{ name: 'Orca', price: 3290, tvl: 880000, poolAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
// 			{ name: 'Meteora', price: 3300, tvl: 850000, poolAddress: '0xcccccccccccccccccccccccccccccccccccccccc' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/E4Q5pLaEiejwEQHcM9GeYSQfMyGy8DJ4bPWgeYthn24v.png',
// 		name: 'ADA',
// 		address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
// 		currentPrice: 0.45,
// 		previousPrice: 0.42,
// 		priceChange: 7.14,
// 		dexes: [
// 			{ name: 'Raydium', price: 0.46, tvl: 500000, poolAddress: '0xdddddddddddddddddddddddddddddddddddddddd' },
// 			{ name: 'Orca', price: 0.45, tvl: 480000, poolAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' },
// 			{ name: 'Meteora', price: 0.44, tvl: 470000, poolAddress: '0xffffffffffffffffffffffffffffffffffffffff' }
// 		]
// 	},
// 	{
// 		icon: 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
// 		name: 'DOT',
// 		address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
// 		currentPrice: 6.25,
// 		previousPrice: 6.00,
// 		priceChange: 4.17,
// 		dexes: [
// 			{ name: 'Raydium', price: 6.3, tvl: 420000, poolAddress: '0xaaaabbbbccccddddeeeeffff0000111122223333' },
// 			{ name: 'Orca', price: 6.2, tvl: 410000, poolAddress: '0x4444555566667777888899990000aaaabbbbcccc' },
// 			{ name: 'Meteora', price: 6.25, tvl: 400000, poolAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/AUrMpCDYYcPuHhyNX8gEEqbmDPFUpBpHrNW3vPeCFn5Z.png',
// 		name: 'AVAX',
// 		address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
// 		currentPrice: 28.7,
// 		previousPrice: 27.0,
// 		priceChange: 6.30,
// 		dexes: [
// 			{ name: 'Raydium', price: 28.9, tvl: 600000, poolAddress: '0x1111222233334444555566667777888899990000' },
// 			{ name: 'Orca', price: 28.6, tvl: 580000, poolAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' },
// 			{ name: 'Meteora', price: 28.7, tvl: 570000, poolAddress: '0x1234123412341234123412341234123412341234' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/CWE8jPTUYhdCTZYWPTe1o5DFqfdjzWKc9WKz6rSjQUdG.png',
// 		name: 'LINK',
// 		address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
// 		currentPrice: 14.3,
// 		previousPrice: 14.0,
// 		priceChange: 2.14,
// 		dexes: [
// 			{ name: 'Raydium', price: 14.4, tvl: 300000, poolAddress: '0x4321432143214321432143214321432143214321' },
// 			{ name: 'Orca', price: 14.2, tvl: 295000, poolAddress: '0xabcdef1234abcdef1234abcdef1234abcdef1234' },
// 			{ name: 'Meteora', price: 14.3, tvl: 290000, poolAddress: '0x8765432187654321876543218765432187654321' }
// 		]
// 	},
// 	{
// 		icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
// 		name: 'LTC',
// 		address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94',
// 		currentPrice: 82.1,
// 		previousPrice: 80.0,
// 		priceChange: 2.63,
// 		dexes: [
// 			{ name: 'Raydium', price: 82.5, tvl: 450000, poolAddress: '0xdead0000dead0000dead0000dead0000dead0000' },
// 			{ name: 'Orca', price: 82.0, tvl: 440000, poolAddress: '0xbeef0000beef0000beef0000beef0000beef0000' },
// 			{ name: 'Meteora', price: 81.8, tvl: 430000, poolAddress: '0xfeed0000feed0000feed0000feed0000feed0000' }
// 		]
// 	},
// 	{
// 		icon: 'https://img-v1.raydium.io/icon/CiKu4eHsVrc1eueVQeHn7qhXTcVu95gSQmBpX4utjL9z.png',
// 		name: 'SHIB',
// 		address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
// 		currentPrice: 0.000024,
// 		previousPrice: 0.000022,
// 		priceChange: 9.09,
// 		dexes: [
// 			{ name: 'Raydium', price: 0.000025, tvl: 300000, poolAddress: '0x9999000099990000999900009999000099990000' },
// 			{ name: 'Orca', price: 0.000024, tvl: 290000, poolAddress: '0x8888000088880000888800008888000088880000' },
// 			{ name: 'Meteora', price: 0.000023, tvl: 280000, poolAddress: '0x7777000077770000777700007777000077770000' }
// 		]
// 	},

// 	// 6 more tokens will follow in next message to stay within limits
// ];

const findMinPrice = (dexes: Dex[]) => {
	return dexes.reduce((min, dex) => Math.min(min, dex.price), Infinity);
}

const Home = () => {
	const raydiumSocketRef = useRef<Socket | null>(null);
	const orcaSocketRef = useRef<Socket | null>(null);
	const meteoraSocketRef = useRef<Socket | null>(null);

	const [tokenMints, setTokenMints] = useState<string[]>([]);
	const [tokens, setTokens] = useState<Token[]>([]);

	const handleUpdateTokens = (data: any) => {
		if (!data || typeof data !== 'object') {
			console.error('Invalid data received:', data);
			return;
		}

		setTokens((prevTokens) => {
			const tokenIndex = prevTokens.findIndex(token => token.address === data.mintB);
			
			if (tokenIndex === -1) {
				// Token not found, create a new one
				const newToken: Token = {
					icon: data.logoURI || 'https://img-v1.raydium.io/icon/default.png',
					name: data.symbolName,
					address: data.mintB,
					currentPrice: data.price,
					previousPrice: data.price,
					priceChange: 0,
					dexes: [{
						name: data.platform,
						price: data.price,
						tvl: data.tvl,
						poolAddress: data.poolAddress
					}]
				};
				console.log('Adding new token:', prevTokens.length, newToken);
				return [...prevTokens, newToken];
			}

			// Create a new array with the updated token
			const updatedTokens = [...prevTokens];
			const token = { ...updatedTokens[tokenIndex] }; // Create a copy of the token
			
			// Update dexes
			const dexIndex = token.dexes.findIndex(dex => dex.name === data.platform);
			if (dexIndex !== -1) {
				// Update existing dex price by creating a new array
				token.dexes = token.dexes.map((dex, index) => 
					index === dexIndex 
						? {
							...dex,
							price: data.price,
							tvl: data.tvl,
							poolAddress: data.poolAddress
						}
						: dex
				);
			} else {
				// Add new dex
				token.dexes = [...token.dexes, {
					name: data.platform,
					price: data.price,
					tvl: data.tvl,
					poolAddress: data.poolAddress
				}];
			}

			const previousPrice = token.currentPrice;
			const currentPrice = findMinPrice(token.dexes);
			const priceChange = currentPrice - previousPrice;

			// Update token properties
			updatedTokens[tokenIndex] = {
				...token,
				icon: data.logoURI || 'https://img-v1.raydium.io/icon/default.png',
				name: data.symbolName,
				address: data.mintB,
				currentPrice: currentPrice,
				previousPrice: previousPrice,
				priceChange: priceChange
			};

			return updatedTokens;
		});
	};

	// Initialize Socket.IO connection once when the component mounts
    useEffect(() => {
        // Initialize sockets
        raydiumSocketRef.current = io('http://localhost:3001/raydium');
        orcaSocketRef.current = io('http://localhost:3001/orca');
        meteoraSocketRef.current = io('http://localhost:3001/meteora');

        // Set up event listeners
        const sockets = [
            { ref: raydiumSocketRef.current, name: 'Raydium' },
            { ref: orcaSocketRef.current, name: 'Orca' },
            { ref: meteoraSocketRef.current, name: 'Meteora' }
        ];

        sockets.forEach(({ ref, name }) => {
            ref.on('connect', () => console.log(`${name} Socket.IO connected`));
            ref.on('connect_error', (error) => console.error(`${name} Socket.IO connection error:`, error));
            ref.on('update', (data) => {
				console.log(`${name} Update:`, data);
				handleUpdateTokens(data);
			});
            ref.on('error', (error) => console.error(`${name} Socket.IO error:`, error));
            ref.on('disconnect', () => console.log(`${name} Socket.IO disconnected`));
        });

        // Cleanup on unmount
        return () => {
            sockets.forEach(({ ref }) => ref.disconnect());
        };
    }, []);

    const handleStartMonitoring = (tokens: string[]) => {
        setTokenMints(tokens);

        tokens.forEach((tokenMint) => {
			console.log(`Starting monitoring for token: ${tokenMint}`);
            [raydiumSocketRef, orcaSocketRef, meteoraSocketRef].forEach(socketRef => {
                if (socketRef.current) {
                    socketRef.current.emit('startMonitor', { tokenMint });
                } else {
                    console.error('Socket.IO client is not initialized');
                }
            });
        });
    };

    const handleStopMonitoring = () => {
        [raydiumSocketRef, orcaSocketRef, meteoraSocketRef].forEach(socketRef => {
            if (socketRef.current) {
                socketRef.current.emit('stopMonitor', {});
            }
        });
        console.log('Socket.IO stopped monitoring');
        setTokenMints([]);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-40 pb-20">
			<ScrollToTop />
			<h1 className="text-[4rem] font-bold text-white mb-6">Token Price Monitor</h1>
			<p className="text-lg text-zinc-400 mb-8">
				Monitor the best prices for your favorite tokens across multiple DEXes.
			</p>
			<Input onStartMonitoring={handleStartMonitoring} onStopMonitoring={handleStopMonitoring} />
			<div className="">
				{tokens.length > 0 ? (
					<>
						<h1 className="text-2xl font-semibold text-white mb-4 ml-0 mr-auto">
							Available Tokens
						</h1>
						<CardDisplayList tokens={tokens} />
					</>
				) : (
					<div className="text-lg text-zinc-500">
						No tokens being monitored. Please start monitoring tokens.
					</div>
				)}
			</div>
		</div>
    )
}

export default Home