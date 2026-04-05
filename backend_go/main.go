package main

import (
	"context"
	"database/sql"

	// "time"

	"github.com/heroiclabs/nakama-common/runtime"
	"google.golang.org/protobuf/encoding/protojson"
)

func InitModule(_ context.Context, logger runtime.Logger, _ *sql.DB, _ runtime.NakamaModule, initializer runtime.Initializer) error {
	// initStart := time.Now()

	marshaler := &protojson.MarshalOptions{
		UseEnumNumbers: true,
	}
	unmarshaler := &protojson.UnmarshalOptions{
		DiscardUnknown: false,
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
		return &MatchHandler{
			marshaler:   marshaler,
			unmarshaler: unmarshaler,
		}, nil
	}); err != nil {
		return err
	}

	logger.Info("Go RPC module loaded.")
	return nil
}

func main() {
	// Required entry point for Nakama Go plugin builds.
}
