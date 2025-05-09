import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  clusterApiUrl
} from '@solana/web3.js';

// Use Solana devnet for development
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Platform wallet to receive bets (escrow)
const PLATFORM_WALLET = new PublicKey('HbJe1S48WbRMUt5UjZkPJFSZrdJt6Z5cUUvQpHHbPTfJ');

/**
 * Direct wallet transaction function that works with Phantom, Solflare, and other Solana wallets
 * This function handles the entire transaction flow directly with minimal abstraction
 */
export async function sendSolanaTransaction(
  amount: number,
  walletProvider: any,
  callbacks?: {
    onStart?: () => void;
    onApproval?: () => void;
    onSent?: (signature: string) => void;
    onConfirmed?: (signature: string) => void;
    onError?: (error: Error) => void;
  }
): Promise<string> {
  try {
    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!walletProvider) {
      throw new Error('Wallet provider is required');
    }
    
    // Log wallet provider details for debugging
    console.log('Direct transaction - wallet provider:', walletProvider);
    
    // Notify start
    callbacks?.onStart?.();
    
    // Get the correct provider object
    let provider = walletProvider;
    
    // Handle different wallet structures
    if (walletProvider.provider && !walletProvider.signTransaction) {
      provider = walletProvider.provider;
      console.log('Using nested provider:', provider);
    }
    
    // Check if we have the required methods
    if (!provider.publicKey) {
      throw new Error('Wallet provider does not have a public key');
    }
    
    if (!provider.signTransaction) {
      throw new Error('Wallet provider does not support transaction signing');
    }
    
    // Convert amount to lamports
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
    
    // Create a simple transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: lamports
      })
    );
    
    // Get recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    console.log('Transaction created, requesting signature...');
    
    // Request signature from wallet
    // This is the step that triggers the wallet approval popup
    const signedTransaction = await provider.signTransaction(transaction);
    
    // Notify approval
    callbacks?.onApproval?.();
    console.log('Transaction signed successfully');
    
    // Send the transaction to the network
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    console.log('Transaction sent, signature:', signature);
    
    // Notify sent
    callbacks?.onSent?.(signature);
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature);
    console.log('Transaction confirmed:', confirmation);
    
    // Notify confirmation
    callbacks?.onConfirmed?.(signature);
    
    return signature;
  } catch (error) {
    console.error('Error in direct wallet transaction:', error);
    
    // Handle user rejection specifically
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (
        errorMessage.includes('user rejected') || 
        errorMessage.includes('cancelled') || 
        errorMessage.includes('denied') ||
        errorMessage.includes('declined') ||
        errorMessage.includes('user did not approve')
      ) {
        const userRejectionError = new Error('Transaction rejected by user');
        callbacks?.onError?.(userRejectionError);
        throw userRejectionError;
      }
      
      callbacks?.onError?.(error);
    } else {
      const unknownError = new Error('Unknown error occurred');
      callbacks?.onError?.(unknownError);
      throw unknownError;
    }
    
    throw error;
  }
}

/**
 * Check if a wallet provider is valid and has the required methods
 */
export function isValidWalletProvider(provider: any): boolean {
  if (!provider) return false;
  
  // Check for direct provider
  if (provider.publicKey && provider.signTransaction) {
    return true;
  }
  
  // Check for nested provider
  if (provider.provider && provider.provider.publicKey && provider.provider.signTransaction) {
    return true;
  }
  
  return false;
}

/**
 * Get the actual provider object from a wallet provider
 */
export function getActualProvider(walletProvider: any): any {
  if (!walletProvider) return null;
  
  if (walletProvider.publicKey && walletProvider.signTransaction) {
    return walletProvider;
  }
  
  if (walletProvider.provider && walletProvider.provider.publicKey && walletProvider.provider.signTransaction) {
    return walletProvider.provider;
  }
  
  return null;
}
