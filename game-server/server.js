import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios'; // HTTPリクエスト送信のため
import { Board } from './board.js'; // コピーしたBoardクラスをインポート

// 既存のRoomクラスとPlayerクラスをゲームサーバー用に定義またはインポート
// 今回は簡易的にここに定義しますが、別途ファイルに分けるのが望ましいです。

class Player {
    userId = null;
    name = "";
    characterName = null;
    roomId = null;
    socket = null;
    state = ""; // 'waiting', 'playing', 'ready' など
    constructor(socket) {
        this.socket = socket;
    }

    // プレイヤーの状態を変更するメソッドなど、必要に応じて追加
    goToPlay(roomId) {
        this.state = "playing";
        this.roomId = roomId;
    }

    cancelReady() {
        if (this.state === 'ready') {
            this.state = "waiting";
        }
        // 部屋の状態更新はRoomクラスで行う
    }
}

class Room {
    constructor(roomId, roomType = 'rating') { // デフォルトをratingに設定
        this.roomId = roomId;
        this.sente = []; // プレイヤーのsocket.idを格納
        this.gote = []; // プレイヤーのsocket.idを格納
        this.spectators = []; // 観戦者のsocket.idを格納
        this.board = new Board(); // ゲームの盤面
        this.gameState = 'waiting'; // ゲームの状態 ('waiting', 'playing', 'finished')
        this.roomType = roomType; // 部屋の種類('rating', 'private', kento)
        // this.owner = null; // マッチングサーバーが部屋を作成するためownerは不要か？

        console.log(`Room ${this.roomId} created.`);
    }

    addPlayer(socketId, teban) {
        switch (teban) {
            case 'sente':
                if (!this.sente.includes(socketId)) this.sente.push(socketId);
                break;
            case 'gote':
                if (!this.gote.includes(socketId)) this.gote.push(socketId);
                break;
            case 'spectators':
                if (!this.spectators.includes(socketId)) this.spectators.push(socketId);
                break;
            default:
                console.warn(`Unknown teban: ${teban} for socket ${socketId}`);
                break;
        }
        console.log(`Player ${socketId} added to room ${this.roomId} as ${teban}.`);
        // プレイヤーのroomIdを設定
        if (gameServerState.players[socketId]) {
            gameServerState.players[socketId].roomId = this.roomId;
        }
        this.emitRoomUpdate(); // 部屋の状態をクライアントに通知
    }

