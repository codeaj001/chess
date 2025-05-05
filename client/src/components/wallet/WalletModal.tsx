import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { X, Wallet as WalletIcon, Info, CheckCircle2 } from "lucide-react";
import { useSolanaWallet } from "@/hooks/useSolanaWallet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const { 
    connectWallet, 
    network, 
    connected, 
    walletAddress, 
    requestAirdrop, 
    detectedWallets 
  } = useSolanaWallet();

  const handleWalletConnect = (walletType: string) => {
    connectWallet(walletType);
    onOpenChange(false);
  };

  // For already connected wallets
  if (connected && walletAddress) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glassmorphism border-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Wallet Details</DialogTitle>
            <DialogClose className="absolute right-4 top-4 text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </DialogClose>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <WalletIcon className="h-5 w-5 text-accent" />
                <h3 className="font-medium">Your Wallet</h3>
              </div>
              <div className="font-mono text-sm text-gray-300 break-all">
                {walletAddress}
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Connected to Solana {network}
              </div>
            </div>
            
            {network === 'devnet' && (
              <button 
                className="w-full flex items-center justify-center p-3 bg-accent hover:bg-accent/90 transition rounded-lg"
                onClick={() => {
                  requestAirdrop();
                  onOpenChange(false);
                }}
              >
                <div className="font-medium">Request 1 SOL Airdrop</div>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Group wallets by installed status
  const installedWallets = detectedWallets.filter(wallet => wallet.installed);
  const otherWallets = detectedWallets.filter(wallet => !wallet.installed);

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
          Choose a wallet to connect to the CompChess platform.
        </DialogDescription>
        
        <Tabs defaultValue="detected" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detected" className="text-sm">
              Detected Wallets {installedWallets.length > 0 && `(${installedWallets.length})`}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-sm">All Wallets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detected" className="space-y-3 mt-4">
            {installedWallets.length > 0 ? (
              installedWallets.map((wallet) => (
                <button 
                  key={wallet.type}
                  className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
                  onClick={() => handleWalletConnect(wallet.type)}
                >
                  {wallet.icon ? (
                    <img src={wallet.icon} alt={wallet.name} className="h-8 w-8 mr-3" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                      <WalletIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="text-left flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {wallet.name}
                      <Badge variant="outline" className="ml-2 text-xs bg-green-900/30 text-green-400 border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Installed
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">One-click connect</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 bg-white/5 rounded-lg">
                <Info className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-300">No wallet extensions detected in your browser</p>
                <p className="text-xs text-gray-400 mt-1">Install a Solana wallet or use the demo wallet</p>
              </div>
            )}
            
            {/* Always show demo wallet option */}
            <button 
              className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
              onClick={() => handleWalletConnect('demo')}
            >
              <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                <WalletIcon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="font-medium">Demo Wallet</div>
                <div className="text-xs text-gray-400">Use a simulated wallet for testing</div>
              </div>
            </button>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-3 mt-4">
            {detectedWallets.map((wallet) => (
              <button 
                key={wallet.type}
                className="w-full flex items-center p-3 bg-white/10 hover:bg-white/15 transition rounded-lg"
                onClick={() => handleWalletConnect(wallet.type)}
              >
                {wallet.icon ? (
                  <img src={wallet.icon} alt={wallet.name} className="h-8 w-8 mr-3" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                    <WalletIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="text-left flex-1">
                  <div className="font-medium flex items-center">
                    {wallet.name}
                    {wallet.installed && (
                      <Badge variant="outline" className="ml-2 text-xs bg-green-900/30 text-green-400 border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Installed
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {wallet.installed 
                      ? "Click to connect" 
                      : wallet.type === 'demo' 
                        ? "Simulated wallet for testing" 
                        : "Not installed - will use demo mode"}
                  </div>
                </div>
              </button>
            ))}
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 text-xs text-gray-400">
          By connecting your wallet, you agree to the Terms of Service and Privacy Policy.
        </div>
        
        <div className="mt-2 p-2 bg-yellow-500/10 text-yellow-300 text-xs rounded-md">
          Currently operating on Solana {network}. All transactions are simulated for demonstration purposes.
        </div>
      </DialogContent>
    </Dialog>
  );
}
