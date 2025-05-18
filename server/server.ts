import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { Server, type Socket } from "socket.io";
import uuid from "uuid-random";

dotenv.config();

// 環境変数に応じて設定を切り替え
const isProduction = process.env.NODE_ENV !== "development";
const PORT = isProduction ? 443 : 5000;
const app = express();
const server = createServer();
const io = new Server(server);

ioSetup();


if (isProduction) {
  // 静的ファイルを配信
  app.use(express.static(path.join(__dirname, "public")));
  // HTTPサーバーを起動
  const httpServer = http.createServer((req, res) => {
    const host = req.headers.host;
    res.writeHead(301, { "Location": `https://${host}${req.url}` });
    res.end();
  });

  httpServer.listen(80, () => {
  });
} else {
  // vite を利用して配信
  const ViteExpress: typeof import("vite-express") = require("vite-express");
  ViteExpress.config({ viteConfigFile: "./vite.config.ts", mode: "development" });
  ViteExpress.bind(app, server);
}

server.listen(PORT, () => {
});


function createServer() {
  if (isProduction) {
    // SSL証明書の読み込み
    const options = {
      key: fs.readFileSync("/etc/letsencrypt/live/ssdojo.net/privkey.pem"),
      cert: fs.readFileSync("/etc/letsencrypt/live/ssdojo.net/fullchain.pem")
    };
    return https.createServer(options, app);
  } else {
    return http.createServer(app);
  }
}

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
      data.hrtime = process.hrtime();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newPut", { ...data });
    });

    // 駒の移動を転送
    socket.on("movePiece", (data) => {
      data.hrtime = process.hrtime();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newMove", { ...data });
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
      const opponent: Player = serverState.players[socket.id];
      if (opponent.opponent != null) {
        opponent.opponent = null;
        opponent.socket.emit("opponentDisconnected");
        opponent.socket.leave(opponent.roomId);
      }
      delete serverState.players[socket.id];
    });
  });
}

// 
// アプリケーションコード
// 

class ServerState {
  players: Record<string, Player> = {};
  matchMakingPlayers: Player[] = [];
}

class Player {
  name: string = "";
  roomId: string = "";
  socket: Socket;
  opponent: Socket | null = null;

  constructor(socket: Socket) {
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
      const player1 = serverState.matchMakingPlayers.shift()!;
      const player2 = serverState.matchMakingPlayers.shift()!;

      const roomId = uuid();  // ルームIDを生成

      player1.socket.join(roomId);  // ルームに参加
      player2.socket.join(roomId);  // ルームに参加

      let hrtime = process.hrtime();

      // 両プレイヤーにマッチング完了を通知
      io.to(player1.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: 1,
        hrtime: hrtime,
        name: player2.name
      });
      io.to(player2.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: -1,
        hrtime: hrtime,
        name: player1.name
      });

      serverState.players[player1.socket.id].opponent = player2.socket;
      serverState.players[player2.socket.id].opponent = player1.socket;

    }
  }
}

function sendServerStatus() {
  const online = Object.keys(serverState.players).length;
  const playing = Object.keys(serverState.players).filter(x => serverState.players[x].opponent != null).length;
  io.emit("serverStatus", { online: online, playing: playing });
}
