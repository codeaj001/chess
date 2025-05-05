import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { MatchInfo } from "@/components/match/MatchInfo";
import { MatchSchedule } from "@/components/match/MatchSchedule";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { BettingPanel } from "@/components/betting/BettingPanel";
import { BettingHistory } from "@/components/betting/BettingHistory";
import { useMobile } from "@/hooks/use-mobile";

export default function Home() {
  const isMobile = useMobile();
  const [activeTab, setActiveTab] = useState<"matches" | "chessboard" | "betting">("chessboard");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  
  // Fetch active match
  const { data: activeMatches, isLoading: isLoadingMatches } = useQuery({
    queryKey: ["/api/matches/active"],
  });
  
  // Set the first active match as selected, if available
  useEffect(() => {
    if (activeMatches && activeMatches.length > 0 && !selectedMatchId) {
      setSelectedMatchId(activeMatches[0].id);
    }
  }, [activeMatches, selectedMatchId]);
  
  // Get the selected match data
  const selectedMatch = selectedMatchId 
    ? activeMatches?.find((match: any) => match.id === selectedMatchId) 
    : activeMatches?.[0];
  
  // Get AI models for the selected match
  const { data: whiteAI, isLoading: isLoadingWhiteAI } = useQuery({
    queryKey: [`/api/ai/${selectedMatch?.white_bot_id}`],
    enabled: !!selectedMatch?.white_bot_id,
  });
  
  const { data: blackAI, isLoading: isLoadingBlackAI } = useQuery({
    queryKey: [`/api/ai/${selectedMatch?.black_bot_id}`],
    enabled: !!selectedMatch?.black_bot_id,
  });
  
  const handleMatchSelect = (matchId: number) => {
    setSelectedMatchId(matchId);
  };
  
  const isLoading = isLoadingMatches || isLoadingWhiteAI || isLoadingBlackAI;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {isMobile && (
        <MobileNav 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      )}
      
      <main className="container mx-auto flex-grow px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left column - Match Info (col-span-3 on desktop) */}
          <div 
            className={`md:col-span-3 space-y-6 ${
              isMobile && activeTab !== "matches" ? "hidden" : ""
            }`}
          >
            {isLoading ? (
              <div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
                <p className="text-gray-400">Loading match data...</p>
              </div>
            ) : selectedMatch && whiteAI && blackAI ? (
              <>
                <MatchInfo match={selectedMatch} />
                <MatchSchedule onSelectMatch={handleMatchSelect} />
              </>
            ) : (
              <div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
                <p className="text-gray-400">No active matches</p>
              </div>
            )}
          </div>
          
          {/* Middle column - Chess Board (col-span-6 on desktop) */}
          <div 
            className={`md:col-span-6 ${
              isMobile && activeTab !== "chessboard" ? "hidden" : ""
            }`}
          >
            {isLoading ? (
              <div className="glassmorphism rounded-xl p-4 aspect-square flex items-center justify-center">
                <p className="text-gray-400">Loading chess board...</p>
              </div>
            ) : selectedMatch && whiteAI && blackAI ? (
              <ChessBoard 
                whitePlayer={whiteAI} 
                blackPlayer={blackAI} 
                matchId={selectedMatch.id} 
              />
            ) : (
              <div className="glassmorphism rounded-xl p-4 aspect-square flex items-center justify-center">
                <p className="text-gray-400">No active matches</p>
              </div>
            )}
          </div>
          
          {/* Right column - Betting Panel (col-span-3 on desktop) */}
          <div 
            className={`md:col-span-3 space-y-6 ${
              isMobile && activeTab !== "betting" ? "hidden" : ""
            }`}
          >
            {isLoading ? (
              <div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
                <p className="text-gray-400">Loading betting options...</p>
              </div>
            ) : selectedMatch ? (
              <>
                <BettingPanel match={selectedMatch} />
                <BettingHistory />
              </>
            ) : (
              <div className="glassmorphism rounded-xl p-4 h-48 flex items-center justify-center">
                <p className="text-gray-400">No active matches to bet on</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
