import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';
import https from 'https';
import http from 'http';

import { Postgure } from './postgure.js'; // Postgure クラスをインポート

export class ServerState {
    players = {};
    postgureDb;
    rooms = {};
    game_servers = [];
    next_game_server_idx = 0;

    constructor(io, game_servers) {
        this.io = io;
        this.game_servers = game_servers;
        this.postgureDb = new Postgure();
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

                console.log(new Date(), `Matched players: (先手:${this.players[player1].name}) vs (後手:${this.players[player2].name})`);
            }
        }
    }

    async matchMake(player1, player2) {
        const roomId = uuid();  // ルームIDを生成

        // ルームを作成 (マッチングサーバー側での管理用)


        const player1Info = await this.postgureDb.readPlayerInfo(this.players[player1].player_id);
        const player2Info = await this.postgureDb.readPlayerInfo(this.players[player2].player_id);

        // プレイヤー情報の取得に成功した場合のみ処理を続行
        if (!player1Info || !player2Info) {
            console.error(`プレイヤー情報が見つかりませんでした。Player1 ID: ${this.players[player1].player_id}, Player2 ID: ${this.players[player2].player_id}`);
            // ルーム作成に失敗したとみなし、作成したルームを削除するなどの後処理が必要であればここに追加
            return false;
        }



        const time = performance.now();

        const gameServerAddress = this.game_servers[this.next_game_server_idx];
        this.next_game_server_idx++;
        if (this.next_game_server_idx >= this.game_servers.length) {
            this.next_game_server_idx = 0;
        }

        const postData = JSON.stringify({
            roomId: roomId,
            roomType: 'rating',
            sente: [this.players[player1].player_id],
            gote: [this.players[player2].player_id],
            spectators: [],
            owner: null
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // ゲームサーバーへのリクエスト送信と応答処理
        const req = https.request(gameServerAddress + '/createroom', options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            console.log(`Game server response status: ${res.statusCode}`);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    // ゲームサーバーでのルーム作成が成功した場合
                    console.log('Game server room creation successful.');
                    // matchFound イベントをクライアントに送信

                    const player1rating = getDisplayRating(player1Info.rating, player1Info.total_games);
                    const player2rating = getDisplayRating(player2Info.rating, player2Info.total_games);

                    this.players[player1].goToPlay(roomId);
                    this.io.to(this.players[player1].socket.id).emit("matchFound", {
                        roomId: roomId,
                        teban: 1,
                        servertime: time,
                        name: this.players[player2].name,
                        characterName: this.players[player2].characterName,
                        rating: player1rating,
                        opponentRating: player2rating,
                        gameServerAddress: gameServerAddress // ゲームサーバーのアドレスを追加
                    });

                    this.players[player2].goToPlay(roomId);
                    this.io.to(this.players[player2].socket.id).emit("matchFound", {
                        roomId: roomId,
                        teban: -1,
                        servertime: time,
                        name: this.players[player1].name,
                        characterName: this.players[player1].characterName,
                        rating: player2rating,
                        opponentRating: player1rating,
                        gameServerAddress: gameServerAddress // ゲームサーバーのアドレスを追加
                    });
                } else {
                    // ゲームサーバーでのルーム作成が失敗した場合
                    console.error(`Game server room creation failed with status: ${res.statusCode}`);
                    console.error(`Response data: ${responseData}`);
                    // エラーハンドリング（例: マッチングを解除してプレイヤーを待機状態に戻す）
                    // プレイヤーの状態を更新するなど
                    if (this.players[player1]) this.players[player1].state = "matching";
                    if (this.players[player2]) this.players[player2].state = "matching";
                    // クライアントにエラーを通知することも検討
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with game server request: ${e.message}`);
            // エラーハンドリング（例: マッチングを解除してプレイヤーを待機状態に戻す）
            // プレイヤーの状態を更新するなど
            if (this.players[player1]) this.players[player1].state = "matching";
            if (this.players[player2]) this.players[player2].state = "matching";
            // クライアントにエラーを通知することも検討
        });

        req.end(postData);

        return true; // リクエスト送信自体は成功
    }

    async sendServerStatus() {

        const topinfo = await this.postgureDb.readTopPlayers();
        const topPlayers = [];

        for (let i = 0; i < 10; i++) {
            if (topinfo.length - 1 < i) {
                break;
            }
            const displayRating = getDisplayRating(topinfo[i].rating, topinfo[i].total_games);
            topPlayers.push({ name: topinfo[i].name, rating: displayRating });
        }
        this.io.emit("serverStatus", { topPlayers: topPlayers });
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


    createRoom(socket) { // ownerId 引数を追加
        const roomId = generateRandomString();

        const gameServerAddress = this.game_servers[this.next_game_server_idx]; // ゲームサーバーのアドレスとポート
        this.next_game_server_idx++;
        if (this.next_game_server_idx >= this.game_servers.length) {
            this.next_game_server_idx = 0;
        }

        this.rooms[roomId] = gameServerAddress;

        const postData = JSON.stringify({
            roomId: roomId,
            roomType: 'private',
            sente: [],
            gote: [],
            spectators: [this.players[socket.id].player_id],
            owner: this.players[socket.id].player_id
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        // ゲームサーバーへのリクエスト送信と応答処理
        const req = https.request(gameServerAddress + '/createroom', options, (res) => {
            console.log(`Game server response status: ${res.statusCode}`);
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    // ゲームサーバーでのルーム作成が成功した場合
                    console.log('Game server room creation successful.');

                    this.io.to(socket.id).emit("roomFound", {
                        roomId: roomId,
                        gameServerAddress: gameServerAddress // ゲームサーバーのアドレスを追加
                    });
                } else {
                    // ゲームサーバーでのルーム作成が失敗した場合
                    console.error(`Game server room creation failed with status: ${res.statusCode}`);
                    console.error(`Response data: ${responseData}`);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with game server request: ${e.message}`);
        });

        req.end(postData);
        return roomId;
    }

    // アプリケーション終了時にデータベース接続プールを終了する
    async closeDatabase() {
        console.log('Closing database connection pool via Postgure...');
        await this.postgureDb.end();
    }
}
