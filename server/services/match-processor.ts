import { mockMatches, generateChessMove } from "../mock-data";
import { Chess } from "chess.js";

/**
 * Service to process matches - start scheduled matches, generate AI moves, and update match status
 */
export class MatchProcessorService {
	private isRunning: boolean = false;
	private processingInterval: NodeJS.Timeout | null = null;
	private readonly intervalTime: number = 30 * 1000; // 30 seconds

	/**
	 * Start the match processor service
	 */
	public start(): void {
		if (this.isRunning) {
			console.log("Match processor service is already running");
			return;
		}

		console.log("Starting match processor service...");
		this.isRunning = true;

		// Run immediately on start
		this.processMatches().catch((err) => {
			console.error("Error in initial match processing:", err);
		});

		// Then set up interval
		this.processingInterval = setInterval(() => {
			this.processMatches().catch((err) => {
				console.error("Error in match processing interval:", err);
			});
		}, this.intervalTime);
	}

	/**
	 * Stop the match processor service
	 */
	public stop(): void {
		if (!this.isRunning) {
			console.log("Match processor service is not running");
			return;
		}

		console.log("Stopping match processor service...");
		this.isRunning = false;

		if (this.processingInterval) {
			clearInterval(this.processingInterval);
			this.processingInterval = null;
		}
	}

	/**
	 * Process all matches - start scheduled matches, generate AI moves, and update match status
	 */
	private async processMatches(): Promise<void> {
		try {
			await this.startScheduledMatches();
			await this.generateAIMovesForActiveMatches();
			await this.updateMatchResults();
		} catch (error) {
			console.error("Error in processMatches:", error);
			throw error;
		}
	}

	/**
	 * Start scheduled matches that should begin now
	 */
	private async startScheduledMatches(): Promise<void> {
		try {
			// Get scheduled matches from mock data
			const scheduledMatches = mockMatches.filter(
				(match) => match.status === "Scheduled"
			);
			const now = new Date();

			// Find matches that should start now
			const matchesToStart = scheduledMatches.filter((match) => {
				const startTime = new Date(match.start_time);
				return startTime <= now;
			});

			if (matchesToStart.length > 0) {
				console.log(
					`Starting ${matchesToStart.length} scheduled matches...`
				);

				for (const match of matchesToStart) {
					try {
						// Update match status to InProgress
						const matchIndex = mockMatches.findIndex(
							(m) => m.id === match.id
						);
						if (matchIndex !== -1) {
							mockMatches[matchIndex].status = "InProgress";
							console.log(
							`Started match ${match.id}: ${match.white_bot_id} vs ${match.black_bot_id} - Bets Locked`

							);
						}
					} catch (error) {
						console.error(
							`Error starting match ${match.id}:`,
							error
						);
					}
				}
			}
		} catch (error) {
			console.error("Error in startScheduledMatches:", error);
			throw error;
		}
	}

