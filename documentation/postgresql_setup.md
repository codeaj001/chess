# PostgreSQL Database Setup Documentation

This document provides a detailed, step-by-step explanation of how the PostgreSQL database was set up for the CompChess AI Chess Betting Platform.

## Database Creation Process

### 1. Creating the PostgreSQL Database

The project uses a PostgreSQL database provided by Replit, which sets up the database and makes the connection details available through environment variables.

```bash
# The database was created using the following command in Replit:
create_postgresql_database_tool
```

This command sets up the following environment variables, which are automatically available to the application:
- `DATABASE_URL`: Complete connection string used by the application
- `PGUSER`: Database username
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name
- `PGHOST`: Database host
- `PGPORT`: Database port

### 2. Database Schema Definition

The database schema is defined in `shared/schema.ts` using Drizzle ORM. The schema defines the following tables:

#### Users Table
```typescript
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  wallet_address: text("wallet_address").notNull().unique(),
  username: text("username").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login"),
});
```

#### AI Models Table
```typescript
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  elo: integer("elo").notNull(),
  style: text("style").notNull(), // Aggressive, Defensive, Positional, etc.
  opening_preferences: text("opening_preferences").notNull(), // JSON string of array
  middlegame_strength: integer("middlegame_strength").notNull(), // 1-5
  endgame_strength: integer("endgame_strength").notNull(), // 1-5
  is_premium: boolean("is_premium").default(false).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
```

#### Chess Matches Table
```typescript
export const chessMatches = pgTable("chess_matches", {
  id: serial("id").primaryKey(),
  solana_match_id: integer("solana_match_id"),
  white_bot_id: integer("white_bot_id")
    .references(() => aiModels.id)
    .notNull(),
  black_bot_id: integer("black_bot_id")
    .references(() => aiModels.id)
    .notNull(),
  match_pubkey: text("match_pubkey"),
  status: text("status").notNull(), // Scheduled, InProgress, Completed
  match_type: text("match_type").notNull(), // Regular, Tournament, Showcase
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time"),
  result: text("result"), // White, Black, Draw, null if not finished
  white_pool: decimal("white_pool", { precision: 10, scale: 4 }).default("0").notNull(),
  black_pool: decimal("black_pool", { precision: 10, scale: 4 }).default("0").notNull(),
  draw_pool: decimal("draw_pool", { precision: 10, scale: 4 }).default("0").notNull(),
  bets_locked: boolean("bets_locked").default(false).notNull(),
  time_control: text("time_control"),
  moves: text("moves"), // JSON string array
  created_at: timestamp("created_at").defaultNow().notNull(),
});
```

#### Bets Table
```typescript
export const bets = pgTable("bets", {
  id: text("id").primaryKey(), // UUID
  match_id: integer("match_id")
    .references(() => chessMatches.id)
    .notNull(),
  solana_match_id: integer("solana_match_id"),
  user_wallet: text("user_wallet").notNull(),
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  outcome: text("outcome").notNull(), // White, Black, Draw
  transaction_signature: text("transaction_signature"),
  solana_bet_pubkey: text("solana_bet_pubkey"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").default("Active").notNull(), // Active, Won, Lost, Draw
  claimed: boolean("claimed").default(false).notNull(),
  payout: decimal("payout", { precision: 10, scale: 4 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
```

### 3. Table Relationships

Relationships between tables are defined using Drizzle's `relations` function:

```typescript
export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  whiteMatches: many(chessMatches, { relationName: "whiteBot" }),
  blackMatches: many(chessMatches, { relationName: "blackBot" }),
}));

export const chessMatchesRelations = relations(chessMatches, ({ one, many }) => ({
  whiteBot: one(aiModels, {
    fields: [chessMatches.white_bot_id],
    references: [aiModels.id],
    relationName: "whiteBot",
  }),
  blackBot: one(aiModels, {
    fields: [chessMatches.black_bot_id],
    references: [aiModels.id],
    relationName: "blackBot",
  }),
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  match: one(chessMatches, {
    fields: [bets.match_id],
    references: [chessMatches.id],
  }),
}));
```

### 4. Schema Push and Database Initialization

After defining the schema, we pushed it to the database using Drizzle:

```bash
# Generate the SQL migration
npm run db:generate

# Apply the migration to the database
npm run db:push
```

The `db:push` command uses the `drizzle-kit` to automatically create the tables based on the schema definitions.

### 5. Database Seeding

To populate the database with initial data, we created seed scripts in `db/seed.ts`. The seeding process follows these steps:

