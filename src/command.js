"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("bdsx/event");
const command_1 = require("bdsx/command");
const command_2 = require("bdsx/bds/command");
const nativetype_1 = require("bdsx/nativetype");
const actor_1 = require("bdsx/bds/actor");
const pregenStorage_1 = require("./pregenStorage");
const utils_1 = require("./utils");
event_1.events.serverOpen.on(() => {
    command_1.command
        .register('pregen', 'command for managing pregen', command_2.CommandPermissionLevel.Operator)
        .alias('pg')
        .overload((params, origin, output) => {
        const player = origin.getEntity();
        if (player === null || !player.isPlayer()) {
            output.error('Command needs to be ran by a player!');
            return;
        }
        if (pregenStorage_1.clientSideChunkGenEnabled) {
            output.error("You can't use this plugin while client side chunk gen is enabled!\nDisable it in server.properties!");
            return;
        }
        let dimensionId;
        if (params.dimension !== undefined) {
            dimensionId = params.dimension;
        }
        else {
            dimensionId = player.getDimensionId();
        }
        let originPos = undefined;
        if (params.customOrigin !== undefined) {
            originPos = (0, utils_1.handleRelativeCommandPosCords)(params.customOrigin, origin);
        }
        const pregen = pregenStorage_1.Pregen.fromSize(params.size, dimensionId, originPos);
        const didStart = pregen.start(player.getXuid(), params.rate);
        if (!didStart) {
            output.error('Pregen already running in specified dimension!');
        }
        else {
            output.success('Pregen started!');
        }
    }, {
        options: command_1.command.enum('options.start', 'start'),
        size: nativetype_1.int32_t,
        dimension: [command_1.command.enum('options.dimension', actor_1.DimensionId), true],
        customOrigin: [command_2.CommandPosition, true],
        rate: [nativetype_1.int32_t, true],
    })
        .overload((params, origin, output) => {
        const target = origin.getEntity();
        let dimensionId;
        if (params.dimension !== undefined) {
            dimensionId = params.dimension;
        }
        else if (target === null) {
            output.error('Dimension needs to be specified!');
            return;
        }
        else {
            dimensionId = target.getDimensionId();
        }
        let pregen = pregenStorage_1.pregens.get(dimensionId);
        if (pregen === undefined) {
            output.error('Pregen not running in that dimension!');
            return;
        }
        output.success(pregen.toString());
    }, {
        options: command_1.command.enum('options.info', 'info'),
        dimension: [command_1.command.enum('options.dimension', actor_1.DimensionId), true],
    })
        .overload((params, origin, output) => {
        const target = origin.getEntity();
        let dimensionId;
        if (params.dimension !== undefined) {
            dimensionId = params.dimension;
        }
        else if (target === null) {
            output.error('Dimension needs to be specified!');
            return;
        }
        else {
            dimensionId = target.getDimensionId();
        }
        let pregen = pregenStorage_1.pregens.get(dimensionId);
        if (pregen === undefined) {
            output.error('Pregen not running in that dimension');
            return;
        }
        pregen.pause();
        output.success('Pregen paused and saved!');
    }, {
        options: command_1.command.enum('options.pause', 'pause'),
        dimension: [command_1.command.enum('options.dimension', actor_1.DimensionId), true],
    })
        .overload((params, origin, output) => {
        const player = origin.getEntity();
        if (player === null || !player.isPlayer()) {
            output.error('Command needs to be ran by a player');
            return;
        }
        if (pregenStorage_1.clientSideChunkGenEnabled) {
            output.error("You can't use this plugin while client side chunk gen is enabled!\nDisable it in server.properties!");
            return;
        }
        let dimensionId;
        if (params.dimension !== undefined) {
            dimensionId = params.dimension;
        }
        else {
            dimensionId = player.getDimensionId();
        }
        let pregen = pregenStorage_1.pregens.get(dimensionId);
        if (pregen === undefined) {
            pregen = pregenStorage_1.Pregen.fromFileData(dimensionId);
            if (pregen === undefined) {
                output.error('Pregen hasn\'t been started or backed up in that dimension!');
                return;
            }
        }
        pregen.resume(player.getXuid(), params.rate);
    }, {
        options: command_1.command.enum('options.resume', 'resume'),
        dimension: [command_1.command.enum('options.dimension', actor_1.DimensionId), true],
        rate: [nativetype_1.int32_t, true],
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWFuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbW1hbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0M7QUFDbEMsMENBQXFDO0FBQ3JDLDhDQUF5RTtBQUN6RSxnREFBd0M7QUFDeEMsMENBQTJDO0FBQzNDLG1EQUEyRTtBQUUzRSxtQ0FBc0Q7QUFFdEQsY0FBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO0lBQ3RCLGlCQUFPO1NBQ0YsUUFBUSxDQUFDLFFBQVEsRUFBRSw2QkFBNkIsRUFBRSxnQ0FBc0IsQ0FBQyxRQUFRLENBQUM7U0FDbEYsS0FBSyxDQUFDLElBQUksQ0FBQztTQUNYLFFBQVEsQ0FBQyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWxDLElBQUksTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxDQUFDLENBQUM7WUFDckQsT0FBTztTQUNWO1FBRUQsSUFBSSx5Q0FBeUIsRUFBRTtZQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDLHFHQUFxRyxDQUFDLENBQUM7WUFDcEgsT0FBTztTQUNWO1FBRUQsSUFBSSxXQUF3QixDQUFDO1FBQzdCLElBQUksTUFBTSxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7WUFDaEMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUM7U0FDbEM7YUFBTTtZQUNILFdBQVcsR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDekM7UUFFRCxJQUFJLFNBQVMsR0FBaUMsU0FBUyxDQUFDO1FBQ3hELElBQUksTUFBTSxDQUFDLFlBQVksS0FBSyxTQUFTLEVBQUU7WUFDbkMsU0FBUyxHQUFHLElBQUEscUNBQTZCLEVBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMxRTtRQUVELE1BQU0sTUFBTSxHQUFHLHNCQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3BFLE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3RCxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ1gsTUFBTSxDQUFDLEtBQUssQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1NBQ2pFO2FBQU07WUFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7U0FDckM7SUFDTCxDQUFDLEVBQUU7UUFDQyxPQUFPLEVBQUUsaUJBQU8sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFDLE9BQU8sQ0FBQztRQUM5QyxJQUFJLEVBQUUsb0JBQU87UUFDYixTQUFTLEVBQUUsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxtQkFBVyxDQUFDLEVBQUUsSUFBSSxDQUFDO1FBQ2pFLFlBQVksRUFBRSxDQUFDLHlCQUFlLEVBQUUsSUFBSSxDQUFDO1FBQ3JDLElBQUksRUFBRSxDQUFDLG9CQUFPLEVBQUUsSUFBSSxDQUFDO0tBQ3hCLENBQUM7U0FDRCxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVsQyxJQUFJLFdBQVcsQ0FBQztRQUNoQixJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQ2hDLFdBQVcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1NBQ2xDO2FBQU0sSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFO1lBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUNqRCxPQUFPO1NBQ1Y7YUFBTTtZQUNILFdBQVcsR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDekM7UUFFRCxJQUFJLE1BQU0sR0FBRyx1QkFBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0QyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ3RELE9BQU87U0FDVjtRQUVELE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDdEMsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGlCQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFDN0MsU0FBUyxFQUFFLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsbUJBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQztLQUNwRSxDQUFDO1NBQ0QsUUFBUSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFFbEMsSUFBSSxXQUFXLENBQUM7UUFDaEIsSUFBSSxNQUFNLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUNoQyxXQUFXLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztTQUNsQzthQUFNLElBQUksTUFBTSxLQUFLLElBQUksRUFBRTtZQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7WUFDakQsT0FBTztTQUNWO2FBQU07WUFDSCxXQUFXLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxNQUFNLEdBQUcsdUJBQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQztZQUNyRCxPQUFPO1NBQ1Y7UUFFRCxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDZixNQUFNLENBQUMsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7SUFDL0MsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGlCQUFPLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUM7UUFDL0MsU0FBUyxFQUFFLENBQUMsaUJBQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsbUJBQVcsQ0FBQyxFQUFFLElBQUksQ0FBQztLQUNwRSxDQUFDO1NBQ0QsUUFBUSxDQUFDLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNqQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFFbEMsSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUNwRCxPQUFPO1NBQ1Y7UUFFRCxJQUFJLHlDQUF5QixFQUFFO1lBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUMscUdBQXFHLENBQUMsQ0FBQztZQUNwSCxPQUFPO1NBQ1Y7UUFFRCxJQUFJLFdBQVcsQ0FBQztRQUNoQixJQUFJLE1BQU0sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQ2hDLFdBQVcsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDO1NBQ2xDO2FBQU07WUFDSCxXQUFXLEdBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxNQUFNLEdBQUcsdUJBQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsSUFBSSxNQUFNLEtBQUssU0FBUyxFQUFFO1lBQ3RCLE1BQU0sR0FBRyxzQkFBTSxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUxQyxJQUFJLE1BQU0sS0FBSyxTQUFTLEVBQUU7Z0JBQ3RCLE1BQU0sQ0FBQyxLQUFLLENBQUMsNkRBQTZELENBQUMsQ0FBQztnQkFDNUUsT0FBTzthQUNWO1NBQ0o7UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxFQUFFO1FBQ0MsT0FBTyxFQUFFLGlCQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLFFBQVEsQ0FBQztRQUNqRCxTQUFTLEVBQUUsQ0FBQyxpQkFBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxtQkFBVyxDQUFDLEVBQUUsSUFBSSxDQUFDO1FBQ2pFLElBQUksRUFBRSxDQUFDLG9CQUFPLEVBQUUsSUFBSSxDQUFDO0tBQ3hCLENBQUMsQ0FBQTtBQUNWLENBQUMsQ0FBQyxDQUFBIn0=