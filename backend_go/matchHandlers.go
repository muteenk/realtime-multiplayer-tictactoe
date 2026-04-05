package main

import (
	"backend_go/config"
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/encoding/protojson"
)

type MatchHandler struct {
	marshaler   *protojson.MarshalOptions
	unmarshaler *protojson.UnmarshalOptions
}

type GameUpdateMessage struct {
	Board      []config.MarkMove          `json:"board"`
	MarkToMove config.MarkMove            `json:"markToMove"`
	Presences  map[string]config.MarkMove `json:"presences"`
}

type GameDoneMessage struct {
	Winner config.MarkMove `json:"winner"`
}

type MatchState struct {
	joinsInProgress int
	presences       map[string]runtime.Presence
	gameRunning     bool
	emptyTicks      int

	board       []config.MarkMove
	playerMarks map[string]config.MarkMove
	markToMove  config.MarkMove
	winner      config.MarkMove
}

func (s *MatchState) ConnectedCount() int {
	count := 0
	for _, presence := range s.presences {
		if presence != nil {
			count++
		}
	}
	return count
}

func (s *MatchState) checkForWinner(movedMark config.MarkMove) bool {
	matchFound := false
	for _, winPos := range config.WinningPositions {
		for _, pos := range winPos {
			if s.board[pos] != movedMark {
				matchFound = false
				break
			} else {
				matchFound = true
			}
		}
		if matchFound {
			break
		}
	}
	return matchFound
}

func (s *MatchState) getActivePresences() []runtime.Presence {
	var activePresences []runtime.Presence
	for _, presence := range s.presences {
		if presence != nil {
			activePresences = append(activePresences, presence)
		}
	}
	return activePresences
}

func (m *MatchHandler) MatchInit(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	params map[string]interface{},
) (interface{}, int, string) {
	state := &MatchState{
		presences: make(map[string]runtime.Presence, 2),
	} // Define custom MatchState in the code as per your game's requirements
	// tickRate := config.TickRate
	label := "skill=100-150" // Custom label that will be used to filter match listings.

	return state, config.TickRate, label
}

func (m *MatchHandler) MatchJoinAttempt(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	presence runtime.Presence,
	metadata map[string]string,
) (interface{}, bool, string) {
	s := state.(*MatchState)

	// Match full check
	if len(s.presences)+s.joinsInProgress >= 2 {
		return s, false, "match full"
	}

	s.joinsInProgress++
	return s, true, ""
}

func (m *MatchHandler) MatchJoin(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	presences []runtime.Presence,
) interface{} {
	s := state.(*MatchState)
	for _, p := range presences {
		s.presences[p.GetUserId()] = p
		s.joinsInProgress--
	}
	return s
}

func (m *MatchHandler) MatchLeave(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	presences []runtime.Presence,
) interface{} {
	s := state.(*MatchState)
	for _, presence := range presences {
		s.presences[presence.GetUserId()] = nil
	}

	var remainingPlayers []runtime.Presence
	for _, presence := range s.presences {
		if presence != nil {
			remainingPlayers = append(remainingPlayers, presence)
		}
	}

	if len(remainingPlayers) > 0 {
		dispatcher.BroadcastMessage(
			int64(config.OpCode_OPCODE_OPPONENT_LEFT),
			nil, remainingPlayers, nil, true,
		)
	}
	return s
}

