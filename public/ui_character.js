import { TextUI } from "./ui_text.js";
import { characterImages, audioManager } from "./main.js";
import { OverlayUI, UI } from "./ui.js";
import { CHARACTER_FOLDER, CHARA_QUOTES } from "./const.js";

// キャラクター画像を表示するためのUIクラス
export class CharacterImageUI extends UI {
  image; // Imageオブジェクト
  videoElement = []; // Video要素
  startVideoElement = [];
  winVideoElement = [];
  currentVideo = null;
  isRenderingVideo = false; // 動画を描画中かどうかのフラグ
  voiceTextOverlay;
  voiceText;
  textfade = 0;
  lastVideoidx = 0;

  constructor(params) {
    super(params);
    this.image = params.image;
    this.width = params.width;
    this.height = params.height;

    this.textsize = 0.035;
    this.voiceTextOverlay = new OverlayUI({
      color: 'rgba(15,63,31,0.8)',
      x: 0.2,
      y: 0.15,
      width: 0,
      height: 0.035 + 0.04
    });
    this.voiceText = new TextUI({
      text: () => {
        return "";
      },
      x: 0.0,
      y: 0.0,
      size: 0.035,
      colors: ["#ffffff", "#00000000", "#00000000"],
      position: 'center'
    });
    this.voiceTextOverlay.add(this.voiceText);
    this.add(this.voiceTextOverlay);
  }
  init() {
    this.videoElement = [];
    if (this.image) {
      for (let i = 0; i < CHARA_QUOTES[this.image].length; i++) {
        this.videoElement.push(document.createElement('video'));
        this.videoElement[i].src = `${CHARACTER_FOLDER}/${this.image}/click${i + 1}.webm`;
        this.videoElement[i].loop = false; // ループはしない
        this.videoElement[i].addEventListener('ended', () => {
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
        ctx.drawImage(this.currentVideo, - this.width / 2 * scale, - this.height / 2 * scale, this.width * scale, this.height * scale);
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
        ctx.drawImage(characterImages[this.image], - this.width / 2 * scale, - this.height / 2 * scale, this.width * scale, this.height * scale);
      }
    }
  }

  onMouseDown(pos) {
    let randomIndex = Math.floor(Math.random() * CHARA_QUOTES[this.image].length - 1);
    if (randomIndex >= this.lastVideoidx) {
      randomIndex++;
    }
    if (this.playVideo(randomIndex)) {
      this.spawnVoiceText(randomIndex);
    }
  }

  resize(data) {
    super.resize(data); // 親クラスのresizeを呼び出す
    // canvasに描画する場合は動画要素自体のサイズ変更は不要
  }

  playVideo(randomIndex) {
    // videoElement が存在し、動画が既に再生中、または再生準備ができていない場合は何もしない
    if (this.videoElement.length < CHARA_QUOTES[this.image].length || this.isRenderingVideo) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return false;
    }
    if (!this.videoElement[randomIndex]) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return false;
    }
    if (this.videoElement[randomIndex].readyState < 4) { // HTMLMediaElement.HAVE_ENOUGH_DATA は 4
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return false;
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
    this.lastVideoidx = randomIndex;
    return true;
  }

  stopVideo() {
    if (this.currentVideo) {
      this.currentVideo.pause();
      this.currentVideo.currentTime = 0;
      this.currentVideo = null;
      this.isRenderingVideo = false;
      this.voiceText.text = () => { return `` };
      this.voiceTextOverlay.width = 0;
    }
  }

  spawnVoiceText(randomIndex) {
    this.voiceText.text = () => { return `${CHARA_QUOTES[this.image][randomIndex]}` }
    this.voiceTextOverlay.width = CHARA_QUOTES[this.image][randomIndex].length * this.textsize + 0.02;
    this.currentVideo.addEventListener('ended', () => {
      setTimeout(() => {
        if (this.currentVideo === null) {
          this.voiceText.text = () => { return `` };
          this.voiceTextOverlay.width = 0;
        }
      }, 700);
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
        this.startVideoElement[i].src = `${CHARACTER_FOLDER}/${this.image}/start${i + 1}.webm`;
        this.startVideoElement[i].loop = false; // ループはしない

        this.startVideoElement[i].addEventListener('ended', () => {
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
        this.winVideoElement[i].src = `${CHARACTER_FOLDER}/${this.image}/win${i + 1}.webm`;
        this.winVideoElement[i].loop = false; // ループはしない
        this.winVideoElement[i].addEventListener('ended', () => {
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
        ctx.drawImage(this.currentVideo, -this.width / 2 * scale, -this.height / 2 * scale, this.width * scale, this.height * scale);
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
        ctx.drawImage(characterImages[this.image], -this.width / 2 * scale, -this.height / 2 * scale, this.width * scale, this.height * scale);
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
      return false;
    }
    if (!this.winVideoElement[idx]) {
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return false;
    }
    if (this.winVideoElement[idx].readyState < 4) { // HTMLMediaElement.HAVE_ENOUGH_DATA は 4
      console.log('動画の再生準備ができていません、または既に再生中です。');
      return false;
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
    return true; // 動画の再生が成功
  }
}

