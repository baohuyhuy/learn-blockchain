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
import { RaydiumProvider } from '../providers/raydium/raydium.provider';
import { DEX_CONSTANTS } from '../../../core/constants';

@Injectable()
@WebSocketGateway({ 
  cors: true, 
  namespace: DEX_CONSTANTS.WEBSOCKET_NAMESPACES.RAYDIUM 
})
export class RaydiumGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly raydiumProvider: RaydiumProvider) {}

  handleConnection(client: Socket) {
    console.log(`[Raydium] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Raydium] Client disconnected: ${client.id}`);
    this.raydiumProvider.stopMonitor(client);
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.START_MONITORING)
  async handleStartMonitoring(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tokens: string[]; pollingInterval: number }
  ) {
    try {
      for (const tokenMint of data.tokens) {
        this.raydiumProvider.startMonitor(tokenMint, client, data.pollingInterval);
        console.log(`[Raydium] Started monitoring token: ${tokenMint}`);

        await new Promise(resolve => setTimeout(resolve, DEX_CONSTANTS.DELAY_BETWEEN_CONNECTIONS_MS));
      }
    } catch (error) {
      console.error(`[Raydium] Error starting monitoring:`, error);
    }
  }

  @SubscribeMessage(DEX_CONSTANTS.EVENTS.STOP_MONITORING)
  async handleStopMonitoring(@ConnectedSocket() client: Socket) {
    try {
      this.raydiumProvider.stopMonitor(client);
      console.log(`[Raydium] Stopped monitoring for client: ${client.id}`);
    } catch (error) {
      console.error(`[Raydium] Error stopping monitoring:`, error);
    }
  }
}
