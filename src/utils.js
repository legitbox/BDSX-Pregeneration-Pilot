"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRelativeCommandPosCords = void 0;
const SerializableVec3_1 = require("./SerializableVec3");
function handleRelativeCommandPosCords(pos, origin) {
    const relativePoses = pos.getBlockPosition(origin);
    const resVec = SerializableVec3_1.SerializableVec3.fromVectorXYZ(pos);
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
exports.handleRelativeCommandPosCords = handleRelativeCommandPosCords;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSx5REFBb0Q7QUFFcEQsU0FBZ0IsNkJBQTZCLENBQUMsR0FBb0IsRUFBRSxNQUFxQjtJQUNyRixNQUFNLGFBQWEsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbkQsTUFBTSxNQUFNLEdBQUcsbUNBQWdCLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRW5ELElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRTtRQUNqQixNQUFNLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUM7S0FDOUI7SUFFRCxJQUFJLEdBQUcsQ0FBQyxXQUFXLEVBQUU7UUFDakIsTUFBTSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDO0tBQzlCO0lBRUQsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFO1FBQ2pCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQztLQUM5QjtJQUVELE9BQU8sTUFBTSxDQUFDO0FBQ2xCLENBQUM7QUFsQkQsc0VBa0JDIn0=