```typescript
async function seed() {
  try {
    console.log("🌱 Seeding database...");

    // 1. Insert AI Models
    const aiModelEntries = [
      {
        name: "Stockfish 15",
        elo: 3500,
        style: "Tactical",
        opening_preferences: JSON.stringify(["Sicilian Defense", "Ruy Lopez", "Queens Gambit"]),
        middlegame_strength: 5,
        endgame_strength: 5,
        is_premium: true
      },
      {
        name: "Lc0 Neural",
        elo: 3450,
        style: "Neural",
        opening_preferences: JSON.stringify(["English Opening", "Kings Indian", "Caro-Kann"]),
        middlegame_strength: 5,
        endgame_strength: 4,
        is_premium: true
      },
      // Additional AI models...
    ];

    // Insert AI models and get the inserted records
    const insertedAiModels = await db.insert(aiModels).values(aiModelEntries).returning();
    console.log(`✅ Inserted ${insertedAiModels.length} AI models`);

    // 2. Create Chess Matches
    const now = new Date();
    const matchEntries = [
      {
        white_bot_id: insertedAiModels[0].id,
        black_bot_id: insertedAiModels[1].id,
        status: "InProgress",
        match_type: "Showcase",
        start_time: new Date(now.getTime() - 10 * 60000), // 10 minutes ago
        white_pool: "3.5",
        black_pool: "2.8",
        draw_pool: "1.2",
        bets_locked: true,
        time_control: "5+3",
        moves: JSON.stringify(["e4", "e5", "Nf3", "Nc6", "Bb5"])
      },
      // Additional match entries...
    ];

    const insertedMatches = await db.insert(chessMatches).values(matchEntries).returning();
    console.log(`✅ Inserted ${insertedMatches.length} chess matches`);

    // 3. Create Some Sample Bets
    const betEntries = [
      {
        id: crypto.randomUUID(),
        match_id: insertedMatches[0].id,
        user_wallet: "demo_wallet_1",
        amount: "0.5",
        outcome: "White",
        timestamp: new Date(),
        status: "Active"
      },
      // Additional bet entries...
    ];

    const insertedBets = await db.insert(bets).values(betEntries).returning();
    console.log(`✅ Inserted ${insertedBets.length} bets`);

    console.log("✅ Seeding completed successfully");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  }
}

// Run the seed function
seed();
```

The seeding process was executed using:

```bash
npm run db:seed
```

### 6. Database Connection

The database connection is established in `db/index.ts`:

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/pg-pool";
import * as schema from "../shared/schema";

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the Drizzle ORM instance
export const db = drizzle({ client: pool, schema });
```

This allows the application to connect to the database using the Drizzle ORM.

## Database Integration with the Application

### API Routes

The application interacts with the database through API routes defined in `server/routes.ts`. For example:

```typescript
// Get all active matches
app.get("/api/matches/active", async (req, res) => {
  try {
    const matches = await storage.getActiveMatches();
    res.json(matches);
  } catch (error) {
    console.error("Error fetching active matches:", error);
    res.status(500).json({ error: "Failed to fetch active matches" });
  }
});

// Get upcoming matches
app.get("/api/matches/upcoming", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const matches = await storage.getUpcomingMatches(limit);
    res.json(matches);
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    res.status(500).json({ error: "Failed to fetch upcoming matches" });
  }
});
```

### Data Access Layer

The application uses a storage module (`server/storage.ts`) as a data access layer to interact with the database:

```typescript
import { db } from "@db";
import { aiModels, chessMatches, bets } from "@shared/schema";
import { eq, gt, lt, and, desc, asc } from "drizzle-orm";

export const storage = {
  async getAllAIModels() {
    return db.query.aiModels.findMany({
      orderBy: desc(aiModels.elo)
    });
  },
  
  async getActiveMatches() {
    return db.query.chessMatches.findMany({
      where: eq(chessMatches.status, "InProgress"),
      with: {
        whiteBot: true,
        blackBot: true
      },
      orderBy: asc(chessMatches.start_time)
    });
  },
  
  async getUpcomingMatches(limit = 5) {
    const now = new Date();
    return db.query.chessMatches.findMany({
      where: and(
        eq(chessMatches.status, "Scheduled"),
        gt(chessMatches.start_time, now)
      ),
      with: {
        whiteBot: true,
        blackBot: true
      },
      orderBy: asc(chessMatches.start_time),
      limit
    });
  }
  
  // Additional methods...
};
```

## Troubleshooting the "No Active Matches" Issue

If you're not seeing any active matches in the application, there could be several reasons:

1. **Database Not Seeded**: The database might not have been seeded correctly. Try running the seed command again:
   ```bash
   npm run db:seed
   ```

2. **Match Status**: Check if there are any matches with status "InProgress" in the database:
   ```sql
   SELECT * FROM chess_matches WHERE status = 'InProgress';
   ```

3. **API Route Issue**: Check the server logs for any errors when fetching active matches.

4. **Database Connection**: Verify that the application can connect to the database by checking the logs for any connection errors.

You can diagnose the issue further by:

1. Checking the database contents directly:
   ```bash
   # Use the execute_sql_tool to check tables
   SELECT * FROM chess_matches;
   SELECT * FROM ai_models;
   ```

2. Adding debugging statements to the API endpoint:
   ```typescript
   app.get("/api/matches/active", async (req, res) => {
     try {
       console.log("Fetching active matches...");
       const matches = await storage.getActiveMatches();
       console.log("Active matches:", matches);
       res.json(matches);
     } catch (error) {
       console.error("Error fetching active matches:", error);
       res.status(500).json({ error: "Failed to fetch active matches" });
     }
   });
   ```

## Database Maintenance and Management

To manage the database:

1. **Viewing Database Content**:
   ```bash
   # Use the execute_sql_tool
   SELECT * FROM ai_models;
   SELECT * FROM chess_matches;
   SELECT * FROM bets;
   ```

2. **Updating Records**:
   ```bash
   # Example: Update a match status
   UPDATE chess_matches SET status = 'InProgress' WHERE id = 1;
   ```

3. **Adding New Records**:
   ```bash
   # Example: Add a new AI model
   INSERT INTO ai_models (name, elo, style, opening_preferences, middlegame_strength, endgame_strength, is_premium)
   VALUES ('New AI', 3000, 'Positional', '["French Defense", "Caro-Kann"]', 4, 4, false);
   ```

4. **Schema Updates**: If you need to modify the database schema, update the definitions in `shared/schema.ts` and then run:
   ```bash
   npm run db:push
   ```

This document provides a comprehensive overview of the PostgreSQL database setup for the CompChess platform, including schema design, initialization, seeding, and integration with the application. It also includes troubleshooting tips for common issues.