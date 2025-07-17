import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';
import https from 'https';
import { Postgure } from './postgure.js'; // Postgure クラスをインポート

export class ServerState {
    timecount = 0;
    rooms = {};
    players = {};
    postgureDb; // Postgure クラスのインスタンスを保持
    canJoinRoom = {};

    constructor(io) {
        this.io = io;
        this.postgureDb = new Postgure(); // Postgure のインスタンスを作成
    }

    // プレイヤーのレーティングデータをデータベースに保存（挿入または更新）(Postgure クラスに処理を委譲)
    async savePlayerInfo(data) { // メソッド名を変更
        await this.postgureDb.savePlayerInfo(data);
    }

    async getPlayerInfo(player_id) { // 非同期にする
        const playerInfo = await this.postgureDb.readPlayerInfo(player_id);
        if (!playerInfo) {
            const player_id = uuid();
            const initialPlayerInfo = { player_id: player_id, rating: 1500, total_games: 0, lastLogin: new Date(), name: '' };
            await this.postgureDb.savePlayerInfo(initialPlayerInfo);
            return initialPlayerInfo;
        }
        return playerInfo;
    }

    addPlayer(socket, player_id) {
        if (!socket.id || !player_id) return false;
        this.players[socket.id] = new Player(socket, player_id);
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

    //部屋の削除
    deleteRoom(roomId) {
        if (!this.rooms[roomId]) return false;
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

        console.log("playersCount", Object.keys(this.players).length);
        console.log("roomCount", Object.keys(this.rooms).length);

        const serverAddress = process.env.SERVER_URL || 'https://localhost:5000'; // ゲームサーバーのアドレスとポート
        const postData = JSON.stringify({
            roomId: roomId
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // ゲームサーバーへのリクエスト送信と応答処理
        const req = https.request(serverAddress + '/roomdeleted', options, (res) => {
            console.log(`Game server response status: ${res.statusCode}`);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('server room delete successful.');
                } else {
                    console.error(`server room delete failed with status: ${res.statusCode}`);
                    console.error(`Response data: ${responseData}`);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with server request: ${e.message}`);
        });

        req.end(postData);
    }

    async ratingProcess(win, sente, gote, text) {
        if (!this.players[sente] || !this.players[gote]) {
            console.log('プレイヤーが存在しません');
            return { winPlayer: win, text: text }
        }

        let winPlayer = this.players[sente];
        let losePlayer = this.players[gote];
        let winPlayerId = this.players[sente].player_id;
        let losePlayerId = this.players[gote].player_id;
        if (win === -1) {
            winPlayerId = this.players[gote].player_id;
            losePlayerId = this.players[sente].player_id;
            winPlayer = this.players[gote];
            losePlayer = this.players[sente];
        }

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
                name: winPlayer.name
            };
            const newLoseRatingData = {
                player_id: losePlayerId,
                rating: rateData.newLoseRating,
                total_games: loseGames + 1,
                lastLogin: new Date(),
                name: losePlayer.name
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
                        player_id: newLoseRatingData.player_id,
                        total_games: newLoseRatingData.total_games,
                        rating: newLoseRatingData.rating,
                        last_login: newLoseRatingData.lastLogin,
                        name: newLoseRatingData.name
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


    createRoom(ownerId) { // ownerId 引数を追加
        const roomId = generateRandomString();
        this.rooms[roomId] = new Room(roomId, 'private', ownerId); // ownerIdを渡す
        return roomId;
    }

    joinRoom(id, roomId) {
        if (!this.rooms[roomId]) return '部屋が見つかりません';
        return this.players[id].joinRoom(roomId);
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

    startRoomGame(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.rooms[this.players[id].roomId].startRoomGame(id);
    }

    readyToPlay(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.players[id].readyToPlay();
        this.rooms[this.players[id].roomId].roomUpdate();
    }

    cancelReady(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        this.players[id].cancelReady();
    }

    backToRoom(id) {
        if (!this.players[id]) return;
        if (!this.players[id].roomId) return;
        return this.rooms[this.players[id].roomId].backToRoom(id);
    }

    // アプリケーション終了時にデータベース接続プールを終了する
    async closeDatabase() {
        console.log('Closing database connection pool via Postgure...');
        await this.postgureDb.end();
    }
}
