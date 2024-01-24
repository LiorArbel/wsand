import vertShaderCode from "../shaders/triangle.vert.wgsl";
import fragShaderCode from "../shaders/triangle.frag.wgsl";
import { setupComputePipeline } from "./computePipeline";
import { createTexture } from "./createTexture";

const explicitFeatures:string[] = [
  //"chromium-experimental-read-write-storage-texture"
];

const startTime = new Date().getTime() / 1000;

const getDeltaTime = () => new Date().getTime() / 1000 - startTime;

const gameSize = {width: 256*2, height: 256};

const FRAME_DELAY = (1000/80);

const uniformData = new Float32Array([
  // ♟️ ModelViewProjection Matrix (Identity)
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,

  // 🔴 Primary Color
  0.9,
  0.1,
  0.3,
  1.0,

  // 🟣 Accent Color
  0.8,
  0.2,
  0.8,
  1.0,

  //time
  getDeltaTime(),

  //padding
  0.0,
  0.0,
  0.0,
]);

export async function createRenderer(canvas: HTMLCanvasElement) {
  const entry = navigator.gpu;
  if (!entry) {
    throw new Error("WebGPU is not supported on this browser.");
  }

  // 🔌 Physical Device Adapter
  const adapter = await getAdapter(entry);

  // 💻 Logical Device
  const device = await getDevice(adapter);

  const queue = device.queue;

  const context = await getContext(canvas, device);

  // 🤔 Create Depth Backing
  const depthTextureDesc: GPUTextureDescriptor = {
    size: [canvas.width, canvas.height, 1],
    dimension: "2d",
    format: "depth24plus-stencil8",
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
  };

  const depthTexture: GPUTexture = device.createTexture(depthTextureDesc);
  const depthTextureView: GPUTextureView = depthTexture.createView();

  // ✋ Declare canvas context image handles
  let colorTexture: GPUTexture = context.getCurrentTexture();
  let colorTextureView: GPUTextureView = colorTexture.createView();

  // ✋ Declare shader module handles
  const vsmDesc = { code: vertShaderCode };
  const vertModule: GPUShaderModule = device.createShaderModule(vsmDesc);

  const fsmDesc = { code: fragShaderCode };
  const fragModule: GPUShaderModule = device.createShaderModule(fsmDesc);

  const uniformBuffer = getUniformData(device);

  const imageTexture = createTexture(device, gameSize);

  const { layout, uniformBindGroup } = await getLayoutAndBindGroup(
    device,
    uniformBuffer,
    imageTexture
  );

  const encodeCompute = setupComputePipeline(device, imageTexture, gameSize, canvas);

  const pipeline = getPipeline(layout, device, fragModule, vertModule);

  const vertBuffer = getVertexBuffer(device);

  // ✋ Declare command handles
  let commandEncoder: GPUCommandEncoder;
  let passEncoder: GPURenderPassEncoder;

  // ✍️ Write commands to send to the GPU
  const encodeCommands = () => {
    let colorAttachment: GPURenderPassColorAttachment = {
      view: colorTextureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: "clear",
      storeOp: "store",
    };

    const depthAttachment: GPURenderPassDepthStencilAttachment = {
      view: depthTextureView,
      depthClearValue: 1,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilClearValue: 0,
      stencilLoadOp: "clear",
      stencilStoreOp: "store",
    };

    const renderPassDesc: GPURenderPassDescriptor = {
      colorAttachments: [colorAttachment],
      depthStencilAttachment: depthAttachment,
    };

    commandEncoder = device.createCommandEncoder();
    
    // 🖌️ Encode drawing commands
    passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setPipeline(pipeline);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setScissorRect(0, 0, canvas.width, canvas.height);
    passEncoder.setVertexBuffer(0, vertBuffer);
    passEncoder.draw(6);
    passEncoder.end();

    encodeCompute(commandEncoder);

    uniformData[24] = getDeltaTime();
    queue.writeBuffer(uniformBuffer, uniformData.byteOffset, uniformData);
    queue.submit([commandEncoder.finish()]);
  };

  const render = () => {
    colorTexture = context.getCurrentTexture();
    colorTextureView = colorTexture.createView();

    encodeCommands();

    if(FRAME_DELAY > 0){
      setTimeout(() => {
        requestAnimationFrame(render);
      },FRAME_DELAY)
    } else {
      requestAnimationFrame(render)
    }
  };

  return render;
}

function getUniformData(device: GPUDevice) {
  // ✋ Declare buffer handles
  const uniformBuffer: GPUBuffer = createBuffer(
    device,
    uniformData,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  );
  return uniformBuffer;
}

async function getLayoutAndBindGroup(
  device: GPUDevice,
  uniformBuffer: GPUBuffer,
  mainTexture: GPUTexture
) {
  // 📁 Bind Group Layout
  const uniformBindGroupLayout: GPUBindGroupLayout =
    device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ],
    });

  // Create a sampler with linear filtering for smooth interpolation.
  const sampler = device.createSampler({
    magFilter: "nearest",
    minFilter: "nearest",
  });

  // 🗄️ Bind Group
  // ✍ This would be used when *encoding commands*
  const uniformBindGroup: GPUBindGroup = device.createBindGroup({
    layout: uniformBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
      {
        binding: 1,
        resource: sampler,
      },
      {
        binding: 2,
        resource: mainTexture.createView(),
      },
    ],
  });

  // 🗂️ Pipeline Layout
  // 👩‍🔧 This would be used as a member of a GPUPipelineDescriptor when *creating a pipeline*
  const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
  const layout: GPUPipelineLayout =
    device.createPipelineLayout(pipelineLayoutDesc);

  return { layout, uniformBindGroup };
}

