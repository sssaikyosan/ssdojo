import { CPU } from "./cpu";
import { canvas, emitter, gameManager, playerName, serverStatus, setPlayerName, setScene, socket } from "./main";
import { Background, UI } from "./ui";
import { LoadingUI } from "./ui_loading";
import { TextUI } from "./ui_text";

export class Scene {
  scale: number = 0;
  aspect: number = 3 / 4;
  offsetX: number = 0;
  offsetY: number = 0;
  htmls: HTMLElement[] = [];
  ui_lists: UI[] = [];
  lastFrameTime: number = performance.now();

  init() { }

  draw(ctx: CanvasRenderingContext2D) {
    this.resize();
    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    ctx.translate((window.innerWidth * 0.5), window.innerHeight * 0.5);
    this.ui_lists.forEach(ui => ui.draw(ctx, this.scale));
    ctx.restore();
  }

  add(ui: UI) {
    this.ui_lists.push(ui);
  }

  remove(ui: UI) {
    this.ui_lists = this.ui_lists.filter(u => u !== ui);
  }

  getGamePosition(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - window.innerWidth * 0.5) / this.scale;
    const y = (event.clientY - rect.top - window.innerHeight * 0.5) / this.scale;
    return { x: x, y: y };
  }

  touchCheck(event: MouseEvent, str: string) {
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

  // update() { }
}



const nameInputOverlay = document.getElementById("nameInputOverlay") as HTMLElement;
const nameInput = document.getElementById("nameInput") as HTMLInputElement;
const submitNameButton = document.getElementById("submitNameButton") as HTMLButtonElement;
const cpuButton = document.getElementById("cpuButton") as HTMLButtonElement;

const resultOverlay = document.getElementById("resultOverlay") as HTMLElement;
const toTitleButton = document.getElementById("toTitleButton") as HTMLButtonElement;

//タイトルシーン要素
const title = new TextUI({
  text: () => "リアルタイム将棋",
  x: 0,
  y: -0.25,
  size: 0.12,
  colors: ["#c2a34f", "#000000", "#ffffff"]
});
const onlineText = new TextUI({
  text: () => `オンライン: ${serverStatus["online"]}人`,
  x: 0,
  y: 0.25,
  size: 0.035,
  colors: ["#ffffff", "#00000000", "#00000000"]
});

const playingText = new TextUI({
  text: () => `プレイ中: ${serverStatus["playing"]}人`,
  x: 0,
  y: 0.30,
  size: 0.035,
  colors: ["#ffffff", "#00000000", "#00000000"]
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
    return `${Math.floor(gameManager.board.time / 1000)}`;
  },
  x: 0.0,
  y: -0.49,
  size: 0.08,
  colors: ["#ffffff", "#888888", "#00000000"],
  textBaseline: "top",
});

const matchingText = new TextUI({
  text: () => {
    return "マッチング中...";
  },
  x: 0.0,
  y: 0.0,
  size: 0.05,
  colors: ["#ffffff", "#00000000", "#00000000"]
});
const loading = new LoadingUI({
  x: 0.0,
  y: 0.1,
  radius: 0.05,
});

//タイトルシーン
export function createTitleScene() {
  let titleScene = new Scene();
  // 入力欄の文字数を制限するメソッド
  function limitInputLength(nameInput: HTMLInputElement) {

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

  //名前入力オーバーレイ
  function handleNameSubmit(nameInputOverlay: HTMLElement, nameInput: HTMLInputElement) {
    setPlayerName(nameInput.value.trim());
    localStorage.setItem("playerName", playerName);
    if (playerName == "") setPlayerName("名無しの棋士");
    // マッチングを開始
    socket.emit("requestMatch", { name: playerName });
    nameInputOverlay.style.display = "none";
    gameManager.gameState = "matching";
    titleScene.add(matchingText);
    titleScene.add(loading);
  }
  //名前入力オーバーレイ
  function handleCPUSubmit(nameInputOverlay: HTMLElement, nameInput: HTMLInputElement) {
    setPlayerName(nameInput.value.trim());
    localStorage.setItem("playerName", playerName);
    if (playerName == "") setPlayerName("名無しの棋士");

    nameInputOverlay.style.display = "none";
    gameManager.gameState = "playing";
    setScene(createPlayScene(playerName, "CPU", 0, "0", 0, 0, 1));
  }

  nameInput.addEventListener("input", () => { limitInputLength(nameInput); });
  submitNameButton.addEventListener("click", () => { handleNameSubmit(nameInputOverlay, nameInput); });
  cpuButton.addEventListener("click", () => { handleCPUSubmit(nameInputOverlay, nameInput); });

  titleScene.add(title);
  titleScene.add(onlineText);
  titleScene.add(playingText);

  const savedName = localStorage.getItem("playerName");
  if (savedName) nameInput.value = savedName;
  nameInputOverlay.style.display = "block";
  return titleScene;
}

//ゲームシーン
export function createPlayScene(
  playerName: string,
  opponentName: string,
  teban: number,
  roomId: string,
  servertime: number,
  time: number,
  cpu: number = -1
) {
  const playScene = new Scene();
  if (cpu === -1) {
    gameManager.Init(roomId, teban, null, servertime, time);
  } else {
    const now = performance.now();
    const ai = new CPU();
    gameManager.Init("CPUroom", 1, ai, now, now);
    ai.init(gameManager.board, -1, now);

  }

  //プレイヤー名
  const playerNameUI = new TextUI({
    text: () => {
      return `${playerName}`;
    },
    x: -0.42,
    y: 0.4,
    size: 0.03,
    colors: ["#ffffff", "#00000000", "#00000000"],
    textBaseline: "bottom",
    position: "right"
  });

  //対戦相手名
  const opponentNameUI = new TextUI({
    text: () => {
      return `${opponentName}`;
    },
    x: 0.42,
    y: -0.4,
    size: 0.03,
    colors: ["#ffffff", "#00000000", "#00000000"],
    textBaseline: "top",
    position: "left"
  });


  playScene.add(gameManager.boardUI);
  playScene.add(playerNameUI);
  playScene.add(opponentNameUI);
  playScene.add(timeText);


  function backToTitle() {
    resultOverlay.style.display = "none";
    gameManager.gameState = "title";
    setScene(createTitleScene());
  }

  //ゲームマネージャーのイベントを受け取る
  emitter.on("endGame", (result: number) => {
    socket.emit("leaveRoom", { roomId: gameManager.roomId });
    gameManager.gameState = "result";
    playScene.add(background);
    if (result === gameManager.teban) {
      playScene.add(winText);
    } else {
      playScene.add(loseText);
    }
    resultOverlay.style.display = "block";
    toTitleButton.addEventListener("click", () => { backToTitle(); });
  });

  return playScene;
}