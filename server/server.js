import 'dotenv/config';

import express from 'express';
import https from 'https';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ioSetup } from './iosetting.js';
import { ServerState } from './serverstate.js'

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.post('/roomdeleted', (req, res) => {
  console.log('Received roomdeleted request:', req.body);
  // TODO: ゲームサーバーから受け取ったゲーム結果を処理するロジックを実装
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).send('Missing game result information');
  }

  delete serverState.rooms[roomId];

  res.status(200).send('Game finished request received');
});



// SSL証明書の読み込みオプション
let server;
if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname, '..', 'public')));
  // ルートパスへのリクエストにindex.htmlを送信
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
  const options = {
    key: fs.readFileSync('./localhost-key.pem'),
    cert: fs.readFileSync('./localhost.pem')
  };
  server = https.createServer(options, app);
} else {
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/fullchain.pem')
  };
  server = https.createServer(options, app);
}

const socketOptions = {
  cors: {
    origin: ['https://ssdojo.net', 'https://localhost:5000'], // 許可するオリジンを具体的に指定
    credentials: true
  }
};


export const io = new Server(server, socketOptions);
export const serverState = new ServerState(io, JSON.parse(process.env.GAME_SERVERS));

// HTTPSサーバーを起動
const PORT = 5000;
server.listen(PORT, () => {
  console.log(new Date(), `HTTPS Server is running on port ${PORT})`);
});

ioSetup();

setInterval(() => {
  serverState.matchMakingProcess(); // マッチングプロセスを定期的に実行
  serverState.sendServerStatus();
}, 3000);