export class Texture {
    view: GPUTextureView;
  sampler: GPUSampler;
  texture: GPUTexture;

  constructor(
    device: GPUDevice,
    imageBits: Uint8Array,
    size: { width: number; height: number },
    samplerDescriptor:GPUSamplerDescriptor = {},
    viewDescriptor:GPUTextureViewDescriptor = {}
  ) {
    this.texture = device.createTexture({
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.STORAGE_BINDING,
      size,
    });
    
    device.queue.writeTexture(
        {
          texture: this.texture,
        },
        imageBits,
        { bytesPerRow: size.width * 4 },
        size
      );

    this.sampler = device.createSampler(samplerDescriptor)
    this.view = this.texture.createView(viewDescriptor);
  }
}
