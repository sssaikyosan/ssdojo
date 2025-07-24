import { cancelOverlay, createRoomScene, leaveRoomOverlay, readyOverlay, roomIdOverlay, roomUpdate, spectatorsOverlay, tebanOverlay } from "./scene_room.js";
import { MOVETIME } from "./const.js";
import { gameManager, battle_img, audioManager, selectedCharacterName, setScene, scene, setStatus, setupSocket, connectToServer, socket } from "./main.js";
import { Scene } from "./scene.js";
import { createTitleScene } from "./scene_title.js";
import { BackgroundImageUI } from "./ui_background.js";
import { CharacterInGameUI } from "./ui_character.js";
import { TextUI } from "./ui_text.js";

export const changeRating = document.getElementById("changeRating");

const resultOverlay = document.getElementById("resultOverlay");
const toTitleButton = document.getElementById("toTitleButton");

toTitleButton.addEventListener("click", handleToTitleClick);

const roomResultOverlay = document.getElementById("roomResultOverlay");
const toRoomButton = document.getElementById("toRoomButton");

toRoomButton.addEventListener("click", handleToRoomClick);

export let opponentCharacter = null;

export function setOpponentCharacter(character) {
    opponentCharacter = character;
}

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

export function hideRoomUI() {
    roomResultOverlay.style.display = "none";
    roomIdOverlay.style.display = 'none';
    tebanOverlay.style.display = 'none';
    spectatorsOverlay.style.display = 'none';
    readyOverlay.style.display = 'none';
    cancelOverlay.style.display = 'none';
    leaveRoomOverlay.style.display = 'none';
}

// Define the event handler function for the "To Title" button
export function handleToTitleClick() {
    backToTitle();
}

export function handleToRoomClick() {
    socket.emit("backToRoom");
}

export function backToRoom(data) {
    roomResultOverlay.style.display = "none";
    setScene(createRoomScene(data));
    audioManager.playBGM('title');
}

let arryCharacterUI;
let enemyCharacterUI;

