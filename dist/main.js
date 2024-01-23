/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const renderer_1 = __webpack_require__(1);
function comp() {
    return __awaiter(this, void 0, void 0, function* () {
        const canvas = document.createElement("canvas");
        canvas.height = 512;
        canvas.width = 512 * 2;
        const renderFunc = yield (0, renderer_1.createRenderer)(canvas);
        const element = document.createElement("div");
        element.innerHTML = ["Hello", "typescript"].join(" ");
        element.appendChild(canvas);
        return { renderFunc, element };
    });
}
setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
    const { element, renderFunc } = yield comp();
    document.body.appendChild(element);
    const btn = document.createElement("button");
    btn.textContent = "next frame";
    btn.onclick = renderFunc;
    document.body.appendChild(btn);
    renderFunc();
}), 0);


/***/ }),
/* 1 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createRenderer = void 0;
const triangle_vert_wgsl_1 = __importDefault(__webpack_require__(2));
const triangle_frag_wgsl_1 = __importDefault(__webpack_require__(3));
const computePipeline_1 = __webpack_require__(4);
const createTexture_1 = __webpack_require__(7);
const explicitFeatures = [
//"chromium-experimental-read-write-storage-texture"
];
const startTime = new Date().getTime() / 1000;
const getDeltaTime = () => new Date().getTime() / 1000 - startTime;
const gameSize = { width: 64 * 2, height: 64 };
const FRAME_DELAY = 0;
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
function createRenderer(canvas) {
    return __awaiter(this, void 0, void 0, function* () {
        const entry = navigator.gpu;
        if (!entry) {
            throw new Error("WebGPU is not supported on this browser.");
        }
        // 🔌 Physical Device Adapter
        const adapter = yield getAdapter(entry);
        // 💻 Logical Device
        const device = yield getDevice(adapter);
        const queue = device.queue;
        const context = yield getContext(canvas, device);
        // 🤔 Create Depth Backing
        const depthTextureDesc = {
            size: [canvas.width, canvas.height, 1],
            dimension: "2d",
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
        };
        const depthTexture = device.createTexture(depthTextureDesc);
        const depthTextureView = depthTexture.createView();
        // ✋ Declare canvas context image handles
        let colorTexture = context.getCurrentTexture();
        let colorTextureView = colorTexture.createView();
        // ✋ Declare shader module handles
        const vsmDesc = { code: triangle_vert_wgsl_1.default };
        const vertModule = device.createShaderModule(vsmDesc);
        const fsmDesc = { code: triangle_frag_wgsl_1.default };
        const fragModule = device.createShaderModule(fsmDesc);
        const uniformBuffer = getUniformData(device);
        const imageTexture = (0, createTexture_1.createTexture)(device, gameSize);
        const { layout, uniformBindGroup } = yield getLayoutAndBindGroup(device, uniformBuffer, imageTexture);
        const encodeCompute = (0, computePipeline_1.setupComputePipeline)(device, imageTexture, gameSize, canvas);
        const pipeline = getPipeline(layout, device, fragModule, vertModule);
        const vertBuffer = getVertexBuffer(device);
        // ✋ Declare command handles
        let commandEncoder;
        let passEncoder;
        // ✍️ Write commands to send to the GPU
        const encodeCommands = () => {
            let colorAttachment = {
                view: colorTextureView,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store",
            };
            const depthAttachment = {
                view: depthTextureView,
                depthClearValue: 1,
                depthLoadOp: "clear",
                depthStoreOp: "store",
                stencilClearValue: 0,
                stencilLoadOp: "clear",
                stencilStoreOp: "store",
            };
            const renderPassDesc = {
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
            if (FRAME_DELAY > 0) {
                setTimeout(() => {
                    requestAnimationFrame(render);
                }, FRAME_DELAY);
            }
            else {
                requestAnimationFrame(render);
            }
        };
        return render;
    });
}
exports.createRenderer = createRenderer;
function getUniformData(device) {
    // ✋ Declare buffer handles
    const uniformBuffer = createBuffer(device, uniformData, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    return uniformBuffer;
}
function getLayoutAndBindGroup(device, uniformBuffer, mainTexture) {
    return __awaiter(this, void 0, void 0, function* () {
        // 📁 Bind Group Layout
        const uniformBindGroupLayout = device.createBindGroupLayout({
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
        const uniformBindGroup = device.createBindGroup({
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
        const layout = device.createPipelineLayout(pipelineLayoutDesc);
        return { layout, uniformBindGroup };
    });
}
function getAdapter(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        // 🔌 Physical Device Adapter
        const adapter = yield entry.requestAdapter();
        if (!adapter) {
            throw new Error("Couldn't get adapter.");
        }
        if (!explicitFeatures.every(f => adapter.features.has(f))) {
            console.error(explicitFeatures, [...adapter.features.values()]);
            throw new Error("Not all features available!");
        }
        return adapter;
    });
}
function getDevice(adapter) {
    return __awaiter(this, void 0, void 0, function* () {
        // 💻 Logical Device
        const device = yield adapter.requestDevice();
        if (!device) {
            throw new Error("Couldn't get device.");
        }
        return device;
    });
}
function getContext(canvas, device) {
    return __awaiter(this, void 0, void 0, function* () {
        // ✋ Declare context handle
        let context = null;
        // ⚪ Create Context
        context = canvas.getContext("webgpu");
        if (!context) {
            throw new Error("Couldn't create webgpu context");
        }
        // ⛓️ Configure Context
        const canvasConfig = {
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
            alphaMode: "opaque",
        };
        context.configure(canvasConfig);
        return context;
    });
}
function getVertexBuffer(device) {
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
function createBuffer(device, arr, usage) {
    // 📏 Align to 4 bytes (thanks @chrimsonite)
    let desc = {
        size: (arr.byteLength + 3) & ~3,
        usage,
        mappedAtCreation: true,
    };
    let buffer = device.createBuffer(desc);
    const writeArray = arr instanceof Uint16Array
        ? new Uint16Array(buffer.getMappedRange())
        : new Float32Array(buffer.getMappedRange());
    writeArray.set(arr);
    buffer.unmap();
    return buffer;
}
function getPipeline(layout, device, fragModule, vertModule) {
    // ⚗️ Graphics Pipeline
    // 🌑 Depth
    const depthStencil = {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
    };
    // 🎭 Shader Stages
    const vertex = {
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
    const colorState = {
        format: "bgra8unorm",
    };
    const fragment = {
        module: fragModule,
        entryPoint: "main",
        targets: [colorState],
    };
    // 🟨 Rasterization
    const primitive = {
        frontFace: "cw",
        cullMode: "none",
        topology: "triangle-list",
    };
    const pipelineDesc = {
        layout,
        vertex,
        fragment,
        primitive,
        depthStencil,
    };
    const pipeline = device.createRenderPipeline(pipelineDesc);
    return pipeline;
}


/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = "struct UBO {\r\n  modelViewProj: mat4x4<f32>,\r\n  primaryColor: vec4<f32>,\r\n  accentColor: vec4<f32>,\r\n  deltaTime: f32\r\n};\r\n\r\n@group(0) @binding(0)\r\nvar<uniform> uniforms: UBO;\r\n\r\nstruct VSOut {\r\n    @builtin(position) position: vec4<f32>,\r\n    @location(0) color: vec3<f32>,\r\n    @location(1) uv: vec2<f32>,\r\n};\r\n\r\n@vertex\r\nfn main(@location(0) in_pos: vec3<f32>, @location(1) in_color: vec3<f32>, @location(2) uv: vec2<f32>) -> VSOut {\r\n    var vs_out: VSOut;\r\n    let base_view = mat4x4f(\r\n      1.0, 0.0, 0.0, 0.0,\r\n      0.0, 1.0, 0.0, 0.0, \r\n      0.0, 0.0, 1.0, 0.0,\r\n      0.0, 0.0, 0.0, 1.0\r\n    );\r\n    vs_out.position = base_view*uniforms.modelViewProj * vec4<f32>(in_pos, 1.0);\r\n    // vs_out.color = in_color + vec3<f32>(0,0.0,0.0);\r\n    vs_out.color = vec3(uv, 0);\r\n    vs_out.uv = uv;\r\n    return vs_out;\r\n}";

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = "@group(0) @binding(1) var _sampler: sampler;\r\n@group(0) @binding(2) var _texture: texture_2d<f32>;\r\n\r\n@fragment\r\nfn main(@location(0) in_color: vec3<f32>, @location(1) uv: vec2<f32>) -> @location(0) vec4<f32> {\r\n    return textureSample(_texture, _sampler, vec2(uv.x, 1-uv.y));\r\n    // return vec4<f32>(in_color, 1.0);\r\n}";

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setupComputePipeline = void 0;
const mouse_1 = __webpack_require__(5);
const hsv_rgb_wgsl_1 = __importDefault(__webpack_require__(6));
function setupComputePipeline(device, texture, size, canvas) {
    const swappingDataBindgroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: "read-only-storage",
                },
            },
            {
                binding: 1,
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
            bindGroupLayouts: [swappingDataBindgroupLayout, sizeImageBindgroupLayout],
        }),
        compute: {
            module: device.createShaderModule({
                code: `
        @group(0) @binding(0)
        var<storage, read> in_data: array<vec4<f32>>;
        @group(0) @binding(1) 
        var<storage, read_write> out_data: array<vec4<f32>>;
        @group(1) @binding(0)
        var out_image: texture_storage_2d<rgba8unorm, write>;
        @group(1) @binding(1)
        var<uniform> size: vec2<u32>;
        @group(1) @binding(2)
        var<uniform> frame: u32;
        @group(1) @binding(3)
        var<uniform> mouse: vec4<u32>;

        const BOUNDS:f32 = -1;
        const AIR:f32 = 0;
        const SAND:f32 = 1;

        fn getIndex(pos: vec2<u32>) -> u32 {
            let h = size.y;
            let w = size.x;
          
            return (pos.y % h) * w + (pos.x % w);
        }

        fn getData(pos: vec2<u32>) -> vec4<f32> {
            if(pos.x >= size.x || pos.y >= size.y){
                return vec4(BOUNDS, 0,0,0);
            }
            return in_data[getIndex(pos)];
        }

        fn setData(pos: vec2<u32>, data: vec4<f32>){
            if(pos.x < size.x && pos.y < size.y){
                out_data[getIndex(pos)] = data;
            }
        }

        fn getNeighborhood(pos: vec2<u32>) -> Neighborhood {
            return Neighborhood(
                getData(pos),
                getData(pos + vec2(1,0)),
                getData(pos + vec2(0,1)),
                getData(pos + vec2(1,1))
                );
        }

        fn writeNeighborhood(pos: vec2<u32>, n: Neighborhood){
            setData(pos, n.c00);
            setData(pos+vec2(1,0), n.c10);
            setData(pos+vec2(0,1), n.c01);
            setData(pos+vec2(1,1), n.c11);
        }

        fn drawNeighborhood(pos: vec2<u32>, n: Neighborhood){
            textureStore(out_image, pos, vec4(n.c00.xyz,1));
            if(n.c10.a != BOUNDS){
                textureStore(out_image, pos+vec2(1,0), vec4(n.c10.xyz,1));
            } 
            if(n.c01.a != BOUNDS){
                textureStore(out_image, pos+vec2(0,1), vec4(n.c01.xyz,1));
            }
            if(n.c11.a != BOUNDS){
                textureStore(out_image, pos+vec2(1,1), vec4(n.c11.xyz,1));
            }
        }

        ${hsv_rgb_wgsl_1.default}

        // fn swap(a: vec3<f32>, b:vec3<f32>){
        //     let temp = a;
        //     a.rgb = b.rgb;
        //     b = t.rgb;
        // }

        // var<workgroup> sharedBlock : array<u32, 4>;
        
        struct Neighborhood {
            c00: vec4<f32>,
            c10: vec4<f32>,
            c01: vec4<f32>,
            c11: vec4<f32>,
        }

        fn getOffset() -> vec2<u32>{
            if(frame % 4 == 0){
                return vec2(0,0);
            } else if(frame % 4==1){
                return vec2(1,1);
            } else if(frame% 4==2){
                return vec2(0,1);
            }
            return vec2(1,0);
        }

        fn hash43(p: vec3<u32>) -> vec4<f32>
        {
          var p4 = fract(vec4<f32>(p.xyzx)  * vec4(.1031, .1030, .0973, .1099));
          p4 += dot(p4, p4.wzxy+33.33);
          return fract((p4.xxyz+p4.yzzw)*p4.zywx);
        }

        @compute @workgroup_size(1) fn main(
        @builtin(global_invocation_id) id : vec3u,
        @builtin(local_invocation_id) local_id : vec3u
        )  {
            let pos = id.xy*2 + getOffset();
            
            let pos_index = getIndex(pos);

            let r = hash43(vec3(pos, frame));
            var neigh = getNeighborhood(pos);
            var c00 = neigh.c00;
            var c01 = neigh.c01;
            var c10 = neigh.c10;
            var c11 = neigh.c11;

            if(c00.a != BOUNDS && mouse.z != 0 && distance(vec2<f32>(pos), vec2<f32>(mouse.xy)) < f32(mouse.w)){
              if(mouse.z == 1){
                let new_color = hsvToRgb(vec3(f32(frame)/1000, 0.7, 1));
                neigh.c00 = vec4(new_color, SAND);
              } else {
                neigh.c00 = vec4(0, 0, 0, AIR);
              }
            }

            
            if(neigh.c00.a == SAND && neigh.c01.a == SAND && neigh.c10.a == AIR && neigh.c11.a == AIR){
              let temp = neigh.c00;
              neigh.c00 = neigh.c10;
              neigh.c10 = temp;
            }

            if(neigh.c10.a == SAND && neigh.c11.a == SAND && neigh.c00.a == AIR && neigh.c01.a == AIR){
              let temp = neigh.c01;
              neigh.c01 = neigh.c10;
              neigh.c10 = temp;
            }
            
            if(neigh.c00.a == SAND && neigh.c01.a == AIR){
              let temp = neigh.c00;
              neigh.c00 = neigh.c01;
              neigh.c01 = temp;
            }

            if(neigh.c10.a == SAND && neigh.c11.a == AIR){
              let temp = neigh.c10;
              neigh.c10 = neigh.c11;
              neigh.c11 = temp;
          }

            drawNeighborhood(pos, neigh);
            writeNeighborhood(pos, neigh);

            // if(out_data[pos_index].a > 0){
            //   textureStore(out_image, pos, vec4(out_data[pos_index].a,0,0, 0.0));
            // } else {
            //   textureStore(out_image, pos, vec4(0,0,1, 0.0));
            // }
        }
        `,
            }),
            entryPoint: "main",
        },
    });
    const sizeBuffer = device.createBuffer({
        mappedAtCreation: true,
        size: 2 * Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.COPY_DST |
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
        usage: GPUBufferUsage.COPY_DST |
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.STORAGE,
    });
    device.queue.writeBuffer(data0Buffer, 0, initialData);
    const data1Buffer = device.createBuffer({
        size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 4,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
    });
    device.queue.writeBuffer(data1Buffer, 0, initialData);
    const domainOffsetBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const mouseBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT * 4, //(16),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const swap0Bindgroup = device.createBindGroup({
        layout: swappingDataBindgroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: data0Buffer },
            },
            {
                binding: 1,
                resource: { buffer: data1Buffer },
            },
        ],
    });
    const swap1Bindgroup = device.createBindGroup({
        layout: swappingDataBindgroupLayout,
        entries: [
            {
                binding: 0,
                resource: { buffer: data1Buffer },
            },
            {
                binding: 1,
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
    const ratio = { x: canvas.width / size.width, y: canvas.height / size.height };
    const drawingRadius = 5;
    let renders = 0;
    const encodeCompute = (encoder) => {
        const rect = canvas.getBoundingClientRect();
        const mouse = (0, mouse_1.getMouse)();
        const relativeMouse = { x: clamp((mouse.x - rect.x) / ratio.x, 0, size.width - 1), y: clamp((mouse.y - rect.y) / ratio.y, 0, size.height - 1) };
        relativeMouse.x = Math.floor(relativeMouse.x);
        relativeMouse.y = Math.floor(relativeMouse.y);
        device.queue.writeBuffer(domainOffsetBuffer, 0, new Uint32Array([renders]));
        device.queue.writeBuffer(mouseBuffer, 0, new Uint32Array([relativeMouse.x, relativeMouse.y, mouse.leftClick ? 1 : mouse.rightClick ? -1 : 0, drawingRadius]));
        const pass = encoder.beginComputePass();
        pass.setPipeline(computePipeline);
        pass.setBindGroup(0, renders % 2 ? swap0Bindgroup : swap1Bindgroup);
        pass.setBindGroup(1, sizeImageBindGroup);
        pass.dispatchWorkgroups(size.width, size.height);
        pass.end();
        renders++;
    };
    return encodeCompute;
}
exports.setupComputePipeline = setupComputePipeline;
function logStorageBuffer(device, storageBuffer) {
    device.queue.onSubmittedWorkDone().then(() => {
        const copyEncoder = device.createCommandEncoder();
        const readBuffer = device.createBuffer({
            label: "read data buffer",
            size: storageBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        copyEncoder.copyBufferToBuffer(storageBuffer, 0, readBuffer, 0, storageBuffer.size);
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
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);


/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getMouse = void 0;
const LOGGING_MOUSE = false;
const mouse = {
    x: 0,
    y: 0,
    rightClick: false,
    leftClick: false,
};
window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    logMouse();
});
window.addEventListener("mousedown", (e) => {
    if (e.button == 2) {
        mouse.rightClick = true;
    }
    else {
        mouse.leftClick = true;
    }
    logMouse("mouse down");
});
window.addEventListener("contextmenu", (e) => {
    // mouse.rightClick = true;
    e.preventDefault();
    logMouse("context");
});
window.addEventListener("mouseup", (e) => {
    mouse.leftClick = false;
    mouse.rightClick = false;
    logMouse("mouse up");
});
function logMouse(e = "") {
    if (!LOGGING_MOUSE) {
        return;
    }
    console.log(e, mouse);
}
function getMouse() {
    return mouse;
}
exports.getMouse = getMouse;


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = "fn rgbToHsv(c: vec3<f32>) -> vec3<f32> {\r\n    var K = vec4<f32>(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\r\n    var p = mix(vec4<f32>(c.bg, K.wz), vec4<f32>(c.gb, K.xy), step(c.b, c.g));\r\n    var q = mix(vec4<f32>(p.xyw, c.r), vec4<f32>(c.r, p.yzx), step(p.x, c.r));\r\n\r\n    var d = q.x - min(q.w, q.y);\r\n    var e = 1.0e-10;\r\n    return vec3<f32>(abs(vec3((q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x)));\r\n}\r\n\r\nfn hsvToRgb(c: vec3<f32>) -> vec3<f32> {\r\n    var K = vec4<f32>(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\r\n    var p = abs(fract(vec3<f32>(c.x) + K.xyz) * 6.0 - vec3<f32>(K.w));\r\n    return c.z * mix(vec3<f32>(K.x), clamp(p - vec3<f32>(K.x), vec3(0.0), vec3(1.0)), c.y);\r\n}";

/***/ }),
/* 7 */
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createTexture = exports.loadTexture = void 0;
function loadTexture(device) {
    return __awaiter(this, void 0, void 0, function* () {
        let imageTexture;
        {
            const response = yield fetch("/photo.png");
            const imageBitmap = yield createImageBitmap(yield response.blob());
            imageTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height, 1],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING |
                    GPUTextureUsage.COPY_DST |
                    GPUTextureUsage.RENDER_ATTACHMENT |
                    GPUTextureUsage.STORAGE_BINDING,
            });
            device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture: imageTexture }, [imageBitmap.width, imageBitmap.height]);
            // device.queue.writeTexture(imageTexture, imageBitmap, {}, {height:imageBitmap.height, width: imageBitmap.width})
        }
        return imageTexture;
    });
}
exports.loadTexture = loadTexture;
function createTexture(device, size) {
    let imageTexture;
    {
        const width = size.width;
        const height = size.height;
        const b = [0, 0, 0, 255];
        const w = [255, 255, 255, 255];
        const imageBitmap = new Uint8Array(width * height * 4);
        // const radius = 10;
        // const center = {x: Math.floor(width/2), y:Math.floor(height/2)}
        // for(let i = center.x-radius/2;i<center.x+radius/2; i++){
        //     for(let j = center.y-radius/2; j<center.y+radius/2; j++){
        //         const index = (i*width + j)*4;
        //         imageBitmap[index] = 255;
        //         imageBitmap[index+1] = 255;
        //         imageBitmap[index+2] = 255;
        //         imageBitmap[index+3] = 255;
        //     }
        // } 
        imageTexture = device.createTexture({
            size: [width, height, 1],
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT |
                GPUTextureUsage.STORAGE_BINDING,
        });
        device.queue.writeTexture({
            texture: imageTexture,
        }, imageBitmap, { bytesPerRow: width * 4 }, { width, height });
    }
    return imageTexture;
}
exports.createTexture = createTexture;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDBDQUE0QztBQUU1QyxTQUFlLElBQUk7O1FBQ2pCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEQsTUFBTSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEdBQUMsQ0FBQyxDQUFDO1FBQ3JCLE1BQU0sVUFBVSxHQUFHLE1BQU0sNkJBQWMsRUFBQyxNQUFNLENBQUMsQ0FBQztRQUNoRCxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTlDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsQ0FBQyxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFNUIsT0FBTyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0NBQUE7QUFFRCxVQUFVLENBQUMsR0FBUyxFQUFFO0lBQ3BCLE1BQU0sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxJQUFJLEVBQUUsQ0FBQztJQUU3QyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVuQyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsWUFBWSxDQUFDO0lBQy9CLEdBQUcsQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDO0lBQ3pCLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRS9CLFVBQVUsRUFBRSxDQUFDO0FBQ2YsQ0FBQyxHQUFFLENBQUMsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDMUJOLHFFQUEyRDtBQUMzRCxxRUFBMkQ7QUFDM0QsaURBQXlEO0FBQ3pELCtDQUFnRDtBQUVoRCxNQUFNLGdCQUFnQixHQUFZO0FBQ2hDLG9EQUFvRDtDQUNyRCxDQUFDO0FBRUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFFOUMsTUFBTSxZQUFZLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLEdBQUcsU0FBUyxDQUFDO0FBRW5FLE1BQU0sUUFBUSxHQUFHLEVBQUMsS0FBSyxFQUFFLEVBQUUsR0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBRTNDLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUV0QixNQUFNLFdBQVcsR0FBRyxJQUFJLFlBQVksQ0FBQztJQUNuQywyQ0FBMkM7SUFDM0MsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUVILG1CQUFtQjtJQUNuQixHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFDSCxHQUFHO0lBRUgsa0JBQWtCO0lBQ2xCLEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztJQUNILEdBQUc7SUFFSCxNQUFNO0lBQ04sWUFBWSxFQUFFO0lBRWQsU0FBUztJQUNULEdBQUc7SUFDSCxHQUFHO0lBQ0gsR0FBRztDQUNKLENBQUMsQ0FBQztBQUVILFNBQXNCLGNBQWMsQ0FBQyxNQUF5Qjs7UUFDNUQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQztRQUM1QixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELDZCQUE2QjtRQUM3QixNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUV4QyxvQkFBb0I7UUFDcEIsTUFBTSxNQUFNLEdBQUcsTUFBTSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUUzQixNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFakQsMEJBQTBCO1FBQzFCLE1BQU0sZ0JBQWdCLEdBQXlCO1lBQzdDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDdEMsU0FBUyxFQUFFLElBQUk7WUFDZixNQUFNLEVBQUUsc0JBQXNCO1lBQzlCLEtBQUssRUFBRSxlQUFlLENBQUMsaUJBQWlCLEdBQUcsZUFBZSxDQUFDLFFBQVE7U0FDcEUsQ0FBQztRQUVGLE1BQU0sWUFBWSxHQUFlLE1BQU0sQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxNQUFNLGdCQUFnQixHQUFtQixZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFbkUseUNBQXlDO1FBQ3pDLElBQUksWUFBWSxHQUFlLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzNELElBQUksZ0JBQWdCLEdBQW1CLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVqRSxrQ0FBa0M7UUFDbEMsTUFBTSxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsNEJBQWMsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sVUFBVSxHQUFvQixNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkUsTUFBTSxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsNEJBQWMsRUFBRSxDQUFDO1FBQ3pDLE1BQU0sVUFBVSxHQUFvQixNQUFNLENBQUMsa0JBQWtCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkUsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTdDLE1BQU0sWUFBWSxHQUFHLGlDQUFhLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRXJELE1BQU0sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxNQUFNLHFCQUFxQixDQUM5RCxNQUFNLEVBQ04sYUFBYSxFQUNiLFlBQVksQ0FDYixDQUFDO1FBRUYsTUFBTSxhQUFhLEdBQUcsMENBQW9CLEVBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFbkYsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRXJFLE1BQU0sVUFBVSxHQUFHLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUzQyw0QkFBNEI7UUFDNUIsSUFBSSxjQUFpQyxDQUFDO1FBQ3RDLElBQUksV0FBaUMsQ0FBQztRQUV0Qyx1Q0FBdUM7UUFDdkMsTUFBTSxjQUFjLEdBQUcsR0FBRyxFQUFFO1lBQzFCLElBQUksZUFBZSxHQUFpQztnQkFDbEQsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsVUFBVSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFDdEMsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FBQztZQUVGLE1BQU0sZUFBZSxHQUF3QztnQkFDM0QsSUFBSSxFQUFFLGdCQUFnQjtnQkFDdEIsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLFdBQVcsRUFBRSxPQUFPO2dCQUNwQixZQUFZLEVBQUUsT0FBTztnQkFDckIsaUJBQWlCLEVBQUUsQ0FBQztnQkFDcEIsYUFBYSxFQUFFLE9BQU87Z0JBQ3RCLGNBQWMsRUFBRSxPQUFPO2FBQ3hCLENBQUM7WUFFRixNQUFNLGNBQWMsR0FBNEI7Z0JBQzlDLGdCQUFnQixFQUFFLENBQUMsZUFBZSxDQUFDO2dCQUNuQyxzQkFBc0IsRUFBRSxlQUFlO2FBQ3hDLENBQUM7WUFFRixjQUFjLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFFL0MsOEJBQThCO1lBQzlCLFdBQVcsR0FBRyxjQUFjLENBQUMsZUFBZSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdELFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLGdCQUFnQixDQUFDLENBQUM7WUFDOUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNsQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNqRSxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDOUQsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDM0MsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFbEIsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBRTlCLFdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLEVBQUUsQ0FBQztZQUNqQyxLQUFLLENBQUMsV0FBVyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQ3RFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFHLEdBQUcsRUFBRTtZQUNsQixZQUFZLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDM0MsZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBRTdDLGNBQWMsRUFBRSxDQUFDO1lBRWpCLElBQUcsV0FBVyxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUNsQixVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNkLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNoQyxDQUFDLEVBQUMsV0FBVyxDQUFDO1lBQ2hCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixxQkFBcUIsQ0FBQyxNQUFNLENBQUM7WUFDL0IsQ0FBQztRQUNILENBQUMsQ0FBQztRQUVGLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FBQTtBQXJIRCx3Q0FxSEM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxNQUFpQjtJQUN2QywyQkFBMkI7SUFDM0IsTUFBTSxhQUFhLEdBQWMsWUFBWSxDQUMzQyxNQUFNLEVBQ04sV0FBVyxFQUNYLGNBQWMsQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FDakQsQ0FBQztJQUNGLE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxTQUFlLHFCQUFxQixDQUNsQyxNQUFpQixFQUNqQixhQUF3QixFQUN4QixXQUF1Qjs7UUFFdkIsdUJBQXVCO1FBQ3ZCLE1BQU0sc0JBQXNCLEdBQzFCLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQztZQUMzQixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsT0FBTyxFQUFFLENBQUM7b0JBQ1YsVUFBVSxFQUFFLGNBQWMsQ0FBQyxNQUFNO29CQUNqQyxNQUFNLEVBQUUsRUFBRTtpQkFDWDtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsQ0FBQztvQkFDVixVQUFVLEVBQUUsY0FBYyxDQUFDLFFBQVE7b0JBQ25DLE9BQU8sRUFBRSxFQUFFO2lCQUNaO2dCQUNEO29CQUNFLE9BQU8sRUFBRSxDQUFDO29CQUNWLFVBQVUsRUFBRSxjQUFjLENBQUMsUUFBUTtvQkFDbkMsT0FBTyxFQUFFLEVBQUU7aUJBQ1o7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVMLG1FQUFtRTtRQUNuRSxNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDO1lBQ25DLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFNBQVMsRUFBRSxTQUFTO1NBQ3JCLENBQUMsQ0FBQztRQUVILGlCQUFpQjtRQUNqQixnREFBZ0Q7UUFDaEQsTUFBTSxnQkFBZ0IsR0FBaUIsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUM1RCxNQUFNLEVBQUUsc0JBQXNCO1lBQzlCLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxPQUFPLEVBQUUsQ0FBQztvQkFDVixRQUFRLEVBQUU7d0JBQ1IsTUFBTSxFQUFFLGFBQWE7cUJBQ3RCO2lCQUNGO2dCQUNEO29CQUNFLE9BQU8sRUFBRSxDQUFDO29CQUNWLFFBQVEsRUFBRSxPQUFPO2lCQUNsQjtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsQ0FBQztvQkFDVixRQUFRLEVBQUUsV0FBVyxDQUFDLFVBQVUsRUFBRTtpQkFDbkM7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHNCQUFzQjtRQUN0Qiw2RkFBNkY7UUFDN0YsTUFBTSxrQkFBa0IsR0FBRyxFQUFFLGdCQUFnQixFQUFFLENBQUMsc0JBQXNCLENBQUMsRUFBRSxDQUFDO1FBQzFFLE1BQU0sTUFBTSxHQUNWLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRWxELE9BQU8sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0NBQUE7QUFFRCxTQUFlLFVBQVUsQ0FBQyxLQUFVOztRQUNsQyw2QkFBNkI7UUFDN0IsTUFBTSxPQUFPLEdBQXNCLE1BQU0sS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRWhFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUMzQyxDQUFDO1FBRUQsSUFBRyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQztZQUN4RCxPQUFPLENBQUMsS0FBSyxDQUFDLGdCQUFnQixFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoRSxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDakQsQ0FBQztRQUVELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7Q0FBQTtBQUVELFNBQWUsU0FBUyxDQUFDLE9BQW1COztRQUMxQyxvQkFBb0I7UUFDcEIsTUFBTSxNQUFNLEdBQXFCLE1BQU0sT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBRS9ELElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUFBO0FBRUQsU0FBZSxVQUFVLENBQUMsTUFBeUIsRUFBRSxNQUFpQjs7UUFDcEUsMkJBQTJCO1FBQzNCLElBQUksT0FBTyxHQUE0QixJQUFJLENBQUM7UUFFNUMsbUJBQW1CO1FBQ25CLE9BQU8sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXRDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBRUQsdUJBQXVCO1FBQ3ZCLE1BQU0sWUFBWSxHQUEyQjtZQUMzQyxNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxTQUFTLENBQUMsR0FBRyxDQUFDLHdCQUF3QixFQUFFO1lBQ2hELEtBQUssRUFBRSxlQUFlLENBQUMsaUJBQWlCLEdBQUcsZUFBZSxDQUFDLFFBQVE7WUFDbkUsU0FBUyxFQUFFLFFBQVE7U0FDcEIsQ0FBQztRQUVGLE9BQU8sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFaEMsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztDQUFBO0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBaUI7SUFDeEMsaUNBQWlDO0lBQ2pDLE1BQU0sS0FBSyxHQUFHLElBQUksWUFBWSxDQUFDO1FBQzdCLE1BQU07UUFDTixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHO1FBQ2YsUUFBUTtRQUNSLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztRQUNiLEtBQUs7UUFDTCxHQUFHLEVBQUUsR0FBRztRQUNSLE1BQU07UUFDTixHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRztRQUNkLE9BQU87UUFDUCxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7UUFDYixJQUFJO1FBQ0osR0FBRyxFQUFFLEdBQUc7UUFDUixNQUFNO1FBQ04sR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO1FBQ2IsT0FBTztRQUNQLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztRQUNiLElBQUk7UUFDSixHQUFHLEVBQUUsR0FBRztRQUNSLE1BQU07UUFDTixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7UUFDYixPQUFPO1FBQ1AsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO1FBQ2IsSUFBSTtRQUNKLEdBQUcsRUFBRSxHQUFHO1FBQ1IsTUFBTTtRQUNOLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHO1FBQ2QsT0FBTztRQUNQLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztRQUNiLElBQUk7UUFDSixHQUFHLEVBQUUsR0FBRztRQUNSLE1BQU07UUFDTixDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHO1FBQ2YsT0FBTztRQUNQLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRztRQUNiLElBQUk7UUFDSixHQUFHLEVBQUUsR0FBRztLQUNULENBQUMsQ0FBQztJQUVILE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUV0RSxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBRUQsbUVBQW1FO0FBQ25FLFNBQVMsWUFBWSxDQUNuQixNQUFpQixFQUNqQixHQUErQixFQUMvQixLQUFhO0lBRWIsNENBQTRDO0lBQzVDLElBQUksSUFBSSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsS0FBSztRQUNMLGdCQUFnQixFQUFFLElBQUk7S0FDdkIsQ0FBQztJQUNGLElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFdkMsTUFBTSxVQUFVLEdBQ2QsR0FBRyxZQUFZLFdBQVc7UUFDeEIsQ0FBQyxDQUFDLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxQyxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUM7SUFDaEQsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNwQixNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDZixPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQsU0FBUyxXQUFXLENBQ2xCLE1BQXlCLEVBQ3pCLE1BQWlCLEVBQ2pCLFVBQTJCLEVBQzNCLFVBQTJCO0lBRTNCLHVCQUF1QjtJQUV2QixXQUFXO0lBQ1gsTUFBTSxZQUFZLEdBQXlCO1FBQ3pDLGlCQUFpQixFQUFFLElBQUk7UUFDdkIsWUFBWSxFQUFFLE1BQU07UUFDcEIsTUFBTSxFQUFFLHNCQUFzQjtLQUMvQixDQUFDO0lBRUYsbUJBQW1CO0lBQ25CLE1BQU0sTUFBTSxHQUFtQjtRQUM3QixNQUFNLEVBQUUsVUFBVTtRQUNsQixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUU7WUFDUDtnQkFDRSxVQUFVLEVBQUU7b0JBQ1Y7d0JBQ0UsY0FBYyxFQUFFLENBQUMsRUFBRSxlQUFlO3dCQUNsQyxNQUFNLEVBQUUsQ0FBQzt3QkFDVCxNQUFNLEVBQUUsV0FBVztxQkFDcEI7b0JBQ0Q7d0JBQ0UsY0FBYyxFQUFFLENBQUMsRUFBRSxlQUFlO3dCQUNsQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUM7d0JBQ2IsTUFBTSxFQUFFLFdBQVc7cUJBQ3BCO29CQUNEO3dCQUNFLGNBQWMsRUFBRSxDQUFDLEVBQUUsZUFBZTt3QkFDbEMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO3dCQUNiLE1BQU0sRUFBRSxXQUFXO3FCQUNwQjtpQkFDRjtnQkFDRCxXQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxvQkFBb0I7Z0JBQ3hDLFFBQVEsRUFBRSxRQUFRO2FBQ25CO1NBQ0Y7S0FDRixDQUFDO0lBRUYsdUJBQXVCO0lBQ3ZCLE1BQU0sVUFBVSxHQUF3QjtRQUN0QyxNQUFNLEVBQUUsWUFBWTtLQUNyQixDQUFDO0lBRUYsTUFBTSxRQUFRLEdBQXFCO1FBQ2pDLE1BQU0sRUFBRSxVQUFVO1FBQ2xCLFVBQVUsRUFBRSxNQUFNO1FBQ2xCLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQztLQUN0QixDQUFDO0lBRUYsbUJBQW1CO0lBQ25CLE1BQU0sU0FBUyxHQUFzQjtRQUNuQyxTQUFTLEVBQUUsSUFBSTtRQUNmLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLFFBQVEsRUFBRSxlQUFlO0tBQzFCLENBQUM7SUFFRixNQUFNLFlBQVksR0FBZ0M7UUFDaEQsTUFBTTtRQUNOLE1BQU07UUFDTixRQUFRO1FBQ1IsU0FBUztRQUNULFlBQVk7S0FDYixDQUFDO0lBRUYsTUFBTSxRQUFRLEdBQXNCLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUM5RSxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDemJELHVDQUFtQztBQUNuQywrREFBcUQ7QUFFckQsU0FBZ0Isb0JBQW9CLENBQ2xDLE1BQWlCLEVBQ2pCLE9BQW1CLEVBQ25CLElBQXVDLEVBQ3ZDLE1BQXlCO0lBRXpCLE1BQU0sMkJBQTJCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDO1FBQy9ELE9BQU8sRUFBRTtZQUNQO2dCQUNFLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFVBQVUsRUFBRSxjQUFjLENBQUMsT0FBTztnQkFDbEMsTUFBTSxFQUFFO29CQUNOLElBQUksRUFBRSxtQkFBbUI7aUJBQzFCO2FBQ0Y7WUFDRDtnQkFDRSxPQUFPLEVBQUUsQ0FBQztnQkFDVixVQUFVLEVBQUUsY0FBYyxDQUFDLE9BQU87Z0JBQ2xDLE1BQU0sRUFBRTtvQkFDTixJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRjtTQUNGO0tBQ0YsQ0FBQyxDQUFDO0lBQ0gsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUM7UUFDNUQsT0FBTyxFQUFFO1lBQ1A7Z0JBQ0UsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxFQUFFLGNBQWMsQ0FBQyxPQUFPO2dCQUNsQyxjQUFjLEVBQUUsT0FBTzthQUN4QjtZQUNEO2dCQUNFLE9BQU8sRUFBRSxDQUFDO2dCQUNWLFVBQVUsRUFBRSxjQUFjLENBQUMsT0FBTztnQkFDbEMsTUFBTSxFQUFFO29CQUNOLElBQUksRUFBRSxTQUFTO2lCQUNoQjthQUNGO1lBQ0Q7Z0JBQ0UsT0FBTyxFQUFFLENBQUM7Z0JBQ1YsVUFBVSxFQUFFLGNBQWMsQ0FBQyxPQUFPO2dCQUNsQyxNQUFNLEVBQUU7b0JBQ04sSUFBSSxFQUFFLFNBQVM7aUJBQ2hCO2FBQ0Y7WUFDRDtnQkFDRSxPQUFPLEVBQUUsQ0FBQztnQkFDVixVQUFVLEVBQUUsY0FBYyxDQUFDLE9BQU87Z0JBQ2xDLE1BQU0sRUFBRTtvQkFDTixJQUFJLEVBQUUsU0FBUztpQkFDaEI7YUFDRjtTQUNGO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDO1FBQ25ELE1BQU0sRUFBRSxNQUFNLENBQUMsb0JBQW9CLENBQUM7WUFDbEMsZ0JBQWdCLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSx3QkFBd0IsQ0FBQztTQUMxRSxDQUFDO1FBQ0YsT0FBTyxFQUFFO1lBQ1AsTUFBTSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQztnQkFDaEMsSUFBSSxFQUFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBbUVKLHNCQUFjOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0E2RmY7YUFDRixDQUFDO1lBQ0YsVUFBVSxFQUFFLE1BQU07U0FDbkI7S0FDRixDQUFDLENBQUM7SUFFSCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1FBQ3JDLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsSUFBSSxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsaUJBQWlCO1FBQ3ZDLEtBQUssRUFDSCxjQUFjLENBQUMsUUFBUTtZQUN2QixjQUFjLENBQUMsUUFBUTtZQUN2QixjQUFjLENBQUMsT0FBTztLQUN6QixDQUFDLENBQUM7SUFFSCxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzVFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUVuQixNQUFNLFdBQVcsR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEIsV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsV0FBVyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1QixDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDbkIsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN4QixXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQixXQUFXLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFH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VyxFQUFFLEtBQUssR0FBRyxDQUFDLEVBQUUsRUFDMUIsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLENBQ2xCLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQXhDRCxzQ0F3Q0M7Ozs7OztVQ2pFRDtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7O1VFdEJBO1VBQ0E7VUFDQTtVQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vd3NhbmQvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vd3NhbmQvLi9zcmMvcmVuZGVyZXIvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vd3NhbmQvLi9zcmMvcmVuZGVyZXIvY29tcHV0ZVBpcGVsaW5lLnRzIiwid2VicGFjazovL3dzYW5kLy4vc3JjL3JlbmRlcmVyL21vdXNlLnRzIiwid2VicGFjazovL3dzYW5kLy4vc3JjL3JlbmRlcmVyL2NyZWF0ZVRleHR1cmUudHMiLCJ3ZWJwYWNrOi8vd3NhbmQvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vd3NhbmQvd2VicGFjay9iZWZvcmUtc3RhcnR1cCIsIndlYnBhY2s6Ly93c2FuZC93ZWJwYWNrL3N0YXJ0dXAiLCJ3ZWJwYWNrOi8vd3NhbmQvd2VicGFjay9hZnRlci1zdGFydHVwIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVJlbmRlcmVyIH0gZnJvbSBcIi4vcmVuZGVyZXJcIjtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGNvbXAoKSB7XHJcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICBjYW52YXMuaGVpZ2h0ID0gNTEyO1xyXG4gIGNhbnZhcy53aWR0aCA9IDUxMioyO1xyXG4gIGNvbnN0IHJlbmRlckZ1bmMgPSBhd2FpdCBjcmVhdGVSZW5kZXJlcihjYW52YXMpO1xyXG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG5cclxuICBlbGVtZW50LmlubmVySFRNTCA9IFtcIkhlbGxvXCIsIFwidHlwZXNjcmlwdFwiXS5qb2luKFwiIFwiKTtcclxuICBlbGVtZW50LmFwcGVuZENoaWxkKGNhbnZhcyk7XHJcblxyXG4gIHJldHVybiB7IHJlbmRlckZ1bmMsIGVsZW1lbnQgfTtcclxufVxyXG5cclxuc2V0VGltZW91dChhc3luYyAoKSA9PiB7XHJcbiAgY29uc3QgeyBlbGVtZW50LCByZW5kZXJGdW5jIH0gPSBhd2FpdCBjb21wKCk7XHJcblxyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XHJcblxyXG4gIGNvbnN0IGJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XHJcbiAgYnRuLnRleHRDb250ZW50ID0gXCJuZXh0IGZyYW1lXCI7XHJcbiAgYnRuLm9uY2xpY2sgPSByZW5kZXJGdW5jO1xyXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnRuKTtcclxuXHJcbiAgcmVuZGVyRnVuYygpO1xyXG59LCAwKTtcclxuIiwiaW1wb3J0IHZlcnRTaGFkZXJDb2RlIGZyb20gXCIuLi9zaGFkZXJzL3RyaWFuZ2xlLnZlcnQud2dzbFwiO1xyXG5pbXBvcnQgZnJhZ1NoYWRlckNvZGUgZnJvbSBcIi4uL3NoYWRlcnMvdHJpYW5nbGUuZnJhZy53Z3NsXCI7XHJcbmltcG9ydCB7IHNldHVwQ29tcHV0ZVBpcGVsaW5lIH0gZnJvbSBcIi4vY29tcHV0ZVBpcGVsaW5lXCI7XHJcbmltcG9ydCB7IGNyZWF0ZVRleHR1cmUgfSBmcm9tIFwiLi9jcmVhdGVUZXh0dXJlXCI7XHJcblxyXG5jb25zdCBleHBsaWNpdEZlYXR1cmVzOnN0cmluZ1tdID0gW1xyXG4gIC8vXCJjaHJvbWl1bS1leHBlcmltZW50YWwtcmVhZC13cml0ZS1zdG9yYWdlLXRleHR1cmVcIlxyXG5dO1xyXG5cclxuY29uc3Qgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwO1xyXG5cclxuY29uc3QgZ2V0RGVsdGFUaW1lID0gKCkgPT4gbmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwIC0gc3RhcnRUaW1lO1xyXG5cclxuY29uc3QgZ2FtZVNpemUgPSB7d2lkdGg6IDY0KjIsIGhlaWdodDogNjR9O1xyXG5cclxuY29uc3QgRlJBTUVfREVMQVkgPSAwO1xyXG5cclxuY29uc3QgdW5pZm9ybURhdGEgPSBuZXcgRmxvYXQzMkFycmF5KFtcclxuICAvLyDimZ/vuI8gTW9kZWxWaWV3UHJvamVjdGlvbiBNYXRyaXggKElkZW50aXR5KVxyXG4gIDEuMCxcclxuICAwLjAsXHJcbiAgMC4wLFxyXG4gIDAuMCxcclxuICAwLjAsXHJcbiAgMS4wLFxyXG4gIDAuMCxcclxuICAwLjAsXHJcbiAgMC4wLFxyXG4gIDAuMCxcclxuICAxLjAsXHJcbiAgMC4wLFxyXG4gIDAuMCxcclxuICAwLjAsXHJcbiAgMC4wLFxyXG4gIDEuMCxcclxuXHJcbiAgLy8g8J+UtCBQcmltYXJ5IENvbG9yXHJcbiAgMC45LFxyXG4gIDAuMSxcclxuICAwLjMsXHJcbiAgMS4wLFxyXG5cclxuICAvLyDwn5+jIEFjY2VudCBDb2xvclxyXG4gIDAuOCxcclxuICAwLjIsXHJcbiAgMC44LFxyXG4gIDEuMCxcclxuXHJcbiAgLy90aW1lXHJcbiAgZ2V0RGVsdGFUaW1lKCksXHJcblxyXG4gIC8vcGFkZGluZ1xyXG4gIDAuMCxcclxuICAwLjAsXHJcbiAgMC4wLFxyXG5dKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVSZW5kZXJlcihjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50KSB7XHJcbiAgY29uc3QgZW50cnkgPSBuYXZpZ2F0b3IuZ3B1O1xyXG4gIGlmICghZW50cnkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIldlYkdQVSBpcyBub3Qgc3VwcG9ydGVkIG9uIHRoaXMgYnJvd3Nlci5cIik7XHJcbiAgfVxyXG5cclxuICAvLyDwn5SMIFBoeXNpY2FsIERldmljZSBBZGFwdGVyXHJcbiAgY29uc3QgYWRhcHRlciA9IGF3YWl0IGdldEFkYXB0ZXIoZW50cnkpO1xyXG5cclxuICAvLyDwn5K7IExvZ2ljYWwgRGV2aWNlXHJcbiAgY29uc3QgZGV2aWNlID0gYXdhaXQgZ2V0RGV2aWNlKGFkYXB0ZXIpO1xyXG5cclxuICBjb25zdCBxdWV1ZSA9IGRldmljZS5xdWV1ZTtcclxuXHJcbiAgY29uc3QgY29udGV4dCA9IGF3YWl0IGdldENvbnRleHQoY2FudmFzLCBkZXZpY2UpO1xyXG5cclxuICAvLyDwn6SUIENyZWF0ZSBEZXB0aCBCYWNraW5nXHJcbiAgY29uc3QgZGVwdGhUZXh0dXJlRGVzYzogR1BVVGV4dHVyZURlc2NyaXB0b3IgPSB7XHJcbiAgICBzaXplOiBbY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0LCAxXSxcclxuICAgIGRpbWVuc2lvbjogXCIyZFwiLFxyXG4gICAgZm9ybWF0OiBcImRlcHRoMjRwbHVzLXN0ZW5jaWw4XCIsXHJcbiAgICB1c2FnZTogR1BVVGV4dHVyZVVzYWdlLlJFTkRFUl9BVFRBQ0hNRU5UIHwgR1BVVGV4dHVyZVVzYWdlLkNPUFlfU1JDLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGRlcHRoVGV4dHVyZTogR1BVVGV4dHVyZSA9IGRldmljZS5jcmVhdGVUZXh0dXJlKGRlcHRoVGV4dHVyZURlc2MpO1xyXG4gIGNvbnN0IGRlcHRoVGV4dHVyZVZpZXc6IEdQVVRleHR1cmVWaWV3ID0gZGVwdGhUZXh0dXJlLmNyZWF0ZVZpZXcoKTtcclxuXHJcbiAgLy8g4pyLIERlY2xhcmUgY2FudmFzIGNvbnRleHQgaW1hZ2UgaGFuZGxlc1xyXG4gIGxldCBjb2xvclRleHR1cmU6IEdQVVRleHR1cmUgPSBjb250ZXh0LmdldEN1cnJlbnRUZXh0dXJlKCk7XHJcbiAgbGV0IGNvbG9yVGV4dHVyZVZpZXc6IEdQVVRleHR1cmVWaWV3ID0gY29sb3JUZXh0dXJlLmNyZWF0ZVZpZXcoKTtcclxuXHJcbiAgLy8g4pyLIERlY2xhcmUgc2hhZGVyIG1vZHVsZSBoYW5kbGVzXHJcbiAgY29uc3QgdnNtRGVzYyA9IHsgY29kZTogdmVydFNoYWRlckNvZGUgfTtcclxuICBjb25zdCB2ZXJ0TW9kdWxlOiBHUFVTaGFkZXJNb2R1bGUgPSBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHZzbURlc2MpO1xyXG5cclxuICBjb25zdCBmc21EZXNjID0geyBjb2RlOiBmcmFnU2hhZGVyQ29kZSB9O1xyXG4gIGNvbnN0IGZyYWdNb2R1bGU6IEdQVVNoYWRlck1vZHVsZSA9IGRldmljZS5jcmVhdGVTaGFkZXJNb2R1bGUoZnNtRGVzYyk7XHJcblxyXG4gIGNvbnN0IHVuaWZvcm1CdWZmZXIgPSBnZXRVbmlmb3JtRGF0YShkZXZpY2UpO1xyXG5cclxuICBjb25zdCBpbWFnZVRleHR1cmUgPSBjcmVhdGVUZXh0dXJlKGRldmljZSwgZ2FtZVNpemUpO1xyXG5cclxuICBjb25zdCB7IGxheW91dCwgdW5pZm9ybUJpbmRHcm91cCB9ID0gYXdhaXQgZ2V0TGF5b3V0QW5kQmluZEdyb3VwKFxyXG4gICAgZGV2aWNlLFxyXG4gICAgdW5pZm9ybUJ1ZmZlcixcclxuICAgIGltYWdlVGV4dHVyZVxyXG4gICk7XHJcblxyXG4gIGNvbnN0IGVuY29kZUNvbXB1dGUgPSBzZXR1cENvbXB1dGVQaXBlbGluZShkZXZpY2UsIGltYWdlVGV4dHVyZSwgZ2FtZVNpemUsIGNhbnZhcyk7XHJcblxyXG4gIGNvbnN0IHBpcGVsaW5lID0gZ2V0UGlwZWxpbmUobGF5b3V0LCBkZXZpY2UsIGZyYWdNb2R1bGUsIHZlcnRNb2R1bGUpO1xyXG5cclxuICBjb25zdCB2ZXJ0QnVmZmVyID0gZ2V0VmVydGV4QnVmZmVyKGRldmljZSk7XHJcblxyXG4gIC8vIOKciyBEZWNsYXJlIGNvbW1hbmQgaGFuZGxlc1xyXG4gIGxldCBjb21tYW5kRW5jb2RlcjogR1BVQ29tbWFuZEVuY29kZXI7XHJcbiAgbGV0IHBhc3NFbmNvZGVyOiBHUFVSZW5kZXJQYXNzRW5jb2RlcjtcclxuXHJcbiAgLy8g4pyN77iPIFdyaXRlIGNvbW1hbmRzIHRvIHNlbmQgdG8gdGhlIEdQVVxyXG4gIGNvbnN0IGVuY29kZUNvbW1hbmRzID0gKCkgPT4ge1xyXG4gICAgbGV0IGNvbG9yQXR0YWNobWVudDogR1BVUmVuZGVyUGFzc0NvbG9yQXR0YWNobWVudCA9IHtcclxuICAgICAgdmlldzogY29sb3JUZXh0dXJlVmlldyxcclxuICAgICAgY2xlYXJWYWx1ZTogeyByOiAwLCBnOiAwLCBiOiAwLCBhOiAxIH0sXHJcbiAgICAgIGxvYWRPcDogXCJjbGVhclwiLFxyXG4gICAgICBzdG9yZU9wOiBcInN0b3JlXCIsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IGRlcHRoQXR0YWNobWVudDogR1BVUmVuZGVyUGFzc0RlcHRoU3RlbmNpbEF0dGFjaG1lbnQgPSB7XHJcbiAgICAgIHZpZXc6IGRlcHRoVGV4dHVyZVZpZXcsXHJcbiAgICAgIGRlcHRoQ2xlYXJWYWx1ZTogMSxcclxuICAgICAgZGVwdGhMb2FkT3A6IFwiY2xlYXJcIixcclxuICAgICAgZGVwdGhTdG9yZU9wOiBcInN0b3JlXCIsXHJcbiAgICAgIHN0ZW5jaWxDbGVhclZhbHVlOiAwLFxyXG4gICAgICBzdGVuY2lsTG9hZE9wOiBcImNsZWFyXCIsXHJcbiAgICAgIHN0ZW5jaWxTdG9yZU9wOiBcInN0b3JlXCIsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHJlbmRlclBhc3NEZXNjOiBHUFVSZW5kZXJQYXNzRGVzY3JpcHRvciA9IHtcclxuICAgICAgY29sb3JBdHRhY2htZW50czogW2NvbG9yQXR0YWNobWVudF0sXHJcbiAgICAgIGRlcHRoU3RlbmNpbEF0dGFjaG1lbnQ6IGRlcHRoQXR0YWNobWVudCxcclxuICAgIH07XHJcblxyXG4gICAgY29tbWFuZEVuY29kZXIgPSBkZXZpY2UuY3JlYXRlQ29tbWFuZEVuY29kZXIoKTtcclxuICAgIFxyXG4gICAgLy8g8J+WjO+4jyBFbmNvZGUgZHJhd2luZyBjb21tYW5kc1xyXG4gICAgcGFzc0VuY29kZXIgPSBjb21tYW5kRW5jb2Rlci5iZWdpblJlbmRlclBhc3MocmVuZGVyUGFzc0Rlc2MpO1xyXG4gICAgcGFzc0VuY29kZXIuc2V0QmluZEdyb3VwKDAsIHVuaWZvcm1CaW5kR3JvdXApO1xyXG4gICAgcGFzc0VuY29kZXIuc2V0UGlwZWxpbmUocGlwZWxpbmUpO1xyXG4gICAgcGFzc0VuY29kZXIuc2V0Vmlld3BvcnQoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0LCAwLCAxKTtcclxuICAgIHBhc3NFbmNvZGVyLnNldFNjaXNzb3JSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XHJcbiAgICBwYXNzRW5jb2Rlci5zZXRWZXJ0ZXhCdWZmZXIoMCwgdmVydEJ1ZmZlcik7XHJcbiAgICBwYXNzRW5jb2Rlci5kcmF3KDYpO1xyXG4gICAgcGFzc0VuY29kZXIuZW5kKCk7XHJcblxyXG4gICAgZW5jb2RlQ29tcHV0ZShjb21tYW5kRW5jb2Rlcik7XHJcblxyXG4gICAgdW5pZm9ybURhdGFbMjRdID0gZ2V0RGVsdGFUaW1lKCk7XHJcbiAgICBxdWV1ZS53cml0ZUJ1ZmZlcih1bmlmb3JtQnVmZmVyLCB1bmlmb3JtRGF0YS5ieXRlT2Zmc2V0LCB1bmlmb3JtRGF0YSk7XHJcbiAgICBxdWV1ZS5zdWJtaXQoW2NvbW1hbmRFbmNvZGVyLmZpbmlzaCgpXSk7XHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcmVuZGVyID0gKCkgPT4ge1xyXG4gICAgY29sb3JUZXh0dXJlID0gY29udGV4dC5nZXRDdXJyZW50VGV4dHVyZSgpO1xyXG4gICAgY29sb3JUZXh0dXJlVmlldyA9IGNvbG9yVGV4dHVyZS5jcmVhdGVWaWV3KCk7XHJcblxyXG4gICAgZW5jb2RlQ29tbWFuZHMoKTtcclxuXHJcbiAgICBpZihGUkFNRV9ERUxBWSA+IDApe1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcclxuICAgICAgfSxGUkFNRV9ERUxBWSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpXHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIHJlbmRlcjtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VW5pZm9ybURhdGEoZGV2aWNlOiBHUFVEZXZpY2UpIHtcclxuICAvLyDinIsgRGVjbGFyZSBidWZmZXIgaGFuZGxlc1xyXG4gIGNvbnN0IHVuaWZvcm1CdWZmZXI6IEdQVUJ1ZmZlciA9IGNyZWF0ZUJ1ZmZlcihcclxuICAgIGRldmljZSxcclxuICAgIHVuaWZvcm1EYXRhLFxyXG4gICAgR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUXHJcbiAgKTtcclxuICByZXR1cm4gdW5pZm9ybUJ1ZmZlcjtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0TGF5b3V0QW5kQmluZEdyb3VwKFxyXG4gIGRldmljZTogR1BVRGV2aWNlLFxyXG4gIHVuaWZvcm1CdWZmZXI6IEdQVUJ1ZmZlcixcclxuICBtYWluVGV4dHVyZTogR1BVVGV4dHVyZVxyXG4pIHtcclxuICAvLyDwn5OBIEJpbmQgR3JvdXAgTGF5b3V0XHJcbiAgY29uc3QgdW5pZm9ybUJpbmRHcm91cExheW91dDogR1BVQmluZEdyb3VwTGF5b3V0ID1cclxuICAgIGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xyXG4gICAgICBlbnRyaWVzOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLlZFUlRFWCxcclxuICAgICAgICAgIGJ1ZmZlcjoge30sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuRlJBR01FTlQsXHJcbiAgICAgICAgICBzYW1wbGVyOiB7fSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGJpbmRpbmc6IDIsXHJcbiAgICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5GUkFHTUVOVCxcclxuICAgICAgICAgIHRleHR1cmU6IHt9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgIF0sXHJcbiAgICB9KTtcclxuXHJcbiAgLy8gQ3JlYXRlIGEgc2FtcGxlciB3aXRoIGxpbmVhciBmaWx0ZXJpbmcgZm9yIHNtb290aCBpbnRlcnBvbGF0aW9uLlxyXG4gIGNvbnN0IHNhbXBsZXIgPSBkZXZpY2UuY3JlYXRlU2FtcGxlcih7XHJcbiAgICBtYWdGaWx0ZXI6IFwibmVhcmVzdFwiLFxyXG4gICAgbWluRmlsdGVyOiBcIm5lYXJlc3RcIixcclxuICB9KTtcclxuXHJcbiAgLy8g8J+XhO+4jyBCaW5kIEdyb3VwXHJcbiAgLy8g4pyNIFRoaXMgd291bGQgYmUgdXNlZCB3aGVuICplbmNvZGluZyBjb21tYW5kcypcclxuICBjb25zdCB1bmlmb3JtQmluZEdyb3VwOiBHUFVCaW5kR3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcclxuICAgIGxheW91dDogdW5pZm9ybUJpbmRHcm91cExheW91dCxcclxuICAgIGVudHJpZXM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDAsXHJcbiAgICAgICAgcmVzb3VyY2U6IHtcclxuICAgICAgICAgIGJ1ZmZlcjogdW5pZm9ybUJ1ZmZlcixcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgYmluZGluZzogMSxcclxuICAgICAgICByZXNvdXJjZTogc2FtcGxlcixcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDIsXHJcbiAgICAgICAgcmVzb3VyY2U6IG1haW5UZXh0dXJlLmNyZWF0ZVZpZXcoKSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gIC8vIPCfl4LvuI8gUGlwZWxpbmUgTGF5b3V0XHJcbiAgLy8g8J+RqeKAjfCflKcgVGhpcyB3b3VsZCBiZSB1c2VkIGFzIGEgbWVtYmVyIG9mIGEgR1BVUGlwZWxpbmVEZXNjcmlwdG9yIHdoZW4gKmNyZWF0aW5nIGEgcGlwZWxpbmUqXHJcbiAgY29uc3QgcGlwZWxpbmVMYXlvdXREZXNjID0geyBiaW5kR3JvdXBMYXlvdXRzOiBbdW5pZm9ybUJpbmRHcm91cExheW91dF0gfTtcclxuICBjb25zdCBsYXlvdXQ6IEdQVVBpcGVsaW5lTGF5b3V0ID1cclxuICAgIGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dChwaXBlbGluZUxheW91dERlc2MpO1xyXG5cclxuICByZXR1cm4geyBsYXlvdXQsIHVuaWZvcm1CaW5kR3JvdXAgfTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0QWRhcHRlcihlbnRyeTogR1BVKSB7XHJcbiAgLy8g8J+UjCBQaHlzaWNhbCBEZXZpY2UgQWRhcHRlclxyXG4gIGNvbnN0IGFkYXB0ZXI6IEdQVUFkYXB0ZXIgfCBudWxsID0gYXdhaXQgZW50cnkucmVxdWVzdEFkYXB0ZXIoKTtcclxuXHJcbiAgaWYgKCFhZGFwdGVyKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBnZXQgYWRhcHRlci5cIik7XHJcbiAgfVxyXG5cclxuICBpZighZXhwbGljaXRGZWF0dXJlcy5ldmVyeShmID0+IGFkYXB0ZXIuZmVhdHVyZXMuaGFzKGYpKSl7XHJcbiAgICBjb25zb2xlLmVycm9yKGV4cGxpY2l0RmVhdHVyZXMsIFsuLi5hZGFwdGVyLmZlYXR1cmVzLnZhbHVlcygpXSk7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYWxsIGZlYXR1cmVzIGF2YWlsYWJsZSFcIik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gYWRhcHRlcjtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0RGV2aWNlKGFkYXB0ZXI6IEdQVUFkYXB0ZXIpIHtcclxuICAvLyDwn5K7IExvZ2ljYWwgRGV2aWNlXHJcbiAgY29uc3QgZGV2aWNlOiBHUFVEZXZpY2UgfCBudWxsID0gYXdhaXQgYWRhcHRlci5yZXF1ZXN0RGV2aWNlKCk7XHJcblxyXG4gIGlmICghZGV2aWNlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb3VsZG4ndCBnZXQgZGV2aWNlLlwiKTtcclxuICB9XHJcbiAgcmV0dXJuIGRldmljZTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0Q29udGV4dChjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50LCBkZXZpY2U6IEdQVURldmljZSkge1xyXG4gIC8vIOKciyBEZWNsYXJlIGNvbnRleHQgaGFuZGxlXHJcbiAgbGV0IGNvbnRleHQ6IEdQVUNhbnZhc0NvbnRleHQgfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLy8g4pqqIENyZWF0ZSBDb250ZXh0XHJcbiAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwid2ViZ3B1XCIpO1xyXG5cclxuICBpZiAoIWNvbnRleHQpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkbid0IGNyZWF0ZSB3ZWJncHUgY29udGV4dFwiKTtcclxuICB9XHJcblxyXG4gIC8vIOKbk++4jyBDb25maWd1cmUgQ29udGV4dFxyXG4gIGNvbnN0IGNhbnZhc0NvbmZpZzogR1BVQ2FudmFzQ29uZmlndXJhdGlvbiA9IHtcclxuICAgIGRldmljZTogZGV2aWNlLFxyXG4gICAgZm9ybWF0OiBuYXZpZ2F0b3IuZ3B1LmdldFByZWZlcnJlZENhbnZhc0Zvcm1hdCgpLFxyXG4gICAgdXNhZ2U6IEdQVVRleHR1cmVVc2FnZS5SRU5ERVJfQVRUQUNITUVOVCB8IEdQVVRleHR1cmVVc2FnZS5DT1BZX1NSQyxcclxuICAgIGFscGhhTW9kZTogXCJvcGFxdWVcIixcclxuICB9O1xyXG5cclxuICBjb250ZXh0LmNvbmZpZ3VyZShjYW52YXNDb25maWcpO1xyXG5cclxuICByZXR1cm4gY29udGV4dDtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0VmVydGV4QnVmZmVyKGRldmljZTogR1BVRGV2aWNlKSB7XHJcbiAgLy8g8J+TiCBQb3NpdGlvbiBWZXJ0ZXggQnVmZmVyIERhdGFcclxuICBjb25zdCB2ZXJ0cyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xyXG4gICAgLy8gcG9zXHJcbiAgICAtMS4wLCAtMS4wLCAwLjAsXHJcbiAgICAvLyBjb2xvclxyXG4gICAgMC4wLCAxLjAsIDAuMCxcclxuICAgIC8vdXYsXHJcbiAgICAwLjAsIDAuMCxcclxuICAgIC8vIHBvc1xyXG4gICAgMS4wLCAtMS4wLCAwLjAsXHJcbiAgICAvL2NvbG9yXHJcbiAgICAxLjAsIDAuMCwgMC4wLFxyXG4gICAgLy91dlxyXG4gICAgMS4wLCAwLjAsXHJcbiAgICAvLyBwb3NcclxuICAgIDEuMCwgMS4wLCAwLjAsXHJcbiAgICAvL2NvbG9yXHJcbiAgICAwLjAsIDAuMCwgMS4wLFxyXG4gICAgLy91dlxyXG4gICAgMS4wLCAxLjAsXHJcbiAgICAvLyBwb3NcclxuICAgIDEuMCwgMS4wLCAwLjAsXHJcbiAgICAvL2NvbG9yXHJcbiAgICAxLjAsIDAuMCwgMC4wLFxyXG4gICAgLy91dlxyXG4gICAgMS4wLCAxLjAsXHJcbiAgICAvLyBwb3NcclxuICAgIC0xLjAsIDEuMCwgMC4wLFxyXG4gICAgLy9jb2xvclxyXG4gICAgMC4wLCAxLjAsIDAuMCxcclxuICAgIC8vdXZcclxuICAgIDAuMCwgMS4wLFxyXG4gICAgLy8gcG9zXHJcbiAgICAtMS4wLCAtMS4wLCAwLjAsXHJcbiAgICAvL2NvbG9yXHJcbiAgICAwLjAsIDAuMCwgMS4wLFxyXG4gICAgLy91dlxyXG4gICAgMC4wLCAwLjAsXHJcbiAgXSk7XHJcblxyXG4gIGNvbnN0IHZlcnRCdWZmZXIgPSBjcmVhdGVCdWZmZXIoZGV2aWNlLCB2ZXJ0cywgR1BVQnVmZmVyVXNhZ2UuVkVSVEVYKTtcclxuXHJcbiAgcmV0dXJuIHZlcnRCdWZmZXI7XHJcbn1cclxuXHJcbi8vIPCfkYsgSGVscGVyIGZ1bmN0aW9uIGZvciBjcmVhdGluZyBHUFVCdWZmZXIocykgb3V0IG9mIFR5cGVkIEFycmF5c1xyXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIoXHJcbiAgZGV2aWNlOiBHUFVEZXZpY2UsXHJcbiAgYXJyOiBGbG9hdDMyQXJyYXkgfCBVaW50MTZBcnJheSxcclxuICB1c2FnZTogbnVtYmVyXHJcbikge1xyXG4gIC8vIPCfk48gQWxpZ24gdG8gNCBieXRlcyAodGhhbmtzIEBjaHJpbXNvbml0ZSlcclxuICBsZXQgZGVzYyA9IHtcclxuICAgIHNpemU6IChhcnIuYnl0ZUxlbmd0aCArIDMpICYgfjMsXHJcbiAgICB1c2FnZSxcclxuICAgIG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXHJcbiAgfTtcclxuICBsZXQgYnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcihkZXNjKTtcclxuXHJcbiAgY29uc3Qgd3JpdGVBcnJheSA9XHJcbiAgICBhcnIgaW5zdGFuY2VvZiBVaW50MTZBcnJheVxyXG4gICAgICA/IG5ldyBVaW50MTZBcnJheShidWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKSlcclxuICAgICAgOiBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlci5nZXRNYXBwZWRSYW5nZSgpKTtcclxuICB3cml0ZUFycmF5LnNldChhcnIpO1xyXG4gIGJ1ZmZlci51bm1hcCgpO1xyXG4gIHJldHVybiBidWZmZXI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldFBpcGVsaW5lKFxyXG4gIGxheW91dDogR1BVUGlwZWxpbmVMYXlvdXQsXHJcbiAgZGV2aWNlOiBHUFVEZXZpY2UsXHJcbiAgZnJhZ01vZHVsZTogR1BVU2hhZGVyTW9kdWxlLFxyXG4gIHZlcnRNb2R1bGU6IEdQVVNoYWRlck1vZHVsZVxyXG4pIHtcclxuICAvLyDimpfvuI8gR3JhcGhpY3MgUGlwZWxpbmVcclxuXHJcbiAgLy8g8J+MkSBEZXB0aFxyXG4gIGNvbnN0IGRlcHRoU3RlbmNpbDogR1BVRGVwdGhTdGVuY2lsU3RhdGUgPSB7XHJcbiAgICBkZXB0aFdyaXRlRW5hYmxlZDogdHJ1ZSxcclxuICAgIGRlcHRoQ29tcGFyZTogXCJsZXNzXCIsXHJcbiAgICBmb3JtYXQ6IFwiZGVwdGgyNHBsdXMtc3RlbmNpbDhcIixcclxuICB9O1xyXG5cclxuICAvLyDwn46tIFNoYWRlciBTdGFnZXNcclxuICBjb25zdCB2ZXJ0ZXg6IEdQVVZlcnRleFN0YXRlID0ge1xyXG4gICAgbW9kdWxlOiB2ZXJ0TW9kdWxlLFxyXG4gICAgZW50cnlQb2ludDogXCJtYWluXCIsXHJcbiAgICBidWZmZXJzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBhdHRyaWJ1dGVzOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNoYWRlckxvY2F0aW9uOiAwLCAvLyBAbG9jYXRpb24oMClcclxuICAgICAgICAgICAgb2Zmc2V0OiAwLFxyXG4gICAgICAgICAgICBmb3JtYXQ6IFwiZmxvYXQzMngzXCIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzaGFkZXJMb2NhdGlvbjogMSwgLy8gQGxvY2F0aW9uKDEpXHJcbiAgICAgICAgICAgIG9mZnNldDogNCAqIDMsXHJcbiAgICAgICAgICAgIGZvcm1hdDogXCJmbG9hdDMyeDNcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNoYWRlckxvY2F0aW9uOiAyLCAvLyBAbG9jYXRpb24oMilcclxuICAgICAgICAgICAgb2Zmc2V0OiA0ICogNixcclxuICAgICAgICAgICAgZm9ybWF0OiBcImZsb2F0MzJ4MlwiLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIGFycmF5U3RyaWRlOiA0ICogOCwgLy8gc2l6ZW9mKGZsb2F0KSAqIDhcclxuICAgICAgICBzdGVwTW9kZTogXCJ2ZXJ0ZXhcIixcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfTtcclxuXHJcbiAgLy8g8J+MgCBDb2xvci9CbGVuZCBTdGF0ZVxyXG4gIGNvbnN0IGNvbG9yU3RhdGU6IEdQVUNvbG9yVGFyZ2V0U3RhdGUgPSB7XHJcbiAgICBmb3JtYXQ6IFwiYmdyYTh1bm9ybVwiLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGZyYWdtZW50OiBHUFVGcmFnbWVudFN0YXRlID0ge1xyXG4gICAgbW9kdWxlOiBmcmFnTW9kdWxlLFxyXG4gICAgZW50cnlQb2ludDogXCJtYWluXCIsXHJcbiAgICB0YXJnZXRzOiBbY29sb3JTdGF0ZV0sXHJcbiAgfTtcclxuXHJcbiAgLy8g8J+fqCBSYXN0ZXJpemF0aW9uXHJcbiAgY29uc3QgcHJpbWl0aXZlOiBHUFVQcmltaXRpdmVTdGF0ZSA9IHtcclxuICAgIGZyb250RmFjZTogXCJjd1wiLFxyXG4gICAgY3VsbE1vZGU6IFwibm9uZVwiLFxyXG4gICAgdG9wb2xvZ3k6IFwidHJpYW5nbGUtbGlzdFwiLFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHBpcGVsaW5lRGVzYzogR1BVUmVuZGVyUGlwZWxpbmVEZXNjcmlwdG9yID0ge1xyXG4gICAgbGF5b3V0LFxyXG4gICAgdmVydGV4LFxyXG4gICAgZnJhZ21lbnQsXHJcbiAgICBwcmltaXRpdmUsXHJcbiAgICBkZXB0aFN0ZW5jaWwsXHJcbiAgfTtcclxuXHJcbiAgY29uc3QgcGlwZWxpbmU6IEdQVVJlbmRlclBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZVJlbmRlclBpcGVsaW5lKHBpcGVsaW5lRGVzYyk7XHJcbiAgcmV0dXJuIHBpcGVsaW5lO1xyXG59XHJcbiIsImltcG9ydCB7IGdldE1vdXNlIH0gZnJvbSBcIi4vbW91c2VcIjtcclxuaW1wb3J0IGhzdkNvbnZlcnNpb25zIGZyb20gXCIuLi9zaGFkZXJzL2hzdi5yZ2Iud2dzbFwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldHVwQ29tcHV0ZVBpcGVsaW5lKFxyXG4gIGRldmljZTogR1BVRGV2aWNlLFxyXG4gIHRleHR1cmU6IEdQVVRleHR1cmUsXHJcbiAgc2l6ZTogeyB3aWR0aDogbnVtYmVyOyBoZWlnaHQ6IG51bWJlciB9LFxyXG4gIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnRcclxuKSB7XHJcbiAgY29uc3Qgc3dhcHBpbmdEYXRhQmluZGdyb3VwTGF5b3V0ID0gZGV2aWNlLmNyZWF0ZUJpbmRHcm91cExheW91dCh7XHJcbiAgICBlbnRyaWVzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAwLFxyXG4gICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXHJcbiAgICAgICAgYnVmZmVyOiB7XHJcbiAgICAgICAgICB0eXBlOiBcInJlYWQtb25seS1zdG9yYWdlXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDEsXHJcbiAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgIHR5cGU6IFwic3RvcmFnZVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pO1xyXG4gIGNvbnN0IHNpemVJbWFnZUJpbmRncm91cExheW91dCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXBMYXlvdXQoe1xyXG4gICAgZW50cmllczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgIHN0b3JhZ2VUZXh0dXJlOiB0ZXh0dXJlLFxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgYmluZGluZzogMSxcclxuICAgICAgICB2aXNpYmlsaXR5OiBHUFVTaGFkZXJTdGFnZS5DT01QVVRFLFxyXG4gICAgICAgIGJ1ZmZlcjoge1xyXG4gICAgICAgICAgdHlwZTogXCJ1bmlmb3JtXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDIsXHJcbiAgICAgICAgdmlzaWJpbGl0eTogR1BVU2hhZGVyU3RhZ2UuQ09NUFVURSxcclxuICAgICAgICBidWZmZXI6IHtcclxuICAgICAgICAgIHR5cGU6IFwidW5pZm9ybVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAzLFxyXG4gICAgICAgIHZpc2liaWxpdHk6IEdQVVNoYWRlclN0YWdlLkNPTVBVVEUsXHJcbiAgICAgICAgYnVmZmVyOiB7XHJcbiAgICAgICAgICB0eXBlOiBcInVuaWZvcm1cIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcbiAgY29uc3QgY29tcHV0ZVBpcGVsaW5lID0gZGV2aWNlLmNyZWF0ZUNvbXB1dGVQaXBlbGluZSh7XHJcbiAgICBsYXlvdXQ6IGRldmljZS5jcmVhdGVQaXBlbGluZUxheW91dCh7XHJcbiAgICAgIGJpbmRHcm91cExheW91dHM6IFtzd2FwcGluZ0RhdGFCaW5kZ3JvdXBMYXlvdXQsIHNpemVJbWFnZUJpbmRncm91cExheW91dF0sXHJcbiAgICB9KSxcclxuICAgIGNvbXB1dGU6IHtcclxuICAgICAgbW9kdWxlOiBkZXZpY2UuY3JlYXRlU2hhZGVyTW9kdWxlKHtcclxuICAgICAgICBjb2RlOiBgXHJcbiAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDApXHJcbiAgICAgICAgdmFyPHN0b3JhZ2UsIHJlYWQ+IGluX2RhdGE6IGFycmF5PHZlYzQ8ZjMyPj47XHJcbiAgICAgICAgQGdyb3VwKDApIEBiaW5kaW5nKDEpIFxyXG4gICAgICAgIHZhcjxzdG9yYWdlLCByZWFkX3dyaXRlPiBvdXRfZGF0YTogYXJyYXk8dmVjNDxmMzI+PjtcclxuICAgICAgICBAZ3JvdXAoMSkgQGJpbmRpbmcoMClcclxuICAgICAgICB2YXIgb3V0X2ltYWdlOiB0ZXh0dXJlX3N0b3JhZ2VfMmQ8cmdiYTh1bm9ybSwgd3JpdGU+O1xyXG4gICAgICAgIEBncm91cCgxKSBAYmluZGluZygxKVxyXG4gICAgICAgIHZhcjx1bmlmb3JtPiBzaXplOiB2ZWMyPHUzMj47XHJcbiAgICAgICAgQGdyb3VwKDEpIEBiaW5kaW5nKDIpXHJcbiAgICAgICAgdmFyPHVuaWZvcm0+IGZyYW1lOiB1MzI7XHJcbiAgICAgICAgQGdyb3VwKDEpIEBiaW5kaW5nKDMpXHJcbiAgICAgICAgdmFyPHVuaWZvcm0+IG1vdXNlOiB2ZWM0PHUzMj47XHJcblxyXG4gICAgICAgIGNvbnN0IEJPVU5EUzpmMzIgPSAtMTtcclxuICAgICAgICBjb25zdCBBSVI6ZjMyID0gMDtcclxuICAgICAgICBjb25zdCBTQU5EOmYzMiA9IDE7XHJcblxyXG4gICAgICAgIGZuIGdldEluZGV4KHBvczogdmVjMjx1MzI+KSAtPiB1MzIge1xyXG4gICAgICAgICAgICBsZXQgaCA9IHNpemUueTtcclxuICAgICAgICAgICAgbGV0IHcgPSBzaXplLng7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIChwb3MueSAlIGgpICogdyArIChwb3MueCAlIHcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm4gZ2V0RGF0YShwb3M6IHZlYzI8dTMyPikgLT4gdmVjNDxmMzI+IHtcclxuICAgICAgICAgICAgaWYocG9zLnggPj0gc2l6ZS54IHx8IHBvcy55ID49IHNpemUueSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmVjNChCT1VORFMsIDAsMCwwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaW5fZGF0YVtnZXRJbmRleChwb3MpXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZuIHNldERhdGEocG9zOiB2ZWMyPHUzMj4sIGRhdGE6IHZlYzQ8ZjMyPil7XHJcbiAgICAgICAgICAgIGlmKHBvcy54IDwgc2l6ZS54ICYmIHBvcy55IDwgc2l6ZS55KXtcclxuICAgICAgICAgICAgICAgIG91dF9kYXRhW2dldEluZGV4KHBvcyldID0gZGF0YTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm4gZ2V0TmVpZ2hib3Job29kKHBvczogdmVjMjx1MzI+KSAtPiBOZWlnaGJvcmhvb2Qge1xyXG4gICAgICAgICAgICByZXR1cm4gTmVpZ2hib3Job29kKFxyXG4gICAgICAgICAgICAgICAgZ2V0RGF0YShwb3MpLFxyXG4gICAgICAgICAgICAgICAgZ2V0RGF0YShwb3MgKyB2ZWMyKDEsMCkpLFxyXG4gICAgICAgICAgICAgICAgZ2V0RGF0YShwb3MgKyB2ZWMyKDAsMSkpLFxyXG4gICAgICAgICAgICAgICAgZ2V0RGF0YShwb3MgKyB2ZWMyKDEsMSkpXHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm4gd3JpdGVOZWlnaGJvcmhvb2QocG9zOiB2ZWMyPHUzMj4sIG46IE5laWdoYm9yaG9vZCl7XHJcbiAgICAgICAgICAgIHNldERhdGEocG9zLCBuLmMwMCk7XHJcbiAgICAgICAgICAgIHNldERhdGEocG9zK3ZlYzIoMSwwKSwgbi5jMTApO1xyXG4gICAgICAgICAgICBzZXREYXRhKHBvcyt2ZWMyKDAsMSksIG4uYzAxKTtcclxuICAgICAgICAgICAgc2V0RGF0YShwb3MrdmVjMigxLDEpLCBuLmMxMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmbiBkcmF3TmVpZ2hib3Job29kKHBvczogdmVjMjx1MzI+LCBuOiBOZWlnaGJvcmhvb2Qpe1xyXG4gICAgICAgICAgICB0ZXh0dXJlU3RvcmUob3V0X2ltYWdlLCBwb3MsIHZlYzQobi5jMDAueHl6LDEpKTtcclxuICAgICAgICAgICAgaWYobi5jMTAuYSAhPSBCT1VORFMpe1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZVN0b3JlKG91dF9pbWFnZSwgcG9zK3ZlYzIoMSwwKSwgdmVjNChuLmMxMC54eXosMSkpO1xyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICBpZihuLmMwMS5hICE9IEJPVU5EUyl7XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlU3RvcmUob3V0X2ltYWdlLCBwb3MrdmVjMigwLDEpLCB2ZWM0KG4uYzAxLnh5eiwxKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYobi5jMTEuYSAhPSBCT1VORFMpe1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZVN0b3JlKG91dF9pbWFnZSwgcG9zK3ZlYzIoMSwxKSwgdmVjNChuLmMxMS54eXosMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAke2hzdkNvbnZlcnNpb25zfVxyXG5cclxuICAgICAgICAvLyBmbiBzd2FwKGE6IHZlYzM8ZjMyPiwgYjp2ZWMzPGYzMj4pe1xyXG4gICAgICAgIC8vICAgICBsZXQgdGVtcCA9IGE7XHJcbiAgICAgICAgLy8gICAgIGEucmdiID0gYi5yZ2I7XHJcbiAgICAgICAgLy8gICAgIGIgPSB0LnJnYjtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIC8vIHZhcjx3b3JrZ3JvdXA+IHNoYXJlZEJsb2NrIDogYXJyYXk8dTMyLCA0PjtcclxuICAgICAgICBcclxuICAgICAgICBzdHJ1Y3QgTmVpZ2hib3Job29kIHtcclxuICAgICAgICAgICAgYzAwOiB2ZWM0PGYzMj4sXHJcbiAgICAgICAgICAgIGMxMDogdmVjNDxmMzI+LFxyXG4gICAgICAgICAgICBjMDE6IHZlYzQ8ZjMyPixcclxuICAgICAgICAgICAgYzExOiB2ZWM0PGYzMj4sXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmbiBnZXRPZmZzZXQoKSAtPiB2ZWMyPHUzMj57XHJcbiAgICAgICAgICAgIGlmKGZyYW1lICUgNCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2ZWMyKDAsMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZihmcmFtZSAlIDQ9PTEpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZlYzIoMSwxKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGZyYW1lJSA0PT0yKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2ZWMyKDAsMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHZlYzIoMSwwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZuIGhhc2g0MyhwOiB2ZWMzPHUzMj4pIC0+IHZlYzQ8ZjMyPlxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHZhciBwNCA9IGZyYWN0KHZlYzQ8ZjMyPihwLnh5engpICAqIHZlYzQoLjEwMzEsIC4xMDMwLCAuMDk3MywgLjEwOTkpKTtcclxuICAgICAgICAgIHA0ICs9IGRvdChwNCwgcDQud3p4eSszMy4zMyk7XHJcbiAgICAgICAgICByZXR1cm4gZnJhY3QoKHA0Lnh4eXorcDQueXp6dykqcDQuenl3eCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBAY29tcHV0ZSBAd29ya2dyb3VwX3NpemUoMSkgZm4gbWFpbihcclxuICAgICAgICBAYnVpbHRpbihnbG9iYWxfaW52b2NhdGlvbl9pZCkgaWQgOiB2ZWMzdSxcclxuICAgICAgICBAYnVpbHRpbihsb2NhbF9pbnZvY2F0aW9uX2lkKSBsb2NhbF9pZCA6IHZlYzN1XHJcbiAgICAgICAgKSAge1xyXG4gICAgICAgICAgICBsZXQgcG9zID0gaWQueHkqMiArIGdldE9mZnNldCgpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgbGV0IHBvc19pbmRleCA9IGdldEluZGV4KHBvcyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgciA9IGhhc2g0Myh2ZWMzKHBvcywgZnJhbWUpKTtcclxuICAgICAgICAgICAgdmFyIG5laWdoID0gZ2V0TmVpZ2hib3Job29kKHBvcyk7XHJcbiAgICAgICAgICAgIHZhciBjMDAgPSBuZWlnaC5jMDA7XHJcbiAgICAgICAgICAgIHZhciBjMDEgPSBuZWlnaC5jMDE7XHJcbiAgICAgICAgICAgIHZhciBjMTAgPSBuZWlnaC5jMTA7XHJcbiAgICAgICAgICAgIHZhciBjMTEgPSBuZWlnaC5jMTE7XHJcblxyXG4gICAgICAgICAgICBpZihjMDAuYSAhPSBCT1VORFMgJiYgbW91c2UueiAhPSAwICYmIGRpc3RhbmNlKHZlYzI8ZjMyPihwb3MpLCB2ZWMyPGYzMj4obW91c2UueHkpKSA8IGYzMihtb3VzZS53KSl7XHJcbiAgICAgICAgICAgICAgaWYobW91c2UueiA9PSAxKXtcclxuICAgICAgICAgICAgICAgIGxldCBuZXdfY29sb3IgPSBoc3ZUb1JnYih2ZWMzKGYzMihmcmFtZSkvMTAwMCwgMC43LCAxKSk7XHJcbiAgICAgICAgICAgICAgICBuZWlnaC5jMDAgPSB2ZWM0KG5ld19jb2xvciwgU0FORCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5laWdoLmMwMCA9IHZlYzQoMCwgMCwgMCwgQUlSKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihuZWlnaC5jMDAuYSA9PSBTQU5EICYmIG5laWdoLmMwMS5hID09IFNBTkQgJiYgbmVpZ2guYzEwLmEgPT0gQUlSICYmIG5laWdoLmMxMS5hID09IEFJUil7XHJcbiAgICAgICAgICAgICAgbGV0IHRlbXAgPSBuZWlnaC5jMDA7XHJcbiAgICAgICAgICAgICAgbmVpZ2guYzAwID0gbmVpZ2guYzEwO1xyXG4gICAgICAgICAgICAgIG5laWdoLmMxMCA9IHRlbXA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKG5laWdoLmMxMC5hID09IFNBTkQgJiYgbmVpZ2guYzExLmEgPT0gU0FORCAmJiBuZWlnaC5jMDAuYSA9PSBBSVIgJiYgbmVpZ2guYzAxLmEgPT0gQUlSKXtcclxuICAgICAgICAgICAgICBsZXQgdGVtcCA9IG5laWdoLmMwMTtcclxuICAgICAgICAgICAgICBuZWlnaC5jMDEgPSBuZWlnaC5jMTA7XHJcbiAgICAgICAgICAgICAgbmVpZ2guYzEwID0gdGVtcDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYobmVpZ2guYzAwLmEgPT0gU0FORCAmJiBuZWlnaC5jMDEuYSA9PSBBSVIpe1xyXG4gICAgICAgICAgICAgIGxldCB0ZW1wID0gbmVpZ2guYzAwO1xyXG4gICAgICAgICAgICAgIG5laWdoLmMwMCA9IG5laWdoLmMwMTtcclxuICAgICAgICAgICAgICBuZWlnaC5jMDEgPSB0ZW1wO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZihuZWlnaC5jMTAuYSA9PSBTQU5EICYmIG5laWdoLmMxMS5hID09IEFJUil7XHJcbiAgICAgICAgICAgICAgbGV0IHRlbXAgPSBuZWlnaC5jMTA7XHJcbiAgICAgICAgICAgICAgbmVpZ2guYzEwID0gbmVpZ2guYzExO1xyXG4gICAgICAgICAgICAgIG5laWdoLmMxMSA9IHRlbXA7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBkcmF3TmVpZ2hib3Job29kKHBvcywgbmVpZ2gpO1xyXG4gICAgICAgICAgICB3cml0ZU5laWdoYm9yaG9vZChwb3MsIG5laWdoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmKG91dF9kYXRhW3Bvc19pbmRleF0uYSA+IDApe1xyXG4gICAgICAgICAgICAvLyAgIHRleHR1cmVTdG9yZShvdXRfaW1hZ2UsIHBvcywgdmVjNChvdXRfZGF0YVtwb3NfaW5kZXhdLmEsMCwwLCAwLjApKTtcclxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICB0ZXh0dXJlU3RvcmUob3V0X2ltYWdlLCBwb3MsIHZlYzQoMCwwLDEsIDAuMCkpO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGAsXHJcbiAgICAgIH0pLFxyXG4gICAgICBlbnRyeVBvaW50OiBcIm1haW5cIixcclxuICAgIH0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHNpemVCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcclxuICAgIG1hcHBlZEF0Q3JlYXRpb246IHRydWUsXHJcbiAgICBzaXplOiAyICogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXHJcbiAgICB1c2FnZTpcclxuICAgICAgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfFxyXG4gICAgICBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyB8XHJcbiAgICAgIEdQVUJ1ZmZlclVzYWdlLlVOSUZPUk0sXHJcbiAgfSk7XHJcblxyXG4gIG5ldyBVaW50MzJBcnJheShzaXplQnVmZmVyLmdldE1hcHBlZFJhbmdlKCkpLnNldChbc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHRdKTtcclxuICBzaXplQnVmZmVyLnVubWFwKCk7XHJcblxyXG4gIGNvbnN0IGluaXRpYWxEYXRhID0gbmV3IEZsb2F0MzJBcnJheShzaXplLmhlaWdodCAqIHNpemUud2lkdGggKiA0KTtcclxuXHJcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplLmhlaWdodDsgaSsrKSB7XHJcbiAgICBsZXQgaiA9IDA7XHJcbiAgICBsZXQgaW5kZXggPSAoaSAqIHNpemUud2lkdGggKyBqKSAqIDQ7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleF0gPSAtMTtcclxuICAgIGluaXRpYWxEYXRhW2luZGV4ICsgMV0gPSAxO1xyXG4gICAgaW5pdGlhbERhdGFbaW5kZXggKyAyXSA9IDE7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleCArIDNdID0gLTE7XHJcbiAgICBqID0gc2l6ZS53aWR0aCAtIDE7XHJcbiAgICBpbmRleCA9IChpICogc2l6ZS53aWR0aCArIGopICogNDtcclxuICAgIGluaXRpYWxEYXRhW2luZGV4XSA9IC0xO1xyXG4gICAgaW5pdGlhbERhdGFbaW5kZXggKyAxXSA9IDE7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleCArIDJdID0gMTtcclxuICAgIGluaXRpYWxEYXRhW2luZGV4ICsgM10gPSAtMTtcclxuICB9XHJcblxyXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZS53aWR0aDsgaSsrKSB7XHJcbiAgICBsZXQgaiA9IDA7XHJcbiAgICBsZXQgaW5kZXggPSAoaiAqIHNpemUud2lkdGggKyBpKSAqIDQ7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleF0gPSAtMTtcclxuICAgIGluaXRpYWxEYXRhW2luZGV4ICsgMV0gPSAxO1xyXG4gICAgaW5pdGlhbERhdGFbaW5kZXggKyAyXSA9IDE7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleCArIDNdID0gLTE7XHJcbiAgICBqID0gc2l6ZS5oZWlnaHQgLSAxO1xyXG4gICAgaW5kZXggPSAoaiAqIHNpemUud2lkdGggKyBpKSAqIDQ7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleF0gPSAtMTtcclxuICAgIGluaXRpYWxEYXRhW2luZGV4ICsgMV0gPSAxO1xyXG4gICAgaW5pdGlhbERhdGFbaW5kZXggKyAyXSA9IDE7XHJcbiAgICBpbml0aWFsRGF0YVtpbmRleCArIDNdID0gLTE7XHJcbiAgfVxyXG5cclxuICBjb25zdCBjZW50ZXIgPSB7XHJcbiAgICB4OiBNYXRoLmZsb29yKHNpemUud2lkdGggLyAyKSxcclxuICAgIHk6IE1hdGguZmxvb3Ioc2l6ZS5oZWlnaHQgLyAyKSxcclxuICB9O1xyXG4gIGNvbnN0IHJhZGl1cyA9IDA7XHJcbiAgY29uc3QgaGFsZlJhZGl1cyA9IE1hdGguZmxvb3IocmFkaXVzIC8gMik7XHJcblxyXG4gIGZvciAobGV0IGogPSBjZW50ZXIueSAtIGhhbGZSYWRpdXM7IGogPCBjZW50ZXIueSArIGhhbGZSYWRpdXM7IGorKykge1xyXG4gICAgZm9yIChsZXQgaSA9IGNlbnRlci54IC0gaGFsZlJhZGl1czsgaSA8IGNlbnRlci54ICsgaGFsZlJhZGl1czsgaSsrKSB7XHJcbiAgICAgIGNvbnN0IGluZGV4ID0gKGkgKiBzaXplLndpZHRoICsgaikgKiA0O1xyXG4gICAgICBpbml0aWFsRGF0YVtpbmRleF0gPSAxO1xyXG4gICAgICBpbml0aWFsRGF0YVtpbmRleCArIDFdID0gMTtcclxuICAgICAgaW5pdGlhbERhdGFbaW5kZXggKyAyXSA9IDE7XHJcbiAgICAgIGluaXRpYWxEYXRhW2luZGV4ICsgM10gPSAxO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uc3QgZGF0YTBCdWZmZXIgPSBkZXZpY2UuY3JlYXRlQnVmZmVyKHtcclxuICAgIHNpemU6IHNpemUuaGVpZ2h0ICogc2l6ZS53aWR0aCAqIEZsb2F0MzJBcnJheS5CWVRFU19QRVJfRUxFTUVOVCAqIDQsXHJcbiAgICB1c2FnZTpcclxuICAgICAgR1BVQnVmZmVyVXNhZ2UuQ09QWV9EU1QgfFxyXG4gICAgICBHUFVCdWZmZXJVc2FnZS5DT1BZX1NSQyB8XHJcbiAgICAgIEdQVUJ1ZmZlclVzYWdlLlNUT1JBR0UsXHJcbiAgfSk7XHJcbiAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGRhdGEwQnVmZmVyLCAwLCBpbml0aWFsRGF0YSk7XHJcblxyXG4gIGNvbnN0IGRhdGExQnVmZmVyID0gZGV2aWNlLmNyZWF0ZUJ1ZmZlcih7XHJcbiAgICBzaXplOiBzaXplLmhlaWdodCAqIHNpemUud2lkdGggKiBGbG9hdDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiA0LFxyXG4gICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuU1RPUkFHRSxcclxuICB9KTtcclxuXHJcbiAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGRhdGExQnVmZmVyLCAwLCBpbml0aWFsRGF0YSk7XHJcblxyXG4gIGNvbnN0IGRvbWFpbk9mZnNldEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgc2l6ZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQsXHJcbiAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBtb3VzZUJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgc2l6ZTogVWludDMyQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKiA0LCAvLygxNiksXHJcbiAgICB1c2FnZTogR1BVQnVmZmVyVXNhZ2UuVU5JRk9STSB8IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNULFxyXG4gIH0pO1xyXG5cclxuICBjb25zdCBzd2FwMEJpbmRncm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xyXG4gICAgbGF5b3V0OiBzd2FwcGluZ0RhdGFCaW5kZ3JvdXBMYXlvdXQsXHJcbiAgICBlbnRyaWVzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAwLFxyXG4gICAgICAgIHJlc291cmNlOiB7IGJ1ZmZlcjogZGF0YTBCdWZmZXIgfSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDEsXHJcbiAgICAgICAgcmVzb3VyY2U6IHsgYnVmZmVyOiBkYXRhMUJ1ZmZlciB9LFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KTtcclxuXHJcbiAgY29uc3Qgc3dhcDFCaW5kZ3JvdXAgPSBkZXZpY2UuY3JlYXRlQmluZEdyb3VwKHtcclxuICAgIGxheW91dDogc3dhcHBpbmdEYXRhQmluZGdyb3VwTGF5b3V0LFxyXG4gICAgZW50cmllczogW1xyXG4gICAgICB7XHJcbiAgICAgICAgYmluZGluZzogMCxcclxuICAgICAgICByZXNvdXJjZTogeyBidWZmZXI6IGRhdGExQnVmZmVyIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAxLFxyXG4gICAgICAgIHJlc291cmNlOiB7IGJ1ZmZlcjogZGF0YTBCdWZmZXIgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHNpemVJbWFnZUJpbmRHcm91cCA9IGRldmljZS5jcmVhdGVCaW5kR3JvdXAoe1xyXG4gICAgbGF5b3V0OiBzaXplSW1hZ2VCaW5kZ3JvdXBMYXlvdXQsXHJcbiAgICBlbnRyaWVzOiBbXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAwLFxyXG4gICAgICAgIHJlc291cmNlOiB0ZXh0dXJlLmNyZWF0ZVZpZXcoKSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIGJpbmRpbmc6IDEsXHJcbiAgICAgICAgcmVzb3VyY2U6IHsgYnVmZmVyOiBzaXplQnVmZmVyIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAyLFxyXG4gICAgICAgIHJlc291cmNlOiB7IGJ1ZmZlcjogZG9tYWluT2Zmc2V0QnVmZmVyIH0sXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBiaW5kaW5nOiAzLFxyXG4gICAgICAgIHJlc291cmNlOiB7IGJ1ZmZlcjogbW91c2VCdWZmZXIgfSxcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSk7XHJcblxyXG4gIGNvbnN0IHJhdGlvID0ge3g6IGNhbnZhcy53aWR0aCAvIHNpemUud2lkdGgsIHk6IGNhbnZhcy5oZWlnaHQgLyBzaXplLmhlaWdodH07XHJcbiAgY29uc3QgZHJhd2luZ1JhZGl1cyA9IDU7XHJcblxyXG4gIGxldCByZW5kZXJzOiBudW1iZXIgPSAwO1xyXG4gIGNvbnN0IGVuY29kZUNvbXB1dGUgPSAoZW5jb2RlcjogR1BVQ29tbWFuZEVuY29kZXIpID0+IHtcclxuICAgIGNvbnN0IHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICBjb25zdCBtb3VzZSA9IGdldE1vdXNlKCk7XHJcbiAgICBjb25zdCByZWxhdGl2ZU1vdXNlID0ge3g6IGNsYW1wKChtb3VzZS54IC0gcmVjdC54KS9yYXRpby54LCAwLCBzaXplLndpZHRoLTEpLCB5OiBjbGFtcCgobW91c2UueSAtIHJlY3QueSkvcmF0aW8ueSwgMCwgc2l6ZS5oZWlnaHQtMSl9O1xyXG4gICAgcmVsYXRpdmVNb3VzZS54ID0gTWF0aC5mbG9vcihyZWxhdGl2ZU1vdXNlLngpO1xyXG4gICAgcmVsYXRpdmVNb3VzZS55ID0gTWF0aC5mbG9vcihyZWxhdGl2ZU1vdXNlLnkpO1xyXG4gICAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKGRvbWFpbk9mZnNldEJ1ZmZlciwgMCwgbmV3IFVpbnQzMkFycmF5KFtyZW5kZXJzXSkpO1xyXG4gICAgZGV2aWNlLnF1ZXVlLndyaXRlQnVmZmVyKG1vdXNlQnVmZmVyLCAwLCBuZXcgVWludDMyQXJyYXkoW3JlbGF0aXZlTW91c2UueCwgcmVsYXRpdmVNb3VzZS55LCBtb3VzZS5sZWZ0Q2xpY2sgPyAxIDogbW91c2UucmlnaHRDbGljayA/IC0xIDogMCwgZHJhd2luZ1JhZGl1c10pKTtcclxuICAgIGNvbnN0IHBhc3MgPSBlbmNvZGVyLmJlZ2luQ29tcHV0ZVBhc3MoKTtcclxuICAgIHBhc3Muc2V0UGlwZWxpbmUoY29tcHV0ZVBpcGVsaW5lKTtcclxuICAgIHBhc3Muc2V0QmluZEdyb3VwKDAsIHJlbmRlcnMgJSAyID8gc3dhcDBCaW5kZ3JvdXAgOiBzd2FwMUJpbmRncm91cCk7XHJcbiAgICBwYXNzLnNldEJpbmRHcm91cCgxLCBzaXplSW1hZ2VCaW5kR3JvdXApO1xyXG4gICAgcGFzcy5kaXNwYXRjaFdvcmtncm91cHMoc2l6ZS53aWR0aCwgc2l6ZS5oZWlnaHQpO1xyXG4gICAgcGFzcy5lbmQoKTtcclxuXHJcbiAgICByZW5kZXJzKys7XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIGVuY29kZUNvbXB1dGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGxvZ1N0b3JhZ2VCdWZmZXIoZGV2aWNlOiBHUFVEZXZpY2UsIHN0b3JhZ2VCdWZmZXI6IEdQVUJ1ZmZlcikge1xyXG4gIGRldmljZS5xdWV1ZS5vblN1Ym1pdHRlZFdvcmtEb25lKCkudGhlbigoKSA9PiB7XHJcbiAgICBjb25zdCBjb3B5RW5jb2RlciA9IGRldmljZS5jcmVhdGVDb21tYW5kRW5jb2RlcigpO1xyXG4gICAgY29uc3QgcmVhZEJ1ZmZlciA9IGRldmljZS5jcmVhdGVCdWZmZXIoe1xyXG4gICAgICBsYWJlbDogXCJyZWFkIGRhdGEgYnVmZmVyXCIsXHJcbiAgICAgIHNpemU6IHN0b3JhZ2VCdWZmZXIuc2l6ZSxcclxuICAgICAgdXNhZ2U6IEdQVUJ1ZmZlclVzYWdlLkNPUFlfRFNUIHwgR1BVQnVmZmVyVXNhZ2UuTUFQX1JFQUQsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb3B5RW5jb2Rlci5jb3B5QnVmZmVyVG9CdWZmZXIoXHJcbiAgICAgIHN0b3JhZ2VCdWZmZXIsXHJcbiAgICAgIDAsXHJcbiAgICAgIHJlYWRCdWZmZXIsXHJcbiAgICAgIDAsXHJcbiAgICAgIHN0b3JhZ2VCdWZmZXIuc2l6ZVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGNvcHlDb21tYW5kcyA9IGNvcHlFbmNvZGVyLmZpbmlzaCgpO1xyXG4gICAgZGV2aWNlLnF1ZXVlLnN1Ym1pdChbY29weUNvbW1hbmRzXSk7XHJcbiAgICByZWFkQnVmZmVyLm1hcEFzeW5jKEdQVU1hcE1vZGUuUkVBRCkudGhlbigoKSA9PiB7XHJcbiAgICAgIGNvbnN0IGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KHJlYWRCdWZmZXIuZ2V0TWFwcGVkUmFuZ2UoKSk7XHJcbiAgICAgIC8vIGNvbnN0IHJlcyA9IFtdIGFzIGFueTtcclxuICAgICAgLy8gZm9yIChsZXQgeSA9IDA7IHkgPCBzaXplLmhlaWdodDsgeSsrKSB7XHJcbiAgICAgIC8vICAgcmVzW3ldID0gW107XHJcbiAgICAgIC8vICAgZm9yIChsZXQgeCA9IDA7IHggPCBzaXplLndpZHRoOyB4KyspIHtcclxuICAgICAgLy8gICAgIGNvbnN0IGluZGV4ID0gKHkgKiBzaXplLndpZHRoICsgeCkgKiA0O1xyXG4gICAgICAvLyAgICAgcmVzW3ldW3hdID0gW2RhdGEwW2luZGV4XSwgZGF0YTBbaW5kZXggKyAxXSwgZGF0YTBbaW5kZXggKyAyXV07XHJcbiAgICAgIC8vICAgfVxyXG4gICAgICAvLyB9XHJcbiAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICByZWFkQnVmZmVyLnVubWFwKCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuY29uc3QgY2xhbXAgPSAodmFsOiBudW1iZXIsIG1pbjpudW1iZXIsIG1heDpudW1iZXIpID0+IE1hdGgubWluKE1hdGgubWF4KHZhbCwgbWluKSwgbWF4KSIsImNvbnN0IExPR0dJTkdfTU9VU0UgPSBmYWxzZTtcclxuXHJcbmNvbnN0IG1vdXNlID0ge1xyXG4gIHg6IDAsXHJcbiAgeTogMCxcclxuICByaWdodENsaWNrOiBmYWxzZSxcclxuICBsZWZ0Q2xpY2s6IGZhbHNlLFxyXG59O1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgKGV2ZW50KSA9PiB7XHJcbiAgbW91c2UueCA9IGV2ZW50LmNsaWVudFg7XHJcbiAgbW91c2UueSA9IGV2ZW50LmNsaWVudFk7XHJcbiAgbG9nTW91c2UoKTtcclxufSk7XHJcblxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCAoZSkgPT4ge1xyXG4gICAgaWYoZS5idXR0b24gPT0gMil7XHJcbiAgICAgICAgbW91c2UucmlnaHRDbGljayA9IHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG1vdXNlLmxlZnRDbGljayA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBsb2dNb3VzZShcIm1vdXNlIGRvd25cIik7XHJcbn0pO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJjb250ZXh0bWVudVwiLCAoZSkgPT4ge1xyXG4gICAgLy8gbW91c2UucmlnaHRDbGljayA9IHRydWU7XHJcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICBsb2dNb3VzZShcImNvbnRleHRcIik7XHJcbn0pO1xyXG5cclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChlKSA9PiB7XHJcbiAgICBtb3VzZS5sZWZ0Q2xpY2sgPSBmYWxzZTtcclxuICAgIG1vdXNlLnJpZ2h0Q2xpY2sgPSBmYWxzZTtcclxuICAgIGxvZ01vdXNlKFwibW91c2UgdXBcIilcclxufSk7XHJcblxyXG5mdW5jdGlvbiBsb2dNb3VzZShlID0gXCJcIil7XHJcbiAgICBpZighTE9HR0lOR19NT1VTRSl7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coZSwgbW91c2UpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW91c2UoKSB7XHJcbiAgcmV0dXJuIG1vdXNlO1xyXG59XHJcbiIsImV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkVGV4dHVyZShkZXZpY2U6IEdQVURldmljZSkge1xyXG4gIGxldCBpbWFnZVRleHR1cmU6IEdQVVRleHR1cmU7XHJcbiAge1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChcIi9waG90by5wbmdcIik7XHJcbiAgICBjb25zdCBpbWFnZUJpdG1hcCA9IGF3YWl0IGNyZWF0ZUltYWdlQml0bWFwKGF3YWl0IHJlc3BvbnNlLmJsb2IoKSk7XHJcbiAgICBpbWFnZVRleHR1cmUgPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XHJcbiAgICAgIHNpemU6IFtpbWFnZUJpdG1hcC53aWR0aCwgaW1hZ2VCaXRtYXAuaGVpZ2h0LCAxXSxcclxuICAgICAgZm9ybWF0OiBcInJnYmE4dW5vcm1cIixcclxuICAgICAgdXNhZ2U6XHJcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8XHJcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNUIHxcclxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQgfFxyXG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcsXHJcbiAgICB9KTtcclxuICAgIGRldmljZS5xdWV1ZS5jb3B5RXh0ZXJuYWxJbWFnZVRvVGV4dHVyZShcclxuICAgICAgeyBzb3VyY2U6IGltYWdlQml0bWFwIH0sXHJcbiAgICAgIHsgdGV4dHVyZTogaW1hZ2VUZXh0dXJlIH0sXHJcbiAgICAgIFtpbWFnZUJpdG1hcC53aWR0aCwgaW1hZ2VCaXRtYXAuaGVpZ2h0XVxyXG4gICAgKTtcclxuICAgIC8vIGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoaW1hZ2VUZXh0dXJlLCBpbWFnZUJpdG1hcCwge30sIHtoZWlnaHQ6aW1hZ2VCaXRtYXAuaGVpZ2h0LCB3aWR0aDogaW1hZ2VCaXRtYXAud2lkdGh9KVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGltYWdlVGV4dHVyZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRleHR1cmUoZGV2aWNlOiBHUFVEZXZpY2UsIHNpemU6IHt3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn0pIHtcclxuICBsZXQgaW1hZ2VUZXh0dXJlOiBHUFVUZXh0dXJlO1xyXG4gIHtcclxuICAgIGNvbnN0IHdpZHRoID0gc2l6ZS53aWR0aDtcclxuICAgIGNvbnN0IGhlaWdodCA9IHNpemUuaGVpZ2h0O1xyXG4gICAgY29uc3QgYiA9IFswLCAwLCAwLCAyNTVdO1xyXG4gICAgY29uc3QgdyA9IFsyNTUsIDI1NSwgMjU1LCAyNTVdO1xyXG4gICAgY29uc3QgaW1hZ2VCaXRtYXAgPSBuZXcgVWludDhBcnJheSh3aWR0aCAqIGhlaWdodCAqIDQpO1xyXG4gICAgLy8gY29uc3QgcmFkaXVzID0gMTA7XHJcbiAgICAvLyBjb25zdCBjZW50ZXIgPSB7eDogTWF0aC5mbG9vcih3aWR0aC8yKSwgeTpNYXRoLmZsb29yKGhlaWdodC8yKX1cclxuICAgIC8vIGZvcihsZXQgaSA9IGNlbnRlci54LXJhZGl1cy8yO2k8Y2VudGVyLngrcmFkaXVzLzI7IGkrKyl7XHJcbiAgICAvLyAgICAgZm9yKGxldCBqID0gY2VudGVyLnktcmFkaXVzLzI7IGo8Y2VudGVyLnkrcmFkaXVzLzI7IGorKyl7XHJcbiAgICAvLyAgICAgICAgIGNvbnN0IGluZGV4ID0gKGkqd2lkdGggKyBqKSo0O1xyXG4gICAgLy8gICAgICAgICBpbWFnZUJpdG1hcFtpbmRleF0gPSAyNTU7XHJcbiAgICAvLyAgICAgICAgIGltYWdlQml0bWFwW2luZGV4KzFdID0gMjU1O1xyXG4gICAgLy8gICAgICAgICBpbWFnZUJpdG1hcFtpbmRleCsyXSA9IDI1NTtcclxuICAgIC8vICAgICAgICAgaW1hZ2VCaXRtYXBbaW5kZXgrM10gPSAyNTU7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfSBcclxuXHJcbiAgICBpbWFnZVRleHR1cmUgPSBkZXZpY2UuY3JlYXRlVGV4dHVyZSh7XHJcbiAgICAgIHNpemU6IFt3aWR0aCwgaGVpZ2h0LCAxXSxcclxuICAgICAgZm9ybWF0OiBcInJnYmE4dW5vcm1cIixcclxuICAgICAgdXNhZ2U6XHJcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLlRFWFRVUkVfQklORElORyB8XHJcbiAgICAgICAgR1BVVGV4dHVyZVVzYWdlLkNPUFlfRFNUIHxcclxuICAgICAgICBHUFVUZXh0dXJlVXNhZ2UuUkVOREVSX0FUVEFDSE1FTlQgfFxyXG4gICAgICAgIEdQVVRleHR1cmVVc2FnZS5TVE9SQUdFX0JJTkRJTkcsXHJcbiAgICB9KTtcclxuICAgIGRldmljZS5xdWV1ZS53cml0ZVRleHR1cmUoXHJcbiAgICAgIHtcclxuICAgICAgICB0ZXh0dXJlOiBpbWFnZVRleHR1cmUsXHJcbiAgICAgIH0sXHJcbiAgICAgIGltYWdlQml0bWFwLFxyXG4gICAgICB7IGJ5dGVzUGVyUm93OiB3aWR0aCAqIDQgfSxcclxuICAgICAgeyB3aWR0aCwgaGVpZ2h0IH1cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaW1hZ2VUZXh0dXJlO1xyXG59XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIiLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4iLCIiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=