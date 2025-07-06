import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';

import { Postgure } from './postgure.js'; // Postgure クラスをインポート

export class ServerState {
    timecount = 0;
    rooms = {};
    players = {};
    // ratings = {}; // メモリ上のキャッシュは使用しない
    topPlayers = []; // トッププレイヤーリストはキャッシュとして保持する可能性あり、または取得時に都度利用
    postgureDb; // Postgure クラスのインスタンスを保持

    constructor(io) {
        this.io = io;
        this.postgureDb = new Postgure(); // Postgure のインスタンスを作成
    }

    // プレイヤーのレーティングデータをデータベースに保存（挿入または更新）(Postgure クラスに処理を委譲)
    async savePlayerInfo(data) { // メソッド名を変更
        console.log(`Saving player info for UserID: ${data.player_id} via Postgure...`);
        await this.postgureDb.savePlayerInfo(data);
    }

    async getPlayerInfo(player_id) { // 非同期にする
        const playerInfo = await this.postgureDb.readPlayerInfo(player_id);
        if (!playerInfo) {
            const player_id = uuid();
            const initialPlayerInfo = { player_id: player_id, rating: 1500, total_games: 0, lastLogin: new Date(), name: '' };
            console.log(`Create player info for UserID: ${player_id} via Postgure...`);
            await this.postgureDb.savePlayerInfo(initialPlayerInfo);
            return initialPlayerInfo;
        }
        return playerInfo;
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

    matchMakingProcess() {
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

                this.matchMake(player1, player2);


                console.log("matched", this.players[player1].characterName);
                console.log("matched", this.players[player2].characterName);


                console.log(new Date(), `Matched players: (先手:${this.players[player1].name}) vs (後手:${this.players[player2].name})`);
            }
        }
    }

    async matchMake(player1, player2) {
        const roomId = uuid();  // ルームIDを生成

        this.rooms[roomId] = new Room(roomId, 'rating');
        this.rooms[roomId].addPlayer(player1, 'sente');
        this.rooms[roomId].addPlayer(player2, 'gote');

        const player1Info = await this.postgureDb.readPlayerInfo(this.players[player1].player_id);
        const player2Info = await this.postgureDb.readPlayerInfo(this.players[player2].player_id);

        if (!player1Info) return false;
        if (!player2Info) return false;

        const player1rating = getDisplayRating(player1Info.rating, player1Info.total_games);
        const player2rating = getDisplayRating(player2Info.rating, player2Info.total_games);

        const time = performance.now();
        this.rooms[roomId].startGame(time);

        this.players[player1].goToPlay(roomId);
        this.io.to(this.players[player1].socket.id).emit("matchFound", {
            roomId: roomId,
            teban: 1,
            servertime: time,
            name: this.players[player2].name,
            characterName: this.players[player2].characterName,
            rating: player1rating, // レーティング情報は ratingProcess の結果を利用するか、ここで取得
            opponentRating: player2rating // レーティング情報は ratingProcess の結果を利用するか、ここで取得
        });

        this.players[player2].goToPlay(roomId);
        this.io.to(this.players[player2].socket.id).emit("matchFound", {
            roomId: roomId,
            teban: -1,
            servertime: time,
            name: this.players[player1].name,
            characterName: this.players[player1].characterName,
            rating: player2rating, // レーティング情報は ratingProcess の結果を利用するか、ここで取得
            opponentRating: player1rating // レーティング情報は ratingProcess の結果を利用するか、ここで取得
        });
        return true;
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

    async sendServerStatus() { // 非同期になる可能性が高い
        const online = Object.keys(this.players).length;
        const roomCount = Object.keys(this.rooms).length;
        const topPlayers = await this.postgureDb.readTopPlayers();
        console.log(topPlayers);
        this.io.emit("serverStatus", { online: online, roomCount: roomCount, topPlayers: topPlayers });
        this.timecount++;
    }


    async ratingProcess(win, sente, gote, text) {
        if (!this.players[sente] || !this.players[gote]) {
            console.log('プレイヤーが存在しません');
            return { winPlayer: win, text: text }
        }

        const winPlayerId = this.players[sente].player_id;
        const losePlayerId = this.players[gote].player_id;

        // レーティング情報をデータベースから取得 (Postgure 経由)
        const winRatingData = await this.postgureDb.readPlayerInfo(winPlayerId);
        const loseRatingData = await this.postgureDb.readPlayerInfo(losePlayerId);


        if (winPlayerId && losePlayerId && winRatingData && loseRatingData) {
            const winEloRating = winRatingData.rating;
            const loseEloRating = loseRatingData.rating;

            const winGames = winRatingData.total_games;
            const loseGames = loseRatingData.total_games;

            const rateData = calRating(winEloRating, winGames, loseEloRating, loseGames);

            // 新しいレーティングデータオブジェクトを作成
            const newWinRatingData = {
                player_id: winPlayerId,
                rating: rateData.newWinRating,
                total_games: winGames + 1,
                lastLogin: new Date(),
                name: this.players[sente].name
            };
            const newLoseRatingData = {
                player_id: losePlayerId,
                rating: rateData.newLoseRating,
                total_games: loseGames + 1,
                lastLogin: new Date(),
                name: this.players[gote].name
            };

            console.log(`レーティング更新: ${winPlayerId}: ${newWinRatingData.rating} (${winEloRating}), ${losePlayerId}: ${newLoseRatingData.rating} (${loseEloRating})`);

            // レーティングデータをデータベースに保存 (Postgure 経由)
            await this.savePlayerInfo(newWinRatingData);
            await this.savePlayerInfo(newLoseRatingData);

            const winRating = getDisplayRating(winEloRating, winGames);
            const newWinRating = getDisplayRating(rateData.newWinRating, winGames + 1);
            const loseRating = getDisplayRating(loseEloRating, loseGames);
            const newLoseRating = getDisplayRating(rateData.newLoseRating, loseGames + 1);

            // トッププレイヤーリストを取得
            let currentTopPlayers = await this.postgureDb.readTopPlayers();

            // 勝利プレイヤーの新しい表示レーティングがトップ30に入るか判定
            const minTopRating = currentTopPlayers.length < 30 ? -Infinity : getDisplayRating(currentTopPlayers[currentTopPlayers.length - 1].rating, currentTopPlayers[currentTopPlayers.length - 1].total_games);

            let replaceTop = false;

            if (newWinRating >= minTopRating) {
                replaceTop = true;
                console.log(`勝利プレイヤー ${newWinRatingData.name} (${newWinRating}) がトップ10圏内に入りました。`);
                // トッププレイヤーリストに勝利プレイヤーを追加（または更新）
                const existingIndex = currentTopPlayers.findIndex(p => p.player_id === newWinRatingData.player_id);
                if (existingIndex > -1) {
                    currentTopPlayers[existingIndex] = {
                        rank: 0, // 既存プレイヤーの場合は情報を更新
                        player_id: newWinRatingData.player_id,
                        total_games: newWinRatingData.total_games,
                        rating: newWinRatingData.rating,
                        last_login: newWinRatingData.lastLogin,
                        name: newWinRatingData.name
                    };
                } else { // 新規トッププレイヤーの場合は追加
                    currentTopPlayers.push({
                        rank: 0,
                        player_id: newWinRatingData.player_id,
                        total_games: newWinRatingData.total_games,
                        rating: newWinRatingData.rating,
                        last_login: newWinRatingData.lastLogin,
                        name: newWinRatingData.name
                    });
                }
            }
            if (loseRating >= minTopRating) {
                replaceTop = true;
                // トッププレイヤーリストに勝利プレイヤーを追加（または更新）
                const existingIndex = currentTopPlayers.findIndex(p => p.player_id === newLoseRatingData.player_id);
                if (existingIndex > -1) {
                    currentTopPlayers[existingIndex] = {
                        rank: 0, // 既存プレイヤーの場合は情報を更新
                        player_id: newWinRatingData.player_id,
                        total_games: newWinRatingData.total_games,
                        rating: newWinRatingData.rating,
                        last_login: newWinRatingData.lastLogin,
                        name: newWinRatingData.name
                    };
                }
            }

            if (replaceTop) {
                // レーティングの高い順にソート
                currentTopPlayers.sort((a, b) => getDisplayRating(b.rating, b.total_games) - getDisplayRating(a.rating, a.total_games));

                // トップ30に絞る
                currentTopPlayers = currentTopPlayers.slice(0, 30);

                for (let i = 0; i < currentTopPlayers.length; i++) {
                    currentTopPlayers[i].rank = i + 1;
                }

                // データベースのトッププレイヤーリストを更新
                await this.postgureDb.saveTopPlayers(currentTopPlayers);
                console.log('トッププレイヤーリストを更新しました。');
            }

            const data = {
                winPlayer: win,
                text: text,
                winRating: winRating,
                newWinRating: newWinRating,
                winGames: newWinRatingData.total_games, // 更新後のゲーム数を使用
                loseRating: loseRating,
                newLoseRating: newLoseRating,
                loseGames: newLoseRatingData.total_games // 更新後のゲーム数を使用
            }
            return data;
        } else {
            console.error(`レーティング情報が見つかりませんでした。Win Player ID: ${winPlayerId}, Lose Player ID: ${losePlayerId}`);
            return { winPlayer: win, text: text };
        }
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

    cancelReady(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.players[id].cancelReady();
    }

    backToRoom(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        return this.rooms[this.players[id].roomId].backToRoom();
    }

    // アプリケーション終了時にデータベース接続プールを終了する
    async closeDatabase() {
        console.log('Closing database connection pool via Postgure...');
        await this.postgureDb.end();
    }
}
