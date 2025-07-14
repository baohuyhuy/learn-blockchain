import { CONFIG } from './config.js';
import { getQueryParam, updateURL, updatePageTitle, Logger } from './utils.js';
import { SymbolService } from './symbolService.js';
import { TradingViewWidgetFactory } from './tradingViewWidget.js';
import { apiService } from './api.js';
import { router } from './router.js';
import { rsi14Page } from './rsi14Page.js';

class ChartPage {
    constructor() {
        this.currentSymbol = null;
        this.searchInput = null;
        this.init();
    }

    init() {
        // Setup router
        this.setupRoutes();
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    setupRoutes() {
        // Chart page route (default)
        router.addRoute('/', (routeData) => {
            this.handleChartRoute(routeData);
        });

        // RSI-14 route
        router.addRoute('/rsi-14', (routeData) => {
            rsi14Page.render(routeData);
        });

        // Default route (fallback)
        router.addRoute('*', (routeData) => {
            this.handleChartRoute(routeData);
        });
    }

    handleChartRoute(routeData) {
        const symbol = routeData.params.tvwidgetsymbol || CONFIG.DEFAULT_SYMBOL;
        
        // Restore chart view
        const container = document.querySelector('main');
        container.innerHTML = `
            <section id="symbol-info">
                <!-- TradingView Widget BEGIN -->
                <div class="tradingview-widget-container">
                    <div class="tradingview-widget-container__widget">
                        <div class="loading">Loading symbol info...</div>
                    </div>
                </div>
                <!-- TradingView Widget END -->
            </section>
            <section id="advanced-chart">
                <!-- TradingView Widget BEGIN -->
                <div class="tradingview-widget-container" style="height:100%;width:100%">
                <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%">
                    <div class="loading">Loading chart...</div>
                </div>
                <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div>
                </div>
                <!-- TradingView Widget END -->
            </section>
        `;
        
        // Update current symbol
        this.currentSymbol = symbol;
        
        // Load widgets and update state
        setTimeout(() => {
            this.loadWidgets(symbol);
            this.updatePageState(symbol);
        }, 100);
        
        this.updateNavigation('chart');
    }

    initializeApp() {
        Logger.info('Initializing Chart Application');

        // Setup navigation
        this.setupNavigation();
        
        // Initialize router
        router.init();
        
        // Get initial symbol
        const initialSymbol = getQueryParam('tvwidgetsymbol') || CONFIG.DEFAULT_SYMBOL;
        
        // Setup search functionality
        this.setupSearch();
        
        // Always load widgets for the main page
        this.loadWidgets(initialSymbol);
        this.updatePageState(initialSymbol);
        
        Logger.info('Chart Application initialized', { initialSymbol, path: window.location.pathname });
    }

    setupNavigation() {
        // Add click handlers for navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = link.dataset.route;
                router.navigate(route);
            });
        });

        // Add click handler for logo
        document.querySelector('#site-logo').addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/');
        });
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (activePage === 'chart' || activePage === 'charts') {
                if (link.dataset.route === '/') {
                    link.classList.add('active');
                }
            } else if (link.dataset.route === `/${activePage}`) {
                link.classList.add('active');
            }
        });
    }

    setupSearch() {
        this.searchInput = document.querySelector('input[type="search"]');
        
        if (!this.searchInput) {
            Logger.error('Search input not found');
            return;
        }

        // Handle Enter key ONLY
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchValue = this.searchInput.value.trim();
                if (searchValue) {
                    this.updateSymbol(searchValue);
                    this.searchInput.blur();
                }
            }
        });

        // Optional: Handle form submission if wrapped in form
        const form = this.searchInput.closest('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const searchValue = this.searchInput.value.trim();
                if (searchValue) {
                    this.updateSymbol(searchValue);
                    this.searchInput.blur();
                }
            });
        }
    }

    async updateSymbol(newSymbol) {
        try {
            // Validate symbol
            if (!SymbolService.isValidSymbol(newSymbol)) {
                Logger.warn('Invalid symbol provided', newSymbol);
                return;
            }

            // Format symbol
            const formattedSymbol = SymbolService.formatSymbol(newSymbol);
            
            // Check if symbol changed
            if (formattedSymbol === this.currentSymbol) {
                return;
            }

            Logger.info('Updating symbol', { from: this.currentSymbol, to: formattedSymbol });

            // Update current symbol
            this.currentSymbol = formattedSymbol;

            // Update page state
            this.updatePageState(formattedSymbol);

            // Reload widgets
            this.reloadWidgets(formattedSymbol);

        } catch (error) {
            Logger.error('Error updating symbol', error);
        }
    }

    updatePageState(symbol) {
        // Update URL
        updateURL(symbol);
        
        // Update page title
        updatePageTitle(symbol);
        
        // Update search placeholder
        if (this.searchInput) {
            const displaySymbol = SymbolService.getDisplayName(symbol);
            this.searchInput.placeholder = `Search symbols (current: ${displaySymbol})`;
        }
    }

    loadWidgets(symbol) {
        Logger.info('Loading widgets for symbol:', symbol);
        
        // Clear any existing widgets first
        TradingViewWidgetFactory.clearWidgets();
        
        // Load ticker tape (doesn't need symbol)
        Logger.info('Loading ticker tape widget');
        TradingViewWidgetFactory.createWidget('ticker-tape', 'ticker-tape').load();
        
        // Load other widgets with symbol
        Logger.info('Loading symbol-specific widgets');
        TradingViewWidgetFactory.loadAllWidgets(symbol);
    }

    reloadWidgets(symbol) {
        TradingViewWidgetFactory.reloadAllWidgets(symbol);
    }

    // Public methods for external access
    getCurrentSymbol() {
        return this.currentSymbol;
    }

    setSymbol(symbol) {
        this.updateSymbol(symbol);
    }
}

// Initialize the application
export const chartApp = new ChartPage();

// Expose to global scope for debugging
if (typeof window !== 'undefined') {
    window.chartApp = chartApp;
}
