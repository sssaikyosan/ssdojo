//タイトルシーン要素

import { createPlayScene } from "./scene_game.js";
import { serverStatus, title_img, audioManager, setPlayerName, playerName, socket, selectedCharacterName, player_id, setScene, characterFiles, setSelectedCharacterName, connectToServer, disconnectFromServer } from "./main.js";
import { Scene } from "./scene.js";
import { OverlayUI } from "./ui.js";
import { BackgroundImageUI } from "./ui_background.js";
import { CharacterImageUI } from "./ui_character.js";
import { LoadingUI } from "./ui_loading.js";
import { TextUI } from "./ui_text.js";
import { characterInfo, MOVETIME } from "./const.js";
import { ImageUI } from "./ui_image.js";
import { ButtonUI } from "./ui_button.js";

export const discordButton = document.getElementById("discordButton");

export const roomIdInput = /** @type {HTMLInputElement} */ (document.getElementById("roomIdInput"));
export const nameInput = /** @type {HTMLInputElement} */ (document.getElementById("nameInput"));

const cpuLevelOverlay = new OverlayUI({
    x: 0.65,
    y: 0.16,
    height: 0.19,
    width: 0.11,
    visible: false
});

for (let i = 0; i < 4; i++) {
    const cpulevelButton = new ButtonUI({
        text: `レベル${i}`,
        x: 0.0,
        y: 0.067 - i * 0.045,
        height: 0.04,
        width: 0.1,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => {
            cpuLevelSubmit(i.toString());
        }
    });
    cpuLevelOverlay.add(cpulevelButton);
}

export const statusOverlay = new OverlayUI({
    x: -0.78,
    y: 0.43,
    width: 0.2,
    height: 0.1,
    color: '#111122bb'
});

export const playCountText = new TextUI({
    text: () => `試合数: -`,
    x: 0,
    y: -0.015,
    size: 0.025,
    colors: ["#ffffff", "#00000000", "#00000000"],
    position: 'center'
});

export const ratingText = new TextUI({
    text: () => `レート: -`,
    x: 0,
    y: 0.025,
    size: 0.025,
    colors: ["#ffffff", "#00000000", "#00000000"],
    position: 'center'
});

export const cancelMatchButton = new ButtonUI({
    text: 'キャンセル',
    x: 0.65,
    y: 0.4,
    height: 0.08,
    width: 0.24,
    color: '#df398c',
    textSize: 0.04,
    textColors: ['#ffffffff', '#00000000', '#00000000'],
    onClick: () => {
        if (socket) {
            socket.emit('cancelMatch');
        }
    }
});

const rankingOverlay = new OverlayUI({
    x: 0.72,
    y: -0.22,
    width: 0.3,
    height: 0.36
});

const rankingTitle = new TextUI({
    text: () => {
        return `ランキング`
    },
    x: 0,
    y: -0.15,
    size: 0.03,
    colors: ["#ffffffff", "#00000000", "#00000000"]
});

for (let i = 0; i < 10; i++) {
    const rankingText = new TextUI({
        text: () => {
            return ``
        },
        x: -0.13,
        y: -0.11 + i * 0.03,
        size: 0.022,
        colors: ["#ffffffff", "#00000000", "#00000000"],
        position: 'left'
    });
    rankingOverlay.add(rankingText);
}

rankingOverlay.add(rankingTitle);
statusOverlay.add(playCountText);
statusOverlay.add(ratingText);

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
    discordButton.style.display = "none";
    roomIdInput.style.display = "none";
    nameInput.style.display = "none";
}

