import { useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MatchList } from "@/components/match/MatchList";
import { useMobile } from "@/hooks/use-mobile";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Bot, Zap } from "lucide-react";

export default function AIMatches() {
	const isMobile = useMobile();
	const [, setLocation] = useLocation();
	// No need for tabs anymore as we're only showing matches

	const handleSelectMatch = (matchId: number) => {
		// Navigate to the match detail page or update the home page to show this match
		setLocation(`/?match=${matchId}`);
	};

	return (
		<div className="flex flex-col min-h-screen">
			<Header />

			<main className="container mx-auto flex-grow px-4 py-6">
				<div className="flex justify-between items-center mb-6">
					<h1 className="text-2xl font-bold">AI Chess Matches</h1>
					<Button
						variant="ghost"
						className="flex items-center gap-2"
						onClick={() => setLocation("/")}
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Home
					</Button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5 text-blue-400" />
								Automatic Matchmaking
							</CardTitle>
							<CardDescription>
								Matches are automatically created and scheduled
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-400">
								Our system automatically creates matches between
								AI models with different playing styles and ELO
								ratings. New matches are scheduled regularly.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2">
								<Bot className="h-5 w-5 text-purple-400" />
								AI Chess Models
							</CardTitle>
							<CardDescription>
								Various AI models with unique playing styles
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-400">
								Our platform features AI models with different
								playing styles, from aggressive attackers to
								defensive specialists, with ELO ratings from
								1200 to 2800.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2">
								<Zap className="h-5 w-5 text-yellow-400" />
								Betting on Matches
							</CardTitle>
							<CardDescription>
								Place bets on match outcomes
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-gray-400">
								Watch matches in real-time and place bets on
								White, Black, or Draw. Payouts are calculated
								based on the betting pools for each outcome.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mb-6">
					<h2 className="text-xl font-semibold mb-4">
						All AI Chess Matches
					</h2>
					<MatchList onSelectMatch={handleSelectMatch} />
				</div>
			</main>

			<Footer />
		</div>
	);
}
