// AI and Chess related types
export type AIPlayingStyle = 
  | "Aggressive" 
  | "Defensive" 
  | "Positional" 
  | "Tactical" 
  | "Classical" 
  | "Neural" 
  | "Mixed";

export interface AIModel {
  id: number;
  name: string;
  elo: number;
  style: AIPlayingStyle;
  opening_preferences: string[];
  middlegame_strength: number; // 1-5
  endgame_strength: number; // 1-5
  is_premium: boolean;
}

export type MatchStatus = "Scheduled" | "InProgress" | "Completed";
export type MatchType = "Regular" | "Tournament" | "Showcase";
export type MatchResult = "White" | "Black" | "Draw" | null;

export interface Match {
  id: number;
  solana_match_id: number;
  white_bot_id: number;
  black_bot_id: number;
  match_pubkey?: string;
  status: MatchStatus;
  match_type: MatchType;
  start_time: string;
  end_time?: string;
  result: MatchResult;
  white_pool: number;
  black_pool: number;
  draw_pool: number;
  bets_locked: boolean;
  time_control?: string;
  moves?: string[];
}

// Betting related types
export type BetOutcome = "White" | "Black" | "Draw";
export type BetStatus = "Active" | "Won" | "Lost" | "Draw";

export interface Bet {
  id: string;
  match_id: number;
  solana_match_id: number;
  user_wallet: string;
  amount: number;
  outcome: BetOutcome;
  transaction_signature?: string;
  solana_bet_pubkey?: string;
  timestamp: string;
  status: BetStatus;
  claimed: boolean;
  payout?: number;
  match_name?: string; // For display purposes
}

export interface BetPools {
  white: number;
  black: number;
  draw: number;
}
