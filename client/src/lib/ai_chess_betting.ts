export const IDL = {
	"version": "0.1.0",
	"instructions": [
		{
			"name/home/user/chess/server": "initialize",
			"accounts": [
				{ "name": "programState", "isMut": true, "isSigner": true },
				{ "name": "authority", "isMut": true, "isSigner": true },
				{ "name": "feeTreasury", "isMut": true, "isSigner": false },
				{ "name": "tokenMint", "isMut": false, "isSigner": false },
				{ "name": "systemProgram", "isMut": false, "isSigner": false },				{ "name": "tokenProgram", "isMut": false, "isSigner": false },
				{ "name": "rent", "isMut": false, "isSigner": false }
			],
			"args": [{ "name": "betTreasuryBump", "type": "u8" }]
		},
		{
			"name": "createMatch",
			"accounts": [
				{ "name": "programState", "isMut": true, "isSigner": false },
				{ "name": "chessMatch", "isMut": true, "isSigner": true },
				{ "name": "matchTreasury", "isMut": true, "isSigner": false },
				{ "name": "tokenMint", "isMut": false, "isSigner": false },
				{ "name": "authority", "isMut": true, "isSigner": true },
				{ "name": "systemProgram", "isMut": false, "isSigner": false },
				{ "name": "tokenProgram", "isMut": false, "isSigner": false },
				{ "name": "rent", "isMut": false, "isSigner": false }
			],
			"args": [
				{ "name": "whiteBotId", "type": "u16" },
				{ "name": "blackBotId", "type": "u16" },
				{ "name": "matchTime", "type": "i64" }
			]
		},
		{
			"name": "placeBet",
			"accounts": [
				{ "name": "programState", "isMut": true, "isSigner": false },
				{ "name": "chessMatch", "isMut": true, "isSigner": false },
				{ "name": "bet", "isMut": true, "isSigner": false },
				{ "name": "matchTreasury", "isMut": true, "isSigner": false },				{ "name": "bettor", "isMut": true, "isSigner": true },
				{
					"name": "bettorTokenAccount",
					"isMut": true,
					"isSigner": false
				},
				{ "name": "tokenMint", "isMut": false, "isSigner": false },
				{ "name": "systemProgram", "isMut": false, "isSigner": false },
				{ "name": "tokenProgram", "isMut": false, "isSigner": false },
				{ "name": "rent", "isMut": false, "isSigner": false }
			],
			"args": [
				{ "name": "amount", "type": "u64" },
				{ "name": "outcome", "type": { "defined": "MatchOutcome" } }
			]
		},
		{
			"name": "lockBets",
			"accounts": [
				{ "name": "chessMatch", "isMut": true, "isSigner": false },
				{ "name": "authority", "isMut": false, "isSigner": true }
			],
			"args": []
		},
		{
			"name": "resolveMatch",
			"accounts": [
				{ "name": "chessMatch", "isMut": true, "isSigner": false },
				{ "name": "authority", "isMut": false, "isSigner": true }
			],
			"args": [
				{ "name": "outcome", "type": { "defined": "MatchOutcome" } }
			]
		},
		{
			"name": "claimWinnings",
			"accounts": [
				{ "name": "programState", "isMut": true, "isSigner": false },
				{ "name": "chessMatch", "isMut": false, "isSigner": false },
				{ "name": "bet", "isMut": true, "isSigner": false },
				{ "name": "matchTreasury", "isMut": true, "isSigner": false },
				{ "name": "bettor", "isMut": true, "isSigner": true },
				{
					"name": "bettorTokenAccount",
					"isMut": true,
					"isSigner": false
				},
				{ "name": "tokenMint", "isMut": false, "isSigner": false },
				{ "name": "tokenProgram", "isMut": false, "isSigner": false }
			],
			"args": []
		},
		{
			"name": "withdrawFees",
			"accounts": [
				{ "name": "programState", "isMut": false, "isSigner": false },
				{ "name": "feeTreasury", "isMut": true, "isSigner": false },
				{ "name": "authority", "isMut": false, "isSigner": true },
				{
					"name": "recipientTokenAccount",
					"isMut": true,
					"isSigner": false
				},
				{ "name": "tokenProgram", "isMut": false, "isSigner": false }
			],
			"args": [{ "name": "amount", "type": "u64" }]
		}
	],
	"accounts": [
		{
			"name": "ProgramState",
			"type": {
				"kind": "struct",
				"fields": [
					{ "name": "authority", "type": "publicKey" },
					{ "name": "matchCount", "type": "u32" },
					{ "name": "totalBetAmount", "type": "u64" },
					{ "name": "totalFeesCollected", "type": "u64" },
					{ "name": "feePercentage", "type": "u8" }
				]
			}
		},
		{
			"name": "ChessMatch",
			"type": {
				"kind": "struct",
				"fields": [
					{ "name": "id", "type": "u32" },
					{ "name": "whiteBotId", "type": "u16" },
					{ "name": "blackBotId", "type": "u16" },
					{ "name": "startTime", "type": "i64" },
					{ "name": "endTime", "type": { "option": "i64" } },
					{ "name": "status", "type": { "defined": "MatchStatus" } },
					{
						"name": "result",
						"type": { "option": { "defined": "MatchOutcome" } }
					},
					{ "name": "whitePool", "type": "u64" },
					{ "name": "blackPool", "type": "u64" },
					{ "name": "drawPool", "type": "u64" },
					{ "name": "betsLocked", "type": "bool" },
					{ "name": "authority", "type": "publicKey" }
				]
			}
		},
		{
			"name": "Bet",
			"type": {
				"kind": "struct",
				"fields": [
					{ "name": "bettor", "type": "publicKey" },
					{ "name": "matchId", "type": "u32" },
					{ "name": "amount", "type": "u64" },
					{
						"name": "outcome",
						"type": { "defined": "MatchOutcome" }
					},
					{ "name": "timestamp", "type": "i64" },
					{ "name": "status", "type": { "defined": "BetStatus" } },
					{ "name": "claimed", "type": "bool" },
					{ "name": "payout", "type": { "option": "u64" } }
				]
			}
		}
	],
	"types": [
		{
			"name": "MatchStatus",
			"type": {
				"kind": "enum",
				"variants": [
					{ "name": "Scheduled" },
					{ "name": "InProgress" },
					{ "name": "Completed" },
					{ "name": "Cancelled" }
				]
			}
		},
		{
			"name": "MatchOutcome",
			"type": {
				"kind": "enum",
				"variants": [
					{ "name": "White" },
					{ "name": "Black" },					{ "name": "Draw" }
				]
			}
		},
		{
			"name": "BetStatus",
			"type": {
				"kind": "enum",
				"variants": [
					{ "name": "Active" },
					{ "name": "Won" },
					{ "name": "Lost" },
					{ "name": "Refunded" }
				]
			}
		}
	],
	"errors": [
		{ "code": 6000, "name": "Unauthorized", "msg": "Unauthorized action" },
		{
			"code": 6001,
			"name": "BettingClosed",
			"msg": "Betting is closed for this match"
		},
		{
			"code": 6002,
			"name": "MatchNotCompleted",
			"msg": "Match has not been completed yet"
		},
		{
			"code": 6003,
			"name": "BetsNotLocked",
			"msg": "Bets have not been locked"
		},
		{
			"code": 6004,
			"name": "AlreadyClaimed",
			"msg": "Winnings have already been claimed"
		},
		{
			"code": 6005,
			"name": "NoWinningPool",
			"msg": "No winning pool exists"
		},
		{
			"code": 6006,
			"name": "InsufficientFunds",
			"msg": "Insufficient funds"
		}
	]
}

export type AiChessBetting = typeof IDL;