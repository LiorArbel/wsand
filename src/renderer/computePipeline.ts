export function setupComputePipeline(
  device: GPUDevice,
  texture: GPUTexture,
  size: { width: number; height: number }
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
        var<uniform> domain_offset: u32;

        const BOUNDS = -1;
        const AIR = 0;
        const SAND = 1;

        fn getIndex(pos: vec2<u32>) -> u32 {
            let h = size.y;
            let w = size.x;
          
            return (pos.y % h) * w + (pos.x % w);
        }

        fn getData(pos: vec2<u32>) -> vec4<f32> {
            if(pos.x >= size.x || pos.y >= size.y){
                return vec4(BOUNDS, 0, 0, 0);
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
            textureStore(out_image, pos, n.c00);
            if(n.c10.r != BOUNDS){
                textureStore(out_image, pos+vec2(1,0), n.c10);
            } else {
                textureStore(out_image, pos+vec2(1,0), vec4(1,0,0,1));
            }
            if(n.c01.r != BOUNDS){
                textureStore(out_image, pos+vec2(0,1), n.c01);
            } else {
                textureStore(out_image, pos+vec2(0,1), vec4(1,0,0,1));
            }
            if(n.c11.r != BOUNDS){
                textureStore(out_image, pos+vec2(1,1), n.c11);
            }
            // textureStore(out_image, pos, vec4(1,0,0,1));
            // textureStore(out_image, pos+vec2(1,0), vec4(0,1,0,1));
            // textureStore(out_image, pos+vec2(0,1), vec4(0,0,1,1));
            // textureStore(out_image, pos+vec2(1,1), vec4(1,1,0,1));
        }

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

        @compute @workgroup_size(1) fn main(
        @builtin(global_invocation_id) id : vec3u,
        @builtin(local_invocation_id) local_id : vec3u
        )  {
            let pos = id.xy*2 + vec2(0, domain_offset % 2);
            // let pos = id.xy;
            let local_pos = local_id.xy;
            let pos_index = getIndex(pos);

            // sharedBlock[local_pos.y * 2 + local_pos.x] = pos_index;

            var neigh = getNeighborhood(pos);
            drawNeighborhood(pos, neigh);
            if(neigh.c00.r == SAND && neigh.c01.r == AIR){
                var temp = neigh.c00;
                neigh.c00 = neigh.c01;
                neigh.c01 = temp;
            }

            if(neigh.c10.r == SAND && neigh.c11.r == AIR){
                var temp = neigh.c10;
                neigh.c10 = neigh.c11;
                neigh.c11 = temp;
            }

            writeNeighborhood(pos, neigh);
            // let pos2 = pos + vec2(1,0);
            // if(pos2.x < size.x && pos2.y < size.y){
            //     textureStore(out_image, pos2, vec4(1,0,0, 1));
            // }
            // textureStore(out_image, pos, vec4(in_data[pos_index], 1));
        }
        `,
      }),
      entryPoint: "main",
    },
  });

  const sizeBuffer = device.createBuffer({
    mappedAtCreation: true,
    size: 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
  });
  
  new Uint32Array(sizeBuffer.getMappedRange()).set([size.width, size.height]);
  sizeBuffer.unmap();
  
  const initialData = new Float32Array(size.height * size.width * 3);
  
  const data0Buffer = device.createBuffer({
    size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
  });


  const center = {
    x: Math.floor(size.width / 2),
    y: Math.floor(size.height / 2),
  };
  const radius = size.width / 2;

  for (let j = center.y - radius / 2; j < center.y + radius / 2; j++) {
    for (let i = center.x - radius / 2; i < center.x + radius / 2; i++) {
      const index = (i * size.width + j) * 4;
      initialData[index] = 1;
      initialData[index + 1] = 1;
      initialData[index + 2] = 1;
    }
  }

  console.log(initialData);
  (window as unknown as any).initialData = initialData;

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
    ],
  });

  let renders: number = 0;
  const encodeCompute = (encoder: GPUCommandEncoder) => {
    device.queue.writeBuffer(
      domainOffsetBuffer,
      0,
      new Uint32Array([renders % 4])
    );
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
