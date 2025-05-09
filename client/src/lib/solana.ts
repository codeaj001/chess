import { BetOutcome } from "./types";
import {
	Connection,
	clusterApiUrl,
	PublicKey,
	LAMPORTS_PER_SOL,
	Transaction,
	SystemProgram,
	sendAndConfirmTransaction,
	Keypair,
	SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

// Import Anchor and the IDL
import * as anchor from "@project-serum/anchor";
import { Program, AnchorProvider, Wallet } from "@project-serum/anchor";
import { AiChessBetting, IDL } from "./ai_chess_betting";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// Use Solana devnet for production
const SOLANA_NETWORK = "devnet";
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Platform wallet to receive bets (escrow)
// This will be replaced by the smart contract's treasury PDA
// This is kept as a placeholder but not used in the real implementation
const PLATFORM_WALLET = new PublicKey(
	"HbJe1S48WbRMUt5UjZkPJFSZrdJt6Z5cUUvQpHHbPTfJ"
);

// Configuration
const BET_CONFIRMATION_BLOCKS = 1; // Number of confirmations required for bet transactions

// ** Smart Contract Program Setup **
const programID = new PublicKey("6Q16ZnnAmWJFVYxmS6XoDaweit5SAB8dZKA6BF8BFcTD");

// Helper function to get the Anchor program
const getProgram = (wallet: Wallet) => {
	const provider = new AnchorProvider(connection, wallet, {
		commitment: "confirmed",
	});
	const program = new Program<AiChessBetting>(IDL, programID, provider);
	return program;
};

/**
 * Get the SOL balance for a wallet address
 */
export async function getWalletBalance(walletAddress: string): Promise<number> {
	try {
		// Try to use the real Solana Web3.js library if we have a valid address
		if (walletAddress && walletAddress.length >= 32) {
			try {
				const publicKey = new PublicKey(walletAddress);
				const balance = await connection.getBalance(publicKey);
				return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
			} catch (err) {
				console.error("Error getting real balance:", err);
				// Fall through to mock implementation if the address is invalid
			}
		}

		// Mock implementation as fallback
		return new Promise((resolve) => {
			setTimeout(() => {
				// Return a random balance between 0.5 and 10 SOL
				resolve(Math.round((0.5 + Math.random() * 9.5) * 100) / 100);
			}, 500);
		});
	} catch (error) {
		console.error("Balance check error:", error);
		throw error;
	}
}

/**
 * Request an airdrop of SOL to the specified wallet (devnet only)
 */
export async function airdropSol(walletAddress: string): Promise<string> {
	try {
		// Try to use the real Solana Web3.js library if we have a valid address
		if (walletAddress && walletAddress.length >= 32) {
			try {
				const publicKey = new PublicKey(walletAddress);
				const signature = await connection.requestAirdrop(
					publicKey,
					LAMPORTS_PER_SOL // Request 1 SOL
				);

				// Wait for confirmation
				await connection.confirmTransaction(signature);
				return signature;
			} catch (err) {
				console.error("Error requesting real airdrop:", err);
				// Fall through to mock implementation if there\'s an error
			}
		}

		// Mock implementation as fallback
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() > 0.1) {
					// 90% success rate
					resolve("MOCK_AIRDROP_SIGNATURE");
				} else {
					reject(
						new Error("Airdrop request failed. Please try again.")
					);
				}
			}, 1500);
		});
	} catch (error) {
		console.error("Airdrop error:", error);
		throw error;
	}
}

/**
 * Place a bet on a match outcome using Solana
 * @param matchId Match to bet on
 * @param outcome The outcome to bet on (White, Black, Draw)
 * @param amount Amount of SOL to bet
 * @param walletProvider Wallet provider with signing capabilities
 * @returns Transaction signature and status updates via callbacks
 */
