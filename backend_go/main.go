package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

func InitModule(_ context.Context, logger runtime.Logger, _ *sql.DB, _ runtime.NakamaModule, initializer runtime.Initializer) error {

	if err := initializer.RegisterRpc("health_check", RpcHealthCheck); err != nil {
		return err
	}

	if err := initializer.RegisterRpc("find_match", RpcFindMatch); err != nil {
		return err
	}

	if err := initializer.RegisterMatch("tic-tac-toe", func(
		ctx context.Context,
		logger runtime.Logger,
		db *sql.DB,
		nk runtime.NakamaModule,
	) (runtime.Match, error) {
		return &MatchHandler{}, nil
	}); err != nil {
		return err
	}

	logger.Info("Go RPC module loaded.")
	return nil
}

func main() {
	// Might add plugins later
}
