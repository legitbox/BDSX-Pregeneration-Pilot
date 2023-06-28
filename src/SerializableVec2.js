"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializableVec2 = void 0;
class SerializableVec2 {
    constructor(x, z) {
        this.x = x;
        this.z = z;
    }
    static fromData(data) {
        return SerializableVec2.fromVectorXZ(data);
    }
    static fromVectorXZ(vec) {
        return new SerializableVec2(vec.x, vec.z);
    }
}
exports.SerializableVec2 = SerializableVec2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VyaWFsaXphYmxlVmVjMi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIlNlcmlhbGl6YWJsZVZlYzIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxnQkFBZ0I7SUFJekIsWUFBWSxDQUFTLEVBQUUsQ0FBUztRQUM1QixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBUztRQUNyQixPQUFPLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFhO1FBQzdCLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QyxDQUFDO0NBQ0o7QUFoQkQsNENBZ0JDIn0=