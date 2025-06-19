import { characterImages, gameManager, scene } from "./main.js";
import { playVoice } from "./utils.js"; // playSound関数をインポート

export class UI {
  globalX;
  globalY;
  x;
  y;
  width;
  height;
  scale;
  touchable;
  childs = [];

  constructor(params) {
    this.x = params.x;
    this.y = params.y;
    this.width = 0;
    this.height = 0;
    this.touchable = params.touchable ?? false;
    this.eventlist = {};

    // if (this.touchable) {
    //   canvas.addEventListener('mousemove', (e) => {
    //     this.onMouseMove(e);
    //   });
    //   canvas.addEventListener('mousedown', (e) => {
    //     this.onMouseDown(e);
    //   });
    //   canvas.addEventListener('mouseup', (e) => {
    //     this.onMouseUp(e);
    //   });
    // }

  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx, scale) {
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

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  renderSelf(ctx, scale) { }

  add(ui) {
    this.childs.push(ui);
  }

  remove(ui) {
    const index = this.childs.findIndex(x => x === ui);
    if (index === -1) return;
    this.childs.splice(index, 1);
  }

  unTouch(pos) { }
  onMouseDown(pos) { }
  onMouseMove(pos) { }
  onMouseUp(pos) { }
  onMouseUpRight(pos) { }
  onTouch(pos) { }

  resize(data) {
    this.scale = data.scale;
  }

  isTouched(pos) {
    if (-this.width / 2 < pos.x && pos.x < this.width / 2 &&
      -this.height / 2 < pos.y && pos.y < this.height / 2) {
      return true;
    }
    return false;
  }

  touchCheck(pos, str) {
    const cpos = { x: pos.x - this.x, y: pos.y - this.y };
    this.childs.forEach(ui => ui.touchCheck(cpos, str));
    if (this.isTouched(cpos)) {
      this.onTouch(cpos);
      switch (str) {
        case 'mousedown':
          this.onMouseDown(cpos);
          break;
        case 'mousemove':
          this.onMouseMove(cpos);
          break;
        case 'mouseup':
          this.onMouseUp(cpos);
          break;
        case 'mouseup-right':
          this.onMouseUpRight(cpos);
          break;
      }

    }
    return false;
  }
  /**
   * @param {{x: number, y: number}} pos
   */

}


export class Background extends UI {
  color;
  constructor(params) {
    super(params);
    this.color = params.color;
  }
  renderSelf(ctx, scale) {
    ctx.fillStyle = this.color;
    ctx.fillRect(-window.innerWidth * 127, -window.innerHeight * 127, window.innerWidth * 255, window.innerHeight * 255);
  }
}

// キャラクター画像を表示するためのUIクラス
export class CharacterImageUI extends UI { // export キーワードを追加
  image; // Imageオブジェクト

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width || this.image.width;
    this.height = params.height || this.image.height;
  }

  renderSelf(ctx, scale) {
    if (this.image) {
      // 画像を中央揃えで描画
      ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
    }
  }

  onMouseDown(pos) {
    const randomIndex = Math.floor(Math.random() * 3);
    const randomVoiceFile = `/characters/${this.image}/voice00${randomIndex + 1}.wav`;
    playVoice(randomVoiceFile);
  }
}

// キャラクター画像を表示するためのUIクラス
export class CharacterInGameUI extends UI { // export キーワードを追加
  image; // Imageオブジェクト

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width || this.image.width;
    this.height = params.height || this.image.height;
  }

  renderSelf(ctx, scale) {
    if (this.image) {
      ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
    }
  }

  onMouseDown(pos) {
    const mousePos = gameManager.boardUI.getBoardPosition({ x: pos.x + this.x, y: pos.y + this.y });
    if (mousePos.x >= 0 && mousePos.y >= 0) return;
    const randomIndex = Math.floor(Math.random() * 3);
    const randomVoiceFile = `/characters/${this.image}/voice00${randomIndex + 1}.wav`;
    playVoice(randomVoiceFile);
  }
}
