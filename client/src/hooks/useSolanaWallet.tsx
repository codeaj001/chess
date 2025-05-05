import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './use-toast';
import { getWalletBalance, airdropSol } from '@/lib/solana';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

// Use Solana devnet for development and testing
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

interface WalletContextType {
  connected: boolean;
  walletAddress: string | null;
  walletProvider: any | null;
  balance: number | null;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  network: string;
  requestAirdrop: () => Promise<void>;
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
        // Check if any existing connection from localStorage
        const savedWalletAddress = localStorage.getItem('walletAddress');
        const savedWalletType = localStorage.getItem('walletType');
        
        if (savedWalletAddress) {
          setWalletAddress(savedWalletAddress);
          setConnected(true);
          
          if (savedWalletType) {
            setWalletProvider({ type: savedWalletType, address: savedWalletAddress });
          }
          
          // Get actual wallet balance from Solana blockchain
          try {
            const bal = await getWalletBalance(savedWalletAddress);
            setBalance(bal);
          } catch (error) {
            console.error("Error getting balance:", error);
            setBalance(null);
          }
        }
        
        // Also try to detect browser wallet extensions
        const detectPhantomWallet = async () => {
          try {
            // @ts-ignore - Phantom injects solana into window
            const provider = window.solana;
            if (provider?.isPhantom) {
              setWalletProvider({ 
                type: 'phantom', 
                provider,
                isExtension: true
              });
              
              // If we have permissions already, get the address
              if (provider.isConnected) {
                const address = provider.publicKey.toString();
                setWalletAddress(address);
                setConnected(true);
                localStorage.setItem('walletAddress', address);
                localStorage.setItem('walletType', 'phantom');
                
                const bal = await getWalletBalance(address);
                setBalance(bal);
              }
            }
          } catch (error) {
            console.error("Error detecting Phantom wallet:", error);
          }
        };
        
        // Try to detect Solflare wallet extension
        const detectSolflareWallet = async () => {
          try {
            // @ts-ignore - Solflare injects solflare into window
            const provider = window.solflare;
            if (provider?.isSolflare) {
              setWalletProvider({ 
                type: 'solflare', 
                provider,
                isExtension: true
              });
              
              // If we have permissions already, get the address
              if (provider.isConnected) {
                const address = provider.publicKey.toString();
                setWalletAddress(address);
                setConnected(true);
                localStorage.setItem('walletAddress', address);
                localStorage.setItem('walletType', 'solflare');
                
                const bal = await getWalletBalance(address);
                setBalance(bal);
              }
            }
          } catch (error) {
            console.error("Error detecting Solflare wallet:", error);
          }
        };
        
        // Execute wallet detection
        await detectPhantomWallet();
        await detectSolflareWallet();
        
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async (walletType: string) => {
    try {
      // Try connecting to real wallet if present
      if (walletType === 'phantom') {
        // @ts-ignore - Phantom injects solana into window
        const provider = window.solana;
        if (provider?.isPhantom) {
          try {
            // Request connection to the wallet
            await provider.connect();
            const address = provider.publicKey.toString();
            
            setWalletAddress(address);
            setConnected(true);
            setWalletProvider({ 
              type: 'phantom', 
              provider,
              isExtension: true 
            });
            
            localStorage.setItem('walletAddress', address);
            localStorage.setItem('walletType', 'phantom');
            
            // Get wallet balance
            const bal = await getWalletBalance(address);
            setBalance(bal);
            
            toast({
              title: "Wallet Connected",
              description: `Connected with Phantom wallet (${address.substring(0, 4)}...${address.substring(address.length - 4)})`,
            });
            
            return;
          } catch (err) {
            console.error("Error connecting to Phantom wallet:", err);
            // Fall through to mock wallet if Phantom connection fails
          }
        }
      } else if (walletType === 'solflare') {
        // @ts-ignore - Solflare injects solflare into window
        const provider = window.solflare;
        if (provider?.isSolflare) {
          try {
            // Request connection to the wallet
            await provider.connect();
            const address = provider.publicKey.toString();
            
            setWalletAddress(address);
            setConnected(true);
            setWalletProvider({ 
              type: 'solflare', 
              provider,
              isExtension: true 
            });
            
            localStorage.setItem('walletAddress', address);
            localStorage.setItem('walletType', 'solflare');
            
            // Get wallet balance
            const bal = await getWalletBalance(address);
            setBalance(bal);
            
            toast({
              title: "Wallet Connected",
              description: `Connected with Solflare wallet (${address.substring(0, 4)}...${address.substring(address.length - 4)})`,
            });
            
            return;
          } catch (err) {
            console.error("Error connecting to Solflare wallet:", err);
            // Fall through to mock wallet if Solflare connection fails
          }
        }
      }
      
      // If no browser wallet or connection failed, use mock wallet for demonstration
      // Generate a mock Solana address (base58 encoded)
      const characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let mockAddress = '';
      for (let i = 0; i < 44; i++) {
        mockAddress += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      setWalletAddress(mockAddress);
      setConnected(true);
      
      // Set a mock wallet provider for demonstration
      setWalletProvider({ 
        type: walletType, 
        address: mockAddress,
        isMock: true 
      });
      
      // Save to localStorage to persist the "connection"
      localStorage.setItem('walletAddress', mockAddress);
      localStorage.setItem('walletType', walletType);
      
      // Set a mock balance
      setBalance(5.0);
      
      toast({
        title: "Demo Wallet Connected",
        description: `Connected with simulated ${walletType} wallet for demonstration`,
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
    // Try to disconnect from real wallet if connected
    if (walletProvider?.isExtension && walletProvider?.provider?.disconnect) {
      try {
        walletProvider.provider.disconnect();
      } catch (error) {
        console.error("Error disconnecting from wallet:", error);
      }
    }
    
    setWalletAddress(null);
    setConnected(false);
    setWalletProvider(null);
    setBalance(null);
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    
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
  
  const requestAirdrop = async () => {
    if (!walletAddress) {
      toast({
        title: "No wallet connected",
        description: "Please connect a wallet first",
        variant: "destructive"
      });
      return;
    }
    
    try {
      toast({
        title: "Requesting Airdrop",
        description: "Requesting 1 SOL from Devnet...",
      });
      
      const signature = await airdropSol(walletAddress);
      
      if (signature) {
        toast({
          title: "Airdrop Successful",
          description: `Received 1 SOL. Transaction: ${signature.substring(0, 8)}...`,
        });
        
        // Refresh balance after airdrop
        setTimeout(() => refreshBalance(), 2000);
      }
    } catch (error) {
      console.error("Error requesting airdrop:", error);
      toast({
        title: "Airdrop Failed",
        description: error instanceof Error ? error.message : "Failed to request SOL airdrop",
        variant: "destructive"
      });
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
      refreshBalance,
      network: SOLANA_NETWORK,
      requestAirdrop
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
