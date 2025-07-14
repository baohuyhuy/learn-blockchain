import { CONFIG } from './config.js';

// Utility functions
export function getQueryParam(param) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    return urlSearchParams.get(param);
}

export function showLoading(container, message = 'Loading...') {
    container.innerHTML = `<div class="loading">${message}</div>`;
}

export function showError(container, message = 'Error loading content', onRetry = null) {
    const retryButton = onRetry ? `<button onclick="(${onRetry.toString()})()">Retry</button>` : '';
    container.innerHTML = `
        <div class="error">
            <div>${message}</div>
            ${retryButton}
        </div>
    `;
}

export function updateURL(symbol) {
    const url = new URL(window.location);
    url.searchParams.set('tvwidgetsymbol', symbol);
    window.history.pushState({}, '', url);
}

export function updatePageTitle(symbol) {
    document.title = `Chart View - ${symbol}`;
}

// Logger utility
export const Logger = {
    info: (message, data = null) => {
        console.log(`[INFO] ${message}`, data || '');
    },
    error: (message, error = null) => {
        console.error(`[ERROR] ${message}`, error || '');
    },
    warn: (message, data = null) => {
        console.warn(`[WARN] ${message}`, data || '');
    }
};