    removePlayer(socketId) {
        let removed = false;
        // 各リストからプレイヤーを削除
        const remove = (list, id) => {
            const index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1);
                removed = true;
                return true;
            }
            return false;
        };

        if (remove(this.sente, socketId)) {
            console.log(`Player ${socketId} removed from sente in room ${this.roomId}.`);
        } else if (remove(this.gote, socketId)) {
            console.log(`Player ${socketId} removed from gote in room ${this.roomId}.`);
        } else if (remove(this.spectators, socketId)) {
            console.log(`Player ${socketId} removed from spectators in room ${this.roomId}.`);
        }

        // プレイヤーのroomIdをクリア
        if (gameServerState.players[socketId]) {
            gameServerState.players[socketId].roomId = null;
        }

        // 部屋に誰もいなくなったら部屋を削除
        if (this.sente.length === 0 && this.gote.length === 0 && this.spectators.length === 0) {
            console.log(`Room ${this.roomId} is empty, deleting.`);
            gameServerState.deleteRoom(this.roomId);
        } else {
            this.emitRoomUpdate(); // 部屋の状態をクライアントに通知
        }

        return removed;
    }

    startGame(time) {
        if (this.gameState !== 'waiting') {
            console.warn(`Attempted to start game in room ${this.roomId} but state is ${this.gameState}`);
            return false;
        }
        if (this.sente.length === 0 || this.gote.length === 0) {
            console.warn(`Attempted to start game in room ${this.roomId} but not enough players.`);
            return false;
        }

        this.board.init(time, time); // 盤面初期化
        this.gameState = 'playing';
        console.log(`Game started in room ${this.roomId}.`);

        // プレイヤーの状態をplayingに変更
        this.sente.forEach(id => { if (gameServerState.players[id]) gameServerState.players[id].goToPlay(this.roomId); });
        this.gote.forEach(id => { if (gameServerState.players[id]) gameServerState.players[id].goToPlay(this.roomId); });

        // クライアントにゲーム開始を通知
        this.emitToRoom("startRoomGame", {
            roomId: this.roomId,
            servertime: time,
            state: this.gameState,
            // プレイヤー名やキャラクター名などの情報は、クライアント側で管理するか、
            // マッチングサーバーから受け取る必要があります。
            // ここでは簡易的に含めません。
        });
        return true;
    }

    handleMove(socketId, data) {
        if (this.gameState !== 'playing') {
            console.warn(`Move received in room ${this.roomId} but game is not playing.`);
            return;
        }

        const servertime = performance.now();
        let validPlayer = false;
        // 手番とプレイヤーが一致するか確認
        if (this.sente.includes(socketId) && data.teban === 1) validPlayer = true;
        if (this.gote.includes(socketId) && data.teban === -1) validPlayer = true;

        if (validPlayer) {
            const result = this.board.movePieceLocal({ ...data, servertime });
            if (result && result.res) {
                // 有効な手の場合、部屋全体に通知
                this.emitToRoom("newMove", { ...data, servertime });

                // ゲーム終了判定
                let endGame = this.board.checkGameEnd(data);
                if (endGame.player !== 0) {
                    this.gameFinished(endGame.player, endGame.text);
                }
            } else {
                // 無効な手の場合、そのプレイヤーに通知
                io.to(socketId).emit("moveFailed", {});
                console.log(`Move failed for player ${socketId} in room ${this.roomId}.`);
            }
        } else {
            console.warn(`Invalid move received from player ${socketId} in room ${this.roomId}.`);
            io.to(socketId).emit("moveFailed", {}); // 不正なプレイヤーからの手も無効として通知
        }
    }

    gameFinished(win, text) {
        if (this.gameState === 'finished') {
            console.warn(`Game in room ${this.roomId} already finished.`);
            return;
        }
        this.gameState = 'finished';
        console.log(`Game finished in room ${this.roomId}. Winner: ${win}, Reason: ${text}`);

        // TODO: レーティング処理や結果の保存はマッチングサーバーに通知して行わせる

        // クライアントにゲーム終了を通知
        this.emitToRoom("endGame", { winPlayer: win, text: text });

        // プレイヤーの状態をwaitingに戻すなど
        this.sente.forEach(id => { if (gameServerState.players[id]) gameServerState.players[id].state = 'waiting'; });
        this.gote.forEach(id => { if (gameServerState.players[id]) gameServerState.players[id].state = 'waiting'; });
        this.spectators.forEach(id => { if (gameServerState.players[id]) gameServerState.players[id].state = 'waiting'; }); // 観戦者もwaitingに？

        // 部屋を一定時間後に削除するなど
        // 現状はプレイヤーがいなくなったら削除される
    }

    // 部屋の情報をクライアントに通知
    emitRoomUpdate() {
        const roomInfo = {
            roomId: this.roomId,
            sente: this.sente.map(id => gameServerState.players[id]?.name || id), // プレイヤー名を取得 (仮)
            gote: this.gote.map(id => gameServerState.players[id]?.name || id),
            spectators: this.spectators.map(id => gameServerState.players[id]?.name || id),
            state: this.gameState,
            // readys: ... // 準備状態なども必要に応じて追加
        };
        this.emitToRoom("roomUpdate", roomInfo);
        console.log(`Sent room update for room ${this.roomId}`);
    }

    // 部屋の全員にSocket.IOイベントを送信
    emitToRoom(type, data) {
        const allParticipants = [...this.sente, ...this.gote, ...this.spectators];
        allParticipants.forEach(socketId => {
            if (gameServerState.players[socketId]?.socket) {
                // 各プレイヤーの手番情報などを付加する必要がある場合はここで処理
                let roomteban = 'spectators';
                if (this.sente.includes(socketId)) roomteban = 'sente';
                else if (this.gote.includes(socketId)) roomteban = 'gote';

                gameServerState.players[socketId].socket.emit(type, { ...data, roomteban: roomteban });
            }
        });
    }

    // プレイヤーが部屋に参加する (Socket.IO接続後、部屋IDを指定して参加する場合)
    joinRoom(socketId, userId, name, characterName) {
        if (this.sente.includes(socketId) || this.gote.includes(socketId) || this.spectators.includes(socketId)) {
            console.log(`Player ${socketId} is already in room ${this.roomId}.`);
            return 'already_in_room';
        }

        // プレイヤー情報を更新
        if (gameServerState.players[socketId]) {
            gameServerState.players[socketId].userId = userId;
            gameServerState.players[socketId].name = name;
            gameServerState.players[socketId].characterName = characterName;
        } else {
            console.warn(`Player object not found for socket ${socketId}`);
            // ここで新しいPlayerオブジェクトを作成する必要があるかもしれません
        }


        // 観戦者として追加 (手番はマッチングサーバーから指示される想定)
        this.addPlayer(socketId, 'spectators'); // 仮で観戦者として追加
        console.log(`Player ${socketId} joined room ${this.roomId} as spectator.`);

        // クライアントに部屋参加成功を通知
        io.to(socketId).emit("roomJoined", { roomId: this.roomId });

        this.emitRoomUpdate(); // 部屋の状態をクライアントに通知
        return 'roomJoined';
    }

    // 部屋から退出する (クライアントからの要求または切断時)
    leaveRoom(socketId) {
        return this.removePlayer(socketId);
    }

    // 手番変更 (部屋主が手番を入れ替える場合など)
    moveTeban(socketId, data) {
        // TODO: 手番変更ロジックを実装 (Roomクラスの既存コードを参考に)
        console.log(`Move teban request from ${socketId} in room ${this.roomId} with data:`, data);
        // 変更後、emitRoomUpdate() を呼び出す
    }

    // 準備完了
    readyToPlay(socketId) {
        // TODO: 準備完了ロジックを実装 (Roomクラスの既存コードを参考に)
        console.log(`Ready to play request from ${socketId} in room ${this.roomId}`);
        if (gameServerState.players[socketId]) {
            gameServerState.players[socketId].state = 'ready';
        }
        // 全員準備完了したら startGame を呼び出す
        // 変更後、emitRoomUpdate() を呼び出す
    }

    // 準備解除
    cancelReady(socketId) {
        // TODO: 準備解除ロジックを実装 (Roomクラスの既存コードを参考に)
        console.log(`Cancel ready request from ${socketId} in room ${this.roomId}`);
        if (gameServerState.players[socketId]) {
            gameServerState.players[socketId].state = 'waiting';
        }
        // 変更後、emitRoomUpdate() を呼び出す
    }

    // 部屋に戻る (ゲーム終了後など)
    backToRoom(socketId) {
        // TODO: 部屋に戻るロジックを実装 (Roomクラスの既存コードを参考に)
        console.log(`Back to room request from ${socketId} in room ${this.roomId}`);
        // 部屋の状態を返すなど
        return { roomId: this.roomId, state: this.gameState }; // 仮
    }

    // チャットメッセージ
    chat(socketId, text) {
        // TODO: チャットロジックを実装 (Roomクラスの既存コードを参考に)
        console.log(`Chat message from ${socketId} in room ${this.roomId}: ${text}`);
        const playerName = gameServerState.players[socketId]?.name || socketId;
        this.emitToRoom("chatMessage", { name: playerName, text: text });
    }
}


