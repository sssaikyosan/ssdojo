import { rankingOverlay } from "./scene_title.js";
import { BackgroundImageUI } from "./ui_background.js";
import { CharacterInGameUI } from "./ui_character.js";
import { TextUI } from "./ui_text.js";
import { audioManager, battle_img, gameManager, scene, selectedCharacterName, setScene, socket } from "./main25063002.js";
import { Scene } from "./scene.js";
import { countDownText, endText, loseText, statusOverlay, timeText, winText, opponentCharacter, setOpponentCharacter } from "./scene_game.js";
import { roomIdOverlay, tebanOverlay, readyOverlay, cancelOverlay, leaveRoomOverlay, createRoomScene, roomUpdate } from "./scene_room.js";

const roomResultOverlay = document.getElementById("roomResultOverlay");
const toRoomButton = document.getElementById("toRoomButton");

toRoomButton.addEventListener("click", handleToRoomClick);

let arryCharacterUI;
let enemyCharacterUI;

export function createRoomPlayScene(senteName, senteCharacter, goteName, goteCharacter, roomId, servertime, roomteban, board = null) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle');
    let teban = 0;
    if (roomteban === 'sente') teban = 1;
    if (roomteban === 'gote') teban = -1;

    if (board === null) {
        gameManager.setRoom(roomId, teban, servertime);
    } else {
        gameManager.setRoomBoard(roomId, board);
    }

    let arryNames = null;
    let enemyNames = null;
    let arryCharacter = null;
    let enemyCharacter = null;
    let senteCharacterUI = null;
    let goteCharacterUI = null;

    if (teban >= 0) {
        arryNames = senteName;
        enemyNames = goteName;
        arryCharacter = senteCharacter;
        enemyCharacter = goteCharacter;
        setOpponentCharacter(goteCharacter);
    } else {
        arryNames = goteName;
        enemyNames = senteName;
        arryCharacter = goteCharacter;
        enemyCharacter = senteCharacter;
        setOpponentCharacter(senteCharacter);
    }

    // プレイヤーのキャラクター画像UIを追加
    arryCharacterUI = new CharacterInGameUI({
        image: arryCharacter, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    // 相手プレイヤーのキャラクター画像UIを追加
    enemyCharacterUI = new CharacterInGameUI({
        image: enemyCharacter, // 相手プレイヤー名からキャラクター名を生成（仮）
        x: 0.6, // 相手プレイヤー名の近くに配置
        y: -0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    if (teban >= 0) {
        senteCharacterUI = arryCharacterUI;
        goteCharacterUI = enemyCharacterUI
    } else {
        senteCharacterUI = enemyCharacterUI;
        goteCharacterUI = arryCharacterUI;
    }

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

    senteCharacterUI.startVideoElement[0].addEventListener('ended', () => {
        console.log('先手ビデオ再生終了、後手ビデオ再生開始');
        goteCharacterUI.playStartVideo(0);
    });

    senteCharacterUI.startVideoElement[0].addEventListener('canplaythrough', () => {
        senteCharacterUI.playStartVideo(0);
        console.log('動画の再生準備ができました:');
    });

    roomResultOverlay.style.display = "none";
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

    if (gameManager.teban === 0) {
        scene.add(endText);
    } else if (data.win === gameManager.teban) {
        // 勝利時音声の再生
        if (arryCharacterUI) {
            arryCharacterUI.playWinVideo(0);
        }
        scene.add(winText);
    } else {
        // 敵勝利時音声の再生
        if (enemyCharacterUI) {
            enemyCharacterUI.playWinVideo(0);
        }
        scene.add(loseText);
    }

    roomResultOverlay.style.display = "block";

    gameManager.resetRoom();
    gameManager.board.finished = true;
}

