import React, { useRef, useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useChessMatch } from "@/hooks/useChessMatch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIModel } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Maximize2, Minimize2, RotateCcw } from "lucide-react";

interface ChessBoardProps {
	whitePlayer: AIModel;
	blackPlayer: AIModel;
	matchId: number;
}

export function ChessBoard({
	whitePlayer,
	blackPlayer,
	matchId,
}: ChessBoardProps) {
	const {
		game,
		moveHistory,
		status,
		timers,
		lastMove,
		currentMove,
		isAutoPlay,
		activeTimer,
	} = useChessMatch(matchId);

	const boardWrapper = useRef<HTMLDivElement>(null);
	const resizeHandleRef = useRef<HTMLDivElement>(null);

	// Initialize board width from localStorage or default to 400px
	const [boardWidth, setBoardWidth] = useState(() => {
		const savedWidth = localStorage.getItem("chessBoardWidth");
		return savedWidth ? parseInt(savedWidth, 10) : 400;
	});

	const [isResizing, setIsResizing] = useState(false);
	const [isResizeMode, setIsResizeMode] = useState(false);
	const [startX, setStartX] = useState(0);
	const [startY, setStartY] = useState(0);
	const [startWidth, setStartWidth] = useState(0);

	// Save board width to localStorage when it changes
	useEffect(() => {
		localStorage.setItem("chessBoardWidth", boardWidth.toString());
	}, [boardWidth]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			if (boardWrapper.current && boardWrapper.current.parentElement) {
				const containerWidth =
					boardWrapper.current.parentElement.offsetWidth;
				// If current board width exceeds container, resize it to fit
				if (boardWidth > containerWidth - 20) {
					// 20px buffer for padding
					setBoardWidth(Math.max(200, containerWidth - 20));
				}
			}
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [boardWidth]);

	// Handle board resize
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;

			// Calculate new width based on mouse movement
			const newWidth = Math.max(
				200, // Minimum width
				Math.min(
					800, // Maximum width
					startWidth + (e.clientX - startX)
				)
			);

			setBoardWidth(newWidth);

			// Prevent text selection during resize
			e.preventDefault();
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			document.body.style.cursor = "default";
		};

		if (isResizing) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizing, startX, startY, startWidth]);

	// Handle resize start (mouse)
	const handleResizeStart = (e: React.MouseEvent) => {
		setIsResizing(true);
		setStartX(e.clientX);
		setStartY(e.clientY);
		setStartWidth(boardWidth);
		document.body.style.cursor = "ew-resize";
		e.preventDefault();
	};

	// Handle resize start (touch)
	const handleTouchStart = (e: React.TouchEvent) => {
		if (e.touches.length === 1) {
			setIsResizing(true);
			setStartX(e.touches[0].clientX);
			setStartY(e.touches[0].clientY);
			setStartWidth(boardWidth);
			e.preventDefault();
		}
	};

	// Handle touch move
	useEffect(() => {
		const handleTouchMove = (e: TouchEvent) => {
			if (!isResizing || e.touches.length !== 1) return;

			// Calculate new width based on touch movement
			const newWidth = Math.max(
				200, // Minimum width
				Math.min(
					800, // Maximum width
					startWidth + (e.touches[0].clientX - startX)
				)
			);

			setBoardWidth(newWidth);
			e.preventDefault();
		};

		const handleTouchEnd = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener("touchmove", handleTouchMove, {
				passive: false,
			});
			document.addEventListener("touchend", handleTouchEnd);
			document.addEventListener("touchcancel", handleTouchEnd);
		}

		return () => {
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
			document.removeEventListener("touchcancel", handleTouchEnd);
		};
	}, [isResizing, startX, startWidth]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="glassmorphism rounded-xl p-4">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-lg font-semibold">Live Chess Match</h2>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setIsResizeMode(!isResizeMode)}
						className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
						title={
							isResizeMode ? "Exit resize mode" : "Resize board"
						}
					>
						{isResizeMode ? (
							<Minimize2 className="h-4 w-4 text-gray-300" />
						) : (
							<Maximize2 className="h-4 w-4 text-gray-300" />
						)}
					</button>
					<div className="text-sm text-gray-300">
						<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
							<span className="relative flex h-2 w-2 mr-1">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
							</span>
							Live
						</span>
					</div>
				</div>
			</div>

			{/* Black player info bar */}
			<div
				className={`flex justify-between items-center ${
					activeTimer === "black"
						? "bg-black/50 border-l-4 border-accent"
						: "bg-black/30"
				} rounded-t-lg p-3 transition-colors`}
			>
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold">
						B
					</div>
					<div>
						<div className="text-sm font-medium">
							{blackPlayer.name}
						</div>
						<div className="text-xs text-gray-400">
							ELO {blackPlayer.elo}
						</div>
					</div>
				</div>
				<div
					className={`font-mono text-lg ${
						activeTimer === "black"
							? "text-accent animate-pulse"
							: ""
					}`}
				>
					{formatTime(timers.black)}
				</div>
			</div>

			{/* Chess Board */}
			<div className="relative">
				{isResizeMode && (
					<div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-md z-10 flex items-center gap-2">
						<span>{Math.round(boardWidth)}px</span>
						<button
							onClick={() => setBoardWidth(400)}
							className="ml-1 p-1 rounded-full hover:bg-white/20 transition-colors"
							title="Reset to default size"
						>
							<RotateCcw className="h-3 w-3" />
						</button>
					</div>
				)}
				<div
					ref={boardWrapper}
					className="aspect-square"
					style={{
						width: `${boardWidth}px`,
						margin: "0 auto",
						transition: isResizing
							? "none"
							: "width 0.2s ease-in-out",
					}}
				>
					<Chessboard
						id={`board-${matchId}`}
						boardWidth={boardWidth}
						position={game.fen()}
						boardOrientation="white"
						customDarkSquareStyle={{ backgroundColor: "#769656" }}
						customLightSquareStyle={{ backgroundColor: "#EEEED2" }}
						customSquareStyles={{
							...(lastMove
								? {
										[lastMove.from]: {
											backgroundColor:
												"rgba(155, 135, 245, 0.3)",
										},
										[lastMove.to]: {
											backgroundColor:
												"rgba(155, 135, 245, 0.3)",
										},
								  }
								: {}),
						}}
					/>
				</div>

				{/* Resize handle */}
				{isResizeMode && (
					<div
						ref={resizeHandleRef}
						className="absolute right-0 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center"
						onMouseDown={handleResizeStart}
						onTouchStart={handleTouchStart}
						style={{ height: `${boardWidth}px` }}
					>
						<div className="h-12 w-1.5 bg-accent/50 rounded-full hover:bg-accent transition-colors"></div>
						<div className="absolute top-1/2 -translate-y-1/2 right-0 text-xs text-gray-400 rotate-90 whitespace-nowrap">
							Drag to resize
						</div>
					</div>
				)}
			</div>

			{/* White player info bar */}
			<div
				className={`flex justify-between items-center ${
					activeTimer === "white"
						? "bg-white/20 border-l-4 border-accent"
						: "bg-white/10"
				} rounded-b-lg p-3 mt-2 transition-colors`}
			>
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold">
						W
					</div>
					<div>
						<div className="text-sm font-medium">
							{whitePlayer.name}
						</div>
						<div className="text-xs text-gray-400">
							ELO {whitePlayer.elo}
						</div>
					</div>
				</div>
				<div
					className={`font-mono text-lg ${
						activeTimer === "white"
							? "text-accent animate-pulse"
							: ""
					}`}
				>
					{formatTime(timers.white)}
				</div>
			</div>

			{/* Game status */}
			{status && status !== "inProgress" && (
				<div
					className={`mt-2 p-2 text-center rounded-md font-medium ${
						status === "checkmate" && game.turn() === "b"
							? "bg-green-500/20 text-green-300"
							: status === "checkmate" && game.turn() === "w"
							? "bg-red-500/20 text-red-300"
							: status === "timeout" && timers.white <= 0
							? "bg-red-500/20 text-red-300"
							: status === "timeout" && timers.black <= 0
							? "bg-green-500/20 text-green-300"
							: "bg-yellow-500/20 text-yellow-300"
					}`}
				>
					{status === "checkmate" && game.turn() === "b"
						? "White wins by checkmate"
						: status === "checkmate" && game.turn() === "w"
						? "Black wins by checkmate"
						: status === "timeout" && timers.white <= 0
						? "Black wins on time"
						: status === "timeout" && timers.black <= 0
						? "White wins on time"
						: status === "stalemate"
						? "Draw by stalemate"
						: status === "threefoldRepetition"
						? "Draw by repetition"
						: status === "insufficientMaterial"
						? "Draw by insufficient material"
						: status === "fiftyMoves"
						? "Draw by fifty-move rule"
						: status}
				</div>
			)}

			{/* Move history */}
			<div className="mt-4">
				<h3 className="text-sm font-medium mb-2">Move History</h3>
				<ScrollArea className="bg-black/20 rounded-lg p-3 h-32">
					<div className="grid grid-cols-7 gap-2 font-mono text-sm">
						{moveHistory.map(
							(move, index) =>
								index % 2 === 0 && (
									<React.Fragment
										key={`move-row-${Math.floor(
											index / 2
										)}`}
									>
										<div className="text-gray-500">
											{Math.floor(index / 2) + 1}.
										</div>
										<div className="col-span-3">{move}</div>
										{moveHistory[index + 1] ? (
											<div className="col-span-3">
												{moveHistory[index + 1]}
											</div>
										) : (
											<div className="col-span-3"></div>
										)}
									</React.Fragment>
								)
						)}
					</div>
				</ScrollArea>
			</div>

			<Separator className="my-4 bg-white/10" />

			<div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
				<span className="text-sm">Current Move: {currentMove}</span>
				<div className="flex items-center gap-3">
					<span className="text-sm">Auto-play</span>
					<div className="relative inline-flex items-center cursor-pointer">
						<input
							type="checkbox"
							checked={isAutoPlay}
							onChange={() => {}}
							className="sr-only peer"
						/>
						<div className="w-9 h-5 bg-gray-700 peer-focus:ring-1 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
