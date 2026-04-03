import { Board, Mark, BoardPosition } from '../utils/constants';

export interface StartMessage {
    // The current state of the board.
    board: Board
    // The assignments of the marks to players for this round.
    marks: {[userID: string]: Mark | null}
    // Whose turn it is to play.
    mark: Mark
    // The deadline time by which the player must submit their move, or forfeit.
    deadline: number
}

// A game state update sent by the server to clients.
export interface UpdateMessage {
    // The current state of the board.
    board: Board
    // Whose turn it is to play.
    mark: Mark
    // The deadline time by which the player must submit their move, or forfeit.
    deadline: number
}

// Complete game round with winner announcement.
export interface DoneMessage {
    // The final state of the board.
    board: Board
    // The winner of the game, if any. Unspecified if it's a draw.
    winner: Mark | null
    // Winner board positions, if any. Used to display the row, column, or diagonal that won the game.
    // May be empty if it's a draw or the winner is by forfeit.
    winnerPositions: BoardPosition[] | null
    // Next round start time.
    nextGameStart: number
}

// A player intends to make a move.
export interface MoveMessage {
    // The position the player wants to place their mark in.
    position: BoardPosition;
}

// Payload for an RPC request to find a match.
export interface RpcFindMatchRequest {
    // User can choose a fast or normal speed match.
    fast: boolean
    // User can choose whether to play with AI
    ai?: boolean
}

// Payload for an RPC response containing match IDs the user can join.
export interface RpcFindMatchResponse {
    // One or more matches that fit the user's request.
    matchIds: string[]
}


export interface MatchLabel {
    open: number
    fast: number
}

export interface State {
    // Match label
    label: MatchLabel
    // Ticks where no actions have occurred.
    emptyTicks: number
    // Currently connected users, or reserved spaces.
    presences: {[userId: string]: nkruntime.Presence | null}
    // Number of users currently in the process of connecting to the match.
    joinsInProgress: number
    // True if there's a game currently in progress.
    playing: boolean
    // Current state of the board.
    board: Board
    // Mark assignments to player user IDs.
    marks: {[userId: string]: Mark | null}
    // Whose turn it currently is.
    mark: Mark
    // Ticks until they must submit their move.
    deadlineRemainingTicks: number
    // The winner of the current game.
    winner: Mark | null
    // The winner positions.
    winnerPositions: BoardPosition[] | null
    // Ticks until the next game starts, if applicable.
    nextGameRemainingTicks: number
    // AI playing mode
    ai: boolean
    // A move message from AI player
    aiMessage: nkruntime.MatchMessage | null
}