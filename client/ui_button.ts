import { UI } from "./ui";
import { darkenColor, drawTextWithOutline } from "./utils";

export class Button extends UI {

  constructor(params) {
    super(params);
    this.radius = params.height * 0.1;
    this.line = params.height * 0.05;
    this.text = params.text;
    this.color = params.color;
    this.emit = params.emit;
    /** @type {string} */
    this.state = "normal"; // ボタンの状態（normal, hover, down）
  }

  draw(ctx, scale) {
    const x = this.x * scale;
    const y = this.y * scale;
    const width = this.width * scale;
    const height = this.height * scale;
    const radius = this.radius * scale;
    const line = this.line * scale;
    ctx.save();
    this.drawRoundedButton(ctx, x, y, width, height, radius, line);
    drawTextWithOutline(ctx, this.text, x, y, height * 0.6, ["#FFFFFF", "#000000"]);
    ctx.restore();
  }

  onClick() { }

  mouseDown(pos) {
    this.state = "down";
  }

  mouseMove(pos) {
    if (this.state == "normal") this.state = "hover";
  }

  mouseUp(pos) {
    if (this.state == "down") this.onClick();
    this.state = "hover";
  }

  unTouch() {
    this.state = "normal";
  }

  drawRoundedButton(ctx, x, y, width, height, radius, line) {
    ctx.save(); // 現在の状態を保存
    // 角丸四角形のパスを作成
    ctx.beginPath();
    ctx.moveTo(x + radius, y - height / 2);
    ctx.arcTo(x + width / 2, y - height / 2, x + width / 2, y + height / 2, radius);
    ctx.arcTo(x + width / 2, y + height / 2, x - width / 2, y + height / 2, radius);
    ctx.arcTo(x - width / 2, y + height / 2, x - width / 2, y - height / 2, radius);
    ctx.arcTo(x - width / 2, y - height / 2, x + width / 2, y - height / 2, radius);
    ctx.closePath();

    let color;
    switch (this.state) {
      case "normal":
        color = this.color;
        break;
      case "hover":
        color = darkenColor(this.color, 0.1);
        break;
      case "down":
        color = darkenColor(this.color, 0.3);
        break;
    }

    // ボタンの塗りつぶし
    ctx.fillStyle = color;
    ctx.fill();

    // ボタンの縁取り
    ctx.strokeStyle = darkenColor(this.color, 0.6);
    ctx.lineWidth = this.line;
    ctx.stroke();

    ctx.restore(); // 状態を復元
  }
} 