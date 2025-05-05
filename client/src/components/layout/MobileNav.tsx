import { useState } from "react";

interface MobileNavProps {
  activeTab: "matches" | "chessboard" | "betting";
  onTabChange: (tab: "matches" | "chessboard" | "betting") => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <div className="md:hidden glassmorphism sticky top-16 z-40 flex justify-around text-sm">
      <button 
        className={`py-3 px-4 border-b-2 ${activeTab === "matches" ? "border-accent font-medium" : "border-transparent opacity-70"}`}
        onClick={() => onTabChange("matches")}
      >
        Matches
      </button>
      <button 
        className={`py-3 px-4 border-b-2 ${activeTab === "chessboard" ? "border-accent font-medium" : "border-transparent opacity-70"}`}
        onClick={() => onTabChange("chessboard")}
      >
        Chess Board
      </button>
      <button 
        className={`py-3 px-4 border-b-2 ${activeTab === "betting" ? "border-accent font-medium" : "border-transparent opacity-70"}`}
        onClick={() => onTabChange("betting")}
      >
        Betting
      </button>
    </div>
  );
}
