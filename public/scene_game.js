import { gameManager, battle_img, audioManager, selectedCharacterName, setScene, scene, setStatus } from "./main25062902.js";
import { Scene } from "./scene.js";
import { cancelMatchOverlay, createTitleScene, rankingOverlay } from "./scene_title.js";
import { BackgroundImageUI } from "./ui_background.js";
import { CharacterInGameUI } from "./ui_character.js";
import { TextUI } from "./ui_text.js";


export const statusOverlay = document.getElementById("statusOverlay");
export const changeRating = document.getElementById("changeRating");

const resultOverlay = document.getElementById("resultOverlay");
const toTitleButton = document.getElementById("toTitleButton");

export let opponentCharacter = null;

export function setOpponentCharacter(character) {
    opponentCharacter = character;
}

let playerCharacterUI;
let opponentCharacterUI;

export const endText = new TextUI({
    text: () => {
        return "試合終了";
    },
    x: 0.0,
    y: -0.2,
    size: 0.2,
    colors: ["#ff6739", "#30140b", "#ffffff"]
});

//勝敗結果テキスト
export const winText = new TextUI({
    text: () => {
        return "勝利";
    },
    x: 0.0,
    y: -0.2,
    size: 0.2,
    colors: ["#ff6739", "#30140b", "#ffffff"]
});

export const loseText = new TextUI({
    text: () => {
        return "敗北";
    },
    x: 0.0,
    y: -0.2,
    size: 0.2,
    colors: ["#b639ff", "#270b36", "#ffffff"]
});

export const timeText = new TextUI({
    text: () => {
        let time = (gameManager.board.time - gameManager.board.starttime - 5000) / 1000;
        if (time <= 0) time = 0;
        return `${Math.floor(time)}`;
    },
    x: 0.0,
    y: -0.49,
    size: 0.08,
    colors: ["#ffffff", "#888888", "#ffffff"],
    textBaseline: "top",
});

export const countDownText = new TextUI({
    text: () => {
        let time = (gameManager.board.starttime - gameManager.board.time + 6000) / 1000;
        if (time <= 1) {
            return '';
        }
        return `${Math.floor(time)}`;
    },
    x: 0.0,
    y: 0.18,
    size: 0.4,
    colors: ["#ff6739", "#000000", "#ffffff"],
    textBaseline: "bottom",
});



// Define the event handler function for the "To Title" button
export function handleToTitleClick() {
    backToTitle();
}

