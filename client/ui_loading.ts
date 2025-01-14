import { UI, UiParams } from "./ui";

interface UiLoadingParams extends UiParams {
  radius: number;
  loadingAngle: number;
}

export class LoadingUI extends UI {
  radius: number;
  loadingAngle: number;

  constructor(params: UiLoadingParams) {
    super(params);
    this.radius = params.radius;
    this.loadingAngle = 0;
  }

  draw(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.save();
    const x = this.x * scale;
    const y = this.y * scale;
    const radius = this.radius * scale;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius, this.loadingAngle, this.loadingAngle + Math.PI / 2);
    ctx.stroke();

    // 角度を更新
    this.loadingAngle += 0.05;
    if (this.loadingAngle > Math.PI * 2) {
      this.loadingAngle = 0;
    }
    ctx.restore();
  }
}