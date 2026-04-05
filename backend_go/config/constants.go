package config

type OpCode int64

const (
	// No opcode specified. Unused.
	OpCode_OPCODE_UNSPECIFIED OpCode = 0
	// New game round starting.
	OpCode_OPCODE_START OpCode = 1
	// Update to the state of an ongoing round.
	OpCode_OPCODE_UPDATE OpCode = 2
	// A game round has just completed.
	OpCode_OPCODE_DONE OpCode = 3
	// A move the player wishes to make and sends to the server.
	OpCode_OPCODE_MOVE OpCode = 4
	// Move was rejected.
	OpCode_OPCODE_REJECTED OpCode = 5
	// Opponent has left the game.
	OpCode_OPCODE_OPPONENT_LEFT OpCode = 6
)

type MarkMove int32

const (
	Mark_MARK_UNSPECIFIED MarkMove = 0
	Mark_MARK_X           MarkMove = 1
	Mark_MARK_O           MarkMove = 2
)

type Move struct {
	Position int `json:"position"`
}

// Constants for the match
const (
	MaxEmptyTicks int = 150
	TickRate      int = 1
)

var WinningPositions = [][]int32{
	{0, 1, 2},
	{3, 4, 5},
	{6, 7, 8},
	{0, 3, 6},
	{1, 4, 7},
	{2, 5, 8},
	{0, 4, 8},
	{2, 4, 6},
}
