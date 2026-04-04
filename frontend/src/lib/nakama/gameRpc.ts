import type { Session } from '@heroiclabs/nakama-js'
import client from './client'

/** Must match `rpcIdFindMatch` in `backend/index.ts`. */
export const FIND_MATCH_RPC_ID = 'find_match' as const

export interface RpcFindMatchRequest {
  fast: boolean
  ai?: boolean
}

export interface RpcFindMatchResponse {
  matchIds: string[]
}

export async function findMatchRpc(
  session: Session,
  input: RpcFindMatchRequest,
): Promise<RpcFindMatchResponse> {
  const res = await client.rpc(session, FIND_MATCH_RPC_ID, input)
  if (res.payload === undefined) {
    throw new Error('RPC returned no payload')
  }
  return res.payload as RpcFindMatchResponse
}
