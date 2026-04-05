import { useEffect, useState } from 'react'
import { ArenaGame } from './components/ArenaGame'
import { FindMatchScreen } from './components/FindMatchScreen'
import { WaitingLobbyScreen } from './components/WaitingLobbyScreen'
import { connectSocket, createSession } from './lib/nakama/connection'
import type { Session, Socket } from '@heroiclabs/nakama-js'

/**
 * Root shell: initialize Nakama client, session, and socket here (or via context),
 * then pass connection state or client into children.
 */
function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [phase, setPhase] = useState<'lobby' | 'waiting' | 'arena'>('lobby')
  const [arenaMatchId, setArenaMatchId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [myMark, setMyMark] = useState<number | null>(null)
  const [turn, setTurn] = useState<number | null>(null)

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
            setPhase('waiting')
          }}
        />
      )}
      {session && phase === 'waiting' && (
        <WaitingLobbyScreen
          matchId={arenaMatchId}
          socket={socket}
          userId={userId}
          myMark={myMark}
          turn={turn}
          setUserId={setUserId}
          setMyMark={setMyMark}
          setTurn={setTurn}
          onBackToFindMatch={() => {
            setArenaMatchId(null)
            setPhase('lobby')
          }}
          onEnterArena={() => setPhase('arena')}
        />
      )}
      {session?.user_id && socket && phase === 'arena' && (
        <ArenaGame
          matchId={arenaMatchId}
          socket={socket}
          userId={session.user_id}
          myMark={myMark}
          turn={turn}
          setMyMark={setMyMark}
          setTurn={setTurn}
          onBackToLobby={() => {
            setArenaMatchId(null)
            setPhase('lobby')
          }}
        />
      )}
    </>
  )
}

export default App