	/**
	 * Generate AI moves for active matches
	 */
	private async generateAIMovesForActiveMatches(): Promise<void> {
		try {
			// Get active matches from mock data
			const activeMatches = mockMatches.filter(
				(match) => match.status === "InProgress"
			);

			if (activeMatches.length > 0) {
				console.log(
					`Processing ${activeMatches.length} active matches for AI moves...`
				);

				for (const match of activeMatches) {
					try {
						// Get the current position
						const chess = new Chess();

						// Parse moves from string to array if present
						let movesArr = [];
						try {
							movesArr = match.moves
								? JSON.parse(match.moves)
								: [];
						} catch (error) {
							// Handle the case where it's not valid JSON
							movesArr = match.moves
								? match.moves.split(",")
								: [];
						}

						// Apply all moves to get current position
						try {
							for (const move of movesArr) {
								chess.move(move);
							}
						} catch (error) {
							console.error(
								`Error applying moves for match ${match.id}:`,
								error
							);
							// Reset the chess board and continue
							chess.reset();
						}

						// Determine whose turn it is
						const isWhiteTurn = chess.turn() === "w";
						const currentAIId = isWhiteTurn
							? match.white_bot_id
							: match.black_bot_id;

						// Check if the game is over
						if (chess.isGameOver()) {
							// Update match result
							let result = "Draw";
							if (chess.isCheckmate()) {
								result = isWhiteTurn ? "Black" : "White";
							}

							// Update match result in mock data
							const matchIndex = mockMatches.findIndex(
								(m) => m.id === match.id
							);
							if (matchIndex !== -1) {
								mockMatches[matchIndex].result = result;
								mockMatches[matchIndex].status = "Completed";
								mockMatches[matchIndex].end_time = new Date();
								mockMatches[matchIndex].bets_locked = true;
								console.log(
									`Match ${match.id} completed with result: ${result}`
								);
							}
							continue;
						}

						// Generate a move with some delay to simulate thinking
						// In a real app, you'd have more sophisticated AI move generation
						const fen = chess.fen();

						// Add a random delay between moves (5-15 seconds)
						const moveDelay =
							Math.floor(Math.random() * 10000) + 5000;

						// Use setTimeout to delay the move
						setTimeout(async () => {
							try {
								// Generate a move using our real chess engine
								console.log(
									`Generating move for match ${match.id} using AI ${currentAIId}`
								);
								const move = await generateChessMove(
									fen,
									currentAIId
								);

								if (!move) {
									console.error(
										`No valid move generated for match ${match.id}`
									);
									return;
								}

								// Verify the move is valid
								const verifyChess = new Chess(fen);
								try {
									verifyChess.move(move);

									// Update the match with the new move
									const matchIndex = mockMatches.findIndex(
										(m) => m.id === match.id
									);
									if (matchIndex !== -1) {
										let moves = [];
										try {
											moves = JSON.parse(
												(mockMatches[matchIndex]
													.moves as string) || "[]"
											);
										} catch (e) {
											moves = [];
										}

										moves.push(move);
										mockMatches[matchIndex].moves =
											JSON.stringify(moves);
										console.log(
											`Generated move for match ${match.id}: ${move}`
										);

										// Check if this move ended the game
										verifyChess.move(move);
										if (verifyChess.isGameOver()) {
											let result = "Draw";
											if (verifyChess.isCheckmate()) {
												result =
													verifyChess.turn() === "w"
														? "Black"
														: "White";
											}

											// Update match result
											mockMatches[matchIndex].result =
												result;
											mockMatches[matchIndex].status =
												"Completed";
											mockMatches[matchIndex].end_time =
												new Date();
											mockMatches[
												matchIndex
											].bets_locked = true;
											console.log(
												`Match ${match.id} completed with result: ${result}`
											);
										}
									}
								} catch (invalidMoveError) {
									console.error(
										`Invalid move generated for match ${match.id}: ${move}`,
										invalidMoveError
									);

									// Try to make a random valid move instead
									const legalMoves = verifyChess.moves();
									if (legalMoves.length > 0) {
										const randomMove =
											legalMoves[
												Math.floor(
													Math.random() *
														legalMoves.length
												)
											];
										console.log(
											`Using fallback move for match ${match.id}: ${randomMove} instead of ${move}`
										);

										// Update the match with the fallback move
										const matchIndex =
											mockMatches.findIndex(
												(m) => m.id === match.id
											);
										if (matchIndex !== -1) {
											let moves = [];
											try {
												moves = JSON.parse(
													(mockMatches[matchIndex]
														.moves as string) ||
														"[]"
												);
											} catch (e) {
												moves = [];
											}

											moves.push(randomMove);
											mockMatches[matchIndex].moves =
												JSON.stringify(moves);
											console.log(
												`Generated fallback move for match ${match.id}: ${randomMove}`
											);
										}
									}
								}
							} catch (moveError) {
								console.error(
									`Error generating move for match ${match.id}:`,
									moveError
								);
							}
						}, moveDelay);
					} catch (error) {
						console.error(
							`Error processing match ${match.id}:`,
							error
						);
					}
				}
			}
		} catch (error) {
			console.error("Error in generateAIMovesForActiveMatches:", error);
			throw error;
		}
	}

	/**
	 * Update match results for completed games
	 */
	private async updateMatchResults(): Promise<void> {
		try {
			// Get active matches from mock data
			const activeMatches = mockMatches.filter(
				(match) => match.status === "InProgress"
			);

			for (const match of activeMatches) {
				try {
					// Get the current position
					const chess = new Chess();

					// Parse moves from string to array if present
					let movesArr = [];
					try {
						movesArr = match.moves ? JSON.parse(match.moves) : [];
					} catch (error) {
						// Handle the case where it's not valid JSON
						movesArr = match.moves ? match.moves.split(",") : [];
					}

					// Apply all moves to get current position
					try {
						for (const move of movesArr) {
							chess.move(move);
						}
					} catch (error) {
						console.error(
							`Error applying moves for match ${match.id}:`,
							error
						);
						// Reset the chess board and continue
						chess.reset();
					}

					// Check if the game is over
					if (chess.isGameOver()) {
						// Update match result
						let result = "Draw";
						if (chess.isCheckmate()) {
							result = chess.turn() === "w" ? "Black" : "White";
						}

						await storage.updateMatchResult(match.id, result);
						console.log(
							`Match ${match.id} completed with result: ${result}`
						);
					}

					// Also check if the match has been going on for too long (50+ moves)
					// and force a draw if necessary
					if (movesArr.length >= 100) {
						// 50 moves by each player
						// Update match result in mock data
						const matchIndex = mockMatches.findIndex(
							(m) => m.id === match.id
						);
						if (matchIndex !== -1) {
							mockMatches[matchIndex].result = "Draw";
							mockMatches[matchIndex].status = "Completed";
							mockMatches[matchIndex].end_time = new Date();
							mockMatches[matchIndex].bets_locked = true;
							console.log(
								`Match ${match.id} forced to draw after 50 moves`
							);
						}
					}
				} catch (error) {
					console.error(
						`Error updating result for match ${match.id}:`,
						error
					);
				}
			}
		} catch (error) {
			console.error("Error in updateMatchResults:", error);
			throw error;
		}
	}
}

// Create a singleton instance
export const matchProcessorService = new MatchProcessorService();
