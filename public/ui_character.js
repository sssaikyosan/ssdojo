import { characterImages, audioManager } from "./main25062902.js";
import { UI } from "./ui.js";

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
        this.videoElement[i].src = `characters/${this.image}/click${i + 1}.webm`;
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
    this.currentVideo.volume = audioManager.voiceVolume; // 音量を設定
    this.currentVideo.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      this.currentVideo = null;
      this.isRenderingVideo = false; // 再生開始に失敗したらフラグをオフ
    });
  }
}

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
    this.currentVideo.volume = audioManager.voiceVolume; // 音量を設定
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

    this.currentVideo.volume = audioManager.voiceVolume; // 音量を設定
    this.isRenderingVideo = true; // 動画描画フラグをオン
    this.currentVideo.currentTime = 0; // 最初から再生
    this.currentVideo.play().catch(error => {
      console.error('動画の再生開始に失敗しました:', error);
      this.currentVideo = null;
      this.isRenderingVideo = false; // 再生開始に失敗したらフラグをオフ
    });
  }
}

