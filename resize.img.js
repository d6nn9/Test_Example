import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const PATH = path.join(__dirname, 'temps');

const storageIsExist = fs.existsSync(PATH);
if (!storageIsExist) {
  fs.mkdirSync(PATH);
}

const CONFIG = {
  maxFileSize: 10485760,
  allowedMimeTypes: [
    'image/png',
  ],
  allowedExtensions: ['png'],
  allowedMaxSize: {
    large: [2048, 2048], medium: [1024, 1024], thumb: [300, 300]
  }
};

export const resize = (req, res) => {

  req.on('error', (err) => {
    console.error(err);
    res.statusCode = 400;
    res.end();
  });
  res.on('error', (err) => {
    console.error(err);
  });


  let filename;
  if ((filename = req.query.filename)) {
    const contentLength = req.header('content-length');
    const contentType = req.header('content-type');

    if (contentLength > CONFIG.maxFileSize) {
      res.statusCode = 413;
      res.end();
    }
    if (!CONFIG.allowedMimeTypes.includes(contentType)) {
      res.statusCode = 422;
      res.end();
    }
    const fileType = filename.split('.').pop();
    if (!CONFIG.allowedExtensions.includes(fileType)) {
      res.statusCode = 422;
      res.end();
    }


    const writableStream = fs.createWriteStream(path.join(PATH, filename));
    writableStream.on('error', (err) => console.error(err));

    req.on('readable', () => {
      const value = req.read();
      const imgSize = getSizePng(value);
      const resolvedSize = reviewSizeImg(imgSize, CONFIG.allowedMaxSize);
      const buf1 = Buffer.alloc(16, value, 'hex');

      const buf2 = Buffer.alloc(4);
      const numHex1 = resolvedSize[0].toString(16).padStart(8, '0');
      buf2.write(numHex1,
        (buf2.length - numHex1.length / 2),
        buf2.length, 'hex');
      Buffer.from(resolvedSize[0].toString(16), 'hex');

      const numHex2 = resolvedSize[1].toString(16).padStart(8, '0');
      const buf3 = Buffer.alloc(4);
      buf3.write(numHex2,
        (buf3.length - numHex2.length / 2),
        buf3.length, 'hex');

      const buf4 = value.subarray(24, value.length);
      const chunkLength = buf1.length + buf2.length + buf3.length + buf4.length;
      const chunk = Buffer.concat([buf1, buf2, buf3, buf4], chunkLength);

      writableStream.write(chunk);
      req.pipe(writableStream);
      req.removeAllListeners('readable');
    });


    let dataLength = 0;
    req.on('data', (chunk) => {
      dataLength += chunk.length;
      if (dataLength > CONFIG.maxFileSize) {
        writableStream.end();
        res.statusCode = 413;
        res.end();
      }
    });

    writableStream.on('finish', () => {
      console.log(dataLength);
      console.log(contentLength);
    });

  }
};

function getSizePng(chunk) {
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

function reviewSizeImg(size, allowedSize) {
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
  size = allowedSize.large[0];
  return reviewSizeImg(size, allowedSize);
}
