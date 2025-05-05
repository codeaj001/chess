import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Models API
  app.get('/api/ai', async (req, res) => {
    try {
      const aiModels = await storage.getAllAIModels();
      return res.json(aiModels);
    } catch (error) {
      console.error('Error fetching AI models:', error);
      return res.status(500).json({ error: 'Failed to fetch AI models' });
    }
  });

  app.get('/api/ai/:id', async (req, res) => {
    try {
      const aiModel = await storage.getAIModelById(parseInt(req.params.id));
      if (!aiModel) {
        return res.status(404).json({ error: 'AI model not found' });
      }
      return res.json(aiModel);
    } catch (error) {
      console.error('Error fetching AI model:', error);
      return res.status(500).json({ error: 'Failed to fetch AI model' });
    }
  });

  app.post('/api/ai/:id/move', async (req, res) => {
    try {
      const { fen, matchId } = req.body;
      if (!fen) {
        return res.status(400).json({ error: 'FEN position is required' });
      }
      
      const aiModel = await storage.getAIModelById(parseInt(req.params.id));
      if (!aiModel) {
        return res.status(404).json({ error: 'AI model not found' });
      }
      
      // Generate a move based on AI model style and the current position
      const move = await storage.generateAIMove(parseInt(req.params.id), fen, matchId);
      return res.json({ move });
    } catch (error) {
      console.error('Error generating AI move:', error);
      return res.status(500).json({ error: 'Failed to generate AI move' });
    }
  });

  // Matches API
  app.get('/api/matches/active', async (req, res) => {
    try {
      const activeMatches = await storage.getActiveMatches();
      return res.json(activeMatches);
    } catch (error) {
      console.error('Error fetching active matches:', error);
      return res.status(500).json({ error: 'Failed to fetch active matches' });
    }
  });

  app.get('/api/matches/upcoming', async (req, res) => {
    try {
      const upcomingMatches = await storage.getUpcomingMatches();
      return res.json(upcomingMatches);
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return res.status(500).json({ error: 'Failed to fetch upcoming matches' });
    }
  });

  app.get('/api/matches/:id', async (req, res) => {
    try {
      const match = await storage.getMatchById(parseInt(req.params.id));
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      return res.json(match);
    } catch (error) {
      console.error('Error fetching match:', error);
      return res.status(500).json({ error: 'Failed to fetch match' });
    }
  });

  app.get('/api/matches/:id/pools', async (req, res) => {
    try {
      const pools = await storage.getMatchBetPools(parseInt(req.params.id));
      if (!pools) {
        return res.status(404).json({ error: 'Match not found' });
      }
      return res.json(pools);
    } catch (error) {
      console.error('Error fetching bet pools:', error);
      return res.status(500).json({ error: 'Failed to fetch bet pools' });
    }
  });

  app.patch('/api/matches/:id/result', async (req, res) => {
    try {
      const { result } = req.body;
      if (!result || !['White', 'Black', 'Draw'].includes(result)) {
        return res.status(400).json({ error: 'Valid result is required (White, Black, or Draw)' });
      }
      
      const updatedMatch = await storage.updateMatchResult(parseInt(req.params.id), result);
      if (!updatedMatch) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      return res.json(updatedMatch);
    } catch (error) {
      console.error('Error updating match result:', error);
      return res.status(500).json({ error: 'Failed to update match result' });
    }
  });

  // Betting API
  app.get('/api/bets/history', async (req, res) => {
    try {
      // In a real app, get wallet from authenticated user
      const walletAddress = req.query.wallet as string || 'demo_wallet';
      
      const bets = await storage.getBetsByWallet(walletAddress);
      return res.json(bets);
    } catch (error) {
      console.error('Error fetching bet history:', error);
      return res.status(500).json({ error: 'Failed to fetch bet history' });
    }
  });

  app.post('/api/bets', async (req, res) => {
    try {
      const { matchId, walletAddress, amount, outcome, transactionSignature } = req.body;
      
      if (!matchId || !walletAddress || !amount || !outcome || amount <= 0) {
        return res.status(400).json({ error: 'Invalid bet parameters' });
      }
      
      if (!['White', 'Black', 'Draw'].includes(outcome)) {
        return res.status(400).json({ error: 'Outcome must be White, Black, or Draw' });
      }
      
      const match = await storage.getMatchById(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }
      
      if (match.bets_locked || match.status !== 'InProgress') {
        return res.status(400).json({ error: 'Betting is closed for this match' });
      }
      
      const newBet = await storage.createBet({
        match_id: matchId,
        solana_match_id: match.solana_match_id,
        user_wallet: walletAddress,
        amount,
        outcome,
        transaction_signature: transactionSignature,
        status: 'Active',
      });
      
      return res.status(201).json(newBet);
    } catch (error) {
      console.error('Error placing bet:', error);
      return res.status(500).json({ error: 'Failed to place bet' });
    }
  });

  app.post('/api/bets/:id/claim', async (req, res) => {
    try {
      const { walletAddress, transactionSignature } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }
      
      const bet = await storage.getBetById(req.params.id);
      if (!bet) {
        return res.status(404).json({ error: 'Bet not found' });
      }
      
      if (bet.user_wallet !== walletAddress) {
        return res.status(403).json({ error: 'Not authorized to claim this bet' });
      }
      
      if (bet.claimed) {
        return res.status(400).json({ error: 'Bet has already been claimed' });
      }
      
      if (bet.status !== 'Won') {
        return res.status(400).json({ error: 'Only winning bets can be claimed' });
      }
      
      const updatedBet = await storage.claimBet(req.params.id, transactionSignature);
      return res.json(updatedBet);
    } catch (error) {
      console.error('Error claiming bet:', error);
      return res.status(500).json({ error: 'Failed to claim bet' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
