import { io, serverState } from './server.js';
import { getDisplayRating } from './utils.js';

export function ioSetup() {
    io.on("connection", (socket) => {
        serverState.addPlayer(socket);

        // ユーザーIDを受信
        socket.on('sendUserId', async (data) => {
            if (data.player_id.length > 36) return;
            const playerInfo = await serverState.getPlayerInfo(data.player_id);
            serverState.addPlayer(socket);
            serverState.players[socket.id].setUserId(playerInfo.player_id);
            console.log('playerInfo', playerInfo);
            const displayRating = getDisplayRating(playerInfo.rating, playerInfo.total_games);
            socket.emit('easyLogin', { player_id: playerInfo.player_id, rating: displayRating, total_games: playerInfo.total_games });
        });

        // プレイヤーがマッチングを要求
        socket.on("requestMatch", (data) => {
            if (!data.name || !data.characterName || !data.player_id) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.player_id.length > 50) return;
            if (serverState.players[socket.id].roomId !== null) return;
            serverState.players[socket.id].requestMatch(data);
            console.log(serverState.players[socket.id].characterName);
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
            if (serverState.players[socket.id].roomId !== null) return;
            const roomId = serverState.createRoom(socket.id); // オーナーIDを渡すように修正
            const res = serverState.joinRoom(socket.id, roomId, data.name, data.characterName);
            if (res === "roomJoined") {
                const room = serverState.rooms[roomId];
                const senteNames = room.sente.map(id => serverState.players[id].name);
                const goteNames = room.gote.map(id => serverState.players[id].name);
                const spectatorsNames = room.spectators.map(id => serverState.players[id].name);
                socket.emit("roomJoined", {
                    roomId: roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: room.gameState,
                    kifu: room.board.kifu,
                    maxplayers: room.maxplayers,
                    moveTime: room.moveTime,
                    roomteban: 'spectators',
                    idx: 0,
                    isOwner: true
                });
            } else {
                socket.emit("roomJoinFailed", { roomId: roomId, text: res })
            }
        });

        socket.on("joinRoom", (data) => {
            if (!data.name || !data.characterName || !data.player_id || !data.roomId) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.player_id.length > 50 || data.roomId.length > 10) return;
            if (serverState.players[socket.id].roomId !== null) return;
            const res = serverState.joinRoom(socket.id, data.roomId, data.name, data.characterName);
            if (res === "roomJoined") {
                const room = serverState.rooms[data.roomId];
                const senteNames = room.sente.map(id => serverState.players[id].name);
                const goteNames = room.gote.map(id => serverState.players[id].name);
                const spectatorsNames = room.spectators.map(id => serverState.players[id].name);
                const idx = room.spectators.length - 1;
                socket.emit("roomJoined", {
                    roomId: data.roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: room.gameState,
                    kifu: room.board.kifu,
                    maxplayers: room.maxplayers,
                    moveTime: room.moveTime,
                    roomteban: 'spectators',
                    idx: idx,
                    isOwner: room.ownerId === socket.id
                });
            } else {
                socket.emit("roomJoinFailed", { roomId: data.roomId, text: res })
            }
        });

        socket.on("leaveRoom", () => {
            serverState.leaveRoom(socket.id);
        });

        socket.on("moveTeban", (data) => {
            serverState.moveTeban(socket.id, data);
        });

        socket.on("startRoomGame", () => {
            console.log("startRoomGame");
            serverState.startRoomGame(socket.id);
        });

        socket.on("ready", () => {
            serverState.readyToPlay(socket.id);
        });

        socket.on("cancelReady", () => {
            serverState.cancelReady(socket.id);
        });

        socket.on("chat", (data) => {
            serverState.players[socket.id].chat(data);
        })

        // 駒の移動を転送
        socket.on("movePiece", (data) => {
            if (!serverState.rooms[data.roomId]) {
                return;
            }
            serverState.rooms[data.roomId].handleMove(socket.id, data);
        });

        socket.on("backToRoom", () => {
            const data = serverState.backToRoom(socket.id);
            socket.emit("backToRoom", data);
        });

        // 部屋設定更新イベント
        socket.on('updateRoomSettings', (data) => {
            const roomId = serverState.players[socket.id]?.roomId;
            if (roomId && serverState.rooms[roomId]) {
                serverState.rooms[roomId].updateSetting(socket.id, data);
            } else {
                console.warn(`Settings update received from ${socket.id} but not in a valid room.`);
            }
        });


        // 切断時の処理
        socket.on("disconnect", () => {
            serverState.deletePlayer(socket.id);
        });
    });
}