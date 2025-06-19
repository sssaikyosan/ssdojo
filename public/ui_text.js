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
  }

  draw(ctx, scale) {
    ctx.save();
    const x = this.x * scale;
    const y = this.y * scale;
    const size = this.size * scale;
    switch (this.colors.length) {
      case 1:
        drawText(ctx, this.text(), x, y, size, this.colors[0], this.textBaseline, this.position);
        break;
      case 2:
        drawTextWithOutline(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
        break;
      case 3:
        drawTextWithDoubleOutline(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
        break;
      default:
        drawText(ctx, this.text(), x, y, size, this.colors[0], this.textBaseline, this.position);
        break;
    }
    ctx.restore();
  }
}