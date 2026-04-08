import { useCallback, useEffect, useState } from 'react'
import { ArenaGame } from './components/ArenaGame'
import { ConnectionStatusScreen } from './components/ConnectionStatusScreen'
import { FindMatchScreen } from './components/FindMatchScreen'
import { WaitingLobbyScreen } from './components/WaitingLobbyScreen'
import { connectSocket, createSession } from './lib/nakama/connection'
import type { Session, Socket } from '@heroiclabs/nakama-js'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnecting, setIsConnecting] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'find' | 'lobby' | 'arena'>('find')
  const [arenaMatchId, setArenaMatchId] = useState<string | null>(null)
  const [myMark, setMyMark] = useState<number | null>(null)
  const [turn, setTurn] = useState<number | null>(null)

  const initConnection = useCallback(async () => {
    setIsConnecting(true)
    setConnectionError(null)
    setSession(null)
    setSocket(null)
    try {
      const nextSession = await createSession()
      const nextSocket = await connectSocket(nextSession)
      setSession(nextSession)
      setSocket(nextSocket)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to server.'
      setConnectionError(message)
      console.error('Error initializing app', error)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  useEffect(() => {
    initConnection()
  }, [initConnection])

  const nowSec = Math.floor(Date.now() / 1000)
  const isSessionActive = Boolean(session?.token) && !(session?.isexpired(nowSec) ?? true)

  const showConnectionScreen = isConnecting || !session || !socket

  if (showConnectionScreen) {
    return (
      <>
        <div className="arena-grid-bg" aria-hidden />
        <ConnectionStatusScreen
          isConnecting={isConnecting}
          errorMessage={!isSessionActive && !isConnecting ? 'Session expired. Please reconnect.' : connectionError}
          onRetry={initConnection}
        />
      </>
    )
  }

  return (
    <>
      <div className="arena-grid-bg" aria-hidden />
      {session && phase === 'find' && (
        <FindMatchScreen
          session={session}
          // isSessionActive={isSessionActive}
          onEnterArena={(matchId) => {
            setArenaMatchId(matchId)
            setPhase('lobby')
          }}
        />
      )}
      {session?.user_id && phase === 'lobby' && (
        <WaitingLobbyScreen
          matchId={arenaMatchId}
          socket={socket}
          userId={session.user_id}
          myMark={myMark}
          turn={turn}
          setMyMark={setMyMark}
          setTurn={setTurn}
          onBackToFindMatch={() => {
            setArenaMatchId(null)
            setPhase('find')
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
            setPhase('find')
            setMyMark(null)
            setTurn(null)
          }}
        />
      )}
    </>
  )
}

export default App
