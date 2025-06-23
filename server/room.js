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

    deletePlayer(id) {
        for (const playerId in this.sente) {
            if (playerId === id) { }
        }
        for (const playerId in this.gote) {
            if (playerId === id) { }
        }
        for (const playerId in this.spectators) {
            if (playerId === id) { }
        }
    }

    startGame(time) {
        this.board.init(time, time);
        this.gameState = 'playing';
    }

    handleMove(id, data) {
        const servertime = performance.now();
        let validPlayer = false;
        let result = null;
        if (this.sente.includes(id) && data.teban === 1) validPlayer = true;
        if (this.gote.includes(id) && data.teban === -1) validPlayer = true;
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
        if (this.sente && serverState.players[this.sente]) {
            io.to(serverState.players[this.sente].socket.id).emit(type, { ...data, roomteban: 'sente' });
        }
        if (this.gote && serverState.players[this.gote]) {
            io.to(serverState.players[this.gote].socket.id).emit(type, { ...data, roomteban: 'gote' });
        }
        for (const spectator in this.spectators) {
            io.to(serverState.players[spectator].socket.id).emit(type, { ...data, roomteban: 'spectators' });
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
            this.emitToRoom("endRoomGame", { win: win, text: text })
        }
    }

    leaveRoom(playerId) {
        if (this.gameState === 'playing') {
            if (this.sente.includes(playerId) && this.sente.length === 1) {
                this.gameFinished(-1, "disconnected");
            } else if (this.gote.includes(playerId) && this.gote.length === 1) {
                this.gameFinished(1, "disconnected");
            } else {
                console.log("leavePlayer", playerId, "is not player");
            }
        }

        this.sente.filter(item => item !== playerId);
        this.gote.filter(item => item !== playerId);
        this.spectators.filter(item => item !== playerId);

        if (this.sente.length === 0 && this.gote.length === 0 && this.spectators.length === 0) {
            serverState.deleteRoom(this.roomId);
        }
    }

    moveTeban(playerId, data) {
        if (this.gameState !== 'waiting') return false;
        if (this.sente.include(playerId)) {
            this.sente.filter(item => item !== playerId);
        } else if (this.gote.include(playerId)) {
            this.gote.filter(item => item !== playerId);
        } else if (this.spectators.include(playerId)) {
            this.spectators.filter(item => item !== playerId);
        } else {
            return false;
        }

        switch (data.teban) {
            case 'sente':
                this.sente.push(playerId);
                break;
            case 'gote':
                this.gote.push(playerId);
                break;
            case 'specteators':
                this.spectators.push(playerId);
                break;
            default:
                return false;
        }
        return true;
    }

    readyToplay(id) {
        for (const playerId in this.sente) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        for (const playerId in this.gote) {
            if (serverState.players[playerId].state !== "ready") return;
        }
        if (this.sente.length > 0 && this.gote.length > 0) {

            const senteNames = [];
            const goteNames = [];
            const spectatorsNames = [];

            for (const playerId in this.sente) {
                senteNames.push(serverState.players[playerId].name);
            }
            for (const playerId in this.gote) {
                goteNames.push(serverState.players[playerId].name);
            }
            for (const playerId in this.spectators) {
                spectatorsNames.push(serverState.players[playerId].name);
            }

            this.startGame();
            const data = {
                sente: [],
                senteCharacter: serverState.players[this.sente[0]].characterName,
                gote: [],
                senteCharacter: serverState.players[this.gote[0]].characterName,
                spectators: []
            };
            this.emitToRoom("startGame", data);
        }
    }

    joinRoom(id) {
        if (this.sente.length + this.gote.length + this.spectators.length >= 32) return '部屋が満員です';
        this.spectators.push(id);
        serverState.players[id].roomId = this.roomId;
    }

    chat(name, text) {
        this.emitToRoom("chatMessage", { name: name, text: text });
    }
}