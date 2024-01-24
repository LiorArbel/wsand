export function getInitialData(size: {width: number, height: number}) {
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

  return initialData;
}
