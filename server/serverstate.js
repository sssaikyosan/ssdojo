import { Player } from './player.js'
import uuid from 'uuid-random';
import { Board } from './board.js'
import { getDisplayRating } from './utils.js';

export class ServerState {
    timecount = 0;
    rooms = {};
    players = {};
    ratings = {};

    constructor(io) {
        this.io = io;
    }

    addPlayer(socket) {
        this.players[socket.id] = new Player(socket);
    }

    //プレイヤーの削除
    deletePlayer(id) {
        if (this.players[id].roomId) {
            if (this.rooms[this.players[id].roomId].sente === id) {
                this.deleteRoom(this.players[id].roomId);
            } else if (this.rooms[this.players[id].roomId].gote === id) {
                this.deleteRoom(this.players[id].roomId);
            } else {
                this.rooms[this.players[id].roomId].spectators.filter(char => char !== id);
            }
        }
        delete this.players[id];
    }

    matchMaking() {
        const matchMakingPlayers = [];
        for (const playerId in this.players) {
            if (this.players[playerId].state === "matching") {
                matchMakingPlayers.push(playerId);
            }
        }
        if (matchMakingPlayers.length >= 2) {

            // マッチング処理
            while (matchMakingPlayers.length >= 2) {
                const player1 = matchMakingPlayers.shift();
                const player2 = matchMakingPlayers.shift();

                const roomId = uuid();  // ルームIDを生成

                this.rooms[roomId] = { board: new Board(), sente: player1, gote: player2, spectators: [] };

                let time = performance.now();
                this.rooms[roomId].board.init(time, time);

                // 両プレイヤーにマッチング完了を通知
                const rate1 = this.ratings[this.players[player1].userId];
                const rate2 = this.ratings[this.players[player2].userId];

                const player1rating = getDisplayRating(rate1.rating, rate1.games);
                const player2rating = getDisplayRating(rate2.rating, rate2.games);

                this.players[player1].goToPlay(roomId);
                this.io.to(this.players[player1].socket.id).emit("matchFound", {
                    roomId: roomId,
                    teban: 1,
                    servertime: time,
                    name: this.players[player2].name,
                    rating: player1rating,
                    opponentRating: player2rating
                });

                this.players[player2].goToPlay(roomId);
                this.io.to(this.players[player2].socket.id).emit("matchFound", {
                    roomId: roomId,
                    teban: -1,
                    servertime: time,
                    name: this.players[player1].name,
                    rating: player2rating,
                    opponentRating: player1rating
                });

                console.log(new Date(), `Matched players: (先手:${this.players[player1].name}) vs (後手:${this.players[player2].name})`);
            }
        }
    }
    //部屋の削除
    deleteRoom(roomId) {
        if (this.rooms[roomId].sente && this.players[this.rooms[roomId].sente]) {
            this.players[this.rooms[roomId].sente].state = "";
            this.players[this.rooms[roomId].sente].roomId = null;
        }
        if (this.rooms[roomId].gote && this.players[this.rooms[roomId].gote]) {
            this.players[this.rooms[roomId].gote].state = "";
            this.players[this.rooms[roomId].gote].roomId = null;
        }
        for (let spectator in this.rooms[roomId].spectators) {
            this.players[spectator].roomId = null;
        }
        delete this.rooms[roomId];
    }

    sendServerStatus() {
        const online = Object.keys(this.players).length;
        const roomCount = Object.keys(this.rooms).length;
        this.io.emit("serverStatus", { online: online, roomCount: roomCount });
        this.timecount++;
    }
}