//タイトルシーン
export function createTitleScene(savedTitleCharacter = null, loadNameInput = true) {
    clearTitleHTML();

    let titleScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: title_img });
    titleScene.add(backgroundImageUI);
    cpuLevelOverlay.visible = false;

    const playBGMOnce = () => {
        if (audioManager.currentBGM === null) {
            audioManager.playBGM('title');
        }
        document.removeEventListener('click', playBGMOnce);
    };
    document.addEventListener('click', playBGMOnce);

    function startOnlineMatch() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");

        clearTitleHTML();
        titleScene.remove(joinRoomButton);
        titleScene.remove(makeRoomButton);
        titleScene.remove(cpuButton);
        titleScene.remove(cpuLevelOverlay);
        titleScene.remove(charaSelectButton);
        titleScene.remove(playButton);
        titleScene.add(matchingText);
        titleScene.add(loading);
        titleScene.add(cancelMatchButton);

        connectToServer().then(socket => {
            socket.emit("requestMatch", { name: playerName, characterName: selectedCharacterName, player_id: player_id });
        }).catch(err => {
            console.error("Failed to connect for matching:", err);
            alert("サーバーへの接続に失敗しました。");
            setScene(createTitleScene());
        });
    }

    function makeRoomSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        clearTitleHTML();

        connectToServer().then(socket => {
            socket.emit("createRoom", { name: playerName, characterName: selectedCharacterName, player_id: player_id });
        }).catch(err => {
            console.error("Failed to connect for creating room:", err);
            alert("サーバーへの接続に失敗しました。");
            setScene(createTitleScene());
        });
    }

    function joinRoomSubmit() {
        setPlayerName(nameInput.value.trim());
        localStorage.setItem("playerName", playerName);
        if (playerName == "") setPlayerName("名無しの棋士");
        const roomId = roomIdInput.value.trim();
        if (roomId) {
            clearTitleHTML();
            connectToServer().then(socket => {
                socket.emit("joinRoom", { roomId: roomId, name: playerName, characterName: selectedCharacterName, player_id: player_id });
            }).catch(err => {
                console.error("Failed to connect for joining room:", err);
                alert("サーバーへの接続に失敗しました。");
                setScene(createTitleScene());
            });
        }
    }

    function charaSelectSubmit() {
        setScene(createCharacterSelectScene(titleCharacter));
    }

    updateRanking();

    const title = new TextUI({
        text: () => "リアルタイム将棋",
        x: 0,
        y: -0.3,
        size: 0.12,
        colors: ["#c2a34f", "#000000", "#ffffff"]
    });
    titleScene.add(title);

    const announce = new TextUI({
        text: () => `${serverStatus.announcement}`,
        x: -0.86,
        y: -0.48,
        size: 0.02,
        colors: ["#ffffff", "#000000", "#00000000"],
        position: "left",
        textBaseline: "top"
    });
    titleScene.add(announce);

    let titleCharacter = savedTitleCharacter;
    if (titleCharacter === null) {
        titleCharacter = new CharacterImageUI({
            image: selectedCharacterName,
            x: -0.55,
            y: 0.15,
            width: 0.7,
            height: 0.7,
            touchable: true
        });
        titleCharacter.init();
    }
    titleScene.add(titleCharacter);

    const playButton = new ButtonUI({
        text: 'オンライン対戦',
        x: 0.65,
        y: 0.4,
        height: 0.1,
        width: 0.4,
        color: '#df398c',
        textSize: 0.05,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: startOnlineMatch
    });
    titleScene.add(playButton);

    const makeRoomButton = new ButtonUI({
        text: '部屋作成',
        x: 0.78,
        y: 0.3,
        height: 0.05,
        width: 0.12,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: makeRoomSubmit
    });
    titleScene.add(makeRoomButton);

    const joinRoomButton = new ButtonUI({
        text: '部屋参加',
        x: 0.64,
        y: 0.3,
        height: 0.05,
        width: 0.12,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: joinRoomSubmit
    });
    titleScene.add(joinRoomButton);

    const cpuButton = new ButtonUI({
        text: 'CPU対戦',
        x: 0.78,
        y: 0.24,
        height: 0.05,
        width: 0.12,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: cpuButtonSubmit
    });
    titleScene.add(cpuButton);

    const ruleOverlay = new OverlayUI({
        x: 0,
        y: 0,
        height: 0.4,
        width: 0.8,
        visible: false
    });

    const ruleTitle = new TextUI({
        text: () => 'ルール',
        x: 0,
        y: -0.14,
        size: 0.06,
        colors: ['#ffffffff', '#000000ff', '#00000000'],
    });

    const ruleText = new TextUI({
        text: () => '駒の動きは通常の将棋と同じですが手番がありません。連続で\n何度も動かせますが動かした駒は一定時間動かせません。\n\nトライ勝利ルールを採用しています。自玉が敵玉の開始位置\n（先手なら5一、後手なら5九)に到達したら勝利となります。',
        x: -0.35,
        y: -0.06,
        size: 0.025,
        colors: ['#ffffffff', '#00000000', '#00000000'],
        position: 'left'
    });

    const closeRuleButton = new ButtonUI({
        text: '閉じる',
        x: 0,
        y: 0.16,
        width: 0.15,
        height: 0.05,
        color: '#3241c9',
        textSize: 0.032,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => { ruleOverlay.visible = false; }
    });

    ruleOverlay.add(ruleTitle);
    ruleOverlay.add(ruleText);
    ruleOverlay.add(closeRuleButton);

    const ctrlOverlay = new OverlayUI({
        x: 0,
        y: 0,
        height: 0.4,
        width: 0.4,
        visible: false
    });

    const ruleButton = new ButtonUI({
        text: 'ルール',
        x: 0.78,
        y: 0.02,
        height: 0.05,
        width: 0.12,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => {
            ruleOverlay.visible = true;
            ctrlOverlay.visible = false;
        }
    });
    titleScene.add(ruleOverlay);
    titleScene.add(ruleButton);

    const ctrlTitle = new TextUI({
        text: () => '操作方法',
        x: 0,
        y: -0.14,
        size: 0.06,
        colors: ['#ffffffff', '#000000ff', '#00000000'],
    });

    const ctrlText = new TextUI({
        text: () => 'マウスドラッグ - 駒の移動\n右ドラッグ - 成らず\n\nスペース - 歩\nQ - 香　W - 桂　E - 角\nA - 銀　S - 金　D - 飛',
        x: -0.15,
        y: -0.06,
        size: 0.025,
        colors: ['#ffffffff', '#00000000', '#00000000'],
        position: 'left'
    });

    const closeCtrlButton = new ButtonUI({
        text: '閉じる',
        x: 0,
        y: 0.16,
        width: 0.15,
        height: 0.05,
        color: '#3241c9',
        textSize: 0.032,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => { ctrlOverlay.visible = false; }
    });

    ctrlOverlay.add(ctrlTitle);
    ctrlOverlay.add(ctrlText);
    ctrlOverlay.add(closeCtrlButton);

    const ctrlButton = new ButtonUI({
        text: '操作方法',
        x: 0.64,
        y: 0.02,
        height: 0.05,
        width: 0.12,
        color: '#3241c9',
        textSize: 0.025,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => {
            ctrlOverlay.visible = true;
            ruleOverlay.visible = false;
        }
    });
    titleScene.add(ctrlOverlay);
    titleScene.add(ctrlButton);

    const charaSelectButton = new ButtonUI({
        text: 'キャラ変更',
        x: -0.58,
        y: 0.45,
        height: 0.06,
        width: 0.16,
        color: '#3241c9',
        textSize: 0.028,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => {
            titleCharacter.touchable = false;
            charaSelectSubmit();
            const cantouchCharacter = () => {
                titleCharacter.touchable = true;
            }
            document.addEventListener('mouseup', () => {
                cantouchCharacter();
                document.removeEventListener('mouseUp', cantouchCharacter)
            });
        }
    });

    titleScene.add(rankingOverlay);
    titleScene.add(charaSelectButton);
    titleScene.add(statusOverlay);
    titleScene.add(cpuLevelOverlay);

    if (loadNameInput) {
        const savedName = localStorage.getItem("playerName");
        if (savedName) {
            nameInput.value = savedName;
        }
    }

    roomIdInput.value = '';
    discordButton.style.display = "block";
    roomIdInput.style.display = "flex";
    nameInput.style.display = "flex";
    return titleScene;
}

