export class AudioManager {
    currentVoice = null;
    currentBGM = null;

    bgmVolume = 1;
    soundVolume = 1;
    voiceVolume = 1;

    bgmDict = {};
    soundDict = {};
    voiceDict = {};

    constructor() {

    }

    Init() {
        this.addBGM('title', 0.3);
        this.addBGM('battle', 0.25);
    }

    addBGM(filename, originalVolume) {
        this.bgmDict[filename] = { audio: new Audio(`/music/${filename}.mp3`), originalVolume: originalVolume };
    }

    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0.0, Math.min(1.0, volume)); // 0.0から1.0の範囲に制限
        // 現在再生中のBGMの音量も更新
        if (this.currentBGM) {
            this.bgmDict[this.currentBGM].audio.volume = this.bgmVolume * this.bgmDict[this.currentBGM].originalVolume; // 元の音量に掛け合わせる
        }
    }

    // 効果音音量を設定する関数
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0.0, Math.min(1.0, volume)); // 0.0から1.0の範囲に制限
        // 現在再生中の音声の音量も更新
        if (this.currentVoice) {
            this.currentVoice.volume = this.soundVolume;
        }
    }


    // キャラボイス音量を設定する関数
    setVoiceVolume(volume) {
        this.voiceVolume = Math.max(0.0, Math.min(1.0, volume)); // 0.0から1.0の範囲に制限
        // 現在再生中の音声の音量も更新
        if (this.currentVoice) {
            this.currentVoice.volume = this.voiceVolume;
        }
    }

    playSound(filename) {
        const audio = new Audio(`/sounds/${filename}.mp3`);
        audio.volume = this.soundVolume; // 効果音音量を適用
        audio.play().catch(error => {
            console.error('効果音の再生に失敗しました:', error);
        });
    }

    playVoice(filename) {
        // 現在再生中の音声があれば停止
        if (this.currentVoice) {
            this.currentVoice.pause();
            this.currentVoice.currentTime = 0; // 再生位置をリセット
        }

        const audio = new Audio(filename);
        audio.volume = this.voiceVolume; // キャラボイス音量を適用
        audio.play().catch(error => {
            console.error('効果音の再生に失敗しました:', error);
        });

        this.currentVoice = audio; // 新しい音声を保持
    }

    playBGM(bgm) {
        if (!this.bgmDict[bgm]) {
            console.log('no BGM', bgm);
            return;
        }
        // 現在再生中のBGMがあれば停止
        if (this.currentBGM) {
            this.bgmDict[this.currentBGM].audio.pause();
            if (this.bgmDict[this.currentBGM].audio.currentTime > 0) { // 再生位置が0より大きい場合のみリセット
                this.bgmDict[this.currentBGM].audio.currentTime = 0;
            }
        }

        this.bgmDict[bgm].loop = true; // BGMはループ再生
        this.bgmDict[bgm].audio.volume = this.bgmVolume * this.bgmDict[bgm].originalVolume; // マスター音量と元の音量を掛け合わせる
        this.bgmDict[bgm].audio.play().catch(error => {
            console.error('BGMの再生に失敗しました:', error);
        });

        this.currentBGM = bgm; // 新しいBGMを保持
    }

    stopBGM() {
        if (this.currentBGM) {
            this.bgmDict[this.currentBGM].audio.pause();
            if (this.bgmDict[this.currentBGM].audio.currentTime > 0) { // 再生位置が0より大きい場合のみリセット
                this.bgmDict[this.currentBGM].audio.currentTime = 0;
            }
            this.currentBGM = null; // BGM参照をクリア
        }
    }
}