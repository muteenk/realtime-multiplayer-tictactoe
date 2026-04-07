import { Client } from '@heroiclabs/nakama-js'

const host = import.meta.env.VITE_NAKAMA_HOST ?? '127.0.0.1'
const useSSL = import.meta.env.VITE_NAKAMA_SSL === 'true'
const port = useSSL ? '' : '7350'
const client = new Client('defaultkey', host, port, useSSL)

export default client
