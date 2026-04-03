import client from './client'


export const createSession = async () => {
    try {
        const deviceId = crypto.randomUUID()
        const session = await client.authenticateDevice(deviceId)
        console.log("Session created", session)
        return session
    } catch (error) {
        console.error("Error creating session", error)
        throw error
    }
}

export const connectSocket = async (session: any) => {
    try {
        const socket = client.createSocket();
        await socket.connect(session, true);
        console.log("Socket connected");
        return socket;
    } catch (error) {
        console.error("Error connecting socket", error)
        throw error
    }
}
