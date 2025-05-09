import { useState, useEffect, useCallback, useRef } from "react";
import { Chess, Move } from "chess.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "./use-toast";
import { BetPools } from "@/lib/types";

export function useChessMatch(matchId: number) {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [game, setGame] = useState<Chess>(new Chess());
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [status, setStatus] = useState<string | null>("inProgress");
	const [lastMove, setLastMove] = useState<Move | null>(null);
	const [currentMove, setCurrentMove] = useState(0);
	const [timers, setTimers] = useState({ white: 600, black: 600 }); // 10 minutes default
	const [isAutoPlay, setIsAutoPlay] = useState(true);
	const [timeControl, setTimeControl] = useState("10+0");
	const [increment, setIncrement] = useState(0); // Time increment in seconds
	const [activeTimer, setActiveTimer] = useState<"white" | "black" | null>(
		null
	);

	const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const gameRef = useRef<Chess>(game);

	// Keep gameRef.current updated with the latest game state
	useEffect(() => {
		gameRef.current = game;

		// Set active timer based on whose turn it is
		if (game && !game.isGameOver()) {
			setActiveTimer(game.turn() === "w" ? "white" : "black");
		} else {
			setActiveTimer(null);
		}
	}, [game]);

	// Fetch match data
	const { data: matchData, isLoading: isLoadingMatch } = useQuery({
		queryKey: [`/api/matches/${matchId}`],
	});

	// Fetch bet pools
	const { data: betPoolsData, isLoading: isLoadingPools } = useQuery({
		queryKey: [`/api/matches/${matchId}/pools`],
	});

	// Parse bet pools data
	const betPools: BetPools | null = betPoolsData
		? {
				white: betPoolsData.white_pool,
				black: betPoolsData.black_pool,
				draw: betPoolsData.draw_pool,
		  }
		: null;

	// Check if betting is locked for this match
	const isMatchLocked = matchData?.bets_locked || false;

	// Make AI move
	const makeAIMove = useCallback(async () => {
		if (!isAutoPlay || !matchData || matchData.status !== "InProgress")
			return;

		// Get the player to move
		const playerToMove = gameRef.current.turn() === "w" ? "white" : "black";
		const aiId =
			playerToMove === "white"
				? matchData.white_bot_id
				: matchData.black_bot_id;

		try {
			// Get move from backend AI
			const data = await apiRequest("POST", `/api/ai/${aiId}/move`, {
				fen: gameRef.current.fen(),
				matchId,
			});

			const move = data.move;

			// Delay to simulate thinking (longer for complex positions)
			const moveNumber = gameRef.current.history().length;
			const isComplexPosition =
				gameRef.current.inCheck() ||
				gameRef.current.moves().length > 30;
			const thinkTime = isComplexPosition
				? 2000
				: 1000 + Math.random() * 1000;

			// Clear any existing timeout
			if (moveTimeoutRef.current) {
				clearTimeout(moveTimeoutRef.current);
			}

			moveTimeoutRef.current = setTimeout(() => {
				const newGame = new Chess(gameRef.current.fen());

				try {
					const result = newGame.move(move);

					// Update game state
					setGame(newGame);
					setLastMove(result);
					setMoveHistory([...gameRef.current.history(), move]);
					setCurrentMove(moveNumber + 1);

					// Check for game over conditions
					const isCheckmate = newGame.isCheckmate();
					const isDraw = newGame.isDraw();

					if (isCheckmate) {
						setStatus("checkmate");
						// Update match status on backend
						updateMatchStatus(
							newGame.turn() === "w" ? "Black" : "White"
						);
					} else if (isDraw) {
						if (newGame.isStalemate()) {
							setStatus("stalemate");
						} else if (newGame.isThreefoldRepetition()) {
							setStatus("threefoldRepetition");
						} else if (newGame.isInsufficientMaterial()) {
							setStatus("insufficientMaterial");
						} else {
							setStatus("fiftyMoves");
						}
						// Update match status on backend
						updateMatchStatus("Draw");
					}

					// Apply time increment if any
					if (increment > 0) {
						setTimers((prev) => ({
							...prev,
							[playerToMove]: prev[playerToMove] + increment,
						}));
					}
				} catch (moveError) {
					console.error("Invalid move:", moveError);
					toast({
						title: "Invalid move",
						description: "The AI attempted an invalid move",
						variant: "destructive",
					});

					// Try to make a valid move as a fallback
					try {
						const legalMoves = newGame.moves();
						if (legalMoves.length > 0) {
							const randomMove =
								legalMoves[
									Math.floor(
										Math.random() * legalMoves.length
									)
								];
							const result = newGame.move(randomMove);

							// Update game state with the fallback move
							setGame(newGame);
							setLastMove(result);
							setMoveHistory([
								...gameRef.current.history(),
								randomMove,
							]);
							setCurrentMove(moveNumber + 1);

							toast({
								title: "Fallback move",
								description: "Using a valid move instead",
							});
						}
					} catch (fallbackError) {
						console.error(
							"Error making fallback move:",
							fallbackError
						);
					}
				}
			}, thinkTime);
		} catch (error) {
			console.error("Error getting AI move:", error);
			toast({
				title: "AI Move Error",
				description: "Failed to get AI's next move",
				variant: "destructive",
			});
		}
	}, [isAutoPlay, matchId, matchData, toast]);

	// Update match status on backend
	const updateMatchStatus = async (result: "White" | "Black" | "Draw") => {
		try {
			await apiRequest("PATCH", `/api/matches/${matchId}/result`, {
				result,
			});
			// Invalidate match queries to reflect the update
			queryClient.invalidateQueries({
				queryKey: [`/api/matches/${matchId}`],
			});
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/active"],
			});
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/upcoming"],
			});
		} catch (error) {
			console.error("Error updating match status:", error);
		}
	};

	// Effect to handle the chess clock
	useEffect(() => {
		// Clear any existing timer interval
		if (timerIntervalRef.current) {
			clearInterval(timerIntervalRef.current);
			timerIntervalRef.current = null;
		}

		// Only run the timer if there's an active player and the game is in progress
		if (
			activeTimer &&
			status === "inProgress" &&
			matchData?.status === "InProgress"
		) {
			// Start a 1-second interval to update the timer
			timerIntervalRef.current = setInterval(() => {
				setTimers((prev) => {
					// Decrement the active player's time
					const newTime = Math.max(0, prev[activeTimer] - 1);

					// Check for time forfeit
					if (newTime === 0) {
						// Stop the timer
						if (timerIntervalRef.current) {
							clearInterval(timerIntervalRef.current);
							timerIntervalRef.current = null;
						}

						// Set game status to timeout
						setStatus("timeout");

						// Update match status on backend - the player who ran out of time loses
						updateMatchStatus(
							activeTimer === "white" ? "Black" : "White"
						);

						return { ...prev, [activeTimer]: 0 };
					}

					return { ...prev, [activeTimer]: newTime };
				});
			}, 1000);
		}

		return () => {
			if (timerIntervalRef.current) {
				clearInterval(timerIntervalRef.current);
				timerIntervalRef.current = null;
			}
		};
	}, [activeTimer, status, matchData?.status, updateMatchStatus]);

	// Effect to start automatic moves
	useEffect(() => {
		if (
			gameRef.current &&
			!gameRef.current.isGameOver() &&
			isAutoPlay &&
			matchData?.status === "InProgress" &&
			activeTimer // Only make a move if there's an active timer
		) {
			// Check if it's an AI's turn
			const playerToMove =
				gameRef.current.turn() === "w" ? "white" : "black";
			const aiId =
				playerToMove === "white"
					? matchData.white_bot_id
					: matchData.black_bot_id;

			if (aiId) {
				makeAIMove();
			}
		}

		return () => {
			if (moveTimeoutRef.current) {
				clearTimeout(moveTimeoutRef.current);
			}
		};
	}, [game, isAutoPlay, makeAIMove, matchData, activeTimer]);

	// Initialize game when match data is loaded
	useEffect(() => {
		if (matchData) {
			// Set time control
			if (matchData.time_control) {
				setTimeControl(matchData.time_control);

				// Parse time control (e.g. "5+3" means 5 minutes base time and 3 seconds increment)
				const [baseTimeStr, incrementStr] =
					matchData.time_control.split("+");
				const baseTimeMinutes = parseInt(baseTimeStr, 10) || 10;
				const incrementSeconds = parseInt(incrementStr, 10) || 0;

				setTimers({
					white: baseTimeMinutes * 60,
					black: baseTimeMinutes * 60,
				});

				// Set the increment
				setIncrement(incrementSeconds);
			}

			// Initialize with moves from backend if available
			if (matchData.moves && matchData.moves.length > 0) {
				const newGame = new Chess();
				let validMoves = [];

				try {
					// Parse moves from string to array if needed
					let movesArr = [];
					if (typeof matchData.moves === "string") {
						try {
							movesArr = JSON.parse(matchData.moves);
						} catch (e) {
							// If not valid JSON, try splitting by comma
							movesArr = matchData.moves.split(",");
						}
					} else {
						movesArr = matchData.moves;
					}

					// Apply all moves, but handle invalid moves
					for (const move of movesArr) {
						try {
							newGame.move(move);
							validMoves.push(move);
						} catch (moveError) {
							console.error(`Invalid move: ${move}`, moveError);
							// Try to make a random valid move instead
							const legalMoves = newGame.moves();
							if (legalMoves.length > 0) {
								const randomMove =
									legalMoves[
										Math.floor(
											Math.random() * legalMoves.length
										)
									];
								newGame.move(randomMove);
								validMoves.push(randomMove);
								console.log(
									`Using fallback move: ${randomMove} instead of ${move}`
								);
							}
						}
					}

					setGame(newGame);
					setMoveHistory(validMoves);
					setCurrentMove(validMoves.length);

					// Check game status
					if (newGame.isGameOver()) {
						if (newGame.isCheckmate()) {
							setStatus("checkmate");
						} else if (newGame.isDraw()) {
							if (newGame.isStalemate()) {
								setStatus("stalemate");
							} else if (newGame.isThreefoldRepetition()) {
								setStatus("threefoldRepetition");
							} else if (newGame.isInsufficientMaterial()) {
								setStatus("insufficientMaterial");
							} else {
								setStatus("fiftyMoves");
							}
						}
					} else {
						setStatus("inProgress");
					}
				} catch (error) {
					console.error("Error initializing game with moves:", error);
					toast({
						title: "Game Initialization Error",
						description:
							"Could not initialize the chess game with the provided moves",
						variant: "destructive",
					});

					// Reset to a new game
					setGame(new Chess());
					setMoveHistory([]);
					setCurrentMove(0);
					setStatus("inProgress");
				}
			}
		}
	}, [matchData, toast]);

	return {
		game,
		moveHistory,
		status,
		timers,
		lastMove,
		currentMove,
		isAutoPlay,
		setIsAutoPlay,
		timeControl,
		betPools,
		isMatchLocked,
		activeTimer,
	};
}
