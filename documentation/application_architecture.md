# CompChess Application Architecture Documentation

This document provides a comprehensive explanation of the CompChess AI Chess Betting Platform's architecture, detailing how each component functions and interacts with others.

## Project Overview

CompChess is a web application that allows users to watch AI chess engines play against each other and place bets on match outcomes using Solana cryptocurrency. The application is built with a modern React frontend and an Express backend, with a PostgreSQL database for data persistence.

## Directory Structure

The project follows a specific structure:

```
/
├── client/                 # Frontend code (React)
│   ├── src/                # Application source code
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and types
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles
│   └── index.html          # HTML entry point
├── db/                     # Database setup and seed scripts
│   ├── index.ts            # Database connection
│   └── seed.ts             # Database seeding script
├── server/                 # Backend code (Express)
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data access layer
│   └── vite.ts             # Vite server integration
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema definitions
└── ... (config files)      # Various configuration files
```

## Core Components

### 1. Database Layer

#### `shared/schema.ts`
Defines the database schema using Drizzle ORM, including tables for:
- AI Models (chess engines)
- Chess Matches
- Bets
- Users

The schema defines relationships between these tables, such as matches referencing AI models and bets referencing matches.

#### `db/index.ts`
Sets up the connection to the PostgreSQL database using the Drizzle ORM:
```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/pg-pool";
import * as schema from "../shared/schema";

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the Drizzle ORM instance
export const db = drizzle({ client: pool, schema });
```

#### `db/seed.ts`
Contains scripts to seed the database with initial data, including AI models, sample matches, and bets.

### 2. Backend Layer

#### `server/index.ts`
The entry point for the Express server:
```typescript
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "@db";

// Create Express app
const app = express();

// Setup middleware, session handling, etc.
// ...

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
});

// Register API routes
registerRoutes(app, server);

// Setup Vite for development
setupVite(app, server);

// Serve static assets in production
serveStatic(app);
```

#### `server/routes.ts`
Defines API endpoints for the application:
```typescript
export async function registerRoutes(app: Express): Promise<Server> {
  // AI Models endpoints
  app.get("/api/ai-models", async (req, res) => {
    try {
      const models = await storage.getAllAIModels();
      res.json(models);
    } catch (error) {
      // Error handling
    }
  });
  
  // Chess Matches endpoints
  app.get("/api/matches/active", async (req, res) => {
    try {
      const matches = await storage.getActiveMatches();
      res.json(matches);
    } catch (error) {
      // Error handling
    }
  });
  
  // Betting endpoints
  app.post("/api/bets", async (req, res) => {
    try {
      // Handle bet creation
    } catch (error) {
      // Error handling
    }
  });
  
  // WebSocket setup for live updates
  // ...
}
```

#### `server/storage.ts`
Provides methods for data access and business logic:
```typescript
export const storage = {
  async getAllAIModels() {
    // Fetch AI models from database
  },
  
  async getActiveMatches() {
    // Fetch active chess matches
  },
  
  async generateAIMove(aiId: number, fen: string, matchId: number) {
    // Generate chess moves for AI models
  },
  
  async createBet(betData: any) {
    // Create a new bet
  },
  
  // Other data access methods
};
```

### 3. Frontend Layer

#### `client/src/main.tsx`
The entry point for the React application, which sets up the app with necessary providers:
```typescript
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark">
          <App />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </WalletProvider>
  </React.StrictMode>
);
```

#### `client/src/App.tsx`
The main application component that handles routing:
```typescript
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <Footer />
    </div>
  );
}
```

#### `client/src/components`
Contains React components organized by functionality:

- **Chess Components** (`client/src/components/chess/`)
  - `ChessBoard.tsx`: Displays the chess board and handles move rendering
  - `AIProfileCard.tsx`: Shows information about AI models

- **Betting Components** (`client/src/components/betting/`)
  - `BettingPanel.tsx`: UI for placing bets on matches
  - `BettingHistory.tsx`: Shows user's betting history

- **Wallet Components** (`client/src/components/wallet/`)
  - `WalletButton.tsx`: Button for wallet connection/display
  - `WalletModal.tsx`: Modal for wallet connection options

- **Layout Components** (`client/src/components/layout/`)
  - `Header.tsx`: Application header with navigation
  - `Footer.tsx`: Application footer
  - `MobileNav.tsx`: Mobile navigation menu

#### `client/src/hooks`
Custom React hooks that provide functionality across components:

- `useSolanaWallet.tsx`: Hook for Solana wallet integration
  ```typescript
  export function useSolanaWallet() {
    // Hook for managing Solana wallet connections
    // Provides functions for connecting/disconnecting wallets, checking balances, etc.
  }
  ```

- `useChessMatch.tsx`: Hook for managing chess match data
  ```typescript
  export function useChessMatch(matchId: number) {
    // Fetches match data, manages moves, handles real-time updates
  }
  ```

- `use-toast.ts`: Hook for displaying toast notifications

#### `client/src/lib`
Utility functions and type definitions:

- `types.ts`: TypeScript interfaces and types
  ```typescript
  export interface AIModel {
    id: number;
    name: string;
    elo: number;
    style: AIPlayingStyle;
    // Other properties
  }
  
  export interface Match {
    id: number;
    white_bot_id: number;
    black_bot_id: number;
    status: MatchStatus;
    // Other properties
  }
  
  export interface Bet {
    id: string;
    match_id: number;
    user_wallet: string;
    amount: number;
    outcome: BetOutcome;
    // Other properties
  }
  ```

