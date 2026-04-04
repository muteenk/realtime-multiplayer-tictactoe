func (m *Match) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string) {
	state := &MatchState{Debug: true} // Define custom MatchState in the code as per your game's requirements
	tickRate := 1                     // Call MatchLoop() every 1s.
	label := "skill=100-150"          // Custom label that will be used to filter match listings.

	return state, tickRate, label
}
