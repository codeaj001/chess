import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { MatchInfo } from "@/components/match/MatchInfo";
import { MatchSchedule } from "@/components/match/MatchSchedule";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { BettingPanel } from "@/components/betting/BettingPanel";
import { BettingHistory } from "@/components/betting/BettingHistory";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";
import { PlusCircle } from "lucide-react";

export default function Home() {
	const isMobile = useMobile();
	const location = useLocation();
	const [, setLocation] = useLocation();
	const [activeTab, setActiveTab] = useState<
		"matches" | "chessboard" | "betting"
	>("chessboard");
	const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

	// Parse match ID from URL if present
	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const matchId = params.get("match");
		if (matchId) {
			setSelectedMatchId(parseInt(matchId));
		}
	}, [location]);

	// Fetch active match
	const { data: activeMatches, isLoading: isLoadingMatches } = useQuery({
		queryKey: ["/api/matches/active"],
	});

	// Fetch upcoming matches for the schedule
	const { data: upcomingMatches, isLoading: isLoadingUpcoming } = useQuery({
		queryKey: ["/api/matches/upcoming"],
	});

	// Set the first active match as selected, if available and no match ID in URL
	useEffect(() => {
		if (activeMatches && activeMatches.length > 0 && !selectedMatchId) {
			setSelectedMatchId(activeMatches[0].id);
		}
	}, [activeMatches, selectedMatchId]);

	// Get the selected match data
	const selectedMatch = selectedMatchId
		? activeMatches?.find((match: any) => match.id === selectedMatchId)
		: activeMatches?.[0];

	// Get AI models for the selected match
	const { data: whiteAI, isLoading: isLoadingWhiteAI } = useQuery({
		queryKey: [`/api/ai/${selectedMatch?.white_bot_id}`],
		enabled: !!selectedMatch?.white_bot_id,
	});

	const { data: blackAI, isLoading: isLoadingBlackAI } = useQuery({
		queryKey: [`/api/ai/${selectedMatch?.black_bot_id}`],
		enabled: !!selectedMatch?.black_bot_id,
	});

	const handleMatchSelect = (matchId: number) => {
		setSelectedMatchId(matchId);
		// Update URL without full page reload
		setLocation(`/?match=${matchId}`);
	};

	const navigateToAIMatches = () => {
		setLocation("/ai-matches");
	};

	const isLoading =
		isLoadingMatches ||
		isLoadingWhiteAI ||
		isLoadingBlackAI ||
		isLoadingUpcoming;

	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			{isMobile && (
				<MobileNav
					activeTab={activeTab}
					onTabChange={(tab) => setActiveTab(tab)}
				/>
			)}

			<main className="container mx-auto flex-grow px-4 py-6">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">
						Live AI Chess Matches
					</h1>
					{/* <div className="flex items-center gap-3">
						<div className="text-sm text-gray-400">
							<span className="font-semibold text-green-400">
								Auto-Matchmaking:
							</span>{" "}
							AI models compete automatically
						</div>
						<Button
							onClick={navigateToAIMatches}
							variant="outline"
							className="flex items-center gap-2"
						>
							<PlusCircle className="h-4 w-4" />
							View Matches
						</Button>
					</div> */}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
					{/* Left column - Match Info (col-span-3 on desktop) */}
					<div
						className={`md:col-span-3 space-y-6 ${
							isMobile && activeTab !== "matches" ? "hidden" : ""
						}`}
					>
						{isLoading ? (
							<div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
								<p className="text-gray-400">
									Loading match data...
								</p>
							</div>
						) : selectedMatch && whiteAI && blackAI ? (
							<>
								<MatchInfo match={selectedMatch} />
								<MatchSchedule
									onSelectMatch={handleMatchSelect}
								/>
							</>
						) : (
							<div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
								<p className="text-gray-400">
									No active matches
								</p>
							</div>
						)}
					</div>

					{/* Middle column - Chess Board (col-span-6 on desktop) */}
					<div
						className={`md:col-span-6 ${
							isMobile && activeTab !== "chessboard"
								? "hidden"
								: ""
						}`}
					>
						{isLoading ? (
							<div className="glassmorphism rounded-xl p-4 aspect-square flex items-center justify-center">
								<p className="text-gray-400">
									Loading chess board...
								</p>
							</div>
						) : selectedMatch && whiteAI && blackAI ? (
							<ChessBoard
								whitePlayer={whiteAI}
								blackPlayer={blackAI}
								matchId={selectedMatch.id}
							/>
						) : (
							<div className="glassmorphism rounded-xl p-4 aspect-square flex items-center justify-center">
								<p className="text-gray-400">
									No active matches
								</p>
							</div>
						)}
					</div>

					{/* Right column - Betting Panel (col-span-3 on desktop) */}
					<div
						className={`md:col-span-3 space-y-6 ${
							isMobile && activeTab !== "betting" ? "hidden" : ""
						}`}
					>
						{isLoading ? (
							<div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
								<p className="text-gray-400">
									Loading betting options...
								</p>
							</div>
						) : selectedMatch ? (
							<>
								<BettingPanel match={selectedMatch} />
								<BettingHistory />
							</>
						) : (
							<div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
								<p className="text-gray-400">
									No active matches to bet on
								</p>
							</div>
						)}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
