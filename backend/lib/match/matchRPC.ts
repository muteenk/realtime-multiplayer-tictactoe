import { RpcFindMatchRequest, RpcFindMatchResponse } from './interfaces';
import { gameServerConfig } from '../utils/constants';


export const rpcFindMatch: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    if (!ctx.userId) {
        throw new Error('No user ID in context');
    }

    if (!payload) {
        throw new Error('Expects payload.');
    }

    let request: RpcFindMatchRequest;
    try {
        request = JSON.parse(payload) as RpcFindMatchRequest;
    } catch (error) {
        logger.error('Error parsing json message: %q', error);
        throw error;
    }

    if(request.ai) {
        let matchId = nk.matchCreate(
            gameServerConfig.moduleName, {fast: request.fast, ai: true});

        let res: RpcFindMatchResponse = { matchIds: [matchId] };
        return JSON.stringify(res);
    }

    let matches: nkruntime.Match[];
    try {
        const query = `+label.open:1 +label.fast:${request.fast ? 1 : 0}`;
        matches = nk.matchList(10, true, null, null, 1, query);
    } catch (error) {
        logger.error('Error listing matches: %v', error);
        throw error;
    }

    let matchIds: string[] = [];
    if (matches.length > 0) {
        // There are one or more ongoing matches the user could join.
        matchIds = matches.map(m => m.matchId);
    } else {
        // No available matches found, create a new one.
        try {
            matchIds.push(nk.matchCreate(gameServerConfig.moduleName, {fast: request.fast}));
        } catch (error) {
            logger.error('Error creating match: %v', error);
            throw error;
        }
    }

    let res: RpcFindMatchResponse = { matchIds };
    return JSON.stringify(res);
}