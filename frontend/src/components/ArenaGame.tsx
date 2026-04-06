import { useCallback, useEffect, useState } from 'react'
import type { Socket } from '@heroiclabs/nakama-js'
import './ArenaGame.css'

type Mark = 'X' | 'O'
type Cell = Mark | null

const CELL_KEYS = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'] as const

const emptyBoard = (): Cell[] =>
  Array.from({ length: 9 }, (): Cell => null)

const OP_CODE_START = 1
const OP_CODE_UPDATE = 2
const OP_CODE_DONE = 3
const OP_CODE_MOVE = 4
const OP_CODE_REJECTED = 5
const OP_CODE_OPPONENT_LEFT = 6
const WINNING_LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

type ServerPayload = {
  board?: number[]
  markToMove?: number
  presences?: Record<string, number>
}

type GameDonePayload = {
  winner: number
}

type ArenaGameProps = Readonly<{
  matchId: string | null
  socket: Socket
  userId: string
  myMark: number | null
  turn: number | null
  setTurn: (turn: number) => void
  setMyMark: (myMark: number) => void
  onBackToLobby?: () => void
}>

const toCell = (mark?: number): Cell => {
  if (mark === 1) return 'X'
  if (mark === 2) return 'O'
  return null
}

export function ArenaGame({ 
  matchId, 
  socket, 
  userId, 
  myMark, 
  turn,
  setMyMark,
  setTurn,
  onBackToLobby 
}: ArenaGameProps) {
  const [board, setBoard] = useState<Cell[]>(emptyBoard)
  const [gameDone, setGameDone] = useState(false)
  const [opponentLeft, setOpponentLeft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [winner, setWinner] = useState<number | null>(null)

  const isMyTurn = () => {
    if (!myMark || !turn || gameDone || opponentLeft) return false
    return (myMark === 1 && turn === 1) || (myMark === 2 && turn === 2)
  }

  const winningLine = (() => {
    if (!gameDone || winner === null || winner === 0) return null
    const winningMark = winner === 1 ? 'X' : 'O'
    for (const line of WINNING_LINES) {
      if (line.every((idx) => board[idx] === winningMark)) {
        return line
      }
    }
    return null
  })()

  let resultToneClass = 'border border-rose-400/40 bg-rose-500/15 text-rose-200'
  let resultText = 'You lost this round.'
  if (winner === 0) {
    resultToneClass = 'border border-slate-400/30 bg-slate-500/10 text-slate-200'
    resultText = 'Match ended in a draw.'
  } else if (winner === myMark || opponentLeft) {
    resultToneClass = 'border border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
    resultText = 'You won this round!'
  }

  const status = () => {
    if (opponentLeft) return 'Opponent left the match'
    if (gameDone) {
      if (winner === 1) return (myMark === 1 ? 'You win' : 'Opponent wins')
      if (winner === 2) return (myMark === 2 ? 'You win' : 'Opponent wins')
      if (winner === 0) return 'Draw'
      return 'Round complete'
    }
    if (!myMark) return 'Waiting for game start...'
    return isMyTurn() ? 'Your move' : 'Opponent move'
  }

  useEffect(() => {
    if (!matchId) return

    const previousOnMatchData = socket.onmatchdata
    const decoder = new TextDecoder()

    const applyPayload = (payload: ServerPayload) => {
      if (Array.isArray(payload.board) && payload.board.length === 9) {
        setBoard(payload.board.map((m) => toCell(m)))
      }
      if (payload.markToMove !== undefined) {
        setTurn(payload.markToMove ?? 0)
      }
      if (payload.presences) {
        setMyMark(payload.presences[userId] ?? 0)
      }
      setError(null)
    }

    socket.onmatchdata = (msg) => {
      if (msg.match_id !== matchId) return
      console.log('msg', msg)
      if (msg.op_code === OP_CODE_OPPONENT_LEFT) {
        setOpponentLeft(true)
        setGameDone(true)
        return
      }
      if (msg.op_code === OP_CODE_REJECTED) {
        setError('Move rejected by server')
        return
      }
      if (msg.op_code === OP_CODE_DONE) {
        setGameDone(true)
        try {
          const text = decoder.decode(msg.data)
          const parsed = JSON.parse(text) as GameDonePayload
          if (parsed.winner === 1 || parsed.winner === 2 || parsed.winner === 0) {
            setWinner(parsed.winner)
          } else {
            setWinner(null)
          }
        } catch (e) {
          console.error('Failed to parse game done payload', e)
          setWinner(null)
        }
        return
      }
      if (msg.op_code !== OP_CODE_START && msg.op_code !== OP_CODE_UPDATE) {
        return
      }

      try {
        const text = decoder.decode(msg.data)
        const parsed = JSON.parse(text) as ServerPayload
        applyPayload(parsed)
        if (msg.op_code === OP_CODE_START) {
          setGameDone(false)
          setOpponentLeft(false)
        }
      } catch (e) {
        console.error('Failed to parse match data', e)
        setError('Failed to parse game state update')
      }
    }

    return () => {
      socket.onmatchdata = previousOnMatchData
    }
  }, [socket, matchId, userId])

  const play = useCallback(
    async (index: number) => {
      if (!matchId || !myMark || !turn) return
      if (opponentLeft || gameDone) return
      if (!isMyTurn()) return
      if (board[index]) return

      try {
        const payload = new TextEncoder().encode(JSON.stringify({ position: index }))
        await socket.sendMatchState(matchId, OP_CODE_MOVE, payload)
      } catch (e) {
        console.error('Failed to send move', e)
        setError('Failed to send move')
      }
    },
    [socket, matchId, myMark, turn, opponentLeft, gameDone, board, isMyTurn],
  )

  return (
    <>
      <div className="arena-grid-bg" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <header className="mb-8 text-center sm:mb-10">
          <p className="mb-2 font-medium tracking-[0.35em] text-xs uppercase text-slate-500">
            Multiplayer
          </p>
          <h1 className="bg-linear-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text font-bold text-4xl tracking-tight text-transparent sm:text-5xl">
            Tic Tac Toe
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Neon arena · authoritative realtime
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex max-w-full items-start gap-2 rounded-2xl border border-arena-border bg-arena-panel px-3 py-2 text-sm text-slate-300 shadow-[0_0_40px_-12px_rgba(99,102,241,0.35)] backdrop-blur-md sm:items-center sm:rounded-full sm:px-4">
            <span className="arena-live-dot mt-1 size-2 rounded-full bg-emerald-400 sm:mt-0" aria-hidden />
            <span className="shrink-0 font-mono text-xs tracking-wider text-slate-400">
              MATCH
            </span>
            <span
              className="max-w-[min(100%,18rem)] break-all font-mono text-xs leading-5 text-slate-100 sm:text-sm"
              title={matchId ?? undefined}
            >
              {matchId ?? 'Find a match to start playing.'}
            </span>
          </div>
          {onBackToLobby && (
            <button
              type="button"
              onClick={async () => {
                if (matchId && socket){
                  await socket.leaveMatch(matchId)
                } 
                onBackToLobby?.()
              }}
              className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              Find match
            </button>
          )}
          <div className="flex gap-2 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-sm">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${turn === 1 && !gameDone ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]' : 'text-slate-500'}`}
            >
              {myMark === 1 ? 'You · X' : 'Opponent · X'}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${turn === 2 && !gameDone ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.35)]' : 'text-slate-500'}`}
            >
              {myMark === 2 ? 'You · O' : 'Opponent · O'}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-arena-border bg-arena-panel p-5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex flex-col items-center gap-1 border-b border-white/5 pb-5 text-center">
            <p className="text-lg font-semibold text-slate-100" role="status" aria-live="polite">
              {status()}
            </p>
            <p className="text-sm text-mute">Tap a cell to send your move</p>
            {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
            {gameDone && (
              <div className={['mt-3 rounded-xl px-4 py-2 text-sm font-semibold', resultToneClass].join(' ')}>
                {resultText}
              </div>
            )}
          </div>

          <div
            className="mx-auto grid max-w-[min(100%,320px)] grid-cols-3 gap-2.5 sm:gap-3"
            role="grid"
            aria-label="Tic tac toe board"
          >
            {board.map((cell, i) => {
              const pos = String(i + 1)
              const mark = cell ? `, ${cell}` : ', empty'
              const isWinningCell = winningLine?.includes(i) ?? false
              return (
                <button
                  key={CELL_KEYS[i]}
                  type="button"
                  role="gridcell"
                  aria-label={'Cell ' + pos + mark}
                  disabled={
                    Boolean(cell) ||
                    gameDone ||
                    opponentLeft ||
                    !myMark ||
                    !isMyTurn()
                  }
                  onClick={() => play(i)}
                  className={[
                    'flex aspect-square items-center justify-center rounded-2xl border text-4xl font-bold transition-all sm:text-5xl',
                    'border-cyan-500/15 bg-linear-to-b from-white/7 to-white/2',
                    'hover:border-cyan-400/35 hover:shadow-[0_0_28px_-4px_rgba(34,211,238,0.25)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/60',
                    'disabled:cursor-default disabled:hover:border-cyan-500/15 disabled:hover:shadow-none',
                    isWinningCell
                      ? 'board-cell-win border-amber-400/60 bg-amber-500/10 text-amber-100'
                      : '',
                    cell === 'X'
                      ? 'text-cyan-300 [text-shadow:0_0_24px_rgba(34,211,238,0.55)]'
                      : '',
                    cell === 'O'
                      ? 'text-fuchsia-300 [text-shadow:0_0_24px_rgba(232,121,249,0.55)]'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {cell ? (
                    <span className="board-cell-mark">{cell}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <footer className="mt-auto pt-10 text-center text-xs text-slate-600">
          Server validates turns and broadcasts board updates
        </footer>
      </div>
    </>
  )
}
