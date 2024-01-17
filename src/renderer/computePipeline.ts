export function setupComputePipeline(
  device: GPUDevice,
  texture: GPUTexture,
  size: { width: number; height: number },
  initialData: Float32Array
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
      }
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
              type: "read-only-storage",
            },
          },
    ]
  })

  const computePipeline = device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [swappingDataBindgroupLayout, sizeImageBindgroupLayout],
    }),
    compute: {
      module: device.createShaderModule({
        code: `
        @group(0) @binding(0)
        var<storage, read> in_data: array<vec3<f32>>;
        @group(0) @binding(1) 
        var<storage, read_write> out_data: array<vec3<f32>>;
        @group(1) @binding(0)
        var out_image: texture_storage_2d<rgba8unorm, write>;
        @group(1) @binding(1)
        var<storage> size: vec2<u32>;

        fn getIndex(x: u32, y: u32) -> u32 {
            let h = size.y;
            let w = size.x;
          
            return (y % h) * w + (x % w);
        }

        fn getCell(cell: vec2<u32>) -> vec3<f32> {
            return in_data[getIndex(cell.x, cell.y)];
        }
     
        @compute @workgroup_size(1) fn main(
        @builtin(global_invocation_id) id : vec3u
        )  {
            let center = vec2f(size) / 2.0;
            
            let pos = id.xy;
            let data_index = getIndex(pos.x, pos.y);

            let color = in_data[data_index];
            out_data[data_index] = color;
            textureStore(out_image, pos, vec4(color, 1));
        }
        `,
      }),
      entryPoint: "main",
    },
  });

  const sizeBuffer = device.createBuffer({
    mappedAtCreation: true,
    size: 2 * Uint32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
  });

  new Uint32Array(sizeBuffer.getMappedRange()).set([
    size.width,
    size.height,
  ]);
  sizeBuffer.unmap();

  const data0Buffer = device.createBuffer({
    size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 3,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
  });

  device.queue.writeBuffer(data0Buffer, 0, initialData);

  const data1Buffer = device.createBuffer({
    size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 3,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
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
      }
    ],
  });

  const swap1Bindgroup = device.createBindGroup({
    layout: swappingDataBindgroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: data0Buffer },
      },
      {
        binding: 1,
        resource: { buffer: data1Buffer },
      }
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
    ]
  });

  let renders:number = 0;
  const encodeCompute = (encoder: GPUCommandEncoder) => {
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, renders % 2 ? swap0Bindgroup : swap1Bindgroup);
    pass.setBindGroup(1, sizeImageBindGroup);
    pass.dispatchWorkgroups(texture.width, texture.height);
    pass.end();
    renders++;
  };

  return encodeCompute;
}
