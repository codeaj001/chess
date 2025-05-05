import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { useChessMatch } from "@/hooks/useChessMatch";
import { Match, BetOutcome } from "@/lib/types";
import { placeBet, airdropSol } from "@/lib/solana";
import { AlertTriangle, Info } from "lucide-react";

interface BettingPanelProps {
  match: Match;
}

export function BettingPanel({ match }: BettingPanelProps) {
  const { toast } = useToast();
  const { connected, walletAddress, walletProvider, refreshBalance, network } = useSolanaWallet();
  const { betPools, isMatchLocked } = useChessMatch(match.id);
  
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome | null>(null);
  const [betAmount, setBetAmount] = useState<string>("0.5");
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isAirdropping, setIsAirdropping] = useState(false);
  
  const betAmountNumber = parseFloat(betAmount);
  
  const handleQuickAmount = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const calculatePotentialWin = () => {
    if (!selectedOutcome || !betPools || isNaN(betAmountNumber) || betAmountNumber <= 0) {
      return 0;
    }
    
    const poolTotal = betPools.white + betPools.black + betPools.draw;
    const selectedPool = selectedOutcome === 'White' ? betPools.white : 
                          selectedOutcome === 'Black' ? betPools.black : betPools.draw;
    
    // Calculate odds (pool total / selected outcome pool)
    // Apply a 5% platform fee
    const multiplier = (poolTotal / (selectedPool + betAmountNumber)) * 0.95;
    return betAmountNumber * multiplier;
  };

  const handlePlaceBet = async () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to place a bet",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedOutcome) {
      toast({
        title: "No outcome selected",
        description: "Please select White, Black, or Draw",
        variant: "destructive"
      });
      return;
    }
    
    if (isNaN(betAmountNumber) || betAmountNumber <= 0) {
      toast({
        title: "Invalid bet amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    if (isMatchLocked) {
      toast({
        title: "Betting closed",
        description: "Betting is no longer available for this match",
        variant: "destructive"
      });
      return;
    }
    
    setIsPlacingBet(true);
    
    try {
      const transaction = await placeBet(match.id, selectedOutcome, betAmountNumber);
      
      toast({
        title: "Bet placed successfully",
        description: `You bet ${betAmountNumber} SOL on ${selectedOutcome}`,
      });
      
      // Refresh bet pools
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({
        title: "Failed to place bet",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleAirdrop = async () => {
    if (!connected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return;
    }
    
    setIsAirdropping(true);
    
    try {
      await airdropSol(walletAddress);
      toast({
        title: "Airdrop successful",
        description: "1 SOL has been airdropped to your wallet (Devnet)",
      });
      
      // Refresh balance
      await refreshBalance();
    } catch (error) {
      console.error("Airdrop error:", error);
      toast({
        title: "Airdrop failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
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
              selectedOutcome === 'White' ? 'border-accent' : 'border-transparent'
            }`}
            onClick={() => setSelectedOutcome('White')}
            disabled={isMatchLocked}
          >
            <div className="w-6 h-6 bg-white rounded-full mb-1 flex items-center justify-center text-black text-xs font-bold">W</div>
            <span className="text-sm">White</span>
            <span className="text-xs text-gray-400">{betPools ? `${((betPools.black + betPools.draw) / betPools.white).toFixed(1)}x` : "0.0x"}</span>
          </button>
          
          <button 
            className={`bg-white/10 hover:bg-white/15 transition py-3 px-2 rounded-lg flex flex-col items-center justify-center border ${
              selectedOutcome === 'Draw' ? 'border-accent' : 'border-transparent'
            }`}
            onClick={() => setSelectedOutcome('Draw')}
            disabled={isMatchLocked}
          >
            <div className="w-6 h-6 bg-gray-500 rounded-full mb-1 flex items-center justify-center text-xs font-bold">D</div>
            <span className="text-sm">Draw</span>
            <span className="text-xs text-gray-400">{betPools ? `${((betPools.white + betPools.black) / betPools.draw).toFixed(1)}x` : "0.0x"}</span>
          </button>
          
          <button 
            className={`bg-white/10 hover:bg-white/15 transition py-3 px-2 rounded-lg flex flex-col items-center justify-center border ${
              selectedOutcome === 'Black' ? 'border-accent' : 'border-transparent'
            }`}
            onClick={() => setSelectedOutcome('Black')}
            disabled={isMatchLocked}
          >
            <div className="w-6 h-6 bg-gray-800 rounded-full mb-1 flex items-center justify-center text-white text-xs font-bold">B</div>
            <span className="text-sm">Black</span>
            <span className="text-xs text-gray-400">{betPools ? `${((betPools.white + betPools.draw) / betPools.black).toFixed(1)}x` : "0.0x"}</span>
          </button>
        </div>
        
        {/* Amount input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Bet Amount (SOL)</label>
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
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-400">SOL</div>
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
            className={`${betAmount === "1.0" ? "bg-accent/20 hover:bg-accent/30" : "bg-white/10 hover:bg-white/15"} transition py-1`}
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
            <span className="text-sm text-gray-300">Potential Win</span>
            <span className="text-sm font-medium">{potentialWin.toFixed(2)} SOL</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Betting Pool</span>
            <span className="text-sm font-medium">
              {betPools ? (betPools.white + betPools.black + betPools.draw).toFixed(2) : "0.00"} SOL
            </span>
          </div>
        </div>
        
        {/* Place bet button */}
        <Button 
          className="w-full bg-accent hover:bg-accent/90 transition"
          onClick={handlePlaceBet}
          disabled={!connected || isPlacingBet || isMatchLocked}
        >
          {isPlacingBet ? "Processing..." : "Place Bet"}
        </Button>
        
        {/* Wallet not connected warning */}
        {!connected && (
          <div className="mt-4 bg-yellow-500/10 text-yellow-300 rounded-lg p-3 text-sm flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>Connect your wallet to place bets and claim winnings.</span>
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
        
        <div className="text-xs text-gray-400 mt-4">
          Note: This is a development environment. SOL tokens have no real value and are only for testing purposes.
        </div>
      </div>
    </div>
  );
}
