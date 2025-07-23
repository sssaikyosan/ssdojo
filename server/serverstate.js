import { Player } from './player.js'
import uuid from 'uuid-random';
import { generateRandomString } from './utils.js';
import https from 'https';

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

                    this.players[player1].state = "waiting";
                    this.io.to(this.players[player1].socket.id).emit("matchFound", {
                        roomId: roomId,
                        teban: 1,
                        servertime: time,
                        name: this.players[player2].name,
                        characterName: this.players[player2].characterName,
                        rating: player1Info.rating,
                        opponentRating: player2Info.rating,
                        gameServerAddress: gameServerAddress // ゲームサーバーのアドレスを追加
                    });

                    this.players[player2].state = "waiting";
                    this.io.to(this.players[player2].socket.id).emit("matchFound", {
                        roomId: roomId,
                        teban: -1,
                        servertime: time,
                        name: this.players[player1].name,
                        characterName: this.players[player1].characterName,
                        rating: player2Info.rating,
                        opponentRating: player1Info.rating,
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
            topPlayers.push({ name: topinfo[i].name, rating: topinfo[i].rating });
        }
        this.io.emit("serverStatus", { topPlayers: topPlayers });
    }


    createRoom(socket, data) { // ownerId 引数を追加
        const roomId = generateRandomString();

        const gameServerAddress = this.game_servers[this.next_game_server_idx]; // ゲームサーバーのアドレスとポート
        this.next_game_server_idx++;
        if (this.next_game_server_idx >= this.game_servers.length) {
            this.next_game_server_idx = 0;
        }

        this.rooms[roomId] = gameServerAddress;

        const ownerInfo = {
            id: this.players[socket.id].player_id,
            name: data.name,
            characterName: data.characterName
        };

        const postData = JSON.stringify({
            roomId: roomId,
            roomType: 'private',
            sente: [],
            gote: [],
            spectators: [ownerInfo], // 観戦者にオーナー情報を入れる
            owner: ownerInfo // オーナー情報
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
