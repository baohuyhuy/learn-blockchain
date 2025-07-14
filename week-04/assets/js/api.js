import { CONFIG } from './config.js';
import { Logger } from './utils.js';

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    // Generic API call method
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            Logger.error(`API request failed for ${endpoint}`, error);
            throw error;
        }
    }

    // RSI data simulation (for RSI-14 page)
    async getRSIData(symbol, timeframe = '1D') {
        // Mock RSI data for demo purposes
        // In production, this would call a real API endpoint
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate API delay
            
            // Generate realistic RSI value (30-70 range with some outliers)
            const baseRSI = 30 + Math.random() * 40;
            const volatility = Math.random() * 20 - 10; // -10 to +10
            let rsi = Math.max(0, Math.min(100, baseRSI + volatility));
            
            // Round to 2 decimal places
            rsi = Math.round(rsi * 100) / 100;
            
            return {
                symbol,
                timeframe,
                rsi,
                timestamp: new Date().toISOString(),
                signal: rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'
            };
        } catch (error) {
            Logger.error(`Failed to get RSI data for ${symbol}`, error);
            throw error;
        }
    }
}

// Export singleton instance
export const apiService = new APIService();
