import match from "./match.mp3";
import sound from "./sound.mp3";

export const SoundFiles = {
  sound,
  match,
} as const;
export type SoundName = keyof typeof SoundFiles;

// 一度取得したファイルはキャッシュしておきます
const _soundFileCache = new Map<SoundName, HTMLAudioElement>();

export function playSound(soundName: SoundName) {
  // 新しいAudioオブジェクトを作成
  const audio = new Audio(SoundFiles[soundName]);

  // 再生が終了したら自動的に削除
  audio.addEventListener('ended', () => {
    audio.remove();
  });

  audio.play().catch(error => {
    console.error("効果音の再生に失敗しました:", error);
  });
}

export function playSmallSound(soundName: SoundName) {
  // 新しいAudioオブジェクトを作成
  const audio = new Audio(SoundFiles[soundName]);
  audio.volume = 0.5;

  // 再生が終了したら自動的に削除
  audio.addEventListener('ended', () => {
    audio.remove();
  });

  audio.play().catch(error => {
    console.error("効果音の再生に失敗しました:", error);
  });
}