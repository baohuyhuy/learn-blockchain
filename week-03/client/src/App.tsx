import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

function App() {
	const inputTokenRef = useRef<HTMLTextAreaElement>(null);
	const socketRef = useRef<Socket | null>(null);

	const [tokenMints, setTokenMints] = useState<string[]>([]);

	// Initialize Socket.IO connection once when the component mounts
    useEffect(() => {
		socketRef.current = io('http://localhost:3001/raydium');

		socketRef.current.on('connect_error', (error) => {
			console.error('Socket.IO connection error:', error);
		});

        socketRef.current.on('connect', () => {
            console.log('Socket.IO connected');
        });

        socketRef.current.on('update', (data) => {
            console.log('Update:', data);
        });

        socketRef.current.on('error', (error) => {
            console.error('Socket.IO error:', error);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });

        return () => {
            socketRef.current?.disconnect();
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
			if (socketRef.current) {
				console.log(`Starting monitoring for token: ${tokenMint}`);
				socketRef.current.emit('startMonitor', { tokenMint });
			} else {
				console.error('Socket.IO client is not initialized');
			}
		});
	}

	const handleStopMonitoring = () => {
		// Emit the stopMonitor event to stop monitoring all tokens
		if (socketRef.current) {
			console.log(`Stopping monitoring for tokens: ${tokenMints.join(', ')}`);
			socketRef.current.emit('stopMonitor', {});
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
