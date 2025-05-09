import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
	mockAIModels,
	mockMatches,
	mockBets,
	generateChessMove,
} from "./mock-data";

export async function registerRoutes(app: Express): Promise<Server> {
	// AI Models API
	app.get("/api/ai", async (_req, res) => {
		try {
			// Use mock data instead of database
			return res.json(mockAIModels);
		} catch (error) {
			console.error("Error fetching AI models:", error);
			return res.status(500).json({ error: "Failed to fetch AI models" });
		}
	});

	app.get("/api/ai/style/:style", async (req, res) => {
		try {
			const { style } = req.params;
			const aiModels = await storage.getAIModelsByStyle(style);
			return res.json(aiModels);
		} catch (error) {
			console.error("Error fetching AI models by style:", error);
			return res.status(500).json({ error: "Failed to fetch AI models" });
		}
	});

	app.get("/api/ai/random", async (req, res) => {
		try {
			const count = req.query.count
				? parseInt(req.query.count as string)
				: 2;
			const minElo = req.query.minElo
				? parseInt(req.query.minElo as string)
				: undefined;
			const maxElo = req.query.maxElo
				? parseInt(req.query.maxElo as string)
				: undefined;

			const aiModels = await storage.getRandomAIModels(
				count,
				minElo,
				maxElo
			);
			return res.json(aiModels);
		} catch (error) {
			console.error("Error fetching random AI models:", error);
			return res.status(500).json({ error: "Failed to fetch AI models" });
		}
	});

	app.get("/api/ai/:id", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			const aiModel = mockAIModels.find((model) => model.id === id);

			if (!aiModel) {
				return res.status(404).json({ error: "AI model not found" });
			}

			// Parse opening preferences
			const model = {
				...aiModel,
				opening_preferences: JSON.parse(
					aiModel.opening_preferences as string
				),
			};

			return res.json(model);
		} catch (error) {
			console.error("Error fetching AI model:", error);
			return res.status(500).json({ error: "Failed to fetch AI model" });
		}
	});

	app.post("/api/ai/:id/move", async (req, res) => {
		try {
			const { fen, matchId } = req.body;
			if (!fen) {
				return res
					.status(400)
					.json({ error: "FEN position is required" });
			}

			const id = parseInt(req.params.id);
			const aiModel = mockAIModels.find((model) => model.id === id);

			if (!aiModel) {
				return res.status(404).json({ error: "AI model not found" });
			}

			// Generate a move using our real chess engine with the AI's style
			console.log(`API: Generating move for AI ${id} at position ${fen}`);
			const move = await generateChessMove(fen, id);

			if (!move) {
				return res
					.status(400)
					.json({ error: "No valid move available" });
			}

			console.log(`API: Generated move: ${move}`);

			// Update the mock match with the new move
			const matchIndex = mockMatches.findIndex(
				(match) => match.id === matchId
			);
			if (matchIndex !== -1) {
				const match = mockMatches[matchIndex];
				let moves = [];

				try {
					moves = JSON.parse((match.moves as string) || "[]");
				} catch (e) {
					moves = [];
				}

				moves.push(move);
				mockMatches[matchIndex].moves = JSON.stringify(moves);
			}

			return res.json({ move });
		} catch (error) {
			console.error("Error generating AI move:", error);
			return res
				.status(500)
				.json({ error: "Failed to generate AI move" });
		}
	});

	// Matches API
	app.get("/api/matches/active", async (_req, res) => {
		try {
			// Filter active matches from mock data
			const activeMatches = mockMatches.filter(
				(match) => match.status === "InProgress"
			);
			return res.json(activeMatches);
		} catch (error) {
			console.error("Error fetching active matches:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch active matches" });
		}
	});

	app.get("/api/matches/upcoming", async (req, res) => {
		try {
			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: 5;

			// Filter scheduled matches from mock data
			const upcomingMatches = mockMatches
				.filter((match) => match.status === "Scheduled")
				.sort(
					(a, b) =>
						new Date(a.start_time).getTime() -
						new Date(b.start_time).getTime()
				)
				.slice(0, limit);

			return res.json(upcomingMatches);
		} catch (error) {
			console.error("Error fetching upcoming matches:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch upcoming matches" });
		}
	});

	app.get("/api/matches/all", async (req, res) => {
		try {
			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: 20;
			const offset = req.query.offset
				? parseInt(req.query.offset as string)
				: 0;
			const matches = await storage.getAllMatches(limit, offset);
			return res.json(matches);
		} catch (error) {
			console.error("Error fetching all matches:", error);
			return res.status(500).json({ error: "Failed to fetch matches" });
		}
	});

	app.get("/api/matches/by-status/:status", async (req, res) => {
		try {
			const { status } = req.params;
			if (!["Scheduled", "InProgress", "Completed"].includes(status)) {
				return res
					.status(400)
					.json({ error: "Invalid status parameter" });
			}

			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: 20;
			const matches = await storage.getMatchesByStatus(status, limit);
			return res.json(matches);
		} catch (error) {
			console.error("Error fetching matches by status:", error);
			return res.status(500).json({ error: "Failed to fetch matches" });
		}
	});

	app.get("/api/matches/by-ai/:aiId", async (req, res) => {
		try {
			const aiId = parseInt(req.params.aiId);
			if (isNaN(aiId)) {
				return res
					.status(400)
					.json({ error: "Invalid AI ID parameter" });
			}

			const limit = req.query.limit
				? parseInt(req.query.limit as string)
				: 20;
			const matches = await storage.getMatchesByAIModel(aiId, limit);
			return res.json(matches);
		} catch (error) {
			console.error("Error fetching matches by AI model:", error);
			return res.status(500).json({ error: "Failed to fetch matches" });
		}
	});

	app.post("/api/matches", async (req, res) => {
		try {
			const {
				white_bot_id,
				black_bot_id,
				match_type,
				start_time,
				time_control,
			} = req.body;

			if (!white_bot_id || !black_bot_id) {
				return res.status(400).json({
					error: "Both white and black AI models are required",
				});
			}

			// Create a new match
			const newMatch = await storage.createMatch({
				white_bot_id,
				black_bot_id,
				match_type,
				start_time: start_time ? new Date(start_time) : undefined,
				time_control,
				status: "Scheduled",
			});

			return res.status(201).json(newMatch);
		} catch (error) {
			console.error("Error creating match:", error);
			return res.status(500).json({ error: "Failed to create match" });
		}
	});

	app.post("/api/matches/random", async (req, res) => {
		try {
			const { minElo, maxElo, match_type, start_time, time_control } =
				req.body;

			// Create a random match
			const newMatch = await storage.createRandomMatch({
				minElo: minElo ? parseInt(minElo) : undefined,
				maxElo: maxElo ? parseInt(maxElo) : undefined,
				match_type,
				start_time: start_time ? new Date(start_time) : undefined,
				time_control,
			});

			return res.status(201).json(newMatch);
		} catch (error) {
			console.error("Error creating random match:", error);
			return res
				.status(500)
				.json({ error: "Failed to create random match" });
		}
	});

	app.get("/api/matches/:id", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			const match = mockMatches.find((match) => match.id === id);

			if (!match) {
				return res.status(404).json({ error: "Match not found" });
			}

			// Parse moves from string to array
			const matchWithParsedMoves = {
				...match,
				moves: match.moves ? JSON.parse(match.moves as string) : [],
			};

			return res.json(matchWithParsedMoves);
		} catch (error) {
			console.error("Error fetching match:", error);
			return res.status(500).json({ error: "Failed to fetch match" });
		}
	});

	app.get("/api/matches/:id/pools", async (req, res) => {
		try {
			const id = parseInt(req.params.id);
			const match = mockMatches.find((match) => match.id === id);

			if (!match) {
				return res.status(404).json({ error: "Match not found" });
			}

			// Return the bet pools
			return res.json({
				white_pool: match.white_pool,
				black_pool: match.black_pool,
				draw_pool: match.draw_pool,
			});
		} catch (error) {
			console.error("Error fetching bet pools:", error);
			return res.status(500).json({ error: "Failed to fetch bet pools" });
		}
	});

	app.patch("/api/matches/:id/result", async (req, res) => {
		try {
			const { result } = req.body;
			if (!result || !["White", "Black", "Draw"].includes(result)) {
				return res.status(400).json({
					error: "Valid result is required (White, Black, or Draw)",
				});
			}

			const id = parseInt(req.params.id);
			const matchIndex = mockMatches.findIndex(
				(match) => match.id === id
			);

			if (matchIndex === -1) {
				return res.status(404).json({ error: "Match not found" });
			}

			// Update the match result
			mockMatches[matchIndex].result = result;
			mockMatches[matchIndex].status = "Completed";
			mockMatches[matchIndex].end_time = new Date();
			mockMatches[matchIndex].bets_locked = true;

			// Return the updated match
			return res.json(mockMatches[matchIndex]);
		} catch (error) {
			console.error("Error updating match result:", error);
			return res
				.status(500)
				.json({ error: "Failed to update match result" });
		}
	});

	// Betting API
	app.get("/api/bets/history", async (req, res) => {
		try {
			// In a real app, get wallet from authenticated user
			const walletAddress =
				(req.query.wallet as string) || "DemoWallet123456";

			// Filter bets by wallet address
			const bets = mockBets.filter(
				(bet) => bet.user_wallet === walletAddress
			);

			// Add match names to bets
			const betsWithMatchNames = bets.map((bet) => {
				const match = mockMatches.find(
					(match) => match.id === bet.match_id
				);
				if (match) {
					const whiteAI = mockAIModels.find(
						(ai) => ai.id === match.white_bot_id
					);
					const blackAI = mockAIModels.find(
						(ai) => ai.id === match.black_bot_id
					);
					return {
						...bet,
						match_name: `${whiteAI?.name || "Unknown"} vs ${
							blackAI?.name || "Unknown"
						}`,
					};
				}
				return bet;
			});

			return res.json(betsWithMatchNames);
		} catch (error) {
			console.error("Error fetching bet history:", error);
			return res
				.status(500)
				.json({ error: "Failed to fetch bet history" });
		}
	});

	app.post("/api/bets", async (req, res) => {
		try {
			const {
				matchId,
				walletAddress,
				amount,
				outcome,
				transactionSignature,
			} = req.body;

			if (
				!matchId ||
				!walletAddress ||
				!amount ||
				!outcome ||
				amount <= 0
			) {
				return res
					.status(400)
					.json({ error: "Invalid bet parameters" });
			}

			if (!["White", "Black", "Draw"].includes(outcome)) {
				return res
					.status(400)
					.json({ error: "Outcome must be White, Black, or Draw" });
			}

			const match = mockMatches.find((match) => match.id === matchId);
			if (!match) {
				return res.status(404).json({ error: "Match not found" });
			}

			if (match.bets_locked || match.status !== "InProgress") {
				return res
					.status(400)
					.json({ error: "Betting is closed for this match" });
			}

			// Create a new bet
			const newBet = {
				id: `bet_${Date.now()}`,
				match_id: matchId,
				solana_match_id: match.solana_match_id || 0, // Default to 0 if null
				user_wallet: walletAddress,
				amount,
				outcome,
				transaction_signature:
					transactionSignature || `MOCK_TX_${Date.now()}`,
				timestamp: new Date(),
				status: "Active",
				claimed: false,
				payout: null,
			};

			// Add the bet to our mock bets
			mockBets.push(newBet);

			// Update the match pools
			if (outcome === "White") {
				match.white_pool += amount;
			} else if (outcome === "Black") {
				match.black_pool += amount;
			} else {
				match.draw_pool += amount;
			}

			return res.status(201).json(newBet);
		} catch (error) {
			console.error("Error placing bet:", error);
			return res.status(500).json({ error: "Failed to place bet" });
		}
	});

	app.post("/api/bets/:id/claim", async (req, res) => {
		try {
			const { walletAddress, transactionSignature } = req.body;

			if (!walletAddress) {
				return res
					.status(400)
					.json({ error: "Wallet address is required" });
			}

			const bet = await storage.getBetById(req.params.id);
			if (!bet) {
				return res.status(404).json({ error: "Bet not found" });
			}

			if (bet.user_wallet !== walletAddress) {
				return res
					.status(403)
					.json({ error: "Not authorized to claim this bet" });
			}

			if (bet.claimed) {
				return res
					.status(400)
					.json({ error: "Bet has already been claimed" });
			}

			if (bet.status !== "Won") {
				return res
					.status(400)
					.json({ error: "Only winning bets can be claimed" });
			}

			const updatedBet = await storage.claimBet(
				req.params.id,
				transactionSignature
			);
			return res.json(updatedBet);
		} catch (error) {
			console.error("Error claiming bet:", error);
			return res.status(500).json({ error: "Failed to claim bet" });
		}
	});

	const httpServer = createServer(app);
	return httpServer;
}
