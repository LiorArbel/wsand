import { mat4 } from "wgpu-matrix";
import { Mesh } from "./Mesh";

export class TexturedMesh extends Mesh {
  constructor(
    vertices: Float32Array,
    indices: Uint16Array,
    texture: GPUTexture,
    transform = mat4.identity(),
    uvs: Float32Array = new Float32Array(),
    normals: Float32Array = new Float32Array(),
    colors: Float32Array = new Float32Array()
  ) {
    super(vertices, indices, transform, uvs, normals, colors);
  }

  static override createBindGroupLayout(device: GPUDevice) {
    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0, //transform
          buffer: {},
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 1, // options
          buffer: {},
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        },
        {
          binding: 2, // texture
          texture: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 3, // sampler
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    });
  }
}
