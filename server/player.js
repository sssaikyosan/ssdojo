export class Player {
    userId = null;
    name = "";
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
        if (this.state === "playing") return false;
        if (this.roomId !== null) return false;
        this.name = data.name;
        this.userId = data.userId;
        this.state = "matching";
        return true;
    }

    goToPlay(roomId) {
        this.state = "playing";
        this.roomId = roomId;
    }
}