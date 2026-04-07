package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"backend_go/config"

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

func jsonErrorResponse(message string) (string, error) {
	response := map[string]string{
		"success": "false",
		"error":   message,
	}
	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func RpcHealthCheck(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	response := map[string]string{
		"status": "ok",
	}
	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}
	logger.Info("Health check called")
	return string(data), nil
}

func RpcFindMatch(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	var response map[string]string

	matchId := ""
	if config.WaitingMatchId == "" {
		var err error
		matchId, err = addMatch(ctx, nk)
		if err != nil {
			logger.Error("Error adding match: %v", err)
			return jsonErrorResponse(err.Error())
		}
		config.WaitingMatchId = matchId
	} else {
		matchId = config.WaitingMatchId
		config.WaitingMatchId = ""
	}

	response = map[string]string{
		"success": "true",
		"matchId": matchId,
	}

	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	logger.Info("Data: %s", string(data))
	return string(data), nil
}
