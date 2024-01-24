import { getMouse } from "./mouse";
import hsvConversions from "../shaders/hsv.rgb.wgsl";
import sandCompute from "../sand-compute/sand.compute.wgsl";

export function setupComputePipeline(
  device: GPUDevice,
  texture: GPUTexture,
  size: { width: number; height: number },
  canvas: HTMLCanvasElement
) {
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
        storageTexture: texture,
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

  const sizeBuffer = device.createBuffer({
    mappedAtCreation: true,
    size: 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage:
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.UNIFORM,
  });

  new Uint32Array(sizeBuffer.getMappedRange()).set([size.width, size.height]);
  sizeBuffer.unmap();

  const initialData = new Float32Array(size.height * size.width * 4);

  for (let i = 0; i < size.height; i++) {
    let j = 0;
    let index = (i * size.width + j) * 4;
    initialData[index] = -1;
    initialData[index + 1] = 1;
    initialData[index + 2] = 1;
    initialData[index + 3] = -1;
    j = size.width - 1;
    index = (i * size.width + j) * 4;
    initialData[index] = -1;
    initialData[index + 1] = 1;
    initialData[index + 2] = 1;
    initialData[index + 3] = -1;
  }

  for (let i = 0; i < size.width; i++) {
    let j = 0;
    let index = (j * size.width + i) * 4;
    initialData[index] = -1;
    initialData[index + 1] = 1;
    initialData[index + 2] = 1;
    initialData[index + 3] = -1;
    j = size.height - 1;
    index = (j * size.width + i) * 4;
    initialData[index] = -1;
    initialData[index + 1] = 1;
    initialData[index + 2] = 1;
    initialData[index + 3] = -1;
  }

  const center = {
    x: Math.floor(size.width / 2),
    y: Math.floor(size.height / 2),
  };
  const radius = 0;
  const halfRadius = Math.floor(radius / 2);

  for (let j = center.y - halfRadius; j < center.y + halfRadius; j++) {
    for (let i = center.x - halfRadius; i < center.x + halfRadius; i++) {
      const index = (i * size.width + j) * 4;
      initialData[index] = 1;
      initialData[index + 1] = 1;
      initialData[index + 2] = 1;
      initialData[index + 3] = 1;
    }
  }

  const data0Buffer = device.createBuffer({
    size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 4,
    usage:
      GPUBufferUsage.COPY_DST |
      GPUBufferUsage.COPY_SRC |
      GPUBufferUsage.STORAGE,
  });
  device.queue.writeBuffer(data0Buffer, 0, initialData);

  const domainOffsetBuffer = device.createBuffer({
    size: Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const mouseBuffer = device.createBuffer({
    size: Uint32Array.BYTES_PER_ELEMENT * 4, //(16),
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const particleDataBindgroup = device.createBindGroup({
    layout: particleDataBindgroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: data0Buffer },
      },
    ],
  });
  
  const sizeImageBindGroup = device.createBindGroup({
    layout: sizeImageBindgroupLayout,
    entries: [
      {
        binding: 0,
        resource: texture.createView(),
      },
      {
        binding: 1,
        resource: { buffer: sizeBuffer },
      },
      {
        binding: 2,
        resource: { buffer: domainOffsetBuffer },
      },
      {
        binding: 3,
        resource: { buffer: mouseBuffer },
      },
    ],
  });

  const ratio = {x: canvas.width / size.width, y: canvas.height / size.height};
  const drawingRadius = 20;

  let renders: number = 0;
  const encodeCompute = (encoder: GPUCommandEncoder) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = getMouse();
    const relativeMouse = {x: clamp((mouse.x - rect.x)/ratio.x, 0, size.width-1), y: clamp((mouse.y - rect.y)/ratio.y, 0, size.height-1)};
    relativeMouse.x = Math.floor(relativeMouse.x);
    relativeMouse.y = Math.floor(relativeMouse.y);
    device.queue.writeBuffer(domainOffsetBuffer, 0, new Uint32Array([renders]));
    device.queue.writeBuffer(mouseBuffer, 0, new Uint32Array([relativeMouse.x, relativeMouse.y, mouse.leftClick ? 1 : mouse.rightClick ? -1 : 0, drawingRadius]));
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, particleDataBindgroup);
    pass.setBindGroup(1, sizeImageBindGroup);
    pass.dispatchWorkgroups(size.width, size.height);
    pass.end();

    renders++;
  };

  return encodeCompute;
}

function logStorageBuffer(device: GPUDevice, storageBuffer: GPUBuffer) {
  device.queue.onSubmittedWorkDone().then(() => {
    const copyEncoder = device.createCommandEncoder();
    const readBuffer = device.createBuffer({
      label: "read data buffer",
      size: storageBuffer.size,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });

    copyEncoder.copyBufferToBuffer(
      storageBuffer,
      0,
      readBuffer,
      0,
      storageBuffer.size
    );
    const copyCommands = copyEncoder.finish();
    device.queue.submit([copyCommands]);
    readBuffer.mapAsync(GPUMapMode.READ).then(() => {
      const data = new Float32Array(readBuffer.getMappedRange());
      // const res = [] as any;
      // for (let y = 0; y < size.height; y++) {
      //   res[y] = [];
      //   for (let x = 0; x < size.width; x++) {
      //     const index = (y * size.width + x) * 4;
      //     res[y][x] = [data0[index], data0[index + 1], data0[index + 2]];
      //   }
      // }
      console.log(data);
      readBuffer.unmap();
    });
  });
}

const clamp = (val: number, min:number, max:number) => Math.min(Math.max(val, min), max)