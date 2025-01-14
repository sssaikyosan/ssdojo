import { UI, UiParams } from "./ui";
import { drawText, drawTextWithDoubleOutline, drawTextWithOutline } from "./utils";

interface UiTextParams extends UiParams {
  text: () => string;
  size: number;
  textBaseline: CanvasTextBaseline;
  position: CanvasTextAlign;
  colors: string[];
}

export class TextUI extends UI {
  private text: () => string;
  private size: number;
  private textBaseline: CanvasTextBaseline;
  private position: CanvasTextAlign;
  private colors: string[];

  constructor(params: UiTextParams) {
    super(params);
    this.width = 0;
    this.height = 0;

    this.text = params.text;
    this.size = params.size;
    this.textBaseline = params.textBaseline;
    this.position = params.position;
    this.colors = params.colors;
  }

  draw(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.save();
    const x = this.x * scale;
    const y = this.y * scale;
    const size = this.size * scale;
    switch (this.colors.length) {
      case 1:
        drawText(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
      case 2:
        drawTextWithOutline(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
      case 3:
        drawTextWithDoubleOutline(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
      default:
        drawText(ctx, this.text(), x, y, size, this.colors, this.textBaseline, this.position);
    }
    ctx.restore();
  }
}