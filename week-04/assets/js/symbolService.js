import { CRYPTO_MAPPINGS } from './config.js';

export class SymbolService {
    static formatSymbol(symbol) {
        symbol = symbol.trim().toUpperCase();
        
        // If already formatted (contains :), return as is
        if (symbol.includes(':')) {
            return symbol;
        }
        
        // If it's a known crypto, use mapping
        if (CRYPTO_MAPPINGS[symbol]) {
            return CRYPTO_MAPPINGS[symbol];
        }
        
        // For stocks, add NASDAQ prefix
        return `NASDAQ:${symbol}`;
    }

    static parseSymbol(formattedSymbol) {
        if (formattedSymbol.includes(':')) {
            const [exchange, symbol] = formattedSymbol.split(':');
            return { exchange, symbol };
        }
        return { exchange: null, symbol: formattedSymbol };
    }

    static isValidSymbol(symbol) {
        // Basic validation - can be enhanced
        return symbol && symbol.trim().length > 0;
    }

    static getDisplayName(formattedSymbol) {
        const { symbol } = this.parseSymbol(formattedSymbol);
        return symbol;
    }

    static isCrypto(formattedSymbol) {
        const cryptoExchanges = ['BINANCE', 'BITSTAMP', 'COINBASE', 'KRAKEN'];
        const { exchange } = this.parseSymbol(formattedSymbol);
        return cryptoExchanges.includes(exchange);
    }

    static isStock(formattedSymbol) {
        const stockExchanges = ['NASDAQ', 'NYSE', 'LSE', 'TSE'];
        const { exchange } = this.parseSymbol(formattedSymbol);
        return stockExchanges.includes(exchange);
    }
}
