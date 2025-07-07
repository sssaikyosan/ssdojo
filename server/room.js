// server/room.js
import { Board } from './board.js';
import { io, serverState } from './server.js';

export class Room {
    constructor(roomId, roomType) {
        this.roomId = roomId;
        this.sente = [];
        this.gote = [];
        this.spectators = []; // 観戦者を格納する配列
        this.board = new Board(); // ゲームの盤面
        this.gameState = 'waiting'; // ゲームの状態 ('waiting', 'playing', 'finished')
        this.roomType = roomType; // 部屋の種類('rating', 'private', kento)
        this.owner = null;
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
                dhis.spectators.push(id);
                break;
            default:
                break;
        }
    }

    startGame(time) {
        this.board.init(time, time);
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

    async gameFinished(win, text, playerId = null) {
        console.log('gameend', this);
        if (this.roomType === 'rating') {
            if (this.sente.length !== 1 || this.gote.length !== 1) {
                console.log('プレイ人数に不正');
                return
            }
            const data = await serverState.ratingProcess(win, this.sente[0], this.gote[0], text);
            this.emitToRoom("endGame", data);

            if (serverState.players[this.sente[0]]) {
                serverState.players[this.sente[0]].state = 'waiting';
            }
            if (serverState.players[this.gote[0]]) {
                serverState.players[this.gote[0]].state = 'waiting';
            }
            serverState.deleteRoom(this.roomId);
        } else {
            for (const id of this.sente) {
                if (!serverState.players[id]) continue;
                serverState.players[id].state = 'waiting';
                this.spectators.push(id);
            }
            for (const id of this.gote) {
                if (!serverState.players[id]) continue;
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
                targetList = this.sente;
                break;
            case 'gote':
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

    joinRoom(id) {
        if (this.sente.length + this.gote.length + this.spectators.length >= 12) return '部屋が満員です';
        this.spectators.push(id);
        return "roomJoined"
    }

    chat(name, text) {
        this.emitToRoom("chatMessage", { name: name, text: text });
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
        this.emitToRoom("roomUpdate", { roomId: this.roomId, sente: names.sente, gote: names.gote, spectators: names.spectators, state: this.gameState, readys: readys });
    }

    backToRoom() {
        const names = this.getPlayerNames();
        return { roomId: this.roomId, sente: names.sente, gote: names.gote, spectators: names.spectators, state: this.gameState };
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
        if (id !== owner) return false;
        if (roomtype === 'private' || roomtype === 'kento') {
            this.roomtype = this.roomtype;
            return true;
        } else {
            return false;
        }
    }
}