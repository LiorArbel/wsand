import hsvConversions from "../shaders/hsv.rgb.wgsl";
import sandCompute from "../sand-compute/sand.compute.wgsl";

export function createLayoutsAndPipeline(device: GPUDevice){
    const particleDataBindgroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "storage",
          },
        },
      ],
    });
    const sizeImageBindgroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {format: "rgba8unorm"},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "uniform",
          },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {
            type: "uniform"
          }
        }
      ],
    });
  
    const computePipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [particleDataBindgroupLayout, sizeImageBindgroupLayout],
      }),
      compute: {
        module: device.createShaderModule({
          code: hsvConversions + sandCompute,
        }),
        entryPoint: "main",
      },
    });
    
    return {computePipeline, particleDataBindgroupLayout, sizeImageBindgroupLayout}
  }