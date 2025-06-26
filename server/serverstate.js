import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';

import sqlite3 from 'sqlite3'; // sqlite3 モジュールをインポート

const DB_PATH = './Data/game.db'; // データベースファイルのパス

export class ServerState {
    timecount = 0;
    rooms = {};
    players = {};
    ratings = {}; // メモリ上のキャッシュとして残す
    topPlayers = [];
    db; // SQLiteデータベース接続用のプロパティ

    constructor(io) {
        this.io = io;
        this.initDatabase(); // データベース初期化処理
    }

    // データベースの初期化と接続
    initDatabase() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('データベース接続エラー:', err.message);
            } else {
                console.log('SQLiteデータベースに接続しました。');
                this.createRatingsTable(); // テーブル作成処理
                this.loadRatings(); // データベースからレーティングデータを読み込み
            }
        });
    }

    // ratings テーブルの作成
    createRatingsTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS ratings (
                player_id TEXT PRIMARY KEY,
                total_games INTEGER DEFAULT 0,
                rating REAL DEFAULT 1500,
                last_login DATETIME,
                name TEXT
            )
        `;
        this.db.run(sql, (err) => {
            if (err) {
                console.error('ratingsテーブル作成エラー:', err.message);
            } else {
                console.log('ratingsテーブルが存在しないため作成しました、または既に存在します。');
            }
        });
    }

    // プレイヤーのレーティングデータをSQLiteに保存（挿入または更新）
    saveRatings(userId, ratingData) {
        const sql = `
            INSERT INTO ratings (player_id, total_games, rating, last_login, name)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(player_id) DO UPDATE SET
                total_games = excluded.total_games,
                rating = excluded.rating,
                last_login = excluded.last_login,
                name = excluded.name
        `;
        this.db.run(sql, [userId, ratingData.games, ratingData.rating, ratingData.lastLogin.toISOString(), ratingData.name], (err) => {
            if (err) {
                console.error(`レーティングデータ保存エラー (UserID: ${userId}):`, err.message);
            } else {
                console.log(`レーティングデータを保存しました (UserID: ${userId})`);
            }
        });
    }

    // レーティングデータをSQLiteから読み込み
    loadRatings() {
        const sql = `SELECT * FROM ratings`;
        this.db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('レーティングデータ読み込みエラー:', err.message);
                this.ratings = {}; // エラー時はキャッシュをクリア
            } else {
                this.ratings = {}; // 既存のキャッシュをクリア
                rows.forEach((row) => {
                    this.ratings[row.player_id] = {
                        rating: row.rating,
                        games: row.total_games,
                        lastLogin: new Date(row.last_login), // DATETIME文字列をDateオブジェクトに変換
                        name: row.name
                    };
                });
                console.log(`SQLiteから${rows.length}件のレーティングデータを読み込みました`);
            }
        });
    }

    // 新しいプレイヤーのレーティングデータを作成し、SQLiteに保存
    makeRating(userId, name) {
        if (this.ratings[userId]) return false; // キャッシュに存在する場合は作成しない

        const initialRatingData = { rating: 1500, games: 0, lastLogin: new Date(), name: name };
        this.ratings[userId] = initialRatingData; // キャッシュに追加

        // SQLiteに保存
        this.saveRatings(userId, initialRatingData);

        return true;
    }

    addPlayer(socket) {
        if (!socket.id) return false;
        this.players[socket.id] = new Player(socket);
        // プレイヤーが接続した際に、ユーザーIDが確定したら makeRating または loadRatings を呼び出す必要がある。
        // 現在のコードではユーザーIDの確定タイミングが不明確なため、ここでは処理を追加しない。
        // ユーザーIDと名前は、ログイン機能などで別途設定されることを想定する。
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
                // userId の取得方法が不明確だが、ratingProcess で使われている前提なのでそのままにする
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
        const topPlayers = this.getTopPlayers();
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

            console.log(`レーティング更新: ${winPlayerId}: ${this.ratings[winPlayerId].rating} (${winEloRating}), ${losePlayerId}: ${this.ratings[losePlayerId].rating} (${loseEloRating})`);

            this.ratings[winPlayerId].games++;
            this.ratings[losePlayerId].games++;

            // レーティングデータをSQLiteに保存
            this.saveRatings(winPlayerId, this.ratings[winPlayerId]);
            this.saveRatings(losePlayerId, this.ratings[losePlayerId]);

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

    getUserRating(userId) {
        if (!this.ratings[userId]) return null;
        return getDisplayRating(this.ratings[userId].rating, this.ratings[userId].games)
    }

    getUserGames(userId) {
        if (!this.ratings[userId]) return null;
        return this.ratings[userId].games;
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
}