// キャラクター選択シーン
export function createCharacterSelectScene(titleCharacter) {
    const playBGMOnce = () => {
        if (audioManager.currentBGM === null) {
            audioManager.playBGM('title');
        }
        document.removeEventListener('click', playBGMOnce);
    };
    document.addEventListener('click', playBGMOnce);

    let selectScene = new Scene();
    const backgroundImageUI = new BackgroundImageUI({ image: title_img });
    selectScene.add(backgroundImageUI);

    const selectTitle = new TextUI({
        text: () => "キャラクター選択",
        x: 0.4,
        y: -0.23,
        size: 0.06,
        colors: ["#bbdd44", "#000000", "#FFFFFF"]
    });

    const charactersPerRow = 3;
    const characterSize = 0.22;
    const padding = 0.08;
    const startX = -(charactersPerRow * (characterSize + padding) - characterSize - padding) / 2 + 0.4;
    const startY = -0.04;

    let overlayUI = new OverlayUI({
        x: 0.4,
        y: -0.07,
        width: 1,
        height: 0.45,
        color: "#111122bb"
    });

    let profileOverlayUI = new OverlayUI({
        x: 0.4,
        y: 0.38,
        width: 1,
        height: 0.15,
        color: "#111122bb"
    });

    const characterProfileText = new TextUI({
        text: () => characterInfo[selectedCharacterName].profile,
        x: -0.05,
        y: 0.35,
        size: 0.03,
        colors: ["#ffffff", "#000000", "#00000000"],
        textBaseline: 'middle',
        position: 'left'
    });

    const charaSubmitButton = new ButtonUI({
        text: "決定",
        x: 0.4,
        y: 0.22,
        height: 0.07,
        width: 0.15,
        color: '#3241c9',
        textSize: 0.03,
        textColors: ['#ffffffff', '#00000000', '#00000000'],
        onClick: () => {
            setScene(createTitleScene(titleCharacter, false));
        }
    });

    selectScene.add(overlayUI);
    selectScene.add(profileOverlayUI);
    selectScene.add(characterProfileText);
    selectScene.add(titleCharacter);
    selectScene.add(selectTitle);
    selectScene.add(charaSubmitButton);

    characterFiles.forEach((characterName, index) => {
        const row = Math.floor(index / charactersPerRow);
        const col = index % charactersPerRow;
        const x = startX + col * (characterSize + padding);
        const y = startY + row * (characterSize + padding);

        const faceOverlayUI = new OverlayUI({
            x: x,
            y: y,
            width: characterSize + 0.01,
            height: characterSize + 0.01,
            color: "#ffffff",
            touchable: true
        });

        const characterUI = new ImageUI({
            image: characterName + '_face',
            x: 0,
            y: 0,
            width: characterSize,
            height: characterSize
        });

        const characterNameText = new TextUI({
            text: () => characterInfo[characterName].name,
            x: 0,
            y: characterSize / 3 + 0.10,
            size: 0.03,
            colors: ["#bbdd44", "#000000", "#00000000"],
            textBaseline: 'bottom',
            position: 'center'
        });

        faceOverlayUI.onTouch = () => {
            faceOverlayUI.width = (characterSize + 0.01) * 1.1;
            faceOverlayUI.height = (characterSize + 0.01) * 1.1;
            characterUI.width = characterSize * 1.1;
            characterUI.height = characterSize * 1.1;
        }

        faceOverlayUI.unTouch = () => {
            faceOverlayUI.width = characterSize + 0.01;
            faceOverlayUI.height = characterSize + 0.01;
            characterUI.width = characterSize;
            characterUI.height = characterSize;
        }

        faceOverlayUI.onMouseDown = () => {
            setSelectedCharacterName(characterName);
            localStorage.setItem('selectedCharacter', characterName);
            titleCharacter.stopVideo();
            titleCharacter.image = characterName;
            titleCharacter.init();
            titleCharacter.videoElement[0].addEventListener('canplaythrough', () => {
                if (titleCharacter.playVideo(0)) {
                    titleCharacter.spawnVoiceText(0);
                }
            });
            characterProfileText.text = () => characterInfo[characterName].profile;
        };

        selectScene.add(faceOverlayUI);
        faceOverlayUI.add(characterUI);
        faceOverlayUI.add(characterNameText);
    });

    clearTitleHTML();
    discordButton.style.display = "block";

    return selectScene;
}

