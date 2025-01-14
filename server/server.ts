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
const isProduction = process.env.NODE_ENV === "production";
const PORT = isProduction ? 443 : 3000;
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
    console.log(`HTTP Server is running on port 80`);
  });
} else {
  // vite を利用して配信
  const ViteExpress: typeof import("vite-express") = require("vite-express");
  ViteExpress.config({ viteConfigFile: "./vite.config.ts", mode: "development" });
  ViteExpress.bind(app, server);
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} (${isProduction ? "Production" : "Development"})`);
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
    console.log("A player connected:", socket.id);
    serverState.players[socket.id] = new Player(socket);

    // プレイヤーがマッチングを要求
    socket.on("requestMatch", (data) => {
      if (serverState.matchMakingPlayers.some(x => x.socket.id === socket.id)) return; // 早期リターン
      let player = serverState.players[socket.id];
      player.name = data.name;
      serverState.matchMakingPlayers.push(player);
      console.log(`Player name set: ${data.name}`);
    });

    // 駒の配置を転送
    socket.on("putPiece", (data) => {
      const time = process.hrtime();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newPut", { ...data, time: time });
    });

    // 駒の移動を転送
    socket.on("movePiece", (data) => {
      const time = process.hrtime();
      // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
      io.to(data.roomId).emit("newMove", { ...data, time: time });
    });

    // 切断時の処理
    socket.on("disconnect", () => {
      console.log("A player disconnected:", socket.id);
      delete serverState.players[socket.id];
      const index = serverState.matchMakingPlayers.findIndex(x => x.socket.id === socket.id);
      if (index != -1) {
        serverState.matchMakingPlayers.splice(index, 1);
      }
    });
  });
}

// 
// アプリケーションコード
// 

class ServerState {
  players: Record<string, Player> = {};
  /** マッチメイキング用の待機プレイヤーリスト */
  matchMakingPlayers: Player[] = [];
}

class Player {
  name = "";
  roomId = "";
  teban = 0;
  socket: Socket;

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

      let time = process.hrtime();

      // 両プレイヤーにマッチング完了を通知
      io.to(player1.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: 1,
        time: time,
        name: player2.name
      });
      io.to(player2.socket.id).emit("matchFound", {
        roomId: roomId,
        teban: -1,
        time: time,
        name: player1.name
      });

      console.log(`Matched players: (先手:${player1.name}) vs (後手:${player2.name})`);
    }
  }
}

function sendServerStatus() {
  const online = Object.keys(serverState.players).length;
  const matching = serverState.matchMakingPlayers.length;
  console.log("online:", online, "matching:", matching);
  io.emit("serverStatus", { online: online, matching: matching });
}
