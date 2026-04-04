package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(_ context.Context, logger runtime.Logger, _ *sql.DB, _ runtime.NakamaModule, initializer runtime.Initializer) error {
	if err := initializer.RegisterRpc("find_match", RpcFindMatch); err != nil {
		return err
	}

	logger.Info("Go RPC module loaded.")
	return nil
}

func rpcPing(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	response := map[string]string{
		"ok":  "true",
		"msg": "hello world",
	}

	data, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func main() {
	// Required entry point for Nakama Go plugin builds.
}
