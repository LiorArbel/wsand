import { getMouse } from "../renderer/mouse";
import { createBuffers } from "./createBuffers";
import { createLayoutsAndPipeline } from "./createLayoutsAndPipeline";
import { getInitialData } from "./getInitialData";

export class SandSimulation {
  ratio: {
    x: number,
    y: number,
  };
  drawingRadius = 20;
  size: { width: number; height: number };
  canvas: HTMLCanvasElement;
  renders: number = 0;

  device: GPUDevice;
  computePipeline: GPUComputePipeline;
  particleDataBindgroupLayout: GPUBindGroupLayout;
  sizeImageBindgroupLayout: GPUBindGroupLayout;

  particleDataBuffer: GPUBuffer;
  sizeBuffer: GPUBuffer;
  domainOffsetBuffer: GPUBuffer;
  mouseBuffer: GPUBuffer;

  particleDataBindgroup: GPUBindGroup | undefined;
  sizeImageBindGroup: GPUBindGroup | undefined;

  public constructor(
    device: GPUDevice,
    size: { width: number; height: number },
    canvas: HTMLCanvasElement
  ) {
    this.device = device;
    this.canvas = canvas;
    this.size = size;

    ({
      computePipeline: this.computePipeline,
      particleDataBindgroupLayout: this.particleDataBindgroupLayout,
      sizeImageBindgroupLayout: this.sizeImageBindgroupLayout,
    } = createLayoutsAndPipeline(device));

    ({
      particleDataBuffer: this.particleDataBuffer,
      sizeBuffer: this.sizeBuffer,
      domainOffsetBuffer: this.domainOffsetBuffer,
      mouseBuffer: this.mouseBuffer,
    } = createBuffers(device, size));

    this.ratio = {
      x: canvas.width / size.width,
      y: canvas.height / size.height,
    };
  }

  public bindToTexture(texture: GPUTexture){
    this.particleDataBindgroup = this.device.createBindGroup({
      layout: this.particleDataBindgroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.particleDataBuffer },
        },
      ],
    });
  
    this.sizeImageBindGroup = this.device.createBindGroup({
      layout: this.sizeImageBindgroupLayout,
      entries: [
        {
          binding: 0,
          resource: texture.createView(),
        },
        {
          binding: 1,
          resource: { buffer: this.sizeBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.domainOffsetBuffer },
        },
        {
          binding: 3,
          resource: { buffer: this.mouseBuffer },
        },
      ],
    });
  }

  public draw(){
    if(!this.particleDataBindgroup || !this.sizeImageBindGroup){
      console.error("Trying to draw before binding bindgroups!");
      return;
    }

    const encoder = this.device.createCommandEncoder();

      const rect = this.canvas.getBoundingClientRect(); // TODO: find a solution where this can be queried outside of the render loop, the problem is resize or movement of the rect in runtime
      const mouse = getMouse();
      const relativeMouse = {
        x: clamp((mouse.x - rect.x) / this.ratio.x, 0, this.size.width - 1),
        y: clamp((mouse.y - rect.y) / this.ratio.y, 0, this.size.height - 1),
      };
      relativeMouse.x = Math.floor(relativeMouse.x);
      relativeMouse.y = Math.floor(relativeMouse.y);
      this.device.queue.writeBuffer(
        this.domainOffsetBuffer,
        0,
        new Uint32Array([this.renders])
      );
      this.device.queue.writeBuffer(
        this.mouseBuffer,
        0,
        new Uint32Array([
          relativeMouse.x,
          relativeMouse.y,
          mouse.leftClick ? 1 : mouse.rightClick ? -1 : 0,
          this.drawingRadius,
        ])
      );
      const pass = encoder.beginComputePass();
      pass.setPipeline(this.computePipeline);
      pass.setBindGroup(0, this.particleDataBindgroup);
      pass.setBindGroup(1, this.sizeImageBindGroup);
      pass.dispatchWorkgroups(this.size.width, this.size.height);
      pass.end();

      this.renders++;
      this.device.queue.submit([encoder.finish()]);
  }
}

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);
