// グローバル変数
const CELL_SIZE_RATIO = 0.09;
const KOMADAI_WIDTH_RATIO = 3;  // 駒台の幅の比率
const KOMADAI_HEIGHT_RATIO = 4;  // 駒台の高さの比率
const KOMADAI_PIECE_OFFSET = 0.8;  // 駒台の駒の比率
const LINEWIDTH = 2;

let pieceImages = {};
let canvas = null;
/** @type {CanvasRenderingContext2D} */
let ctx = null;
let socket = null;
let gameState = "waiting";
let ui = null;
let board = null;
let waitPlayerCount = 0;

// 初期化関数
function init() {
  // キャンバスの初期化
  canvas = document.getElementById('shogiCanvas');
  ctx = canvas.getContext('2d');
  
  // Socket.IOの初期化
  socket = io();
  setupSocket();

  // UIの初期化
  ui = new UI();

  // イベントリスナーの追加
  addEventListeners();
  
  ui.init();
  resizeCanvas();
  roop();
}

// キャンバスのリサイズ
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if(board){
    board.resize();
  }
}

// イベントリスナーを追加
function addEventListeners() {
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);

  // ウィンドウサイズ変更時のリスナーを追加
  window.addEventListener('resize', () => {
    resizeCanvas();
  });

  // 右クリックのデフォルト動作を無効にする
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

function getMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  return {x:mouseX,y:mouseY};
}

// マウスダウン時の処理
function onMouseDown(event) {
  const mousePos = getMousePosition(event);
  ui.onMouseDown(mousePos);
  if(gameState == "playing"){
    board.onMouseDown(mousePos);
  }
}

// マウスムーブ時の処理
function onMouseMove(event) {
  ui.onMouseMove(getMousePosition(event));
  if(gameState == "playing"){
    board.onMouseMove(getMousePosition(event));
  }
}

// マウスアップ時の処理
function onMouseUp(event) {  
  ui.onMouseUp(getMousePosition(event));
  if(gameState == "playing"){
    board.onMouseUp(getMousePosition(event),event.button == 2);
  }
}

function setupSocket(){
  // 待機人数の更新
  socket.on('changeWaitngPlayers', (data) => {
    waitPlayerCount = data.count;
  })

  // マッチングが成立したときの処理
  socket.on('matchFound', (data) => {
    console.log('matchFound',data.time);
    board = new Board(data.teban,data.roomId,data.time);
    board.init();
    board.resize();
    gameState = "playing";
  });

  socket.on('resign', (data) => {
    if(gameState === 'playing'){
      if(data.winner === board.teban){
        gameState = "win";
      }else{
        gameState = "lose";
      }
    }
  });

  // 新しい駒の移動を受信
  socket.on('newMove', (data) => {
    if(gameState == "playing"){
      board.newMove(data);
    }
  });

  // 新しい駒の配置を受信
  socket.on('newPut', (data) => {
    if(gameState == "playing"){
      board.newPut(data);
    }
  });
}

function getTimeDiff(startTime, endTime) {
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
  return [secondsDiff,nanosecondsDiff];
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


function roop(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if(gameState == "playing"||gameState == "win"||gameState == "lose"){
    board.ptime = performance.now();
    board.draw();
  }
  ui.draw();
  requestAnimationFrame(roop);
}

init();