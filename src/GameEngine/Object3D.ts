import { Mat4, Vec3, mat4, vec2, vec3, vec4 } from "wgpu-matrix";

export class Object3D {
  private _position: Vec3;
  set position(val){
    this.dirty = true;
    this._position = val;
  }
  get position(){
    return this._position
  }
  private _rotation: Vec3;
  set rotation(val){
    this.dirty = true;
    this._rotation = val;
  }
  get rotation(){
    return this._rotation
  }
  private _scale: Vec3;
  set scale(val){
    this.dirty = true;
    this._scale = val;
  }
  get scale(){
    return this._scale
  }
  private dirty = true;

  constructor(
    position: Vec3 = vec3.create(0, 0, 0),
    rotation: Vec3 = vec3.create(0, 0, 0),
    scale: Vec3 = vec3.create(1, 1, 1)
  ) {
    this._position = position;
    this._rotation = rotation;
    this._scale = scale;
  }

  clone(){
    return new Object3D(this._position, this._rotation, this._scale);
  }

  getForwad(){
    const quat = Object3D.ToQuaternion(this._rotation);
    return vec3.transformQuat(vec3.create(0,0,1), quat);
  }

  getQuat(){
    return Object3D.ToQuaternion(this._rotation);
  }

  private cachedTrasnfrom:Mat4|undefined = undefined;
  getGlobalTransform() {
    if(!this.cachedTrasnfrom || this.dirty){
      this.cachedTrasnfrom = mat4.scale(
        mat4.multiply(
          mat4.translation(this.position),
          mat4.fromQuat(Object3D.ToQuaternion(this.rotation))
        ),
        this.scale
      );
      this.dirty = false;
    }
    return this.cachedTrasnfrom;
  }

  static ToQuaternion(rotation: Vec3) {
    // Abbreviations for the various angular functions
    const [roll, pitch, yaw] = rotation;
    const cr = Math.cos(roll * 0.5);
    const sr = Math.sin(roll * 0.5);
    const cp = Math.cos(pitch * 0.5);
    const sp = Math.sin(pitch * 0.5);
    const cy = Math.cos(yaw * 0.5);
    const sy = Math.sin(yaw * 0.5);

    return vec4.create(
      cr * cp * cy + sr * sp * sy,
      sr * cp * cy - cr * sp * sy,
      cr * sp * cy + sr * cp * sy,
      cr * cp * sy - sr * sp * cy
    );
  }
}
