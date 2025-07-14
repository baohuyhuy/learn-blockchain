import { router } from './router.js';
import { Logger } from './utils.js';

export class RSI14Page {
    constructor() {
        this.container = null;
        this.tokens = new Set(); // Store added tokens
        this.updateInterval = null; // For auto-refresh
    }

    render(routeData) {
        Logger.info('Rendering RSI-14 Page', routeData);
        
        this.container = document.querySelector('main');
        
        if (!this.container) {
            Logger.error('Main container not found');
            return;
        }

        this.container.innerHTML = '';
        
        this.container.innerHTML = `
            <div class="page-header">
                <h1>RSI-14 Analysis</h1>
                <p>Real-time Relative Strength Index (14-period) for multiple tokens</p>
            </div>
            
            <div class="rsi-controls">
                <div class="control-group">
                    <label for="rsi-timeframe">Timeframe:</label>
                    <select id="rsi-timeframe">
                        <option value="1s">1 Second</option>
                        <option value="15s" selected>15 Seconds</option>
                        <option value="30s">30 Seconds</option>
                    </select>
                </div>
                <button onclick="rsi14Page.refreshAll()">Refresh All</button>
            </div>
            
            <div class="token-input-section">
                <h3>Add Tokens</h3>
                <div class="token-input-group">
                    <input type="text" id="token-input" placeholder="Enter token symbol (e.g., BTC, ETH, SOL)" />
                    <button onclick="rsi14Page.addToken()">Add Token</button>
                </div>
                <div class="quick-add">
                    <span>Quick Add:</span>
                    <button class="quick-btn" onclick="rsi14Page.addQuickToken('BTC')">BTC</button>
                    <button class="quick-btn" onclick="rsi14Page.addQuickToken('ETH')">ETH</button>
                    <button class="quick-btn" onclick="rsi14Page.addQuickToken('SOL')">SOL</button>
                    <button class="quick-btn" onclick="rsi14Page.addQuickToken('XRP')">XRP</button>
                    <button class="quick-btn" onclick="rsi14Page.addQuickToken('ADA')">ADA</button>
                </div>
            </div>
            
            <div class="tokens-grid" id="tokens-grid">
                <!-- Tokens will be added here dynamically -->
            </div>
        `;

        this.addRSIStyles();
        this.updateNavigation('rsi-14');
        
        // Add some default tokens
        this.addQuickToken('BTC');
        this.addQuickToken('ETH');
        this.addQuickToken('SOL');
        
        // Start auto-refresh
        this.startAutoRefresh();

        // Setup Enter key for token input
        setTimeout(() => {
            const tokenInput = document.getElementById('token-input');
            if (tokenInput) {
                tokenInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addToken();
                    }
                });
            }
        }, 100);
    }

    addRSIStyles() {
        const existingStyle = document.getElementById('rsi-styles');
        if (existingStyle) return;

        const style = document.createElement('style');
        style.id = 'rsi-styles';
        style.textContent = `
            .rsi-controls {
                grid-column: span 2;
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
                align-items: end;
                flex-wrap: wrap;
            }
            
            .control-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .control-group label {
                font-weight: 500;
                color: #333;
                font-size: 0.9rem;
            }
            
            .control-group input,
            .control-group select {
                padding: 8px 12px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
                min-width: 120px;
            }
            
            .rsi-controls button {
                background: linear-gradient(135deg, #2962ff 0%, #00bce5 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                height: fit-content;
            }
            
            .rsi-controls button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(41, 98, 255, 0.3);
            }
            
            .token-input-section {
                grid-column: span 2;
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 1.5rem;
            }
            
            .token-input-section h3 {
                margin: 0 0 1rem 0;
                color: #333;
            }
            
            .token-input-group {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                align-items: center;
            }
            
            .token-input-group input {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 14px;
                max-width: 300px;
            }
            
            .token-input-group input:focus {
                outline: none;
                border-color: #2962ff;
                box-shadow: 0 0 0 3px rgba(41, 98, 255, 0.1);
            }
            
            .token-input-group button {
                background: linear-gradient(135deg, #2962ff 0%, #00bce5 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .token-input-group button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 15px rgba(41, 98, 255, 0.3);
            }
            
            .quick-add {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .quick-add span {
                color: #666;
                font-size: 0.9rem;
                margin-right: 0.5rem;
            }
            
            .quick-btn {
                background: #f8f9fa;
                border: 1px solid #e1e5e9;
                color: #2962ff;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .quick-btn:hover {
                background: #2962ff;
                color: white;
                transform: translateY(-1px);
            }
            
            .tokens-grid {
                grid-column: span 2;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1rem;
            }
            
            .token-card {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                position: relative;
                transition: all 0.3s ease;
            }
            
            .token-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
            
            .token-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .token-name {
                font-weight: bold;
                font-size: 1.1rem;
                color: #333;
            }
            
            .remove-token {
                background: #e74c3c;
                color: white;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .remove-token:hover {
                background: #c0392b;
                transform: scale(1.1);
            }
            
            .rsi-display {
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .rsi-value-large {
                font-size: 2.5rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                display: block;
            }
            
            .rsi-value-large.oversold { color: #27ae60; }
            .rsi-value-large.neutral { color: #f39c12; }
            .rsi-value-large.overbought { color: #e74c3c; }
            
            .rsi-status {
                font-size: 0.9rem;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .rsi-bar {
                width: 100%;
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                margin: 0.5rem 0;
                position: relative;
                overflow: hidden;
            }
            
            .rsi-bar-fill {
                height: 100%;
                border-radius: 4px;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .rsi-bar-fill.oversold { background: linear-gradient(90deg, #27ae60, #2ecc71); }
            .rsi-bar-fill.neutral { background: linear-gradient(90deg, #f39c12, #e67e22); }
            .rsi-bar-fill.overbought { background: linear-gradient(90deg, #e74c3c, #c0392b); }
            
            .rsi-levels-mini {
                display: flex;
                justify-content: space-between;
                font-size: 0.7rem;
                color: #999;
                margin-top: 0.25rem;
            }
            
            .last-updated {
                font-size: 0.7rem;
                color: #999;
                text-align: center;
                margin-top: 0.5rem;
            }
            
            .loading-token {
                text-align: center;
                color: #666;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.route === `/${activePage}`) {
                link.classList.add('active');
            }
        });
    }

    updateAnalysis() {
        const symbol = document.getElementById('rsi-symbol').value;
        const timeframe = document.getElementById('rsi-timeframe').value;
        
        alert(`Updating RSI-14 analysis for ${symbol} on ${timeframe} timeframe - Connect to backend API`);
        // TODO: Implement RSI analysis update
    }

    addToken() {
        const input = document.getElementById('token-input');
        const token = input.value.trim().toUpperCase();
        
        if (!token) {
            alert('Please enter a token symbol');
            return;
        }
        
        if (this.tokens.has(token)) {
            alert('Token already added');
            return;
        }
        
        if (this.tokens.size >= 50) {
            alert('Maximum 50 tokens allowed');
            return;
        }
        
        this.tokens.add(token);
        this.renderTokenCard(token);
        input.value = '';
        
        Logger.info(`Token added: ${token}`);
    }

    addQuickToken(token) {
        if (this.tokens.has(token)) {
            return; // Already added
        }
        
        if (this.tokens.size >= 50) {
            alert('Maximum 50 tokens allowed');
            return;
        }
        
        this.tokens.add(token);
        this.renderTokenCard(token);
    }

    removeToken(token) {
        this.tokens.delete(token);
        const tokenCard = document.getElementById(`token-${token}`);
        if (tokenCard) {
            tokenCard.remove();
        }
        Logger.info(`Token removed: ${token}`);
    }

    renderTokenCard(token) {
        const grid = document.getElementById('tokens-grid');
        const rsiValue = this.generateMockRSI();
        const rsiClass = this.getRSIClass(rsiValue);
        const rsiStatus = this.getRSIStatus(rsiValue);
        const timeframe = document.getElementById('rsi-timeframe').value;
        
        const tokenCard = document.createElement('div');
        tokenCard.className = 'token-card';
        tokenCard.id = `token-${token}`;
        
        tokenCard.innerHTML = `
            <div class="token-header">
                <span class="token-name">${token}</span>
                <button class="remove-token" onclick="rsi14Page.removeToken('${token}')">×</button>
            </div>
            
            <div class="rsi-display">
                <span class="rsi-value-large ${rsiClass}">${rsiValue.toFixed(2)}</span>
                <div class="rsi-status">${rsiStatus}</div>
            </div>
            
            <div class="rsi-bar">
                <div class="rsi-bar-fill ${rsiClass}" style="width: ${rsiValue}%"></div>
            </div>
            
            <div class="rsi-levels-mini">
                <span>0</span>
                <span>30</span>
                <span>70</span>
                <span>100</span>
            </div>
            
            <div class="last-updated">
                Updated: ${new Date().toLocaleTimeString()} (${timeframe})
            </div>
        `;
        
        grid.appendChild(tokenCard);
    }

    generateMockRSI() {
        // Generate realistic RSI values (weighted towards 30-70 range)
        const random = Math.random();
        if (random < 0.1) return Math.random() * 30; // 10% chance oversold
        if (random > 0.9) return 70 + Math.random() * 30; // 10% chance overbought
        return 30 + Math.random() * 40; // 80% chance neutral
    }

    getRSIClass(rsi) {
        if (rsi <= 30) return 'oversold';
        if (rsi >= 70) return 'overbought';
        return 'neutral';
    }

    getRSIStatus(rsi) {
        if (rsi <= 30) return 'Oversold';
        if (rsi >= 70) return 'Overbought';
        if (rsi >= 60) return 'Approaching Overbought';
        if (rsi <= 40) return 'Approaching Oversold';
        return 'Neutral';
    }

    refreshAll() {
        const timeframe = document.getElementById('rsi-timeframe').value;
        Logger.info(`Refreshing all tokens with ${timeframe} timeframe`);
        
        // Update all token cards
        this.tokens.forEach(token => {
            const tokenCard = document.getElementById(`token-${token}`);
            if (tokenCard) {
                // Show loading
                const rsiDisplay = tokenCard.querySelector('.rsi-display');
                rsiDisplay.innerHTML = '<div class="loading-token">Updating...</div>';
                
                // Simulate API call delay
                setTimeout(() => {
                    const rsiValue = this.generateMockRSI();
                    const rsiClass = this.getRSIClass(rsiValue);
                    const rsiStatus = this.getRSIStatus(rsiValue);
                    
                    rsiDisplay.innerHTML = `
                        <span class="rsi-value-large ${rsiClass}">${rsiValue.toFixed(2)}</span>
                        <div class="rsi-status">${rsiStatus}</div>
                    `;
                    
                    // Update bar
                    const barFill = tokenCard.querySelector('.rsi-bar-fill');
                    barFill.className = `rsi-bar-fill ${rsiClass}`;
                    barFill.style.width = `${rsiValue}%`;
                    
                    // Update timestamp
                    const lastUpdated = tokenCard.querySelector('.last-updated');
                    lastUpdated.textContent = `Updated: ${new Date().toLocaleTimeString()} (${timeframe})`;
                    
                }, Math.random() * 1000 + 500); // Random delay 0.5-1.5s
            }
        });
    }

    startAutoRefresh() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Auto-refresh every 5 seconds for demo
        this.updateInterval = setInterval(() => {
            if (this.tokens.size > 0) {
                this.refreshAll();
            }
        }, 5000);
    }

    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const rsi14Page = new RSI14Page();
