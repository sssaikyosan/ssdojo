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
export let socket = null; // Socket.IO 接続オブジェクト
export let scene = null; // scene変数はmain.jsで管理
export let playerName = "";
export let player_id = null; // 永続的なプレイヤーID
export let serverStatus = { topPlayers: [] };

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

// ストレージからキャラクターを読み込む関数
function loadOrSelectCharacter() {
  const storedCharacter = localStorage.getItem('selectedCharacter');
  if (storedCharacter && characterFiles.some(file => file === storedCharacter)) {
    selectedCharacterName = storedCharacter;
  } else {
    // ストレージにない場合、または無効な場合は0を設定
    selectedCharacterName = characterFiles[0];
    localStorage.setItem('selectedCharacter', selectedCharacterName);
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

export function setStatus(rating, total_games) {
  playCountText.text = () => {
    return `試合数:${total_games}`
  }
  ratingText.text = () => {
    return `レート:${Math.round(rating)}`
  }
}

export const matchingServerUrl = window.location.hostname === 'localhost' ?
  'https://localhost:5000' :
  'https://ssdojo.net:5000';

export function connectToServer() {
  if (socket && socket.connected) {
    socket.disconnect();
  }
  //@ts-ignore
  socket = io(matchingServerUrl, { withCredentials: true });
  setupSocket(); // マッチングサーバー用のイベントハンドラを設定
}

let isFirstLogin = true;

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
  player_id = localStorage.getItem('shogiUserId');
  if (!player_id) {
    player_id = 'create';
  }

  // キャラクターの読み込みまたは選択
  loadOrSelectCharacter();

  // Socket.IOの初期化 (最初はマッチングサーバーに接続)

  connectToServer();


  // イベントリスナーの追加
  addEventListeners();
  resizeCanvas();



  gameManager = new GameManager();

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
    if (!scene) return;
    scene.touchCheck(event, 'mousedown');
  })
  canvas.addEventListener('mousemove', (event) => {
    if (!scene) return;
    scene.touchCheck(event, 'mousemove');
  })
  canvas.addEventListener('mouseup', (event) => {
    if (!scene) return;
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

function reconnect() {

}

// Socket.IO イベントハンドラ設定関数
export function setupSocket() {
  // 既存のイベントハンドラを全て削除
  if (socket) {
    socket.removeAllListeners();
  }

  // ユーザーIDをサーバーに送信 (接続先に応じて適切なIDを送信する必要があるかもしれない)
  socket.on('connect', () => {
    socket.emit('sendUserId', { player_id: player_id });
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    // 切断理由に応じた処理（例: エラーメッセージ表示、タイトル画面に戻るなど）
    if (reason === 'io client disconnect') {
      console.log('Client initiated disconnect.');
    } else {
      console.error('Server initiated or network error disconnect.');
    }
  });


  // 待機人数の更新 (マッチングサーバーからのイベント)
  socket.on('serverStatus', (data) => {
    serverStatus = data;
    updateRanking();
    // ランキング表示を更新
  });

  // 簡単ログイン成功 (マッチングサーバーからのイベント)
  socket.on('easyLogin', (data) => {
    player_id = data.player_id;
    localStorage.setItem('shogiUserId', player_id);
    setStatus(data.rating, data.total_games);
    setScene(createTitleScene());
    if (isFirstLogin) {
      resizeHTML();
      roop();
      isFirstLogin = false;
    }
  });

  // レーティングを受信 (マッチングサーバーからのイベント)
  socket.on('receiveRating', (data) => {
    setStatus(data.rating, data.total_games);
  });

  // マッチングが成立したときの処理 (マッチングサーバーからのイベント)
  socket.on('matchFound', (data) => {
    // マッチングサーバーとの接続を切断
    if (socket && socket.connected) {
      socket.disconnect();
    }

    // ゲームサーバーのアドレスを取得
    const gameServerAddress = data.gameServerAddress;

    // ゲームサーバーに新しく接続
    //@ts-ignore
    socket = io(gameServerAddress, { withCredentials: true });

    // ゲームサーバー用のイベントハンドラを設定
    setupGameSocketHandlers(data); // ゲームサーバー接続後のハンドラを設定する新しい関数を呼び出す
  });

  // マッチングキャンセル (マッチングサーバーからのイベント)
  socket.on("cancelMatch", () => {
    setScene(createTitleScene());
  });

  socket.on("roomCreated", (data) => {
    if (socket && socket.connected) {
      socket.disconnect();
    }

    // ゲームサーバーのアドレスを取得
    const gameServerAddress = data.gameServerAddress;

    // ゲームサーバーに新しく接続
    //@ts-ignore
    socket = io(gameServerAddress, { withCredentials: true });

    // ゲームサーバー用のイベントハンドラを設定
    setupGameSocketHandlers(data); // ゲームサーバー接続後のハンドラを設定する新しい関数を呼び出す
  });

  socket.on("roomFound", (data) => {
    if (socket && socket.connected) {
      socket.disconnect();
    }

    // ゲームサーバーのアドレスを取得
    const gameServerAddress = data.gameServerAddress;

    // ゲームサーバーに新しく接続
    //@ts-ignore
    socket = io(gameServerAddress, { withCredentials: true });

    // ゲームサーバー用のイベントハンドラを設定
    setupGameSocketHandlers(data, true); // ゲームサーバー接続後のハンドラを設定する新しい関数を呼び出す
  });

  socket.on("roomJoinFailed", (data) => {
    setScene(createTitleScene());
    roomJoinFailed(scene);
  });
}

// ゲームサーバー接続後の Socket.IO イベントハンドラ設定関数
function setupGameSocketHandlers(roomFoundData, privateroom = false) {
  // 既存のイベントハンドラを全て削除 (マッチングサーバー用のハンドラをクリア)
  if (socket) {
    socket.removeAllListeners();
  }

  socket.on('connect', () => {
    // ゲームサーバーに接続したら、ゲーム参加に必要な情報を送信
    // 例: プレイヤーの永続ID, ルームID
    if (privateroom) {
      socket.emit('joinRoom', {
        player_id: player_id, // 永続的なプレイヤーID
        roomId: roomFoundData.roomId,
        name: playerName,
        characterName: selectedCharacterName
      });
    } else {
      socket.emit('joinRatingRoom', {
        player_id: player_id, // 永続的なプレイヤーID
        roomId: roomFoundData.roomId,
        name: playerName,
        characterName: selectedCharacterName
      });
    }

  });

  socket.on('disconnect', (reason) => {
    setScene(createTitleScene());
  });

  // ゲームサーバーからのイベントハンドラを設定
  // 例:
  socket.on('startRatingGame', (data) => {
    setScene(createPlayScene(
      data.senteName,
      data.senteRating,
      data.senteCharacter,
      data.goteName,
      data.goteRating,
      data.goteCharacter,
      data.roomId,
      data.servertime,
      data.roomteban, // 自分の手番
    ));
  });

  socket.on('startRoomGame', (data) => {
    setScene(createRoomPlayScene(
      data.senteName,
      data.senteCharacter,
      data.goteName,
      data.goteCharacter,
      data.roomId,
      data.servertime,
      data.roomteban,
      data.moveTime,
      data.pawnLimit4thRank
    ));
  });

  // 既存のゲーム関連イベントハンドラをここに移動または再定義
  // 例:
  socket.on('newMove', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.removeReserved(data);
      gameManager.receiveMove(data);
    }
  });

  socket.on('moveFailed', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
    }
  });

  socket.on('moveReserved', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
      gameManager.boardUI.moveReserved(data);
    }
  });

  socket.on('reservedMoveFailed', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
      gameManager.boardUI.removeSameReserved(data);
    }
  });

  socket.on('endGame', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
    }
    endGame(data);
  });

  socket.on('endRoomGame', (data) => {
    if (gameManager && gameManager.boardUI) {
      gameManager.boardUI.lastsend = null;
    }
    endRoomGame(data);
  });

  socket.on("backToRoom", (data) => {
    backToRoom(data);
  });

  socket.on("roomUpdate", (data) => {
    roomUpdate(data);
  });

  socket.on("roomJoined", (data) => {
    setScene(createRoomScene(data));
  });

  socket.on("roomJoinFailed", (data) => {
    setScene(createTitleScene());
    roomJoinFailed(scene);
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