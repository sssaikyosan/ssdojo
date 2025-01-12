class Scene {
  init() { }
  draw() { }
  /**
   * 
   * @param {{x: number, y: number}} pos 
   */
  onMouseDown(pos) { }
  /**
   * 
   * @param {{x: number, y: number}} pos 
   */
  onMouseMove(pos) { }
  /**
   * 
   * @param {{x: number, y: number}} pos 
   */
  onMouseUp(pos) { }
  update() { }
}

class TitleScene extends Scene {
  constructor() {
    super();
    this.titleTextSize = 0.08;
    this.messageTextSize = 0.035;
    this.nameInputOverlay = document.getElementById('nameInputOverlay');
    this.nameInput = /**@type {HTMLInputElement}*/(document.getElementById('nameInput'));
    this.submitNameButton = document.getElementById('submitNameButton');
    this.submitNameButton.addEventListener('click', () => {
      this.handleNameSubmit();
    });

    // 入力欄のイベントリスナーを追加
    this.nameInput.addEventListener('input', () => {
      this.limitInputLength();
    });

    // LocalStorageから名前を取得
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      this.nameInput.value = savedName;
    }
    this.showNameInput();
  }

  // 入力欄の文字数を制限するメソッド
  limitInputLength() {
    const MAX_LENGTH = 20; // 最大文字数（全角10文字分）
    let currentText = this.nameInput.value;
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
      this.nameInput.value = newText;
    }
  }

  draw() {
    ctx.fillStyle = "#00000088";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTextWithDoubleOutline(
      "リアルタイム将棋",
      canvas.width / 2,
      canvas.height / 3,
      canvas.height * this.titleTextSize,
      "#c2a34f",
      "#000000",
      "#ffffff",
    );

    drawText(
      `オンライン: ${waitPlayerCount}人`,
      canvas.width / 2,
      canvas.height * 0.6,
      canvas.height * this.messageTextSize,
      "#ffffff",
    );
    drawText(
      `待機人数: ${waitPlayerCount}人`,
      canvas.width / 2,
      canvas.height * 0.65,
      canvas.height * this.messageTextSize,
      "#ffffff",
    );
  }

  showNameInput() {
    this.nameInputOverlay.style.display = 'block';
  }

  hideNameInput() {
    this.nameInputOverlay.style.display = 'none';
  }

  handleNameSubmit() {
    playerName = this.nameInput.value.trim();
    localStorage.setItem('playerName', playerName);
    if (playerName == "") playerName = "名無しの棋士";
    // マッチングを開始
    socket.emit('requestMatch', { name: playerName });
    this.hideNameInput();
    gameState = "matching";
    scene = new MatchingScene();
  }
}

class MatchingScene extends Scene {
  constructor() {
    super();
    this.loadingAngle = 0;
    this.matchingTextSize = 0.05;
  }
  draw() {
    // テキストを描画
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${canvas.height * this.matchingTextSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(`マッチング中... 待機${waitPlayerCount}人`, canvas.width / 2, canvas.height / 2.2);

    // ぐるぐるアニメーションを描画
    const radius = 30;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 50;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, this.loadingAngle, this.loadingAngle + Math.PI / 2);
    ctx.stroke();

    // 角度を更新
    this.loadingAngle += 0.05;
    if (this.loadingAngle > Math.PI * 2) {
      this.loadingAngle = 0;
    }
  }
}

class PlayScene extends Scene {
  nameSize = 0.03;

  constructor(playerName, opponentName) {
    super();
    this.playerName = playerName;
    this.opponentName = opponentName;
  }
  draw() {
    this.drawPlayerName();
    board.draw();
  }
  onMouseDown(pos) {
    board.onMouseDown(pos);
  }
  onMouseMove(pos) {
    board.onMouseMove(pos);
  }
  onMouseUp(pos) {
    board.onMouseUp(pos);
  }

  setPlayerName(playerName, opponentName) {
    this.playerName = playerName;
    this.opponentName = opponentName;
  }

  drawPlayerName() {
    drawText(
      this.playerName,
      board.offsetX - board.cellSize * 0.1,
      board.offsetY + board.cellSize * 9,
      canvas.height * this.nameSize,
      "#FFFFFF",
      'right',
      'bottom'
    )
    drawText(
      this.opponentName,
      board.offsetX + board.cellSize * 9.1,
      board.offsetY,
      canvas.height * this.nameSize,
      "#FFFFFF",
      'left',
      'top'
    )
  }
}

class ResultScene extends Scene {
  /**
   * 
   * @type {"win" | "lose"| "draw"} result 
   */
  constructor(result) {
    super();
    /**@type {typeof result} */
    this.result = result;
    this.winloseTextSize = 0.16;
    this.backButton = new Button(
      0.5, 0.6, 0.1, 0.05,
      "戻る", { "normal": "#4cb332", "hover": "#37771d", "down": "#142c0a" },
      () => {
        this.clickBackButton();
      }
    );
  }
  draw() {
    if (this.result == "win") {
      ctx.fillStyle = "#00000088";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawTextWithDoubleOutline(
        "勝利",
        canvas.width / 2,
        canvas.height / 3,
        canvas.height * this.winloseTextSize,
        "#ff6739",
        "#30140b",
        "#ffffff",
      );
    } else if (this.result == "lose") {
      ctx.fillStyle = "#00000066";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // テキストを描画
      drawTextWithDoubleOutline(
        "敗北",
        canvas.width / 2,
        canvas.height / 3,
        canvas.height * this.winloseTextSize,
        "#b639ff",
        "#270b36",
        "#ffffff",
      );
    }
    this.backButton.draw();
  }
  clickBackButton() {
    gameState = "title";
    scene = new TitleScene();
  }
  onMouseDown(pos) {
    this.backButton.mouseDown(pos);
  }
  onMouseMove(pos) {
    this.backButton.mouseMove(pos);
  }
  onMouseUp(pos) {
    this.backButton.mouseUp(pos);
  }
}