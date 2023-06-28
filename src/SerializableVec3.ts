import {Vec3} from "bdsx/bds/blockpos";
import {VectorXYZ} from "bdsx/common";

export class SerializableVec3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromVectorXYZ(vec: VectorXYZ) {
        return new SerializableVec3(vec.x, vec.y, vec.z);
    }

    toVec3() {
        return Vec3.create(this.x, this.y, this.z);
    }

    equal(vec: VectorXYZ) {
        return vec.x === this.x && vec.z === this.z
    }
}