//ゲームシーン
export function createPlayScene(senteName, senteRating, senteCharacter, goteName, goteRating, goteCharacter, roomId, roomType, servertime, roomteban, moveTime, pawnLimit4thRank, cpulevel = null) {
    let playScene = new Scene();

    // 背景画像UIを追加 (他のUIより前に描画されるように最初に追加)
    const backgroundImageUI = new BackgroundImageUI({ image: battle_img });
    playScene.add(backgroundImageUI);

    audioManager.playBGM('battle'); // 対戦BGMを再生
    let teban = 0;
    if (roomteban === 'sente' || cpulevel !== null) teban = 1;
    if (roomteban === 'gote') teban = -1;

    gameManager.setRoom(roomId, teban, servertime, { sente: MOVETIME, gote: MOVETIME }, false, cpulevel);
    gameManager.setRoom(roomId, teban, servertime, moveTime, pawnLimit4thRank);

    let arryNames = null;
    let enemyNames = null;
    let arryRating = null;
    let enemyRating = null;
    let arryCharacter = null;
    let enemyCharacter = null;
    let senteCharacterUI = null;
    let goteCharacterUI = null;

    if (teban >= 0) {
        arryNames = senteName;
        arryRating = senteRating;
        enemyNames = goteName;
        enemyRating = goteRating;
        arryCharacter = senteCharacter;
        enemyCharacter = goteCharacter;
        setOpponentCharacter(goteCharacter);
    } else {
        arryNames = goteName;
        arryRating = goteRating;
        enemyNames = senteName;
        enemyRating = senteRating;
        arryCharacter = goteCharacter;
        enemyCharacter = senteCharacter;
        setOpponentCharacter(senteCharacter);
    }

    arryCharacterUI = new CharacterInGameUI({
        image: arryCharacter, // main.jsから選択されたキャラクター名を取得
        x: -0.6, // プレイヤー名の近くに配置
        y: 0.2, // 適切なY座標に調整
        width: 0.48, // サイズ調整
        height: 0.48
    });

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
            y: 0.4 - i * 0.038,
            size: 0.025,
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
            y: -0.4 + i * 0.038,
            size: 0.025,
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'top',
            position: 'left',
            backgroundColor: '#000000cc'
        });
        playScene.add(enemyNamesUI);
    }

    let playerRatingUI = null;
    let opponentRatingUI = null;

    if (roomType === 'rating') {
        let arryRatingtext = "測定中"
        if (arryRating !== -Infinity) {
            const roundRating = Math.round(arryRating);
            arryRatingtext = `${roundRating}`
        }
        playerRatingUI = new TextUI({
            text: () => {
                // main.jsで計算された表示用レーティングを使用
                return `レート: ` + arryRatingtext;
            },
            x: -0.43,
            y: 0.44, // プレイヤー名の下に表示するためにy座標を調整
            size: 0.025, // プレイヤー名より少し小さく
            colors: ["#FFFFFF", "#000000"],
            textBaseline: 'bottom', // プレイヤー名の下に揃える
            position: 'right',
            backgroundColor: '#000000cc'
        });

        let opponentRatingtext = "測定中";
        if (enemyRating !== -Infinity) {
            const opponentRoundRating = Math.round(enemyRating);
            opponentRatingtext = `${opponentRoundRating}`
        }
        opponentRatingUI = new TextUI({
            text: () => {
                // main.jsで計算された表示用レーティングを使用
                return `レート: ` + opponentRatingtext;
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

    // 先手の開始ビデオ再生終了後に後手の開始ビデオを再生
    senteCharacterUI.startVideoElement[0].addEventListener('ended', () => {
        goteCharacterUI.playStartVideo(0);
    });

    senteCharacterUI.startVideoElement[0].addEventListener('canplaythrough', () => {
        senteCharacterUI.playStartVideo(0);
    });

    hideRoomUI();

    playScene.add(gameManager.boardUI);
    // playScene.add(playerOverlayUI);
    if (playerRatingUI) playScene.add(playerRatingUI); // レーティング表示UIを追加
    if (opponentRatingUI) playScene.add(opponentRatingUI); // レーティング表示UIを追加
    playScene.add(countDownText);
    playScene.add(timeText);

    return playScene;
}

export function backToTitle() {
    resultOverlay.style.display = "none";
    connectToServer();
    setScene(createTitleScene());
    audioManager.playBGM('title');
}

export function endGame(data) {
    if (gameManager.teban === 0) {
        changeRating.textContent = "レート変動 なし(観戦)";
        if (data.winPlayer === 1 && arryCharacterUI.image) {
            if (arryCharacterUI.playWinVideo(0)) {
                arryCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    resultOverlay.style.display = "block";
                });
            } else {
                resultOverlay.style.display = "block";
            }
        } else if (data.winPlayer === -1 && enemyCharacterUI.image) {
            if (enemyCharacterUI.playWinVideo(0)) {
                enemyCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    resultOverlay.style.display = "block";
                });
            }
            resultOverlay.style.display = "block";
        } else {
            setTimeout(() => {
                resultOverlay.style.display = "block";
            }, 1000);
        }
    } else if (data.winPlayer === gameManager.teban) {
        let oldrateText = "測定中"
        let newrateText = "測定中"
        if (data.winGames >= 11) {
            const oldrate = Math.round(data.winRating);
            oldrateText = `${oldrate}`
        }
        if (data.winGames >= 10) {
            const newrate = Math.round(data.newWinRating);
            newrateText = `${newrate}`
        }

        changeRating.textContent = "レート変動 " + oldrateText + " → " + newrateText;
        scene.add(winText);
        setStatus(newrateText, data.winGames);
        // 勝利時音声の再生
        if (arryCharacterUI.image) {
            if (arryCharacterUI.playWinVideo(0)) {
                arryCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    resultOverlay.style.display = "block";
                });
            } else {
                resultOverlay.style.display = "block";
            }
        } else {
            setTimeout(() => {
                resultOverlay.style.display = "block";
            }, 1000);
        }
    } else {
        let oldrateText = "測定中"
        let newrateText = "測定中"
        if (data.loseGames >= 11) {
            const oldrate = Math.round(data.loseRating);
            oldrateText = `${oldrate}`
        }
        if (data.loseGames >= 10) {
            const newrate = Math.round(data.newLoseRating);
            newrateText = `${newrate}`
        }
        changeRating.textContent = "レート変動 " + oldrateText + " → " + newrateText;
        scene.add(loseText);
        setStatus(newrateText, data.loseGames);
        // 敵勝利時音声の再生
        if (enemyCharacterUI.image) {
            if (enemyCharacterUI.playWinVideo(0)) {
                enemyCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    resultOverlay.style.display = "block";
                });
            } else {
                resultOverlay.style.display = "block";
            }
        } else {
            setTimeout(() => {
                resultOverlay.style.display = "block";
            }, 1000);
        }
    }

    gameManager.resetRoom();
    gameManager.board.finished = true;
}

