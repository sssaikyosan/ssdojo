import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';

import { RATING_FILE } from './server.js';



export class ServerState {
    timecount = 0;
    rooms = {};
    players = {};
    ratings = {};
    topPlayers = [];

    constructor(io) {
        this.io = io;
    }

    addPlayer(socket) {
        if (!socket.id) return false;
        this.players[socket.id] = new Player(socket);
        return true;
    }

    //プレイヤーの削除
    deletePlayer(id) {
        if (!this.players[id]) return false;
        if (this.players[id].roomId) {
            this.rooms[this.players[id].roomId].leaveRoom(id);
        }
        delete this.players[id];
        return true;
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

                this.rooms[roomId] = new Room(roomId, 'rating');
                this.rooms[roomId].addPlayer(player1, 'sente');
                this.rooms[roomId].addPlayer(player2, 'gote');

                const time = performance.now();
                this.rooms[roomId].startGame(time);

                // 両プレイヤーにマッチング完了を通知
                const rate1 = this.ratings[this.players[player1].userId];
                const rate2 = this.ratings[this.players[player2].userId];

                const player1rating = getDisplayRating(rate1.rating, rate1.games);
                const player2rating = getDisplayRating(rate2.rating, rate2.games);

                console.log("matched", this.players[player1].characterName);
                console.log("matched", this.players[player2].characterName);

                this.players[player1].goToPlay(roomId);
                this.io.to(this.players[player1].socket.id).emit("matchFound", {
                    roomId: roomId,
                    teban: 1,
                    servertime: time,
                    name: this.players[player2].name,
                    characterName: this.players[player2].characterName,
                    rating: player1rating,
                    opponentRating: player2rating
                });

                this.players[player2].goToPlay(roomId);
                this.io.to(this.players[player2].socket.id).emit("matchFound", {
                    roomId: roomId,
                    teban: -1,
                    servertime: time,
                    name: this.players[player1].name,
                    characterName: this.players[player1].characterName,
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
        const topPlayers = this.topPlayers;
        this.io.emit("serverStatus", { online: online, roomCount: roomCount, topPlayers: topPlayers });
        this.timecount++;
    }

    getTopPlayers() {
        const playersWithRating = [];

        // Object.entries を for...of で反復処理し、分割代入でキーと値を取得
        for (const [id, ratingData] of Object.entries(this.ratings)) {
            const playerrating = getDisplayRating(ratingData.rating, ratingData.games);
            playersWithRating.push({ name: ratingData.name, rating: playerrating });
        }

        // 評価値に基づいて降順にソート
        playersWithRating.sort((a, b) => b.rating - a.rating);

        // トップ10のプレイヤーを取得
        const top = playersWithRating.slice(0, 10);
        this.topPlayers = top;
        console.log(top);
        return top;
    }


    ratingProcess(win, sente, gote, text) {
        if (!this.players[sente] || !this.players[gote]) {
            console.log('プレイヤーが存在しません');
            return { winPlayer: win, text: text }
        }

        const winPlayerId = win === 1 ? this.players[sente].userId : this.players[gote].userId;
        const losePlayerId = win === 1 ? this.players[gote].userId : this.players[sente].userId;

        if (winPlayerId && losePlayerId && this.ratings[winPlayerId] && this.ratings[losePlayerId]) {
            const winEloRating = this.ratings[winPlayerId].rating;
            const loseEloRating = this.ratings[losePlayerId].rating;

            const winGames = this.ratings[winPlayerId].games;
            const loseGames = this.ratings[losePlayerId].games;

            const rateData = calRating(winEloRating, winGames, loseEloRating, loseGames);

            this.ratings[winPlayerId].rating = rateData.newWinRating;
            this.ratings[losePlayerId].rating = rateData.newLoseRating;

            this.ratings[winPlayerId]['name'] = win === 1 ? this.players[sente].name : this.players[gote].name;
            this.ratings[losePlayerId]['name'] = win === 1 ? this.players[gote].name : this.players[sente].name;

            console.log(`レーティング更新: ${winPlayerId}: ${this.ratings[winPlayerId].rating} (${winEloRating}), ${losePlayerId}: ${this.ratings[losePlayerId].rating} (${loseEloRating})`);

            this.ratings[winPlayerId].games++;
            this.ratings[losePlayerId].games++;

            this.saveRatings(); // レーティングを保存

            const data = {
                winPlayer: win,
                text: text,
                winRating: getDisplayRating(winEloRating, winGames),
                newWinRating: getDisplayRating(rateData.newWinRating, winGames + 1),
                winGames: this.ratings[winPlayerId].games,
                loseRating: getDisplayRating(loseEloRating, loseGames),
                newLoseRating: getDisplayRating(rateData.newLoseRating, loseGames + 1),
                loseGames: this.ratings[losePlayerId].games
            }
            return data;
        } else {
            console.error(`レーティング情報が見つかりませんでした。Win Player ID: ${winPlayerId}, Lose Player ID: ${losePlayerId}`);
            return { winPlayer: win, text: text };
        }
    }

    saveRatings() {
        try {
            fs.writeFileSync(RATING_FILE, JSON.stringify(this.ratings, null, 2), 'utf8');
            console.log('レーティングデータを保存しました');
        } catch (error) {
            console.error('レーティングデータの保存中にエラーが発生しました:', error);
        }
    }

    loadRatings() {
        try {
            const data = fs.readFileSync(RATING_FILE, 'utf8');
            this.ratings = JSON.parse(data);
            console.log('レーティングデータを読み込みました');
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('レーティングファイルが見つかりませんでした。新しく作成します。');
                this.ratings = {};
                this.saveRatings(); // 新しいファイルを作成
            } else {
                console.error('レーティングデータの読み込み中にエラーが発生しました:', error);
            }
        }
    }

    getUserRating(userId) {
        if (!this.ratings[userId]) return null;
        return getDisplayRating(this.ratings[userId].rating, this.ratings[userId].games)
    }

    getUserGames(userId) {
        if (!this.ratings[userId]) return null;
        return this.ratings[userId].games;
    }

    makeRating(userId) {
        if (this.ratings[userId]) return false;
        this.ratings[userId] = { rating: 1500, games: 0, lastLogin: new Date() };
        this.saveRatings();
        return true;
    }



    createRoom() {
        const roomId = generateRandomString();
        this.rooms[roomId] = new Room(roomId, 'private');
        return roomId;
    }

    joinRoom(id, roomId, name, characterName) {
        if (!this.rooms[roomId]) return '部屋が見つかりません';
        return this.players[id].joinRoom(roomId, name, characterName);
    }

    leaveRoom(playerId) {
        if (!this.players[playerId]) return
        this.players[playerId].leaveRoom();
    }

    moveTeban(id, data) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.rooms[this.players[id].roomId].moveTeban(id, data);
    }

    readyToPlay(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.players[id].readyToPlay();
        this.rooms[this.players[id].roomId].readyToPlay();
    }
}

