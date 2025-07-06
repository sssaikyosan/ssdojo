import 'dotenv/config';
import express from 'express';
import http from 'http';
import https from 'https'; // httpsモジュールをインポート
import { Server } from 'socket.io';
import axios from 'axios'; // HTTPリクエスト送信のため
import { Board } from './board.js'; // コピーしたBoardクラスをインポート
import { Player } from './player.js'
import { Room } from './room.js'
import fs from 'fs'; // fsモジュールをインポート
import path from 'path'; // pathモジュールをインポート
import { fileURLToPath } from 'url'; // fileURLToPathをインポート

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const gameServerState = new GameServerState();


const app = express();

// サーバーの作成 (開発環境と実行環境で切り替え)
let server;
if (process.env.NODE_ENV === 'development') {
    server = http.createServer(app);
    console.log('Game Server running in development mode (HTTP)');
} else {
    // 実行環境ではHTTPSを使用
    const options = {
        key: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/ssdojo.net/fullchain.pem')
    };
    server = https.createServer(options, app);
    console.log('Game Server running in production mode (HTTPS)');
}


const io = new Server(server);

const MATCHING_SERVER_ADDRESS = process.env.MATCHING_SERVER_ADDRESS || 'http://localhost:3000'; // マッチングサーバーのアドレス

// 起動時に自身のアドレスをマッチングサーバーに登録
const registerGameServer = async () => {
    // 環境変数に応じて登録するアドレスを切り替え
    const gameServerAddress = process.env.NODE_ENV === 'development' ?
        (process.env.GAME_SERVER_ADDRESS || 'http://localhost:5001') :
        (process.env.GAME_SERVER_ADDRESS || 'https://ssdojo.net:5001'); // 実行環境ではHTTPS
    try {
        await axios.post(`${MATCHING_SERVER_ADDRESS}/register_game_server`, { address: gameServerAddress });
        console.log(`Registered game server address ${gameServerAddress} with matching server`);
    } catch (error) {
        console.error('Failed to register game server:', error.message);
    }
};

// マッチングサーバーからの部屋作成指示を受け付けるエンドポイント
app.post('/create_room', express.json(), (req, res) => {
    const { roomId, players } = req.body; // マッチングサーバーから部屋IDとプレイヤー情報を受け取る想定
    if (roomId && players && Array.isArray(players)) {
        console.log(`Received request to create room: ${roomId} with players: ${JSON.stringify(players)}`);
        // 部屋を作成し、プレイヤーを参加させるロジックを実装
        const success = gameServerState.createRoom(roomId, players);
        if (success) {
            res.status(200).send('Room creation request received and processed');
        } else {
            res.status(400).send('Failed to create room');
        }
    } else {
        res.status(400).send('Invalid room creation request');
    }
});


// Socket.IO接続ハンドリング (クライアントからの接続などに使用)
io.on('connection', (socket) => {
    console.log('a client connected to game server');
    gameServerState.addPlayer(socket); // プレイヤーを状態管理に追加

    // クライアントが部屋に参加するイベント (マッチング成立後、クライアントがゲームサーバーに接続し、このイベントを送信する想定)
    socket.on('join_room', (roomId, player_id, name, characterName) => {
        console.log(`User ${player_id} (${socket.id}) attempting to join room ${roomId}`);
        const room = gameServerState.rooms[roomId];
        if (room) {
            const result = room.joinRoom(socket.id, player_id, name, characterName);
            if (result === 'roomJoined') {
                console.log(`User ${player_id} (${socket.id}) successfully joined room ${roomId}.`);
                // 部屋参加成功の通知はRoomクラス内で行われる
            } else {
                console.warn(`User ${player_id} (${socket.id}) failed to join room ${roomId}: ${result}`);
                io.to(socket.id).emit("joinRoomFailed", { reason: result });
            }
        } else {
            console.warn(`Room ${roomId} not found for user ${player_id} (${socket.id}).`);
            io.to(socket.id).emit("joinRoomFailed", { reason: 'room_not_found' });
        }
    });

    // クライアントからのゲーム操作イベント (例: 駒の移動)
    socket.on('movePiece', (data) => {
        console.log(`Game move received from ${socket.id} in room ${gameServerState.players[socket.id]?.roomId}:`, data);
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].handleMove(socket.id, data);
        } else {
            console.warn(`Move received from ${socket.id} but not in a valid room.`);
            io.to(socket.id).emit("moveFailed", { reason: 'not_in_room' });
        }

    });

    // クライアントからの準備完了イベント
    socket.on('ready_to_play', () => {
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].readyToPlay(socket.id);
        }
    });

    // クライアントからの準備解除イベント
    socket.on('cancel_ready', () => {
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].cancelReady(socket.id);
        }
    });

    // クライアントからの部屋に戻るイベント
    socket.on('back_to_room', () => {
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            const roomInfo = gameServerState.rooms[roomId].backToRoom(socket.id);
            io.to(socket.id).emit("backToRoomInfo", roomInfo); // 部屋情報をクライアントに返す
        }
    });

    // クライアントからのチャットイベント
    socket.on('chat_message', (text) => {
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].chat(socket.id, text);
        }
    });


    socket.on('disconnect', () => {
        console.log('client disconnected from game server');
        gameServerState.deletePlayer(socket.id); // プレイヤーを状態管理から削除
    });
});


const PORT = process.env.PORT || 5001; // ゲームサーバーのポート
server.listen(PORT, () => {
    console.log(`Game Server is running on port ${PORT}`);
    registerGameServer(); // サーバー起動後に登録処理を実行
});