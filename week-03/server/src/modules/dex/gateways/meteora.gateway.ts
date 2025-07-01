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
import { MeteoraProvider } from '../providers/meteora/meteora.provider';
import { DEX_CONSTANTS } from '../../../core/constants';

@Injectable()
@WebSocketGateway({ 
  cors: true, 
  namespace: DEX_CONSTANTS.WEBSOCKET_NAMESPACES.METEORA 
})
export class MeteoraGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly meteoraProvider: MeteoraProvider) {}

  handleConnection(client: Socket) {
    console.log(`[Meteora] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Meteora] Client disconnected: ${client.id}`);
    this.meteoraProvider.stopMonitor(client);
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.START_MONITORING)
  async handleStartMonitoring(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokens: string[]; pollingInterval: number }
  ) {
    try {
      for (const tokenMint of data.tokens) {
        this.meteoraProvider.startMonitor(tokenMint, client, data.pollingInterval);
        console.log(`[Meteora] Started monitoring token: ${tokenMint}`);
        
        await new Promise(resolve => setTimeout(resolve, DEX_CONSTANTS.DELAY_BETWEEN_CONNECTIONS_MS));
      }

    } catch (error) {
      console.error(`[Meteora] Error starting monitoring:`, error);
    }
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.STOP_MONITORING)
  async handleStopMonitoring(@ConnectedSocket() client: Socket) {
    try {
      this.meteoraProvider.stopMonitor(client);
      console.log(`[Meteora] Stopped monitoring for client: ${client.id}`);
    } catch (error) {
      console.error(`[Meteora] Error stopping monitoring:`, error);
    }
  }
}
