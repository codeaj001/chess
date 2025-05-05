import { pgTable, text, serial, integer, boolean, timestamp, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Base user table (already defined in the starter template)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  wallet_address: text("wallet_address"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  wallet_address: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// AI models
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  elo: integer("elo").notNull(),
  style: text("style").notNull(), // Aggressive, Defensive, Positional, Tactical, Classical, Neural, Mixed
  opening_preferences: text("opening_preferences").notNull(), // JSON array as string
  middlegame_strength: integer("middlegame_strength").notNull(), // 1-5
  endgame_strength: integer("endgame_strength").notNull(), // 1-5
  is_premium: boolean("is_premium").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAiModelSchema = createInsertSchema(aiModels);
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type AiModel = typeof aiModels.$inferSelect;

// Chess matches
export const chessMatches = pgTable("chess_matches", {
  id: serial("id").primaryKey(),
  solana_match_id: integer("solana_match_id").notNull(),
  white_bot_id: integer("white_bot_id").notNull().references(() => aiModels.id),
  black_bot_id: integer("black_bot_id").notNull().references(() => aiModels.id),
  match_pubkey: text("match_pubkey"),
  status: text("status").notNull(), // Scheduled, InProgress, Completed
  match_type: text("match_type").notNull().default("Regular"), // Regular, Tournament, Showcase
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time"),
  result: text("result"), // White, Black, Draw, null
  white_pool: real("white_pool").notNull().default(0),
  black_pool: real("black_pool").notNull().default(0),
  draw_pool: real("draw_pool").notNull().default(0),
  bets_locked: boolean("bets_locked").notNull().default(false),
  moves: text("moves"), // JSON array as string
  time_control: text("time_control").notNull().default("10+0"), // format: "minutes+increment"
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertChessMatchSchema = createInsertSchema(chessMatches);
export type InsertChessMatch = z.infer<typeof insertChessMatchSchema>;
export type ChessMatch = typeof chessMatches.$inferSelect;

// Bets
export const bets = pgTable("bets", {
  id: uuid("id").primaryKey(),
  match_id: integer("match_id").notNull().references(() => chessMatches.id),
  solana_match_id: integer("solana_match_id").notNull(),
  user_wallet: text("user_wallet").notNull(),
  amount: real("amount").notNull(),
  outcome: text("outcome").notNull(), // White, Black, Draw
  transaction_signature: text("transaction_signature"),
  solana_bet_pubkey: text("solana_bet_pubkey"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").notNull().default("Active"), // Active, Won, Lost, Draw
  claimed: boolean("claimed").notNull().default(false),
  payout: real("payout"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBetSchema = createInsertSchema(bets);
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof bets.$inferSelect;

// Define relationships
export const aiModelsRelations = relations(aiModels, ({ many }) => ({
  whiteMatches: many(chessMatches, { relationName: "white_bot" }),
  blackMatches: many(chessMatches, { relationName: "black_bot" }),
}));

export const chessMatchesRelations = relations(chessMatches, ({ one, many }) => ({
  whiteBot: one(aiModels, {
    fields: [chessMatches.white_bot_id],
    references: [aiModels.id],
    relationName: "white_bot",
  }),
  blackBot: one(aiModels, {
    fields: [chessMatches.black_bot_id],
    references: [aiModels.id],
    relationName: "black_bot",
  }),
  bets: many(bets),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  match: one(chessMatches, {
    fields: [bets.match_id],
    references: [chessMatches.id],
  }),
}));
