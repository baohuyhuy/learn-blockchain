// Simple Router class for SPA navigation
export class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Listen for browser navigation
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });

        // Handle initial load
        this.handleRouteChange();
    }

    // Add route
    addRoute(path, handler, options = {}) {
        this.routes.set(path, { handler, options });
    }

    // Navigate to route
    navigate(path, data = {}) {
        const url = new URL(window.location);
        url.pathname = path;
        
        // Add query parameters if provided
        if (data.params) {
            Object.keys(data.params).forEach(key => {
                url.searchParams.set(key, data.params[key]);
            });
        }

        window.history.pushState(data, '', url);
        this.handleRouteChange();
    }

    // Handle route changes
    handleRouteChange() {
        const path = window.location.pathname;
        const route = this.routes.get(path) || this.routes.get('*'); // Fallback to wildcard

        if (route) {
            this.currentRoute = path;
            route.handler(this.getRouteData());
        } else {
            console.warn(`No route handler found for: ${path}`);
        }
    }

    // Get current route data
    getRouteData() {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        
        for (const [key, value] of urlParams) {
            params[key] = value;
        }

        return {
            path: window.location.pathname,
            params,
            query: window.location.search,
            hash: window.location.hash
        };
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }
}

// Export singleton instance
export const router = new Router();
