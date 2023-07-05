import {VectorXZ} from "bdsx/common";
import {DimensionId} from "bdsx/bds/actor";
import {bedrockServer} from "bdsx/launcher";
import {decay} from "bdsx/decay";
import isDecayed = decay.isDecayed;
import {ChunkPos} from "bdsx/bds/blockpos";
import {SerializableVec3} from "./SerializableVec3";
import {NativeModule} from "bdsx/dll";
import {ChunkSource, LevelChunk} from "bdsx/bds/chunk";
import {bool_t, int32_t, void_t} from "bdsx/nativetype";
import * as Path from "path";
import {events} from "bdsx/event";
import {pdbcache} from "bdsx/pdbcache";
import {ServerInstance} from "bdsx/bds/server";
import {LevelData} from "bdsx/bds/level";
import {procHacker} from "bdsx/prochacker";

export enum saveChunkResult {
    Success,
    ServerClosed,
    DimensionUnloaded,
    ChunkUnloaded,
    ChunkAlreadySaved,
    FailAtSave,
}

export function saveChunk(chunkPos: VectorXZ, dimensionId: DimensionId) {
    if (isDecayed(bedrockServer.level)) {
        return saveChunkResult.ServerClosed;
    }

    const dimension = bedrockServer.level.getDimension(dimensionId);
    if (dimension === null) {
        return saveChunkResult.DimensionUnloaded;
    }

    const natChunkPos = ChunkPos.create(chunkPos.x, chunkPos.z);
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
    } else {
        return saveChunkResult.FailAtSave;
    }
}

export function convertChunkPosToBlockPos(chunkPos: VectorXZ, y: number) {
    return new SerializableVec3(chunkPos.x * 16, y, chunkPos.z * 16);
}

const dllLocation = Path.join(__dirname + '/../bdsx-pregen.dll');

const pregenDll = NativeModule.load(dllLocation);

const init = pregenDll.getFunction(
    'init',
    void_t,
    null,
    int32_t, // ChunkSource::saveLiveChunk
)

const _saveChunk: (source: ChunkSource, chunk: LevelChunk) => boolean = pregenDll.getFunction('saveChunk', bool_t, null, ChunkSource, LevelChunk);

events.serverOpen.on(() => {
    init(
        pdbcache.search('?saveLiveChunk@ChunkSource@@UEAA_NAEAVLevelChunk@@@Z'),
    )
})
