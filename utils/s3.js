import AWS from 'aws-sdk';
import stream from 'stream';

const BACKET = process.env.BACKET || 'img.storage';

AWS.config.getCredentials((err) => {
  if (err) throw new Error('no Credentials');
});
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

export function upload(filename) {
  const pass = new stream.PassThrough();
  const params = { Bucket: BACKET, Key: `${filename}`, Body: pass };

  s3.upload(params, (error, data) => {
    console.error(error);
    console.info(data);
  });

  return pass;
}

