import 'dotenv/config';

import express from 'express';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ioSetup } from './iosetting.js';
import { ServerState } from './serverstate.js'
import { Postgure } from './postgure.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const postgure = new Postgure();

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

app.get('/api/title-info', async (req, res) => {
  const playerId = req.query.playerId;

  console.log(playerId);

  if (!playerId || playerId === 'create') {
    // playerIdがない、または新規作成の場合は、ランキング情報のみを返す（新規プレイヤー情報も作成）
    try {
      const newPlayerId = generateUniqueId(); // 新しいIDを生成
      const initialData = {
        player_id: newPlayerId,
        total_games: 0,
        rating: 1500,
        lastLogin: new Date(),
        name: '名無しの棋士'
      };
      await postgure.savePlayerInfo(initialData);

      const topPlayers = await postgure.readTopPlayers();

      return res.json({
        player: { ...initialData, player_id: newPlayerId }, // 新規作成したプレイヤー情報を返す
        ranking: topPlayers
      });

    } catch (error) {
      console.error('Error creating new player or fetching top players:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // 既存プレイヤーIDがある場合は、プレイヤー情報とランキング情報の両方を返す
  try {
    let [playerInfo, topPlayers] = await Promise.all([
      postgure.readPlayerInfo(playerId),
      postgure.readTopPlayers()
    ]);

    if (!playerInfo) {
      const newPlayerId = generateUniqueId();
      playerInfo = {
        player_id: newPlayerId,
        total_games: 0,
        rating: 1500,
        lastLogin: new Date(),
        name: '名無しの棋士'
      };
      await postgure.savePlayerInfo(playerInfo);
    }

    res.json({
      player: {
        rating: playerInfo.rating,
        name: playerInfo.name,
        total_games: playerInfo.total_games,
        player_id: playerInfo.player_id
      },
      ranking: topPlayers
    });

  } catch (error) {
    console.error(`Error fetching title info for ${playerId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ユニークなIDを生成するヘルパー関数
function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


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
  server = http.createServer(app);
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
}, 3000);