func (m *MatchHandler) MatchLoop(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	dispatcher runtime.MatchDispatcher,
	tick int64,
	state interface{},
	messages []runtime.MatchData,
) interface{} {
	s := state.(*MatchState)

	if s.ConnectedCount()+s.joinsInProgress == 0 {
		s.emptyTicks++
		if s.emptyTicks >= config.MaxEmptyTicks*config.TickRate {
			logger.Info("Server idle for too long, terminating match")
			return nil
		}
	}

	if !s.gameRunning {
		// Purge any disconnected players
		for userIdx, presence := range s.presences {
			if presence == nil {
				delete(s.presences, userIdx)
			}
			dispatcher.BroadcastMessage(
				int64(config.OpCode_OPCODE_OPPONENT_LEFT),
				nil, []runtime.Presence{presence}, nil, true,
			)
		}

		activePresences := s.getActivePresences()

		// Check if we have enough players to start the game
		if len(activePresences) < 2 {
			return s
		}

		// Initialize the game state
		s.gameRunning = true
		marks := []config.MarkMove{config.Mark_MARK_X, config.Mark_MARK_O}
		s.board = make([]config.MarkMove, 9)

		s.markToMove = marks[0]
		s.playerMarks = make(map[string]config.MarkMove, 2)
		for _, presence := range activePresences {
			s.playerMarks[presence.GetUserId()] = marks[0]
			marks = marks[1:]
		}

		startMsg := GameUpdateMessage{
			Board:      s.board,
			MarkToMove: s.markToMove,
			Presences:  s.playerMarks,
		}

		data, err := json.Marshal(startMsg)
		if err != nil {
			logger.Error("Failed to marshal start message: %s", err)
			return s
		}

		// Broadcast the start message to all players
		dispatcher.BroadcastMessage(
			int64(config.OpCode_OPCODE_START),
			data, activePresences, nil, true,
		)

		return s
	}

	if s.gameRunning {
		// Board Fill check
		boardFilled := true
		for _, pos := range s.board {
			if pos != config.Mark_MARK_X && pos != config.Mark_MARK_O {
				boardFilled = false
				break
			}
		}
		if boardFilled {
			var activePresences []runtime.Presence
			for _, presence := range s.presences {
				if presence != nil {
					activePresences = append(activePresences, presence)
				}
			}
			logger.Info("DRAW: Board filled, game over")
			doneMsg := GameDoneMessage{
				Winner: config.Mark_MARK_UNSPECIFIED,
			}
			data, err := json.Marshal(doneMsg)
			if err != nil {
				logger.Error("Failed to marshal draw done message: %s", err)
				return s
			}
			dispatcher.BroadcastMessage(
				int64(config.OpCode_OPCODE_DONE),
				data, activePresences, nil, true,
			)
			s.gameRunning = false
			s.winner = config.Mark_MARK_UNSPECIFIED
			return s
		}
	}

	for _, msg := range messages {
		switch msg.GetOpCode() {
		case int64(config.OpCode_OPCODE_MOVE):
			mark := s.playerMarks[msg.GetUserId()]
			if s.markToMove != mark {
				// Not the player's turn
				dispatcher.BroadcastMessage(
					int64(config.OpCode_OPCODE_REJECTED),
					nil, []runtime.Presence{msg}, nil, true,
				)
				continue
			}

			move := &config.Move{}
			err := json.Unmarshal(msg.GetData(), move)
			if err != nil {
				logger.Error("Failed to unmarshal move: %s", err)
				dispatcher.BroadcastMessage(
					int64(config.OpCode_OPCODE_REJECTED),
					nil, []runtime.Presence{msg}, nil, true,
				)
				continue
			}

			// Invalid move check
			if move.Position < 0 || move.Position > 8 || s.board[move.Position] != config.Mark_MARK_UNSPECIFIED {
				logger.Error("Invalid move position: %d", move.Position)
				dispatcher.BroadcastMessage(
					int64(config.OpCode_OPCODE_REJECTED),
					nil, []runtime.Presence{msg}, nil, true,
				)
				continue
			}

			s.board[move.Position] = mark

			// Check for win
			if s.checkForWinner(mark) {
				doneMsg := GameDoneMessage{
					Winner: mark,
				}
				data, err := json.Marshal(doneMsg)
				if err != nil {
					logger.Error("Failed to marshal done message: %s", err)
					continue
				}
				dispatcher.BroadcastMessage(
					int64(config.OpCode_OPCODE_DONE),
					data, s.getActivePresences(), nil, true,
				)
				s.gameRunning = false
				s.winner = mark
				return s
			}

			switch mark {
			case config.Mark_MARK_X:
				s.markToMove = config.Mark_MARK_O
			case config.Mark_MARK_O:
				s.markToMove = config.Mark_MARK_X
			}

			updateMsg := GameUpdateMessage{
				Board:      s.board,
				MarkToMove: s.markToMove,
				Presences:  s.playerMarks,
			}
			data, err := json.Marshal(updateMsg)
			if err != nil {
				logger.Error("Failed to marshal update message: %s", err)
				continue
			}
			dispatcher.BroadcastMessage(
				int64(config.OpCode_OPCODE_UPDATE),
				data, s.getActivePresences(), nil, true,
			)

		default:
			logger.Error("Received unknown message type: %d", msg.GetOpCode())
		}
	}

	return s
}

func (m *MatchHandler) MatchSignal(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, data string) (interface{}, string) {
	return state, ""
}

func (m *MatchHandler) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	return state
}

// func calculateDeadlineTicks(l *MatchLabel) int64 {
// 	if l.Fast == 1 {
// 		return turnTimeFastSec * tickRate
// 	} else {
// 		return turnTimeNormalSec * tickRate
// 	}
// }
