export const gameServerConfig = {
    moduleName: "tic-tac-toe_js",
    tickRate: 5,
    maxEmptySec: 30,
    delaybetweenGamesSec: 5,
    turnTimeFastSec: 10,
    turnTimeNormalSec: 20,
} as const;

export enum Mark {
    UNDEFINED = 0,
    X = 1,
    O = 2,
}

// The complete set of opcodes used for communication between clients and server.
export enum OpCode {
	// New game round starting.
	START = 1,
	// Update to the state of an ongoing round.
	UPDATE = 2,
	// A game round has just completed.
	DONE = 3,
	// A move the player wishes to make and sends to the server.
	MOVE = 4,
	// Move was rejected.
	REJECTED = 5,
 	// Opponent has left the game.
    OPPONENT_LEFT = 6,
    // Invite AI player to join instead of the opponent who left the game.
    INVITE_AI = 7,
}

export type BoardPosition = 0|1|2|3|4|5|6|7|8
export type Board = (Mark|null)[]

export const winningPositions: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
]