export async function placeBet(
	matchId: number,
	outcome: BetOutcome,
	amount: number,
	walletProvider?: any,
	callbacks?: {
		onApprovalRequest?: () => void;
		onApproved?: () => void;
		onConfirming?: () => void;
		onError?: (error: Error) => void;
	}
): Promise<string> {
	try {
		// Validate parameters
		if (amount <= 0) {
			throw new Error("Bet amount must be greater than 0");
		}

		// Check if we have a real wallet provider
		let actualProvider = walletProvider;

		if (actualProvider?.publicKey || actualProvider?.provider?.publicKey) {
			try {
				const provider = actualProvider.provider?.publicKey
					? actualProvider.provider
					: actualProvider;

				// We need the wallet object for Anchor
				const wallet = actualProvider.wallet || actualProvider;

				const program = getProgram(wallet);

				console.log(
					`Placing real bet: ${amount} SOL on ${outcome} for match ${matchId}`
				);
				console.log("Using provider:", provider);

				// Notify that we\'re requesting approval
				callbacks?.onApprovalRequest?.();

				// Convert amount to lamports and to Anchor's BN
				const lamports = new anchor.BN(amount * LAMPORTS_PER_SOL);

				// ** Call the placeBet instruction on the smart contract **
				// Derive necessary PDAs and provide them in the accounts

				const [programStatePDA] = await PublicKey.findProgramAddress(
					[Buffer.from("program_state")],
					program.programId
				);

				const [chessMatchPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("chess_match"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming bet account is a PDA derived from bettor and match ID
				const [betPDA] = await PublicKey.findProgramAddress(
					[
						Buffer.from("bet"),
						provider.publicKey.toBuffer(),
						Buffer.from(matchId.toString()),
					],
					program.programId
				);

				// Assuming match treasury is a PDA derived from match ID
				const [matchTreasuryPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("match_treasury"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming token mint is a constant in your smart contract or passed during initialization
				// You'll need to replace this with the actual token mint PublicKey
				const tokenMintAddress = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE"); // <<-- REPLACE WITH YOUR TOKEN MINT PUBLIC KEY

				// Get the bettor's associated token account
				const bettorTokenAccount = await getAssociatedTokenAddress(
					tokenMintAddress,
					provider.publicKey
				);

				const signature = await program.methods
					.placeBet(lamports, outcome) // Pass lamports as BN and outcome
					.accounts({
						programState: programStatePDA,
						chessMatch: chessMatchPDA,
						bet: betPDA,
						matchTreasury: matchTreasuryPDA,
						bettor: provider.publicKey,
						bettorTokenAccount: bettorTokenAccount,
						tokenMint: tokenMintAddress,
						systemProgram: SystemProgram.programId,
						tokenProgram: TOKEN_PROGRAM_ID,
						rent: SYSVAR_RENT_PUBKEY,
					})
					.rpc(); // Send the transaction

				console.log(`Bet placed successfully: ${signature}`);
				callbacks?.onApproved?.(); // Assuming approval happens before sending transaction
				callbacks?.onConfirming?.(); // Confirmation starts after sending
				// Wait for confirmation (optional, depends on desired user experience)
				await connection.confirmTransaction(signature); // Wait for confirmation

				return signature;

			} catch (error) {
				console.error("Error placing real bet:", error);

				// Handle specific Anchor errors or other transaction errors
				callbacks?.onError?.(error as Error);

				// Rethrow the error so the calling code can handle it if needed
				throw error;
			}
		}

		// Mock implementation for development or when real transaction fails
		console.log("No valid wallet provider found or real transaction failed, using mock implementation");
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				// Simulate 90% success rate for easier testing
				if (Math.random() > 0.1) {
					const mockTxId =
						"TX" +
						Math.random().toString(36).substring(2, 15) +
						Math.random().toString(36).substring(2, 15);
					resolve(mockTxId);
				} else {
					reject(new Error("Transaction failed. Please try again."));
				}
			}, 1500);
		});
	} catch (error) {
		console.error("Error placing bet:", error);
		// Ensure onError is called for outer catch block as well
		callbacks?.onError?.(error as Error);
		throw error;
	}
}

/**
 * Claim winnings from a winning bet
 * @param betId ID of the bet to claim (will be the bet account address/PDA)
 * @param walletProvider Wallet provider with signing capabilities
 * @returns Transaction signature
 */
