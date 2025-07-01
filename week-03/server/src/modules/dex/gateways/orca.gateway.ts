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
import { Injectable } from '@nestjs/common';
import { OrcaProvider } from '../providers/orca/orca.provider';
import { DEX_CONSTANTS } from '../../../core/constants';

@Injectable()
@WebSocketGateway({ 
  cors: true, 
  namespace: DEX_CONSTANTS.WEBSOCKET_NAMESPACES.ORCA 
})
export class OrcaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly orcaProvider: OrcaProvider) {}

  handleConnection(client: Socket) {
    console.log(`[Orca] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Orca] Client disconnected: ${client.id}`);
    this.orcaProvider.stopMonitor(client);
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.START_MONITORING)
  async handleStartMonitoring(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokens: string[]; pollingInterval: number }
  ) {
    try {
      for (const tokenMint of data.tokens) {
        this.orcaProvider.startMonitor(tokenMint, client, data.pollingInterval);
        console.log(`[Orca] Started monitoring token: ${tokenMint}`);
				
				await new Promise(resolve => setTimeout(resolve, DEX_CONSTANTS.DELAY_BETWEEN_CONNECTIONS_MS));
      }

    } catch (error) {
      console.error(`[Orca] Error starting monitoring:`, error);
    }
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.STOP_MONITORING)
  async handleStopMonitoring(@ConnectedSocket() client: Socket) {
    try {
      this.orcaProvider.stopMonitor(client);
      console.log(`[Orca] Stopped monitoring for client: ${client.id}`);
    } catch (error) {
      console.error(`[Orca] Error stopping monitoring:`, error);
    }
  }
}
