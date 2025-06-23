//タイトルシーン要素

import { serverStatus, title_img, audioManager, canvas, setPlayerName, playerName, socket, selectedCharacterName, userId, setScene, characterFiles, setSelectedCharacterName } from "./main25062103.js";
import { Scene } from "./scene.js";
import { CharacterImageUI, BackgroundImageUI, OverlayUI } from "./ui.js";
import { LoadingUI } from "./ui_loading.js";
import { TextUI } from "./ui_text.js";
import { getAfterStr } from "./utils.js";

export const rankingOverlay = document.getElementById("rankingOverlay");
const roomMakeOverlay = document.getElementById("roomMakeOverlay");
const playButtonOverlay = document.getElementById("playButtonOverlay");
const nameInputOverlay = document.getElementById("nameInputOverlay");
const charaSelectOverlay = document.getElementById("charaSelectOverlay");

const nameInput = /** @type {HTMLInputElement} */ (document.getElementById("nameInput"));

const makeRoomButton = document.getElementById("makeRoomButton");
const joinRoomButton = document.getElementById("joinRoomButton");
const submitNameButton = document.getElementById("submitNameButton");
const charaSelectButton = document.getElementById("charaSelectButton");

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
let titleCharacter = new CharacterImageUI({
    image: null, // 初期表示はなし
    x: -0.55, // 中央に配置
    y: 0.15, // 適切なY座標に調整
    width: 0.7,
    height: 0.7,
    touchable: true
});


const matchingText = new TextUI({
    text: () => {
        return "マッチング中";
    },
    x: 0.4,
    y: 0.4,
    size: 0.05,
    colors: ["#ffffff", "#00000000", "#00000000"],
    position: 'center'
});
const loading = new LoadingUI({
    x: 0.6,
    y: 0.4,
    radius: 0.03,
});


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

        canvas.removeEventListener('click', playBGMOnce); // イベントリスナーを解除
    };
    canvas.addEventListener('click', playBGMOnce);

    //オンライン対戦
    function handleNameSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        // マッチングを開始
        socket.emit("requestMatch", { name: playerName, characterName: selectedCharacterName, userId: userId });
        roomMakeOverlay.style.display = "none";
        playButtonOverlay.style.display = "none";
        nameInputOverlay.style.display = "none";
        charaSelectOverlay.style.display = "none";
        titleScene.add(matchingText);
        titleScene.add(loading);
    }

    function makeRoomSubmit() {
        // ルーム作成をサーバーにリクエスト
        socket.emit("createRoom", { name: playerName, characterName: selectedCharacterName, userId: userId });
        roomMakeOverlay.style.display = "none";
        playButtonOverlay.style.display = "none";
        nameInputOverlay.style.display = "none";
        charaSelectOverlay.style.display = "none";
        titleScene.add(loading);
    }

    function joinRoomSubmit() {
        const roomIdInput = /** @type {HTMLInputElement} */ (document.getElementById("roomIdInput"));
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            // ルーム参加をサーバーにリクエスト
            socket.emit("joinRoom", { roomId: roomId, name: playerName, characterName: selectedCharacterName, userId: userId });
            roomMakeOverlay.style.display = "none";
            playButtonOverlay.style.display = "none";
            nameInputOverlay.style.display = "none";
            charaSelectOverlay.style.display = "none";
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
                rankElement.innerText = `${i + 1}位 ${serverStatus.topPlayers[i].name} ${Math.round(serverStatus.topPlayers[i].rating)}`;
            }
        }
    }

    submitNameButton.addEventListener("click", () => { handleNameSubmit(); });
    makeRoomButton.addEventListener("click", () => { makeRoomSubmit(); });
    joinRoomButton.addEventListener("click", () => { joinRoomSubmit(); });
    charaSelectButton.addEventListener("click", () => { charaSelectSubmit(); });

    titleCharacter.image = selectedCharacterName;
    titleScene.add(title);
    titleScene.add(onlineText);
    titleScene.add(titleCharacter);

    console.log(serverStatus);

    const savedName = localStorage.getItem("playerName");

    if (savedName) {
        nameInput.value = savedName;
    }
    rankingOverlay.style.display = "block";
    roomMakeOverlay.style.display = "flex";
    nameInputOverlay.style.display = "flex";
    playButtonOverlay.style.display = "flex";
    charaSelectOverlay.style.display = "flex";
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
        y: -0.3,
        size: 0.06,
        colors: ["#bbdd44", "#000000", "#FFFFFF"]
    });




    // キャラクター一覧を表示
    const charactersPerRow = 5; // 1行に表示するキャラクター数
    const characterSize = 0.25; // キャラクター画像の表示サイズ
    const padding = 0.01; // キャラクター間の余白
    const startX = -(charactersPerRow * (characterSize + padding) - characterSize - 2 * padding) / 2; // 開始X座標
    const startY = -0.1; // 開始Y座標

    let overlayUI = new OverlayUI({
        x: 0.0,
        y: -0.02,
        width: 1.4,
        height: 0.7,
        color: "#44668888"
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
                return getAfterStr(characterName, "_");
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
            setSelectedCharacterName(characterName); // 選択されたキャラクター名を設定
            localStorage.setItem('selectedCharacter', selectedCharacterName);
            console.log(`Selected character: ${selectedCharacterName}`);
            const randomIndex = Math.floor(Math.random() * 3);
            const randomVoiceFile = `/characters/${characterUI.image}/voice00${randomIndex + 1}.wav`;
            audioManager.playVoice(randomVoiceFile);
            setScene(createTitleScene());
        };

        selectScene.add(characterUI);
        selectScene.add(characterNameText);
    });

    rankingOverlay.style.display = "none";
    roomMakeOverlay.style.display = "none";
    playButtonOverlay.style.display = "none";
    nameInputOverlay.style.display = "none";
    charaSelectOverlay.style.display = "none";

    return selectScene;
}