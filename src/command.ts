import {events} from "bdsx/event";
import {command} from "bdsx/command";
import {CommandPermissionLevel, CommandPosition} from "bdsx/bds/command";
import {int32_t} from "bdsx/nativetype";
import {DimensionId} from "bdsx/bds/actor";
import {Pregen, pregens} from "./pregenStorage";
import {SerializableVec3} from "./SerializableVec3";
import {handleRelativeCommandPosCords} from "./utils";

events.serverOpen.on(() => {
    command
        .register('pregen', 'command for managing pregen', CommandPermissionLevel.Operator)
        .alias('pg')
        .overload((params, origin, output) => {
            const player = origin.getEntity();

            if (player === null || !player.isPlayer()) {
                output.error('Command needs to be ran by a player!');
                return;
            }

            let dimensionId: DimensionId;
            if (params.dimension !== undefined) {
                dimensionId = params.dimension;
            } else {
                dimensionId = player.getDimensionId();
            }

            let originPos: SerializableVec3 | undefined = undefined;
            if (params.customOrigin !== undefined) {
                originPos = handleRelativeCommandPosCords(params.customOrigin, origin);
            }

            const pregen = Pregen.fromSize(params.size, dimensionId, originPos);
            const didStart = pregen.start(player.getXuid(), params.rate);
            if (!didStart) {
                output.error('Pregen already running in specified dimension!')
            } else {
                output.success('Pregen started!');
            }
        }, {
            options: command.enum('options.start','start'),
            size: int32_t,
            dimension: [command.enum('options.dimension', DimensionId), true],
            customOrigin: [CommandPosition, true],
            rate: [int32_t, true],
        })
        .overload((params, origin, output) => {
            const target = origin.getEntity();

            let dimensionId;
            if (params.dimension !== undefined) {
                dimensionId = params.dimension;
            } else if (target === null) {
                output.error('Dimension needs to be specified!');
                return;
            } else {
                dimensionId = target.getDimensionId();
            }

            let pregen = pregens.get(dimensionId);
            if (pregen === undefined) {
                output.error('Pregen not running in that dimension!');
                return;
            }

            output.success(pregen.toString());
        }, {
            options: command.enum('options.info', 'info'),
            dimension: [command.enum('options.dimension', DimensionId), true],
        })
        .overload((params, origin, output) => {
            const target = origin.getEntity();

            let dimensionId;
            if (params.dimension !== undefined) {
                dimensionId = params.dimension;
            } else if (target === null) {
                output.error('Dimension needs to be specified!');
                return;
            } else {
                dimensionId = target.getDimensionId();
            }

            let pregen = pregens.get(dimensionId);
            if (pregen === undefined) {
                output.error('Pregen not running in that dimension');
                return;
            }

            pregen.pause();
            output.success('Pregen paused and saved!');
        }, {
            options: command.enum('options.pause', 'pause'),
            dimension: [command.enum('options.dimension', DimensionId), true],
        })
        .overload((params, origin, output) => {
            const player = origin.getEntity();

            if (player === null || !player.isPlayer()) {
                output.error('Command needs to be ran by a player');
                return;
            }

            let dimensionId;
            if (params.dimension !== undefined) {
                dimensionId = params.dimension;
            } else {
                dimensionId = player.getDimensionId();
            }

            let pregen = pregens.get(dimensionId);
            if (pregen === undefined) {
                pregen = Pregen.fromFileData(dimensionId);

                if (pregen === undefined) {
                    output.error('Pregen hasn\'t been started or backed up in that dimension!');
                    return;
                }
            }

            pregen.resume(player.getXuid(), params.rate)
        }, {
            options: command.enum('options.resume', 'resume'),
            dimension: [command.enum('options.dimension', DimensionId), true],
            rate: [int32_t, true],
        })
})
