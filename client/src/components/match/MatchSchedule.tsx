import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Match, MatchType } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface UpcomingMatchCardProps {
  match: Match;
  onClick: () => void;
}

function getMatchTypeBadge(type: MatchType) {
  switch (type) {
    case "Tournament":
      return "bg-purple-500/20 text-purple-300";
    case "Showcase":
      return "bg-blue-500/20 text-blue-300";
    case "Regular":
    default:
      return "bg-green-500/20 text-green-300";
  }
}

function UpcomingMatchCard({ match, onClick }: UpcomingMatchCardProps) {
  const { data: whiteAI } = useQuery({
    queryKey: [`/api/ai/${match.white_bot_id}`],
  });

  const { data: blackAI } = useQuery({
    queryKey: [`/api/ai/${match.black_bot_id}`],
  });

  const formattedTime = formatDistanceToNow(new Date(match.start_time), { addSuffix: true });
  const timeFormatted = formattedTime.startsWith('in ') ? formattedTime : `in ${formattedTime}`;
  
  return (
    <div 
      className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium">
          {whiteAI?.name ?? 'Loading...'} vs {blackAI?.name ?? 'Loading...'}
        </span>
        <span className="text-xs text-gray-400">{timeFormatted}</span>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>ELO {whiteAI?.elo ?? '?'} / {blackAI?.elo ?? '?'}</span>
        <span className={`px-2 py-0.5 rounded-full ${getMatchTypeBadge(match.match_type)}`}>
          {match.match_type}
        </span>
      </div>
    </div>
  );
}

export function MatchSchedule({ onSelectMatch }: { onSelectMatch: (matchId: number) => void }) {
  const { data: upcomingMatches, isLoading } = useQuery({
    queryKey: ["/api/matches/upcoming"],
  });

  return (
    <div className="glassmorphism rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Upcoming Matches</h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-gray-400">Loading upcoming matches...</p>
        </div>
      ) : upcomingMatches && upcomingMatches.length > 0 ? (
        <div className="space-y-3">
          {upcomingMatches.map((match: Match) => (
            <UpcomingMatchCard 
              key={match.id} 
              match={match} 
              onClick={() => onSelectMatch(match.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-20">
          <p className="text-gray-400">No upcoming matches</p>
        </div>
      )}
      
      <Button 
        variant="secondary" 
        className="w-full mt-4 py-2 px-4 bg-white/10 hover:bg-white/15 transition"
      >
        View All Matches
      </Button>
    </div>
  );
}
