import { mat4, vec3 } from "wgpu-matrix";
import { Object3D } from "./Object3D";

export class Camera {
  o3d: Object3D;
  fov: number;
  near: number;
  far: number;
  aspect: number;

  public getTransfrom() {
    // Calculate the view matrix as the inverse of the camera's global transformation
    let viewMatrix = mat4.invert(this.o3d.getGlobalTransform());
    // Calculate the projection matrix
    let projectionMatrix = mat4.perspective(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
    // Return the combined view-projection matrix upside down
    return mat4.scale(mat4.multiply(projectionMatrix, viewMatrix), vec3.create(1,-1,1));
  }

  constructor(
    o3d: Object3D,
    fovInRad: number,
    aspect: number,
    near: number,
    far: number
  ) {
    this.o3d = o3d;
    this.fov = fovInRad;
    this.near = near;
    this.far = far;
    this.aspect = aspect;
  }
}
