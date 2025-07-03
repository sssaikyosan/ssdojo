import { io, serverState } from './server.js';

export function ioSetup() {
    io.on("connection", (socket) => {
        serverState.addPlayer(socket);

        // ユーザーIDを受信

        socket.on('sendUserId', (data) => {
            if (!data.userId) return;
            if (data.userId.length > 50) return;
            serverState.players[socket.id].setUserId(data.userId);
            serverState.makeRating(data.userId);

            const displayRating = serverState.getUserRating(data.userId);
            const games = serverState.getUserGames(data.userId);
            socket.emit('receiveRating', { userId: data.userId, rating: displayRating, games: games });
        });

        // プレイヤーがマッチングを要求
        socket.on("requestMatch", (data) => {
            if (!data.name || !data.characterName || !data.userId) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.userId.length > 50) return;
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
            if (!data.name || !data.characterName || !data.userId) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.userId.length > 50) return;
            if (serverState.players[socket.id].roomId !== null) return;
            const roomId = serverState.createRoom();
            const res = serverState.joinRoom(socket.id, roomId, data.name, data.characterName);
            if (res === "roomJoined") {
                const room = serverState.rooms[roomId];
                const senteNames = room.sente.map(id => serverState.players[id].name);
                const goteNames = room.gote.map(id => serverState.players[id].name);
                const spectatorsNames = room.spectators.map(id => serverState.players[id].name);
                socket.emit("roomJoined", { roomId: roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: room.gameState, kifu: room.board.kifu });
            } else {
                socket.emit("roomJoinFailed", { roomId: roomId, text: res })
            }
        });

        socket.on("joinRoom", (data) => {
            if (!data.name || !data.characterName || !data.userId || !data.roomId) return;
            if (data.name.length > 30 || data.characterName.length > 50 || data.userId.length > 50 || data.roomId.length > 10) return;
            if (serverState.players[socket.id].roomId !== null) return;
            const res = serverState.joinRoom(socket.id, data.roomId, data.name, data.characterName);
            if (res === "roomJoined") {
                const room = serverState.rooms[data.roomId];
                const senteNames = room.sente.map(id => serverState.players[id].name);
                const goteNames = room.gote.map(id => serverState.players[id].name);
                const spectatorsNames = room.spectators.map(id => serverState.players[id].name);
                socket.emit("roomJoined", { roomId: data.roomId, sente: senteNames, gote: goteNames, spectators: spectatorsNames, state: room.gameState, kifu: room.board.kifu });
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

        // 切断時の処理
        socket.on("disconnect", () => {
            serverState.deletePlayer(socket.id);
        });
    });
}