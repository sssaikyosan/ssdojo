import { io, serverState } from './server.js';
import { getDisplayRating } from './utils.js';

export function ioSetup() {
    io.on("connection", (socket) => {

        // ユーザーIDを受信
        socket.on('sendUserId', async (data) => {
            if (data.player_id.length > 36) return;
            const playerInfo = await serverState.getPlayerInfo(data.player_id);
            serverState.addPlayer(socket, playerInfo.player_id);
            const displayRating = getDisplayRating(playerInfo.rating, playerInfo.total_games);
            socket.emit('easyLogin', { player_id: playerInfo.player_id, rating: displayRating, total_games: playerInfo.total_games });
        });

        // プレイヤーがマッチングを要求
        socket.on("requestMatch", (data) => {
            console.log("requestMatch");
            if (!data.name || !data.characterName || !data.player_id) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.player_id.length > 50) return;
            if (!serverState.players[socket.id]) return;
            if (serverState.players[socket.id].roomId !== null) return;
            serverState.players[socket.id].requestMatch(data);
        });

        socket.on("cancelMatch", () => {
            console.log("cancelMatch");
            if (!serverState.players[socket.id]) return
            serverState.players[socket.id].cancelMatch();
            socket.emit("cancelMatch");
        });

        socket.on("createRoom", (data) => {
            console.log("createRoom");
            if (!data.name || !data.characterName || !data.player_id) return;
            if (data.name.length > 24 || data.characterName.length > 36 || data.player_id.length > 36) return;

            serverState.createRoom(socket); // オーナーIDを渡すように修正
        });

        socket.on("joinRoom", (data) => {
            if (!data.name || !data.characterName || !data.player_id || !data.roomId) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.player_id.length > 50 || data.roomId.length > 10) return;
            const url = serverState.rooms[data.roomId];
            if (url) {
                socket.emit("roomFound", {
                    roomId: data.roomId,
                    gameServerAddress: url
                });
            } else {
                socket.emit("roomJoinFailed", { roomId: data.roomId, text: '部屋が見つかりません' })
            }
        });

        // 切断時の処理
        socket.on("disconnect", () => {
            serverState.deletePlayer(socket.id);
        });
    });
}