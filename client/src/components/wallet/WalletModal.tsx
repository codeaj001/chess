import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { connectWallet } = useSolanaWallet();

  const handleWalletConnect = (walletType: string) => {
    connectWallet(walletType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphism border-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
          <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </DialogClose>
        </DialogHeader>
        <DialogDescription className="text-gray-300">
          Choose a wallet provider to connect to the CompChess platform.
        </DialogDescription>
        
        <div className="space-y-3 mt-4">
          <button 
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
            onClick={() => handleWalletConnect('phantom')}
          >
            <img src="https://phantom.app/img/phantom-logo.svg" alt="Phantom" className="h-8 w-8 mr-3" />
            <div className="text-left">
              <div className="font-medium">Phantom</div>
              <div className="text-xs text-gray-400">Connect to your Phantom Wallet</div>
            </div>
          </button>
          
          <button 
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
            onClick={() => handleWalletConnect('solflare')}
          >
            <img src="https://solflare.com/assets/logo.svg" alt="Solflare" className="h-8 w-8 mr-3" />
            <div className="text-left">
              <div className="font-medium">Solflare</div>
              <div className="text-xs text-gray-400">Connect to your Solflare Wallet</div>
            </div>
          </button>
          
          <button 
            className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
            onClick={() => handleWalletConnect('other')}
          >
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium">Other Wallets</div>
              <div className="text-xs text-gray-400">More Solana wallet options</div>
            </div>
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-400">
          By connecting your wallet, you agree to the Terms of Service and Privacy Policy.
        </div>
      </DialogContent>
    </Dialog>
  );
}
