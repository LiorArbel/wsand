export async function loadTexture(device: GPUDevice) {
  let imageTexture: GPUTexture;
  {
    const response = await fetch("/photo.png");
    const imageBitmap = await createImageBitmap(await response.blob());
    imageTexture = device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.STORAGE_BINDING,
    });
    device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: imageTexture },
      [imageBitmap.width, imageBitmap.height]
    );
    // device.queue.writeTexture(imageTexture, imageBitmap, {}, {height:imageBitmap.height, width: imageBitmap.width})
  }

  return imageTexture;
}

export function createTexture(device: GPUDevice, size: {width: number, height: number}) {
  let imageTexture: GPUTexture;
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
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT |
        GPUTextureUsage.STORAGE_BINDING,
    });
    device.queue.writeTexture(
      {
        texture: imageTexture,
      },
      imageBitmap,
      { bytesPerRow: width * 4 },
      { width, height }
    );
  }

  return imageTexture;
}
