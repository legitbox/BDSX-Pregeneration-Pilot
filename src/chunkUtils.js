"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertChunkPosToBlockPos = exports.saveChunk = exports.saveChunkResult = void 0;
const launcher_1 = require("bdsx/launcher");
const decay_1 = require("bdsx/decay");
var isDecayed = decay_1.decay.isDecayed;
const blockpos_1 = require("bdsx/bds/blockpos");
const SerializableVec3_1 = require("./SerializableVec3");
const dll_1 = require("bdsx/dll");
const chunk_1 = require("bdsx/bds/chunk");
const nativetype_1 = require("bdsx/nativetype");
const Path = require("path");
const event_1 = require("bdsx/event");
const pdbcache_1 = require("bdsx/pdbcache");
var saveChunkResult;
(function (saveChunkResult) {
    saveChunkResult[saveChunkResult["Success"] = 0] = "Success";
    saveChunkResult[saveChunkResult["ServerClosed"] = 1] = "ServerClosed";
    saveChunkResult[saveChunkResult["DimensionUnloaded"] = 2] = "DimensionUnloaded";
    saveChunkResult[saveChunkResult["ChunkUnloaded"] = 3] = "ChunkUnloaded";
    saveChunkResult[saveChunkResult["ChunkAlreadySaved"] = 4] = "ChunkAlreadySaved";
    saveChunkResult[saveChunkResult["FailAtSave"] = 5] = "FailAtSave";
})(saveChunkResult = exports.saveChunkResult || (exports.saveChunkResult = {}));
function saveChunk(chunkPos, dimensionId) {
    if (isDecayed(launcher_1.bedrockServer.level)) {
        return saveChunkResult.ServerClosed;
    }
    const dimension = launcher_1.bedrockServer.level.getDimension(dimensionId);
    if (dimension === null) {
        return saveChunkResult.DimensionUnloaded;
    }
    const natChunkPos = blockpos_1.ChunkPos.create(chunkPos.x, chunkPos.z);
    const region = dimension.getBlockSource();
    const chunk = region.getChunk(natChunkPos);
    if (chunk === null || !chunk.isFullyLoaded()) {
        return saveChunkResult.ChunkUnloaded;
    }
    const chunkSource = dimension.getChunkSource();
    if (chunkSource.isChunkSaved(natChunkPos)) {
        return saveChunkResult.ChunkAlreadySaved;
    }
    const res = _saveChunk(chunkSource, chunk);
    if (res && chunkSource.isChunkSaved(natChunkPos)) {
        return saveChunkResult.Success;
    }
    else {
        return saveChunkResult.FailAtSave;
    }
}
exports.saveChunk = saveChunk;
function convertChunkPosToBlockPos(chunkPos, y) {
    return new SerializableVec3_1.SerializableVec3(chunkPos.x * 16, y, chunkPos.z * 16);
}
exports.convertChunkPosToBlockPos = convertChunkPosToBlockPos;
const dllLocation = Path.join(__dirname + '/../bdsx-pregen.dll');
const pregenDll = dll_1.NativeModule.load(dllLocation);
const init = pregenDll.getFunction('init', nativetype_1.void_t, null, nativetype_1.int32_t);
const _saveChunk = pregenDll.getFunction('saveChunk', nativetype_1.bool_t, null, chunk_1.ChunkSource, chunk_1.LevelChunk);
event_1.events.serverOpen.on(() => {
    init(pdbcache_1.pdbcache.search('?saveLiveChunk@ChunkSource@@UEAA_NAEAVLevelChunk@@@Z'));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2h1bmtVdGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNodW5rVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsNENBQTRDO0FBQzVDLHNDQUFpQztBQUNqQyxJQUFPLFNBQVMsR0FBRyxhQUFLLENBQUMsU0FBUyxDQUFDO0FBQ25DLGdEQUEyQztBQUMzQyx5REFBb0Q7QUFDcEQsa0NBQXNDO0FBQ3RDLDBDQUF1RDtBQUN2RCxnREFBd0Q7QUFDeEQsNkJBQTZCO0FBQzdCLHNDQUFrQztBQUNsQyw0Q0FBdUM7QUFLdkMsSUFBWSxlQU9YO0FBUEQsV0FBWSxlQUFlO0lBQ3ZCLDJEQUFPLENBQUE7SUFDUCxxRUFBWSxDQUFBO0lBQ1osK0VBQWlCLENBQUE7SUFDakIsdUVBQWEsQ0FBQTtJQUNiLCtFQUFpQixDQUFBO0lBQ2pCLGlFQUFVLENBQUE7QUFDZCxDQUFDLEVBUFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFPMUI7QUFFRCxTQUFnQixTQUFTLENBQUMsUUFBa0IsRUFBRSxXQUF3QjtJQUNsRSxJQUFJLFNBQVMsQ0FBQyx3QkFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ2hDLE9BQU8sZUFBZSxDQUFDLFlBQVksQ0FBQztLQUN2QztJQUVELE1BQU0sU0FBUyxHQUFHLHdCQUFhLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoRSxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7UUFDcEIsT0FBTyxlQUFlLENBQUMsaUJBQWlCLENBQUM7S0FDNUM7SUFFRCxNQUFNLFdBQVcsR0FBRyxtQkFBUSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDMUMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUUzQyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLEVBQUU7UUFDMUMsT0FBTyxlQUFlLENBQUMsYUFBYSxDQUFDO0tBQ3hDO0lBRUQsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBRS9DLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUN2QyxPQUFPLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQztLQUM1QztJQUVELE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFFM0MsSUFBSSxHQUFHLElBQUksV0FBVyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUM5QyxPQUFPLGVBQWUsQ0FBQyxPQUFPLENBQUM7S0FDbEM7U0FBTTtRQUNILE9BQU8sZUFBZSxDQUFDLFVBQVUsQ0FBQztLQUNyQztBQUNMLENBQUM7QUEvQkQsOEJBK0JDO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsUUFBa0IsRUFBRSxDQUFTO0lBQ25FLE9BQU8sSUFBSSxtQ0FBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRkQsOERBRUM7QUFFRCxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDO0FBRWpFLE1BQU0sU0FBUyxHQUFHLGtCQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRWpELE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQzlCLE1BQU0sRUFDTixtQkFBTSxFQUNOLElBQUksRUFDSixvQkFBTyxDQUNWLENBQUE7QUFFRCxNQUFNLFVBQVUsR0FBd0QsU0FBUyxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsbUJBQU0sRUFBRSxJQUFJLEVBQUUsbUJBQVcsRUFBRSxrQkFBVSxDQUFDLENBQUM7QUFFbEosY0FBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ3RCLElBQUksQ0FDQSxtQkFBUSxDQUFDLE1BQU0sQ0FBQyxzREFBc0QsQ0FBQyxDQUMxRSxDQUFBO0FBQ0wsQ0FBQyxDQUFDLENBQUEifQ==