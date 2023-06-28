import {SerializableVec2} from "./SerializableVec2";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "fs";
import {fsutil} from "bdsx/fsutil";
import {DimensionId} from "bdsx/bds/actor";
import {convertChunkPosToBlockPos, saveChunk, saveChunkResult} from "./chunkUtils";
import {VectorXZ} from "bdsx/common";
import {SerializableVec3} from "./SerializableVec3";
import {GameType, Player} from "bdsx/bds/player";
import {decay} from "bdsx/decay";
import {bedrockServer} from "bdsx/launcher";
import isFileSync = fsutil.isFileSync;
import isDirectorySync = fsutil.isDirectorySync;
import Timeout = NodeJS.Timeout;
import isDecayed = decay.isDecayed;

const PREGEN_BACKUP_FOLDER = '../pregenData_backups/';

export const pregens: Map<DimensionId, Pregen> = new Map();

export enum PregenDirection {
    Forwards,
    Backwards,
    DownToForward,
    DownToBackward,
}

export enum ChunkState {
    InProgress,
    Done,
}

export class Pregen {
    size: number;
    width: number; // Index width
    widthIndex: number;
    lengthIndex: number;
    originChunk: SerializableVec2;
    direction: PregenDirection;
    dimensionId: DimensionId;
    startTime: number | undefined;
    readRegions: number;
    last10RegionTime: number[] | undefined = undefined;
    lastRegionTime: number | undefined = undefined;
    currentChunkInfo: ChunkState[] | undefined = undefined;
    playerXuid: string | undefined = undefined;
    interval: Timeout | undefined = undefined;

    constructor(
        size: number,
        width: number,
        widthIndex: number,
        lengthIndex: number,
        originChunk: SerializableVec2,
        direction: PregenDirection,
        dimensionId: DimensionId,
        readRegions: number,
        startTime?: number,
    ) {
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

    static fromData(data: any) {
        const originChunk = SerializableVec2.fromData(data.originChunk);

        return new Pregen(
            data.size,
            data.width,
            data.widthIndex,
            data.lengthIndex,
            originChunk,
            data.direction,
            data.dimensionId,
            data.readRegions,
            data.startTime,
        )
    }

    static fromFileData(dimensionId: DimensionId) {
        const path = createPregenDataPath(dimensionId);

        if (!existsSync(path) || !isFileSync(path)) {
            return undefined;
        }

        const data = JSON.parse(readFileSync(path, 'utf-8'));

        return Pregen.fromData(data);
    }

    static fromSize(size: number, dimensionId: DimensionId, pregenOrigin?: VectorXZ) {
        const rem = size % 16;
        if (rem !== 0) {
            const sizeIncrease = 16 - rem;
            size += sizeIncrease;
        }

        const chunkWidth = size / 16;
        const width = Math.ceil(chunkWidth / 3);

        const origXZ = Math.floor(chunkWidth / 2) * -1;
        const originChunk = new SerializableVec2(
            origXZ,
            origXZ,
        )

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

        return new Pregen(
            size,
            width,
            0,
            0,
            originChunk,
            PregenDirection.Forwards,
            dimensionId,
            0,
        )
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
        }
    }

    save() {
        const path = createPregenDataPath(this.dimensionId);

        // Backing up previous pre-gen
        if (existsSync(path) && isFileSync(path)) {
            const oldDataStr = readFileSync(path, 'utf-8');
            const oldData: Pregen = JSON.parse(oldDataStr);
            const fileName = `pregenData-${DimensionId[oldData.dimensionId]}-BACKUP-${Date.now}.json`;
            let savePath = PREGEN_BACKUP_FOLDER + `pregenData-${Date.now()}`

            // Checking if backup folder exists, creating it if not
            if (!existsSync(PREGEN_BACKUP_FOLDER)) {
                mkdirSync(PREGEN_BACKUP_FOLDER);
            } else if (!isDirectorySync(PREGEN_BACKUP_FOLDER)) {
                console.error(`BACKUP FOLDER PATH NOT DIRECTORY, SAVING TO ../${fileName} INSTEAD!`);
                savePath = `../${fileName}`;
            }

            writeFileSync(savePath, oldData);
        }

        // Backing up current pregen
        writeFileSync(path, JSON.stringify(this.getFileWritableVersion(), null, 4));
    }

