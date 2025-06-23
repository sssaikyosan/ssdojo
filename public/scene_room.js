// ルームUIを定義するファイル
import { Scene } from "./scene.js";
import { battle_img, setScene, socket } from "./main25062103.js"; // setScene関数をインポート
import { createTitleScene } from "./scene_title.js"; // タイトルシーンに戻るために必要
import { createPlayScene } from "./scene_game.js";
import { BackgroundImageUI } from "./ui.js";

const roomIdOverlay = document.getElementById("roomIdOverlay");
const copyIdButton = document.getElementById("copyIdButton");
const roomIdStr = document.getElementById("roomIdStr");
const tebanOverlay = document.getElementById("tebanOverlay");
const senteOverlay = document.getElementById("senteOverlay");
const goteOverlay = document.getElementById("goteOverlay");
const spectatorsOverlay = document.getElementById("spectatorsOverlay");
const readyOverlay = document.getElementById("readyOverlay");
const cancelOverlay = document.getElementById("cancelOverlay");
const leaveRoomOverlay = document.getElementById("leaveRoomOverlay");

const moveToSenteButton = document.getElementById("moveToSenteButton");
const moveToGoteButton = document.getElementById("moveToGoteButton");
const moveToSpectatorsButton = document.getElementById("moveToSpectatorsButton");
const leaveRoomButton = document.getElementById("leaveRoomButton");


function moveSubmit(teban) {
    socket.emit("moveTeban", { teban: teban });
}
function leaveRoom() {
    socket.emit("leaveRoom");
    setScene(createTitleScene());
    roomIdOverlay.style.display = 'none';
    tebanOverlay.style.display = 'none';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'none';
}

function cleanOverlay() {
    for (let i = senteOverlay.children.length - 1; i >= 0; i--) {
        const child = senteOverlay.children[i];
        // 要素のタグ名が 'P' (大文字) であるかを確認します
        if (child.tagName === 'P') {
            senteOverlay.removeChild(child);
        }
    }

    for (let i = goteOverlay.children.length - 1; i >= 0; i--) {
        const child = goteOverlay.children[i];
        // 要素のタグ名が 'P' (大文字) であるかを確認します
        if (child.tagName === 'P') {
            goteOverlay.removeChild(child);
        }
    }

    for (let i = spectatorsOverlay.children.length - 1; i >= 0; i--) {
        const child = spectatorsOverlay.children[i];
        // 要素のタグ名が 'P' (大文字) であるかを確認します
        if (child.tagName === 'P') {
            spectatorsOverlay.removeChild(child);
        }
    }
}

export function roomUpdate(data) {
    console.log(data);

    cleanOverlay();

    data.sente.forEach(name => {
        const pElement = document.createElement('p');
        pElement.textContent = name;
        senteOverlay.appendChild(pElement);
    });

    data.gote.forEach(name => {
        const pElement = document.createElement('p');
        pElement.textContent = name;
        goteOverlay.appendChild(pElement);
    });

    data.spectators.forEach(name => {
        const pElement = document.createElement('p');
        pElement.textContent = name;
        spectatorsOverlay.appendChild(pElement);
    });
}



export function createRoomScene(data) {
    let roomScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });

    roomScene.add(backgroundImageUI);

    roomUpdate(data);



    roomIdStr.textContent = `部屋ID ${data.roomId}`

    roomIdOverlay.style.display = 'flex';
    tebanOverlay.style.display = 'flex';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'block';

    return roomScene;
}

moveToSenteButton.addEventListener("click", () => { moveSubmit('sente'); });
moveToGoteButton.addEventListener("click", () => { moveSubmit('gote'); });
moveToSpectatorsButton.addEventListener("click", () => { moveSubmit('spectators'); });
leaveRoomButton.addEventListener("click", () => { leaveRoom(); });