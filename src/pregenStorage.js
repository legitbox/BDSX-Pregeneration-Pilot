"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientSideChunkGenEnabled = exports.isUsingClientSideChunkGen = exports.Pregen = exports.ChunkState = exports.PregenDirection = exports.pregens = void 0;
const SerializableVec2_1 = require("./SerializableVec2");
const fs_1 = require("fs");
const fsutil_1 = require("bdsx/fsutil");
const actor_1 = require("bdsx/bds/actor");
const chunkUtils_1 = require("./chunkUtils");
const SerializableVec3_1 = require("./SerializableVec3");
const player_1 = require("bdsx/bds/player");
const decay_1 = require("bdsx/decay");
const launcher_1 = require("bdsx/launcher");
var isFileSync = fsutil_1.fsutil.isFileSync;
var isDirectorySync = fsutil_1.fsutil.isDirectorySync;
var isDecayed = decay_1.decay.isDecayed;
const prochacker_1 = require("bdsx/prochacker");
const nativetype_1 = require("bdsx/nativetype");
const server_1 = require("bdsx/bds/server");
const level_1 = require("bdsx/bds/level");
const event_1 = require("bdsx/event");
const serverproperties_1 = require("bdsx/serverproperties");
const PREGEN_BACKUP_FOLDER = '../pregenData_backups/';
exports.pregens = new Map();
var PregenDirection;
(function (PregenDirection) {
    PregenDirection[PregenDirection["Forwards"] = 0] = "Forwards";
    PregenDirection[PregenDirection["Backwards"] = 1] = "Backwards";
    PregenDirection[PregenDirection["DownToForward"] = 2] = "DownToForward";
    PregenDirection[PregenDirection["DownToBackward"] = 3] = "DownToBackward";
})(PregenDirection = exports.PregenDirection || (exports.PregenDirection = {}));
var ChunkState;
(function (ChunkState) {
    ChunkState[ChunkState["InProgress"] = 0] = "InProgress";
    ChunkState[ChunkState["Done"] = 1] = "Done";
})(ChunkState = exports.ChunkState || (exports.ChunkState = {}));
class Pregen {
    constructor(size, width, widthIndex, lengthIndex, originChunk, direction, dimensionId, readRegions, startTime) {
        this.last10RegionTime = undefined;
        this.lastRegionTime = undefined;
        this.currentChunkInfo = undefined;
        this.playerXuid = undefined;
        this.interval = undefined;
        this.size = size;
        this.width = width;
        this.widthIndex = widthIndex;
        this.lengthIndex = lengthIndex;
        this.originChunk = originChunk;
        this.direction = direction;
        this.dimensionId = dimensionId;
        this.readRegions = readRegions;
        this.startTime = startTime;
    }
    static fromData(data) {
        const originChunk = SerializableVec2_1.SerializableVec2.fromData(data.originChunk);
        return new Pregen(data.size, data.width, data.widthIndex, data.lengthIndex, originChunk, data.direction, data.dimensionId, data.readRegions, data.startTime);
    }
    static fromFileData(dimensionId) {
        const path = createPregenDataPath(dimensionId);
        if (!isFileSync(path)) {
            return undefined;
        }
        const data = JSON.parse((0, fs_1.readFileSync)(path, 'utf-8'));
        return Pregen.fromData(data);
    }
    static fromSize(size, dimensionId, pregenOrigin) {
        const rem = size % 16;
        if (rem !== 0) {
            const sizeIncrease = 16 - rem;
            size += sizeIncrease;
        }
        const chunkWidth = size / 16;
        const width = Math.ceil(chunkWidth / 3);
        const origXZ = Math.floor(chunkWidth / 2) * -1;
        const originChunk = new SerializableVec2_1.SerializableVec2(origXZ, origXZ);
        if (pregenOrigin !== undefined) {
            const customOriginXRem = pregenOrigin.x % 16;
            const customOriginZRem = pregenOrigin.z % 16;
            if (customOriginXRem !== 0) {
                const sizeIncrease = 16 - customOriginXRem;
                pregenOrigin.x += sizeIncrease;
            }
            if (customOriginZRem !== 0) {
                const sizeIncrease = 16 - customOriginZRem;
                pregenOrigin.z += sizeIncrease;
            }
            originChunk.x += pregenOrigin.x / 16;
            originChunk.z += pregenOrigin.z / 16;
        }
        return new Pregen(size, width, 0, 0, originChunk, PregenDirection.Forwards, dimensionId, 0);
    }
    getFileWritableVersion() {
        return {
            size: this.size,
            width: this.width,
            widthIndex: this.widthIndex,
            lengthIndex: this.lengthIndex,
            originChunk: this.originChunk,
            direction: this.direction,
            dimensionId: this.dimensionId,
            readRegions: this.readRegions,
            startTime: this.startTime,
        };
    }
    save() {
        const path = createPregenDataPath(this.dimensionId);
        // Backing up previous pre-gen
        if ((0, fs_1.existsSync)(path) && isFileSync(path)) {
            const oldDataStr = (0, fs_1.readFileSync)(path, 'utf-8');
            const oldData = JSON.parse(oldDataStr);
            const fileName = `pregenData-${actor_1.DimensionId[oldData.dimensionId]}-BACKUP-${Date.now}.json`;
            let savePath = PREGEN_BACKUP_FOLDER + `pregenData-${Date.now()}`;
            // Checking if backup folder exists, creating it if not
            if (!(0, fs_1.existsSync)(PREGEN_BACKUP_FOLDER)) {
                (0, fs_1.mkdirSync)(PREGEN_BACKUP_FOLDER);
            }
            else if (!isDirectorySync(PREGEN_BACKUP_FOLDER)) {
                console.error(`BACKUP FOLDER PATH NOT DIRECTORY, SAVING TO ../${fileName} INSTEAD!`);
                savePath = `../${fileName}`;
            }
            (0, fs_1.writeFileSync)(savePath, oldData);
        }
        // Backing up current pregen
        (0, fs_1.writeFileSync)(path, JSON.stringify(this.getFileWritableVersion(), null, 4));
    }
    getSaveTargetChunkPoses() {
        const indexOrigin = this.getIndexOrigin();
        const poses = [];
        for (let modX = 0; modX < 3; modX += 1) {
            for (let modZ = 0; modZ < 3; modZ += 1) {
                poses.push(new SerializableVec2_1.SerializableVec2(indexOrigin.x + modX, indexOrigin.z + modZ));
            }
        }
        return poses;
    }
    getIndexOrigin() {
        const modX = this.widthIndex * 3;
        const modZ = this.lengthIndex * 3;
        return new SerializableVec2_1.SerializableVec2(this.originChunk.x + modX, this.originChunk.z + modZ);
    }
    updateIndexesAndDirection() {
        this.currentChunkInfo = undefined;
        switch (this.direction) {
            case PregenDirection.Forwards:
                if (this.widthIndex + 1 === this.width) {
                    // Hit end of the line, needs to move downwards
                    this.direction = PregenDirection.DownToBackward;
                    this.lengthIndex += 1;
                }
                else {
                    this.widthIndex += 1;
                }
                break;
            case PregenDirection.DownToBackward:
                this.direction = PregenDirection.Backwards;
                this.widthIndex -= 1;
                break;
            case PregenDirection.Backwards:
                if (this.widthIndex === 0) {
                    this.direction = PregenDirection.DownToForward;
                    this.lengthIndex += 1;
                }
                else {
                    this.widthIndex -= 1;
                }
                break;
            case PregenDirection.DownToForward:
                this.direction = PregenDirection.Forwards;
                this.widthIndex += 1;
        }
    }
    getPlayerPointFromIndexes() {
        const saveChunks = this.getSaveTargetChunkPoses();
        const playerChunkCorner = (0, chunkUtils_1.convertChunkPosToBlockPos)(saveChunks[4], 0);
        return new SerializableVec3_1.SerializableVec3(playerChunkCorner.x + 8, 0, playerChunkCorner.z + 8);
    }
    addLastRegionTime(duration) {
        if (this.last10RegionTime === undefined) {
            this.last10RegionTime = [];
        }
        if (this.last10RegionTime.length >= 10) {
            this.last10RegionTime.reverse();
            while (this.last10RegionTime.length >= 10) {
                this.last10RegionTime.pop();
            }
            this.last10RegionTime.reverse();
        }
        this.last10RegionTime.push(duration);
    }
    start(xuid, rate = 100) {
        if (exports.pregens.has(this.dimensionId)) {
            return false;
        }
        exports.pregens.set(this.dimensionId, this);
        this.startTime = Date.now();
        this.playerXuid = xuid;
        this.widthIndex = 0;
        this.lengthIndex = 0;
        this.last10RegionTime = [];
        this.interval = setInterval(_pregenTick, rate, this);
        return true;
    }
    pause() {
        clearInterval(this.interval);
        this.save();
    }
    resume(xuid, rate = 100) {
        exports.pregens.set(this.dimensionId, this);
        this.playerXuid = xuid;
        this.interval = setInterval(_pregenTick, rate, this);
    }
    finish() {
        clearInterval(this.interval);
        if (this.startTime === undefined) {
            throw 'something happened to start time!';
        }
        const duration = Date.now() - this.startTime;
        const durationStr = durationToFormatted(duration);
        // Sending player finish message
        const finishMessage = `Pregen in ${actor_1.DimensionId[this.dimensionId]} finished in ${durationStr}`;
        if (!isDecayed(launcher_1.bedrockServer.level) && this.playerXuid !== undefined) {
            const player = launcher_1.bedrockServer.level.getPlayerByXuid(this.playerXuid);
            if (player !== null) {
                player.sendMessage(finishMessage);
            }
            this.playerXuid = undefined;
        }
        exports.pregens.delete(this.dimensionId);
        console.log(finishMessage);
    }
    getPlayer() {
        if (isDecayed(launcher_1.bedrockServer.level) || this.playerXuid === undefined) {
            return undefined;
        }
        const player = launcher_1.bedrockServer.level.getPlayerByXuid(this.playerXuid);
        if (player === null) {
            return undefined;
        }
        return player;
    }
    getTotalRegions() {
        return this.width * this.width;
    }
    getTimePerRegion() {
        if (this.last10RegionTime === undefined) {
            return undefined;
        }
        let total = 0;
        for (let time of this.last10RegionTime) {
            total += time;
        }
        return total / this.last10RegionTime.length;
    }
    getETA() {
        const totalRegions = this.getTotalRegions();
        const timePerRegion = this.getTimePerRegion();
        if (timePerRegion === undefined) {
            return 0;
        }
        return (totalRegions - this.readRegions) * timePerRegion;
    }
    toString() {
        if (this.startTime === undefined) {
            // Pregen not started yet
            return '---Pregen Info---\n' +
                'Not started yet!\n' +
                `Total Chunks: ${Math.pow(this.width * 3, 2)}\n`;
        }
        else {
            const now = Date.now();
            const duration = now - this.startTime;
            let durationStr = durationToFormatted(duration);
            let eta = this.getETA();
            let etaStr = durationToFormatted(eta);
            return '---Pregen Info---\n' +
                `Current Runtime: ${durationStr}\n` +
                `# of Regions read: (${this.readRegions}/${this.getTotalRegions()})\n` +
                `# of chunks read: ${this.readRegions * 9}\n` +
                `Percentage done: ${(this.readRegions / this.getTotalRegions()) * 100}%\n` +
                `Estimated Time Remaining: ${etaStr}\n`;
        }
    }
}
exports.Pregen = Pregen;
function durationToFormatted(duration) {
    const days = Math.floor(duration / 86400000);
    const hours = Math.floor((duration / 3600000) % 24);
    const minutes = Math.floor((duration / 60000) % 60);
    const seconds = Math.floor((duration / 1000) % 60);
    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function _pregenTick(pregen) {
    // Checking if entire pregen is done
    if (pregen.lengthIndex === pregen.width) {
        pregen.finish();
        return;
    }
    // If level is decayed, save pregen
    if (isDecayed(launcher_1.bedrockServer.level)) {
        pregen.save();
        clearInterval(pregen.interval);
        return;
    }
    // If pregen doesn't have a linked player stop the loop
    if (pregen.playerXuid === undefined) {
        pregen.save();
        clearInterval(pregen.interval);
        return;
    }
    const player = pregen.getPlayer();
    if (player === undefined) {
        pregen.pause();
        return;
    }
    if (player.getGameType() !== player_1.GameType.Spectator) {
        player.setGameType(player_1.GameType.Spectator);
    }
    const checkingChunks = pregen.getSaveTargetChunkPoses();
    if (pregen.currentChunkInfo === undefined) {
        pregen.currentChunkInfo = createIdleChunkInfo();
    }
    for (let i = 0; i < checkingChunks.length; i++) {
        const chunkPos = checkingChunks[i];
        if (pregen.currentChunkInfo[i] === ChunkState.Done) {
            continue;
        }
        // Try and save the chunk
        const res = (0, chunkUtils_1.saveChunk)(chunkPos, pregen.dimensionId);
        if (res === chunkUtils_1.saveChunkResult.Success || res === chunkUtils_1.saveChunkResult.ChunkAlreadySaved) {
            pregen.currentChunkInfo[i] = ChunkState.Done;
            continue;
        }
        teleportSimPlayerToPos(player, pregen.getPlayerPointFromIndexes(), pregen.dimensionId);
    }
    const isDone = pregen.currentChunkInfo.every((value) => {
        return value === ChunkState.Done;
    });
    if (isDone) {
        pregen.readRegions += 1;
        if (pregen.lastRegionTime !== undefined) {
            const end = Date.now();
            const duration = end - pregen.lastRegionTime;
            pregen.addLastRegionTime(duration);
        }
        pregen.lastRegionTime = Date.now();
        player.sendMessage(`Read region ${pregen.readRegions}/${pregen.getTotalRegions()}. (ETA: ${durationToFormatted(pregen.getETA())})`);
        pregen.updateIndexesAndDirection();
    }
}
function teleportSimPlayerToPos(player, pos, dimensionId) {
    // Teleport player to index spot if not already there
    const playerPos = player.getPosition();
    if (!pos.equal(playerPos)) {
        player.teleport(pos.toVec3(), dimensionId);
    }
}
function createPregenDataPath(dimensionId) {
    const fileName = `pregenData-${actor_1.DimensionId[dimensionId]}.json`;
    return '../' + fileName;
}
function createIdleChunkInfo() {
    return [
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress,
        ChunkState.InProgress
    ];
}
exports.isUsingClientSideChunkGen = prochacker_1.procHacker.js('?_useClientSideChunkGeneration@ServerInstance@@AEBA_NPEAVLevelData@@@Z', nativetype_1.bool_t, { this: server_1.ServerInstance }, level_1.LevelData);
event_1.events.serverOpen.on(() => {
    exports.clientSideChunkGenEnabled = serverproperties_1.serverProperties["client-side-chunk-generation-enabled"] === "true";
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZ2VuU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByZWdlblN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseURBQW9EO0FBQ3BELDJCQUFzRTtBQUN0RSx3Q0FBbUM7QUFDbkMsMENBQTJDO0FBQzNDLDZDQUFtRjtBQUVuRix5REFBb0Q7QUFDcEQsNENBQWlEO0FBQ2pELHNDQUFpQztBQUNqQyw0Q0FBNEM7QUFDNUMsSUFBTyxVQUFVLEdBQUcsZUFBTSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxJQUFPLGVBQWUsR0FBRyxlQUFNLENBQUMsZUFBZSxDQUFDO0FBRWhELElBQU8sU0FBUyxHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUM7QUFDbkMsZ0RBQTJDO0FBQzNDLGdEQUF1QztBQUN2Qyw0Q0FBK0M7QUFDL0MsMENBQXlDO0FBQ3pDLHNDQUFrQztBQUNsQyw0REFBdUQ7QUFFdkQsTUFBTSxvQkFBb0IsR0FBRyx3QkFBd0IsQ0FBQztBQUV6QyxRQUFBLE9BQU8sR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUUzRCxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDdkIsNkRBQVEsQ0FBQTtJQUNSLCtEQUFTLENBQUE7SUFDVCx1RUFBYSxDQUFBO0lBQ2IseUVBQWMsQ0FBQTtBQUNsQixDQUFDLEVBTFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFLMUI7QUFFRCxJQUFZLFVBR1g7QUFIRCxXQUFZLFVBQVU7SUFDbEIsdURBQVUsQ0FBQTtJQUNWLDJDQUFJLENBQUE7QUFDUixDQUFDLEVBSFcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFHckI7QUFFRCxNQUFhLE1BQU07SUFnQmYsWUFDSSxJQUFZLEVBQ1osS0FBYSxFQUNiLFVBQWtCLEVBQ2xCLFdBQW1CLEVBQ25CLFdBQTZCLEVBQzdCLFNBQTBCLEVBQzFCLFdBQXdCLEVBQ3hCLFdBQW1CLEVBQ25CLFNBQWtCO1FBZnRCLHFCQUFnQixH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