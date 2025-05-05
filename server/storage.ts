import { db } from "@db";
import * as schema from "@shared/schema";
import { Chess } from "chess.js";
import { eq, and, or, desc, lt, gt, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// Helper function to generate AI move based on AI style and position
async function generateAIMoveForStyle(aiModel: any, fen: string) {
  try {
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });
    
    if (legalMoves.length === 0) return null;
    
    // In a real implementation, this would use more sophisticated algorithms
    // based on the AI's style, but for this demo we'll use simple randomization
    // with bias based on AI style
    
    // Prepare a collection of moves based on style
    let preferredMoves: any[] = [];
    
    switch (aiModel.style) {
      case "Aggressive":
        // Prefer captures and checks
        preferredMoves = legalMoves.filter(move => move.captured || move.san.includes("+"));
        break;
        
      case "Defensive":
        // Avoid captures and prefer moves that don't leave pieces hanging
        preferredMoves = legalMoves.filter(move => !move.captured);
        break;
        
      case "Positional":
        // Prefer knight and bishop development and king safety
        preferredMoves = legalMoves.filter(move => 
          (move.piece === 'n' || move.piece === 'b') || 
          move.san === "O-O" || move.san === "O-O-O"
        );
        break;
        
      case "Tactical":
        // Look for forks, pins (simplified with check moves)
        preferredMoves = legalMoves.filter(move => move.san.includes("+") || move.captured);
        break;
    }
    
    // Use preferred moves if available with a probability, otherwise use any legal move
    if (preferredMoves.length > 0 && Math.random() > 0.3) {
      return preferredMoves[Math.floor(Math.random() * preferredMoves.length)].san;
    }
    
    // Default: Just return a random legal move
    return legalMoves[Math.floor(Math.random() * legalMoves.length)].san;
  } catch (error) {
    console.error("Error generating AI move:", error);
    // In case of error, return a reasonable fallback move
    return "e4";  // A common opening move
  }
}

