import { useCallback, useState } from 'react'
import type { Session } from '@heroiclabs/nakama-js'
import { describeError } from '../lib/errors'
import { findMatchRpc } from '../lib/nakama/gameRpc'

type Props = Readonly<{
  session: Session
  onEnterArena: (matchId: string) => void
}>

export function FindMatchScreen({ session, onEnterArena }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchId, setMatchId] = useState<string | null>(null)

  const handleFindMatch = useCallback(async () => {
    setError(null)
    setMatchId(null)

    setLoading(true)
    try {
      const res = await findMatchRpc(session)
      setMatchId(res.matchId)
      onEnterArena(res.matchId)
    } catch (e) {
      setError(describeError(e))
    } finally {
      setLoading(false)
    }
  }, [session, onEnterArena])

  const primaryId = matchId

  return (
    <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-8 text-center sm:mb-10">
        <p className="mb-2 font-medium tracking-[0.35em] text-xs uppercase text-slate-500">
          Matchmaking
        </p>
        <h1 className="bg-linear-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text font-bold text-3xl tracking-tight text-transparent sm:text-4xl">
          Find a match
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the arena by <span className="font-mono text-cyan-300/90">finding a match</span>
        </p>
      </header>

      <div className="rounded-3xl border border-arena-border bg-arena-panel p-5 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-7">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/5 pb-6">
          <button
            type="button"
            disabled={loading}
            onClick={handleFindMatch}
            className="rounded-xl border border-cyan-500/35 bg-cyan-500/15 px-5 py-3 text-sm font-semibold text-cyan-100 shadow-[0_0_28px_-4px_rgba(34,211,238,0.35)] transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Finding…' : 'Find match'}
          </button>
        </div>

        {error && (
          <p
            className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {matchId && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-200">Match IDs</p>
            <ul className="max-h-40 space-y-2 overflow-y-auto font-mono text-xs text-slate-300">
              <li
                key={matchId}
                className="break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2"
              >
                {matchId}
              </li>
            </ul>
            {primaryId && (
              <button
                type="button"
                onClick={() => onEnterArena(primaryId)}
                className="w-full rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/15 px-5 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25"
              >
                Continue to arena
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
