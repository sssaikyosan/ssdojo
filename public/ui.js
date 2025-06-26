import { characterImages, gameManager, scene, title_img, audioManager } from "./main25062604.js";
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
export class CharacterImageUI extends UI {
  image; // Imageオブジェクト
  videoElement; // Video要素

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width || this.image.width;
    this.height = params.height || this.image.height;
  }

  renderSelf(ctx, scale) {
    // 動画が再生中の場合は画像を描画しない
    if (this.videoElement && !this.videoElement.paused) {
      // 動画要素はDOMで管理するため、ここでは描画しない
      return;
    }

    // 画像が存在するかチェック
    if (this.image && characterImages[this.image]) {
      // 画像を中央揃えで描画
      ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
    }
  }

  onMouseDown(pos) {
    // 動画を再生
    this.playVideo();
  }

  playVideo() {
    // 既に動画要素が存在する場合は何もしない
    if (this.videoElement) {
      return;
    }

    // video要素を作成
    this.videoElement = document.createElement('video');
    this.videoElement.src = `characters/${this.image}/voice1.webm`;
    this.videoElement.autoplay = true;
    this.videoElement.loop = false; // ループはしない
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.left = '50%';
    this.videoElement.style.top = '50%';
    this.videoElement.style.transform = 'translate(-50%, -50%)';
    this.videoElement.style.width = '100%'; // キャンバスサイズに合わせる
    this.videoElement.style.height = '100%'; // キャンバスサイズに合わせる
    this.videoElement.style.objectFit = 'contain'; // アスペクト比を維持して表示
    this.videoElement.style.zIndex = '100'; // 最前面に表示

    // 動画再生終了時の処理
    this.videoElement.onended = () => {
      this.videoElement.remove(); // 要素を削除
      this.videoElement = null; // 参照をクリア
    };

    // エラーハンドリング
    this.videoElement.onerror = (e) => {
      console.error('動画の再生に失敗しました:', e);
      if (this.videoElement) {
        this.videoElement.remove();
        this.videoElement = null;
      }
    };

    // bodyに追加
    document.body.appendChild(this.videoElement);

    // 動画を再生
    this.videoElement.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      if (this.videoElement) {
        this.videoElement.remove();
        this.videoElement = null;
      }
    });
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
    // 画像が存在するかチェック
    if (this.image && characterImages[this.image]) {
      ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
    }
  }

  onMouseDown(pos) {
    const mousePos = gameManager.boardUI.getBoardPosition({ x: pos.x + this.x, y: pos.y + this.y });
    if (mousePos.x >= 0 && mousePos.y >= 0) return;
    const randomIndex = Math.floor(Math.random() * 3);
    const randomVoiceFile = `/characters/${this.image}/voice00${randomIndex + 1}.wav`;
    audioManager.playVoice(randomVoiceFile);
  }
}

// 背景画像を表示するためのUIクラス
export class BackgroundImageUI extends UI {
  image;

  constructor(params) {
    super(params);
    this.image = params.image;
  }

  renderSelf(ctx, scale) {
    // 背景画像が存在するかチェック
    const backgroundImage = this.image;
    if (backgroundImage) {
      // キャンバス全体に背景画像を描画
      // アスペクト比を維持しつつ、画面全体をカバーするように調整
      const canvasAspect = window.innerWidth / window.innerHeight;
      const imageAspect = backgroundImage.width / backgroundImage.height;

      let drawWidth;
      let drawHeight;
      let drawX = -window.innerWidth / 2;
      let drawY = -window.innerHeight / 2;

      if (canvasAspect > imageAspect) {
        // キャンバスの方が横長の場合、高さを基準に描画
        drawHeight = window.innerWidth / imageAspect;
        drawWidth = window.innerWidth;
        drawY += (window.innerHeight - drawHeight) / 2;
      } else {
        // 画像の方が横長、またはアスペクト比が同じ場合、幅を基準に描画
        drawWidth = window.innerHeight * imageAspect;
        drawHeight = window.innerHeight;
        drawX += (window.innerWidth - drawWidth) / 2;
      }

      ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // 背景画像がない場合は黒で塗りつぶすなどのフォールバック
      ctx.fillStyle = '#000000';
      ctx.fillRect(-window.innerWidth / 2, -window.innerHeight / 2, window.innerWidth, window.innerHeight);
    }
  }
}


export class OverlayUI extends UI {
  color;

  constructor(params) {
    super(params);
    this.color = params.color;
    this.width = params.width;
    this.height = params.height;
  }

  renderSelf(ctx, scale) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
  }
}