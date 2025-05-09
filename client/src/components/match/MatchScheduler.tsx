import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AIModel, MatchType } from "@/lib/types";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface AIModelSelectProps {
	label: string;
	value: number | null;
	onChange: (value: number) => void;
	aiModels: AIModel[];
	excludeId?: number | null;
}

function AIModelSelect({
	label,
	value,
	onChange,
	aiModels,
	excludeId,
}: AIModelSelectProps) {
	// Filter out the excluded AI model if provided
	const filteredModels = excludeId
		? aiModels.filter((model) => model.id !== excludeId)
		: aiModels;

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Select
				value={value ? value.toString() : ""}
				onValueChange={(val) => onChange(parseInt(val))}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select an AI model" />
				</SelectTrigger>
				<SelectContent>
					{filteredModels.map((model) => (
						<SelectItem key={model.id} value={model.id.toString()}>
							<div className="flex justify-between items-center w-full">
								<span>{model.name}</span>
								<span className="text-xs text-gray-400">
									ELO {model.elo}
								</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function MatchScheduler() {
	const { toast } = useToast();
	const queryClient = useQueryClient();
	const [tab, setTab] = useState<"custom" | "random">("custom");
	const [whiteAI, setWhiteAI] = useState<number | null>(null);
	const [blackAI, setBlackAI] = useState<number | null>(null);
	const [matchType, setMatchType] = useState<MatchType>("Regular");
	const [timeControl, setTimeControl] = useState("10+0");
	const [customTimeControl, setCustomTimeControl] = useState(false);
	const [minutes, setMinutes] = useState("10");
	const [increment, setIncrement] = useState("0");
	const [startDate, setStartDate] = useState<Date>(
		addMinutes(new Date(), 15)
	);
	const [minElo, setMinElo] = useState<string>("");
	const [maxElo, setMaxElo] = useState<string>("");

	// Update time control when custom values change
	useEffect(() => {
		if (customTimeControl) {
			setTimeControl(`${minutes}+${increment}`);
		}
	}, [customTimeControl, minutes, increment]);

	// Fetch AI models
	const { data: aiModels, isLoading: isLoadingAI } = useQuery({
		queryKey: ["/api/ai"],
	});

	// Create match mutation
	const createMatchMutation = useMutation({
		mutationFn: async (matchData: any) => {
			return await apiRequest("POST", "/api/matches", matchData);
		},
		onSuccess: () => {
			// Invalidate queries to refresh match lists
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/upcoming"],
			});
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/active"],
			});

			// Show success message
			toast({
				title: "Match Scheduled",
				description: "The AI match has been successfully scheduled.",
			});

			// Reset form
			resetForm();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: `Failed to schedule match: ${error}`,
				variant: "destructive",
			});
		},
	});

	// Create random match mutation
	const createRandomMatchMutation = useMutation({
		mutationFn: async (matchData: any) => {
			return await apiRequest("POST", "/api/matches/random", matchData);
		},
		onSuccess: () => {
			// Invalidate queries to refresh match lists
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/upcoming"],
			});
			queryClient.invalidateQueries({
				queryKey: ["/api/matches/active"],
			});

			// Show success message
			toast({
				title: "Random Match Scheduled",
				description:
					"A random AI match has been successfully scheduled.",
			});

			// Reset form
			resetForm();
		},
		onError: (error) => {
			toast({
				title: "Error",
				description: `Failed to schedule random match: ${error}`,
				variant: "destructive",
			});
		},
	});

	const resetForm = () => {
		setWhiteAI(null);
		setBlackAI(null);
		setMatchType("Regular");
		setTimeControl("10+0");
		setCustomTimeControl(false);
		setMinutes("10");
		setIncrement("0");
		setStartDate(addMinutes(new Date(), 15));
		setMinElo("");
		setMaxElo("");
	};

	const handleCreateMatch = () => {
		if (tab === "custom") {
			if (!whiteAI || !blackAI) {
				toast({
					title: "Missing Information",
					description:
						"Please select both white and black AI models.",
					variant: "destructive",
				});
				return;
			}

			createMatchMutation.mutate({
				white_bot_id: whiteAI,
				black_bot_id: blackAI,
				match_type: matchType,
				time_control: timeControl,
				start_time: startDate.toISOString(),
			});
		} else {
			// Random match
			createRandomMatchMutation.mutate({
				minElo: minElo || undefined,
				maxElo: maxElo || undefined,
				match_type: matchType,
				time_control: timeControl,
				start_time: startDate.toISOString(),
			});
		}
	};

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Schedule AI Match</CardTitle>
				<CardDescription>
					Create a new match between AI chess models
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs
					value={tab}
					onValueChange={(value) =>
						setTab(value as "custom" | "random")
					}
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="custom">Custom Match</TabsTrigger>
						<TabsTrigger value="random">Random Match</TabsTrigger>
					</TabsList>

					<TabsContent value="custom" className="space-y-4 mt-4">
						{isLoadingAI ? (
							<div className="text-center py-4">
								Loading AI models...
							</div>
						) : (
							<>
								<AIModelSelect
									label="White AI"
									value={whiteAI}
									onChange={setWhiteAI}
									aiModels={aiModels || []}
									excludeId={blackAI}
								/>

								<AIModelSelect
									label="Black AI"
									value={blackAI}
									onChange={setBlackAI}
									aiModels={aiModels || []}
									excludeId={whiteAI}
								/>
							</>
						)}
					</TabsContent>

					<TabsContent value="random" className="space-y-4 mt-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Min ELO (Optional)</Label>
								<Input
									type="number"
									placeholder="e.g. 2200"
									value={minElo}
									onChange={(e) => setMinElo(e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Max ELO (Optional)</Label>
								<Input
									type="number"
									placeholder="e.g. 2600"
									value={maxElo}
									onChange={(e) => setMaxElo(e.target.value)}
								/>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<Separator className="my-4" />

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Match Type</Label>
						<RadioGroup
							value={matchType}
							onValueChange={(value) =>
								setMatchType(value as MatchType)
							}
							className="flex space-x-4"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="Regular" id="regular" />
								<Label htmlFor="regular">Regular</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="Tournament"
									id="tournament"
								/>
								<Label htmlFor="tournament">Tournament</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="Showcase"
									id="showcase"
								/>
								<Label htmlFor="showcase">Showcase</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Time Control</Label>
							<div className="flex items-center space-x-2">
								<Label
									htmlFor="custom-time"
									className="text-sm"
								>
									Custom
								</Label>
								<Switch
									id="custom-time"
									checked={customTimeControl}
									onCheckedChange={setCustomTimeControl}
								/>
							</div>
						</div>

						{customTimeControl ? (
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Minutes</Label>
									<Input
										type="number"
										value={minutes}
										onChange={(e) =>
											setMinutes(e.target.value)
										}
										min="1"
									/>
								</div>
								<div className="space-y-2">
									<Label>Increment (seconds)</Label>
									<Input
										type="number"
										value={increment}
										onChange={(e) =>
											setIncrement(e.target.value)
										}
										min="0"
									/>
								</div>
							</div>
						) : (
							<Select
								value={timeControl}
								onValueChange={setTimeControl}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select time control" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="5+0">
										5+0 (Blitz)
									</SelectItem>
									<SelectItem value="5+3">
										5+3 (Blitz)
									</SelectItem>
									<SelectItem value="10+0">
										10+0 (Rapid)
									</SelectItem>
									<SelectItem value="15+10">
										15+10 (Rapid)
									</SelectItem>
									<SelectItem value="30+0">
										30+0 (Classical)
									</SelectItem>
									<SelectItem value="30+20">
										30+20 (Classical)
									</SelectItem>
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="space-y-2">
						<Label>Start Time</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="w-full justify-start text-left font-normal"
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{startDate ? (
										format(startDate, "PPP HH:mm")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									mode="single"
									selected={startDate}
									onSelect={(date) =>
										date && setStartDate(date)
									}
									initialFocus
								/>
								<div className="p-3 border-t border-border">
									<Label>Time</Label>
									<Input
										type="time"
										value={format(startDate, "HH:mm")}
										onChange={(e) => {
											const [hours, minutes] =
												e.target.value.split(":");
											const newDate = new Date(startDate);
											newDate.setHours(parseInt(hours));
											newDate.setMinutes(
												parseInt(minutes)
											);
											setStartDate(newDate);
										}}
										className="mt-2"
									/>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="outline" onClick={resetForm}>
					Reset
				</Button>
				<Button
					onClick={handleCreateMatch}
					disabled={
						createMatchMutation.isPending ||
						createRandomMatchMutation.isPending
					}
				>
					{createMatchMutation.isPending ||
					createRandomMatchMutation.isPending
						? "Scheduling..."
						: "Schedule Match"}
				</Button>
			</CardFooter>
		</Card>
	);
}
