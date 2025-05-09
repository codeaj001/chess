import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Match, MatchType, MatchStatus } from "@/lib/types";
import {
	formatDistanceToNow,
	format,
	isAfter,
	isBefore,
	parseISO,
} from "date-fns";
import { ChevronRight, Search, Clock, Trophy, Calendar } from "lucide-react";
import CountdownTimer from "./CountdownTImer"; // Import the CountdownTimer

interface MatchCardProps {
	match: Match;
	onClick: (matchId: number) => void;
}

function getMatchTypeBadge(type: MatchType) {
	switch (type) {
		case "Tournament":
			return "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30";
		case "Showcase":
			return "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30";
		case "Regular":
		default:
			return "bg-green-500/20 text-green-300 hover:bg-green-500/30";
	}
}

function getMatchStatusBadge(status: MatchStatus) {
	switch (status) {
		case "InProgress":
			return "bg-yellow-500/20 text-yellow-300";
		case "Completed":
			return "bg-gray-500/20 text-gray-300";
		case "Scheduled":
		default:
			return "bg-blue-500/20 text-blue-300";
	}
}

function MatchCard({ match, onClick }: MatchCardProps) {
	const { data: whiteAI } = useQuery({
		queryKey: [`/api/ai/${match.white_bot_id}`],
	});

	const { data: blackAI } = useQuery({
		queryKey: [`/api/ai/${match.black_bot_id}`],
	});

	let timeDisplay = "";
	let timeIcon = null;

	if (match.status === "Scheduled") {
		timeIcon = <Calendar className="h-4 w-4 mr-1" />;
		const startTime = parseISO(match.start_time);
		if (isAfter(startTime, new Date())) {
			timeDisplay = `Starts ${formatDistanceToNow(startTime, {
				addSuffix: true,
			})}`;
		} else {
			timeDisplay = `Scheduled for ${format(startTime, "MMM d, h:mm a")}`;
		}
	} else if (match.status === "InProgress") {
		timeIcon = <Clock className="h-4 w-4 mr-1" />;
		timeDisplay = "In Progress";
	} else if (match.status === "Completed") {
		timeIcon = <Trophy className="h-4 w-4 mr-1" />;
		timeDisplay = match.result ? `${match.result} won` : "Completed";
	}

	const handleBetsLocked = () => {
		console.log(`Bets locked for match ${match.id}`);
	};

	return (
		<div
			className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
			onClick={() => onClick(match.id)}
		>
			<div className="flex justify-between items-start mb-2">
				<div className="flex flex-col">
					<span className="text-sm font-medium">
						{whiteAI?.name ?? "Loading..."} vs{" "}
						{blackAI?.name ?? "Loading..."}
					</span>
					<div className="flex items-center text-xs text-gray-400 mt-1">
						{/* This div is to separate the time icon from the timer  */}
						<div className="flex items-center">
							{timeIcon}
							<span>{timeDisplay}</span>
						</div>
						{/* Display CountdownTimer if match is Scheduled */}
						{match.status === "Scheduled" && (
							<CountdownTimer
								startTime={match.start_time}
								betsLocked={match.bets_locked}
								onBetsLocked={handleBetsLocked}
							/>
						)}
						{/* Display "Bets are Locked" if bets are locked and match is Scheduled */}
						{match.status === "Scheduled" && match.bets_locked && (
							<p className="text-xs text-red-500 mt-1">
								Bets are Locked
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-col items-end">
					<Badge className={`${getMatchTypeBadge(match.match_type)}`}>
						{match.match_type}
					</Badge>
					<Badge
						className={`mt-1 ${getMatchStatusBadge(match.status)}`}
					>
						{match.status}
					</Badge>
				</div>
			</div>

			<div className="flex justify-between items-center text-xs text-gray-400 mt-2">
				<div className="flex items-center">
					<span>
						ELO {whiteAI?.elo ?? "?"} / {blackAI?.elo ?? "?"}
					</span>
				</div>
				<span>{match.time_control}</span>
			</div>

			{match.status === "InProgress" && (
				<div className="mt-2 flex justify-between items-center">
					<div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
						<div
							className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
							style={{
								width: `${Math.min(
									100,
									(match.moves?.length || 0) * 2
								)}%`,
							}}
						/>
					</div>
					<span className="text-xs text-gray-400 ml-2">
						{match.moves?.length || 0} moves
					</span>
				</div>
			)}
		</div>
	);
}

export function MatchList({
	onSelectMatch,
}: {
	onSelectMatch: (matchId: number) => void;
}) {
	const [tab, setTab] = useState<"active" | "upcoming" | "completed" | "all">(
		"active"
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("all");

	// Fetch matches based on current tab
	const { data: activeMatches, isLoading: isLoadingActive } = useQuery({
		queryKey: ["/api/matches/active"],
		enabled: tab === "active" || tab === "all",
	});

	const { data: upcomingMatches, isLoading: isLoadingUpcoming } = useQuery({
		queryKey: ["/api/matches/upcoming", 20],
		enabled: tab === "upcoming" || tab === "all",
	});

	const { data: completedMatches, isLoading: isLoadingCompleted } = useQuery({
		queryKey: ["/api/matches/by-status/Completed"],
		enabled: tab === "completed" || tab === "all",
	});

	const { data: allMatches, isLoading: isLoadingAll } = useQuery({
		queryKey: ["/api/matches/all"],
		enabled: tab === "all",
	});

	// Determine which matches to display based on current tab
	let displayMatches: Match[] = [];
	let isLoading = false;

	switch (tab) {
		case "active":
			displayMatches = activeMatches || [];
			isLoading = isLoadingActive;
			break;
		case "upcoming":
			displayMatches = upcomingMatches || [];
			isLoading = isLoadingUpcoming;
			break;
		case "completed":
			displayMatches = completedMatches || [];
			isLoading = isLoadingCompleted;
			break;
		case "all":
			displayMatches = allMatches || [];
			isLoading = isLoadingAll;
			break;
	}

	// Apply filters
	let filteredMatches = displayMatches;

	// Apply search filter if query exists
	if (searchQuery) {
		// We can't directly filter by AI name since we don't have that data yet
		// In a real app, you'd want to fetch this data or have it included in the match data
		filteredMatches = filteredMatches.filter(
			(match) =>
				match.id.toString().includes(searchQuery) ||
				match.match_type
					.toLowerCase()
					.includes(searchQuery.toLowerCase())
		);
	}

	// Apply match type filter
	if (filterType !== "all") {
		filteredMatches = filteredMatches.filter(
			(match) => match.match_type === filterType
		);
	}

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>AI Chess Matches</CardTitle>
				<CardDescription>
					View and manage AI chess matches
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex space-x-2">
					<div className="relative flex-1">
						<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search matches..."
							className="pl-8"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Types</SelectItem>
							<SelectItem value="Regular">Regular</SelectItem>
							<SelectItem value="Tournament">
								Tournament
							</SelectItem>
							<SelectItem value="Showcase">Showcase</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Tabs
					value={tab}
					onValueChange={(value) => setTab(value as any)}
				>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="active">Active</TabsTrigger>
						<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
						<TabsTrigger value="completed">Completed</TabsTrigger>
						<TabsTrigger value="all">All</TabsTrigger>
					</TabsList>

					<TabsContent value={tab} className="mt-4">
						{isLoading ? (
							<div className="flex items-center justify-center h-40">
								<p className="text-gray-400">
									Loading matches...
								</p>
							</div>
						) : filteredMatches.length > 0 ? (
							<div className="space-y-3">
								{filteredMatches.map((match) => (
									<MatchCard
										key={match.id}
										match={match}
										onClick={onSelectMatch}
									/>
								))}
							</div>
						) : (
							<div className="flex items-center justify-center h-40">
								<p className="text-gray-400">
									No matches found
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
			<CardFooter className="flex justify-end">
				<Button variant="outline" className="flex items-center">
					View All Matches
					<ChevronRight className="ml-2 h-4 w-4" />
				</Button>
			</CardFooter>
		</Card>
	);
}
