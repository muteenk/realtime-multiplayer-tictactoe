package main

import (
	"backend_go/config"

	"github.com/heroiclabs/nakama-common/runtime"
)

type MatchState struct {
	joinsInProgress int
	presences       map[string]runtime.Presence
	gameRunning     bool
	gameOver        bool
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
