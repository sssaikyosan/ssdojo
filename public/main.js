import { Keyboard } from "./keyboard.js";
import { GameManager } from "./game_manager.js";
import { Board } from './board.js';
import { Emitter } from './emitter.js'
import { createPlayScene, createTitleScene, Scene } from "./scene.js";

export let pieceImages = {};
export let canvas = null;
/** @type {CanvasRenderingContext2D} */
export let ctx = null;
export let emitter = null;
export let socket = null;
export let scene = null;
/**@type {Board} */
export let board = new Board();
export let playerName = "";
export let serverStatus = { online: 0, playing: 0 };
/**@type {Keyboard} */
export let keyboard = null;

export let gameManager = null;


export function setScene(s) {
  scene = s;
}

export function setPlayerName(name) {
  playerName = name;
}

export function setGameManager() {
  gameManager = new GameManager(socket, emitter);
}

export function resetGameManager() {
  gameManager = null;
}

// 初期化関数
function init() {
  // キャンバスの初期化
  canvas = document.getElementById('shogiCanvas');
  //@ts-ignore
  ctx = canvas.getContext('2d');

  emitter = new Emitter();
  keyboard = new Keyboard(emitter);

  // Socket.IOの初期化
  //@ts-ignore
  socket = io('https://ssdojo.net:5000', { withCredentials: true });
  setupSocket();

  // イベントリスナーの追加
  addEventListeners();

  resizeCanvas();

  gameManager = new GameManager(socket, emitter);
  addEventListeners();
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
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  canvas.addEventListener('mousedown', (event) => {
    scene.touchCheck(event, 'mousedown');
  })
  canvas.addEventListener('mousemove', (event) => {
    scene.touchCheck(event, 'mousemove');
  })
  canvas.addEventListener('mouseup', (event) => {
    if (event.button == 2) {
      scene.touchCheck(event, 'mouseup-right');
    } else {
      scene.touchCheck(event, 'mouseup');
    }
  })

  // 右クリックのデフォルト動作を無効にする
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  keyboard = new Keyboard();
}

function setupSocket() {
  // 待機人数の更新
  socket.on('serverStatus', (data) => {
    serverStatus = data;
  })

  // マッチングが成立したときの処理
  socket.on('matchFound', (data) => {
    console.log('matchFound', data.time);
    gameManager = new GameManager(socket, emitter);
    scene = createPlayScene(
      playerName,
      data.name,
      data.teban,
      data.roomId,
      data.servertime
    );
  });

  // 新しい駒の移動を受信
  socket.on('newMove', (data) => {
    scene = createResultScene(
      playerName,
      data.name,
      data.teban,
      data.roomId,
      data.servertime
    );
  });

  socket.on('endGame', (data) => {
    emitter.emit("endGame", data);
  });
}

// 画像の読み込み
const pieceTypes = ['pawn', 'lance', 'knight', 'silver', 'gold', 'king', 'king2', 'rook', 'bishop',
  'prom_pawn', 'prom_lance', 'prom_knight', 'prom_silver', 'horse', 'dragon'];

// 画像読み込みのPromiseを作成
const imagePromises = pieceTypes.map(type =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `/pieces/${type}.png`;
    img.onload = () => {
      pieceImages[type] = img;
      resolve();
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${type}.png`);
      reject(new Error(`Failed to load image: ${type}.png`));
    };
  })
);

function roop() {
  if (gameManager) {
    gameManager.update();
  }
  scene.draw(ctx);
  requestAnimationFrame(roop);
}

init();
function createResultScene(playerName, name, teban, roomId, servertime) {
  throw new Error("Function not implemented.");
}

