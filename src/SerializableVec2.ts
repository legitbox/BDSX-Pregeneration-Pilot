import {VectorXZ} from "bdsx/common";

export class SerializableVec2 {
    x: number;
    z: number;

    constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }

    static fromData(data: any) {
        return SerializableVec2.fromVectorXZ(data);
    }

    static fromVectorXZ(vec: VectorXZ) {
        return new SerializableVec2(vec.x, vec.z);
    }
}