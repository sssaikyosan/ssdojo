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
        this.roomType = roomType; // 部屋の種類('rating', 'private')
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
        if (result && result.res) {
            this.emitToRoom("newMove", { ...data, servertime });
            let endGame = this.board.checkGameEnd(data);
            if (endGame.player !== 0) {
                this.gameFinished(endGame.player, endGame.text);
            }
        }
    }

    //部屋への通知
    emitToRoom(type, data) {
        for (const id of this.sente) {
            io.to(id).emit(type, { ...data, roomteban: 'sente' });
        }
        for (const id of this.gote) {
            io.to(id).emit(type, { ...data, roomteban: 'gote' });
        }
        for (const id of this.spectators) {
            io.to(id).emit(type, { ...data, roomteban: 'spectators' });
        }
    }

    gameFinished(win, text) {
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
                this.spectators.push(id);
            }
            for (const id of this.gote) {
                this.spectators.push(id);
            }
            this.sente = [];
            this.gote = [];

            const senteNames = this.sente.map(id => serverState.players[id].name);
            const goteNames = this.gote.map(id => serverState.players[id].name);
            const spectatorsNames = this.spectators.map(id => serverState.players[id].name);
            this.emitToRoom("endRoomGame", { sente: senteNames, gote: goteNames, spectators: spectatorsNames, roomId: this.roomId, win: win, text: text });
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

        currentList.splice(currentIndex, 1);
        if (this.sente.length === 0 && this.gameState === 'playing') {
            this.gameFinished(-1, "disconnected");
        }
        if (this.gote.length === 0 && this.gameState === 'playing') {
            this.gameFinished(1, "disconnected");
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

        this.roomUpdate();
    }

    readyToPlay() {
        for (const playerId of this.sente) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        for (const playerId of this.gote) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        if (this.sente.length > 0 && this.gote.length > 0) {

            const senteNames = this.sente.map(id => serverState.players[id].name);
            const goteNames = this.gote.map(id => serverState.players[id].name);
            const spectatorsNames = this.spectators.map(id => serverState.players[id].name);

            this.startGame();
            const data = {
                senteName: senteNames,
                senteCharacter: serverState.players[this.sente[0]].characterName,
                goteName: goteNames,
                goteCharacter: serverState.players[this.gote[0]].characterName,
                spectators: spectatorsNames,
                roomId: this.roomId,
                state: this.gameState
            };
            this.emitToRoom("startRoomGame", data);
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
        const senteNames = this.sente.map(id => serverState.players[id].name);
        const goteNames = this.gote.map(id => serverState.players[id].name);
        const spectatorsNames = this.spectators.map(id => serverState.players[id].name);
        this.emitToRoom("roomUpdate", { roomId: this.roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: this.gameState });
    }

    backToRoom() {
        const senteNames = this.sente.map(id => serverState.players[id].name);
        const goteNames = this.gote.map(id => serverState.players[id].name);
        const spectatorsNames = this.spectators.map(id => serverState.players[id].name);
        return { roomId: this.roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: this.gameState };
    }
}