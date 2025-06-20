let currentVoice = null;
let currentBGM = null; // 現在再生中のBGMを保持する変数

export function playSound(filename) {
  const audio = new Audio(`/sounds/${filename}.mp3`);
  audio.play().catch(error => {
    console.error('効果音の再生に失敗しました:', error);
  });
}

export function playVoice(filename) {
  // 現在再生中の音声があれば停止
  if (currentVoice) {
    currentVoice.pause();
    currentVoice.currentTime = 0; // 再生位置をリセット
  }

  const audio = new Audio(filename);
  audio.play().catch(error => {
    console.error('効果音の再生に失敗しました:', error);
  });

  currentVoice = audio; // 新しい音声を保持
}

export function playBGM(filename) {
  // 現在再生中のBGMがあれば停止
  if (currentBGM) {
    currentBGM.pause();
    if (currentBGM.currentTime > 0) { // 再生位置が0より大きい場合のみリセット
      currentBGM.currentTime = 0;
    }
  }

  const audio = new Audio(`/music/${filename}.mp3`);
  audio.loop = true; // BGMはループ再生
  audio.volume = 0.5; // BGMの音量を調整（任意）
  audio.play().catch(error => {
    console.error('BGMの再生に失敗しました:', error);
  });

  currentBGM = audio; // 新しいBGMを保持
}

export function stopBGM() {
  if (currentBGM) {
    currentBGM.pause();
    if (currentBGM.currentTime > 0) { // 再生位置が0より大きい場合のみリセット
      currentBGM.currentTime = 0;
    }
    currentBGM = null; // BGM参照をクリア
  }
}


/**
 * テキストを描画する
 * @param {string} text - 表示するテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} fontSize - フォントサイズ
 * @param {string[]} colors - テキストの色
 * @param {CanvasTextAlign} [position='center'] - テキストの配置（'left', 'right', 'center'など）
 * @param {CanvasTextBaseline} [textBaseline='middle'] - テキストのベースライン（'top', 'middle', 'bottom'など）
 */
export function drawText(ctx, text, x, y, fontSize, colors, textBaseline = 'middle', position = 'center') {
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline; // CanvasTextBaseline型として扱われる
  ctx.textAlign = position; // CanvasTextAlign型として扱われる
  ctx.strokeStyle = '#00000000';
  ctx.fillStyle = colors[0];
  ctx.fillText(text, x, y);
}

/**
 * テキストを描画する
 * @param {string} text - 表示するテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} fontSize - フォントサイズ
 * @param {string[]} colors - テキストの色
 * @param {CanvasTextAlign} [position='center'] - テキストの配置（'left', 'right', 'center'など）
 * @param {CanvasTextBaseline} [textBaseline='middle'] - テキストのベースライン（'top', 'middle', 'bottom'など）
 */
export function drawTextWithOutline(ctx, text, x, y, fontSize, colors, textBaseline = 'middle', position = 'center') {
  ctx.save();
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline;
  ctx.textAlign = position;
  // 縁取りを描画
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = fontSize * 0.1;
  ctx.strokeText(text, x, y);

  // テキスト本体を描画
  ctx.fillStyle = colors[0];
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * テキストを描画する
 * @param {string} text - 表示するテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} fontSize - フォントサイズ
 * @param {string[]} colors - テキストの色
 * @param {CanvasTextAlign} [position='center'] - テキストの配置（'left', 'right', 'center'など）
 * @param {CanvasTextBaseline} [textBaseline='middle'] - テキストのベースライン（'top', 'middle', 'bottom'など）
 */
export function drawTextWithDoubleOutline(ctx, text, x, y, fontSize, colors, textBaseline = 'middle', position = 'center') {
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline;
  ctx.textAlign = position;
  // 外側の縁取りを描画（太め）
  ctx.strokeStyle = colors[2];
  ctx.lineWidth = fontSize * 0.16; // 外側の縁取りの太さ
  ctx.strokeText(text, x, y);

  // 内側の縁取りを描画（細め）
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = fontSize * 0.1; // 内側の縁取りの太さ
  ctx.strokeText(text, x, y);

  // テキスト本体を描画
  ctx.fillStyle = colors[0];
  ctx.fillText(text, x, y);
}


export function darkenColor(color, percent) {
  // HEXカラーをRGBに変換
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // 各色成分を暗くする
  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));

  // RGBをHEXに戻す
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}


export function getPromotedType(type) {
  const promotedTypes = {
    pawn: 'prom_pawn',
    lance: 'prom_lance',
    knight: 'prom_knight',
    silver: 'prom_silver',
    bishop: 'horse',
    rook: 'dragon'
  };
  return promotedTypes[type] || type;
}

export function getUnPromotedType(type) {
  const promotedTypes = {
    prom_pawn: 'pawn',
    prom_lance: 'lance',
    prom_knight: 'prom_knight',
    prom_silver: 'silver',
    horse: 'bishop',
    dragon: 'rook'
  };
  return promotedTypes[type] || type;
}