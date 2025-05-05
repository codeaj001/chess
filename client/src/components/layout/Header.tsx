import { WalletButton } from "@/components/wallet/WalletButton";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function Header() {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="glassmorphism sticky top-0 z-50 py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h1 className="text-xl font-bold gradient-text">CompChess</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
            Devnet
          </span>
          
          <span className="hidden sm:flex items-center gap-1 text-sm text-gray-300">
            <Clock className="h-4 w-4" />
            {currentTime}
          </span>
          
          <WalletButton />
          
          <button className="md:hidden" id="mobileMenuButton">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
