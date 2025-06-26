import { gameManager, battle_img, audioManager, selectedCharacterName, setScene, scene, setStatus } from "./main25062603.js";
import { Scene } from "./scene.js";
import { cancelMatchOverlay, createTitleScene, rankingOverlay } from "./scene_title.js";
import { Background, BackgroundImageUI, CharacterInGameUI } from "./ui.js";
import { TextUI } from "./ui_text.js";


export const statusOverlay = document.getElementById("statusOverlay");
export const changeRating = document.getElementById("changeRating");

const resultOverlay = document.getElementById("resultOverlay");
const toTitleButton = document.getElementById("toTitleButton");

export let opponentCharacter = null;

export function setOpponentCharacter(character) {
    opponentCharacter = character;
}

//暗い背景
export let background = new Background({
    x: 0.0,
    y: 0.0,
    width: 1.0,
    height: 1.0,
    color: "#00000070",
});

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
export function createPlayScene(playerName, opponentName, opponentCharacterName, teban, roomId, servertime, rating, opponentRating, cpu = null) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle'); // 対戦BGMを再生

    gameManager.setRoom(roomId, teban, servertime, cpu);
    opponentCharacter = opponentCharacterName;

    let senteCharacter = null;
    let goteCharacter = null;

    if (teban === 1) {
        senteCharacter = selectedCharacterName;
        goteCharacter = opponentCharacterName;
    } else if (teban === -1) {
        senteCharacter = opponentCharacterName;
        goteCharacter = selectedCharacterName;
    }

    // ゲーム開始時音声の再生 (先手 -> 後手の順)
    if (senteCharacter) {
        const playerVoiceIndex = Math.floor((servertime * 999) % 3) + 1;
        const playerStartVoiceFile = `/characters/${senteCharacter}/startvoice${playerVoiceIndex}.wav`;

        // 先手番の音声を再生し、完了後に後手番の音声を再生
        audioManager.playVoice(playerStartVoiceFile, () => {
            if (goteCharacter) {
                const opponentVoiceIndex = Math.floor((servertime * 333) % 3) + 1;
                const opponentStartVoiceFile = `/characters/${goteCharacter}/startvoice${opponentVoiceIndex}.wav`;
                audioManager.playVoice(opponentStartVoiceFile);
            }
        });
    } else if (goteCharacter) {
        // selectedCharacterNameがない場合（観戦など）、後手番の音声のみ再生
        const opponentVoiceIndex = Math.floor((servertime * 333) % 3) + 1;
        const opponentStartVoiceFile = `/characters/${goteCharacter}/startvoice${opponentVoiceIndex}.wav`;
        audioManager.playVoice(opponentStartVoiceFile);
    }

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

    if (!cpu) {
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
    scene.add(background);
    if (gameManager.teban === 0) {
        changeRating.textContent = "レート変動 なし(観戦)";
    } else if (data.winPlayer === gameManager.teban) {
        const oldrate = Math.round(data.winRating);
        const newrate = Math.round(data.newWinRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(winText);
        setStatus(newrate, data.winGames);
        // 勝利時音声の再生
        if (selectedCharacterName) {
            const randomIndex = Math.floor(Math.random() * 3) + 1; // winvoice1.wav, winvoice2.wav, winvoice3.wav を想定
            const winVoiceFile = `/characters/${selectedCharacterName}/winvoice${randomIndex}.wav`;
            audioManager.playVoice(winVoiceFile);
        }
    } else {
        const oldrate = Math.round(data.loseRating);
        const newrate = Math.round(data.newLoseRating);
        changeRating.textContent = "レート変動 " + oldrate + " → " + newrate;
        scene.add(loseText);
        setStatus(newrate, data.loseGames);
        // 敵勝利時音声の再生
        if (opponentCharacter) {
            const randomIndex = Math.floor(Math.random() * 3) + 1; // losevoice1.wav, losevoice2.wav, losevoice3.wav を想定
            const loseVoiceFile = `/characters/${opponentCharacter}/winvoice${randomIndex}.wav`;
            audioManager.playVoice(loseVoiceFile);
        }
    }

    resultOverlay.style.display = "block";
    // Use the named function for adding the listener

    gameManager.resetRoom();
    gameManager.board.finished = true;
}

export function endCPUGame(data) {
    scene.add(background);
    changeRating.textContent = "レート変動 なし";
    if (data.winPlayer === gameManager.teban) {
        scene.add(winText);
        // 勝利時音声の再生
        if (selectedCharacterName) {
            const randomIndex = Math.floor(Math.random() * 3) + 1; // winvoice1.wav, winvoice2.wav, winvoice3.wav を想定
            const winVoiceFile = `/characters/${selectedCharacterName}/winvoice${randomIndex}.wav`;
            audioManager.playVoice(winVoiceFile);
        }
    } else {
        scene.add(loseText);
        // 敵勝利時音声の再生
        if (opponentCharacter) {
            const randomIndex = Math.floor(Math.random() * 3) + 1; // losevoice1.wav, losevoice2.wav, losevoice3.wav を想定
            const loseVoiceFile = `/characters/${opponentCharacter}/winvoice${randomIndex}.wav`;
            audioManager.playVoice(loseVoiceFile);
        }
    }

    resultOverlay.style.display = "block";

    gameManager.board.finished = true;
}