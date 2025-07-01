export const DEX_CONSTANTS = {
  // DEX Types
  RAYDIUM: 'raydium',
  ORCA: 'orca',
  METEORA: 'meteora',
  
  // Pool Types
  POOL_TYPES: {
    CLASSIC: 'classic',
    STANDARD: 'standard',
    CONCENTRATED: 'concentrated',
    DLMM: 'dlmm',
    DAMMV2: 'dammv2',
  },
  
  // WebSocket Namespaces
  WEBSOCKET_NAMESPACES: {
    RAYDIUM: '/raydium',
    ORCA: '/orca', 
    METEORA: '/meteora',
  },
  
  // Events
  EVENTS: {
    START_MONITORING: 'startMonitor',
    STOP_MONITORING: 'stopMonitor',
  },

	DELAY_BETWEEN_CONNECTIONS_MS: 1500,

} as const;
