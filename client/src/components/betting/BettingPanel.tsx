import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { useChessMatch } from "@/hooks/useChessMatch";
import { Match, BetOutcome } from "@/lib/types";
import { placeBet, airdropSol } from "@/lib/solana";
import {
	sendSolanaTransaction,
	isValidWalletProvider,
} from "@/lib/direct-wallet";
import {
	AlertTriangle,
	Info,
	Wallet,
	CheckCircle2,
	Loader2,
} from "lucide-react";

interface BettingPanelProps {
	match: Match;
}

export function BettingPanel({ match }: BettingPanelProps) {
	const { toast } = useToast();
	const {
		connected,
		walletAddress,
		walletProvider,
		refreshBalance,
		network,
	} = useSolanaWallet();
	const { betPools, isMatchLocked } = useChessMatch(match.id);

	const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome | null>(
		null
	);
	const [betAmount, setBetAmount] = useState<string>("0.5");
	const [isPlacingBet, setIsPlacingBet] = useState(false);
	const [isAirdropping, setIsAirdropping] = useState(false);

	// Transaction status states
	const [transactionStatus, setTransactionStatus] = useState<
		"idle" | "approval" | "approved" | "confirming" | "success" | "error"
	>("idle");
	const [transactionError, setTransactionError] = useState<string | null>(
		null
	);

	const betAmountNumber = parseFloat(betAmount);

	const handleQuickAmount = (amount: number) => {
		setBetAmount(amount.toString());
	};

	const calculatePotentialWin = () => {
		if (
			!selectedOutcome ||
			!betPools ||
			isNaN(betAmountNumber) ||
			betAmountNumber <= 0
		) {
			return 0;
		}

		// Calculate the total pool including the current bet
		const poolTotal =
			betPools.white + betPools.black + betPools.draw + betAmountNumber;

		// Calculate the selected outcome pool including the current bet
		let selectedPool = 0;
		if (selectedOutcome === "White") {
			selectedPool = betPools.white + betAmountNumber;
		} else if (selectedOutcome === "Black") {
			selectedPool = betPools.black + betAmountNumber;
		} else {
			selectedPool = betPools.draw + betAmountNumber;
		}

		// Calculate payout ratio (total pool / selected outcome pool)
		// Apply a 5% platform fee
		const payoutRatio = (poolTotal / selectedPool) * 0.95;

		// Calculate potential winnings
		return betAmountNumber * payoutRatio;
	};

	const handlePlaceBet = async () => {
		// Reset transaction status
		setTransactionStatus("idle");
		setTransactionError(null);

		if (!connected || !walletAddress) {
			toast({
				title: "Wallet not connected",
				description: "Please connect your wallet to place a bet",
				variant: "destructive",
			});
			return;
		}

		if (!selectedOutcome) {
			toast({
				title: "No outcome selected",
				description: "Please select White, Black, or Draw",
				variant: "destructive",
			});
			return;
		}

		if (isNaN(betAmountNumber) || betAmountNumber <= 0) {
			toast({
				title: "Invalid bet amount",
				description: "Please enter a valid amount greater than 0",
				variant: "destructive",
			});
			return;
		}

		if (isMatchLocked) {
			toast({
				title: "Betting closed",
				description: "Betting is no longer available for this match",
				variant: "destructive",
			});
			return;
		}

		// Check if wallet provider is valid
		if (!isValidWalletProvider(walletProvider)) {
			toast({
				title: "Wallet not compatible",
				description:
					"Your wallet doesn't support the required transaction methods. Please try a different wallet.",
				variant: "destructive",
			});
			return;
		}

		setIsPlacingBet(true);
		setTransactionStatus("approval");

		// Show toast immediately to indicate user should check their wallet
		toast({
			title: "Approval Required",
			description: "Please check your wallet to approve the transaction",
		});

		try {
			// Use direct wallet transaction approach
			const signature = await sendSolanaTransaction(
				betAmountNumber,
				walletProvider,
				{
					onStart: () => {
						setTransactionStatus("approval");
						console.log(
							"Transaction started, waiting for approval..."
						);
					},
					onApproval: () => {
						setTransactionStatus("approved");
						toast({
							title: "Transaction Approved",
							description: "Your transaction is being processed",
						});
						console.log("Transaction approved by user");
					},
					onSent: (txSignature) => {
						setTransactionStatus("confirming");
						toast({
							title: "Transaction Sent",
							description: "Waiting for blockchain confirmation",
						});
						console.log(
							"Transaction sent to network:",
							txSignature
						);
					},
					onConfirmed: (txSignature) => {
						setTransactionStatus("success");
						console.log("Transaction confirmed:", txSignature);
					},
					onError: (error) => {
						setTransactionStatus("error");
						setTransactionError(error.message);
						console.error("Transaction error:", error);
					},
				}
			);

			// If we get here, the transaction was successful
			console.log("Transaction completed successfully:", signature);

			// Now record the bet in our system
			try {
				// Call the API to record the bet in our system
				await fetch(`/api/bets`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						match_id: match.id,
						wallet_address: walletAddress,
						amount: betAmountNumber,
						outcome: selectedOutcome,
						transaction_signature: signature,
					}),
				});

				// Calculate potential payout
				const potentialPayout = calculatePotentialWin();

				toast({
					title: "Bet placed successfully",
					description: `You bet ${betAmountNumber} SOL on ${selectedOutcome}`,
				});

				// Show potential payout in a separate toast
				toast({
					title: "Potential Payout",
					description: `If ${selectedOutcome} wins, you'll receive approximately ${potentialPayout.toFixed(
						2
					)} SOL`,
				});

				// Refresh balance after placing bet
				await refreshBalance();

				// Refresh bet pools
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			} catch (apiError) {
				console.error("Error recording bet:", apiError);
				toast({
					title: "Transaction succeeded but failed to record bet",
					description:
						"Your funds were transferred, but there was an error recording your bet. Please contact support.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Error placing bet:", error);

			// Only show toast if we haven't already set an error status
			if (transactionStatus !== "error") {
				setTransactionStatus("error");
				setTransactionError(
					error instanceof Error
						? error.message
						: "Unknown error occurred"
				);
			}

			toast({
				title: "Failed to place bet",
				description:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				variant: "destructive",
			});
		} finally {
			// Keep isPlacingBet true if we're still in the approval process
			// This prevents multiple clicks while waiting for wallet approval
			if (transactionStatus !== "approval") {
				setIsPlacingBet(false);
			}

			// Reset transaction status after 5 seconds if it's in error state
			if (transactionStatus === "error") {
				setTimeout(() => {
					setIsPlacingBet(false);
					setTransactionStatus("idle");
					setTransactionError(null);
				}, 5000);
			}
		}
	};

	const handleAirdrop = async () => {
		if (!connected || !walletAddress) {
			toast({
				title: "Wallet not connected",
				description: "Please connect your wallet first",
				variant: "destructive",
			});
			return;
		}

		setIsAirdropping(true);

		try {
			await airdropSol(walletAddress);
			toast({
				title: "Airdrop successful",
				description:
					"1 SOL has been airdropped to your wallet (Devnet)",
			});

			// Refresh balance
			await refreshBalance();
		} catch (error) {
			console.error("Airdrop error:", error);
			toast({
				title: "Airdrop failed",
				description:
					error instanceof Error
						? error.message
						: "Unknown error occurred",
				variant: "destructive",
			});
		} finally {
			setIsAirdropping(false);
		}
	};

	const potentialWin = calculatePotentialWin();

	return (
		<div className="space-y-6">
			{/* Betting Card */}
			<div className="glassmorphism rounded-xl p-4">
				<h2 className="text-lg font-semibold mb-4">Place Your Bet</h2>

				{/* Outcome selection */}
				<div className="grid grid-cols-3 gap-3 mb-4">
					<button
						className={`bg-white/10 hover:bg-white/15 transition py-3 px-2 rounded-lg flex flex-col items-center justify-center border ${
							selectedOutcome === "White"
								? "border-accent"
								: "border-transparent"
						}`}
						onClick={() => setSelectedOutcome("White")}
						disabled={isMatchLocked}
					>
						<div className="w-6 h-6 bg-white rounded-full mb-1 flex items-center justify-center text-black text-xs font-bold">
							W
						</div>
						<span className="text-sm">White</span>
						<span className="text-xs text-gray-400">
							{betPools
								? `${(
										(betPools.black + betPools.draw) /
										betPools.white
								  ).toFixed(1)}x`
								: "0.0x"}
						</span>
					</button>

					<button
						className={`bg-white/10 hover:bg-white/15 transition py-3 px-2 rounded-lg flex flex-col items-center justify-center border ${
							selectedOutcome === "Draw"
								? "border-accent"
								: "border-transparent"
						}`}
						onClick={() => setSelectedOutcome("Draw")}
						disabled={isMatchLocked}
					>
						<div className="w-6 h-6 bg-gray-500 rounded-full mb-1 flex items-center justify-center text-xs font-bold">
							D
						</div>
						<span className="text-sm">Draw</span>
						<span className="text-xs text-gray-400">
							{betPools
								? `${(
										(betPools.white + betPools.black) /
										betPools.draw
								  ).toFixed(1)}x`
								: "0.0x"}
						</span>
					</button>

					<button
						className={`bg-white/10 hover:bg-white/15 transition py-3 px-2 rounded-lg flex flex-col items-center justify-center border ${
							selectedOutcome === "Black"
								? "border-accent"
								: "border-transparent"
						}`}
						onClick={() => setSelectedOutcome("Black")}
						disabled={isMatchLocked}
					>
						<div className="w-6 h-6 bg-gray-800 rounded-full mb-1 flex items-center justify-center text-white text-xs font-bold">
							B
						</div>
						<span className="text-sm">Black</span>
						<span className="text-xs text-gray-400">
							{betPools
								? `${(
										(betPools.white + betPools.draw) /
										betPools.black
								  ).toFixed(1)}x`
								: "0.0x"}
						</span>
					</button>
				</div>

				{/* Amount input */}
				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">
						Bet Amount (SOL)
					</label>
					<div className="relative">
						<Input
							type="number"
							className="w-full bg-white/5 border border-white/10 focus:border-accent"
							placeholder="0.00"
							min="0"
							step="0.01"
							value={betAmount}
							onChange={(e) => setBetAmount(e.target.value)}
							disabled={isMatchLocked}
						/>
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">
							SOL
						</div>
					</div>
				</div>

				{/* Quick amount buttons */}
				<div className="grid grid-cols-4 gap-2 mb-4">
					<Button
						variant="ghost"
						className="bg-white/10 hover:bg-white/15 transition py-1"
						onClick={() => handleQuickAmount(0.1)}
						disabled={isMatchLocked}
					>
						0.1
					</Button>
					<Button
						variant="ghost"
						className="bg-white/10 hover:bg-white/15 transition py-1"
						onClick={() => handleQuickAmount(0.5)}
						disabled={isMatchLocked}
					>
						0.5
					</Button>
					<Button
						variant="ghost"
						className={`${
							betAmount === "1.0"
								? "bg-accent/20 hover:bg-accent/30"
								: "bg-white/10 hover:bg-white/15"
						} transition py-1`}
						onClick={() => handleQuickAmount(1.0)}
						disabled={isMatchLocked}
					>
						1.0
					</Button>
					<Button
						variant="ghost"
						className="bg-white/10 hover:bg-white/15 transition py-1"
						onClick={() => handleQuickAmount(5.0)}
						disabled={isMatchLocked}
					>
						5.0
					</Button>
				</div>

				{/* Bet details */}
				<div className="bg-white/5 rounded-lg p-3 mb-4">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm text-gray-300">
							Potential Win
						</span>
						<span className="text-sm font-medium">
							{potentialWin.toFixed(2)} SOL
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm text-gray-300">
							Betting Pool
						</span>
						<span className="text-sm font-medium">
							{betPools
								? (
										betPools.white +
										betPools.black +
										betPools.draw
								  ).toFixed(2)
								: "0.00"}{" "}
							SOL
						</span>
					</div>
				</div>

				{/* Place bet button */}
				<Button
					className="w-full bg-accent hover:bg-accent/90 transition"
					onClick={handlePlaceBet}
					disabled={!connected || isPlacingBet || isMatchLocked}
				>
					{transactionStatus === "idle" &&
						!isPlacingBet &&
						"Place Bet"}
					{transactionStatus === "approval" && (
						<>
							<Wallet className="mr-2 h-4 w-4 animate-pulse" />
							Approve in Wallet
						</>
					)}
					{transactionStatus === "approved" && (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing Transaction
						</>
					)}
					{transactionStatus === "confirming" && (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Confirming on Blockchain
						</>
					)}
					{transactionStatus === "success" && (
						<>
							<CheckCircle2 className="mr-2 h-4 w-4" />
							Bet Placed Successfully
						</>
					)}
					{transactionStatus === "error" && "Try Again"}
					{isPlacingBet &&
						transactionStatus === "idle" &&
						"Processing..."}
				</Button>

				{/* Transaction error message */}
				{transactionStatus === "error" && transactionError && (
					<div className="mt-4 bg-red-500/10 text-red-300 rounded-lg p-3 text-sm flex items-start">
						<AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
						<span>
							{transactionError.includes("rejected") ||
							transactionError.includes("cancelled") ||
							transactionError.includes("denied")
								? "Transaction was rejected. Please try again."
								: transactionError}
						</span>
					</div>
				)}

				{/* Wallet not connected warning */}
				{!connected && (
					<div className="mt-4 bg-yellow-500/10 text-yellow-300 rounded-lg p-3 text-sm flex items-start">
						<AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
						<span>
							Connect your wallet to place bets and claim
							winnings.
						</span>
					</div>
				)}

				{isMatchLocked && (
					<div className="mt-4 bg-blue-500/10 text-blue-300 rounded-lg p-3 text-sm flex items-start">
						<AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
						<span>Betting is closed for this match.</span>
					</div>
				)}
			</div>

			{/* Dev Tools */}
			<div className="glassmorphism rounded-xl p-4">
				<h2 className="text-lg font-semibold mb-4">Devnet Tools</h2>

				{/* Airdrop button */}
				<Button
					className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transition"
					onClick={handleAirdrop}
					disabled={!connected || isAirdropping}
				>
					{isAirdropping ? "Processing..." : "Airdrop 1 SOL (Devnet)"}
				</Button>

				{/* Debug button */}
				<Button
					className="w-full mt-2 bg-gray-700 hover:bg-gray-600 transition"
					onClick={() => {
						console.log("Wallet connection status:", connected);
						console.log("Wallet address:", walletAddress);
						console.log("Wallet provider:", walletProvider);
						if (walletProvider) {
							console.log(
								"Wallet provider keys:",
								Object.keys(walletProvider)
							);
							console.log(
								"Wallet provider has publicKey:",
								!!walletProvider.publicKey
							);
							console.log(
								"Wallet provider has signTransaction:",
								!!walletProvider.signTransaction
							);
						}
						toast({
							title: "Wallet Debug Info",
							description:
								"Check browser console for wallet details",
						});
					}}
					disabled={!connected}
				>
					Debug Wallet Connection
				</Button>

				{/* Direct transaction test button */}
				<Button
					className="w-full mt-2 bg-blue-700 hover:bg-blue-600 transition"
					onClick={async () => {
						if (!connected || !walletProvider) {
							toast({
								title: "Wallet not connected",
								description: "Please connect your wallet first",
								variant: "destructive",
							});
							return;
						}

						toast({
							title: "Testing Direct Transaction",
							description:
								"Requesting wallet approval for a small transaction",
						});

						try {
							// Test with a very small amount (0.001 SOL)
							const signature = await sendSolanaTransaction(
								0.001,
								walletProvider,
								{
									onStart: () =>
										console.log("Test transaction started"),
									onApproval: () =>
										console.log(
											"Test transaction approved"
										),
									onSent: (sig) =>
										console.log(
											"Test transaction sent:",
											sig
										),
									onConfirmed: (sig) => {
										console.log(
											"Test transaction confirmed:",
											sig
										);
										toast({
											title: "Transaction Successful",
											description:
												"Your wallet is working correctly!",
										});
									},
									onError: (err) => {
										console.error(
											"Test transaction error:",
											err
										);
										toast({
											title: "Transaction Failed",
											description: err.message,
											variant: "destructive",
										});
									},
								}
							);
						} catch (error) {
							console.error("Test transaction error:", error);
						}
					}}
					disabled={!connected}
				>
					Test Direct Transaction
				</Button>

				<div className="text-xs text-gray-400 mt-4">
					Note: This is a development environment. SOL tokens have no
					real value and are only for testing purposes.
				</div>
			</div>
		</div>
	);
}
