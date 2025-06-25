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

import * as raydium from 'src/raydium/raydium.service';
import * as orca from 'src/orca/orca.service';
import * as meteora from 'src/meteora/meteora.service';

const delayBetweenConnectionsMs = 1500;

async function connectAllTokenMint(tokens: string[], platform: any, client: Socket, pollingInterval: number) {
	for (const tokenMint of tokens) {
		try {
			platform.startMonitor(tokenMint, client, pollingInterval);
			console.log(`Started monitoring token: ${tokenMint}`);
		} catch (error) {
			console.error(`Error starting monitor for token ${tokenMint}:`, error);
		}

		// Wait for a short delay before connecting the next token
		await new Promise(resolve => setTimeout(resolve, delayBetweenConnectionsMs));
	}
}

async function stopAllTokenMint(platform: any, client: Socket) {
	try {
		platform.stopMonitor(client);
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
		const { tokens, pollingInterval } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		connectAllTokenMint(tokens, raydium, client, pollingInterval);
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		stopAllTokenMint(raydium, client)
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
		const { tokens, pollingInterval } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		// Start monitoring the token mint
		connectAllTokenMint(tokens, orca, client, pollingInterval)
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		stopAllTokenMint(orca, client)
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
		const { tokens, pollingInterval } = data;

		if (!tokens || tokens.length === 0) {
			console.error('No tokens provided for monitoring');
			return;
		}

		// Start monitoring the token mint
		connectAllTokenMint(tokens, meteora, client, pollingInterval);
	}

	@SubscribeMessage('stopMonitor')
	async handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		stopAllTokenMint(meteora, client);
	}
}