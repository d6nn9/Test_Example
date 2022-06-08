import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { resize } from './resize.img.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.post('/resize', resize);
app.listen(8000);
