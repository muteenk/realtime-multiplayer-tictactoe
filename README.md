# Multiplayer Tic-Tac-Toe

Real-time multiplayer Tic-Tac-Toe with a **server-authoritative** backend: game rules, turns, and outcomes live in a [Nakama](https://heroiclabs.com/nakama/) Go runtime plugin; the React + TypeScript client only renders state and sends moves over WebSockets. Matchmaking is a small RPC-backed queue; the focus is reliable lifecycle handling and consistent state for both players.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | [Nakama](https://heroiclabs.com/nakama/) with Go runtime plugin |
| Database | PostgreSQL (used by Nakama) |
| Realtime | WebSockets (Nakama socket API) |
| Matchmaking | Custom RPC (`find_match`) + in-memory waiting match id |
| Deployment | [Vercel](https://vercel.com) (frontend) · [DigitalOcean](https://www.digitalocean.com/) (Nakama + Postgres) |

---

## Local setup

### Prerequisites

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) and Docker Compose

### Clone and run the frontend

```bash
git clone https://github.com/muteenk/realtime-multiplayer-tictactoe.git
cd realtime-multiplayer-tictactoe/frontend
pnpm install
```

Create `frontend/.env.local` so Vite can reach Nakama (values are read at dev/build time; see `frontend/src/lib/nakama/client.ts`):

```.env.local
VITE_NAKAMA_HOST=127.0.0.1
VITE_NAKAMA_SSL=false
```

Optional: For a remote HTTPS Nakama URL, set `VITE_NAKAMA_SSL=true` and the correct host.

Then:

```bash
pnpm dev
```

The app is served at `http://localhost:5173` by default.

### Run Nakama + PostgreSQL (backend)

```bash
cd backend_go
docker compose up --build
```

- **HTTP API / WebSocket:** `http://127.0.0.1:7350`
- **Console:** `http://127.0.0.1:7351` (credentials from `backend_go/local.yml`)

After changing Go code, rebuild the plugin and restart Nakama:

```bash
docker compose run --rm builder
docker compose restart nakama
```

---

## Deployment

This project is deployed as follows:

| Piece | Where it runs | Live URL |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | [https://realtime-multiplayer-tictactoe.vercel.app/](https://realtime-multiplayer-tictactoe.vercel.app/) |
| Nakama + PostgreSQL | [DigitalOcean](https://www.digitalocean.com/) | [https://tictactoe.jiroshi.com/](https://tictactoe.jiroshi.com/) |

The backend uses a subdomain on **`jiroshi.com`** because that domain was already owned for another personal project; pointing `tictactoe.jiroshi.com` at DigitalOcean avoids registering a separate domain and keeps DNS simple.

**Production frontend env (Vercel):** point the app at the deployed Nakama host, e.g. `VITE_NAKAMA_HOST=tictactoe.jiroshi.com`, `VITE_NAKAMA_SSL=true` (and `VITE_NAKAMA_PORT` only if you are not on the default HTTPS port). Redeploy after changing `VITE_*` so Vite embeds the new values.

**Health check RPC:** `health_check` can be used for uptime pings or cold-start wake against the backend base URL (e.g. `POST` to Nakama’s RPC endpoint for `health_check`, with the HTTP key your server expects).

**Self-hosting:** you can still run the stack locally or on another host using `backend_go/docker-compose.yml`; expose **7350** (API + WebSocket) and optionally **7351** (console-restrict in production).

---

## Architecture

The server owns all game state. Clients send moves; the server validates, updates state, and broadcasts to everyone in the match. The UI is a thin layer over socket messages and RPC responses.

```
Client A                   Nakama Server                  Client B
   |                            |                              |
   |-- MOVE (opcode 4) -------> |                              |
   |                      validate + update state              |
   |<-- UPDATE (opcode 2) ----------------------------------> |
   |              on win/draw: DONE (opcode 3)                 |
```

| Opcode | Name | Direction | Role |
|---|---|---|---|
| 1 | `START` | Server → Client | Match started, initial state |
| 2 | `UPDATE` | Server → Client | Board after a valid move |
| 3 | `DONE` | Server → Client | Game over (win or draw) |
| 4 | `MOVE` | Client → Server | Player move |
| 5 | `REJECTED` | Server → Client | Invalid move |
| 6 | `OPPONENT_LEFT` | Server → Client | Other player left |

---

## Backend design decisions

The backend is built so **truth lives in one place**: the server decides what is legal, what the board is, and when a match is over. Clients are untrusted inputs, not co-equal peers.

- **Server-authoritative by default** - The client never “wins” an argument about the rules. Move validation, turn order, and win/draw detection run only in the Go match handler, so a modified client cannot force illegal wins or rewrite history. That is the main defense against cheating and the main guarantee that both players see the same game.

- **Nakama’s match lifecycle as the spine** - Game state is owned by the authoritative match (`MatchInit`, `MatchJoin`, `MatchLoop`, `MatchLeave`, termination), not scattered across custom tables or hand-rolled processes. Join, tick, and leave all go through one pipeline, which makes cleanup and reasoning about “what happens when someone drops?” tractable.

- **Intentionally minimal matchmaking (`WaitingMatchId`)** - For 1v1, a small FIFO queue is enough: first caller creates a match and waits, second caller consumes it. No heavyweight matcher service-less surface area, fewer failure modes, and a clear story for assignments and stale lobbies.

- **Explicit phases: playing → game over → terminated** - Once there is a result, the match is finished in the server’s model: `gameOver` blocks further play, outcomes are broadcast, and the match can end. That avoids ambiguous “half-open” games and ghost matches that never close.

- **Reject early, apply never** - Invalid input (wrong turn, occupied square, moves after game over) returns `REJECTED` and **does not** touch persisted match state. The board only changes on paths the server has already validated.

---

## Edge cases handled

- Invalid moves (wrong turn, occupied cell) - rejected on the server.
- Disconnect mid-game - remaining player notified (`OPPONENT_LEFT`).
- Lobby leave before opponent joins - waiting match cleared and match torn down where implemented.
- No moves after game over - server ignores further move messages.
- Two players per match - enforced in match join / loop logic.
- Session vs gameplay - new RPCs can be gated on session freshness without tearing down an active socket solely because the JWT expired (see app wiring).

---

## Additional capabilities

- Multiple concurrent matches via Nakama’s per-match isolation.
- Straightforward queue-style matchmaking for two players.
- Clear UX for win, loss, draw, and opponent left; optional pending-move feedback for latency.

---

## Demo

A short walkthrough can show: real-time play, matchmaking, win/draw, and disconnect behaviour. *(Add your video link here.)*

---

## Notes

This project emphasises correctness, reliability, and clear lifecycle behaviour over feature sprawl: a small, server-authoritative multiplayer slice that is predictable to run and reason about.
