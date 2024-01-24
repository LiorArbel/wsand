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