// ゲームサーバーの状態を管理するクラス (簡易版)
class GameServerState {
    rooms = {}; // 部屋を管理
    players = {}; // 接続しているプレイヤーを管理 (socket.id -> Playerインスタンス)

    addPlayer(socket) {
        if (!socket.id) return false;
        this.players[socket.id] = new Player(socket);
        console.log(`Player ${socket.id} connected to game server.`);
        return true;
    }

    deletePlayer(socketId) {
        if (!this.players[socketId]) return false;
        // 部屋からプレイヤーを削除
        if (this.players[socketId].roomId && this.rooms[this.players[socketId].roomId]) {
            this.rooms[this.players[socketId].roomId].removePlayer(socketId);
        }
        delete this.players[socketId];
        console.log(`Player ${socketId} disconnected from game server.`);
        return true;
    }

    createRoom(roomId, players) {
        if (this.rooms[roomId]) {
            console.warn(`Attempted to create existing room: ${roomId}`);
            return false; // 既に部屋が存在する場合は作成しない
        }
        const newRoom = new Room(roomId, 'rating'); // マッチングからの部屋はratingとする
        this.rooms[roomId] = newRoom;

        // マッチングサーバーから受け取ったプレイヤーを部屋に追加 (手番はマッチングサーバーが決める想定)
        // ここでは仮に最初のプレイヤーをsente、次をgoteとする
        if (players && players.length >= 2) {
            // マッチングサーバーから渡されるplayersはuserIdのリストを想定
            // ここではsocketIdが必要なので、別途マッピングが必要になるか、
            // マッチングサーバーがsocketIdを渡す必要があります。
            // 一旦、ここではplayersがsocketIdのリストとして渡されると仮定します。
            newRoom.addPlayer(players[0], 'sente');
            newRoom.addPlayer(players[1], 'gote');

            // ゲーム開始
            newRoom.startGame(performance.now());

        } else {
            console.warn(`Room ${roomId} created without enough players.`);
        }

        return true;
    }

