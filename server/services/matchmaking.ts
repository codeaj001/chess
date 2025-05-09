import { mockAIModels, mockMatches } from "../mock-data";
import { AIModel } from "@shared/schema";
import { randomUUID } from "crypto";

/**
 * Matchmaking service that automatically creates matches between AI models
 */
export class MatchmakingService {
	private isRunning: boolean = false;
	private matchmakingInterval: NodeJS.Timeout | null = null;
	private readonly intervalTime: number = 5 * 60 * 1000; // 5 minutes
	private readonly maxActiveMatches: number = 3;
	private readonly maxUpcomingMatches: number = 10;

	/**
	 * Start the matchmaking service
	 */
	public start(): void {
		if (this.isRunning) {
			console.log("Matchmaking service is already running");
			return;
		}

		console.log("Starting matchmaking service...");
		this.isRunning = true;

		// Run immediately on start
		this.createMatchesIfNeeded().catch((err) => {
			console.error("Error in initial matchmaking:", err);
		});

		// Then set up interval
		this.matchmakingInterval = setInterval(() => {
			this.createMatchesIfNeeded().catch((err) => {
				console.error("Error in matchmaking interval:", err);
			});
		}, this.intervalTime);
	}

	/**
	 * Stop the matchmaking service
	 */
	public stop(): void {
		if (!this.isRunning) {
			console.log("Matchmaking service is not running");
			return;
		}

		console.log("Stopping matchmaking service...");
		this.isRunning = false;

		if (this.matchmakingInterval) {
			clearInterval(this.matchmakingInterval);
			this.matchmakingInterval = null;
		}
	}

	/**
	 * Check if we need to create new matches and create them if needed
	 */
	private async createMatchesIfNeeded(): Promise<void> {
		try {
			// Get current active and upcoming matches from mock data
			const activeMatches = mockMatches.filter(
				(match) => match.status === "InProgress"
			);
			const upcomingMatches = mockMatches.filter(
				(match) => match.status === "Scheduled"
			);

			// Calculate how many matches we need to create
			const activeCount = activeMatches.length;
			const upcomingCount = upcomingMatches.length;

			const neededActiveMatches = Math.max(
				0,
				this.maxActiveMatches - activeCount
			);
			const neededUpcomingMatches = Math.max(
				0,
				this.maxUpcomingMatches - upcomingCount
			);

			console.log(
				`Matchmaking check: Active=${activeCount}, Upcoming=${upcomingCount}`
			);
			console.log(
				`Need to create: Active=${neededActiveMatches}, Upcoming=${neededUpcomingMatches}`
			);

			// Create needed active matches
			if (neededActiveMatches > 0) {
				await this.createActiveMatches(neededActiveMatches);
			}

			// Create needed upcoming matches
			if (neededUpcomingMatches > 0) {
				await this.createUpcomingMatches(neededUpcomingMatches);
			}
		} catch (error) {
			console.error("Error in createMatchesIfNeeded:", error);
			throw error;
		}
	}

	/**
	 * Create active matches (matches that start immediately)
	 */
	private async createActiveMatches(count: number): Promise<void> {
		console.log(`Creating ${count} active matches...`);

		for (let i = 0; i < count; i++) {
			try {
				// Get random AI models with different ELO ranges for interesting matchups
				const aiModels = await this.getRandomAIModelsForMatch();

				if (aiModels.length < 2) {
					console.warn(
						"Not enough AI models available for matchmaking"
					);
					continue;
				}

				// Create a match that starts now
				const now = new Date();
				const matchType = this.getRandomMatchType();
				const timeControl = this.getRandomTimeControl();

				// Create a new match and add it to our mock matches
				const newMatch = {
					id: mockMatches.length + 1,
					solana_match_id: Math.floor(1000 + Math.random() * 9000),
					white_bot_id: aiModels[0].id,
					black_bot_id: aiModels[1].id,
					match_type: matchType,
					status: "InProgress",
					start_time: now,
					time_control: timeControl,
					bets_locked: false,
					white_pool: 0,
					black_pool: 0,
					draw_pool: 0,
					moves: JSON.stringify([]),
					created_at: now,
				};

				mockMatches.push(newMatch);

				console.log(
					`Created active match: ${aiModels[0].name} vs ${aiModels[1].name}`
				);
			} catch (error) {
				console.error(`Error creating active match #${i}:`, error);
			}
		}
	}

