BACKGROUND = "#111111"



class UI {
  constructor(){ 
    this.playButton = null;
    this.backButton = null;
    this.loadingAngle = 0;
    this.matchingTextSize = 0.05;
    this.winloseTextSize = 0.16;
    this.titleTextSize = 0.08;
  }
  onMouseDown(pos){
    if(gameState == "waiting") this.playButton.mouseDown(pos);   
    if(gameState == "win" || gameState == "lose") this.backButton.mouseDown(pos);
  }
  onMouseMove(pos){
    if(gameState == "waiting") this.playButton.mouseMove(pos);
    if(gameState == "win" || gameState == "lose") this.backButton.mouseMove(pos);
  }
  onMouseUp(pos){
    if(gameState == "waiting") this.playButton.mouseUp(pos);
    if(gameState == "win" || gameState == "lose") this.backButton.mouseUp(pos);
  }

  init(){
    this.addPlayButton();
    this.addBackButton();
  }

  clickPlayButton(){
    if(gameState == "waiting"){ 
      socket.emit('requestMatch');
      gameState = "matching";
    }
  }

  clickBackButton(){
    if(gameState == "win" || gameState == "lose"){
      gameState = "waiting";
    }
  }

  drawMatchingUI(){
    // テキストを描画
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${canvas.height * this.matchingTextSize}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("マッチング中...", canvas.width / 2, canvas.height / 2.2);

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

  addPlayButton(){
    this.playButton= new Button(
      0.5,0.5,0.1,0.05,
      "プレイ",{"normal": "#3241c9", "hover": "#2330aa", "down": "#10103a"},
      () => {
        this.clickPlayButton();
      }
    );
  }

  addBackButton(){
    this.backButton= new Button(
      0.5,0.6,0.1,0.05,
      "戻る",{"normal": "#4cb332", "hover": "#37771d", "down": "#142c0a"},
      () => {
        this.clickBackButton();
      }
    );
  }

  drawTitle(){
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
      canvas.height * this.titleTextSize * 0.1);
  }

  drawWinUI(){
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
      canvas.height * this.winloseTextSize * 0.1);
  }

  drawLoseUI(){
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
      canvas.height * this.winloseTextSize * 0.1);
  }

  draw(){ 
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // 70%の透明度
    if(gameState == "waiting"){
      this.drawTitle();
      this.playButton.draw();
    }
    if(gameState == "matching"){
      this.drawMatchingUI();
    }
    if(gameState == "win"){
      this.drawWinUI();
      this.backButton.draw();
    }
    if(gameState == "lose"){
      this.drawLoseUI();
      this.backButton.draw();
    }
  }
}

