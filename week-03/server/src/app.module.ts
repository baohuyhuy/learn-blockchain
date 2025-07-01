import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DexModule } from './modules/dex/dex.module';

@Module({
  imports: [DexModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
