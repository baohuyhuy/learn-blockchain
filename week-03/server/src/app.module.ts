import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RaydiumGateway, OrcaGateway, Meteora } from './account/account.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RaydiumGateway, OrcaGateway, Meteora],
})
export class AppModule {}
