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
        if (this.sente.length > 0 && serverState.players[this.sente]) {
            for (const id of this.sente) {
                io.to(id).emit(type, { ...data, roomteban: 'sente' });
            }
        }
        if (this.gote && serverState.players[this.gote]) {
            for (const id of this.gote) {
                io.to(id).emit(type, { ...data, roomteban: 'gote' });
            }
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
            this.emitToRoom("endRoomGame", { win: win, text: text })
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
            return false;
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
                // 無効な手番の場合は false を返す
                return false;
        }

        // 現在のリストと移動先のリストが異なる場合のみ移動処理を行う
        if (currentList !== targetList) {
            // 現在のリストからプレイヤーを削除
            currentList.splice(currentIndex, 1);
            // 移動先のリストにプレイヤーを追加
            targetList.push(playerId);
        }

        // 部屋情報を更新し、クライアントに通知
        const senteNames = this.sente.map(id => serverState.players[id].name);
        const goteNames = this.gote.map(id => serverState.players[id].name);
        const spectatorsNames = this.spectators.map(id => serverState.players[id].name);
        this.emitToRoom("roomUpdate", { sente: senteNames, gote: goteNames, spectators: spectatorsNames });

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
        if (this.sente.length + this.gote.length + this.spectators.length >= 12) return '部屋が満員です';
        this.spectators.push(id);
        serverState.players[id].roomId = this.roomId;
        return "roomJoined"
    }

    chat(name, text) {
        this.emitToRoom("chatMessage", { name: name, text: text });
    }
}