async function getAdapter(entry: GPU) {
  // 🔌 Physical Device Adapter
  const adapter: GPUAdapter | null = await entry.requestAdapter();

  if (!adapter) {
    throw new Error("Couldn't get adapter.");
  }

  if(!explicitFeatures.every(f => adapter.features.has(f))){
    console.error(explicitFeatures, [...adapter.features.values()]);
    throw new Error("Not all features available!");
  }

  return adapter;
}

async function getDevice(adapter: GPUAdapter) {
  // 💻 Logical Device
  const device: GPUDevice | null = await adapter.requestDevice();

  if (!device) {
    throw new Error("Couldn't get device.");
  }
  return device;
}

async function getContext(canvas: HTMLCanvasElement, device: GPUDevice) {
  // ✋ Declare context handle
  let context: GPUCanvasContext | null = null;

  // ⚪ Create Context
  context = canvas.getContext("webgpu");

  if (!context) {
    throw new Error("Couldn't create webgpu context");
  }

  // ⛓️ Configure Context
  const canvasConfig: GPUCanvasConfiguration = {
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    alphaMode: "opaque",
  };

  context.configure(canvasConfig);

  return context;
}

function getVertexBuffer(device: GPUDevice) {
  // 📈 Position Vertex Buffer Data
  const verts = new Float32Array([
    // pos
    -1.0, -1.0, 0.0,
    // color
    0.0, 1.0, 0.0,
    //uv,
    0.0, 0.0,
    // pos
    1.0, -1.0, 0.0,
    //color
    1.0, 0.0, 0.0,
    //uv
    1.0, 0.0,
    // pos
    1.0, 1.0, 0.0,
    //color
    0.0, 0.0, 1.0,
    //uv
    1.0, 1.0,
    // pos
    1.0, 1.0, 0.0,
    //color
    1.0, 0.0, 0.0,
    //uv
    1.0, 1.0,
    // pos
    -1.0, 1.0, 0.0,
    //color
    0.0, 1.0, 0.0,
    //uv
    0.0, 1.0,
    // pos
    -1.0, -1.0, 0.0,
    //color
    0.0, 0.0, 1.0,
    //uv
    0.0, 0.0,
  ]);

  const vertBuffer = createBuffer(device, verts, GPUBufferUsage.VERTEX);

  return vertBuffer;
}

// 👋 Helper function for creating GPUBuffer(s) out of Typed Arrays
function createBuffer(
  device: GPUDevice,
  arr: Float32Array | Uint16Array,
  usage: number
) {
  // 📏 Align to 4 bytes (thanks @chrimsonite)
  let desc = {
    size: (arr.byteLength + 3) & ~3,
    usage,
    mappedAtCreation: true,
  };
  let buffer = device.createBuffer(desc);

  const writeArray =
    arr instanceof Uint16Array
      ? new Uint16Array(buffer.getMappedRange())
      : new Float32Array(buffer.getMappedRange());
  writeArray.set(arr);
  buffer.unmap();
  return buffer;
}

function getPipeline(
  layout: GPUPipelineLayout,
  device: GPUDevice,
  fragModule: GPUShaderModule,
  vertModule: GPUShaderModule
) {
  // ⚗️ Graphics Pipeline

  // 🌑 Depth
  const depthStencil: GPUDepthStencilState = {
    depthWriteEnabled: true,
    depthCompare: "less",
    format: "depth24plus-stencil8",
  };

  // 🎭 Shader Stages
  const vertex: GPUVertexState = {
    module: vertModule,
    entryPoint: "main",
    buffers: [
      {
        attributes: [
          {
            shaderLocation: 0, // @location(0)
            offset: 0,
            format: "float32x3",
          },
          {
            shaderLocation: 1, // @location(1)
            offset: 4 * 3,
            format: "float32x3",
          },
          {
            shaderLocation: 2, // @location(2)
            offset: 4 * 6,
            format: "float32x2",
          },
        ],
        arrayStride: 4 * 8, // sizeof(float) * 8
        stepMode: "vertex",
      },
    ],
  };

  // 🌀 Color/Blend State
  const colorState: GPUColorTargetState = {
    format: "bgra8unorm",
  };

  const fragment: GPUFragmentState = {
    module: fragModule,
    entryPoint: "main",
    targets: [colorState],
  };

  // 🟨 Rasterization
  const primitive: GPUPrimitiveState = {
    frontFace: "cw",
    cullMode: "none",
    topology: "triangle-list",
  };

  const pipelineDesc: GPURenderPipelineDescriptor = {
    layout,
    vertex,
    fragment,
    primitive,
    depthStencil,
  };

  const pipeline: GPURenderPipeline = device.createRenderPipeline(pipelineDesc);
  return pipeline;
}
