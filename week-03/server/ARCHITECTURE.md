# Server Architecture Documentation

## 🏗️ Improved Architecture Overview

This document outlines the new, improved server architecture for the DEX Price Monitor application.

## 📁 Directory Structure

```
src/
├── main.ts                        # Application entry point
├── app.module.ts                  # Root module
├── app.controller.ts              # Root controller
├── app.service.ts                 # Root service
│
├── core/                          # Core functionality (shared across all modules)
│   ├── constants/                 # Global constants
│   │   ├── blockchain.constants.ts
│   │   ├── dex.constants.ts
│   │   └── index.ts
│   ├── interfaces/                # Core interfaces
│   │   ├── pool.interface.ts
│   │   └── price-monitor.interface.ts
│   └── utils/                     # Utility functions
│       ├── decimal.util.ts
│       └── price-calculation.util.ts
│
├── modules/                       # Feature modules
│   └── dex/                       # DEX monitoring module
│       ├── dex.module.ts         # DEX module definition
│       ├── gateways/             # WebSocket gateways
│       │   ├── raydium.gateway.ts
│       │   ├── orca.gateway.ts
│       │   └── meteora.gateway.ts
│       ├── providers/            # DEX-specific implementations
│       │   ├── raydium/
│       │   │   └── raydium.provider.ts
│       │   ├── orca/
│       │   │   └── orca.provider.ts
│       │   └── meteora/
│       │       └── meteora.provider.ts
│       ├── services/             # Business logic
│       │   └── dex.service.ts
│       └── dto/                  # Data Transfer Objects
│           └── monitor-token.dto.ts
│
└── [old directories]             # Legacy files (to be migrated)
    ├── account/
    ├── raydium/
    ├── orca/
    └── meteora/
```

## 🔧 Architecture Benefits

### 1. **Separation of Concerns**
- **Gateways**: Handle WebSocket connections and events
- **Providers**: Implement DEX-specific logic
- **Services**: Manage business logic and coordination
- **Utils**: Shared utility functions

### 2. **Scalability**
- Easy to add new DEX providers
- Modular structure allows independent development
- Clear interfaces enable easy testing

### 3. **Maintainability**
- Consistent naming conventions
- Clear dependencies
- Centralized constants and utilities

### 4. **Code Reusability**
- Shared interfaces for all DEX providers
- Common utilities for price calculations
- Centralized constants

## 🚀 Key Components

### Core Layer
- **Constants**: Centralized configuration values
- **Interfaces**: Type definitions for consistent APIs
- **Utils**: Shared utility functions (decimal handling, price calculations)

### Module Layer
- **DEX Module**: Contains all DEX-related functionality
- **Gateways**: WebSocket event handlers for each DEX
- **Providers**: DEX-specific implementation details
- **Services**: Business logic coordination

## 📡 WebSocket Events

All DEX gateways support these standardized events:

- `startMonitoring`: Begin monitoring specified tokens
- `stopMonitoring`: Stop monitoring for a client
- `priceUpdate`: Real-time price updates
- `error`: Error notifications

## 🔄 Data Flow

1. **Client Connection**: WebSocket gateway handles connection
2. **Start Monitoring**: Gateway delegates to appropriate provider
3. **Data Fetching**: Provider fetches pool data from blockchain
4. **Price Calculation**: Provider calculates price using core utilities
5. **Price Updates**: Provider emits updates through gateway
6. **Cleanup**: Gateway handles disconnection and cleanup

## 🎯 Migration Strategy

### Phase 1: Core Setup ✅
- Created core constants, interfaces, and utilities
- Set up module structure

### Phase 2: Provider Migration
- Move existing Raydium logic to RaydiumProvider
- Implement Orca and Meteora providers
- Update imports and dependencies

### Phase 3: Gateway Cleanup
- Simplify gateway logic (delegate to providers)
- Standardize event handling
- Remove duplicate code

### Phase 4: Legacy Cleanup
- Remove old directory structure
- Update all imports
- Clean up unused files

## 🔧 How to Extend

### Adding a New DEX
1. Create new provider: `src/modules/dex/providers/[dex-name]/[dex-name].provider.ts`
2. Implement `IDexProvider` interface
3. Create gateway: `src/modules/dex/gateways/[dex-name].gateway.ts`
4. Register in `DexModule`
5. Add constants to `dex.constants.ts`

### Adding New Features
1. Update interfaces in `core/interfaces/`
2. Add utilities in `core/utils/`
3. Implement in providers
4. Update DTOs if needed

## 🧪 Testing Strategy

- **Unit Tests**: Test individual providers and utilities
- **Integration Tests**: Test module interactions
- **E2E Tests**: Test WebSocket flows
- **Mock Services**: Mock blockchain interactions

## 📝 Next Steps

1. **Complete Provider Migration**: Move all existing logic to new providers
2. **Add Error Handling**: Implement comprehensive error handling
3. **Add Logging**: Structured logging with proper levels
4. **Add Health Checks**: Monitor system health
5. **Add Rate Limiting**: Prevent API abuse
6. **Add Caching**: Cache frequently accessed data
7. **Add Metrics**: Track performance and usage

## 🔍 Code Quality

- **TypeScript**: Full type safety
- **ESLint**: Code linting and formatting
- **Interfaces**: Contract-based development
- **Documentation**: Comprehensive inline docs
- **Error Handling**: Proper error propagation
