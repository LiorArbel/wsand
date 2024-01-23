import { getMouse } from "./mouse";
import hsvConversions from "../shaders/hsv.rgb.wgsl";

export function setupComputePipeline(
  device: GPUDevice,
  texture: GPUTexture,
  size: { width: number; height: number },
  canvas: HTMLCanvasElement
) {
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

        ${hsvConversions}

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

  const ratio = {x: canvas.width / size.width, y: canvas.height / size.height};
  const drawingRadius = 5;

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
    pass.setBindGroup(0, renders % 2 ? swap0Bindgroup : swap1Bindgroup);
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