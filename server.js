import 'dotenv/config';

import express from 'express';
import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import uuid from 'uuid-random';
import { fileURLToPath } from 'url';

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

function ioSetup() {
  io.on("connection", (socket) => {
    serverState.players[socket.id] = new Player(socket);

    // プレイヤーがマッチングを要求
    socket.on("requestMatch", (data) => {
      if (serverState.matchMakingPlayers.some(x => x.socket.id === socket.id)) return; // 早期リターン
      if (serverState.players[socket.id].opponent != null) return; // 早期リターン
      let player = serverState.players[socket.id];
      player.name = data.name;
      serverState.matchMakingPlayers.push(player);
    });

    // 駒の配置を転送
    socket.on("putPiece", (data) => {
      console.log('onputpiece', data);
      const servertime = performance.now();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newPut", { ...data, servertime });
    });

    // 駒の移動を転送
    socket.on("movePiece", (data) => {
      const servertime = performance.now();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newMove", { ...data, servertime });
    });

    socket.on("leaveRoom", (data) => {
      serverState.players[socket.id].opponent = null;
      socket.leave(data.roomId);
    });

    // 切断時の処理
    socket.on("disconnect", () => {

      const index = serverState.matchMakingPlayers.findIndex(x => x.socket.id === socket.id);
      if (index != -1) {
        serverState.matchMakingPlayers.splice(index, 1);
      }
      const opponent = serverState.players[socket.id];
      if (opponent.opponent != null) {
        opponent.opponent = null;
        opponent.socket.emit("opponentDisconnected");
        opponent.socket.leave(opponent.roomId);
      }
      delete serverState.players[socket.id];
    });
  });
}


class ServerState {
  players = {};
  matchMakingPlayers = [];
}



class Player {
  name = "";
  roomId = "";
  teban = 0;
  socket = null;
  opponent = null;
  constructor(socket) {
    this.socket = socket;
  }
}

const serverState = new ServerState();
// 1秒ごとにマッチメイキングを実行
setInterval(() => {
  matchMaking();
  sendServerStatus();
}, 1000); // 1秒ごとに実行

function matchMaking() {
  if (serverState.matchMakingPlayers.length >= 2) {

    // マッチング処理
    while (serverState.matchMakingPlayers.length >= 2) {
      const player1 = serverState.matchMakingPlayers.shift();
      const player2 = serverState.matchMakingPlayers.shift();

      const roomId = uuid();  // ルームIDを生成

      player1.socket.join(roomId);  // ルームに参加
      player2.socket.join(roomId);  // ルームに参加

      let time = performance.now();

      // 両プレイヤーにマッチング完了を通知
      io.to(player1.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: 1,
        servertime: time,
        name: player2.name
      });
      io.to(player2.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: -1,
        servertime: time,
        name: player1.name
      });

      console.log(`Matched players: (先手:${player1.name}) vs (後手:${player2.name})`);

      serverState.players[player1.socket.id].opponent = player2.socket;
      serverState.players[player2.socket.id].opponent = player1.socket;

    }
  }
}

//#region 関数
function sendServerStatus() {
  const online = Object.keys(serverState.players).length;
  const playing = Object.keys(serverState.players).filter(x => serverState.players[x].opponent != null).length;
  io.emit("serverStatus", { online: online, playing: playing });
}