export function endRoomGame(data) {
    if (!gameManager.roomId === data.roomId) {
        roomUpdate(data);
        return;
    }

    if (gameManager.teban === 0) {
        scene.add(endText);
        if (data.win === 1 && arryCharacterUI.image) {
            if (arryCharacterUI.playWinVideo(0)) {
                arryCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    roomResultOverlay.style.display = "block";
                });
            } else {
                roomResultOverlay.style.display = "block";
            }
        } else if (data.win === -1 && enemyCharacterUI.image) {
            if (enemyCharacterUI.playWinVideo(0)) {
                enemyCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    roomResultOverlay.style.display = "block";
                });
            } else {
                roomResultOverlay.style.display = "block";
            }

        } else {
            setTimeout(() => {
                roomResultOverlay.style.display = "block";
            }, 1000);
        }
    } else if (data.win === gameManager.teban) {
        // 勝利時音声の再生
        if (arryCharacterUI.image) {
            if (arryCharacterUI.playWinVideo(0)) {
                arryCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    roomResultOverlay.style.display = "block";
                });
            } else {
                roomResultOverlay.style.display = "block";
            }

        } else {
            setTimeout(() => {
                roomResultOverlay.style.display = "block";
            }, 1000);
        }
        scene.add(winText);

    } else if (data.win === -gameManager.teban) {
        // 敵勝利時音声の再生
        if (enemyCharacterUI.image) {
            if (enemyCharacterUI.playWinVideo(0)) {
                enemyCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                    roomResultOverlay.style.display = "block";
                });
            } else {
                roomResultOverlay.style.display = "block";
            }
        } else {
            setTimeout(() => {
                roomResultOverlay.style.display = "block";
            }, 1000);
        }
        scene.add(loseText);


    } else {
        roomUpdate(data);
    }

    gameManager.teban = 0;
    gameManager.board.finished = true;
}


export function endCPUGame(data) {
    changeRating.textContent = "レート変動 なし";
    if (data.winPlayer === gameManager.teban) {
        scene.add(winText);
        // 勝利時音声の再生
        if (arryCharacterUI.image) {
            arryCharacterUI.playWinVideo(0);
            arryCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                resultOverlay.style.display = "block";
            });
        } else {
            setTimeout(() => {
                resultOverlay.style.display = "block";
            }, 1000);
        }
    } else {
        scene.add(loseText);
        // 敵勝利時音声の再生
        if (enemyCharacterUI.image) {
            enemyCharacterUI.playWinVideo(0);
            enemyCharacterUI.winVideoElement[0].addEventListener('ended', () => {
                resultOverlay.style.display = "block";
            });
        } else {
            setTimeout(() => {
                resultOverlay.style.display = "block";
            }, 1000);
        }
    }
    gameManager.board.finished = true;
}