export async function claimWinnings(
	betId: string, // This should be the bet account address/PDA string
	betAmount: number = 0, // Bet amount might not be needed if retrieved from bet account
	walletProvider?: any
): Promise<string> {
	try {
		// Check if we have a real wallet provider
		if (
			walletProvider?.publicKey &&
			walletProvider?.signTransaction // Ensure signTransaction is available
		) {
			try {
				const provider = walletProvider.provider?.publicKey
					? walletProvider.provider
					: walletProvider;

				const wallet = walletProvider.wallet || walletProvider;

				const program = getProgram(wallet);

				console.log(`Claiming real winnings for bet ${betId}`);

				// ** Call the claimWinnings instruction on the smart contract **
				// Derive necessary PDAs and provide them in the accounts

				const [programStatePDA] = await PublicKey.findProgramAddress(
					[Buffer.from("program_state")],
					program.programId
				);

				const betAccount = new PublicKey(betId); // Assuming betId is the bet account address/PDA

				// To derive chessMatchPDA and matchTreasuryPDA, we need the matchId from the bet account.
				// This requires fetching the bet account data first.
				const betData = await program.account.bet.fetch(betAccount);
				const matchId = betData.matchId;

				const [chessMatchPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("chess_match"), Buffer.from(matchId.toString())],
					program.programId
				);

				const [matchTreasuryPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("match_treasury"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming token mint is the same as used in placeBet
				const tokenMintAddress = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE"); // <<-- REPLACE WITH YOUR TOKEN MINT PUBLIC KEY

				// Get the bettor's associated token account
				const bettorTokenAccount = await getAssociatedTokenAddress(
					tokenMintAddress,
					provider.publicKey
				);

				const signature = await program.methods
					.claimWinnings()
					.accounts({
						programState: programStatePDA,
						chessMatch: chessMatchPDA,
						bet: betAccount,
						matchTreasury: matchTreasuryPDA,
						bettor: provider.publicKey,
						bettorTokenAccount: bettorTokenAccount,
						tokenMint: tokenMintAddress,
						tokenProgram: TOKEN_PROGRAM_ID,
					})
					.rpc(); // Send the transaction

				console.log(`Winnings claimed successfully: ${signature}`);
				await connection.confirmTransaction(signature); // Wait for confirmation
				return signature;

			} catch (error) {
				console.error("Error claiming real winnings:", error);
				// Handle specific Anchor errors or other transaction errors
				// For user rejection, you might want to handle it specifically as before
				callbacks?.onError?.(error as Error);
				throw error;
			}
		}

		// Mock implementation for development or when real transaction fails
		console.log("No valid wallet provider found or real transaction failed, using mock implementation");
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				// Simulate 90% success rate
				if (Math.random() > 0.1) {
					const mockTxId =
						"CLAIM" +
						Math.random().toString(36).substring(2, 15) +
						Math.random().toString(36).substring(2, 15);
					resolve(mockTxId);
				} else {
					reject(
						new Error("Failed to claim winnings. Please try again.")
					);
				}
			}, 1200);
		});

	} catch (error) {
		console.error("Error claiming winnings:", error);
		// Ensure onError is called for outer catch block as well
		callbacks?.onError?.(error as Error);
		throw error;
	}
}