	/**
	 * Create upcoming matches (matches scheduled for the future)
	 */
	private async createUpcomingMatches(count: number): Promise<void> {
		console.log(`Creating ${count} upcoming matches...`);

		for (let i = 0; i < count; i++) {
			try {
				// Get random AI models with different ELO ranges for interesting matchups
				const aiModels = await this.getRandomAIModelsForMatch();

				if (aiModels.length < 2) {
					console.warn(
						"Not enough AI models available for matchmaking"
					);
					continue;
				}

				// Create a match that starts in the future
				// Schedule between 15 minutes and 24 hours in the future
				const now = new Date();
				const minOffset = 15 * 60 * 1000; // 15 minutes
				const maxOffset = 24 * 60 * 60 * 1000; // 24 hours
				const randomOffset =
					Math.floor(Math.random() * (maxOffset - minOffset)) +
					minOffset;
				const startTime = new Date(now.getTime() + randomOffset);

				const matchType = this.getRandomMatchType();
				const timeControl = this.getRandomTimeControl();

				// Create a new match and add it to our mock matches
				const newMatch = {
					id: mockMatches.length + 1,
					solana_match_id: Math.floor(1000 + Math.random() * 9000),
					white_bot_id: aiModels[0].id,
					black_bot_id: aiModels[1].id,
					match_type: matchType,
					status: "Scheduled",
					start_time: startTime,
					time_control: timeControl,
					bets_locked: false,
					white_pool: 0,
					black_pool: 0,
					draw_pool: 0,
					moves: JSON.stringify([]),
					created_at: new Date(),
				};

				mockMatches.push(newMatch);

				console.log(
					`Created upcoming match: ${aiModels[0].name} vs ${
						aiModels[1].name
					} at ${startTime.toISOString()}`
				);
			} catch (error) {
				console.error(`Error creating upcoming match #${i}:`, error);
			}
		}
	}

	/**
	 * Get random AI models for a match, ensuring they have different styles and appropriate ELO differences
	 */
	private async getRandomAIModelsForMatch(): Promise<AIModel[]> {
		// Get all AI models from mock data
		const allModels = mockAIModels;

		if (allModels.length < 2) {
			return [];
		}

		// Randomly decide if we want a balanced match or a mismatch
		const wantBalancedMatch = Math.random() > 0.3; // 70% chance of balanced match

		if (wantBalancedMatch) {
			// For balanced matches, find models with similar ELO (within 200 points)
			const shuffled = [...allModels].sort(() => 0.5 - Math.random());

			for (let i = 0; i < shuffled.length - 1; i++) {
				const model1 = shuffled[i];

				// Find a model with similar ELO but different style
				for (let j = i + 1; j < shuffled.length; j++) {
					const model2 = shuffled[j];
					const eloDiff = Math.abs(model1.elo - model2.elo);

					if (eloDiff <= 200 && model1.style !== model2.style) {
						return [model1, model2];
					}
				}
			}
		} else {
			// For mismatches, create interesting matchups with larger ELO differences
			const shuffled = [...allModels].sort(() => 0.5 - Math.random());

			for (let i = 0; i < shuffled.length - 1; i++) {
				const model1 = shuffled[i];

				// Find a model with larger ELO difference
				for (let j = i + 1; j < shuffled.length; j++) {
					const model2 = shuffled[j];
					const eloDiff = Math.abs(model1.elo - model2.elo);

					if (eloDiff > 200 && eloDiff < 500) {
						return [model1, model2];
					}
				}
			}
		}

		// If we couldn't find an ideal match, just return two random models
		const shuffled = [...allModels].sort(() => 0.5 - Math.random());
		return shuffled.slice(0, 2);
	}

	/**
	 * Get a random match type with weighted probabilities
	 */
	private getRandomMatchType(): string {
		const types = [
			{ type: "Regular", weight: 0.7 },
			{ type: "Tournament", weight: 0.2 },
			{ type: "Showcase", weight: 0.1 },
		];

		const totalWeight = types.reduce((sum, type) => sum + type.weight, 0);
		let random = Math.random() * totalWeight;

		for (const typeObj of types) {
			if (random < typeObj.weight) {
				return typeObj.type;
			}
			random -= typeObj.weight;
		}

		return "Regular";
	}

	/**
	 * Get a random time control
	 */
	private getRandomTimeControl(): string {
		const timeControls = [
			"5+0", // Blitz
			"5+3", // Blitz with increment
			"10+0", // Rapid
			"15+10", // Rapid with increment
			"30+0", // Classical
			"30+20", // Classical with increment
		];

		const randomIndex = Math.floor(Math.random() * timeControls.length);
		return timeControls[randomIndex];
	}
}

// Create a singleton instance
export const matchmakingService = new MatchmakingService();
