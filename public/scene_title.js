//タイトルシーン要素

import { createPlayScene } from "./scene_game.js";
import { serverStatus, title_img, audioManager, canvas, setPlayerName, playerName, socket, selectedCharacterName, userId, setScene, characterFiles, setSelectedCharacterName } from "./main25062802.js";
import { Scene } from "./scene.js";
import { CharacterImageUI, BackgroundImageUI, OverlayUI } from "./ui.js";
import { LoadingUI } from "./ui_loading.js";
import { TextUI } from "./ui_text.js";
import { getAfterStr } from "./utils.js";
import { characterInfo } from "./const.js";

export const rankingOverlay = document.getElementById("rankingOverlay");
export const cancelMatchOverlay = document.getElementById("cancelMatchOverlay");

const cpumatchOverlay = document.getElementById("cpumatchOverlay");
const cpulevelOverlay = document.getElementById("cpulevelOverlay");
const roomMakeOverlay = document.getElementById("roomMakeOverlay");
const playButtonOverlay = document.getElementById("playButtonOverlay");
const nameInputOverlay = document.getElementById("nameInputOverlay");
const charaSelectOverlay = document.getElementById("charaSelectOverlay");

const nameInput = /** @type {HTMLInputElement} */ (document.getElementById("nameInput"));

const cpuButton = document.getElementById("cpuButton");
const cpulevel0Button = document.getElementById("cpulevel0Button");
const cpulevel1Button = document.getElementById("cpulevel1Button");
const cpulevel2Button = document.getElementById("cpulevel2Button");


const makeRoomButton = document.getElementById("makeRoomButton");
const joinRoomButton = document.getElementById("joinRoomButton");
const submitNameButton = document.getElementById("submitNameButton");
const charaSelectButton = document.getElementById("charaSelectButton");


let cpumatch = false;

const title = new TextUI({
    text: () => "リアルタイム将棋",
    x: 0,
    y: -0.3, // 配置を調整
    size: 0.12,
    colors: ["#c2a34f", "#000000", "#ffffff"]
});
const onlineText = new TextUI({
    text: () => `部屋数: ${serverStatus.roomCount}, オンライン: ${serverStatus.online}人`,
    x: 0,
    y: 0.48,
    size: 0.025,
    colors: ["#ffffff", "#00000000", "#00000000"],
    position: 'center'
});



const matchingText = new TextUI({
    text: () => {
        return "マッチング中";
    },
    x: 0.0,
    y: 0.4,
    size: 0.05,
    colors: ["#ffffff", "#00000000", "#00000000"],
    position: 'center'
});
const loading = new LoadingUI({
    x: 0.2,
    y: 0.4,
    radius: 0.03,
});


function clearTitleHTML() {
    cpumatchOverlay.style.display = "none";
    cpulevelOverlay.style.display = "none";
    roomMakeOverlay.style.display = "none";
    playButtonOverlay.style.display = "none";
    nameInputOverlay.style.display = "none";
    charaSelectOverlay.style.display = "none";
    cancelMatchOverlay.style.display = "none";
}

//タイトルシーン
export function createTitleScene() {

    let titleScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: title_img });
    titleScene.add(backgroundImageUI);
    // 初回クリックでBGMを再生するためのイベントリスナー
    const playBGMOnce = () => {
        if (audioManager.currentBGM === null) {
            audioManager.playBGM('title');
        }

        document.removeEventListener('click', playBGMOnce); // イベントリスナーを解除
    };
    document.addEventListener('click', playBGMOnce);

    //オンライン対戦
    function handleNameSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        // マッチングを開始
        socket.emit("requestMatch", { name: playerName, characterName: selectedCharacterName, userId: userId });
        clearTitleHTML();
        cancelMatchOverlay.style.display = "block";
        titleScene.add(matchingText);
        titleScene.add(loading);
    }

    function makeRoomSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        // ルーム作成をサーバーにリクエスト
        socket.emit("createRoom", { name: playerName, characterName: selectedCharacterName, userId: userId });
        clearTitleHTML();
        titleScene.add(loading);
    }

    function joinRoomSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        const roomIdInput = /** @type {HTMLInputElement} */ (document.getElementById("roomIdInput"));
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            // ルーム参加をサーバーにリクエスト
            socket.emit("joinRoom", { roomId: roomId, name: playerName, characterName: selectedCharacterName, userId: userId });
            clearTitleHTML();
            titleScene.add(loading);
        }
    }



    function charaSelectSubmit() {
        setScene(createCharacterSelectScene());
    }

    for (let i = 0; i < 10; i++) {
        const rankElement = document.getElementById(`ranking${i}`);
        if (rankElement) {
            if (serverStatus.topPlayers.length < i + 1) {
                rankElement.innerText = `${i + 1}位 none`;
            } else {
                rankElement.innerText = `${i + 1}位 ${Math.round(serverStatus.topPlayers[i].rating)} ${serverStatus.topPlayers[i].name}`;
            }
        }
    }








    submitNameButton.addEventListener("click", handleNameSubmit);
    makeRoomButton.addEventListener("click", makeRoomSubmit);
    joinRoomButton.addEventListener("click", joinRoomSubmit);
    charaSelectButton.addEventListener("click", charaSelectSubmit);

    let titleCharacter = new CharacterImageUI({
        image: selectedCharacterName, // 初期表示はなし
        x: -0.55, // 中央に配置
        y: 0.15, // 適切なY座標に調整
        width: 0.7,
        height: 0.7,
        touchable: true
    });

    titleScene.add(title);
    titleScene.add(onlineText);
    titleScene.add(titleCharacter);

    console.log(serverStatus);

    const savedName = localStorage.getItem("playerName");

    if (savedName) {
        nameInput.value = savedName;
    }
    cpumatchOverlay.style.display = "block";
    rankingOverlay.style.display = "block";
    roomMakeOverlay.style.display = "flex";
    nameInputOverlay.style.display = "flex";
    playButtonOverlay.style.display = "flex";
    charaSelectOverlay.style.display = "flex";

    // シーン破棄時のイベントリスナー削除
    titleScene.destroy = () => {
        document.removeEventListener('click', playBGMOnce);

        submitNameButton.removeEventListener("click", handleNameSubmit);
        makeRoomButton.removeEventListener("click", makeRoomSubmit);
        joinRoomButton.removeEventListener("click", joinRoomSubmit);
        charaSelectButton.removeEventListener("click", charaSelectSubmit);
        cpumatch = false;
    };

    return titleScene;
}




