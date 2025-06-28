import { characterImages, gameManager, scene, title_img, audioManager, canvas } from "./main25062801.js";
export class UI {
  globalX;
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
    // 子要素のリサイズ処理を呼び出す
    this.childs.forEach(child => {
      if (child.resize) {
        child.resize(data);
      }
    });
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
  videoElement = []; // Video要素
  startVideoElement = [];
  winVideoElement = [];
  currentVideo = null;
  isRenderingVideo = false; // 動画を描画中かどうかのフラグ

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width;
    this.height = params.height;
    this.init();
  }
  init() {
    if (this.image) {
      for (let i = 0; i < 3; i++) {
        this.videoElement.push(document.createElement('video'));
        this.videoElement[i].src = `characters/${this.image}/video${i + 1}.webm`;
        this.videoElement[i].loop = false; // ループはしない
        this.videoElement[i].addEventListener('canplaythrough', () => {
          console.log('動画の再生準備ができました:');
        });
        this.videoElement[i].addEventListener('ended', () => {
          console.log('動画再生が終了しました:');
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });

        // エラーハンドリング
        this.videoElement[i].addEventListener('error', (e) => {
          console.error('動画の読み込みまたは再生に失敗しました:', e);
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });
      }
    }
  }

  renderSelf(ctx, scale) {
    // 動画が再生可能で、動画を描画中の場合は動画フレームを描画
    if (this.currentVideo && this.isRenderingVideo && !this.currentVideo.paused && !this.currentVideo.ended && this.currentVideo.currentTime !== 0) {
      try {
        ctx.drawImage(this.currentVideo, this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
      } catch (e) {
        // 動画がまだ描画可能な状態でない場合のエラーを無視
        if (!(e instanceof DOMException && e.name === 'InvalidStateError')) {
          console.error('動画の描画中にエラーが発生しました:', e);
          this.currentVideo = null;
          this.isRenderingVideo = false; // エラーが発生したら動画描画を停止
        }
      }
    } else {
      // 動画を描画中でない場合、または動画がない場合は画像を描画
      if (this.image && characterImages[this.image]) {
        // 画像を中央揃えで描画
        ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
      }
    }
  }

  onMouseDown(pos) {
    this.playVideo();
  }

  resize(data) {
    super.resize(data); // 親クラスのresizeを呼び出す
    // canvasに描画する場合は動画要素自体のサイズ変更は不要
  }

  playVideo() {
    const randomIndex = Math.floor(Math.random() * 3);
    // videoElement が存在し、動画が既に再生中、または再生準備ができていない場合は何もしない
    if (this.videoElement.length < 3 || this.isRenderingVideo) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (!this.videoElement[randomIndex]) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (this.videoElement[randomIndex].readyState < 4) { // HTMLMediaElement.HAVE_ENOUGH_DATA は 4
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return;
    }

    this.currentVideo = this.videoElement[randomIndex];

    this.isRenderingVideo = true; // 動画描画フラグをオン
    this.currentVideo.currentTime = 0; // 最初から再生
    this.currentVideo.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      this.currentVideo = null;
      this.isRenderingVideo = false; // 再生開始に失敗したらフラグをオフ
    });
  }
}