    deleteRoom(roomId) {
        if (!this.rooms[roomId]) return false;
        // 部屋にいるプレイヤーのroomIdをクリア
        this.rooms[roomId].sente.forEach(id => { if (this.players[id]) this.players[id].roomId = null; });
        this.rooms[roomId].gote.forEach(id => { if (this.players[id]) this.players[id].roomId = null; });
        this.rooms[roomId].spectators.forEach(id => { if (this.players[id]) this.players[id].roomId = null; });

        delete this.rooms[roomId];
        console.log(`Room ${roomId} deleted.`);
        return true;
    }
}

const gameServerState = new GameServerState();


const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MATCHING_SERVER_ADDRESS = process.env.MATCHING_SERVER_ADDRESS || 'http://localhost:3000'; // マッチングサーバーのアドレス

// 起動時に自身のアドレスをマッチングサーバーに登録
const registerGameServer = async () => {
    const gameServerAddress = process.env.GAME_SERVER_ADDRESS || 'http://localhost:5001'; // このゲームサーバーのアドレス
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
    socket.on('join_room', (roomId, userId, name, characterName) => {
        console.log(`User ${userId} (${socket.id}) attempting to join room ${roomId}`);
        const room = gameServerState.rooms[roomId];
        if (room) {
            const result = room.joinRoom(socket.id, userId, name, characterName);
            if (result === 'roomJoined') {
                console.log(`User ${userId} (${socket.id}) successfully joined room ${roomId}.`);
                // 部屋参加成功の通知はRoomクラス内で行われる
            } else {
                console.warn(`User ${userId} (${socket.id}) failed to join room ${roomId}: ${result}`);
                io.to(socket.id).emit("joinRoomFailed", { reason: result });
            }
        } else {
            console.warn(`Room ${roomId} not found for user ${userId} (${socket.id}).`);
            io.to(socket.id).emit("joinRoomFailed", { reason: 'room_not_found' });
        }
    });

    // クライアントからのゲーム操作イベント (例: 駒の移動)
    socket.on('game_move', (data) => {
        console.log(`Game move received from ${socket.id} in room ${gameServerState.players[socket.id]?.roomId}:`, data);
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].handleMove(socket.id, data);
        } else {
            console.warn(`Move received from ${socket.id} but not in a valid room.`);
            io.to(socket.id).emit("moveFailed", { reason: 'not_in_room' });
        }
    });

    // クライアントからの手番変更イベント
    socket.on('move_teban', (data) => {
        const roomId = gameServerState.players[socket.id]?.roomId;
        if (roomId && gameServerState.rooms[roomId]) {
            gameServerState.rooms[roomId].moveTeban(socket.id, data);
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