// You may also need to add functions for fetching data from the smart contract,
// such as getting match details, bet information, etc.
import { BetOutcome } from "./types";
import {
	Connection,
	clusterApiUrl,
	PublicKey,
	LAMPORTS_PER_SOL,
	Transaction,
	SystemProgram,
	sendAndConfirmTransaction,
	Keypair,
	SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

// Import Anchor and the IDL
import * as anchor from "@project-serum/anchor";
import { Program, AnchorProvider, Wallet } from "@project-serum/anchor";
import { AiChessBetting, IDL } from "./ai_chess_betting";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

// Use Solana devnet for production
const SOLANA_NETWORK = "devnet";
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Platform wallet to receive bets (escrow) - This will be replaced by the smart contract's treasury PDA
// In a real implementation, this would be a program-derived address
const PLATFORM_WALLET = new PublicKey(
	"HbJe1S48WbRMUt5UjZkPJFSZrdJt6Z5cUUvQpHHbPTfJ"
);

// Configuration
const BET_CONFIRMATION_BLOCKS = 1; // Number of confirmations required for bet transactions

// ** Smart Contract Program Setup **
const programID = new PublicKey("6Q16ZnnAmWJFVYxmS6XoDaweit5SAB8dZKA6BF8BFcTD");

// Helper function to get the Anchor program
const getProgram = (wallet: Wallet) => {
	const provider = new AnchorProvider(connection, wallet, {
		commitment: "confirmed",
	});
	return new Program<AiChessBetting>(IDL, programID, provider);
};
/**
 * Get the SOL balance for a wallet address
 */
export async function getWalletBalance(walletAddress: string): Promise<number> {
	try {
		// Try to use the real Solana Web3.js library if we have a valid address
		if (walletAddress && walletAddress.length >= 32) {
			try {
				const publicKey = new PublicKey(walletAddress);
				const balance = await connection.getBalance(publicKey);
				return balance / LAMPORTS_PER_SOL; // Convert lamports to SOL
			} catch (err) {
				console.error("Error getting real balance:", err);
				// Fall through to mock implementation if the address is invalid
			}
		}

		// Mock implementation as fallback
		return new Promise((resolve) => {
			setTimeout(() => {
				// Return a random balance between 0.5 and 10 SOL
				resolve(Math.round((0.5 + Math.random() * 9.5) * 100) / 100);
			}, 500);
		});
	} catch (error) {
		console.error("Balance check error:", error);
		throw error;
	}
}

/**
 * Request an airdrop of SOL to the specified wallet (devnet only)
 */
export async function airdropSol(walletAddress: string): Promise<string> {
	try {
		// Try to use the real Solana Web3.js library if we have a valid address
		if (walletAddress && walletAddress.length >= 32) {
			try {
				const publicKey = new PublicKey(walletAddress);
				const signature = await connection.requestAirdrop(
					publicKey,
					LAMPORTS_PER_SOL // Request 1 SOL
				);

				// Wait for confirmation
				await connection.confirmTransaction(signature);
				return signature;
			} catch (err) {
				console.error("Error requesting real airdrop:", err);
				// Fall through to mock implementation if there's an error
			}
		}

		// Mock implementation as fallback
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if (Math.random() > 0.1) {
					// 90% success rate
					resolve("MOCK_AIRDROP_SIGNATURE");
				} else {
					reject(
						new Error("Airdrop request failed. Please try again.")
					);
				}
			}, 1500);
		});
	} catch (error) {
		console.error("Airdrop error:", error);
		throw error;
	}
}

/**
 * Place a bet on a match outcome using Solana
 * @param matchId Match to bet on
 * @param outcome The outcome to bet on (White, Black, Draw)
 * @param amount Amount of SOL to bet
 * @param walletProvider Wallet provider with signing capabilities
 * @returns Transaction signature and status updates via callbacks
 */
