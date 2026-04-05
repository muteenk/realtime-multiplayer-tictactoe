package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

type MatchInfo struct {
	matchId   string
	presences int
}

var matches = make([]MatchInfo, 0)

func addMatch(
	ctx context.Context,
	nk runtime.NakamaModule,
) (string, error) {
	matchId, err := nk.MatchCreate(ctx, "tic-tac-toe", nil)
	if err != nil {
		return "", err
	}
	newMatch := MatchInfo{
		matchId:   matchId,
		presences: 0,
	}
	matches = append(matches, newMatch)
	return matchId, nil
}

func RpcFindMatch(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	var response map[string]string

	newMatchId := ""
	if len(matches) > 0 {
		for i := range matches {
			if matches[i].presences < 2 {
				matches[i].presences++
				newMatchId = matches[i].matchId
				break
			}
		}
	}

	logger.Info("New match ID: %s", newMatchId)

	if newMatchId == "" {
		var err error
		newMatchId, err = addMatch(ctx, nk)
		if err != nil {
			logger.Error("Error adding match: %v", err)
			response = map[string]string{
				"success": "false",
				"error":   err.Error(),
			}
			data, err := json.Marshal(response)
			if err != nil {
				return "", err
			}
			return string(data), nil
		}
	}

	logger.Info("New match ID 2: %s", newMatchId)

	response = map[string]string{
		"success": "true",
		"matchId": newMatchId,
	}

	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	logger.Info("Data: %s", string(data))
	return string(data), nil
}