// キャラクター画像を表示するためのUIクラス
export class CharacterInGameUI extends UI {
  image; // Imageオブジェクト
  videoElement = []; // Video要素
  startVideoElement = [];
  winVideoElement = [];
  currentVideo = null;
  isRenderingVideo = false; // 動画を描画中かどうかのフラグ

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width;
    this.height = params.height;
    this.init();
  }
  init() {
    if (this.image) {
      for (let i = 0; i < 1; i++) {
        this.startVideoElement.push(document.createElement('video'));
        this.startVideoElement[i].src = `characters/${this.image}/start${i + 1}.webm`;
        this.startVideoElement[i].loop = false; // ループはしない
        this.startVideoElement[i].addEventListener('canplaythrough', () => {
          console.log('動画の再生準備ができました:');
        });
        this.startVideoElement[i].addEventListener('ended', () => {
          console.log('動画再生が終了しました:');
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });

        // エラーハンドリング
        this.startVideoElement[i].addEventListener('error', (e) => {
          console.error('動画の読み込みまたは再生に失敗しました:', e);
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });
      }

      for (let i = 0; i < 1; i++) {
        this.winVideoElement.push(document.createElement('video'));
        this.winVideoElement[i].src = `characters/${this.image}/win${i + 1}.webm`;
        this.winVideoElement[i].loop = false; // ループはしない
        this.winVideoElement[i].addEventListener('canplaythrough', () => {
          console.log('動画の再生準備ができました:');
        });
        this.winVideoElement[i].addEventListener('ended', () => {
          console.log('動画再生が終了しました:');
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });

        // エラーハンドリング
        this.winVideoElement[i].addEventListener('error', (e) => {
          console.error('動画の読み込みまたは再生に失敗しました:', e);
          this.currentVideo = null;
          this.isRenderingVideo = false; // 動画描画フラグをオフ
        });
      }
    }
  }

  renderSelf(ctx, scale) {
    // 動画が再生可能で、動画を描画中の場合は動画フレームを描画
    if (this.currentVideo !== null && this.isRenderingVideo && !this.currentVideo.paused && !this.currentVideo.ended && this.currentVideo.currentTime !== 0) {
      try {
        ctx.drawImage(this.currentVideo, this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
      } catch (e) {
        // 動画がまだ描画可能な状態でない場合のエラーを無視
        if (!(e instanceof DOMException && e.name === 'InvalidStateError')) {
          console.error('動画の描画中にエラーが発生しました:', e);
          this.currentVideo = null;
          this.isRenderingVideo = false; // エラーが発生したら動画描画を停止
        }
      }
    } else {
      // 動画を描画中でない場合、または動画がない場合は画像を描画
      if (this.image && characterImages[this.image]) {
        // 画像を中央揃えで描画
        ctx.drawImage(characterImages[this.image], this.x * scale - this.width / 2 * scale, this.y * scale - this.height / 2 * scale, this.width * scale, this.height * scale);
      }
    }
  }

  resize(data) {
    super.resize(data); // 親クラスのresizeを呼び出す
    // canvasに描画する場合は動画要素自体のサイズ変更は不要
  }

  playStartVideo(idx) {
    // videoElement が存在し、動画が既に再生中、または再生準備ができていない場合は何もしない
    if (this.startVideoElement.length === 0 || this.isRenderingVideo) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (!this.startVideoElement[idx]) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (this.startVideoElement[idx].readyState < 4) { // HTMLMediaElement.HAVE_ENOUGH_DATA は 4
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return;
    }

    this.currentVideo = this.startVideoElement[idx];

    this.isRenderingVideo = true; // 動画描画フラグをオン
    this.currentVideo.currentTime = 0; // 最初から再生
    this.currentVideo.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      this.currentVideo = null;
      this.isRenderingVideo = false; // 再生開始に失敗したらフラグをオフ
    });
  }

  playWinVideo(idx) {
    // videoElement が存在し、動画が既に再生中、または再生準備ができていない場合は何もしない
    if (this.winVideoElement.length === 0 || this.isRenderingVideo) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (!this.winVideoElement[idx]) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return
    }
    if (this.winVideoElement[idx].readyState < 4) { // HTMLMediaElement.HAVE_ENOUGH_DATA は 4
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return;
    }

    this.currentVideo = this.winVideoElement[idx];

    this.isRenderingVideo = true; // 動画描画フラグをオン
    this.currentVideo.currentTime = 0; // 最初から再生
    this.currentVideo.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      this.currentVideo = null;
      this.isRenderingVideo = false; // 再生開始に失敗したらフラグをオフ
    });
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