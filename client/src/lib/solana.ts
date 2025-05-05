import { BetOutcome } from "./types";
import { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Use Solana devnet for development and testing
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

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
        if (Math.random() > 0.1) { // 90% success rate
          resolve("MOCK_AIRDROP_SIGNATURE");
        } else {
          reject(new Error("Airdrop request failed. Please try again."));
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
 * @returns Transaction signature
 */
export async function placeBet(
  matchId: number, 
  outcome: BetOutcome, 
  amount: number,
  walletAddress?: string
): Promise<string> {
  try {
    // If a real Solana wallet is connected, we could:
    // 1. Create a bet account on Solana
    // 2. Transfer SOL from user wallet to bet account
    // 3. Associate the bet with match data
    
    // For now, we'll use the mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          const mockTxId = "TX" + Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
          resolve(mockTxId);
        } else {
          reject(new Error("Transaction failed. Please try again."));
        }
      }, 1500);
    });
  } catch (error) {
    console.error("Error placing bet:", error);
    throw error;
  }
}

/**
 * Claim winnings from a winning bet
 * @param betId ID of the bet to claim
 * @returns Transaction signature
 */
export async function claimWinnings(betId: string, walletAddress?: string): Promise<string> {
  try {
    // If a real Solana wallet is connected, we could:
    // 1. Verify the bet outcome on-chain
    // 2. Transfer winning amount from bet account to user wallet
    
    // For now, we'll use the mock implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          const mockTxId = "CLAIM" + Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);
          resolve(mockTxId);
        } else {
          reject(new Error("Failed to claim winnings. Please try again."));
        }
      }, 1200);
    });
  } catch (error) {
    console.error("Error claiming winnings:", error);
    throw error;
  }
}
