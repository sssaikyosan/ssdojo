import 'dotenv/config';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ioSetup } from './iosetting.js';
import { ServerState } from './serverstate.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.post('/start-game', (req, res) => {
    console.log('Received start-game request:', req.body);
    // TODO: マッチングサーバーから受け取った情報を使ってゲームを開始するロジックを実装
    const { player1, player2 } = req.body;
    if (!player1 || !player2) {
        return res.status(400).send('Missing player information');
    }

    // 仮のゲーム開始処理
    console.log(`Starting game between ${player1.id} and ${player2.id}`);
    // serverState.startGame(player1, player2); // 実際のゲーム開始ロジックを呼び出す

    res.status(200).send('Game start request received');
});

const server = http.createServer(app);
const socketOptions = {
    cors: {
        origin: ['https://ssdojo.net', 'http://localhost:5000'], // 許可するオリジンを具体的に指定
        credentials: true
    }
};

export const io = new Server(server, socketOptions);
export const serverState = new ServerState(io);

// HTTPSサーバーを起動
const PORT = 5001;
server.listen(PORT, () => {
    console.log(new Date(), `HTTPS Server is running on port ${PORT})`);
});

ioSetup();
