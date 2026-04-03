import { useEffect, useState } from 'react'
import { ArenaGame } from './components/ArenaGame'
import { connectSocket, createSession } from './lib/nakama/connection'
import type { Socket } from '@heroiclabs/nakama-js'

/**
 * Root shell: initialize Nakama client, session, and socket here (or via context),
 * then pass connection state or client into children.
 */
function App() {

  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const session = await createSession()
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
      {socket && <ArenaGame />}
    </>
  )
}

export default App
