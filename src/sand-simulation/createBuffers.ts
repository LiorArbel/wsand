import { getInitialData } from "./getInitialData";

export function createBuffers(device: GPUDevice, size: {width: number, height: number}){
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
    
      const initialData = getInitialData(size);
    
      const particleDataBuffer = device.createBuffer({
        size: size.height * size.width * Float32Array.BYTES_PER_ELEMENT * 4,
        usage:
          GPUBufferUsage.COPY_DST |
          GPUBufferUsage.COPY_SRC |
          GPUBufferUsage.STORAGE,
      });
      device.queue.writeBuffer(particleDataBuffer, 0, initialData);
    
      const domainOffsetBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });
    
      const mouseBuffer = device.createBuffer({
        size: Uint32Array.BYTES_PER_ELEMENT * 4, //(16),
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      return {mouseBuffer, domainOffsetBuffer, particleDataBuffer, sizeBuffer}
}
