import 'dotenv/config';

import express from 'express';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { ServerState } from './serverstate.js'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// SSL証明書の読み込みオプション
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/fullchain.pem')
};

const server = https.createServer(options, app);

const socketOptions = {
  cors: {
    origin: ['https://ssdojo.net', 'https://ssdojo.net:5000'], // 許可するオリジンを具体的に指定
    credentials: true
  }
};


const io = new Server(server, socketOptions);

ioSetup();

// HTTPSサーバーを起動
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`HTTPS Server is running on port ${PORT})`);
});

//切断による勝利通知
function disconnectWin(roomId, losePlayer) {
  if (serverState.rooms[roomId].sente === losePlayer) {
    emitToRoom("endGame", { winPlayer: -1, text: "disconnected" }, roomId);
  }
  if (serverState.rooms[roomId].gote === losePlayer) {
    emitToRoom("endGame", { winPlayer: 1, text: "disconnected" }, roomId);
  }
}



//部屋への通知
function emitToRoom(type, data, roomId) {
  if (serverState.rooms[roomId].sente && serverState.players[serverState.rooms[roomId].sente]) {
    io.to(serverState.players[serverState.rooms[roomId].sente].socket).emit(type, data);
  }
  if (serverState.rooms[roomId].gote && serverState.players[serverState.rooms[roomId].gote]) {
    io.to(serverState.players[serverState.rooms[roomId].gote].socket).emit(type, data);
  }
  for (const spectator in serverState.rooms[roomId].spectators) {
    io.to(serverState.players[spectator].socket).emit(type, data);
  }
}

function ioSetup() {
  io.on("connection", (socket) => {
    serverState.addPlayer(socket);

    // プレイヤーがマッチングを要求
    socket.on("requestMatch", (data) => {
      serverState.players[socket.id].requestMatch(data);
    });

    // 駒の移動を転送
    socket.on("movePiece", (data) => {
      const servertime = performance.now();
      let validPlayer = false;
      let result = null;
      if (serverState.rooms[data.roomId].sente === socket.id && data.teban === 1) validPlayer = true;
      if (serverState.rooms[data.roomId].gote === socket.id && data.teban === -1) validPlayer = true;
      if (validPlayer) result = serverState.rooms[data.roomId].board.movePieceLocal({ ...data, servertime });
      if (result.res) {
        serverState.rooms[data.roomId].kihu.push({ ...data, servertime });
        emitToRoom("newMove", { ...data, servertime });
        let gameEnd = serverState.rooms[data.roomId].board.checkGameEnd(data, result.capture);
        if (gameEnd.player !== 0) {
          emitToRoom("endGame", { winPlayer: gameEnd.player, text: gameEnd.text }, data.roomId);
          serverState.deleteRoom(data.roomId);
        }
      }
    });

    // 切断時の処理
    socket.on("disconnect", () => {
      if (this.players[socket.id].state === "playing") {
        disconnectWin(this.players[socket.id].roomId, socket.id);
      }
      serverState.deletePlayer(socket.id);
    });
  });
}






const serverState = new ServerState(io);

// 1秒ごとにマッチメイキングを実行
setInterval(() => {
  serverState.matchMaking();
  serverState.sendServerStatus();
}, 1000); // 1秒ごとに実行
