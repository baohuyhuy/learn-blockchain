# Week 03 - Solana DeFi Price Monitor

A real-time cryptocurrency price monitoring application that tracks token prices across multiple Solana DEXes (Decentralized Exchanges) including Raydium, Orca, and Meteora. The application provides live price updates, price change visualization, and pool information for various tokens.

## 🏗️ Architecture

### Frontend (React TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) for modern components
- **Styling**: Tailwind CSS for custom styling
- **Real-time Communication**: Socket.IO client for live data
- **Routing**: React Router for navigation
- **Layout**: Responsive masonry grid layout

### Backend (NestJS TypeScript)
- **Framework**: NestJS with TypeScript
- **Real-time Communication**: WebSocket with Socket.IO
- **Blockchain Integration**: 
  - Raydium SDK for Raydium DEX
  - Orca Whirlpools SDK for Orca DEX
  - Meteora SDK for Meteora DEX
- **Architecture**: Gateway pattern for WebSocket connections

## 🚀 Features

- **Real-time Price Monitoring**: Live price updates from multiple DEXes
- **Multi-DEX Support**: Tracks prices across Raydium, Orca, and Meteora
- **Price Change Visualization**: Shows price changes with visual indicators
- **Pool Information**: Displays TVL (Total Value Locked) and pool addresses
- **Responsive Design**: Modern, clean interface with dark theme
- **Token Search**: Search and monitor specific tokens by address
- **Live WebSocket Connections**: Separate connections for each DEX platform

## 📁 Project Main Structure

```
week-03/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # TypeScript interfaces and constants
│   │   ├── layout/         # Layout components (Header, Home)
│   │   └── App.tsx         # Main application component
│   ├── package.json        # Frontend dependencies
│   └── tailwind.config.js  # Tailwind CSS configuration
│
└── server/                 # NestJS backend application
    ├── src/
    │   ├── account/        # WebSocket gateways for each DEX
    │   ├── raydium/        # Raydium DEX integration
    │   ├── orca/           # Orca DEX integration
    │   ├── meteora/        # Meteora DEX integration
    │   └── main.ts         # Application entry point
    ├── package.json        # Backend dependencies
    └── nest-cli.json       # NestJS CLI configuration
```

## 🛠️ Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## 📦 Installation & Setup

### 1. Clone the Repository
```powershell
git clone <repository-url>
cd learn-blockchain/week-03
```

### 2. Backend Setup
```powershell
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the development server
npm run start:dev
```

The backend server will start on `http://localhost:3001`

### 3. Frontend Setup
```powershell
# Open a new terminal and navigate to the client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run start
```

The frontend application will start on `http://localhost:3000`

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Backend Server**:
   ```powershell
   cd server
   npm run start:dev
   ```

2. **Start the Frontend Application** (in a new terminal):
   ```powershell
   cd client
   npm start
   ```

3. **Access the Application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

### Production Mode

1. **Build the Frontend**:
   ```powershell
   cd client
   npm run build
   ```

2. **Build and Start the Backend**:
   ```powershell
   cd server
   npm run build
   npm run start:prod
   ```

## 🔧 Configuration

### Environment Variables
The application uses default configurations, but you can customize:

- **Backend Port**: Default is `3001` (configured in `server/src/main.ts`)
- **Frontend Port**: Default is `3000` (React default)

### WebSocket Namespaces
The backend uses separate WebSocket namespaces for each DEX:
- `/raydium` - For Raydium DEX data
- `/orca` - For Orca DEX data  
- `/meteora` - For Meteora DEX data

## 📡 API Endpoints & WebSocket Events

### WebSocket Events

#### Client → Server
- `monitor-tokens`: Start monitoring a list of token addresses
- `stop-monitoring`: Stop monitoring tokens

#### Server → Client
- `token-update`: Real-time token price and pool data updates

### Data Structure
```typescript
interface Token {
    icon: string;
    name: string;
    address: string;
    currentPrice: number;
    previousPrice: number;
    priceChange: number;
    dexes: Dex[];
}

interface Dex {
    name: string;
    prevPrice: number;
    price: number;
    tvl: number;
    poolAddress: string;
}
```

## 🧪 Testing

### Frontend Testing
```powershell
cd client
npm test
```

### Backend Testing
```powershell
cd server
npm run test
```

## 🚀 Available Scripts

### Frontend (Client)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Backend (Server)
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start` - Start in production mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run lint` - Run ESLint

## 🔍 Usage

1. **Start Both Servers**: Make sure both frontend and backend are running
2. **Add Token Addresses**: Use the input field to add Solana token mint addresses
3. **Monitor Prices**: Watch real-time price updates across different DEXes
4. **View Pool Information**: Click on cards to see detailed pool information
5. **Price Changes**: Green indicates price increases, red indicates decreases

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:
   - Ensure the backend server is running on port 3001
   - Check that no firewall is blocking the connection

2. **Token Not Found**:
   - Verify the token address is a valid Solana mint address
   - Check if the token has pools on the supported DEXes

3. **High Memory Usage**:
   - This is normal when monitoring many tokens simultaneously
   - Consider reducing the polling interval or number of monitored tokens

## Web UI
The web UI is designed to be responsive and user-friendly, featuring a modern dark theme with a masonry grid layout. It allows users to easily add and monitor multiple tokens, view real-time price updates, and access detailed pool information.

Here are some screenshots of the application:

![1](./img/1.png)
![2](./img/2.png)
![3](./img/3.png)
![4](./img/4.png)
![5](./img/5.png)
![6](./img/6.png)
![7](./img/7.png)

## 📄 License

This project is for educational purposes as part of the blockchain learning series.

---

**Note**: This application monitors live blockchain data and requires internet connectivity. Price data is fetched from Solana DEXes and may have slight delays depending on network conditions.