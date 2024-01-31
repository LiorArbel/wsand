import { Mat4, mat4 } from "wgpu-matrix";
import { Renderable } from ".";
import { Texture } from "./Texture";

export class Mesh {
  vertices: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
  texture?: Texture;
  transform: Mat4;
  
  renderable?: Renderable;
  
  static defaultTexture: Texture;
  static bindGroupLayout: GPUBindGroupLayout;

  constructor(
    vertices: Float32Array,
    indices: Uint16Array,
    transform = mat4.identity(),
    uvs: Float32Array = new Float32Array(),
    normals: Float32Array = new Float32Array(),
    colors: Float32Array = new Float32Array()
  ) {
    this.vertices = vertices;
    this.indices = indices;
    this.uvs = uvs;
    this.colors = colors;
    this.normals = normals;
    this.transform = transform;
  }

  static createBindGroupLayout(device: GPUDevice) {
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
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX
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

    this.defaultTexture = new Texture(device, new Uint8Array([255, 255, 255, 255]), {height: 1, width: 1});
  }

  private buildVertexBuffer(device: GPUDevice) {
    const vertexAmount = this.vertices.length / 3;
    const posOffset = 3;
    const colorOffset = 3;
    const normalOffset = 3;
    const uvOffset = 2;
    const stride = posOffset + colorOffset + uvOffset + normalOffset;

    const actualBuffer = device.createBuffer({
      size: stride * vertexAmount * 4, //Float32
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    const vertexBuffer = new Float32Array(actualBuffer.getMappedRange());
    for (let i = 0; i < this.vertices.length / 3; i++) {
      const idx = stride * i;
      vertexBuffer[idx] = this.vertices[i * 3];
      vertexBuffer[idx + 1] = this.vertices[i * 3 + 1];
      vertexBuffer[idx + 2] = this.vertices[i * 3 + 2];
      if (this.colors[i * 3] !== undefined) {
        vertexBuffer[idx + 3] = this.colors[i * 3];
        vertexBuffer[idx + 4] = this.colors[i * 3 + 1];
        vertexBuffer[idx + 5] = this.colors[i * 3 + 2];
      }
      if (this.uvs[i * 2] !== undefined) {
        vertexBuffer[idx + 6] = this.uvs[i * 2];
        vertexBuffer[idx + 7] = this.uvs[i * 2 + 1];
      }
      if (this.normals[i * 3] !== undefined) {
        vertexBuffer[idx + 8] = this.normals[i * 3];
        vertexBuffer[idx + 9] = this.normals[i * 3 + 1];
        vertexBuffer[idx + 10] = this.normals[i * 3 + 2];
      }
    }
    actualBuffer.unmap();
    return actualBuffer;
  }

  createRenderable(device: GPUDevice) {
    const vertexBuffer = this.buildVertexBuffer(device);

    const indicesGPU = device.createBuffer({
      size: this.indices.byteLength + (this.indices.byteLength % 4),
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });
    new Uint16Array(indicesGPU.getMappedRange()).set(this.indices);
    indicesGPU.unmap();

    const uniformBuffer = device.createBuffer({
      size: 4 * 4 * 4, //mat4 * f32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(uniformBuffer.getMappedRange()).set(this.transform);
    uniformBuffer.unmap();

    const optionsBuffer = device.createBuffer({
      size: 4, //mat4 * f32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(optionsBuffer.getMappedRange()).set([]);
    optionsBuffer.unmap();

    const uniformBindgroup = device.createBindGroup({
      layout: Mesh.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: optionsBuffer
          }
        },
        {
          binding: 2,
          resource: this.texture ? this.texture.view : Mesh.defaultTexture.view
        },
        {
          binding: 3,
          resource: this.texture ? this.texture.sampler : Mesh.defaultTexture.sampler
        }
      ],
    });

    const renderable: Renderable = {
      indexCount: this.indices.length,
      indices: indicesGPU,
      vertices: vertexBuffer,
      bindGroup: uniformBindgroup,
      onBeforeRender: () => {
        device.queue.writeBuffer(uniformBuffer,0, this.transform as Float32Array);
      }
    };
    
    this.renderable = renderable;
  }
}
