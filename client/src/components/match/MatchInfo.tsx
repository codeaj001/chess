import { useQuery } from "@tanstack/react-query";
import { AIProfileCard } from "@/components/chess/AIProfileCard";
import { Switch } from "@/components/ui/switch";
import { useChessMatch } from "@/hooks/useChessMatch";
import { Match } from "@/lib/types";

interface MatchInfoProps {
  match: Match;
}

export function MatchInfo({ match }: MatchInfoProps) {
  const { isAutoPlay, setIsAutoPlay, currentMove, timeControl } = useChessMatch(match.id);

  const { data: whiteAI } = useQuery({
    queryKey: [`/api/ai/${match.white_bot_id}`],
  });

  const { data: blackAI } = useQuery({
    queryKey: [`/api/ai/${match.black_bot_id}`],
  });

  if (!whiteAI || !blackAI) {
    return (
      <div className="glassmorphism rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-4">Active Match</h2>
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400">Loading match information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glassmorphism rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Active Match</h2>
      
      {/* White Player */}
      <AIProfileCard ai={whiteAI} side="white" />
      
      {/* VS indicator */}
      <div className="flex items-center justify-center my-2">
        <div className="text-sm font-medium text-gray-400">vs</div>
      </div>
      
      {/* Black Player */}
      <AIProfileCard ai={blackAI} side="black" />
      
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-opacity-20 bg-white rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Move</div>
          <div className="text-sm font-mono">{currentMove}</div>
        </div>
        <div className="bg-opacity-20 bg-white rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Time Control</div>
          <div className="text-sm font-mono">{timeControl}</div>
        </div>
      </div>
      
      {/* Auto-play toggle */}
      <div className="flex items-center justify-between mt-4 bg-white/5 rounded-lg p-2">
        <span className="text-sm">Auto-play</span>
        <Switch 
          checked={isAutoPlay} 
          onCheckedChange={(checked) => setIsAutoPlay(checked)}
        />
      </div>
    </div>
  );
}
