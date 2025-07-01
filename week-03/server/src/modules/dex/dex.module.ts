import { Module } from '@nestjs/common';
import { RaydiumGateway } from './gateways/raydium.gateway';
import { OrcaGateway } from './gateways/orca.gateway';
import { MeteoraGateway } from './gateways/meteora.gateway';
import { RaydiumProvider } from './providers/raydium/raydium.provider';
import { OrcaProvider } from './providers/orca/orca.provider';
import { MeteoraProvider } from './providers/meteora/meteora.provider';
import { DexService } from './services/dex.service';

@Module({
  providers: [
    // Gateways
    RaydiumGateway,
    OrcaGateway,
    MeteoraGateway,
    
    // Providers
    RaydiumProvider,
    OrcaProvider,
    MeteoraProvider,
    
    // Services
    DexService,
  ],
  exports: [
    DexService,
    RaydiumProvider,
    OrcaProvider,
    MeteoraProvider,
  ],
})
export class DexModule {}