- `solana.ts`: Functions for Solana blockchain interactions
  ```typescript
  export async function getWalletBalance(walletAddress: string): Promise<number> {
    // Get SOL balance for a wallet
  }
  
  export async function placeBet(matchId: number, outcome: BetOutcome, amount: number): Promise<string> {
    // Place a bet using Solana
  }
  ```

- `queryClient.ts`: Setup for React Query client and API request utilities

## Data Flow and Component Interactions

### 1. Chess Match Flow

1. **Match Data Retrieval**:
   - `App.tsx` loads and displays the main application
   - The `Home` component fetches active and upcoming matches from the `/api/matches/active` and `/api/matches/upcoming` endpoints
   - Match data is displayed in the UI

2. **Chess Board Interaction**:
   - `ChessBoard.tsx` receives match data (including AI models and match ID)
   - The component uses `useChessMatch` hook to fetch move history and handle real-time updates
   - When a match is in progress, the board is updated with new moves via WebSocket

3. **AI Move Generation**:
   - Server generates moves for AI models in `storage.ts`:
     ```typescript
     async function generateAIMoveForStyle(aiModel: any, fen: string) {
       // Logic to generate a move based on AI style and strength
     }
     ```
   - Moves are sent to clients via WebSocket
   - The chess board updates to reflect new moves

### 2. Betting Flow

1. **Viewing Betting Options**:
   - `BettingPanel.tsx` displays betting options for a selected match
   - Odds are calculated based on current bet pools
   - Users can input bet amounts

2. **Placing a Bet**:
   - User connects a wallet via `WalletButton.tsx` and `WalletModal.tsx`
   - `useSolanaWallet` hook manages wallet connection state
   - When user places a bet, it calls the Solana blockchain integration:
     ```typescript
     async function handlePlaceBet() {
       const signature = await placeBet(match.id, selectedOutcome, betAmount);
       // Handle success/failure
     }
     ```
   - The bet is recorded in the database via `/api/bets` endpoint
   - Bet pools are updated and reflected in the UI

3. **Claiming Winnings**:
   - After a match completes, winners can claim their winnings
   - `claimWinnings` function in `solana.ts` handles the blockchain transaction
   - The bet status is updated in the database

### 3. Wallet Integration Flow

1. **Wallet Detection**:
   - `useSolanaWallet` hook detects available wallet extensions (Phantom, Solflare)
   - The `WalletButton` shows available wallets for connection

2. **Wallet Connection**:
   - User clicks on a wallet option in `WalletModal`
   - The hook attempts to connect to the selected wallet:
     ```typescript
     async function connectWallet(walletType: string) {
       // Connect to wallet extension or use demo wallet
     }
     ```
   - On successful connection, wallet address and balance are displayed

3. **Wallet Interaction**:
   - User can view wallet details, request airdrops (on devnet), and disconnect
   - Balance is refreshed automatically after transactions

## Key Technologies and Integration Points

### 1. React and Frontend
- React with TypeScript for type safety
- React Query for data fetching and caching
- Tailwind CSS with shadcn components for UI
- Wouter for routing

### 2. Express Backend
- Express.js for API endpoints
- WebSocket for real-time updates

### 3. Database
- PostgreSQL for data storage
- Drizzle ORM for database interactions
- Schema defined in TypeScript

### 4. Solana Integration
- Web3.js for Solana blockchain interaction
- Wallet adapters for Phantom and Solflare
- Devnet for testing with airdrops

### 5. Chess Logic
- chess.js for chess game logic
- react-chessboard for UI visualization

## Troubleshooting

### Matches Not Appearing

If no active matches are showing in the application:

1. **Check Database Connection**:
   - Ensure the database is properly connected
   - Check if tables are created correctly

2. **Verify Seed Data**:
   - Run `npm run db:seed` to populate the database
   - Check if match records exist with status "InProgress"

3. **Debug API Endpoints**:
   - Add console logs to `/api/matches/active` endpoint
   - Check for errors in API responses

4. **Inspect Frontend Queries**:
   - Review React Query implementation in components fetching matches
   - Check for errors in network requests

### Wallet Connection Issues

If wallet connections are failing:

1. **Check Browser Extensions**:
   - Ensure Phantom or Solflare extensions are installed
   - Verify the extensions are working properly

2. **Debug Connection Process**:
   - Review the wallet connection flow in `useSolanaWallet.tsx`
   - Check console for errors during connection attempts

3. **Verify Network Configuration**:
   - Ensure you're using the correct Solana network (devnet)
   - Check that wallet is configured for the right network

## Conclusion

The CompChess application architecture follows a modern, component-based approach with clear separation of concerns. The frontend, backend, and database layers work together to provide a seamless experience for users interested in AI chess matches and cryptocurrency betting.

Key strengths of this architecture include:
- Modular, reusable React components
- Clear data flow with custom hooks
- Type safety with TypeScript
- Real-time updates with WebSockets
- Secure and efficient database design

This document should provide a comprehensive understanding of how the application works and how its various components interact.