import { canvas, characterImages, gameManager, playerName, scene, selectedCharacterName, serverStatus, setPlayerName, setScene, setStatus, socket, userId, setSelectedCharacterName, titleBGM, battleBGM } from "./main.js";
import { Background, CharacterImageUI, CharacterInGameUI } from "./ui.js";
import { LoadingUI } from "./ui_loading.js";
import { TextUI } from "./ui_text.js";
import { characterFiles } from "./main.js"; // characterFilesをインポート
import { currentBGM, playBGM } from "./utils.js"; // playBGMをインポート

export class Scene {
  scale = 0;
  aspect = 3 / 4;
  offsetX = 0;
  offsetY = 0;
  htmls = [];
  ui_lists = [];
  lastFrameTime = performance.now();

  init() {

  }

  draw(ctx) {
    this.resize();
    ctx.fillStyle = '#101010';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    ctx.translate((window.innerWidth * 0.5), window.innerHeight * 0.5)
    this.ui_lists.forEach(ui => ui.draw(ctx, this.scale, this.aspect));
    ctx.restore();
  }

  add(ui) {
    this.ui_lists.push(ui);
  }

  remove(ui) {
    this.ui_lists = this.ui_lists.filter(u => u !== ui);
  }

  getGamePosition(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - window.innerWidth * 0.5) / this.scale;
    const y = (event.clientY - rect.top - window.innerHeight * 0.5) / this.scale;
    return { x: x, y: y }
  }

  touchCheck(event, str) {
    const pos = this.getGamePosition(event);
    this.ui_lists.forEach(ui => {
      ui.touchCheck(pos, str);
    });
  }

  resize() {
    this.scale = Math.max(0, Math.min(window.innerWidth * this.aspect, window.innerHeight));
    this.offsetX = Math.max(0, window.innerWidth * this.aspect - window.innerHeight) * 0.5 / this.aspect;
    this.offsetY = Math.max(0, window.innerHeight - window.innerWidth * this.aspect) * 0.5;
  }
}




const nameInputOverlay = document.getElementById("nameInputOverlay");
const charaSelectOverlay = document.getElementById("charaSelectOverlay");
const statusOverlay = document.getElementById("statusOverlay");

const nameInput = /** @type {HTMLInputElement} */ (document.getElementById("nameInput"));

const submitNameButton = document.getElementById("submitNameButton");
const charaSelectButton = document.getElementById("charaSelectButton");
const changeRating = document.getElementById("changeRating");

const resultOverlay = document.getElementById("resultOverlay");
const toTitleButton = document.getElementById("toTitleButton");

//タイトルシーン要素
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
    return `${Math.floor((gameManager.board.time - gameManager.board.starttime) / 1000)}`;
  },
  x: 0.0,
  y: -0.49,
  size: 0.08,
  colors: ["#ffffff", "#888888", "#00000000"],
  textBaseline: "top",
});

const matchingText = new TextUI({
  text: () => {
    return "マッチング中";
  },
  x: 0.4,
  y: 0.3,
  size: 0.05,
  colors: ["#ffffff", "#00000000", "#00000000"],
  position: 'center'
});
const loading = new LoadingUI({
  x: 0.4,
  y: 0.38,
  radius: 0.03,
});

let titleCharacter = new CharacterImageUI({
  image: null, // 初期表示はなし
  x: -0.55, // 中央に配置
  y: 0.15, // 適切なY座標に調整
  width: 0.7,
  height: 0.7,
  touchable: true
});

//タイトルシーン
export function createTitleScene() {
  let titleScene = new Scene();
  // 初回クリックでBGMを再生するためのイベントリスナー
  const playBGMOnce = () => {
    if (currentBGM === null) {
      playBGM(titleBGM);
    }

    canvas.removeEventListener('click', playBGMOnce); // イベントリスナーを解除
  };
  canvas.addEventListener('click', playBGMOnce);


  // 入力欄の文字数を制限するメソッド
  function limitInputLength(nameInput) {

    const MAX_LENGTH = 20; // 最大文字数（全角10文字分）
    let currentText = nameInput.value;
    let newText = "";
    let currentLength = 0;



    for (let i = 0; i < currentText.length; i++) {
      const char = currentText.charAt(i);
      const charLength = char.match(/[^\x01-\x7E\uFF61-\uFF9F]/) ? 2 : 1;

      if (currentLength + charLength > MAX_LENGTH) {
        break; // 制限を超えたらループを抜ける
      }

      newText += char;
      currentLength += charLength;
    }

    // 制限を超えた部分を削除
    if (currentText !== newText) {
      nameInput.value = newText;
    }
  }

  //オンライン対戦
  function handleNameSubmit() {
    setPlayerName(nameInput.value.trim());
    localStorage.setItem("playerName", playerName);
    if (playerName == "") setPlayerName("名無しの棋士");
    // マッチングを開始
    socket.emit("requestMatch", { name: playerName, characterName: selectedCharacterName, userId: userId });
    nameInputOverlay.style.display = "none";
    charaSelectOverlay.style.display = "none";
    titleScene.add(matchingText);
    titleScene.add(loading);
  }

  function charaSelectSubmit() {
    setScene(createCharacterSelectScene());
  }



  nameInput.addEventListener("input", () => { limitInputLength(nameInput); });
  submitNameButton.addEventListener("click", () => { handleNameSubmit(); });
  charaSelectButton.addEventListener("click", () => { charaSelectSubmit(); });

  titleCharacter.image = selectedCharacterName;
  titleScene.add(title);
  titleScene.add(onlineText);
  titleScene.add(titleCharacter);

  const savedName = localStorage.getItem("playerName");

  if (savedName) {
    nameInput.value = savedName;
  }
  nameInputOverlay.style.display = "flex";
  charaSelectOverlay.style.display = "flex";
  return titleScene;
}


