import { useCallback, useMemo, useState } from 'react'
import './ArenaGame.css'

type Player = 'X' | 'O'
type Cell = Player | null

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function checkOutcome(board: Cell[]): {
  winner: Player | null
  line: number[] | null
  full: boolean
} {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: [a, b, c], full: false }
    }
  }
  const full = board.every(Boolean)
  return { winner: null, line: null, full }
}

const CELL_KEYS = ['nw', 'n', 'ne', 'w', 'c', 'e', 'sw', 's', 'se'] as const

const emptyBoard = (): Cell[] =>
  Array.from({ length: 9 }, (): Cell => null)

export function ArenaGame() {
  const [board, setBoard] = useState<Cell[]>(emptyBoard)
  const [current, setCurrent] = useState<Player>('X')
  const { winner, line, full } = useMemo(() => checkOutcome(board), [board])
  const gameOver = winner !== null || full

  const status = useMemo(() => {
    if (winner) return `${winner} takes the match`
    if (full) return 'Draw — grid locked'
    return `${current}'s move`
  }, [winner, full, current])

  const play = useCallback(
    (index: number) => {
      if (board[index] || gameOver) return
      const next = [...board]
      next[index] = current
      setBoard(next)
      setCurrent((p) => (p === 'X' ? 'O' : 'X'))
    },
    [board, current, gameOver],
  )

  const reset = useCallback(() => {
    setBoard(emptyBoard())
    setCurrent('X')
  }, [])

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
            Neon arena · local duel (wire up sockets when ready)
          </p>
        </header>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-arena-border bg-arena-panel px-4 py-2 text-sm text-slate-300 shadow-[0_0_40px_-12px_rgba(99,102,241,0.35)] backdrop-blur-md">
            <span className="arena-live-dot size-2 rounded-full bg-emerald-400" aria-hidden />
            <span className="font-mono text-xs tracking-wider text-slate-400">
              ROOM
            </span>
            <span className="font-semibold tracking-wide text-slate-100">
              ARENA-7F2
            </span>
          </div>
          <div className="flex gap-2 rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur-sm">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${current === 'X' && !gameOver ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]' : 'text-slate-500'}`}
            >
              You · X
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${current === 'O' && !gameOver ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-[0_0_20px_rgba(232,121,249,0.35)]' : 'text-slate-500'}`}
            >
              Guest · O
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-arena-border bg-arena-panel p-5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
          <div className="mb-5 flex flex-col items-center gap-1 border-b border-white/5 pb-5 text-center">
            <p className="text-lg font-semibold text-slate-100" role="status" aria-live="polite">
              {status}
            </p>
            <p className="text-sm text-mute">Tap a cell to claim it</p>
          </div>

          <div
            className="mx-auto grid max-w-[min(100%,320px)] grid-cols-3 gap-2.5 sm:gap-3"
            role="grid"
            aria-label="Tic tac toe board"
          >
            {board.map((cell, i) => {
              const isWin = line?.includes(i) ?? false
              const pos = String(i + 1)
              const mark = cell ? `, ${cell}` : ', empty'
              return (
                <button
                  key={CELL_KEYS[i]}
                  type="button"
                  role="gridcell"
                  aria-label={'Cell ' + pos + mark}
                  disabled={Boolean(cell) || gameOver}
                  onClick={() => play(i)}
                  className={[
                    'flex aspect-square items-center justify-center rounded-2xl border text-4xl font-bold transition-all sm:text-5xl',
                    'border-cyan-500/15 bg-linear-to-b from-white/7 to-white/2',
                    'hover:border-cyan-400/35 hover:shadow-[0_0_28px_-4px_rgba(34,211,238,0.25)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/60',
                    'disabled:cursor-default disabled:hover:border-cyan-500/15 disabled:hover:shadow-none',
                    isWin
                      ? 'board-cell-win border-amber-400/50 bg-amber-500/10 text-amber-100'
                      : '',
                    cell === 'X' && !isWin
                      ? 'text-cyan-300 [text-shadow:0_0_24px_rgba(34,211,238,0.55)]'
                      : '',
                    cell === 'O' && !isWin
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

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-neon-gold/40 bg-neon-gold/10 px-6 py-2.5 text-sm font-semibold text-neon-gold transition hover:bg-neon-gold/20 hover:shadow-[0_0_28px_rgba(251,191,36,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon-gold/70"
            >
              New match
            </button>
          </div>
        </div>

        <footer className="mt-auto pt-10 text-center text-xs text-slate-600">
          X glows cyan · O glows magenta · winning row pulses gold
        </footer>
      </div>
    </>
  )
}
