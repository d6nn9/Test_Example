import 'dotenv/config';
import express from 'express';
import path from 'path';
import { resize } from './controllers/resize.img.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(express.static(__dirname + '/public'));
app.post('/', resize);
app.listen(process.env.PORT || 7777);
