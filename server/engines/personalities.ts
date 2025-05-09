/**
 * Defines the different personalities for the Leela Chess Zero engine
 * Each personality has unique parameters that affect playing style and strength
 */

export interface EnginePersonality {
	id: number;
	name: string;
	elo: number;
	style: string;
	description: string;
	networkPath: string;
	options: {
		temperature?: number; // Higher = more randomness
		cpuct?: number; // Exploration constant
		fpu_reduction?: number; // First play urgency reduction
		policy_temp?: number; // Policy temperature
		nodes?: number; // Number of nodes to search
		contempt?: number; // Contempt factor
		skill_level?: number; // Skill level (1-20)
	};
	opening_preferences: string[];
}

/**
 * Collection of engine personalities with different playing characteristics
 * These replace the mock AI models in the original implementation
 */
export const enginePersonalities: EnginePersonality[] = [
	{
		id: 1,
		name: "Rookie Rook",
		elo: 1100,
		style: "Mixed",
		description:
			"A beginner-level personality that makes basic positional moves but often misses tactical opportunities.",
		networkPath: "networks/beginner.pb.gz", // Path relative to engine executable
		options: { // Increased nodes and decreased temperature for more accurate play
			temperature: 0.5,
			cpuct: 1.8,
			nodes: 100, // Very limited search
			skill_level: 1, // Lowest skill level
		},
		opening_preferences: ["King's Pawn", "Queen's Pawn"],
	},
	{
		id: 2,
		name: "Pawn Pioneer",
		elo: 1250,
		style: "Defensive",
		description:
			"A cautious personality that prioritizes pawn structure and defensive play.",
		networkPath: "networks/beginner.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.4,
			cpuct: 1.8,
			fpu_reduction: 0.9, // Higher reduction = more pessimistic about unexplored moves
			nodes: 200,
			contempt: -50, // Negative contempt = prefers draws (defensive)
			skill_level: 2,
		},
		opening_preferences: ["Sicilian Defense", "French Defense"],
	},
	{
		id: 3,
		name: "Knight Novice",
		elo: 1400,
		style: "Tactical",
		description:
			"An intermediate personality that looks for tactical opportunities but lacks strategic depth.",
		networkPath: "networks/intermediate.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.3,
			cpuct: 2.0,
			nodes: 400,
			contempt: 10, // Slightly positive contempt = avoids draws
			skill_level: 3,
		},
		opening_preferences: ["Ruy Lopez", "Italian Game"],
	},
	{
		id: 4,
		name: "Bishop Battler",
		elo: 1600,
		style: "Positional",
		description:
			"A solid intermediate personality that focuses on piece development and positional advantages.",
		networkPath: "networks/intermediate.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.2,
			cpuct: 2.2,
			nodes: 600,
			skill_level: 5,
		},
		opening_preferences: ["Queen's Gambit", "English Opening"],
	},
	{
		id: 5,
		name: "Tactical Tempest",
		elo: 1750,
		style: "Tactical",
		description:
			"An aggressive personality that prioritizes attacks and sacrifices for initiative.",
		networkPath: "networks/intermediate.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.2,
			cpuct: 2.5,
			nodes: 800,
			contempt: 25, // Higher contempt = avoids draws more aggressively
			skill_level: 7,
		},
		opening_preferences: ["King's Gambit", "Sicilian Defense"],
	},
	{
		id: 6,
		name: "Queenside Quasar",
		elo: 1900,
		style: "Positional",
		description:
			"A strong personality that excels in queenside play and endgames.",
		networkPath: "networks/advanced.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.2,
			cpuct: 2.7,
			nodes: 1000,
			skill_level: 9,
		},
		opening_preferences: ["Queen's Gambit", "Nimzo-Indian Defense"],
	},
	{
		id: 7,
		name: "Positronic Mind",
		elo: 2100,
		style: "Mixed",
		description:
			"A well-rounded advanced personality with balanced tactical and positional understanding.",
		networkPath: "networks/advanced.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.1,
			cpuct: 2.8,
			nodes: 1200,
			skill_level: 12,
		},
		opening_preferences: [
			"Ruy Lopez",
			"Queen's Gambit",
			"Sicilian Defense",
		],
	},
	{
		id: 8,
		name: "DeepBlunder 9000",
		elo: 2250,
		style: "Neural",
		description:
			"An advanced personality that occasionally makes surprising moves that appear like blunders but have deep strategic value.",
		networkPath: "networks/advanced.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.1, // Slightly higher temperature for creative play
			cpuct: 3.0,
			policy_temp: 1.5, // Higher policy temperature = more diverse move selection
			nodes: 1400,
			skill_level: 15,
		},
		opening_preferences: [
			"King's Indian",
			"Modern Defense",
			"Alekhine's Defense",
		],
	},
	{
		id: 10,
		name: "NeuralKnight",
		elo: 2380,
		style: "Neural",
		description:
			"An advanced personality that uses neural network evaluation to make human-like decisions.",
		networkPath: "networks/best.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.1,
			cpuct: 3.0,
			policy_temp: 1.2,
			nodes: 1600,
			skill_level: 17,
		},
		opening_preferences: [
			"Sicilian Defense",
			"Queen's Gambit",
			"King's Indian",
		],
	},
	{
		id: 11,
		name: "Grandmaster Gamma",
		elo: 2550,
		style: "Classical",
		description:
			"A master-level personality that plays solid, principled chess with occasional brilliancies.",
		networkPath: "networks/best.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.05,
			cpuct: 3.5,
			nodes: 2000,
			skill_level: 19,
		},
		opening_preferences: [
			"Ruy Lopez",
			"Queen's Gambit",
			"Nimzo-Indian Defense",
		],
	},
	{
		id: 12,
		name: "Quantum Queen",
		elo: 2680,
		style: "Neural",
		description:
			"A master-level personality that plays at near-perfect levels with occasional creative moves.",
		networkPath: "networks/best.pb.gz", // Increased nodes and decreased temperature for more accurate play
		options: {
			temperature: 0.05,
			cpuct: 4.0,
			nodes: 3000,
			skill_level: 20,
		},
		opening_preferences: [
			"Sicilian Defense",
			"Ruy Lopez",
			"Queen's Gambit",
		],
	},
];
