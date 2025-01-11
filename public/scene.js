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
    this.playButton = new Button(
      0.5, 0.5, 0.1, 0.05,
      "プレイ", { "normal": "#3241c9", "hover": "#2330aa", "down": "#10103a" },
      () => {
        this.clickPlayButton();
      }
    );
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

    ctx.fillText(`待機人数: ${waitPlayerCount}人`, canvas.width / 2, canvas.height / 1.5);
    this.playButton.draw();
  }

  clickPlayButton() {
    socket.emit('requestMatch');
    gameState = "matching";
    scene = new MatchingScene();
  }

  onMouseDown(pos) {
    this.playButton.mouseDown(pos);
  }
  onMouseMove(pos) {
    this.playButton.mouseMove(pos);
  }
  onMouseUp(pos) {
    this.playButton.mouseUp(pos);
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
  constructor() {
    super();
  }
  draw() {
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