// ルームUIを定義するファイル
import { Scene } from "./scene.js";
import { battle_img, setScene, socket } from "./main25062103.js"; // setScene関数をインポート
import { createTitleScene } from "./scene_title.js"; // タイトルシーンに戻るために必要
import { createPlayScene } from "./scene_game.js";
import { BackgroundImageUI } from "./ui.js";

const tebanOverlay = document.getElementById("tebanOverlay");
const senteOverlay = document.getElementById("senteOverlay");
const goteOverlay = document.getElementById("goteOverlay");
const spectatorsOverlay = document.getElementById("spectatorsOverlay");
const readyOverlay = document.getElementById("readyOverlay");
const cancelOverlay = document.getElementById("cancelOverlay");
const leaveRoomOverlay = document.getElementById("leaveRoomOverlay");

function roomGameStart() {
    setScene(createPlayScene());
}

function leaveRoom() {
    socket.emit("leaveRoom");
    setScene(createTitleScene());
}

export function createRoomScene(data) {
    let roomScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });

    roomScene.add(backgroundImageUI);

    tebanOverlay.style.display = 'flex';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'block';

    return roomScene;
}