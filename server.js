require('dotenv').config();

const express = require('express');
const https = require('https');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid-random');

const app = express();

// 環境変数に応じて設定を切り替え
const isProduction = process.env.NODE_ENV === 'production';

/**@type {import('http').Server} */
let server;

if (isProduction) {
  // SSL証明書の読み込み
  const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/fullchain.pem')
  };
  server = https.createServer(options, app);

} else {
  server = http.createServer(app);
}

const io = new Server(server);

// 静的ファイルを配信
app.use(express.static(path.join(__dirname, 'public')));


class ServerState {
  players = {};
  /**@type {Player[]} マッチメイキング用の待機プレイヤーリスト*/
  matchMakingPlayers = [];
}

class Player {
  /**@type {string} プレイヤー名*/
  name = "";
  /**@type {string} ルームID*/
  roomId = "";
  /**@type {number} 先手:1 後手:-1*/
  teban = 0;

  /**@type {import('socket.io').Socket} */
  socket = null;

  /**@type {typeof socket} */
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

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);
  serverState.players[socket.id] = new Player(socket);

  // プレイヤーがマッチングを要求
  socket.on('requestMatch', (data) => {
    if (serverState.matchMakingPlayers.some(x => x.socket.id === socket.id)) return; // 早期リターン
    let player = serverState.players[socket.id];
    player.name = data.name;
    serverState.matchMakingPlayers.push(player);
    console.log(`Player name set: ${data.name}`);
  });

  // 駒の配置を転送
  socket.on('putPiece', (data) => {
    const time = process.hrtime();
    // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
    io.to(data.roomId).emit('newPut', { ...data, time: time });
  });

  // 駒の移動を転送
  socket.on('movePiece', (data) => {
    const time = process.hrtime();
    // 移動したプレイヤーと対戦相手に駒の移動と手数を通知
    io.to(data.roomId).emit('newMove', { ...data, time: time });
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    console.log('A player disconnected:', socket.id);
    delete serverState.players[socket.id];
    const index = serverState.matchMakingPlayers.findIndex(x => x.socket.id === socket.id);
    if (index != -1) {
      serverState.matchMakingPlayers.splice(index, 1);
    }
  });
});

function matchMaking() {
  if (serverState.matchMakingPlayers.length >= 2) {

    // マッチング処理
    while (serverState.matchMakingPlayers.length >= 2) {
      const player1 = serverState.matchMakingPlayers.shift();
      const player2 = serverState.matchMakingPlayers.shift();

      const roomId = uuid();  // ルームIDを生成

      player1.socket.join(roomId);  // ルームに参加
      player2.socket.join(roomId);  // ルームに参加

      let time = process.hrtime();

      // 両プレイヤーにマッチング完了を通知
      io.to(player1.socket.id).emit('matchFound', {
        roomId: roomId,
        teban: 1,
        time: time,
        name: player2.name
      });
      io.to(player2.socket.id).emit('matchFound', {
        roomId: roomId,
        teban: -1,
        time: time,
        name: player1.name
      });

      console.log(`Matched players: (先手:${player1.name}) vs (後手:${player2.name})`);
    }
  }
}

//#region 関数
function sendServerStatus() {
  const online = Object.keys(serverState.players).length;
  const matching = serverState.matchMakingPlayers.length;
  console.log('online:', online, 'matching:', matching);
  io.emit('serverStatus', { online: online, matching: matching });
}


// HTTPSサーバーを起動
const HTTPS_PORT = isProduction ? 443 : 3000;
server.listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server is running on port ${HTTPS_PORT} (${isProduction ? 'Production' : 'Development'})`);
});


//本番環境の場合はHTTPサーバーを起動
if (isProduction) {
  const httpServer = http.createServer((req, res) => {
    const host = req.headers.host;
    res.writeHead(301, { "Location": `https://${host}${req.url}` });
    res.end();
  });

  httpServer.listen(80, () => {
    console.log(`HTTP Server is running on port 80`);
  });
}