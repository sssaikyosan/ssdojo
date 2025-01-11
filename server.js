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

/**
 * マッチメイキング用の待機プレイヤーリスト\
 * Socketオブジェクトを格納
 * @type {import('socket.io').Socket[]}
 */
const waitingPlayers = [];

// 5秒ごとにマッチメイキングを実行
setInterval(() => {
  if (waitingPlayers.length >= 2) {

    // マッチング処理
    while (waitingPlayers.length >= 2) {
      const player1 = waitingPlayers.shift();
      const player2 = waitingPlayers.shift();

      const roomId = uuid();  // ルームIDを生成

      player1.join(roomId);  // ルームに参加
      player2.join(roomId);  // ルームに参加

      let time = process.hrtime();

      // 両プレイヤーにマッチング完了を通知
      io.to(player1.id).emit('matchFound', {
        roomId: roomId,
        teban: 1,
        time: time
      });
      io.to(player2.id).emit('matchFound', {
        roomId: roomId,
        teban: -1,
        time: time
      });

      console.log(`Matched players: ${player1.id} (先手) vs ${player2.id} (後手)`);
    }

    sendChangeCount();
  }
  console.log('waitingPlayers:', waitingPlayers.length);
}, 3000); // 3秒ごとに実行

io.on('connection', (socket) => {
  console.log('A player connected:', socket.id);

  // プレイヤーがマッチングを要求
  socket.on('requestMatch', () => {
    if (waitingPlayers.some(x => x.id === socket.id)) return; // 早期リターン
    waitingPlayers.push(socket);
    sendChangeCount();
  });

  // socket.on('resign', (data) => {
  //   const time = process.hrtime();
  //   console.log('resign',data);
  //   io.to(data.roomId).emit('resign', { ...data, time: time });
  // });

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
    const index = waitingPlayers.findIndex(x => x.id === socket.id);
    if (index != -1) {
      waitingPlayers.splice(index, 1);
      sendChangeCount();
    }
  });
});

//#region 関数
function sendChangeCount() {
  const count = waitingPlayers.length;
  io.emit('changeWaitingPlayers', { count });
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