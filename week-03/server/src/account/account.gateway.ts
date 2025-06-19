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
	handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokenMint } = data;

		console.log(`Client ${client.id} monitoring: ${tokenMint}`);

		// Start monitoring the token mint
		raydium.startMonitor(tokenMint, client)
			.then(() => {
				console.log(`Started monitoring token: ${tokenMint} for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error starting monitor for token ${tokenMint}:`, error);
			});
	}

	@SubscribeMessage('stopMonitor')
	handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		raydium.stopMonitor()
			.then(() => {
				console.log(`Stopped monitoring for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error stopping monitor for client ${client.id}:`, error);
			});
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
	handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokenMint } = data;

		console.log(`Client ${client.id} monitoring: ${tokenMint}`);

		// Start monitoring the token mint
		orca.startMonitor(tokenMint, client)
			.then(() => {
				console.log(`Started monitoring token: ${tokenMint} for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error starting monitor for token ${tokenMint}:`, error);
			});
	}

	@SubscribeMessage('stopMonitor')
	handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		orca.stopMonitor()
			.then(() => {
				console.log(`Stopped monitoring for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error stopping monitor for client ${client.id}:`, error);
			});
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
	handleMonitor(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { tokenMint } = data;

		console.log(`Client ${client.id} monitoring: ${tokenMint}`);

		// Start monitoring the token mint
		meteora.startMonitor(tokenMint, client)
			.then(() => {
				console.log(`Started monitoring token: ${tokenMint} for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error starting monitor for token ${tokenMint}:`, error);
			});
	}

	@SubscribeMessage('stopMonitor')
	handleStopMonitor(@ConnectedSocket() client: Socket) {
		console.log(`Client ${client.id} stopped monitoring`);

		// Stop monitoring
		meteora.stopMonitor()
			.then(() => {
				console.log(`Stopped monitoring for client: ${client.id}`);
			})
			.catch((error) => {
				console.error(`Error stopping monitor for client ${client.id}:`, error);
			});
	}
}