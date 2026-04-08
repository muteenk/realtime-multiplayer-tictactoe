import type { Session } from '@heroiclabs/nakama-js'
import { describeError } from '../errors'
import client from './client'

export const FIND_MATCH_RPC_ID = 'find_match' as const

export interface RpcFindMatchResponse {
  matchId: string
  success?: boolean
}

function parseRpcPayload(payload: object): RpcFindMatchResponse {
  const p = payload as Record<string, unknown>

  if (p.success === 'false' || p.success === false) {
    const msg =
      typeof p.error === 'string' && p.error.length > 0
        ? p.error
        : 'Matchmaking failed'
    throw new Error(msg)
  }

  const matchId = p.matchId
  if (typeof matchId !== 'string' || matchId.length === 0) {
    throw new Error('Invalid response from server (missing match id)')
  }

  return { matchId }
}

export async function findMatchRpc(
  session: Session
): Promise<RpcFindMatchResponse> {
  try {
    const res = await client.rpc(session, FIND_MATCH_RPC_ID, {})
    if (res.payload === undefined || res.payload === null) {
      throw new Error('No response from server')
    }
    return parseRpcPayload(res.payload)
  } catch (e) {
    if (e instanceof Error) throw e
    throw new Error(describeError(e))
  }
}