// キャラクター選択シーン
export function createCharacterSelectScene() {
  let selectScene = new Scene();

  const selectTitle = new TextUI({
    text: () => "キャラクター選択",
    x: 0,
    y: -0.3,
    size: 0.06,
    colors: ["#bbdd44", "#000000", "#FFFFFF"]
  });
  selectScene.add(selectTitle);

  // キャラクター一覧を表示
  const charactersPerRow = 5; // 1行に表示するキャラクター数
  const characterSize = 0.15; // キャラクター画像の表示サイズ
  const startX = -0.32; // 開始X座標
  const startY = -0.14; // 開始Y座標
  const padding = 0.01; // キャラクター間の余白

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

    // キャラクターがクリックされたときの処理
    characterUI.onMouseDown = () => {
      setSelectedCharacterName(characterName); // 選択されたキャラクター名を設定
      localStorage.setItem('selectedCharacter', selectedCharacterName);
      console.log(`Selected character: ${selectedCharacterName}`);
      setScene(createTitleScene()); // タイトル画面に戻る
    };

    selectScene.add(characterUI);
  });

  nameInputOverlay.style.display = "none";
  charaSelectOverlay.style.display = "none";

  return selectScene;
}


//ゲームシーン
export function createPlayScene(playerName, opponentName, opponentCharacterName, teban, roomId, servertime, rating, opponentRating, cpu = false) {
  let playScene = new Scene();
  playBGM(battleBGM); // 対戦BGMを再生
  gameManager.setRoom(roomId, teban, servertime);

  const roundRating = Math.round(rating);
  const opponentRoundRating = Math.round(opponentRating);

  let playerNameUI = new TextUI({
    text: () => {
      return `${playerName}`;
    },
    x: -0.42,
    y: 0.4,
    size: 0.03,
    colors: ["#FFFFFF", "#000000"],
    textBaseline: 'bottom',
    position: 'right'
  })

  let playerRatingUI = new TextUI({
    text: () => {
      // main.jsで計算された表示用レーティングを使用
      return `レート: ${roundRating}`;
    },
    x: -0.42,
    y: 0.44, // プレイヤー名の下に表示するためにy座標を調整
    size: 0.025, // プレイヤー名より少し小さく
    colors: ["#FFFFFF", "#000000"],
    textBaseline: 'bottom', // プレイヤー名の下に揃える
    position: 'right'
  })

  let opponentNameUI = new TextUI({
    text: () => {
      return `${opponentName}`;
    },
    x: 0.42,
    y: -0.4,
    size: 0.03,
    colors: ["#FFFFFF", "#000000"],
    textBaseline: 'top',
    position: 'left'
  })

  let opponentRatingUI = new TextUI({
    text: () => {
      // main.jsで計算された表示用レーティングを使用
      return `レート: ${opponentRoundRating}`;
    },
    x: 0.42,
    y: -0.44, // プレイヤー名の下に表示するためにy座標を調整
    size: 0.025, // プレイヤー名より少し小さく
    colors: ["#FFFFFF", "#000000"],
    textBaseline: 'top', // プレイヤー名の下に揃える
    position: 'left'
  })

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
  playScene.add(playerCharacterUI); // プレイヤーのキャラクター画像UIをシーンに追加
  playScene.add(opponentCharacterUI); // 相手プレイヤーのキャラクター画像UIをシーンに追加
  playScene.add(gameManager.boardUI);
  playScene.add(playerNameUI);
  playScene.add(playerRatingUI); // レーティング表示UIを追加
  playScene.add(opponentNameUI)
  playScene.add(opponentRatingUI); // レーティング表示UIを追加
  playScene.add(timeText);



  return playScene;
}

export function backToTitle() {
  resultOverlay.style.display = "none";
  statusOverlay.style.display = "block";
  setScene(createTitleScene());
  playBGM(titleBGM);
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
}