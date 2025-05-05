import { useRef, useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useChessMatch } from "@/hooks/useChessMatch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIModel } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

interface ChessBoardProps {
  whitePlayer: AIModel;
  blackPlayer: AIModel;
  matchId: number;
}

export function ChessBoard({ whitePlayer, blackPlayer, matchId }: ChessBoardProps) {
  const { 
    game, 
    moveHistory, 
    status, 
    timers, 
    lastMove, 
    currentMove,
    isAutoPlay
  } = useChessMatch(matchId);
  
  const boardWrapper = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(400);

  useEffect(() => {
    const handleResize = () => {
      if (boardWrapper.current) {
        setBoardWidth(boardWrapper.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glassmorphism rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Live Chess Match</h2>
        <div className="text-sm text-gray-300">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </span>
        </div>
      </div>
      
      {/* Black player info bar */}
      <div className="flex justify-between items-center bg-black/30 rounded-t-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-sm font-bold">B</div>
          <div>
            <div className="text-sm font-medium">{blackPlayer.name}</div>
            <div className="text-xs text-gray-400">ELO {blackPlayer.elo}</div>
          </div>
        </div>
        <div className="font-mono text-lg">{formatTime(timers.black)}</div>
      </div>
      
      {/* Chess Board */}
      <div ref={boardWrapper} className="aspect-square w-full">
        <Chessboard 
          id={`board-${matchId}`}
          boardWidth={boardWidth}
          position={game.fen()}
          boardOrientation="white"
          customDarkSquareStyle={{ backgroundColor: '#769656' }}
          customLightSquareStyle={{ backgroundColor: '#EEEED2' }}
          customSquareStyles={{
            ...(lastMove ? {
              [lastMove.from]: { backgroundColor: 'rgba(155, 135, 245, 0.3)' },
              [lastMove.to]: { backgroundColor: 'rgba(155, 135, 245, 0.3)' }
            } : {})
          }}
        />
      </div>
      
      {/* White player info bar */}
      <div className="flex justify-between items-center bg-white/10 rounded-b-lg p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-sm font-bold">W</div>
          <div>
            <div className="text-sm font-medium">{whitePlayer.name}</div>
            <div className="text-xs text-gray-400">ELO {whitePlayer.elo}</div>
          </div>
        </div>
        <div className="font-mono text-lg">{formatTime(timers.white)}</div>
      </div>
      
      {/* Game status */}
      {status && status !== 'inProgress' && (
        <div className={`mt-2 p-2 text-center rounded-md font-medium ${
          status === 'checkmate' && game.turn() === 'b' ? 'bg-green-500/20 text-green-300' :
          status === 'checkmate' && game.turn() === 'w' ? 'bg-red-500/20 text-red-300' :
          'bg-yellow-500/20 text-yellow-300'
        }`}>
          {status === 'checkmate' && game.turn() === 'b' ? 'White wins by checkmate' :
           status === 'checkmate' && game.turn() === 'w' ? 'Black wins by checkmate' :
           status === 'stalemate' ? 'Draw by stalemate' :
           status === 'threefoldRepetition' ? 'Draw by repetition' :
           status === 'insufficientMaterial' ? 'Draw by insufficient material' :
           status === 'fiftyMoves' ? 'Draw by fifty-move rule' : 
           status}
        </div>
      )}
      
      {/* Move history */}
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Move History</h3>
        <ScrollArea className="bg-black/20 rounded-lg p-3 h-32">
          <div className="grid grid-cols-7 gap-2 font-mono text-sm">
            {moveHistory.map((move, index) => (
              index % 2 === 0 ? (
                <>
                  <div key={`move-number-${Math.floor(index/2) + 1}`} className="text-gray-500">{Math.floor(index/2) + 1}.</div>
                  <div key={`move-white-${index}`} className="col-span-3">{move}</div>
                  {moveHistory[index + 1] ? (
                    <div key={`move-black-${index + 1}`} className="col-span-3">{moveHistory[index + 1]}</div>
                  ) : <div className="col-span-3"></div>}
                </>
              ) : null
            ))}
          </div>
        </ScrollArea>
      </div>
      
      <Separator className="my-4 bg-white/10" />
      
      <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
        <span className="text-sm">Current Move: {currentMove}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">Auto-play</span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isAutoPlay} 
              onChange={() => {}} 
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-700 peer-focus:ring-1 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
