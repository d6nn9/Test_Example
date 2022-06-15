import { Buffer } from 'buffer';
import { upload } from '../utils/s3.js';
import { reviewSizeImg, getSizePng } from '../utils/common.js';


const HEX = 16;
const LENGTH_HEX_STRING = 8;
const BAIT_4 = 4;
const BAIT_16 = 16;
const BAIT_24 = 24;
const EMPTY_BAIT = '0';


const CONFIG = {
  maxFileSize: process.env.MAX_FILE_SIZE || 1048576,
  allowedMimeTypes: ['image/png'],
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

    if (contentLength > +CONFIG.maxFileSize) {
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

    req.on('readable', () => {
      const value = req.read();
      if (value) {
        const imgSize = getSizePng(value);
        const resolvedSize = reviewSizeImg(
          imgSize,
          CONFIG.allowedMaxSize,
          CONFIG.allowedMaxSize.large
        );

        const buf1 = Buffer.alloc(BAIT_16, value, 'hex');
        const buf2 = value.subarray(BAIT_24, value.length);
        resolvedSize.forEach((el, i) => {
          const buf = Buffer.alloc(BAIT_4);
          el = el.toString(HEX).padStart(LENGTH_HEX_STRING, EMPTY_BAIT);
          buf.write(el, (buf.length - el.length / 2), buf.length, 'hex');
          resolvedSize[i] = buf;
        });
        const [side1, side2] = resolvedSize;

        const chunkLength = buf1.length + side1.length +
          side2.length + buf2.length;
        const chunk = Buffer.concat([buf1, side1, side2, buf2],
          chunkLength);

        req.removeAllListeners('readable');
        req.push(chunk);
        req.pipe(upload(filename));
      }
    });

    req.on('data', (chunk) => {
      let dataLength = 0;
      dataLength += chunk.length;
      if (dataLength > CONFIG.maxFileSize) {
        req.end();
        res.statusCode = 413;
        res.end();
      }
    });

    req.on('end', () => {
      res.statusCode = 200;
      res.end();
    });

  }
};

