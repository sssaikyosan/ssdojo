class Button {
  constructor(x, y, width, height, text, colors, onClick) {
    this.x = x;  // 比率から実際の座標に変換
    this.y = y; // 比率から実際の座標に変換
    this.width = width;
    this.height = height;
    this.text = text;
    this.colors = colors;
    this.onClick = onClick;
    this.state = 'normal'; // ボタンの状態（normal, hover, down）
  }

  draw() {
    const x = this.x * canvas.width;
    const y = this.y * canvas.height;
    const width = this.width * canvas.width;
    const height = this.height * canvas.height;
    const radius = height * 0.1;
    const line = height * 0.05;

    // ボタンの背景を描画
    this.drawRoundedButton(x, y, width, height, radius, this.colors[this.state], darkenColor(this.colors[this.state], 0.6), line);

    drawTextWithOutline(this.text, x, y, this.height * canvas.height * 0.6, '#FFFFFF', '#000000', 2);
  }

  mouseDown(pos) {
    if (this.isHovered(pos)) {
      this.state = 'down';
    }
    this.draw();
  }

  mouseMove(pos) {
    if (this.isHovered(pos)) {
      if (this.state == "normal") {
        this.state = 'hover';
      }
    } else {
      this.state = 'normal';
    }
    this.draw();
  }

  mouseUp(pos) {
    if (this.isHovered(pos)) {
      if (this.state == "down") {
        this.onClick();
      }
      this.state = 'hover';
    } else {
      this.state = 'normal';
    }
    this.draw();
  }

  isHovered(pos) {
    let width = this.width * canvas.width;
    let height = this.height * canvas.height;
    let x = this.x * canvas.width - width / 2;
    let y = this.y * canvas.height - height / 2;
    return pos.x >= x && pos.x <= x + width &&
      pos.y >= y && pos.y <= y + height;
  }

  drawRoundedButton(x, y, width, height, radius, fillColor, strokeColor, strokeWidth) {
    ctx.save(); // 現在の状態を保存

    // 角丸四角形のパスを作成
    ctx.beginPath();
    ctx.moveTo(x + radius, y - height / 2);
    ctx.arcTo(x + width / 2, y - height / 2, x + width / 2, y + height / 2, radius);
    ctx.arcTo(x + width / 2, y + height / 2, x - width / 2, y + height / 2, radius);
    ctx.arcTo(x - width / 2, y + height / 2, x - width / 2, y - height / 2, radius);
    ctx.arcTo(x - width / 2, y - height / 2, x + width / 2, y - height / 2, radius);
    ctx.closePath();

    // ボタンの塗りつぶし
    ctx.fillStyle = fillColor;
    ctx.fill();

    // ボタンの縁取り
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    ctx.restore(); // 状態を復元
  }
} 