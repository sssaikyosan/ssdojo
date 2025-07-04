import { Keyboard } from "./keyboard.js";
import { GameManager } from "./game_manager.js";
import { Board } from './board.js';
import { AudioManager } from "./audio_manager.js"; // audio_manager.jsからインポート
import { createTitleScene, nameInput, playCountText, ratingText, roomIdInput, roomJoinFailed, updateRanking } from "./scene_title.js";
import { createPlayScene, endGame } from "./scene_game.js";
import { createRoomScene, roomUpdate } from "./scene_room.js";
import { backToRoom, createRoomPlayScene, endRoomGame } from "./scene_roomgame.js";
import { CHARA_QUOTES, CHARACTER_FOLDER } from "./const.js";

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
export let playerName = "";
export let userId = null;
export let serverStatus = { online: 0, roomCount: 0, topPlayers: [] };
export let playerStatus = { playcount: 0, rating: 500 }

export let playerRatingElement = null;
export let gamesPlayedElement = null;
//@ts-ignore
/**@type {Keyboard} */
export let keyboard = null;
export let audioManager = new AudioManager();

export let gameManager = null;
export let characterProfiles = null;

// キャラクター画像フォルダ名のリスト (prof.jsonから抽出)
export const characterFiles = [ // exportを追加
  "rei", "aoi", "akira"
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
  // 現在のシーンが存在し、destroyメソッドがあれば呼び出す
  if (scene && scene.destroy && typeof scene.destroy === 'function') {
    scene.destroy();
  }
  scene = s;
}

export function setPlayerName(name) {
  playerName = name;
}

export function setStatus(rating, games) {
  playerStatus.playcount = games;
  playerStatus.rating = rating;

  playCountText.text = () => {
    return `試合数:${games}`
  }
  ratingText.text = () => {
    return `レート:${Math.round(rating)}`
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
  setScene(createTitleScene()); // タイトルシーン作成時に選択されたキャラクターを使用
  resizeHTML();
  roop();
}

// キャンバスのリサイズ
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function resizeHTML() {
  let target = 0;
  let offsetX = 0;
  let offsetY = 0;
  if (window.innerHeight > window.innerWidth * scene.aspect) {
    target = window.innerWidth * scene.aspect;
    offsetY = (window.innerHeight - target) / 2;
  } else {
    target = window.innerHeight;
    offsetX = (window.innerWidth - window.innerHeight / scene.aspect) / 2;
  }

  nameInput.style = `display: ${nameInput.style.display}; font-size:${(Math.floor(target * 0.03)).toString()}px; padding: 6px; position: absolute; left: ${(target * 0.5 * 16 / 9 + offsetX).toString()}px; bottom: ${(target * 0.05 + offsetY).toString()}px; width:${(target * 0.35).toString()}px; height: ${(target * 0.04).toString()}px; transform: translate(-50%, 0%);`;
  roomIdInput.style = `display: ${roomIdInput.style.display}; font-size:${(Math.floor(target * 0.025)).toString()}px; padding: 6px; position: absolute; right: ${(target * 0.26 * 16 / 9 + offsetX).toString()}px; bottom: ${(target * 0.18 + offsetY).toString()}px; width:${(target * 0.12).toString()}px; height: ${(target * 0.03).toString()}px; transform: translate(100%, 0%);`;
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
    resizeHTML();
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



  // 初期表示時にスライダーの値を現在の音量に設定
  if (bgmVolumeSlider instanceof HTMLInputElement) {
    bgmVolumeSlider.value = (audioManager.bgmVolume * 100).toString();
  }

  if (soundVolumeSlider instanceof HTMLInputElement) {
    soundVolumeSlider.value = (audioManager.soundVolume * 100).toString();
  }

  // 初期表示時にスライダーの値を現在の音量に設定
  if (voiceVolumeSlider instanceof HTMLInputElement) {
    voiceVolumeSlider.value = (audioManager.voiceVolume * 100).toString();
  }

  if (bgmVolumeSlider) {
    bgmVolumeSlider.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setBGMVolume(volume);
      }
    });
  }

  if (soundVolumeSlider) {
    soundVolumeSlider.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setSoundVolume(volume);
        audioManager.playSound('sound'); // 効果音を再生
        // 初期表示時にスライダーの値を現在の音量に設定

      }
    });
  }

  if (voiceVolumeSlider) {
    voiceVolumeSlider.addEventListener('input', (event) => {
      if (event.target instanceof HTMLInputElement) {
        const volume = parseInt(event.target.value, 10) / 100;
        audioManager.setVoiceVolume(volume);

        // キャラクターのランダムボイス再生（音量設定の確認用）

        // selectedCharacterNameがnullでないことを確認
        if (selectedCharacterName) {
          const randomIndex = Math.floor(Math.random() * CHARA_QUOTES[selectedCharacterName].length);
          const randomVoiceFile = `/${CHARACTER_FOLDER}/${selectedCharacterName}/voice${randomIndex + 1}.wav`;
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
    updateRanking();
    // ランキング表示を更新

  });

  // レーティングを受信
  socket.on('receiveRating', (data) => {
    setStatus(data.rating, data.games);
  });

  // マッチングが成立したときの処理
  socket.on('matchFound', (data) => {
    setScene(createPlayScene(
      playerName,
      data.name,
      data.characterName,
      data.teban,
      data.roomId,
      data.servertime,
      data.rating,
      data.opponentRating
    ));
  });

  socket.on("cancelMatch", () => {
    console.log("cancelMatch");
    setScene(createTitleScene());
  });

  socket.on('startRoomGame', (data) => {
    console.log(data);
    setScene(createRoomPlayScene(
      data.senteName,
      data.senteCharacter,
      data.goteName,
      data.goteCharacter,
      data.roomId,
      data.servertime,
      data.roomteban
    ));
  });

  // 新しい駒の移動を受信
  socket.on('newMove', (data) => {
    console.log("newMove");
    if (gameManager) {
      gameManager.receiveMove(data);
    }
  });

  socket.on('moveFailed', (data) => {
    console.log("nemoveFailed");
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
    }
  });

  // ゲーム終了を受信
  socket.on('endGame', (data) => {
    console.log('endGame');
    endGame(data);
  });

  socket.on('endRoomGame', (data) => {
    endRoomGame(data);
  });

  socket.on("roomJoined", (data) => {
    console.log("roomJoined");
    setScene(createRoomScene(data));
  });

  socket.on("roomJoinFailed", (data) => {
    setScene(createTitleScene());
    roomJoinFailed(scene);
  });

  socket.on("roomUpdate", (data) => {
    console.log("roomUpdate");
    roomUpdate(data);
  });

  socket.on("backToRoom", (data) => {
    backToRoom(data);
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
    img.src = `/${CHARACTER_FOLDER}/${file}/image.png`;
    img.onload = () => {
      const name = file; // 拡張子を除いたファイル名をキーとする
      characterImages[name] = img;
      resolve();
    };
    img.onerror = () => {
      console.error(`Failed to load image: /${CHARACTER_FOLDER}/${file}/image.png`);
      // 画像のロードに失敗してもPromiseは解決済みとする
      resolve();
    };
    const img_face = new Image();
    img_face.src = `/${CHARACTER_FOLDER}/${file}/image_face.png`;
    img_face.onload = () => {
      const name = file; // 拡張子を除いたファイル名をキーとする
      characterImages[name + '_face'] = img_face;
      resolve();
    };
    img_face.onerror = () => {
      console.error(`Failed to load image: /${CHARACTER_FOLDER}/${file}/image_face.png`);
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
  });