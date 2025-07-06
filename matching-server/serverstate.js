import { Player } from './player.js'
import uuid from 'uuid-random';
import fs from 'fs';
import { getDisplayRating, calRating, generateRandomString } from './utils.js';
import { Room } from './room.js';

import sqlite3 from 'sqlite3'; // sqlite3 モジュールをインポート

const DB_PATH = './Data/game.db'; // データベースファイルのパス

export class DataBase {
    timecount = 0;
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
    saveRatings(data) {
        const sql = `
            INSERT INTO ratings (player_id, total_games, rating, last_login, name)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(player_id) DO UPDATE SET
                total_games = excluded.total_games,
                rating = excluded.rating,
                last_login = excluded.last_login,
                name = excluded.name
        `;
        this.db.run(sql, [data.player_id, data.total_games, data.rating, data.lastLogin, data.name], (err) => {
            if (err) {
                console.error(`レーティングデータ保存エラー (UserID: ${data.player_id}):`, err.message);
            } else {
                console.log(`レーティングデータを保存しました (UserID: ${data.player_id})`);
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
                        total_games: row.total_games,
                        lastLogin: new Date(row.last_login), // DATETIME文字列をDateオブジェクトに変換
                        name: row.name
                    };
                });
                console.log(`SQLiteから${rows.length}件のレーティングデータを読み込みました`);
            }
        });
    }

    // 新しいプレイヤーのレーティングデータを作成し、SQLiteに保存
    makeRating(player_id, name) {
        if (this.ratings[player_id]) return false; // キャッシュに存在する場合は作成しない

        const initialRatingData = { rating: 1500, total_games: 0, lastLogin: new Date(), name: name };
        this.ratings[player_id] = initialRatingData; // キャッシュに追加

        // SQLiteに保存
        this.saveRatings(player_id, initialRatingData);

        return true;
    }

    getTopPlayers() {
        const playersWithRating = [];

        // Object.entries を for...of で反復処理し、分割代入でキーと値を取得
        for (const [id, ratingData] of Object.entries(this.ratings)) {
            const playerrating = getDisplayRating(ratingData.rating, ratingData.total_games);
            playersWithRating.push({ name: ratingData.name, rating: playerrating });
        }

        // 評価値に基づいて降順にソート
        playersWithRating.sort((a, b) => b.rating - a.rating);

        // トップ10のプレイヤーを取得
        const top = playersWithRating.slice(0, 10);
        this.topPlayers = top;
        return top;
    }

    createTopPlayerTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS topplayers (
                rank TEXT PRIMARY KEY,
                player_id TEXT
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


    ratingProcess(win, sente, gote, text) {
        if (!this.players[sente] || !this.players[gote]) {
            console.log('プレイヤーが存在しません');
            return { winPlayer: win, text: text }
        }

        const winPlayerId = win === 1 ? this.players[sente].player_id : this.players[gote].player_id;
        const losePlayerId = win === 1 ? this.players[gote].player_id : this.players[sente].player_id;

        if (winPlayerId && losePlayerId && this.ratings[winPlayerId] && this.ratings[losePlayerId]) {
            const winEloRating = this.ratings[winPlayerId].rating;
            const loseEloRating = this.ratings[losePlayerId].rating;

            const winGames = this.ratings[winPlayerId].total_games;
            const loseGames = this.ratings[losePlayerId].total_games;

            const rateData = calRating(winEloRating, winGames, loseEloRating, loseGames);

            this.ratings[winPlayerId].rating = rateData.newWinRating;
            this.ratings[losePlayerId].rating = rateData.newLoseRating;

            console.log(`レーティング更新: ${winPlayerId}: ${this.ratings[winPlayerId].rating} (${winEloRating}), ${losePlayerId}: ${this.ratings[losePlayerId].rating} (${loseEloRating})`);

            this.ratings[winPlayerId].games++;
            this.ratings[losePlayerId].games++;

            this.ratings[this.players[sente].player_id].name = this.players[sente].name;
            this.ratings[this.players[gote].player_id].name = this.players[gote].name;

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

    getUserRating(player_id) {
        if (!this.ratings[player_id]) return null;
        return getDisplayRating(this.ratings[player_id].rating, this.ratings[player_id].total_games)
    }

    getUserGames(player_id) {
        if (!this.ratings[player_id]) return null;
        return this.ratings[player_id].total_games;
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

    /**
     * データベースから特定のプレイヤーIDの統計情報を取得する
     * @param {string} playerId - 取得するプレイヤーのID
     * @returns {Promise<object|null>} プレイヤー統計情報オブジェクト、または見つからない場合はnull
     */
    async getPlayerStatsFromDb(playerId) {
        const sql = `SELECT player_id, total_games, rating, last_login, name FROM ratings WHERE player_id = ?`;
        return new Promise((resolve, reject) => {
            this.db.get(sql, [playerId], (err, row) => {
                if (err) {
                    console.error(`プレイヤー統計情報取得エラー (UserID: ${playerId}):`, err.message);
                    reject(err);
                } else {
                    if (row) {
                        // last_login は文字列として取得されるので、必要に応じてDateオブジェクトに変換
                        row.last_login = new Date(row.last_login);
                        resolve(row);
                    } else {
                        resolve(null); // プレイヤーが見つからない場合
                    }
                }
            });
        });
    }
}