// キャラクター選択シーン
export function createCharacterSelectScene() {
    let selectScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: title_img });
    selectScene.add(backgroundImageUI);

    const selectTitle = new TextUI({
        text: () => "キャラクター選択",
        x: 0,
        y: -0.25,
        size: 0.06,
        colors: ["#bbdd44", "#000000", "#FFFFFF"]
    });




    // キャラクター一覧を表示
    const charactersPerRow = 3; // 1行に表示するキャラクター数
    const characterSize = 0.4; // キャラクター画像の表示サイズ
    const padding = 0.01; // キャラクター間の余白
    const startX = -(charactersPerRow * (characterSize + padding) - characterSize - 2 * padding) / 2; // 開始X座標
    const startY = 0.04; // 開始Y座標

    let overlayUI = new OverlayUI({
        x: 0.0,
        y: -0.02,
        width: 1.3,
        height: 0.65,
        color: "#222222bb"
    });

    selectScene.add(overlayUI);
    selectScene.add(selectTitle);


    characterFiles.forEach((characterName, index) => {
        const row = Math.floor(index / charactersPerRow);
        const col = index % charactersPerRow;
        const x = startX + col * (characterSize + padding);
        const y = startY + row * (characterSize + padding);

        const characterUI = new CharacterImageUI({
            image: characterName,
            x: x,
            y: y,
            width: characterSize,
            height: characterSize,
            touchable: true // クリック可能にする
        });

        const characterNameText = new TextUI({
            text: () => {
                return characterInfo[characterName].name;
            },
            x: x - characterSize / 2,
            y: y + characterSize / 2,
            size: 0.03,
            colors: ["#bbdd44", "#000000", "#00000000"],
            textBaseline: 'bottom',
            position: 'left'
        })

        // キャラクターがクリックされたときの処理
        characterUI.onMouseDown = () => {
            setSelectedCharacterName(characterName);
            localStorage.setItem('selectedCharacter', selectedCharacterName);
            console.log(`Selected character: ${selectedCharacterName}`);
            setScene(createTitleScene());
        };

        selectScene.add(characterUI);
        selectScene.add(characterNameText);
    });

    clearTitleHTML();

    return selectScene;
}


export function roomJoinFailed() {
    const roomJoinFailedMessage = document.getElementById('roomJoinFailedMessage');
    if (roomJoinFailedMessage.style.display === 'block') return;
    roomJoinFailedMessage.style.display = 'block';
    // 強制的にリフローを発生させてトランジションを有効にする
    roomJoinFailedMessage.offsetHeight;
    roomJoinFailedMessage.style.opacity = '1';
    // 2秒後にメッセージを非表示にする
    setTimeout(() => {
        roomJoinFailedMessage.style.opacity = '0';
        // トランジション完了後にdisplayをnoneにする
        roomJoinFailedMessage.addEventListener('transitionend', function handler() {
            roomJoinFailedMessage.style.display = 'none';
            roomJoinFailedMessage.removeEventListener('transitionend', handler);
        });
    }, 2000);
}


function cpuButtonSubmit() {
    cpumatch = !cpumatch;
    if (cpumatch) {
        console.log(cpumatch);
        cpulevelOverlay.style.display = "block";
    } else {
        console.log(cpumatch);
        cpulevelOverlay.style.display = "none";
    }

}
function cpuLevelSubmit(level, event) {
    setPlayerName(nameInput.value.trim());
    localStorage.setItem("playerName", playerName);
    if (playerName == "") setPlayerName("名無しの棋士");
    clearTitleHTML();
    setScene(createPlayScene(playerName, `レベル${level}CPU`, null, 1, null, performance.now(), 0, 0, level));
}
cpuButton.addEventListener("click", cpuButtonSubmit);
cpulevel0Button.addEventListener("click", function (event) {
    cpuLevelSubmit('0', event);
});
cpulevel1Button.addEventListener("click", function (event) {
    cpuLevelSubmit('1', event);
});
cpulevel2Button.addEventListener("click", function (event) {
    cpuLevelSubmit('2', event);
});