    getSaveTargetChunkPoses() {
        const indexOrigin = this.getIndexOrigin();

        const poses: SerializableVec2[] = [];
        for (let modX = 0; modX < 3; modX += 1) {
            for (let modZ = 0; modZ < 3; modZ += 1) {
                poses.push(new SerializableVec2(
                    indexOrigin.x + modX,
                    indexOrigin.z + modZ,
                ))
            }
        }

        return poses;
    }

    getIndexOrigin() {
        const modX = this.widthIndex * 3;
        const modZ = this.lengthIndex * 3;

        return new SerializableVec2(
            this.originChunk.x + modX,
            this.originChunk.z + modZ,
        )
    }

    updateIndexesAndDirection() {
        this.currentChunkInfo = undefined;

        switch (this.direction) {
            case PregenDirection.Forwards:
                if (this.widthIndex + 1 === this.width) {
                    // Hit end of the line, needs to move downwards
                    this.direction = PregenDirection.DownToBackward;
                    this.lengthIndex += 1;
                } else {
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
                } else {
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
        const playerChunkCorner = convertChunkPosToBlockPos(saveChunks[4], 0);
        return new SerializableVec3(
            playerChunkCorner.x + 8,
            0,
            playerChunkCorner.z + 8,
        );
    }

    addLastRegionTime(duration: number) {
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

    start(xuid: string, rate: number = 100) {
        if (pregens.has(this.dimensionId)) {
            return false;
        }

        pregens.set(this.dimensionId, this);

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

    resume(xuid: string, rate: number = 100) {
        pregens.set(this.dimensionId, this);

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
        const finishMessage = `Pregen in ${DimensionId[this.dimensionId]} finished in ${durationStr}`;
        if (!isDecayed(bedrockServer.level) && this.playerXuid !== undefined) {
            const player = bedrockServer.level.getPlayerByXuid(this.playerXuid);
            if (player !== null) {
                player.sendMessage(finishMessage);
            }

            this.playerXuid = undefined;
        }

        pregens.delete(this.dimensionId);

        console.log(finishMessage);
    }

    getPlayer() {
        if (isDecayed(bedrockServer.level) || this.playerXuid === undefined) {
            return undefined;
        }

        const player = bedrockServer.level.getPlayerByXuid(this.playerXuid);
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
        } else {
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
                `Estimated Time Remaining: ${etaStr}\n`
        }
    }
}

function durationToFormatted(duration: number) {
    const days = Math.floor(duration / 86_400_000);
    const hours = Math.floor((duration / 3_600_000) % 24);
    const minutes = Math.floor((duration / 60_000) % 60);
    const seconds = Math.floor((duration / 1_000) % 60);

    return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function _pregenTick(pregen: Pregen) {
    // Checking if entire pregen is done
    if (pregen.lengthIndex === pregen.width) {
        pregen.finish();
        return;
    }

    // If level is decayed, save pregen
    if (isDecayed(bedrockServer.level)) {
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

    const player = pregen.getPlayer()
    if (player === undefined) {
        pregen.pause();
        return;
    }

    if (player.getGameType() !== GameType.Spectator) {
        player.setGameType(GameType.Spectator);
    }

    const checkingChunks = pregen.getSaveTargetChunkPoses();

    if (pregen.currentChunkInfo === undefined) {
        pregen.currentChunkInfo = createIdleChunkInfo();
    }

    for (let i = 0; i < checkingChunks.length; i++) {
        const chunkPos = checkingChunks[i];

        // Try and save the chunk
        const res = saveChunk(chunkPos, pregen.dimensionId);

        if (res === saveChunkResult.Success || res === saveChunkResult.ChunkAlreadySaved) {
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

        player.sendMessage(`Read region ${pregen.readRegions}/${pregen.getTotalRegions()}. (ETA: ${durationToFormatted(pregen.getETA())})`)

        pregen.updateIndexesAndDirection();
    }
}

function teleportSimPlayerToPos(player: Player, pos: SerializableVec3, dimensionId: DimensionId) {
    // Teleport player to index spot if not already there
    const playerPos = player.getPosition();

    if (!pos.equal(playerPos)) {
        player.teleport(pos.toVec3(), dimensionId);
    }
}

function createPregenDataPath(dimensionId: DimensionId) {
    const fileName = `pregenData-${DimensionId[dimensionId]}.json`;
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
    ]
}