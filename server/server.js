import 'dotenv/config';

import express from 'express';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ioSetup } from './iosetting.js';
import { ServerState } from './serverstate.js'

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const RATING_FILE = path.join(__dirname, '../Data/ratings.json');

const app = express();


// SSL証明書の読み込みオプション
let server;
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
  // ルートパスへのリクエストにindex.htmlを送信
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
  server = http.createServer(app);
} else {
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/fullchain.pem')
  };
  server = https.createServer(options, app);
}

const socketOptions = {
  cors: {
    origin: ['https://ssdojo.net', 'http://localhost:5000'], // 許可するオリジンを具体的に指定
    credentials: true
  }
};


export const io = new Server(server, socketOptions);
export const serverState = new ServerState(io);

serverState.loadRatings(); // レーティングデータを読み込む
serverState.getTopPlayers();

// HTTPSサーバーを起動
const PORT = 5000;
server.listen(PORT, () => {
  console.log(new Date(), `HTTPS Server is running on port ${PORT})`);
});

ioSetup();

// 1秒ごとにマッチメイキングを実行
setInterval(() => {
  serverState.matchMaking();
  serverState.sendServerStatus();
}, 1000); // 1秒ごとに実行
