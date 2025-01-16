
export interface UiParams {
  x: number;
  y: number;
  width?: number;
  height?: number;
  touchable?: boolean;
}

interface UiBackground extends UiParams {
  color: string;
}

export class UI {
  x: number;
  y: number;
  width: number;
  height: number;
  touchable: boolean;
  childs: UI[] = [];
  eventlist: unknown;

  constructor(params: UiParams) {
    this.x = params.x;
    this.y = params.y;
    this.width = params.width ?? 0;
    this.height = params.height ?? 0;
    this.touchable = params.touchable ?? false;
    this.eventlist = {};

    // if (this.touchable) {
    //   canvas.addEventListener("mousemove", (e) => {
    //     this.onMouseMove(e);
    //   });
    //   canvas.addEventListener("mousedown", (e) => {
    //     this.onMouseDown(e);
    //   });
    //   canvas.addEventListener("mouseup", (e) => {
    //     this.onMouseUp(e);
    //   });
    // }

  }

  draw(ctx: CanvasRenderingContext2D, scale: number) {
    // コンテキストの座標変換を保存
    ctx.save();

    // 自分の座標に描画位置をずらす 参照:https://developer.mozilla.org/ja/docs/Web/API/Canvas_API/Tutorial/Transformations
    ctx.translate(this.x, this.y);

    // まず自分を描画
    this.renderSelf(ctx, scale);

    // 次に子供を描画
    for (const ui of this.childs) {
      ui.draw(ctx, scale);
    }

    // コンテキストの座標変換を復元
    ctx.restore();
  }

  renderSelf(ctx: CanvasRenderingContext2D, scale: number) { }

  add(ui: UI) {
    this.childs.push(ui);
  }

  remove(ui: UI) {
    const index = this.childs.findIndex(x => x === ui);
    if (index === -1) return;
    this.childs.splice(index, 1);
  }

  unTouch(pos: { x: number, y: number; }) { }
  onMouseDown(pos: { x: number, y: number; }) { }
  onMouseMove(pos: { x: number, y: number; }) { }
  onMouseUp(pos: { x: number, y: number; }) { }
  onMouseUpRight(pos: { x: number, y: number; }) { }
  onTouch(pos: { x: number, y: number; }) { }

  isTouched(pos: { x: number, y: number; }) {
    if (this.x - this.width / 2 < pos.x && pos.x < this.x + this.width / 2 &&
      this.y - this.height / 2 < pos.y && pos.y < this.y + this.height / 2) {
      return true;
    }
    return false;
  }

  touchCheck(pos: { x: number, y: number; }, str: string) {
    const cpos: { x: number, y: number; } = { x: pos.x - this.x, y: pos.y - this.y };
    this.childs.forEach(ui => ui.touchCheck(cpos, str));
    switch (str) {
      case "mousedown":
        this.onMouseDown(cpos);
        break;
      case "mousemove":
        this.onMouseMove(cpos);
        break;
      case "mouseup":
        this.onMouseUp(cpos);
        break;
      case "mouseup-right":
        this.onMouseUpRight(cpos);
        break;
    }
    if (this.isTouched(cpos)) {
      this.onTouch(cpos);
    }
    return false;
  }

}


export class Background extends UI {
  color;
  constructor(params: UiBackground) {
    super(params);
    this.color = params.color;
  }
  renderSelf(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-window.innerWidth * 127, -window.innerHeight * 127, window.innerWidth * 255, window.innerHeight * 255);
  }
}