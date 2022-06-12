

export function getSizePng(chunk) {
  const meta = Buffer.alloc(24, chunk, 'hex');
  console.log(meta);
  let width = meta.subarray(16, 20).toString('hex');
  let height = meta.subarray(20, 24).toString('hex');
  width = parseInt(width, 16);
  height = parseInt(height, 16);
  if (typeof width === 'number' && typeof height === 'number') {
    console.log([width, height]);
    return [width, height];
  }
  return null;
}


export function reviewSizeImg(size, allowedSize, max) {
  const keys = Object.keys(allowedSize);
  const result = [];
  const lesserSide = Math.min(...size);
  const bigerSide = Math.max(...size);

  const indexL = size.indexOf(lesserSide);
  const indexB = size.indexOf(bigerSide);
  for (const key of keys) {
    if (size[indexL] <= allowedSize[key][0]) {
      result.push(allowedSize[key]);
    }
  }
  if (result[0]) {
    const resolvedSize = result.reduce((prev, cur) => {
      if (prev[0] > cur[0]) {
        return cur;
      }
    });
    resolvedSize[indexL] = size[indexL];
    resolvedSize[indexB] = size[indexB] >= resolvedSize[indexB] ?
      resolvedSize[indexB] :
      size[indexB];
    return resolvedSize;
  }
  size[indexL] = max[indexL];
  if (size[indexB] >= size[indexL]) size[indexB] = size[indexL];
  return size;
}
