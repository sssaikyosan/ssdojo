import 'dotenv/config';
import express from 'express';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'; // HTTPリクエスト送信のため

const app = express();
const server = http.createServer(app);
// const io = new Server(server); // Socket.IOは使用しない

// 利用可能なゲームサーバーのリスト
const availableGameServers = [];

// クライアントとゲームサーバー情報のマッピング
const clientGameServerMap = new Map();
const clientInfoMap = new Map();

// マッチングキュー (player_idのみを格納)
const matchQueue = [];

// ゲームサーバー登録エンドポイント
app.post('/register_game_server', express.json(), (req, res) => {
    const { address } = req.body;
    if (address && !availableGameServers.includes(address)) {
        availableGameServers.push(address);
        console.log(`Game server registered: ${address}`);
        res.status(200).send('Registered successfully');
    } else {
        res.status(400).send('Invalid request or server already registered');
    }
});

// クライアント向けゲームサーバー情報取得エンドポイント
app.get('/get_my_player_info', (req, res) => {
    const player_id = req.query.player_id; // クライアント識別のためのパラメータ
    if (player_id && clientInfoMap.has(player_id)) {
        const playerInfo = clientInfoMap.get(player_id);
        res.status(200).json(playerInfo);
    } else {
        res.status(404).send('Room info not found for this user');
    }
});

// クライアント向けゲームサーバー情報取得エンドポイント
app.get('/get_my_room_info', (req, res) => {
    const player_id = req.query.player_id; // クライアント識別のためのパラメータ
    if (player_id && clientGameServerMap.has(player_id)) {
        const roomInfo = clientGameServerMap.get(player_id);
        // 情報提供後、マッピングから削除するかはクライアントの実装によるが、
        // 一度取得したら削除する方がシンプルかもしれない。
        // clientGameServerMap.delete(player_id); // 必要に応じてコメント解除
        res.status(200).json(roomInfo);
    } else {
        res.status(404).send('Room info not found for this user');
    }
});

// クライアントからのマッチング要求を受け付けるエンドポイント
app.post('/request_match', express.json(), (req, res) => {
    const { player_id } = req.body; // クライアントからユーザーIDを受け取る想定
    if (player_id) {
        console.log(`Match request from user: ${player_id}`);
        // 既にキューにいるか確認
        const existingPlayer = matchQueue.find(id => id === player_id);
        if (!existingPlayer) {
            matchQueue.push(player_id);
            console.log(`User ${player_id} added to match queue.`);
            // マッチング処理を実行
            processMatchQueue();
            res.status(200).send('Match request received');
        } else {
            console.log(`User ${player_id} is already in the match queue.`);
            res.status(200).send('Already in queue'); // 既にキューにいる場合も成功とする
        }
    } else {
        res.status(400).send('Invalid request');
    }
});


// マッチング処理関数 (簡易版)
const processMatchQueue = async () => {
    console.log(`Processing match queue. Current queue size: ${matchQueue.length}`);
    // 少なくとも2人いて、利用可能なゲームサーバーがある場合
    if (matchQueue.length >= 2 && availableGameServers.length > 0) {
        // キューの先頭から2人を取り出す
        const player1Id = matchQueue.shift();
        const player2Id = matchQueue.shift();

        // 利用可能なゲームサーバーを一つ選択 (ここでは単純にリストの先頭)
        const gameServerAddress = availableGameServers[0];

        // 部屋IDを生成 (簡易版)
        const roomId = uuidv4();

        try {
            // ゲームサーバーに部屋作成を指示
            console.log(`Requesting room creation on ${gameServerAddress} for room ${roomId}`);
            // ゲームサーバーにはユーザーIDのリストを渡す
            const response = await axios.post(`${gameServerAddress}/create_room`, { roomId, players: [player1Id, player2Id] });

            if (response.status === 200) {
                console.log(`Room ${roomId} created successfully on ${gameServerAddress}`);
                // クライアントとゲームサーバー情報のマッピングを保存
                clientGameServerMap.set(player1Id, { serverAddress: gameServerAddress, roomId: roomId });
                clientGameServerMap.set(player2Id, { serverAddress: gameServerAddress, roomId: roomId });

                // クライアントへの通知は行わない。クライアントが /get_my_room_info をポーリングして取得する想定。

                console.log(`Match found: ${player1Id} and ${player2Id} in room ${roomId} on ${gameServerAddress}`);

            } else {
                console.error(`Failed to create room on ${gameServerAddress}. Status: ${response.status}`);
                // 部屋作成失敗時はキューに戻すか、エラーハンドリング
                matchQueue.unshift(player1Id, player2Id); // 一旦キューに戻す
            }

        } catch (error) {
            console.error(`Error requesting room creation on ${gameServerAddress}:`, error.message);
            // エラー発生時はキューに戻すか、エラーハンドリング
            matchQueue.unshift(player1Id, player2Id); // 一旦キューに戻す
        }
        // マッチングが成立した場合、再度キューを処理して次のマッチングを探す
    }
};


const PORT = process.env.PORT || 3000; // マッチングサーバーのポート
server.listen(PORT, () => {
    console.log(`Matching Server is running on port ${PORT}`);
});

// 一定間隔でマッチングキューを処理 (Polling方式)
// クライアントからのリクエスト時にprocessMatchQueueを呼び出す方式と併用しても良い
setInterval(processMatchQueue, 5000); // 例: 5秒ごとにキューをチェック

function generateRandomString(num) {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < num; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}