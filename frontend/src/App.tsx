import { useEffect, useState } from 'react'
import { ArenaGame } from './components/ArenaGame'
import { FindMatchScreen } from './components/FindMatchScreen'
import { connectSocket, createSession } from './lib/nakama/connection'
import type { Session, Socket } from '@heroiclabs/nakama-js'

/**
 * Root shell: initialize Nakama client, session, and socket here (or via context),
 * then pass connection state or client into children.
 */
function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [phase, setPhase] = useState<'lobby' | 'arena'>('lobby')
  const [arenaMatchId, setArenaMatchId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const session = await createSession()
        setSession(session)
        const socket = await connectSocket(session)
        setSocket(socket)
      } catch (error) {
        console.error("Error initializing app", error)
      }
    }
    init();
  }, [])

  return (
    <>
      <div className="arena-grid-bg" aria-hidden />
      {session && phase === 'lobby' && (
        <FindMatchScreen
          session={session}
          onEnterArena={(matchId) => {
            setArenaMatchId(matchId)
            setPhase('arena')
          }}
        />
      )}
      {session && socket && phase === 'arena' && (
        <ArenaGame matchId={arenaMatchId} onBackToLobby={() => setPhase('lobby')} />
      )}
    </>
  )
}

export default App
