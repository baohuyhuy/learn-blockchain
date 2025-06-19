import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RaydiumGateway, OrcaGateway } from './account/account.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RaydiumGateway, OrcaGateway],
})
export class AppModule {}
