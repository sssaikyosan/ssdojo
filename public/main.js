import { Keyboard } from "./keyboard.js";
import { GameManager } from "./game_manager.js";
import { Board } from './board.js';
import { createPlayScene, createTitleScene, endGame, Scene } from "./scene.js";
import { playSound } from "./utils.js";

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
export let userId = null;
export let serverStatus = { online: 0, roomCount: 0 };

export let playerRatingElement = null;
export let gamesPlayedElement = null;
/**@type {Keyboard} */
export let keyboard = null;

export let gameManager = null;

// ユニークなIDを生成する関数
function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function setScene(s) {
  scene = s;
}

export function setPlayerName(name) {
  playerName = name;
}

export function setStatus(rating, games) {
  if (playerRatingElement) {
    playerRatingElement.textContent = `レート: ${Math.round(rating)}`;
  }
  if (gamesPlayedElement) {
    gamesPlayedElement.textContent = `試合数: ${games}`;
  }
}

// 初期化関数
function init() {
  // キャンバスの初期化
  canvas = document.getElementById('shogiCanvas');
  //@ts-ignore
  // HTML要素の取得
  playerRatingElement = document.getElementById('playerRating');
  gamesPlayedElement = document.getElementById('gamesPlayedText');
  ctx = canvas.getContext('2d');
  keyboard = new Keyboard();

  // ユーザーIDの読み込みまたは生成
  userId = localStorage.getItem('shogiUserId');
  if (!userId) {
    userId = generateUniqueId(); // 後で実装する関数
    localStorage.setItem('shogiUserId', userId);
  }
  console.log(`User ID: ${userId}`); // 確認用

  // Socket.IOの初期化
  const socketUrl = window.location.hostname === 'localhost' ?
    'http://localhost:5000' :
    'https://ssdojo.net:5000';

  //@ts-ignore
  socket = io(socketUrl, { withCredentials: true });
  setupSocket();

  // イベントリスナーの追加
  addEventListeners();

  resizeCanvas();

  gameManager = new GameManager(socket);
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
  // ユーザーIDをサーバーに送信
  socket.emit('sendUserId', { userId: userId });

  // 待機人数の更新
  socket.on('serverStatus', (data) => {
    serverStatus = data;
  })
  // レーティングを受信
  socket.on('receiveRating', (data) => {
    setStatus(data.rating, data.games);
  });

  // マッチングが成立したときの処理
  socket.on('matchFound', (data) => {
    playSound("match");
    scene = createPlayScene(
      playerName,
      data.name,
      data.teban,
      data.roomId,
      data.servertime,
      data.rating,
      data.opponentRating
    );
  });

  // 新しい駒の移動を受信
  socket.on('newMove', (data) => {
    if (gameManager) {
      gameManager.receiveMove(data);
    }
  });

  // ゲーム終了を受信
  socket.on('endGame', (data) => {
    endGame(data);
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