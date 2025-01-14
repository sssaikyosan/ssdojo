class Scene {
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

  update() {
    const p = performance.now();
    this.ui_lists.forEach(ui => ui.eventlist['update'](p - this.lastFrameTime));
    this.lastFrameTime = p;
    requestAnimationFrame(this.update);
  }
}






//タイトルシーン
function createTitleScene() {
  // 入力欄の文字数を制限するメソッド
  function limitInputLength(nameInput) {
    const MAX_LENGTH = 20; // 最大文字数（全角10文字分）
    let currentText = nameInput.value;
    let newText = '';
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
  function handleNameSubmit(nameInputOverlay, nameInput) {
    playerName = nameInput.value.trim();
    localStorage.setItem('playerName', playerName);
    if (playerName == "") playerName = "名無しの棋士";
    // マッチングを開始
    socket.emit('requestMatch', { name: playerName });
    nameInputOverlay.style.display = 'none';
    gameState = "matching";
    scene = createMatchingScene();
  }

  let titleScene = new Scene();
  let title = new TextUI({
    text: () => {
      return "リアルタイム将棋";
    },
    x: 0,
    y: -0.25,
    size: 0.12,
    colors: ["#c2a34f", "#000000", "#ffffff"]
  });
  let onlineText = new TextUI({
    text: () => {
      return `オンライン: ${serverStatus['online']}人`;
    },
    x: 0,
    y: 0.15,
    size: 0.035,
    colors: ["#ffffff"]
  });
  let matchingText = new TextUI({
    text: () => {
      return `待機人数: ${serverStatus['matching']}人`;
    },
    x: 0,
    y: 0.2,
    size: 0.035,
    colors: ["#ffffff"]
  });

  let nameInputOverlay = document.getElementById('nameInputOverlay');
  let nameInput = /**@type {HTMLInputElement}*/(document.getElementById('nameInput'));
  let submitNameButton = document.getElementById('submitNameButton');
  nameInput.addEventListener('input', () => { limitInputLength(nameInput); });
  submitNameButton.addEventListener('click', () => { handleNameSubmit(nameInputOverlay, nameInput); });


  titleScene.add(title);
  titleScene.add(onlineText);
  titleScene.add(matchingText);

  const savedName = localStorage.getItem('playerName');
  if (savedName) nameInput.value = savedName;
  nameInputOverlay.style.display = 'block';
  return titleScene;
}

//マッチングシーン
function createMatchingScene() {
  let matchingScene = new Scene();
  let matchingText = new TextUI({
    text: () => {
      return `マッチング中... 待機${serverStatus['matching']}人`;
    },
    x: 0.0,
    y: 0.0,
    size: 0.05,
    colors: ["#ffffff"]
  });
  let loading = new LoadingUI({
    x: 0.0,
    y: 0.1,
    scale: 0.05,
    radius: 0.05,
  });
  matchingScene.add(matchingText);
  matchingScene.add(loading);
  return matchingScene;
}


//ゲームシーン
function createPlayScene(playerName, opponentName, teban, roomId, time) {
  let playScene = new Scene();
  board = new Board();
  board.init(teban, roomId, time);
  let boardUI = new BoardUI({
    board: board,
    x: 0.0,
    y: 0.0,
  });
  keyboard.init(board, boardUI, canvas);
  let playerNameUI = new TextUI({
    text: () => {
      return `${playerName}`;
    },
    x: -0.42,
    y: 0.4,
    size: 0.03,
    colors: ["#FFFFFF"],
    textBaseline: 'bottom',
    position: 'right'
  })
  let opponentNameUI = new TextUI({
    text: () => {
      return `${opponentName}`;
    },
    x: 0.42,
    y: -0.4,
    size: 0.03,
    colors: ["#FFFFFF"],
    textBaseline: 'top',
    position: 'left'
  })

  playScene.add(boardUI);
  playScene.add(playerNameUI);
  playScene.add(opponentNameUI);

  return playScene;
}


//勝敗結果シーン
function createResultScene(result) {
  function backToTitle(resultOverlay) {
    resultOverlay.style.display = 'none';
    gameState = "waiting";
    scene = createTitleScene();
  }

  let resultScene = new Scene();
  let boardUI = new BoardUI({
    board: board,
    x: 0.0,
    y: 0.0,
    touchable: false,
  });
  let background = new Background({
    x: 0.0,
    y: 0.0,
    width: 1.0,
    height: 1.0,
    color: "#00000070",
  });
  let resultText = null;
  if (result == "win") {
    resultText = new TextUI({
      text: () => {
        return "勝利";
      },
      x: 0.0,
      y: -0.2,
      size: 0.2,
      colors: ["#ff6739", "#30140b", "#ffffff"]
    })
  } else if (result == "lose") {
    resultText = new TextUI({
      text: () => {
        return "敗北";
      },
      x: 0.0,
      y: -0.2,
      size: 0.2,
      colors: ["#b639ff", "#270b36", "#ffffff"]
    })
  }
  resultScene.add(boardUI);
  resultScene.add(background);
  resultScene.add(resultText);

  let resultOverlay = document.getElementById('resultOverlay');
  let toTitleButton = document.getElementById('toTitleButton');
  resultOverlay.style.display = 'block';
  toTitleButton.addEventListener('click', () => { backToTitle(resultOverlay); });

  return resultScene;
}