"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pregen = exports.ChunkState = exports.PregenDirection = exports.pregens = void 0;
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
        if (!(0, fs_1.existsSync)(path) || !isFileSync(path)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZ2VuU3RvcmFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByZWdlblN0b3JhZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseURBQW9EO0FBQ3BELDJCQUFzRTtBQUN0RSx3Q0FBbUM7QUFDbkMsMENBQTJDO0FBQzNDLDZDQUFtRjtBQUVuRix5REFBb0Q7QUFDcEQsNENBQWlEO0FBQ2pELHNDQUFpQztBQUNqQyw0Q0FBNEM7QUFDNUMsSUFBTyxVQUFVLEdBQUcsZUFBTSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxJQUFPLGVBQWUsR0FBRyxlQUFNLENBQUMsZUFBZSxDQUFDO0FBRWhELElBQU8sU0FBUyxHQUFHLGFBQUssQ0FBQyxTQUFTLENBQUM7QUFFbkMsTUFBTSxvQkFBb0IsR0FBRyx3QkFBd0IsQ0FBQztBQUV6QyxRQUFBLE9BQU8sR0FBNkIsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUUzRCxJQUFZLGVBS1g7QUFMRCxXQUFZLGVBQWU7SUFDdkIsNkRBQVEsQ0FBQTtJQUNSLCtEQUFTLENBQUE7SUFDVCx1RUFBYSxDQUFBO0lBQ2IseUVBQWMsQ0FBQTtBQUNsQixDQUFDLEVBTFcsZUFBZSxHQUFmLHVCQUFlLEtBQWYsdUJBQWUsUUFLMUI7QUFFRCxJQUFZLFVBR1g7QUFIRCxXQUFZLFVBQVU7SUFDbEIsdURBQVUsQ0FBQTtJQUNWLDJDQUFJLENBQUE7QUFDUixDQUFDLEVBSFcsVUFBVSxHQUFWLGtCQUFVLEtBQVYsa0JBQVUsUUFHckI7QUFFRCxNQUFhLE1BQU07SUFnQmYsWUFDSSxJQUFZLEVBQ1osS0FBYSxFQUNiLFVBQWtCLEVBQ2xCLFdBQW1CLEVBQ25CLFdBQTZCLEVBQzdCLFNBQTBCLEVBQzFCLFdBQXdCLEVBQ3hCLFdBQW1CLEVBQ25CLFNBQWtCO1FBZnRCLHFCQUFnQixHQUF5QixTQUFTLENBQUM7UUFDbkQsbUJBQWMsR0FBdUIsU0FBUyxDQUFDO1FBQy9DLHFCQUFnQixHQUE2QixTQUFTLENBQUM7UUFDdkQs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