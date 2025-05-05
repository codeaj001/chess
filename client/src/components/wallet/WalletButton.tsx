import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletModal } from "./WalletModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function WalletButton() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { connected, walletAddress, disconnectWallet, balance } = useSolanaWallet();

  if (!connected) {
    return (
      <>
        <Button 
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 transition"
          onClick={() => setWalletModalOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="inline sm:hidden">Wallet</span>
        </Button>
        <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 transition"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {balance !== null ? `${balance.toFixed(2)} SOL` : 'Connected'}
          </span>
          <span className="inline sm:hidden">Wallet</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="glassmorphism border-none w-56">
        <div className="px-2 py-1.5 text-xs font-mono text-gray-400 truncate">
          {walletAddress}
        </div>
        <DropdownMenuItem onClick={disconnectWallet}>
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
