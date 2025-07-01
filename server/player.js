import { serverState } from "./server.js";

export class Player {
    userId = null;
    name = "";
    characterName = null;
    roomId = null;
    socket = null;
    state = "";
    constructor(socket) {
        this.socket = socket;
    }

    setUserId(userId) {
        this.userId = userId;
    }

    requestMatch(data) {
        if (this.state === "playing" || this.state === "ready") return false;
        if (this.roomId !== null) return false;
        if (!data.name) return false;
        if (!data.characterName) return false;
        this.name = data.name;
        this.characterName = data.characterName;
        this.userId = data.userId;
        this.state = "matching";
        return true;
    }

    cancelMatch() {
        this.state = "waiting";
    }

    goToPlay(roomId) {
        this.state = "playing";
        this.roomId = roomId;
    }

    readyToPlay() {
        this.state = "ready";
    }

    cancelReady() {
        if (this.state === 'ready') {
            this.state = "waiting";
        }
    }

    joinRoom(roomId, name, characterName) {
        if (this.roomId) return 'すでに入っている部屋があります';
        this.name = name;
        this.characterName = characterName;
        const res = serverState.rooms[roomId].joinRoom(this.socket.id);
        if (res === "roomJoined") {
            this.roomId = roomId;
            serverState.rooms[roomId].roomUpdate();
            return "roomJoined"
        } else {
            return res;
        }
    }

    leaveRoom() {
        if (!this.roomId) return;
        serverState.rooms[this.roomId].leaveRoom(this.socket.id);
        this.roomId = null;
        this.state = 'waiting';
    }

    chat(data) {
        if (!this.roomId) return;
        serverState.rooms[roomId].chat(this.name, data.text);
    }
}