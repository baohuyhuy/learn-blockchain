import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

function App() {
	const inputTokenRef = useRef<HTMLTextAreaElement>(null);
	const raydiumSocketRef = useRef<Socket | null>(null);
	const orcaSocketRef = useRef<Socket | null>(null);
	const meteoraSocketRef = useRef<Socket | null>(null);

	const [tokenMints, setTokenMints] = useState<string[]>([]);

	// Initialize Socket.IO connection once when the component mounts
    useEffect(() => {
		raydiumSocketRef.current = io('http://localhost:3001/raydium');
		orcaSocketRef.current = io('http://localhost:3001/orca');
		meteoraSocketRef.current = io('http://localhost:3001/meteora');

		raydiumSocketRef.current.on('connect_error', (error) => {
			console.error('Socket.IO connection error:', error);
		});
		orcaSocketRef.current.on('connect_error', (error) => {
			console.error('Socket.IO connection error:', error);
		});
		meteoraSocketRef.current.on('connect_error', (error) => {
			console.error('Meteora Socket.IO connection error:', error);
		});

        raydiumSocketRef.current.on('connect', () => {
            console.log('Socket.IO connected');
        });
		orcaSocketRef.current.on('connect', () => {
			console.log('Socket.IO connected to Orca');
		});
		meteoraSocketRef.current.on('connect', () => {
			console.log('Meteora Socket.IO connected');
		});

        raydiumSocketRef.current.on('update', (data) => {
            console.log('Raydium Update:', data);
        });
		orcaSocketRef.current.on('update', (data) => {
			console.log('Orca Update:', data);
		});
		meteoraSocketRef.current.on('update', (data) => {
			console.log('Meteora Update:', data);
		});

        raydiumSocketRef.current.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });
		orcaSocketRef.current.on('error', (error) => {
			console.error('Orca Socket.IO error:', error);
		});
		meteoraSocketRef.current.on('error', (error) => {
			console.error('Meteora Socket.IO error:', error);
		});

        raydiumSocketRef.current.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });
		orcaSocketRef.current.on('disconnect', () => {
			console.log('Orca Socket.IO disconnected');
		});
		meteoraSocketRef.current.on('disconnect', () => {
			console.log('Meteora Socket.IO disconnected');
		});

        return () => {
            raydiumSocketRef.current?.disconnect();
			orcaSocketRef.current?.disconnect();
			meteoraSocketRef.current?.disconnect();
        };
    }, []);

	const handleStartMonitoring = () => {
		const input = inputTokenRef.current?.value.trim();

		if (!input) {
			alert('Please enter a token mint address.');
			return;
		}

		// Split the input by new lines, trim each line, and filter out empty lines
		const newTokenmints = input.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
		setTokenMints(newTokenmints);

		// Emit the startMonitor event for each token mint
		newTokenmints.forEach((tokenMint) => {
			if (raydiumSocketRef.current && orcaSocketRef.current && meteoraSocketRef.current) {
				console.log(`Starting monitoring for token: ${tokenMint}`);
				raydiumSocketRef.current.emit('startMonitor', { tokenMint });
				orcaSocketRef.current.emit('startMonitor', { tokenMint });
				meteoraSocketRef.current.emit('startMonitor', { tokenMint });
			} else {
				console.error('Socket.IO client is not initialized');
			}
		});
	}

	const handleStopMonitoring = () => {
		// Emit the stopMonitor event to stop monitoring all tokens
		if (raydiumSocketRef.current && orcaSocketRef.current && meteoraSocketRef.current) {
			console.log(`Stopping monitoring for tokens: ${tokenMints.join(', ')}`);
			raydiumSocketRef.current.emit('stopMonitor', {});
			orcaSocketRef.current.emit('stopMonitor', {});
			meteoraSocketRef.current.emit('stopMonitor', {});
		}
		console.log('Socket.IO stopped monitoring');
		setTokenMints([]);
	};

	return (
		<div>
			<h2>Socket.IO Raydium Monitor</h2>

			<textarea rows={10} cols={50} ref={inputTokenRef}></textarea>
			<button onClick={handleStartMonitoring}>
				Start Monitoring
			</button>
			<button onClick={handleStopMonitoring} disabled={tokenMints.length === 0}>
				Stop Monitoring
			</button>
		</div>
	);
}

export default App;
