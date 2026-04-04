package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"github.com/heroiclabs/nakama-common/runtime"
)

func RpcFindMatch(
	ctx context.Context,
	logger runtime.Logger,
	db *sql.DB,
	nk runtime.NakamaModule,
	payload string,
) (string, error) {
	matchId, err := nk.MatchCreate(ctx, "tic-tac-toe", nil)
	if err != nil {
		return "", err
	}

	resp := map[string]string {
		"ok": "true",
		"matchId": matchId,
	}

	data, err := json.Marshal(resp)
	if err != nil {
		return "", err
	}

	return string(data), nil
}