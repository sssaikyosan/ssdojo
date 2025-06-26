import { canvas } from "./main25062602.js";

export class Scene {
  scale = 0;
  aspect = 3 / 4;
  offsetX = 0;
  offsetY = 0;
  htmls = [];
  ui_lists = [];
  lastFrameTime = performance.now();

  init() {

  }
  destroy() {
    // シーン破棄時のクリーンアップ処理をここに記述
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
}