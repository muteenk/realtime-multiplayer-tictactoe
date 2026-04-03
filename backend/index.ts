import { rpcFindMatch } from './lib/match/matchRPC';
import { matchInit, matchJoinAttempt, matchJoin, matchLeave, matchLoop, matchTerminate, matchSignal } from './lib/match/matchHandler';
import { gameServerConfig } from './lib/utils/constants';

const rpcIdFindMatch = 'find_match_js';
function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    initializer.registerRpc(rpcIdFindMatch, rpcFindMatch);

    initializer.registerMatch(gameServerConfig.moduleName, {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });

    logger.info('JavaScript logic loaded.');
}