//ゲームシーン
export function createPlayScene(playerName, opponentName, opponentCharacterName, teban, roomId, servertime, rating, opponentRating, cpulevel = null) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle'); // 対戦BGMを再生

    gameManager.setRoom(roomId, teban, servertime, cpulevel);
    opponentCharacter = opponentCharacterName;

    let senteCharacter = null;
    let goteCharacter = null;

    let playerNameUI = new TextUI({
        text: () => {
            return `${playerName}`;
        },
        x: -0.43,
        y: 0.4,
        size: 0.03,
        colors: ["#FFFFFF", "#000000"],
        textBaseline: 'bottom',
        position: 'right',
        backgroundColor: '#000000cc'
    });

    let opponentNameUI = new TextUI({
        text: () => {
            return `${opponentName}`;
        },
        x: 0.43,
        y: -0.4,
        size: 0.03,
        colors: ["#FFFFFF", "#000000"],
        textBaseline: 'top',
        position: 'left',
        backgroundColor: '#000000cc'
    });

    let playerRatingUI = null;
    let opponentRatingUI = null;

    if (!cpulevel) {
        const roundRating = Math.round(rating);
        playerRatingUI = new TextUI({
            text: () => {
                // main.jsで計算された表示用レーティングを使用
                return `レート: ${roundRating}`;
            },
            x: -0.43,
            y: 0.44, // プレイヤー名の下に表示するためにy座標を調整
            size: 0.025, // プレイヤー名より少し小さく
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'bottom', // プレイヤー名の下に揃える
            position: 'right',
            backgroundColor: '#000000cc'
        });



        const opponentRoundRating = Math.round(opponentRating);
        opponentRatingUI = new TextUI({
            text: () => {
                // main.jsで計算された表示用レーティングを使用
                return `レート: ${opponentRoundRating}`;
            },
            x: 0.43,
            y: -0.44, // プレイヤー名の下に表示するためにy座標を調整
            size: 0.025, // プレイヤー名より少し小さく
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'top', // プレイヤー名の下に揃える
            position: 'left',
            backgroundColor: '#000000cc'
        });
    }

    // プレイヤーのキャラクター画像UIを追加
    playerCharacterUI = new CharacterInGameUI({
        image: selectedCharacterName, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    // 相手プレイヤーのキャラクター画像UIを追加
    opponentCharacterUI = new CharacterInGameUI({
        image: opponentCharacterName, // 相手プレイヤー名からキャラクター名を生成（仮）
        x: 0.6, // 相手プレイヤー名の近くに配置
        y: -0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    if (teban === 1) {
        senteCharacter = playerCharacterUI;
        goteCharacter = opponentCharacterUI;
    } else if (teban === -1) {
        senteCharacter = opponentCharacterUI;
        goteCharacter = playerCharacterUI;
    }



    // 先手の開始ビデオ再生終了後に後手の開始ビデオを再生
    senteCharacter.startVideoElement[0].addEventListener('ended', () => {
        console.log('先手ビデオ再生終了、後手ビデオ再生開始');
        goteCharacter.playStartVideo(0);
    });

    senteCharacter.startVideoElement[0].addEventListener('canplaythrough', () => {
        senteCharacter.playStartVideo(0);
        console.log('動画の再生準備ができました:');
    });



    cancelMatchOverlay.style.display = "none";
    statusOverlay.style.display = "none";
    rankingOverlay.style.display = "none";

    playScene.add(playerCharacterUI); // プレイヤーのキャラクター画像UIをシーンに追加
    playScene.add(opponentCharacterUI); // 相手プレイヤーのキャラクター画像UIをシーンに追加
    playScene.add(gameManager.boardUI);
    // playScene.add(playerOverlayUI);
    playScene.add(playerNameUI);
    playScene.add(opponentNameUI);
    if (playerRatingUI) playScene.add(playerRatingUI); // レーティング表示UIを追加
    if (opponentRatingUI) playScene.add(opponentRatingUI); // レーティング表示UIを追加
    playScene.add(countDownText);
    playScene.add(timeText);

    toTitleButton.addEventListener("click", handleToTitleClick);
    // Add destroy method to remove event listeners
    playScene.destroy = () => {
        toTitleButton.removeEventListener("click", handleToTitleClick);
    };
    console.log(gameManager.teban);

    return playScene;
}

export function backToTitle() {
    resultOverlay.style.display = "none";
    statusOverlay.style.display = "block";
    setScene(createTitleScene());
    audioManager.playBGM('title');
}

export function endGame(data) {
    if (gameManager.teban === 0) {
        changeRating.textContent = "レート変動 なし(観戦)";
    } else if (data.winPlayer === gameManager.teban) {
        const oldrate = Math.round(data.winRating);
        const newrate = Math.round(data.newWinRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(winText);
        setStatus(newrate, data.winGames);
        // 勝利時音声の再生
        if (playerCharacterUI) {
            playerCharacterUI.playWinVideo(0);
        }
    } else {
        const oldrate = Math.round(data.loseRating);
        const newrate = Math.round(data.newLoseRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(loseText);
        setStatus(newrate, data.loseGames);
        // 敵勝利時音声の再生
        if (opponentCharacterUI) {
            opponentCharacterUI.playWinVideo(0);
        }
    }

    resultOverlay.style.display = "block";
    // Use the named function for adding the listener

    gameManager.resetRoom();
    gameManager.board.finished = true;
}

export function endCPUGame(data) {
    changeRating.textContent = "レート変動 なし";
    if (data.winPlayer === gameManager.teban) {
        scene.add(winText);
        // 勝利時音声の再生
        if (playerCharacterUI) {
            playerCharacterUI.playWinVideo(0);
        }
    } else {
        scene.add(loseText);
        // 敵勝利時音声の再生
        if (opponentCharacterUI) {
            opponentCharacterUI.playWinVideo(0);
        }
    }

    resultOverlay.style.display = "block";
    gameManager.board.finished = true;
}