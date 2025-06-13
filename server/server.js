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

const RATING_FILE = path.join(__dirname, 'ratings.json');


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


const io = new Server(server, socketOptions);
const serverState = new ServerState(io);


loadRatings(); // レーティングデータを読み込む
// HTTPSサーバーを起動
const PORT = 5000;
server.listen(PORT, () => {
  console.log(new Date(), `HTTPS Server is running on port ${PORT})`);
});

ioSetup();

//切断による勝利通知
function disconnectWin(roomId, losePlayer) {
  if (serverState.rooms[roomId].sente === losePlayer) {
    emitToRoom("endGame", { winPlayer: -1, text: "disconnected" }, roomId);
  }
  if (serverState.rooms[roomId].gote === losePlayer) {
    emitToRoom("endGame", { winPlayer: 1, text: "disconnected" }, roomId);
  }
}

function gameFinished(roomId, win, text) {
  const senteName = serverState.players[serverState.rooms[roomId].sente].name;
  const goteName = serverState.players[serverState.rooms[roomId].gote].name;
  if (win === 1) {
    console.log(new Date(), text, `win:`, senteName, '  lose:', goteName);
  } else if (win === -1) {
    console.log(new Date(), text, `win:`, goteName, '  lose:', senteName);
  }

  // レーティング計算と更新 (イロレーティング)
  const winPlayerId = win === 1 ? serverState.players[serverState.rooms[roomId].sente].userId : serverState.players[serverState.rooms[roomId].gote].userId;
  const losePlayerId = win === 1 ? serverState.players[serverState.rooms[roomId].gote].userId : serverState.players[serverState.rooms[roomId].sente].userId;

  if (winPlayerId !== undefined && losePlayerId !== undefined && serverState.ratings[winPlayerId] && serverState.ratings[losePlayerId]) {
    const winRating = serverState.ratings[winPlayerId].rating;
    const loseRating = serverState.ratings[losePlayerId].rating;

    // イロレーティング計算
    let winkFactor = 20;
    let losekFactor = 20;
    const winGames = serverState.ratings[winPlayerId].games;
    const loseGames = serverState.ratings[losePlayerId].games;
    if (winGames < 100) winkFactor = 20 + (2 * (100 - winGames) / 5);
    if (loseGames < 100) losekFactor = 20 + (2 * (100 - loseGames) / 5);

    const expectedWin = 1 / (1 + Math.pow(10, (loseRating - winRating) / 400));
    const expectedLose = 1 / (1 + Math.pow(10, (winRating - loseRating) / 400));

    const newWinRating = winRating + winkFactor * (1 - expectedWin);
    const newLoseRating = loseRating + losekFactor * (0 - expectedLose);

    serverState.ratings[winPlayerId].rating = Math.round(newWinRating);
    serverState.ratings[losePlayerId].rating = Math.round(newLoseRating);

    // 対局数をインクリメント
    if (!serverState.ratings[winPlayerId].games) serverState.ratings[winPlayerId].games = 0;
    if (!serverState.ratings[losePlayerId].games) serverState.ratings[losePlayerId].games = 0;
    serverState.ratings[winPlayerId].games++;
    serverState.ratings[losePlayerId].games++;

    saveRatings(); // レーティングを保存
    console.log(`レーティング更新: ${winPlayerId}: ${serverState.ratings[winPlayerId].rating} (${winRating}), ${losePlayerId}: ${serverState.ratings[losePlayerId].rating} (${loseRating})`);

    // クライアントに更新されたレーティングと対局数を通知
    io.to(serverState.players[serverState.rooms[roomId].sente].socket.id).emit('receiveRating', { userId: winPlayerId, rating: serverState.ratings[winPlayerId].rating, games: serverState.ratings[winPlayerId].games });
    io.to(serverState.players[serverState.rooms[roomId].gote].socket.id).emit('receiveRating', { userId: losePlayerId, rating: serverState.ratings[losePlayerId].rating, games: serverState.ratings[losePlayerId].games });

  } else {
    console.error(`レーティング情報が見つかりませんでした。Win Player ID: ${winPlayerId}, Lose Player ID: ${losePlayerId}`);
  }

  emitToRoom("endGame", { winPlayer: win, text: text }, roomId);
  serverState.deleteRoom(roomId);
}


//部屋への通知
function emitToRoom(type, data, roomId) {
  if (serverState.rooms[roomId].sente && serverState.players[serverState.rooms[roomId].sente]) {
    io.to(serverState.players[serverState.rooms[roomId].sente].socket.id).emit(type, data);
  }
  if (serverState.rooms[roomId].gote && serverState.players[serverState.rooms[roomId].gote]) {
    io.to(serverState.players[serverState.rooms[roomId].gote].socket.id).emit(type, data);
  }
  for (const spectator in serverState.rooms[roomId].spectators) {
    io.to(serverState.players[spectator].socket.id).emit(type, data);
  }
}

// レーティングデータをファイルから読み込む
function loadRatings() {
  try {
    const data = fs.readFileSync(RATING_FILE, 'utf8');
    serverState.ratings = JSON.parse(data);
    console.log('レーティングデータを読み込みました');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('レーティングファイルが見つかりませんでした。新しく作成します。');
      serverState.ratings = {};
      saveRatings(); // 新しいファイルを作成
    } else {
      console.error('レーティングデータの読み込み中にエラーが発生しました:', error);
    }
  }
}

console.log('Attempting to save ratings...');
// レーティングデータをファイルに保存する
function saveRatings() {
  try {
    fs.writeFileSync(RATING_FILE, JSON.stringify(serverState.ratings, null, 2), 'utf8');
    console.log('レーティングデータを保存しました');
  } catch (error) {
    console.error('レーティングデータの保存中にエラーが発生しました:', error);
  }
}


function ioSetup() {
  io.on("connection", (socket) => {
    serverState.addPlayer(socket);

    // ユーザーIDを受信

    socket.on('sendUserId', (data) => {
      serverState.players[socket.id].setUserId(data.userId);
      // レーティングが存在しない場合は初期値を設定
      if (data.userId && !serverState.ratings[data.userId]) {
        serverState.ratings[data.userId] = { rating: 1500, games: 0, lastLogin: new Date() }; // 初期レーティングを1500に設定し、対局数を0に
        saveRatings(); // 新しいユーザーのレーティングを保存
      }
      // クライアントにレーティングと対局数を返す
      socket.emit('receiveRating', { userId: data.userId, rating: serverState.ratings[data.userId].rating, games: serverState.ratings[data.userId].games });
    });

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
      if (result && result.res) {
        emitToRoom("newMove", { ...data, servertime }, data.roomId);
        let endGame = serverState.rooms[data.roomId].board.checkGameEnd(data);
        if (endGame.player !== 0) {
          gameFinished(data.roomId, endGame.player, endGame.text);
        }
      }
    });

    // 切断時の処理
    socket.on("disconnect", () => {
      if (serverState.players[socket.id] && serverState.players[socket.id].state === "playing") {
        disconnectWin(serverState.players[socket.id].roomId, socket.id);
      }
      serverState.deletePlayer(socket.id);
    });
  });
}


// 1秒ごとにマッチメイキングを実行
setInterval(() => {
  serverState.matchMaking();
  serverState.sendServerStatus();
}, 1000); // 1秒ごとに実行
