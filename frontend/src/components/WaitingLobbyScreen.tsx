import { useEffect } from 'react'
import type { Socket } from '@heroiclabs/nakama-js'

type Props = Readonly<{
  matchId: string | null
  socket: Socket | null
  userId: string | null
  myMark: number | null
  turn: boolean | null
  setUserId: (userId: string) => void
  setMyMark: (myMark: number) => void
  setTurn: (turn: boolean) => void
  onBackToFindMatch: () => void
  onEnterArena: () => void
}>

export function WaitingLobbyScreen({
  matchId,
  socket,
  setUserId,
  userId,
  myMark,
  turn,
  setMyMark,
  setTurn,
  onBackToFindMatch,
  onEnterArena,
}: Props) {

  useEffect(() => {
    if (!socket || !matchId) return

    let cancelled = false
    const previousOnMatchData = socket.onmatchdata
    const decoder = new TextDecoder()

    const joinAndListen = async () => {
      socket.onmatchdata = (msg) => {
        if (msg.match_id !== matchId) return
        if (msg.op_code === 1) {
          const text = decoder.decode(msg.data)
          const parsed = JSON.parse(text)
          console.log('parsed', parsed)
          setMyMark(parsed.presences[userId as keyof typeof parsed.presences] ?? 0)
          setTurn(parsed.turn)
        }
      }

      const joinedMatch = await socket.joinMatch(matchId)
      setUserId(joinedMatch.self.user_id)
      if (cancelled) return

      // Fallback in case START was emitted before event handler settled.
      if (joinedMatch.size >= 2) {
        onEnterArena()
      }
    }

    joinAndListen().catch((error) => {
      console.error('Error joining waiting match', error)
    })

    return () => {
      cancelled = true
      socket.onmatchdata = previousOnMatchData
    }
  }, [socket, matchId, onEnterArena])

  
  useEffect(() => {
    if (myMark && turn === true) {
      onEnterArena()
    }
  }, [myMark, turn, onEnterArena])

  return (
    <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <div className="w-full rounded-3xl border border-arena-border bg-arena-panel p-6 text-center shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
        <p className="mb-2 font-medium tracking-[0.35em] text-xs uppercase text-slate-500">
          Lobby
        </p>
        <h1 className="bg-linear-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text font-bold text-3xl tracking-tight text-transparent sm:text-4xl">
          Waiting for player
        </h1>
        <p className="mt-3 break-all font-mono text-xs text-slate-300">{matchId}</p>
        <p className="mt-4 text-sm text-slate-400">
          Match created. Waiting for the second player to join.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToFindMatch}
            className="rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            Back to find match
          </button>
          {/* <button
            type="button"
            onClick={onEnterArena}
            className="rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/15 px-4 py-2.5 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25"
          >
            Enter arena
          </button> */}
        </div>
      </div>
    </div>
  )
}
