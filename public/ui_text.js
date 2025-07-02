import { UI } from "./ui.js";
import { drawText, drawTextWithDoubleOutline, drawTextWithOutline } from "./utils.js";

export class TextUI extends UI {
  constructor(params) {
    super(params);

    this.width = 0;
    this.height = 0;

    this.text = params.text;
    this.size = params.size;
    this.textBaseline = params.textBaseline;
    this.position = params.position;
    this.colors = params.colors;
    this.outlineColor = params.outlineColor;
    this.doubleOutlineColor = params.doubleOutlineColor;
    this.backgroundColor = params.backgroundColor;
    this.nextline = 30;
    this.lineoffset = 0.1;
  }

  draw(ctx, scale) {
    ctx.save();
    const x = this.x * scale;
    const y = this.y * scale;
    if (this.backgroundColor) {
      const textWidth = this.getTextWidth(ctx, scale);
      const paddingX = 0.0; // 横方向のパディング (ゲーム内座標)
      const paddingY = 0.0; // 縦方向のパディング (ゲーム内座標)
      const backgroundWidth = (textWidth + paddingX + this.size * 0.4) * scale;
      const backgroundHeight = (this.size + paddingY + this.size * 0.4) * scale;

      let backgroundX = x;
      let backgroundY = y;

      // テキストの位置揃えに合わせて背景の位置を調整
      if (this.position === 'center') {
        backgroundX = backgroundX - backgroundWidth / 2;
      } else if (this.position === 'right') {
        backgroundX = backgroundX - backgroundWidth + this.size * 0.2 * scale;
      } else if (this.position === 'left') {
        backgroundX = backgroundX - this.size * 0.2 * scale;
      }

      if (this.textBaseline === 'middle') {
        backgroundY = backgroundY - backgroundHeight / 2;
      } else if (this.textBaseline === 'bottom') {
        backgroundY = backgroundY - backgroundHeight + this.size * 0.2 * scale;;
      } else if (this.textBaseline === 'top') {
        backgroundY = backgroundY - this.size * 0.2 * scale;
      }

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);
    }
    const size = this.size * scale;
    let length = this.text().length;
    let line = 0;
    switch (this.colors.length) {
      case 1:
        while (length > line * this.nextline) {
          drawText(ctx, this.text().substring(line * this.nextline, (line + 1) * this.nextline), x, y + line * (size + size * this.lineoffset), size, this.colors[0], this.textBaseline, this.position);
          line++;
        }
        break;
      case 2:
        while (length > line * this.nextline) {
          drawTextWithOutline(ctx, this.text().substring(line * this.nextline, (line + 1) * this.nextline), x, y + line * (size + size * this.lineoffset) * scale, size, this.colors, this.textBaseline, this.position);
          line++;
        }
        break;
      case 3:
        while (length > line * this.nextline) {
          drawTextWithDoubleOutline(ctx, this.text().substring(line * this.nextline, (line + 1) * this.nextline), x, y + line * (size + size * this.lineoffset), size, this.colors, this.textBaseline, this.position);
          line++;
        }
        break;
      default:
        while (length > line * this.nextline) {
          drawText(ctx, this.text().substring(line * this.nextline, (line + 1) * this.nextline), x, y + line * (size + size * this.lineoffset), size, this.colors[0], this.textBaseline, this.position);
          line++;
        }
        break;
    }
    ctx.restore();
  }
  /**
     * テキストの描画幅を取得します。
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} scale
     * @returns {number} テキストの幅 (ゲーム内座標)
     */
  getTextWidth(ctx, scale) {
    ctx.save();
    const size = this.size * scale;
    ctx.font = `${size}px sans-serif`; // フォントを設定
    const metrics = ctx.measureText(this.text());
    ctx.restore();
    return metrics.width / scale; // ゲーム内座標に変換して返す
  }
}