export async function placeBet(
	matchId: number,
	outcome: BetOutcome,
	amount: number,
	walletProvider?: any,
	callbacks?: {
		onApprovalRequest?: () => void;
		onApproved?: () => void;
		onConfirming?: () => void;
		onError?: (error: Error) => void;
	}
): Promise<string> {
	try {
		// Validate parameters
		if (amount <= 0) {
			throw new Error("Bet amount must be greater than 0");
		}

		// Log wallet provider details for debugging
		console.log("Wallet provider:", walletProvider);
		console.log("Wallet provider type:", typeof walletProvider);
		if (walletProvider) {
			console.log("Wallet provider keys:", Object.keys(walletProvider));
			console.log(
				"Wallet provider has publicKey:",
				!!walletProvider.publicKey
			);
			console.log(
				"Wallet provider has signTransaction:",
				!!walletProvider.signTransaction
			);
			console.log(
				"Wallet provider has provider:",
				!!walletProvider.provider
			);
		}

		// Check if we have a real wallet provider
		// First try direct access
		let actualProvider = walletProvider;

		// If the wallet provider has a nested provider property, use that instead
		if (walletProvider?.provider && !walletProvider.signTransaction) {
			actualProvider = walletProvider.provider;
			console.log("Using nested provider:", actualProvider);
		}

		if (actualProvider?.publicKey || actualProvider?.provider?.publicKey) {
			try {
				// Ensure we have the correct provider object
				const provider = actualProvider.provider?.publicKey
					? actualProvider.provider
					: actualProvider;

				console.log(
					`Placing real bet: ${amount} SOL on ${outcome} for match ${matchId}`
				);
				console.log("Using provider:", provider);

				// Notify that we're requesting approval
				callbacks?.onApprovalRequest?.();

				// Convert amount to lamports (SOL's smallest unit)
				const lamports = amount * LAMPORTS_PER_SOL;

				// We need the wallet object for Anchor
				// Assuming the walletProvider has a 'wallet' property or is the wallet object itself
				const wallet = actualProvider.wallet || actualProvider;

				const program = getProgram(wallet);

				console.log(
					`Placing real bet: ${amount} SOL on ${outcome} for match ${matchId}`
				);
				console.log("Using provider:", provider);

				// Notify that we're requesting approval
				callbacks?.onApprovalRequest?.();

				// Convert amount to lamports
				const lamportsBN = new anchor.BN(lamports);

				// ** Call the placeBet instruction on the smart contract **
				// Derive necessary PDAs and provide them in the accounts

				const [programStatePDA] = await PublicKey.findProgramAddress(
					[Buffer.from("program_state")],
					program.programId
				);

				const [chessMatchPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("chess_match"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming bet account is a PDA derived from bettor and match ID
				const [betPDA] = await PublicKey.findProgramAddress(
					[
						Buffer.from("bet"),
						provider.publicKey.toBuffer(),
						Buffer.from(matchId.toString()),
					],
					program.programId
				);

				// Assuming match treasury is a PDA derived from match ID
				const [matchTreasuryPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("match_treasury"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming token mint is a constant in your smart contract or passed during initialization
				// You'll need to replace this with the actual token mint PublicKey
				const tokenMintAddress = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE");

				// Get the bettor's token account
				// This assumes the bettor has an associated token account for the token mint
				// You might need to use @solana/spl-token to find or create this account
				const bettorTokenAccount = await getAssociatedTokenAddress(
					tokenMintAddress,
					provider.publicKey
				);

				const signature = await program.methods
					.placeBet(lamportsBN, outcome) // Pass lamports as BN
					.accounts({
						programState: programStatePDA,
						chessMatch: chessMatchPDA,
						bet: betPDA,
						matchTreasury: matchTreasuryPDA,
						bettor: provider.publicKey,
						bettorTokenAccount: bettorTokenAccount,
						tokenMint: tokenMintAddress,
						systemProgram: SystemProgram.programId,
						tokenProgram: TOKEN_PROGRAM_ID,
						rent: SYSVAR_RENT_PUBKEY,
					})
					.rpc(); // Send the transaction

				// Notify that the transaction was approved
				callbacks?.onApproved?.(); // Approval happens before sending transaction

				// Send the transaction to the network
				// Notify that we're confirming the transaction
				callbacks?.onConfirming?.();

				// Wait for confirmation
				// You can uncomment this if you want to wait for confirmation here
				// console.log("Waiting for confirmation...");
				// await connection.confirmTransaction(signature);

				console.log(`Bet placed successfully: ${signature}`);
				return signature;
			} catch (error) {
				console.error("Error placing real bet:", error);

				// If it's a user rejection, throw that specific error
				if (
					error instanceof Error &&
					(error.message.includes("User rejected") ||
						error.message.includes("Transaction cancelled") ||
						error.message.includes("User denied") ||
						error.message.includes("declined") ||
						error.message.includes("cancel"))
				) {
					const userRejectionError = new Error(
						"Transaction rejected by user"
					);
					callbacks?.onError?.(userRejectionError);
					throw userRejectionError;
				}

				// For other errors, notify via callback
				if (error instanceof Error) {
					callbacks?.onError?.(error);
				}

				// For other errors, fall through to mock implementation
				console.log("Falling back to mock implementation");
			}
		} else {
			console.log(
				"No valid wallet provider found, using mock implementation"
			);
		});
	} catch (error) {
		console.error("Error placing bet:", error);
		throw error;
	}
}

/**
 * Claim winnings from a winning bet
 * @param betId ID of the bet to claim
 * @param walletProvider Wallet provider with signing capabilities
 * @returns Transaction signature
 */
export async function claimWinnings(
	betId: string,
	betAmount: number = 0,
	walletProvider?: any
	// Add callbacks similar to placeBet if needed for UI updates
	// callbacks?: { ... }
): Promise<string> {
	try {
		// Check if we have a real wallet provider
		if (
			walletProvider?.publicKey &&
			walletProvider?.signTransaction // Ensure signTransaction is available
		) {
			try {
				const provider = walletProvider.provider?.publicKey
					? walletProvider.provider
					: walletProvider;

				const wallet = walletProvider.wallet || walletProvider;

				const program = getProgram(wallet);

				console.log(`Claiming real winnings for bet ${betId}`);

				// ** Call the claimWinnings instruction on the smart contract **
				// Derive necessary PDAs and provide them in the accounts

				const [programStatePDA] = await PublicKey.findProgramAddress(
					[Buffer.from("program_state")],
					program.programId
				);

				const betAccount = new PublicKey(betId); // Assuming betId is the bet account address/PDA

				// To derive chessMatchPDA and matchTreasuryPDA, we need the matchId from the bet account.
				// This requires fetching the bet account data first.
				const betData = await program.account.bet.fetch(betAccount);
				const matchId = betData.matchId;

				const [chessMatchPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("chess_match"), Buffer.from(matchId.toString())],
					program.programId
				);

				const [matchTreasuryPDA] = await PublicKey.findProgramAddress(
					[Buffer.from("match_treasury"), Buffer.from(matchId.toString())],
					program.programId
				);

				// Assuming token mint is the same as used in placeBet
				const tokenMintAddress = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE");

				// Get the bettor's token account
				const bettorTokenAccount = await getAssociatedTokenAddress(
					tokenMintAddress,
					provider.publicKey
				);

				const signature = await program.methods
					.claimWinnings()
					.accounts({
						programState: programStatePDA,
						chessMatch: chessMatchPDA,
						bet: betAccount,
						matchTreasury: matchTreasuryPDA,
						bettor: provider.publicKey,
						bettorTokenAccount: bettorTokenAccount,
						tokenMint: tokenMintAddress,
						tokenProgram: TOKEN_PROGRAM_ID,
					})
					.rpc(); // Send the transaction

				console.log(`Winnings claimed successfully: ${signature}`);
				return signature;
			} catch (error) {
				console.error("Error claiming real winnings:", error);

				// If it's a user rejection, throw that specific error
				if (
					error instanceof Error &&
					(error.message.includes("User rejected") ||
						error.message.includes("Transaction cancelled") ||
						error.message.includes("User denied") ||
						error.message.includes("declined") ||
						error.message.includes("cancel"))
				) {
					throw new Error("Transaction rejected by user");
				}
				// For other errors, fall through to mock implementation
				console.log("Falling back to mock implementation"); // This fallback is now to the outer mock
			} catch (innerError) {
				console.error("Inner Error claiming winnings:", innerError);
				// Handle specific Anchor errors or other transaction errors
				// For user rejection, you might want to handle it specifically as before
				// callbacks?.onError?.(innerError as Error);
				throw innerError; // Re-throw to be caught by the outer catch and fall back to mock
			}
		}
	} catch (error) {
		console.error("Error claiming winnings:", error);
		throw error;
	}
}

// Helper function to get or create the associated token account
// You'll need to import this from @solana/spl-token
// import { getAssociatedTokenAddress } from "@solana/spl-token"; // Already imported

// You may also need to add functions for fetching data from the smart contract,
// such as getting match details, bet information, etc.
// Example:
// export async function getMatchDetails(matchId: number): Promise<ChessMatch> {
//   const program = getProgram(/* pass a dummy wallet if not signed */); // Or require wallet if fetching user-specific data
//   const [chessMatchPDA] = await PublicKey.findProgramAddress(
//     [Buffer.from("chess_match"), Buffer.from(matchId.toString())],
//     program.programId
//   );
//   const matchData = await program.account.chessMatch.fetch(chessMatchPDA);
//   return matchData;
// }