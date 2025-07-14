import { CONFIG, WIDGET_CONFIGS } from './config.js';
import { showLoading, showError, Logger } from './utils.js';

export class TradingViewWidget {
    constructor(containerId, widgetType) {
        this.containerId = containerId;
        this.widgetType = widgetType;
        this.container = document.querySelector(`#${containerId} .tradingview-widget-container__widget`);
        
        if (!this.container) {
            throw new Error(`Container not found for widget: ${containerId}`);
        }
    }

    load(symbol = null, additionalConfig = {}) {
        const config = this.getWidgetConfig(symbol, additionalConfig);
        const scriptSrc = this.getScriptSrc();
        
        showLoading(this.container, `Loading ${this.widgetType}...`);
        
        setTimeout(() => {
            try {
                // Clear any existing content first
                this.container.innerHTML = '';
                
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = scriptSrc;
                script.async = true;
                script.innerHTML = JSON.stringify(config);
                
                script.onerror = () => {
                    showError(this.container, 
                        `Failed to load ${this.widgetType}`, 
                        () => this.load(symbol, additionalConfig)
                    );
                };
                
                script.onload = () => {
                    Logger.info(`${this.widgetType} widget loaded successfully`, { symbol, containerId: this.containerId });
                };
                
                this.container.appendChild(script);
                Logger.info(`${this.widgetType} widget loading started`, { symbol, containerId: this.containerId });
                
            } catch (error) {
                Logger.error(`Error loading ${this.widgetType} widget`, error);
                showError(this.container, 
                    `Error loading ${this.widgetType}`, 
                    () => this.load(symbol, additionalConfig)
                );
            }
        }, CONFIG.WIDGET_LOAD_DELAY);
    }

    getWidgetConfig(symbol, additionalConfig) {
        const baseConfig = WIDGET_CONFIGS[this.widgetType.toUpperCase().replace('-', '_')];
        
        if (!baseConfig) {
            throw new Error(`No configuration found for widget type: ${this.widgetType}`);
        }

        const config = { ...baseConfig, ...additionalConfig };
        
        if (symbol && this.widgetType !== 'ticker-tape') {
            config.symbol = symbol;
        }
        
        return config;
    }

    getScriptSrc() {
        const scriptMap = {
            'symbol-info': 'embed-widget-symbol-info.js',
            'advanced-chart': 'embed-widget-advanced-chart.js',
            'ticker-tape': 'embed-widget-ticker-tape.js'
        };

        const scriptFile = scriptMap[this.widgetType];
        if (!scriptFile) {
            throw new Error(`No script mapping found for widget type: ${this.widgetType}`);
        }

        return `${CONFIG.TRADINGVIEW_BASE_URL}/${scriptFile}`;
    }

    reload(symbol = null, additionalConfig = {}) {
        this.load(symbol, additionalConfig);
    }
}

// Widget factory
export class TradingViewWidgetFactory {
    static widgets = new Map();

    static createWidget(containerId, widgetType) {
        const key = `${containerId}-${widgetType}`;
        
        // Always create a new widget instance to avoid stale references
        const widget = new TradingViewWidget(containerId, widgetType);
        this.widgets.set(key, widget);
        
        return widget;
    }

    static getWidget(containerId, widgetType) {
        const key = `${containerId}-${widgetType}`;
        return this.widgets.get(key);
    }

    static loadAllWidgets(symbol = null) {
        // Define widgets to load
        const widgetConfigs = [
            { containerId: 'symbol-info', widgetType: 'symbol-info' },
            { containerId: 'advanced-chart', widgetType: 'advanced-chart' }
        ];

        widgetConfigs.forEach(({ containerId, widgetType }) => {
            const widget = this.createWidget(containerId, widgetType);
            widget.load(symbol);
        });
    }

    static reloadAllWidgets(symbol = null) {
        this.widgets.forEach(widget => {
            if (widget.widgetType !== 'ticker-tape') {
                widget.reload(symbol);
            }
        });
    }

    static clearWidgets() {
        this.widgets.clear();
        Logger.info('All widgets cleared');
    }
}
