import client from './client'
const useSSL = import.meta.env.VITE_NAKAMA_SSL === 'true'

export const createSession = async () => {
    try {
        const deviceId = crypto.randomUUID()
        const session = await client.authenticateDevice(deviceId)
        return session
    } catch (error) {
        console.error("Error creating session", error)
        throw error
    }
}

export const connectSocket = async (session: any) => {
    try {
        const socket = client.createSocket(useSSL);
        await socket.connect(session, true);
        return socket;
    } catch (error) {
        console.error("Error connecting socket", error)
        throw error
    }
}
