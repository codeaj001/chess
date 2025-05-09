import { db } from "./index";
import * as schema from "@shared/schema";
import { randomUUID } from "crypto";
import { count } from "drizzle-orm";

async function seed() {
	try {
		console.log("🌱 Seeding database...");

		// Seed AI models with a wide range of ELO ratings and playing styles
		const aiModels = [
			// Beginner Level (1200-1600)
			{
				name: "PawnPusher",
				elo: 1250,
				style: "Beginner",
				opening_preferences: JSON.stringify([
					"Italian Game",
					"Queen's Pawn",
					"King's Pawn",
				]),
				middlegame_strength: 1,
				endgame_strength: 1,
				is_premium: false,
			},
			{
				name: "RookieBot",
				elo: 1380,
				style: "Defensive",
				opening_preferences: JSON.stringify([
					"London System",
					"King's Indian Defense",
					"French Defense",
				]),
				middlegame_strength: 2,
				endgame_strength: 1,
				is_premium: false,
			},
			{
				name: "CasualPlayer",
				elo: 1520,
				style: "Positional",
				opening_preferences: JSON.stringify([
					"Queen's Gambit",
					"English Opening",
					"Reti Opening",
				]),
				middlegame_strength: 2,
				endgame_strength: 2,
				is_premium: false,
			},

			// Intermediate Level (1600-2000)
			{
				name: "TacticalThinker",
				elo: 1680,
				style: "Tactical",
				opening_preferences: JSON.stringify([
					"Sicilian Defense",
					"King's Gambit",
					"Ruy Lopez",
				]),
				middlegame_strength: 3,
				endgame_strength: 2,
				is_premium: false,
			},
			{
				name: "MiddleGame Master",
				elo: 1790,
				style: "Aggressive",
				opening_preferences: JSON.stringify([
					"Sicilian Dragon",
					"King's Indian Attack",
					"Dutch Defense",
				]),
				middlegame_strength: 3,
				endgame_strength: 2,
				is_premium: false,
			},
			{
				name: "Defender2000",
				elo: 1950,
				style: "Defensive",
				opening_preferences: JSON.stringify([
					"Petroff Defense",
					"Berlin Defense",
					"Scandinavian Defense",
				]),
				middlegame_strength: 3,
				endgame_strength: 4,
				is_premium: false,
			},

			// Advanced Level (2000-2400)
			{
				name: "DeepBlunder 9000",
				elo: 2150,
				style: "Aggressive",
				opening_preferences: JSON.stringify([
					"Sicilian Defense",
					"King's Gambit",
					"Dutch Defense",
				]),
				middlegame_strength: 4,
				endgame_strength: 3,
				is_premium: false,
			},
			{
				name: "StoneWall",
				elo: 2180,
				style: "Defensive",
				opening_preferences: JSON.stringify([
					"Stonewall Attack",
					"London System",
					"Colle System",
				]),
				middlegame_strength: 3,
				endgame_strength: 4,
				is_premium: false,
			},
			{
				name: "QuickMind",
				elo: 2240,
				style: "Aggressive",
				opening_preferences: JSON.stringify([
					"King's Indian",
					"Grunfeld Defense",
					"Benko Gambit",
				]),
				middlegame_strength: 4,
				endgame_strength: 3,
				is_premium: false,
			},
			{
				name: "ClassicalMaster",
				elo: 2275,
				style: "Classical",
				opening_preferences: JSON.stringify([
					"Queen's Gambit",
					"Ruy Lopez",
					"Giuoco Piano",
				]),
				middlegame_strength: 4,
				endgame_strength: 5,
				is_premium: true,
			},
			{
				name: "Positronic Mind",
				elo: 2310,
				style: "Positional",
				opening_preferences: JSON.stringify([
					"Queen's Gambit",
					"Catalan Opening",
					"Nimzo-Indian",
				]),
				middlegame_strength: 5,
				endgame_strength: 4,
				is_premium: true,
			},
			{
				name: "NeuralKnight",
				elo: 2380,
				style: "Neural",
				opening_preferences: JSON.stringify([
					"Caro-Kann",
					"French Defense",
					"Slav Defense",
				]),
				middlegame_strength: 4,
				endgame_strength: 5,
				is_premium: true,
			},

			// Expert Level (2400-2600)
			{
				name: "TacticalTommy",
				elo: 2450,
				style: "Tactical",
				opening_preferences: JSON.stringify([
					"Ruy Lopez",
					"Italian Game",
					"Scotch Game",
				]),
				middlegame_strength: 5,
				endgame_strength: 3,
				is_premium: true,
			},
			{
				name: "EndgameExpert",
				elo: 2510,
				style: "Endgame",
				opening_preferences: JSON.stringify([
					"Queen's Gambit",
					"Slav Defense",
					"Semi-Slav Defense",
				]),
				middlegame_strength: 4,
				endgame_strength: 5,
				is_premium: true,
			},
			{
				name: "Stockfish Jr",
				elo: 2590,
				style: "Tactical",
				opening_preferences: JSON.stringify([
					"Sicilian Defense",
					"French Defense",
					"Caro-Kann",
				]),
				middlegame_strength: 5,
				endgame_strength: 5,
				is_premium: true,
			},

			// Master Level (2600+)
			{
				name: "TitanChess",
				elo: 2650,
				style: "Mixed",
				opening_preferences: JSON.stringify([
					"Queen's Gambit",
					"Ruy Lopez",
					"Sicilian Defense",
				]),
				middlegame_strength: 5,
				endgame_strength: 5,
				is_premium: true,
			},
			{
				name: "GrandMaster AI",
				elo: 2720,
				style: "Universal",
				opening_preferences: JSON.stringify([
					"Sicilian Defense",
					"Queen's Gambit",
					"Ruy Lopez",
					"King's Indian",
				]),
				middlegame_strength: 5,
				endgame_strength: 5,
				is_premium: true,
			},
			{
				name: "UltraEngine",
				elo: 2800,
				style: "Superhuman",
				opening_preferences: JSON.stringify(["Any Opening"]),
				middlegame_strength: 5,
				endgame_strength: 5,
				is_premium: true,
			},
		];

		// Check if we already have AI models
		const existingAIs = await db.select().from(schema.aiModels);
		if (existingAIs.length === 0) {
			console.log("Seeding AI models...");
			for (const ai of aiModels) {
				await db.insert(schema.aiModels).values(ai);
			}
		} else {
			console.log(
				`Found ${existingAIs.length} existing AI models, skipping...`
			);
		}

		// Get AI model IDs for creating matches
		const seededAIs = await db
			.select({ id: schema.aiModels.id, name: schema.aiModels.name })
			.from(schema.aiModels);
		const aiMap = seededAIs.reduce((map, ai) => {
			map[ai.name] = ai.id;
			return map;
		}, {} as Record<string, number>);

		// Seed chess matches
		const now = new Date();
		const hour = 60 * 60 * 1000;
		const day = 24 * hour;

		const chessMatches = [
			{
				solana_match_id: 1001,
				white_bot_id: aiMap["DeepBlunder 9000"],
				black_bot_id: aiMap["Positronic Mind"],
				status: "InProgress",
				match_type: "Regular",
				start_time: new Date(now.getTime() - 20 * 60 * 1000), // Started 20 minutes ago
				bets_locked: false,
				white_pool: 2.5,
				black_pool: 2.0,
				draw_pool: 0.25,
				moves: JSON.stringify([
					"e4",
					"e5",
					"Nf3",
					"Nc6",
					"Bb5",
					"a6",
					"Ba4",
					"Nf6",
					"O-O",
					"Be7",
					"Re1",
					"b5",
					"Bb3",
					"d6",
					"c3",
					"O-O",
					"h3",
					"Na5",
					"Bc2",
					"c5",
					"d4",
					"Qc7",
					"Nbd2",
					"cxd4",
					"cxd4",
					"Nc6",
				]),
				time_control: "10+0",
			},
			{
				solana_match_id: 1002,
				white_bot_id: aiMap["NeuralKnight"],
				black_bot_id: aiMap["TacticalTommy"],
				status: "Scheduled",
				match_type: "Tournament",
				start_time: new Date(now.getTime() + 15 * 60 * 1000), // Starting in 15 minutes
				bets_locked: false,
				white_pool: 1.8,
				black_pool: 2.2,
				draw_pool: 0.5,
				time_control: "5+3",
			},
			{
				solana_match_id: 1003,
				white_bot_id: aiMap["Defender2000"],
				black_bot_id: aiMap["ClassicalMaster"],
				status: "Scheduled",
				match_type: "Regular",
				start_time: new Date(now.getTime() + 45 * 60 * 1000), // Starting in 45 minutes
				bets_locked: false,
				white_pool: 1.0,
				black_pool: 1.5,
				draw_pool: 0.3,
				time_control: "15+10",
			},
			{
				solana_match_id: 1004,
				white_bot_id: aiMap["TitanChess"],
				black_bot_id: aiMap["Stockfish Jr"],
				status: "Scheduled",
				match_type: "Showcase",
				start_time: new Date(now.getTime() + 80 * 60 * 1000), // Starting in 1h 20m
				bets_locked: false,
				white_pool: 3.0,
				black_pool: 2.8,
				draw_pool: 0.7,
				time_control: "30+5",
			},
			{
				solana_match_id: 1005,
				white_bot_id: aiMap["QuickMind"],
				black_bot_id: aiMap["StoneWall"],
				status: "Completed",
				match_type: "Regular",
				start_time: new Date(now.getTime() - day), // Yesterday
				end_time: new Date(now.getTime() - day + hour), // Lasted 1 hour
				result: "White",
				bets_locked: true,
				white_pool: 3.5,
				black_pool: 2.0,
				draw_pool: 0.5,
				moves: JSON.stringify([
					"d4",
					"d5",
					"c4",
					"e6",
					"Nc3",
					"Nf6",
					"Bg5",
					"Be7",
					"e3",
					"O-O",
					"Nf3",
					"h6",
					"Bh4",
					"b6",
					"cxd5",
					"exd5",
					"Bd3",
					"Bb7",
					"O-O",
					"Nbd7",
					"Rc1",
					"c5",
					"dxc5",
					"bxc5",
					"Qe2",
					"Qb6",
					"Rfd1",
					"Rfd8",
					"Bb1",
					"Rac8",
					"Bg3",
					"Nh5",
					"Bh4",
					"Bxh4",
					"Nxh4",
					"Nhf6",
					"Nf3",
					"Ne4",
					"Qb5",
					"Qxb5",
					"Nxb5",
					"Ndf6",
					"Nd6",
					"Rxc1",
					"Rxc1",
					"Nc3",
					"bxc3",
					"Bxf3",
					"gxf3",
					"Nxd6",
					"Rc2",
					"Ne8",
					"c4",
					"dxc4",
					"Rxc4",
					"Nd6",
					"Rc6",
					"Nb5",
					"Rc5",
					"f6",
					"Kg2",
					"Rd2",
					"Rxc5",
					"Nxc5",
					"a4",
					"Na6",
					"Bd3",
					"Kf7",
					"f4",
					"Rd1",
					"Bc2",
					"Ra1",
					"e4",
					"Nc5",
					"e5",
					"fxe5",
					"fxe5",
					"Ke6",
					"f4",
					"g6",
					"Kg3",
					"Nd7",
					"Kg4",
					"Rxa4+",
					"Bb4",
					"Nc5",
					"Kh3",
					"Kf5",
					"Kg3",
					"Ra2",
					"Bd6",
					"Ne6",
					"Bc7",
					"Nc5",
					"Kf3",
					"Ra3+",
					"Ke2",
					"Ra2+",
					"Kd1",
					"Kxf4",
					"Bb6",
					"Nd3",
					"Kc1",
					"Kg3",
					"Bd4",
					"Kh2",
				]),
				time_control: "10+5",
			},
		];

		// Check if we already have matches
		const existingMatches = await db.select().from(schema.chessMatches);
		if (existingMatches.length === 0) {
			console.log("Seeding chess matches...");
			for (const match of chessMatches) {
				await db.insert(schema.chessMatches).values(match);
			}
		} else {
			console.log(
				`Found ${existingMatches.length} existing matches, skipping...`
			);
		}

		// Seed bets
		const demoWallets = [
			"DemoWallet123456",
			"DemoWallet654321",
			"DemoWallet789012",
			"DemoWallet345678",
		];

		// Get match IDs
		const matchResults = await db
			.select({
				id: schema.chessMatches.id,
				solana_match_id: schema.chessMatches.solana_match_id,
				status: schema.chessMatches.status,
				result: schema.chessMatches.result,
			})
			.from(schema.chessMatches);

		const completedMatchId = matchResults.find(
			(m) => m.status === "Completed" && m.result === "White"
		)?.id;

		if (completedMatchId) {
			// Check if we already have bets
			const existingBets = await db.select().from(schema.bets);
			if (existingBets.length === 0) {
				console.log("Seeding bets...");

				// Create some sample bets for the completed match
				const bets = [
					{
						id: randomUUID(),
						match_id: completedMatchId,
						solana_match_id:
							matchResults.find((m) => m.id === completedMatchId)
								?.solana_match_id || 1000,
						user_wallet: demoWallets[0],
						amount: 0.5,
						outcome: "White",
						transaction_signature:
							"MOCK_TX_SIG_" + randomUUID().slice(0, 8),
						timestamp: new Date(now.getTime() - day - hour),
						status: "Won",
						claimed: true,
						payout: 1.25,
					},
					{
						id: randomUUID(),
						match_id: completedMatchId,
						solana_match_id:
							matchResults.find((m) => m.id === completedMatchId)
								?.solana_match_id || 1000,
						user_wallet: demoWallets[1],
						amount: 1.0,
						outcome: "Black",
						transaction_signature:
							"MOCK_TX_SIG_" + randomUUID().slice(0, 8),
						timestamp: new Date(
							now.getTime() - day - 30 * 60 * 1000
						),
						status: "Lost",
						claimed: false,
						payout: null,
					},
					{
						id: randomUUID(),
						match_id: completedMatchId,
						solana_match_id:
							matchResults.find((m) => m.id === completedMatchId)
								?.solana_match_id || 1000,
						user_wallet: demoWallets[2],
						amount: 0.2,
						outcome: "Draw",
						transaction_signature:
							"MOCK_TX_SIG_" + randomUUID().slice(0, 8),
						timestamp: new Date(
							now.getTime() - day - 45 * 60 * 1000
						),
						status: "Lost",
						claimed: false,
						payout: null,
					},
				];

				for (const bet of bets) {
					await db.insert(schema.bets).values(bet);
				}
			} else {
				console.log(
					`Found ${existingBets.length} existing bets, skipping...`
				);
			}
		}

		console.log("✅ Seeding complete!");
	} catch (error) {
		console.error("Error seeding database:", error);
	}
}

seed();
