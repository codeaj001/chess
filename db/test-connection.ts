import { db } from "./index";
import * as schema from "@shared/schema";

async function testConnection() {
  try {
    console.log("Testing database connection...");
    
    // Try to query the database
    const aiModels = await db.select().from(schema.aiModels);
    console.log(`Connection successful! Found ${aiModels.length} AI models.`);
    
    // Create a test AI model if none exist
    if (aiModels.length === 0) {
      console.log("No AI models found. Creating a test model...");
      
      await db.insert(schema.aiModels).values({
        name: "TestAI",
        elo: 2000,
        style: "Aggressive",
        opening_preferences: JSON.stringify(["Sicilian Defense", "King's Gambit"]),
        middlegame_strength: 3,
        endgame_strength: 3,
        is_premium: false
      });
      
      console.log("Test AI model created successfully!");
    }
    
    // Create a test match
    console.log("Creating a test match...");
    
    // Get the first AI model
    const [firstAI] = await db.select().from(schema.aiModels);
    
    if (firstAI) {
      // Create an active match
      await db.insert(schema.chessMatches).values({
        solana_match_id: Math.floor(1000 + Math.random() * 9000),
        white_bot_id: firstAI.id,
        black_bot_id: firstAI.id,
        status: "InProgress",
        match_type: "Regular",
        start_time: new Date(),
        bets_locked: false,
        white_pool: 0,
        black_pool: 0,
        draw_pool: 0,
        time_control: "10+0",
        moves: JSON.stringify(["e4", "e5", "Nf3", "Nc6"])
      });
      
      console.log("Test match created successfully!");
    }
    
    console.log("All tests completed successfully!");
  } catch (error) {
    console.error("Error testing database connection:", error);
  }
}

testConnection();
