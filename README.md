# Multiplayer Tic-Tac-Toe

A real-time multiplayer Tic-Tac-Toe game built with a server-authoritative architecture. The backend runs as a Go runtime plugin on [Nakama](https://heroiclabs.com/nakama/), an open-source game server, while the frontend is a React + TypeScript SPA. All game logic - move validation, turn enforcement, win/draw detection, and match lifecycle - is owned entirely by the server. The frontend acts purely as a rendering and input layer, communicating over a persistent WebSocket connection. The system is designed for correctness and reliability: clients cannot manipulate game state, and every edge case in the match lifecycle is handled explicitly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | [Nakama](https://heroiclabs.com/nakama/) with Go runtime plugin |
| Database | PostgreSQL (managed by Nakama) |
| Realtime | WebSockets via Nakama socket API |
| Matchmaking | Custom RPC (`find_match`) with in-memory queue |
| Deployment | - *(see Deployment section)* |

---

## Architecture

This project follows a **server-authoritative** model - the server owns the game state and the client has no ability to self-validate or modify it.

```
Client A                   Nakama Server                  Client B
   |                            |                              |
   |-- send move (opcode 4) --> |                              |
   |                      validate move                       |
   |                      update game state                   |
   |<-- broadcast UPDATE (opcode 2) -----------------------> |
   |                            |                              |
   |              (on win/draw) broadcast DONE (opcode 3)     |
   |<---------------------------------------- opcode 3 -----> |
```

- The client sends a move via `sendMatchState` with opcode `MOVE (4)`.
- The server validates turn ownership and cell availability; invalid moves are rejected with opcode `REJECTED (5)`.
- On a valid move, the server updates the board, detects win/draw, and broadcasts the new state to all players.
- The frontend only renders what the server sends - it never computes game outcome independently.

### Opcodes

| Opcode | Name | Direction | Description |
|---|---|---|---|
| 1 | `START` | Server → Client | Match started, initial state |
| 2 | `UPDATE` | Server → Client | Board updated after a valid move |
| 3 | `DONE` | Server → Client | Game over (win or draw) |
| 4 | `MOVE` | Client → Server | Player submits a move |
| 5 | `REJECTED` | Server → Client | Move was invalid |
| 6 | `OPPONENT_LEFT` | Server → Client | Other player disconnected |

---

## Backend Design Decisions

**Server-authoritative model** - No game logic runs on the client. This prevents cheating and ensures both players always see a consistent state, regardless of network conditions.

**Nakama match lifecycle** - Rather than managing match state externally (e.g. in a database), the game state lives inside Nakama's authoritative match handler (`MatchInit`, `MatchJoin`, `MatchLoop`, `MatchLeave`, `MatchTerminate`). This eliminates manual cleanup and ensures state is always tied to a live match process.

**Simple queue over complex matchmaking** - A single `WaitingMatchId` variable acts as a lightweight FIFO queue. The first player creates a match and waits; the second player joins it. If the first player leaves the lobby before an opponent arrives, the match is terminated and the queue is cleared. This is intentionally simple and sufficient for 1v1.

**Clean lifecycle: `Playing → GameOver → Terminated`** - Once a win or draw is detected, the `gameOver` flag is set on the match state and no further moves are accepted. The match is terminated via `MatchTerminate` after the result is broadcast. This prevents ghost matches from persisting on the server.

**Move rejection on server** - The server validates every move before applying it. Moves that are out-of-turn, target occupied cells, or arrive after game end are rejected with opcode `REJECTED (5)` and never applied to the board.

---

## Edge Cases Handled

- **Invalid moves** - Out-of-turn and occupied-cell moves are rejected server-side; the client shows a brief error.
- **Player disconnect during game** - `MatchLeave` detects when a player exits mid-game and broadcasts `OPPONENT_LEFT (6)` to the remaining player, ending the match cleanly.
- **Lobby abandonment** - If a player leaves the waiting lobby before an opponent joins, the server clears `WaitingMatchId` and terminates the pending match, preventing stale matches from blocking new joiners.
- **No moves after game ends** - Once `gameOver` is set on server state, all move messages are dropped silently.
- **Two-player cap** - Matches are capped at 2 presences. A third join attempt will not be routed to an in-progress match.
- **Session expiry during gameplay** - The frontend only gates new RPC calls (find match) on session validity. An active socket connection is not interrupted by token expiry, so ongoing matches are not dropped.

---

## Additional Capabilities

- **Concurrent match isolation** - Each match runs as an independent Nakama authoritative match process. Multiple games can run simultaneously without shared state interference.
- **Reliable matchmaking** - The queue-based system guarantees that a player always joins an existing waiting match before a new one is created, avoiding duplicate empty matches.
- **UX feedback for all terminal states** - The frontend explicitly handles win, loss, draw, and opponent-left outcomes with distinct visual states, winning cell highlights, and result banners.
- **Pending move indicator** - Immediate visual feedback on the clicked cell while the move is in-flight to the server, masking perceived latency.

---

## Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) + [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) + Docker Compose

### Frontend

```bash
git clone https://github.com/your-username/multiplayer-tictactoe.git
cd multiplayer-tictactoe/frontend
pnpm install
pnpm dev
```

The frontend runs at `http://localhost:5173` by default.

### Backend (Nakama + PostgreSQL)

```bash
cd backend_go

# Build the Go plugin and start Nakama + Postgres
docker compose up --build
```

To rebuild the plugin after Go code changes without a full restart:

```bash
docker compose run --rm builder        # recompile backend.so
docker compose restart nakama          # hot-reload plugin
```

Nakama console is available at `http://localhost:7351` (admin / password).

> The frontend connects to Nakama at `127.0.0.1:7350` by default (`frontend/src/lib/nakama/client.ts`). Update this if deploying remotely.

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Deploy `frontend/` - set `VITE_NAKAMA_HOST` env var to your server URL |
| Nakama + Postgres | [Railway](https://railway.app) | Deploy using `backend_go/docker-compose.yml`; expose port `7350` (API) and `7351` (console) |

Update `frontend/src/lib/nakama/client.ts` with the correct host and port before deploying.

---

## Demo

The demo video covers a full game flow end-to-end:

- Two clients connecting and entering matchmaking
- Real-time move exchange and board sync
- Win, draw, and opponent-disconnect scenarios
- Session and connection handling

> *(Add demo video link here)*

---

## Notes

This project prioritises correctness, reliability, and clean system design over feature complexity. The goal was to build a stable, server-authoritative multiplayer system with proper lifecycle management - not just a working game, but one that handles failure cases and edge conditions gracefully.
