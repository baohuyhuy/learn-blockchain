import { Socket } from 'socket.io';

export interface IDexProvider {

  startMonitor(
    tokenMint: string, 
    client: Socket, 
    pollingInterval: number
  ): Promise<void>;
  
  stopMonitor(client: Socket): Promise<void>;  
}
