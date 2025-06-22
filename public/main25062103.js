import { Keyboard } from "./keyboard.js";
import { GameManager } from "./game_manager.js";
import { Board } from './board.js';
import { AudioManager } from "./audio_manager.js"; // audio_manager.jsからインポート
import { createTitleScene } from "./scene_title.js";
import { createPlayScene, endGame } from "./scene_game.js";

// 初期化フラグ
let isInitialized = false;

export let pieceImages = {};
export let characterImages = {}; // キャラクター画像用オブジェクトを追加
export let canvas = null;
/** @type {CanvasRenderingContext2D} */
export let ctx = null;
export let emitter = null;
export let socket = null;
export let scene = null; // scene変数はmain.jsで管理
//@type {Board}
export let board = new Board();
export let playerName = "";
export let userId = null;
export let serverStatus = { online: 0, roomCount: 0, topPlayers: [] };

export let playerRatingElement = null;
export let gamesPlayedElement = null;
/**@type {Keyboard} */
export let keyboard = null;
export let audioManager = new AudioManager();

export let gameManager = null;
export let characterProfiles = null;

// キャラクター画像フォルダ名のリスト (prof.jsonから抽出)
export const characterFiles = [ // exportを追加
  "0001_rei", "0002_karen", "0003_mifuyu", "0004_kureha", "0005_setsuna",
  "0006_kirisaki", "0007_sylvie", "0008_red", "0009_hawk", "0010_shizuru"
];

export let selectedCharacterName = null; // 選択されたキャラクターの名前

// selectedCharacterNameを設定する関数を追加
export function setSelectedCharacterName(name) {
  selectedCharacterName = name;
}

export const title_img = new Image(1920, 1080);
title_img.src = '/images/title.png';

export const battle_img = new Image(1920, 1080);
battle_img.src = '/images/battle.png';



// ユニークなIDを生成する関数
function generateUniqueId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ストレージからキャラクターを読み込む、またはランダムに選択する関数
function loadOrSelectCharacter() {
  const storedCharacter = localStorage.getItem('selectedCharacter');
  if (storedCharacter && characterFiles.some(file => file === storedCharacter)) {
    selectedCharacterName = storedCharacter;
    console.log(`Loaded character from storage: ${selectedCharacterName}`);
  } else {
    // ストレージにない場合、または無効な場合はランダムに選択
    const randomIndex = Math.floor(Math.random() * characterFiles.length);
    selectedCharacterName = characterFiles[randomIndex];
    localStorage.setItem('selectedCharacter', selectedCharacterName);
    console.log(`Randomly selected character: ${selectedCharacterName}`);
  }
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
  // 初期化済みであれば何もしない
  if (isInitialized) {
    console.warn("init関数が複数回呼び出されましたが、二重初期化を防ぎました。");
    return;
  }
  isInitialized = true;
  // キャンバスの初期化
  canvas = document.getElementById('shogiCanvas');
  //@ts-ignore
  // HTML要素の取得
  playerRatingElement = document.getElementById('playerRating');
  gamesPlayedElement = document.getElementById('gamesPlayedText');
  ctx = canvas.getContext('2d');
  keyboard = new Keyboard();
  keyboard.init(canvas);
  audioManager.Init();

  // ユーザーIDの読み込みまたは生成
  userId = localStorage.getItem('shogiUserId');
  if (!userId) {
    userId = generateUniqueId(); // 後で実装する関数
    localStorage.setItem('shogiUserId', userId);
  }

  // キャラクターの読み込みまたは選択
  loadOrSelectCharacter();

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
  scene = createTitleScene(); // タイトルシーン作成時に選択されたキャラクターを使用
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
    // シーンのリサイズ処理を呼び出す
    if (scene && scene.resize) {
      scene.resize({ scale: 1 }); // 仮のスケール値
    }
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

  // 音量スライダーのイベントリスナーを追加
  const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
  const soundVolumeSlider = document.getElementById('soundVolumeSlider');
  const voiceVolumeSlider = document.getElementById('voiceVolumeSlider');


  if (bgmVolumeSlider) {
    bgmVolumeSlider.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setBGMVolume(volume);
      }
    });
  }

  if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setSoundVolume(volume);
      }
    });
    soundVolumeSlider.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement) {
        audioManager.playSound('sound'); // 効果音を再生
      }
    });
  }

  if (voiceVolumeSlider) {
    voiceVolumeSlider.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setVoiceVolume(volume);
        // キャラクターのランダムボイス再生
        const randomIndex = Math.floor(Math.random() * 3);
        // selectedCharacterNameがnullでないことを確認
        if (selectedCharacterName) {
          const randomVoiceFile = `/characters/${selectedCharacterName}/voice00${randomIndex + 1}.wav`;
          audioManager.playVoice(randomVoiceFile);
        }
      }
    });
  }

  // 設定ボタンのイベントリスナーを追加
  const settingsButton = document.getElementById('settingsButton');
  const volumeOverlay = document.getElementById('volumeOverlay');

  if (settingsButton && volumeOverlay) {
    settingsButton.addEventListener('click', () => {
      if (volumeOverlay.style.display === 'none') {
        volumeOverlay.style.display = 'flex';
      } else {
        volumeOverlay.style.display = 'none';
      }
    });
  }
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
    scene = createPlayScene(
      playerName,
      data.name,
      data.characterName,
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

// 駒画像読み込みのPromiseを作成
const pieceImagePromises = pieceTypes.map(type =>
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

// キャラクター画像読み込みのPromiseを作成
const characterImagePromises = characterFiles.map(file =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.src = `/characters/${file}/image.png`;
    img.onload = () => {
      const name = file; // 拡張子を除いたファイル名をキーとする
      characterImages[name] = img;
      resolve();
    };
    img.onerror = () => {
      console.error(`Failed to load image: /characters/${file}/image.png`);
      // 画像のロードに失敗してもPromiseは解決済みとする
      resolve();
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

// 全ての画像読み込みが完了したら初期化処理を実行
Promise.all([...pieceImagePromises, ...characterImagePromises])
  .then(() => {
    init(); // 画像読み込み完了後にinitを呼び出す
  })
  .catch(error => {
    console.error("画像の読み込み中にエラーが発生しました:", error);
    // エラーハンドリング: 例としてエラーメッセージを表示するなど
  });