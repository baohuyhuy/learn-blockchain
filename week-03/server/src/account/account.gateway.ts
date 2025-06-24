import {
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
	ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import * as raydium from 'src/raydium/server';
import * as orca from 'src/orca/server';
import * as meteora from 'src/meteora/server';

const delayBetweenConnectionsMs = 1500;

async function connectAllTokenMint(tokens: string[], platform: any, client: Socket) {
	for (const tokenMint of tokens) {
		try {
			await platform.startMonitor(tokenMint, client);
			console.log(`Started monitoring token: ${tokenMint}`);
		} catch (error) {
			console.error(`Error starting monitor for token ${tokenMint}:`, error);
		}
		await new Promise(resolve => setTimeout(resolve, delayBetweenConnectionsMs));
	}
}

async function stopAllTokenMint(platform: any, client: Socket) {
	try {
		await platform.stopMonitor();
		console.log(`Stopped monitoring for client: ${client.id}`);
	} catch (error) {
		console.error(`Error stopping monitor for client ${client.id}:`, error);
	}
}

@WebSocketGateway({ cors: true, namespace: '/raydium' })
export class RaydiumGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		console.log('Client connected:', client.id);
	}

	handleDisconnect(client: Socket) {
		console.log('Client disconnected:', client.id);
	}

	@SubscribeMessage('startMonitor')
	async handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokens } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		await connectAllTokenMint(tokens, raydium, client);
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		await stopAllTokenMint(raydium, client)
	}
}

@WebSocketGateway({ cors: true, namespace: '/orca' })
export class OrcaGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		console.log('Client connected:', client.id);
	}

	handleDisconnect(client: Socket) {
		console.log('Client disconnected:', client.id);
	}

	@SubscribeMessage('startMonitor')
	async handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokens } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		// Start monitoring the token mint
		await connectAllTokenMint(tokens, orca, client)
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		await stopAllTokenMint(orca, client)
	}
}

@WebSocketGateway({ cors: true, namespace: '/meteora' })
export class Meteora implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		console.log('Client connected:', client.id);
	}

	handleDisconnect(client: Socket) {
		console.log('Client disconnected:', client.id);
	}

	@SubscribeMessage('startMonitor')
	async handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokens } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		// Start monitoring the token mint
		await connectAllTokenMint(tokens, meteora, client);
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		await stopAllTokenMint(meteora, client);
	}
}