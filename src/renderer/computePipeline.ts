export function setupComputePipeline(device: GPUDevice, texture: GPUTexture) {
  const computePipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({
        code: `
          @group(0) @binding(0)
          var tex: texture_storage_2d<rgba8unorm, write>;
     
          @compute @workgroup_size(1) fn main(
            @builtin(global_invocation_id) id : vec3u
          )  {
            let size = textureDimensions(tex);
            let center = vec2f(size) / 2.0;
     
            // the pixel we're going to write to
            let pos = id.xy;
     
            // The distance from the center of the texture
            let dist = distance(vec2f(pos), center);
     
            // Compute stripes based on the distance
            let stripe = dist / 1.0 % 2.0;
            let red = vec4f(1, 0, 0, 1);
            let cyan = vec4f(0, 1, 1, 1);
            let color = select(red, cyan, stripe < 1.0);
     
            // Write the color to the texture
            textureStore(tex, pos, color);
          }
        `,
      }),
      entryPoint: "main",
    },
  });

  const computeBindGroup = device.createBindGroup({
    layout: computePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: texture.createView()},
    ],
  });

  const encodeCompute = (encoder: GPUCommandEncoder) => {
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, computeBindGroup);
    pass.dispatchWorkgroups(6,6);
    pass.end();
  }

  return encodeCompute;
}