export function roomJoinFailed(scene) {
    const roomJoinFailedOverlay = new OverlayUI({
        x: 0.5,
        y: 0.24,
        width: 0.26,
        height: 0.04,
        color: '#187a1c'
    });
    const roomJoinFailedtext = new TextUI({
        text: () => "入室に失敗しました",
        x: 0,
        y: 0.002,
        size: 0.025,
        colors: ['#ffffff', '#00000000', '#00000000']
    });
    roomJoinFailedOverlay.add(roomJoinFailedtext);
    scene.add(roomJoinFailedOverlay);
    setTimeout(() => {
        scene.remove(roomJoinFailedOverlay);
    }, 2500);
}

function cpuButtonSubmit() {
    cpuLevelOverlay.visible = !cpuLevelOverlay.visible;
}

function cpuLevelSubmit(level) {
    setPlayerName(nameInput.value.trim());
    localStorage.setItem("playerName", playerName);
    if (playerName == "") setPlayerName("名無しの棋士");
    clearTitleHTML();
    const now = performance.now();
    setScene(createPlayScene([playerName], null, selectedCharacterName, [`CPUレベル${level}`], null, null, null, 'cpu', now, 'sente', { sente: MOVETIME, gote: MOVETIME }, false, level));
}

export function updateRanking() {
    if (serverStatus && serverStatus.topPlayers) {
        for (let i = 0; i < 10; i++) {
            if (serverStatus.topPlayers[i]) {
                rankingOverlay.childs[i].text = () => {
                    return `${i + 1}位:${Math.round(serverStatus.topPlayers[i].rating)} ${serverStatus.topPlayers[i].name}`;
                }
            } else {
                rankingOverlay.childs[i].text = () => ``;
            }
        }
    }
}