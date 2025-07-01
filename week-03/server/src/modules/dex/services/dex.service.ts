import { Injectable } from '@nestjs/common';
import { RaydiumProvider } from '../providers/raydium/raydium.provider';
import { OrcaProvider } from '../providers/orca/orca.provider';
import { MeteoraProvider } from '../providers/meteora/meteora.provider';
import { IDexProvider } from '../../../core/interfaces/price-monitor.interface';

@Injectable()
export class DexService {
  private providers: Map<string, IDexProvider> = new Map();

  constructor(
    private readonly raydiumProvider: RaydiumProvider,
    private readonly orcaProvider: OrcaProvider,
    private readonly meteoraProvider: MeteoraProvider,
  ) {
    // Register providers
    this.providers.set('raydium', raydiumProvider);
    this.providers.set('orca', orcaProvider);
    this.providers.set('meteora', meteoraProvider);
  }

  /**
   * Get a specific DEX provider by name
   */
  getProvider(dexName: string): IDexProvider | undefined {
    return this.providers.get(dexName.toLowerCase());
  }

  /**
   * Get all available DEX providers
   */
  getAllProviders(): IDexProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get list of supported DEX names
   */
  getSupportedDexes(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a DEX is supported
   */
  isSupported(dexName: string): boolean {
    return this.providers.has(dexName.toLowerCase());
  }
}
