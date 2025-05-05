import { Badge } from "@/components/ui/badge";
import { AIModel, AIPlayingStyle } from "@/lib/types";

interface AIProfileCardProps {
  ai: AIModel;
  side: "white" | "black";
}

export function AIProfileCard({ ai, side }: AIProfileCardProps) {
  const getStyleColor = (style: AIPlayingStyle) => {
    switch (style) {
      case "Aggressive":
        return "bg-red-500/20 text-red-300";
      case "Defensive":
        return "bg-blue-500/20 text-blue-300";
      case "Positional":
        return "bg-green-500/20 text-green-300";
      case "Tactical":
        return "bg-purple-500/20 text-purple-300";
      case "Classical":
        return "bg-yellow-500/20 text-yellow-300";
      case "Neural":
        return "bg-indigo-500/20 text-indigo-300";
      case "Mixed":
        return "bg-orange-500/20 text-orange-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
        side === "white" ? "bg-white text-black" : "bg-gray-800 text-white"
      } font-bold`}>
        {side === "white" ? "W" : "B"}
      </div>
      <div>
        <h3 className="font-medium">{ai.name}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-300">
          <Badge variant="outline" className={`px-2 py-0.5 rounded-full ${getStyleColor(ai.style)}`}>
            {ai.style}
          </Badge>
          <span>ELO {ai.elo}</span>
        </div>
      </div>
    </div>
  );
}
