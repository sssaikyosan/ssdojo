import { rankingOverlay } from "./scene_title.js";
import { BackgroundImageUI, CharacterInGameUI } from "./ui.js";
import { TextUI } from "./ui_text.js";
import { audioManager, battle_img, gameManager, scene, selectedCharacterName, setScene, socket } from "./main25062103.js";
import { Scene } from "./scene.js";
import { background, countDownText, endText, loseText, statusOverlay, timeText, winText } from "./scene_game.js";
import { roomIdOverlay, tebanOverlay, readyOverlay, cancelOverlay, leaveRoomOverlay, createRoomScene, roomUpdate } from "./scene_room.js";

const roomResultOverlay = document.getElementById("roomResultOverlay");
const toRoomButton = document.getElementById("toRoomButton");
let roomdata = null;

export function createRoomPlayScene(senteName, senteCharacter, goteName, goteCharacter, roomId, servertime, roomteban, board = null) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle');
    let teban = 0;
    if (roomteban === 'sente') teban = 1;
    if (roomteban === 'gote') teban = -1;

    console.log(roomId);

    if (board === null) {
        gameManager.setRoom(roomId, teban, servertime);
    } else {
        gameManager.setRoomBoard(roomId, board);
    }


    let arryNames = null;
    let enemyNames = null;
    let arryCharacter = null;
    let enemyCharacter = null;

    if (teban >= 0) {
        arryNames = senteName;
        enemyNames = goteName;
        arryCharacter = senteCharacter;
        enemyCharacter = goteCharacter;
    } else {
        arryNames = goteName;
        enemyNames = senteName;
        arryCharacter = goteCharacter;
        enemyCharacter = senteCharacter;
    }

    // プレイヤーのキャラクター画像UIを追加
    let arryCharacterUI = new CharacterInGameUI({
        image: arryCharacter, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    // 相手プレイヤーのキャラクター画像UIを追加
    let enemyCharacterUI = new CharacterInGameUI({
        image: enemyCharacter, // 相手プレイヤー名からキャラクター名を生成（仮）
        x: 0.6, // 相手プレイヤー名の近くに配置
        y: -0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    playScene.add(arryCharacterUI);
    playScene.add(enemyCharacterUI);

    for (let i = 0; i < arryNames.length; i++) {
        let arryNamesUI = new TextUI({
            text: () => {
                return `${arryNames[i]}`;
            },
            x: -0.43,
            y: 0.4 - i * 0.045,
            size: 0.03,
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'bottom',
            position: 'right',
            backgroundColor: '#000000cc'
        });
        playScene.add(arryNamesUI);
    }


    for (let i = 0; i < enemyNames.length; i++) {
        let enemyNamesUI = new TextUI({
            text: () => {
                return `${enemyNames[i]}`;
            },
            x: 0.43,
            y: -0.4 + i * 0.045,
            size: 0.03,
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'top',
            position: 'left',
            backgroundColor: '#000000cc'
        });
        playScene.add(enemyNamesUI);
    }



    statusOverlay.style.display = "none";
    rankingOverlay.style.display = "none";

    roomIdOverlay.style.display = 'none';
    tebanOverlay.style.display = 'none';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'none';


    playScene.add(gameManager.boardUI);
    playScene.add(countDownText);
    playScene.add(timeText);

    return playScene;
}

export function handleToRoomClick() {
    socket.emit("backToRoom");
}

export function backToRoom(data) {
    roomResultOverlay.style.display = "none";
    statusOverlay.style.display = "block";
    setScene(createRoomScene(data));
    audioManager.playBGM('title');
}

export function endRoomGame(data) {
    if (!gameManager.roomId === data.roomId) {
        roomUpdate(data);
        return;
    }
    scene.add(background);
    roomdata = { sente: data.sente, gote: data.gote, spectators: data.spectators, roomId: data.roomId };

    if (gameManager.teban === 0) {
        scene.add(endText);
    } else if (data.win === gameManager.teban) {
        scene.add(winText);
    } else {
        scene.add(loseText);
    }

    roomResultOverlay.style.display = "block";
    toRoomButton.addEventListener("click", handleToRoomClick);
    gameManager.resetRoom();
    gameManager.board.finished = true;
}