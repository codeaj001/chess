import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { formatDistanceToNow } from "date-fns";
import { Bet } from "@/lib/types";

export function BettingHistory() {
  const { connected, walletAddress } = useSolanaWallet();
  
  const { data: bets, isLoading } = useQuery({
    queryKey: [`/api/bets/history`],
    enabled: !!connected && !!walletAddress,
  });
  
  if (!connected) {
    return (
      <div className="glassmorphism rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Betting History</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400">Connect your wallet to view your betting history</p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="glassmorphism rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Betting History</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-400">Loading betting history...</p>
        </div>
      </div>
    );
  }
  
  const getBetStatusColor = (status: string) => {
    switch (status) {
      case "Won":
        return "bg-betting-win/20 text-betting-win";
      case "Lost":
        return "bg-betting-loss/20 text-betting-loss";
      case "Draw":
        return "bg-betting-draw/20 text-betting-draw";
      case "Active":
      default:
        return "bg-blue-500/20 text-blue-300";
    }
  };
  
  return (
    <div className="glassmorphism rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Betting History</h2>
      
      <ScrollArea className="max-h-64">
        <div className="space-y-3">
          {bets && bets.length > 0 ? (
            bets.map((bet: Bet) => (
              <div key={bet.id} className="p-3 bg-white/5 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{bet.match_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getBetStatusColor(bet.status)}`}>
                    {bet.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>
                    {bet.amount} SOL 
                    {bet.payout ? ` → ${bet.payout} SOL` : ""}
                  </span>
                  <span>{formatDistanceToNow(new Date(bet.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-20">
              <p className="text-gray-400">No betting history</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
