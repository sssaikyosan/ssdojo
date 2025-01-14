import { SsTime } from "../share/type";
import { Board } from "./board";
import { Keyboard } from "./keyboard";
import { PieceImageInit } from "./pieces";
import { createPlayScene, createTitleScene, Scene } from "./scene";

export type GameState = "title" | "matching" | "playing" | "win" | "lose";

export let canvas: HTMLCanvasElement = null!;
export let ctx:CanvasRenderingContext2D = null!;
export let socket: import("socket.io").Socket = null!;
export let gameState:GameState = "title";
export let scene:Scene = null!;
export let board:Board = new Board();
export let playerName = "";
export let serverStatus = { online: 0, matching: 0 };
export let keyboard:Keyboard = null!;

export function setGameState(state:GameState) {
  gameState = state;
}

export function setScene(s:Scene) {
  scene = s;
}

export function setPlayerName(name:string){
  playerName = name;
}

export function setBoard(b:Board){
  board = b;
}

PieceImageInit();

// 初期化関数
function init() {
  // キャンバスの初期化
  canvas = document.getElementById("shogiCanvas") as any;
  //@ts-ignore
  ctx = canvas.getContext("2d");

  scene = createTitleScene();

  // Socket.IOの初期化
  //@ts-ignore
  socket = io();
  setupSocket();

  // イベントリスナーの追加
  addEventListeners();

  resizeCanvas();
  roop();
}

// キャンバスのリサイズ
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// イベントリスナーを追加
function addEventListeners() {
  // ウィンドウサイズ変更時のリスナーを追加
  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  canvas.addEventListener("mousedown", (event) => {
    scene.touchCheck(event, "mousedown");
  })
  canvas.addEventListener("mousemove", (event) => {
    scene.touchCheck(event, "mousemove");
  })
  canvas.addEventListener("mouseup", (event) => {
    if (event.button == 2) {
      scene.touchCheck(event, "mouseup-right");
    } else {
      scene.touchCheck(event, "mouseup");
    }
  })

  // 右クリックのデフォルト動作を無効にする
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  keyboard = new Keyboard();
}

function setupSocket() {
  // 待機人数の更新
  socket.on("serverStatus", (data) => {
    serverStatus = data;
  })

  // マッチングが成立したときの処理
  socket.on("matchFound", (data) => {
    console.log("matchFound", data.time);
    gameState = "playing";
    scene = createPlayScene(
      playerName,
      data.name,
      data.teban,
      data.roomId,
      data.time
    );
  });

  socket.on("resign", (data) => {
    if (gameState === "playing") {
      if (data.winner === board.teban) {
        gameState = "win";
      } else {
        gameState = "lose";
      }
    }
  });

  // 新しい駒の移動を受信
  socket.on("newMove", (data) => {
    if (gameState == "playing") {
      board.newMove(data);
    }
  });

  // 新しい駒の配置を受信
  socket.on("newPut", (data) => {
    if (gameState == "playing") {
      board.newPut(data);
    }
  });
}

export function getTimeDiff(startTime: SsTime, endTime: SsTime) {
  // startTimeとendTimeは [秒, ナノ秒] の形式
  const [startSeconds, startNanoseconds] = startTime;
  const [endSeconds, endNanoseconds] = endTime;

  // 秒の差分を計算
  let secondsDiff = endSeconds - startSeconds;

  // ナノ秒の差分を計算
  let nanosecondsDiff = endNanoseconds - startNanoseconds;

  // ナノ秒が負の場合、秒を1減らしてナノ秒を正に調整
  if (nanosecondsDiff < 0) {
    secondsDiff -= 1;
    nanosecondsDiff += 1e9; // 1秒 = 1,000,000,000ナノ秒
  }
  return [secondsDiff, nanosecondsDiff];
}

function roop() {
  board.ptime = performance.now();
  scene.draw(ctx);
  requestAnimationFrame(roop);
}

init();
