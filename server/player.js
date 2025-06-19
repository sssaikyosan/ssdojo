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
        if (this.state === "playing") return false;
        if (this.roomId !== null) return false;
        if (!data.name) return false;
        if (!data.characterName) return false;
        this.name = data.name;
        this.characterName = data.characterName;
        this.userId = data.userId;
        this.state = "matching";
        return true;
    }

    goToPlay(roomId) {
        this.state = "playing";
        this.roomId = roomId;
    }
}