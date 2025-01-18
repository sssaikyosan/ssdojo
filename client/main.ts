import { Socket } from "socket.io";
import { HrTime } from "../share/type";
import { Move } from "./const";
import { Emitter } from "./emitter";
import { GameManager } from "./gameManager";
import { Keyboard } from "./keyboard";
import { PieceImageInit } from "./pieces";
import { createPlayScene, createTitleScene, Scene } from "./scene";
import { playSound } from "./sounds";
import { hrtime2time } from "./utils";

export type GameState = "title" | "matching" | "playing" | "result";

export let canvas: HTMLCanvasElement = null!;
export let ctx: CanvasRenderingContext2D = null!;
export let emitter: Emitter = null!;
export let keyboard: Keyboard = null!;
export let socket: Socket = null!;

export let gameManager: GameManager = null!;


export let scene: Scene = null!;
export let playerName = "";
export let serverStatus = { online: 0, playing: 0 };



export function setScene(s: Scene) {
  scene = s;
}

export function setPlayerName(name: string) {
  playerName = name;
}

PieceImageInit();

// 初期化関数
function init() {

  canvas = document.getElementById("shogiCanvas") as HTMLCanvasElement;
  ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  emitter = new Emitter();
  keyboard = new Keyboard(emitter);
  //@ts-ignore
  socket = io();
  // Socket.IOの初期化
  setupSocket();

  // イベントリスナーの追加
  addEventListeners();

  // キャンバスサイズ設定
  resizeCanvas();

  gameManager = new GameManager({
    socket: socket,
    emitter: emitter,
  });

  // シーンの初期化
  scene = createTitleScene();
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
  });
  canvas.addEventListener("mousemove", (event) => {
    scene.touchCheck(event, "mousemove");
  });
  canvas.addEventListener("mouseup", (event) => {
    if (event.button == 2) {
      scene.touchCheck(event, "mouseup-right");
    } else {
      scene.touchCheck(event, "mouseup");
    }
  });

  // 右クリックのデフォルト動作を無効にする
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  //キーボードのリスナーを追加
  keyboard.Init(canvas);
}

function setupSocket() {
  // 待機人数の更新
  socket.on("serverStatus", (data: { online: number, playing: number; }) => {
    serverStatus = data;
  });
  // マッチングが成立したときの処理
  socket.on("matchFound", (data: { name: string, teban: number, roomId: string, hrtime: [number, number]; }) => {
    console.log("matchFound", data.hrtime);
    if (gameManager.gameState == "matching") {
      gameManager.gameState = "playing";
      scene = createPlayScene(
        playerName,
        data.name,
        data.teban,
        data.roomId,
        hrtime2time(data.hrtime),
        performance.now()
      );
    }
    playSound("match");
  });

  // 駒の移動を受け取る
  socket.on("newMove", (data: {
    x: number, y: number, nx: number, ny: number,
    narazu: boolean,
    teban: number,
    hrtime: [number, number];
  }) => {
    console.log("newMove", data);
    const move: Move = {
      x: data.x,
      y: data.y,
      nx: data.nx,
      ny: data.ny,
      narazu: data.narazu,
      teban: data.teban,
      servertime: hrtime2time(data.hrtime),
    };
    gameManager.board.movePieceLocal(move);
  });
}

export function getTimeDiff(startTime: HrTime, endTime: HrTime) {
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
  if (gameManager.gameState == "playing") {
    gameManager.update();
  }
  scene.draw(ctx);
  requestAnimationFrame(roop);
}

init();
