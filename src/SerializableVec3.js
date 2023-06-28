"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableVec3 = void 0;
const blockpos_1 = require("bdsx/bds/blockpos");
class SerializableVec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static fromVectorXYZ(vec) {
        return new SerializableVec3(vec.x, vec.y, vec.z);
    }
    toVec3() {
        return blockpos_1.Vec3.create(this.x, this.y, this.z);
    }
    equal(vec) {
        return vec.x === this.x && vec.z === this.z;
    }
}
exports.SerializableVec3 = SerializableVec3;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VyaWFsaXphYmxlVmVjMy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlNlcmlhbGl6YWJsZVZlYzMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsZ0RBQXVDO0FBR3ZDLE1BQWEsZ0JBQWdCO0lBS3pCLFlBQVksQ0FBUyxFQUFFLENBQVMsRUFBRSxDQUFTO1FBQ3ZDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUM7SUFFRCxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQWM7UUFDL0IsT0FBTyxJQUFJLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVELE1BQU07UUFDRixPQUFPLGVBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQWM7UUFDaEIsT0FBTyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFBO0lBQy9DLENBQUM7Q0FDSjtBQXRCRCw0Q0FzQkMifQ==