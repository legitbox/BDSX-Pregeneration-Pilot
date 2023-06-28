import {CommandPosition} from "bdsx/bds/command";
import {CommandOrigin} from "bdsx/bds/commandorigin";
import {SerializableVec3} from "./SerializableVec3";

export function handleRelativeCommandPosCords(pos: CommandPosition, origin: CommandOrigin) {
    const relativePoses = pos.getBlockPosition(origin);

    const resVec = SerializableVec3.fromVectorXYZ(pos);

    if (pos.isXRelative) {
        resVec.x = relativePoses.x;
    }

    if (pos.isYRelative) {
        resVec.y = relativePoses.y;
    }

    if (pos.isZRelative) {
        resVec.z = relativePoses.z;
    }

    return resVec;
}
