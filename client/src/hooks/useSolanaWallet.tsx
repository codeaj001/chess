import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { getWalletBalance } from '@/lib/solana';

interface WalletContextType {
  connected: boolean;
  walletAddress: string | null;
  walletProvider: any | null;
  balance: number | null;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletProvider, setWalletProvider] = useState<any | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // For demo purposes, we'll just check localStorage
        const savedWalletAddress = localStorage.getItem('walletAddress');
        
        if (savedWalletAddress) {
          setWalletAddress(savedWalletAddress);
          setConnected(true);
          
          // Get wallet balance
          try {
            const bal = await getWalletBalance(savedWalletAddress);
            setBalance(bal);
          } catch (error) {
            console.error("Error getting balance:", error);
            setBalance(null);
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async (walletType: string) => {
    try {
      // For demo purposes, we'll simulate wallet connection
      // In a real app, this would interface with Solana wallet adapters
      
      // Generate a mock address for demonstration
      const mockAddress = "DemoWallet" + Math.floor(Math.random() * 1000000);
      
      setWalletAddress(mockAddress);
      setConnected(true);
      
      // Set a mock wallet provider - in reality this would be the actual wallet interface
      setWalletProvider({ type: walletType, address: mockAddress });
      
      // Save to localStorage to persist the "connection"
      localStorage.setItem('walletAddress', mockAddress);
      
      // Set a mock balance
      setBalance(5.0);
      
      toast({
        title: "Wallet Connected",
        description: `Connected with ${walletType} wallet`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Failed to connect wallet",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setConnected(false);
    setWalletProvider(null);
    setBalance(null);
    localStorage.removeItem('walletAddress');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const refreshBalance = async () => {
    if (!walletAddress) return;
    
    try {
      const bal = await getWalletBalance(walletAddress);
      setBalance(bal);
      return bal;
    } catch (error) {
      console.error("Error refreshing balance:", error);
      return null;
    }
  };

  return (
    <WalletContext.Provider value={{
      connected,
      walletAddress,
      walletProvider,
      balance,
      connectWallet,
      disconnectWallet,
      refreshBalance
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useSolanaWallet must be used within a WalletProvider');
  }
  return context;
}
