import React, { useEffect, useState, useRef } from 'react';
import CardDisplayList from './components/CardDisplay'
import Input from './components/Input';
import ScrollToTop from './components/ScrollToTop';
import { io, Socket } from 'socket.io-client';

import {Token, Dex} from '../../config/interfaces';
import MouseLight from './components/MouseLight';

const findMaxPrice = (dexes: Dex[]) => {
	if (dexes.length === 0) return 0;
	
	return dexes.reduce((max, dex) => dex.price > max ? dex.price : max, dexes[0].price);
}

const platformOrder = ['Raydium', 'Orca', 'Meteora'];

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
					dexes: [
						{
							name: platformOrder[0],
							prevPrice: 0,
							price: 0,
							tvl: 0,
							poolAddress: ''
						},
							{
							name: platformOrder[1],
							prevPrice: 0,
							price: 0,
							tvl: 0,
							poolAddress: ''
						},
						{
							name:  platformOrder[2],
							prevPrice: 0,
							price: 0,
							tvl: 0,
							poolAddress: ''
						},
					]
				};

				// Add dexes based on the platform
				
				const dexIndex = newToken.dexes.findIndex(dex => dex.name === data.platform);
				if (dexIndex !== -1) {
					newToken.dexes[dexIndex] = {
						name: data.platform,
						prevPrice: 0, // Set previous price to 0 for new tokens
						price: data.price,
						tvl: data.tvl,
						poolAddress: data.poolAddress
					}
				}

				// console.log('Adding new token:', prevTokens.length, newToken);
				return [...prevTokens, newToken];
			}

			// Create a new array with the updated token
			const updatedTokens = [...prevTokens];
			const token = { ...updatedTokens[tokenIndex] }; // Create a copy of the token
			
			// Update dexes
			const dexIndex = token.dexes.findIndex(dex => dex.name === data.platform);
			if (dexIndex !== -1) {
				// Update existing dex price by creating a new array
				const newDex = {
					name: data.platform,
					prevPrice: token.dexes[dexIndex].price,
					price: data.price,
					tvl: data.tvl,
					poolAddress: data.poolAddress
				};

				token.dexes[dexIndex] = newDex;
			}

			const previousPrice = token.currentPrice;
			const currentPrice = findMaxPrice(token.dexes);
			const priceChange = currentPrice - previousPrice;
			const icon = updatedTokens[tokenIndex].icon == 'https://img-v1.raydium.io/icon/default.png' ? data.logoURI : updatedTokens[tokenIndex].icon;
			// console.log(icon)
			// Update token properties
			updatedTokens[tokenIndex] = {
				...token,
				icon: icon,
				name: token.name || data.symbolName,
				address: token.address || data.mintB,
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

    const handleStartMonitoring = async (tokens: string[]) => {
		// Clear previous tokens
		setTokens([]);
        setTokenMints(tokens);

		// Prepare polling interval
		const pollingInterval = tokens.length * 4000;

		console.log(`Starting monitoring for token: ${tokens}`);

		const dexRef = [raydiumSocketRef, orcaSocketRef, meteoraSocketRef];
		  for (const socketRef of dexRef) {
			if (socketRef.current) {
				socketRef.current.emit('startMonitor', { tokens, pollingInterval });
				// Wait for a short time before starting the next socket
				await new Promise(resolve => setTimeout(resolve, 1000));
			} else {
				console.error('Socket.IO client is not initialized');
			}
		}
    };

    const handleStopMonitoring = async () => {
        const dexRef = [raydiumSocketRef, orcaSocketRef, meteoraSocketRef];
		for (const socketRef of dexRef) {
			if (socketRef.current) {
				socketRef.current.emit('stopMonitor');
				// Wait for a short time before stopping the next socket
				await new Promise(resolve => setTimeout(resolve, 1000));
			} else {
				console.error('Socket.IO client is not initialized');
			}
		}
        console.log('Socket.IO stopped monitoring');
        setTokenMints([]);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 pt-40 pb-20">
			<MouseLight color="#ffffff" size={200} opacity={0.11} blur={40} />
			<ScrollToTop />
			<h1 className="text-[5rem] font-bold mb-2 bg-gradient-to-b from-white to-zinc-900 bg-clip-text text-transparent drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative">
				<span className="absolute inset-0 text-[5rem] font-bold text-transparent -z-10" style={{
					WebkitTextStroke: '1px rgba(255,255,255,0.3)'
				}}>Token Price Monitor</span>
				Token Price Monitor
			</h1>
			<p className="text-lg text-zinc-400 mb-20">
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