export const storage = {
  // AI Models
  async getAllAIModels() {
    return await db.select().from(schema.aiModels).orderBy(schema.aiModels.elo);
  },
  
  async getAIModelById(id: number) {
    const [aiModel] = await db.select().from(schema.aiModels).where(eq(schema.aiModels.id, id));
    
    if (aiModel) {
      // Parse opening preferences from string to array
      return {
        ...aiModel,
        opening_preferences: JSON.parse(aiModel.opening_preferences),
      };
    }
    
    return null;
  },
  
  async generateAIMove(aiId: number, fen: string, matchId: number) {
    const aiModel = await this.getAIModelById(aiId);
    if (!aiModel) throw new Error("AI model not found");
    
    const move = await generateAIMoveForStyle(aiModel, fen);
    if (!move) throw new Error("No legal moves available");
    
    // In a real implementation, we would save the move to the match history
    // We need to get the raw match data to avoid parsing issues
    const [rawMatch] = await db.select().from(schema.chessMatches)
      .where(eq(schema.chessMatches.id, matchId));
      
    if (rawMatch) {
      // Handle the case where moves might be a string array separated by commas
      let movesArr = [];
      try {
        movesArr = rawMatch.moves ? JSON.parse(rawMatch.moves) : [];
      } catch (error) {
        // Handle the case where it's not valid JSON
        movesArr = rawMatch.moves ? rawMatch.moves.split(",") : [];
      }
      movesArr.push(move);
      
      await db.update(schema.chessMatches)
        .set({ moves: JSON.stringify(movesArr) })
        .where(eq(schema.chessMatches.id, matchId));
    }
    
    return move;
  },
  
  // Matches
  async getActiveMatches() {
    return await db.select().from(schema.chessMatches)
      .where(eq(schema.chessMatches.status, "InProgress"))
      .orderBy(desc(schema.chessMatches.start_time));
  },
  
  async getUpcomingMatches(limit = 5) {
    return await db.select().from(schema.chessMatches)
      .where(and(
        eq(schema.chessMatches.status, "Scheduled"),
        gt(schema.chessMatches.start_time, new Date())
      ))
      .orderBy(schema.chessMatches.start_time)
      .limit(limit);
  },
  
  async getMatchById(id: number) {
    const [match] = await db.select().from(schema.chessMatches)
      .where(eq(schema.chessMatches.id, id));
    
    if (match) {
      // Parse moves from string to array if present
      let movesArr = [];
      try {
        movesArr = match.moves ? JSON.parse(match.moves) : [];
      } catch (error) {
        // Handle the case where it's not valid JSON
        movesArr = match.moves ? match.moves.split(",") : [];
      }
      
      return {
        ...match,
        moves: movesArr,
      };
    }
    
    return null;
  },
  
  async getMatchBetPools(id: number) {
    const [match] = await db.select({
      white_pool: schema.chessMatches.white_pool,
      black_pool: schema.chessMatches.black_pool,
      draw_pool: schema.chessMatches.draw_pool,
    }).from(schema.chessMatches)
      .where(eq(schema.chessMatches.id, id));
    
    return match;
  },
  
  async updateMatchResult(id: number, result: string) {
    const match = await this.getMatchById(id);
    if (!match) return null;
    
    const [updatedMatch] = await db.update(schema.chessMatches)
      .set({ 
        result, 
        status: "Completed",
        end_time: new Date(),
        bets_locked: true
      })
      .where(eq(schema.chessMatches.id, id))
      .returning();
    
    // Update bet statuses
    if (updatedMatch) {
      // Set won/lost status on bets
      await db.update(schema.bets)
        .set({ 
          status: 'Won',
          // Calculate payout based on pools - in real app this would use oracle data
          payout: db.sql`CASE 
            WHEN ${schema.bets.outcome} = ${result} THEN 
              ${schema.bets.amount} * (
                (${updatedMatch.white_pool} + ${updatedMatch.black_pool} + ${updatedMatch.draw_pool}) / 
                CASE 
                  WHEN ${result} = 'White' THEN ${updatedMatch.white_pool}
                  WHEN ${result} = 'Black' THEN ${updatedMatch.black_pool}
                  ELSE ${updatedMatch.draw_pool}
                END
              ) * 0.95
            ELSE ${schema.bets.payout}
          END`
        })
        .where(and(
          eq(schema.bets.match_id, id),
          eq(schema.bets.outcome, result)
        ));
      
      // Set lost status for other bets
      await db.update(schema.bets)
        .set({ status: 'Lost' })
        .where(and(
          eq(schema.bets.match_id, id),
          or(
            result === 'White' ? and(
              eq(schema.bets.status, 'Active'),
              or(
                eq(schema.bets.outcome, 'Black'),
                eq(schema.bets.outcome, 'Draw')
              )
            ) : result === 'Black' ? and(
              eq(schema.bets.status, 'Active'),
              or(
                eq(schema.bets.outcome, 'White'),
                eq(schema.bets.outcome, 'Draw')
              )
            ) : and(
              eq(schema.bets.status, 'Active'),
              or(
                eq(schema.bets.outcome, 'White'),
                eq(schema.bets.outcome, 'Black')
              )
            )
          )
        ));
      
      return updatedMatch;
    }
    
    return null;
  },
  
  // Bets
  async getBetsByWallet(walletAddress: string) {
    // Join with matches to get match names for display
    const bets = await db.select({
      id: schema.bets.id,
      match_id: schema.bets.match_id,
      solana_match_id: schema.bets.solana_match_id,
      user_wallet: schema.bets.user_wallet,
      amount: schema.bets.amount,
      outcome: schema.bets.outcome,
      transaction_signature: schema.bets.transaction_signature,
      timestamp: schema.bets.timestamp,
      status: schema.bets.status,
      claimed: schema.bets.claimed,
      payout: schema.bets.payout,
      match_name: db.sql<string>`CONCAT(
        (SELECT name FROM ${schema.aiModels} WHERE id = ${schema.chessMatches.white_bot_id}),
        ' vs ',
        (SELECT name FROM ${schema.aiModels} WHERE id = ${schema.chessMatches.black_bot_id})
      )`,
    })
    .from(schema.bets)
    .innerJoin(
      schema.chessMatches,
      eq(schema.bets.match_id, schema.chessMatches.id)
    )
    .where(eq(schema.bets.user_wallet, walletAddress))
    .orderBy(desc(schema.bets.timestamp));
    
    return bets;
  },
  
  async getBetById(id: string) {
    const [bet] = await db.select().from(schema.bets).where(eq(schema.bets.id, id));
    return bet;
  },
  
  async createBet(betData: any) {
    // Generate UUID for the bet
    const id = randomUUID();
    
    // Create bet and update pools
    const [newBet] = await db.insert(schema.bets)
      .values({
        id,
        match_id: betData.match_id,
        solana_match_id: betData.solana_match_id,
        user_wallet: betData.user_wallet,
        amount: betData.amount,
        outcome: betData.outcome,
        transaction_signature: betData.transaction_signature,
        status: 'Active',
      })
      .returning();
    
    // Update betting pools
    if (newBet) {
      await db.update(schema.chessMatches)
        .set({
          white_pool: betData.outcome === 'White' 
            ? db.sql`${schema.chessMatches.white_pool} + ${betData.amount}` 
            : schema.chessMatches.white_pool,
          black_pool: betData.outcome === 'Black' 
            ? db.sql`${schema.chessMatches.black_pool} + ${betData.amount}` 
            : schema.chessMatches.black_pool,
          draw_pool: betData.outcome === 'Draw' 
            ? db.sql`${schema.chessMatches.draw_pool} + ${betData.amount}` 
            : schema.chessMatches.draw_pool,
        })
        .where(eq(schema.chessMatches.id, betData.match_id));
    }
    
    return newBet;
  },
  
  async claimBet(id: string, transactionSignature?: string) {
    const [updatedBet] = await db.update(schema.bets)
      .set({ 
        claimed: true,
        transaction_signature: transactionSignature || db.sql`${schema.bets.transaction_signature}`
      })
      .where(eq(schema.bets.id, id))
      .returning();
    
    return updatedBet;
  }
};
