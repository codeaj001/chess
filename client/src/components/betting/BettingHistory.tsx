import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button"; // Import Button
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { formatDistanceToNow } from "date-fns";
import { Bet } from "@/lib/types";
import { claimWinnings } from "../../lib/solana"; // Import claimWinnings
import { useToast } from "@/hooks/use-toast"; // Import useToast

export function BettingHistory() {
  const { connected, walletAddress, walletProvider, refreshBalance } = useSolanaWallet(); // Get walletProvider and refreshBalance
  const { toast } = useToast(); // Initialize useToast
  const queryClient = useQueryClient(); // Initialize useQueryClient

  const { data: bets, isLoading } = useQuery({
    queryKey: [`/api/bets/history`],
    enabled: !!connected && !!walletAddress,
  });

  const claimWinningsMutation = useMutation({
    mutationFn: ({ betId }: { betId: string }) => {
      if (!walletProvider) {
        throw new Error("Wallet not connected");
      }
      return claimWinnings(betId, undefined, walletProvider); // Call claimWinnings
    },
    onMutate: async ({ betId }) => {
      // Optimistically update the UI? (Optional, could be complex with lists)
      // For simplicity, we'll just show a toast.
      toast({
        title: "Claiming Winnings",
        description: "Requesting wallet approval to claim winnings...",
      });
    },
    onSuccess: async (signature, variables) => {
      toast({
        title: "Winnings Claimed Successfully",
        description: `Transaction Signature: ${signature}`,
      });
      // Invalidate the query to refetch bet history and update UI
      await queryClient.invalidateQueries({ queryKey: [`/api/bets/history`] });
      // Refresh wallet balance
      await refreshBalance();
    },
    onError: (error, variables) => {
      console.error("Error claiming winnings:", error);
      toast({
        title: "Failed to Claim Winnings",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleClaimWinnings = async (betId: string) => {
    claimWinningsMutation.mutate({ betId });
  };

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
                {bet.status === "Won" && !bet.claimed && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700 transition"
                      onClick={() => handleClaimWinnings(bet.id)}
                      disabled={claimWinningsMutation.isLoading || !connected}
                    >
                      {claimWinningsMutation.isLoading && claimWinningsMutation.variables?.betId === bet.id
                        ? "Claiming..."
                        : "Claim Winnings"}
                    </Button>
                  </div>
                )}
                {bet.status === "Won" && bet.claimed && (
                   <div className="mt-2 text-xs text-gray-400 text-center">
                     Winnings Claimed
                   </div>
                )}
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