// ルームUIを定義するファイル
import { Scene } from "./scene.js";
import { battle_img, setScene, socket } from "./main.js"; // setScene関数をインポート
import { createTitleScene, discordButton, rankingOverlay } from "./scene_title.js"; // タイトルシーンに戻るために必要
import { createPlayScene } from "./scene_game.js";
import { BackgroundImageUI } from "./ui_background.js";

export const roomIdOverlay = document.getElementById("roomIdOverlay");
const copyIdButton = document.getElementById("copyIdButton");
const roomIdStr = document.getElementById("roomIdStr");
export const tebanOverlay = document.getElementById("tebanOverlay");
const senteOverlay = document.getElementById("senteOverlay");
const goteOverlay = document.getElementById("goteOverlay");
const spectatorsOverlay = document.getElementById("spectatorsOverlay");
export const readyOverlay = document.getElementById("readyOverlay");
export const cancelOverlay = document.getElementById("cancelOverlay");
export const leaveRoomOverlay = document.getElementById("leaveRoomOverlay");
const copySuccessMessage = document.getElementById("copySuccessMessage");
const playingText = document.getElementById("playingText");

const displayRoomIdButton = document.getElementById("displayRoomIdButton");
const readyButton = document.getElementById("readyButton");
const cancelButton = document.getElementById("cancelButton");
const moveToSenteButton = document.getElementById("moveToSenteButton");
const moveToGoteButton = document.getElementById("moveToGoteButton");
const moveToSpectatorsButton = document.getElementById("moveToSpectatorsButton");
const leaveRoomButton = document.getElementById("leaveRoomButton");

displayRoomIdButton.addEventListener("click", () => { toggleRoomId(); })
readyButton.addEventListener("click", () => { ready(); });
cancelButton.addEventListener("click", () => { cancelReady(); });
moveToSenteButton.addEventListener("click", () => { moveSubmit('sente'); });
moveToGoteButton.addEventListener("click", () => { moveSubmit('gote'); });
moveToSpectatorsButton.addEventListener("click", () => { moveSubmit('spectators'); });
leaveRoomButton.addEventListener("click", () => { leaveRoom(); });

copyIdButton.addEventListener("click", handleCopyIdClick);


let currentRoomId = null;

function moveSubmit(teban) {
    socket.emit("moveTeban", { teban: teban });
}

function leaveRoom() {
    socket.emit("leaveRoom");
    setScene(createTitleScene());
    currentRoomId = null;
    if (displayRoomIdButton.textContent === "部屋IDを非表示") {
        displayRoomIdButton.textContent = "部屋IDを表示";
        roomIdStr.textContent = ``
    }
    roomIdOverlay.style.display = 'none';
    tebanOverlay.style.display = 'none';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'none';
    playingText.style.display = 'none';
    // シーンを離れる際にメッセージを非表示にする
    if (copySuccessMessage) {
        copySuccessMessage.style.display = 'none';
        copySuccessMessage.style.opacity = '0';
    }
}

function ready() {
    socket.emit("ready");
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'block';
}

function cancelReady() {
    socket.emit("cancelReady");
    readyOverlay.style.display = 'block';
    cancelOverlay.style.display = 'none';
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
    cleanOverlay();

    for (let i = 0; i < data.sente.length; i++) {
        const pElement = document.createElement('p');
        if (data.readys && data.readys.sente[i]) {
            pElement.textContent = data.sente[i] + '(準備完了)';
        } else {
            pElement.textContent = data.sente[i];
        }
        pElement.style.color = '#FFFFFF'; // テキスト色を白に設定
        senteOverlay.appendChild(pElement);
    }

    for (let i = 0; i < data.gote.length; i++) {
        const pElement = document.createElement('p');
        if (data.readys && data.readys.gote[i]) {
            pElement.textContent = data.gote[i] + '(準備完了)';
        } else {
            pElement.textContent = data.gote[i];
        }
        pElement.style.color = '#FFFFFF'; // テキスト色を白に設定
        goteOverlay.appendChild(pElement);
    }
    for (let i = 0; i < data.spectators.length; i++) {
        const pElement = document.createElement('p');
        pElement.textContent = data.spectators[i];
        pElement.style.color = '#FFFFFF'; // テキスト色を白に設定
        spectatorsOverlay.appendChild(pElement);
    }

    if (data.state !== 'playing') {
        playingText.style.display = 'none';
        readyOverlay.style.display = 'block';
        cancelOverlay.style.display = 'none';
        if (data.roomteban === 'sente') {
            if (data.readys && data.readys.sente[data.idx]) {
                readyOverlay.style.display = 'none';
                cancelOverlay.style.display = 'block';
            }
        } else if (data.roomteban === 'gote') {
            if (data.readys && data.readys.gote[data.idx]) {
                readyOverlay.style.display = 'none';
                cancelOverlay.style.display = 'block';
            }
        } else {
            readyOverlay.style.display = 'none';
            cancelOverlay.style.display = 'none';
        }
    }
}

// コピーボタンのイベントハンドラ
async function handleCopyIdClick() {
    try {
        await navigator.clipboard.writeText(currentRoomId);
        console.log('部屋IDをクリップボードにコピーしました:', currentRoomId);
        // コピー成功メッセージを表示
        if (copySuccessMessage) {
            copySuccessMessage.style.display = 'block';
            // 強制的にリフローを発生させてトランジションを有効にする
            copySuccessMessage.offsetHeight;
            copySuccessMessage.style.opacity = '1';
            // 2秒後にメッセージを非表示にする
            setTimeout(() => {
                copySuccessMessage.style.opacity = '0';
                // トランジション完了後にdisplayをnoneにする
                copySuccessMessage.addEventListener('transitionend', function handler() {
                    copySuccessMessage.style.display = 'none';
                    copySuccessMessage.removeEventListener('transitionend', handler);
                });
            }, 2000);
        }
    } catch (err) {
        console.error('部屋IDのコピーに失敗しました:', err);
        // 必要であれば、コピー失敗のフィードバックをユーザーに表示する処理を追加
    }
}


export function createRoomScene(data) {
    let roomScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });

    roomScene.add(backgroundImageUI);

    roomUpdate(data);

    if (data.state === 'playing') {
        playingText.style.display = 'block';
    } else {
        playingText.style.display = 'none';
    }

    currentRoomId = data.roomId;

    discordButton.style.display = "block";
    rankingOverlay.style.display = "none";
    roomIdOverlay.style.display = 'flex';
    tebanOverlay.style.display = 'flex';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'block';
    copySuccessMessage.style.display = 'none';
    copySuccessMessage.style.opacity = '0';

    // シーン破棄時のイベントリスナー削除とメッセージ非表示
    roomScene.destroy = () => {
        if (copySuccessMessage) {
            copySuccessMessage.style.display = 'none';
            copySuccessMessage.style.opacity = '0';
        }
    };

    return roomScene;
}


function toggleRoomId() {
    if (displayRoomIdButton.textContent === "部屋IDを表示") {
        displayRoomIdButton.textContent = "部屋IDを非表示"
        roomIdStr.textContent = `${currentRoomId}`
    } else {
        displayRoomIdButton.textContent = "部屋IDを表示";
        roomIdStr.textContent = ``
    }
}