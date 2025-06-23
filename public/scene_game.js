import { gameManager, battle_img, audioManager, selectedCharacterName, setScene, scene, setStatus } from "./main25062103.js";
import { Scene } from "./scene.js";
import { createTitleScene, rankingOverlay } from "./scene_title.js";
import { Background, BackgroundImageUI, CharacterInGameUI } from "./ui.js";
import { TextUI } from "./ui_text.js";


const statusOverlay = document.getElementById("statusOverlay");
const changeRating = document.getElementById("changeRating");

const resultOverlay = document.getElementById("resultOverlay");
const toTitleButton = document.getElementById("toTitleButton");




//暗い背景
let background = new Background({
    x: 0.0,
    y: 0.0,
    width: 1.0,
    height: 1.0,
    color: "#00000070",
});

//勝敗結果テキスト
const winText = new TextUI({
    text: () => {
        return "勝利";
    },
    x: 0.0,
    y: -0.2,
    size: 0.2,
    colors: ["#ff6739", "#30140b", "#ffffff"]
});

const loseText = new TextUI({
    text: () => {
        return "敗北";
    },
    x: 0.0,
    y: -0.2,
    size: 0.2,
    colors: ["#b639ff", "#270b36", "#ffffff"]
});

const timeText = new TextUI({
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

const countDownText = new TextUI({
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





//ゲームシーン
export function createPlayScene(playerName, opponentName, opponentCharacterName, teban, roomId, servertime, rating, opponentRating, cpu = false) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle'); // 対戦BGMを再生
    gameManager.setRoom(roomId, teban, servertime);

    const roundRating = Math.round(rating);
    const opponentRoundRating = Math.round(opponentRating);

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

    let playerRatingUI = new TextUI({
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

    let opponentRatingUI = new TextUI({
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

    // プレイヤーのキャラクター画像UIを追加
    let playerCharacterUI = new CharacterInGameUI({
        image: selectedCharacterName, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    // 相手プレイヤーのキャラクター画像UIを追加
    let opponentCharacterUI = new CharacterInGameUI({
        image: opponentCharacterName, // 相手プレイヤー名からキャラクター名を生成（仮）
        x: 0.6, // 相手プレイヤー名の近くに配置
        y: -0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });


    statusOverlay.style.display = "none";
    rankingOverlay.style.display = "none";

    playScene.add(playerCharacterUI); // プレイヤーのキャラクター画像UIをシーンに追加
    playScene.add(opponentCharacterUI); // 相手プレイヤーのキャラクター画像UIをシーンに追加
    playScene.add(gameManager.boardUI);
    // playScene.add(playerOverlayUI);
    playScene.add(playerNameUI);
    playScene.add(playerRatingUI); // レーティング表示UIを追加
    // playScene.add(opponentOverlayUI);
    playScene.add(opponentNameUI);
    playScene.add(opponentRatingUI); // レーティング表示UIを追加
    playScene.add(countDownText);
    playScene.add(timeText);



    return playScene;
}

export function backToTitle() {
    resultOverlay.style.display = "none";
    statusOverlay.style.display = "block";
    setScene(createTitleScene());
    audioManager.playBGM('title');
}

export function endGame(data) {
    scene.add(background);
    if (gameManager.teban === 0) {
        changeRating.textContent = "レート変動 なし(観戦)";
    } else if (data.winPlayer === gameManager.teban) {
        const oldrate = Math.round(data.winRating);
        const newrate = Math.round(data.newWinRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(winText);
        setStatus(newrate, data.winGames);
    } else {
        const oldrate = Math.round(data.loseRating);
        const newrate = Math.round(data.newLoseRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(loseText);
        setStatus(newrate, data.loseGames);
    }

    resultOverlay.style.display = "block";
    toTitleButton.addEventListener("click", () => { backToTitle(); });
    gameManager.resetRoom();
    gameManager.board.finished = true;
}












export function createRoomPlayScene(senteNames, senteCharacter, goteNames, goteCharacter, roomId, servertime, roomteban) {
    let teban = 0;

    let arryNames = [];
    let enemyNames = [];

    let arryCharacter = senteCharacter;
    let enemyCharacter = goteCharacter;

    if (roomteban === 'sente') {
        teban = 1;
        arryNames = senteNames;
        enemyNames = goteNames;

        arryCharacter = senteCharacter;
        enemyCharacter = goteCharacter;
    } else if (roomteban === 'gote') {
        teban = -1;
        arryNames = goteNames;
        enemyNames = senteNames;

        enemyCharacter = senteCharacter;
        arryCharacter = goteCharacter;
    } else if (roomteban === 'spectators') {
        teban = 0;
        arryNames = senteNames;
        enemyNames = goteNames;

        arryCharacter = senteCharacter;
        enemyCharacter = goteCharacter;
    }

    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle'); // 対戦BGMを再生
    gameManager.setRoom(roomId, teban, servertime);

    // プレイヤーのキャラクター画像UIを追加
    let playerCharacterUI = new CharacterInGameUI({
        image: arryCharacter, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    // 相手プレイヤーのキャラクター画像UIを追加
    let opponentCharacterUI = new CharacterInGameUI({
        image: enemyCharacter, // 相手プレイヤー名からキャラクター名を生成（仮）
        x: 0.6, // 相手プレイヤー名の近くに配置
        y: -0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

    playScene.add(playerCharacterUI);
    playScene.add(opponentCharacterUI);

    for (let i = 0; i < arryNames.length; i++) {
        let playerNameUI = new TextUI({
            text: () => {
                return `${arryNames[i]}`;
            },
            x: -0.43,
            y: 0.4 - i * 0.032,
            size: 0.03,
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'bottom',
            position: 'right',
            backgroundColor: '#000000cc'
        });
        playScene.add(playerNameUI);
    }

    for (let i = 0; i < enemyNames.length; i++) {
        let opponentNameUI = new TextUI({
            text: () => {
                return `${enemyNames[i]}`;
            },
            x: 0.43,
            y: -0.4 + i * 0.032,
            size: 0.03,
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'top',
            position: 'left',
            backgroundColor: '#000000cc'
        });
        playScene.add(opponentNameUI);
    }

    playScene.add(gameManager.boardUI);
    playScene.add(countDownText);
    playScene.add(timeText);

    statusOverlay.style.display = "none";

    return playScene;
}