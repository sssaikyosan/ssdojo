// server/room.js
import { Board } from './board.js';
import { io, serverState } from './server.js';
import { MOVETIME } from '../public/const.js'; // MOVETIMEをインポート

export class Room {
    constructor(roomId, roomType, ownerId) { // ownerIdをコンストラクタに追加
        this.roomId = roomId;
        this.sente = [];
        this.gote = [];
        this.spectators = []; // 観戦者を格納する配列
        this.board = new Board(); // ゲームの盤面
        this.gameState = 'waiting'; // ゲームの状態 ('waiting', 'playing', 'finished')
        this.roomType = roomType; // 部屋の種類('rating', 'private', kento)
        this.ownerId = ownerId; // オーナーのsocket.idを保持
        this.maxplayers = 2; // 最大プレイヤー数のデフォルト値
        this.movetime = { // 持ち時間のデフォルト値
            sente: MOVETIME,
            gote: MOVETIME
        };
    }

    addPlayer(id, teban) {
        switch (teban) {
            case 'sente':
                this.sente.push(id);
                break;
            case 'gote':
                this.gote.push(id);
                break;
            case 'spectators':
                this.spectators.push(id);
                break;
            default:
                break;
        }
    }

    startGame(time) {
        this.board.init(this.movetime.sente, this.movetime.gote); // 持ち時間を設定して初期化
        this.gameState = 'playing';
    }

    handleMove(id, data) {
        console.log("handleMove");
        const servertime = performance.now();
        let validPlayer = false;
        let result = null;
        if (this.sente.includes(id) && data.teban === 1) validPlayer = true;
        if (this.gote.includes(id) && data.teban === -1) validPlayer = true;
        console.log("validPlayer");
        if (validPlayer) result = this.board.movePieceLocal({ ...data, servertime });
        console.log(result);
        if (result && result.res) {
            this.emitToRoom("newMove", { ...data, servertime });
            let endGame = this.board.checkGameEnd(data);
            if (endGame.player !== 0) {
                this.gameFinished(endGame.player, endGame.text);
            }
        } else {
            io.to(id).emit("moveFailed", {});
        }
    }

    //部屋への通知
    emitToRoom(type, data) {
        for (let i = 0; i < this.sente.length; i++) {
            io.to(this.sente[i]).emit(type, { ...data, roomteban: 'sente', idx: i });
        }
        for (let i = 0; i < this.gote.length; i++) {
            io.to(this.gote[i]).emit(type, { ...data, roomteban: 'gote', idx: i });
        }
        for (let i = 0; i < this.spectators.length; i++) {
            io.to(this.spectators[i]).emit(type, { ...data, roomteban: 'spectators', idx: i });
        }
    }

    gameFinished(win, text, playerId = null) {
        console.log('gameend', this);
        if (this.roomType === 'rating') {
            if (this.sente.length !== 1 || this.gote.length !== 1) {
                console.log('プレイ人数に不正');
                return
            }
            const data = serverState.ratingProcess(win, this.sente[0], this.gote[0], text);
            this.emitToRoom("endGame", data);

            serverState.players[this.sente[0]].state = 'waiting';
            serverState.players[this.gote[0]].state = 'waiting';
            serverState.deleteRoom(this.roomId);
        } else {
            for (const id of this.sente) {
                if (id === playerId) continue;
                serverState.players[id].state = 'waiting';
                this.spectators.push(id);
            }
            for (const id of this.gote) {
                if (id === playerId) continue;
                serverState.players[id].state = 'waiting';
                this.spectators.push(id);
            }
            this.sente = [];
            this.gote = [];

            const names = this.getPlayerNames();
            this.emitToRoom("endRoomGame", { sente: names.sente, gote: names.gote, spectators: names.spectators, roomId: this.roomId, win: win, text: text });
            this.gameState = "waiting";
        }
    }

    leaveRoom(playerId) {
        let currentList = null;
        let currentIndex = -1;

        // プレイヤーがどのリストにいるかを探す
        currentIndex = this.sente.indexOf(playerId);
        if (currentIndex !== -1) {
            currentList = this.sente;
        } else {
            currentIndex = this.gote.indexOf(playerId);
            if (currentIndex !== -1) {
                currentList = this.gote;
            } else {
                currentIndex = this.spectators.indexOf(playerId);
                if (currentIndex !== -1) {
                    currentList = this.spectators;
                }
            }
        }

        // プレイヤーが見つからない場合は false を返す
        if (currentList === null) {
            return false;
        }


        if (currentList === this.sente && currentList.length === 1 && this.gameState === 'playing') {
            this.gameFinished(-1, "disconnected", playerId);
        } else if (currentList === this.gote && currentList.length === 1 && this.gameState === 'playing') {
            this.gameFinished(1, "disconnected", playerId);
        } else {
            currentList.splice(currentIndex, 1);
        }

        if (this.gameState === "waiting") {
            this.roomUpdate();
        }

        if (this.sente.length === 0 && this.gote.length === 0 && this.spectators.length === 0) {
            serverState.deleteRoom(this.roomId);
        }
    }

