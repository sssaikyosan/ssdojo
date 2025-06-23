import { io, serverState } from './server.js';

export function ioSetup() {
    io.on("connection", (socket) => {
        serverState.addPlayer(socket);

        // ユーザーIDを受信

        socket.on('sendUserId', (data) => {
            if (!data.userId) return;
            serverState.players[socket.id].setUserId(data.userId);
            serverState.makeRating(data.userId);

            const displayRating = serverState.getUserRating(data.userId);
            const games = serverState.getUserGames(data.userId);
            socket.emit('receiveRating', { userId: data.userId, rating: displayRating, games: games });
        });

        // プレイヤーがマッチングを要求
        socket.on("requestMatch", (data) => {
            console.log(data);
            serverState.players[socket.id].requestMatch(data);
            console.log(serverState.players[socket.id].characterName);
        });

        socket.on("createRoom", (data) => {
            const roomId = serverState.createRoom();
            serverState.joinRoom(socket.id, roomId, data.characterName);
            socket.emit("roomJoined", { roomId: roomId });
        });

        socket.on("joinRoom", (data) => {
            if (!data.roomId) return
            const res = serverState.joinRoom(socket.id, data.roomId, data.characterName);
            if (res === "roomJoined") {
                const room = serverState.rooms[data.roomId];
                socket.emit("roomJoined", { roomId: data.roomId, sente: room.sente, gote: room.gote, spectators: room.spectators, kifu: room.board.kifu });
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

        socket.on("chat", (data) => {
            serverState.players[socket.id].chat(data);
        })

        // 駒の移動を転送
        socket.on("movePiece", (data) => {
            if (!serverState.rooms[data.roomId]) return;
            serverState.rooms[data.roomId].handleMove(socket.id, data);
        });

        // 切断時の処理
        socket.on("disconnect", () => {
            serverState.deletePlayer(socket.id);
        });
    });
}