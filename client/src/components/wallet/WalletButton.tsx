import { useState } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletModal } from "./WalletModal";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function WalletButton() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { 
    connected, 
    walletAddress, 
    disconnectWallet, 
    balance, 
    network,
    walletProvider,
    requestAirdrop,
    detectedWallets
  } = useSolanaWallet();

  // Get installed wallets count
  const installedWallets = detectedWallets.filter(w => w.installed && w.type !== 'demo');
  const hasInstalledWallets = installedWallets.length > 0;

  if (!connected) {
    return (
      <>
        <Button 
          className="flex items-center gap-2 bg-accent hover:bg-accent/90 transition"
          onClick={() => setWalletModalOpen(true)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {hasInstalledWallets 
              ? `Connect (${installedWallets.length})` 
              : "Connect Wallet"}
          </span>
          <span className="inline sm:hidden">Wallet</span>
        </Button>
        <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
      </>
    );
  }

  // Format wallet address for display
  const displayAddress = walletAddress 
    ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}`
    : 'Connected';

  // Show wallet type indicator (with icon if available)
  const getWalletTypeDisplay = () => {
    const type = walletProvider?.type || 'unknown';
    if (type === 'phantom') return '👻 Phantom';
    if (type === 'solflare') return '🔆 Solflare';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 transition"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {balance !== null 
                ? `${balance.toFixed(2)} SOL` 
                : <Skeleton className="h-4 w-16" />}
            </span>
            <span className="inline sm:hidden">Wallet</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="glassmorphism border-none w-60">
          <div className="p-2">
            <div className="mb-1 text-xs text-gray-400 flex justify-between">
              <span>{getWalletTypeDisplay()}</span>
              <span className="text-gray-500">{network}</span>
            </div>
            <div className="font-mono text-xs text-gray-300 truncate">
              {walletAddress}
            </div>
          </div>
          
          {network === 'devnet' && (
            <DropdownMenuItem onClick={() => requestAirdrop()}>
              Request SOL Airdrop
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => setWalletModalOpen(true)}>
            Wallet Details
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={disconnectWallet}>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </>
  );
}