    moveTeban(playerId, data) {
        if (this.gameState !== 'waiting') return false;

        let currentList = null;
        let currentIndex = -1;

        // プレイヤーがどのリストにいるかを探す
        currentIndex = this.sente.indexOf(playerId);
        if (currentIndex !== -1) {
            currentList = this.sente;
        } else {
            currentIndex = this.gote.indexOf(playerId);
            if (currentIndex !== -1) {
                currentList = this.gote;
            } else {
                currentIndex = this.spectators.indexOf(playerId);
                if (currentIndex !== -1) {
                    currentList = this.spectators;
                }
            }
        }

        // プレイヤーが見つからない場合は false を返す
        if (currentList === null) {
            return;
        }

        const newTeban = data.teban;
        let targetList = null;

        // 移動先の手番に対応するリストを決定
        switch (newTeban) {
            case 'sente':
                // 最大プレイヤー数を超えていないかチェック
                if (this.sente.length >= this.maxplayers && this.maxplayers > 0) {
                    io.to(playerId).emit("moveTebanFailed", { reason: '部屋が満員です' });
                    return;
                }
                targetList = this.sente;
                break;
            case 'gote':
                // 最大プレイヤー数を超えていないかチェック
                if (this.gote.length >= this.maxplayers && this.maxplayers > 0) {
                    io.to(playerId).emit("moveTebanFailed", { reason: '部屋が満員です' });
                    return;
                }
                targetList = this.gote;
                break;
            case 'spectators':
                targetList = this.spectators;
                break;
            default:
                return;
        }
        currentList.splice(currentIndex, 1);
        targetList.push(playerId);
        this.cancelReady();
        this.roomUpdate();
    }

    readyToPlay() {
        this.roomUpdate();
        for (const playerId of this.sente) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        for (const playerId of this.gote) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        if (this.sente.length > 0 && this.gote.length > 0) {

            const names = this.getPlayerNames();
            const now = performance.now();

            this.startGame(now);
            const data = {
                senteName: names.sente,
                senteCharacter: serverState.players[this.sente[0]].characterName,
                goteName: names.gote,
                goteCharacter: serverState.players[this.gote[0]].characterName,
                spectators: names.spectators,
                roomId: this.roomId,
                servertime: now,
                state: this.gameState
            };
            this.emitToRoom("startRoomGame", data);
            for (const id of this.sente) {
                serverState.players[id].goToPlay(this.roomId);
            }
            for (const id of this.gote) {
                serverState.players[id].goToPlay(this.roomId);
            }
        }
    }

    joinRoom(id, player_id, name, characterName) { // player_id, name, characterNameを追加
        // 最大プレイヤー数を超えていないかチェック
        if (this.sente.length + this.gote.length >= this.maxplayers && this.maxplayers > 0) {
            return '部屋が満員です';
        }
        this.spectators.push(id);
        serverState.players[id].name = name; // プレイヤー名を保存
        serverState.players[id].characterName = characterName; // キャラクター名を保存
        serverState.players[id].roomId = this.roomId; // プレイヤーに部屋IDを設定
        this.roomUpdate(); // 部屋の状態を更新してブロードキャスト
        return "roomJoined"
    }

    chat(id, text) { // idを追加
        const playerName = serverState.players[id]?.name || 'Unknown'; // プレイヤー名を取得
        this.emitToRoom("chatMessage", { name: playerName, text: text });
    }

    roomUpdate() {
        const names = this.getPlayerNames();
        const readys = { sente: [], gote: [] }
        for (const id of this.sente) {
            readys.sente.push(serverState.players[id].state === 'ready');
        }

        for (const id of this.gote) {
            readys.gote.push(serverState.players[id].state === 'ready');
        }
        console.log("readys", readys);
        // 部屋設定情報も含めてブロードキャスト
        this.emitToRoom("roomUpdate", {
            roomId: this.roomId,
            sente: names.sente,
            gote: names.gote,
            spectators: names.spectators,
            state: this.gameState,
            readys: readys,
            isOwner: this.ownerId === this.sente[0] || this.ownerId === this.gote[0] || this.ownerId === this.spectators[0], // オーナー判定フラグを追加 (暫定)
            maxplayers: this.maxplayers, // 設定値をブロードキャスト
            movetime: this.movetime // 設定値をブロードキャスト
        });
    }

    // 部屋の状態をブロードキャストするメソッド
    broadcastRoomState() {
        this.roomUpdate(); // roomUpdateがブロードキャスト機能を持っているためこれを呼び出す
    }


    backToRoom(id) { // idを追加
        const names = this.getPlayerNames();
        // 部屋設定情報も含めて返す
        return {
            roomId: this.roomId,
            sente: names.sente,
            gote: names.gote,
            spectators: names.spectators,
            state: this.gameState,
            isOwner: this.ownerId === this.sente[0] || this.ownerId === this.gote[0] || this.ownerId === this.spectators[0], // オーナー判定フラグを追加 (暫定)
            maxplayers: this.maxplayers, // 設定値を返す
            movetime: this.movetime // 設定値を返す
        };
    }

    getPlayerNames() {
        const senteNames = [];
        const goteNames = [];
        const spectatorsNames = [];

        for (const id of this.sente) {
            if (!serverState.players[id]) {
                continue;
            }
            senteNames.push(serverState.players[id].name);
        }
        for (const id of this.gote) {
            if (!serverState.players[id]) {
                continue;
            }
            goteNames.push(serverState.players[id].name);
        }
        for (const id of this.spectators) {
            if (!serverState.players[id]) {
                continue;
            }
            spectatorsNames.push(serverState.players[id].name);
        }
        return { sente: senteNames, gote: goteNames, spectators: spectatorsNames };
    }

    cancelReady() {
        for (const id of this.sente) {
            serverState.players[id].cancelReady();
        }
        for (const id of this.gote) {
            serverState.players[id].cancelReady();
        }
    }

    changeMode(id, roomtype) {
        if (id !== this.ownerId) return false; // ownerをownerIdに修正
        if (roomtype === 'private' || roomtype === 'kento') {
            this.roomType = roomtype; // roomtypeをthis.roomTypeに修正
            return true;
        } else {
            return false;
        }
    }
}