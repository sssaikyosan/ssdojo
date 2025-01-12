function drawTextWithOutline(text, x, y, fontSize, fillColor, outlineColor, outlineWidth) {
  ctx.save();
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  // 縁取りを描画
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineWidth;
  ctx.strokeText(text, x, y);

  // テキスト本体を描画
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function playSound(filename) {
  const audio = new Audio(`/sounds/${filename}.mp3`);
  audio.play().catch(error => {
    console.error('効果音の再生に失敗しました:', error);
  });
}

/**
 * テキストを描画する
 * @param {string} text - 表示するテキスト
 * @param {number} x - X座標
 * @param {number} y - Y座標
 * @param {number} fontSize - フォントサイズ
 * @param {string} color - テキストの色
 * @param {CanvasTextAlign} [position='center'] - テキストの配置（'left', 'right', 'center'など）
 * @param {CanvasTextBaseline} [textBaseline='middle'] - テキストのベースライン（'top', 'middle', 'bottom'など）
 */
function drawText(text, x, y, fontSize, color = "#FFFFFF", position = 'center', textBaseline = 'middle') {
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline; // CanvasTextBaseline型として扱われる
  ctx.textAlign = position; // CanvasTextAlign型として扱われる
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawTextWithDoubleOutline(text, x, y, fontSize, fillColor, innerOutlineColor, outerOutlineColor) {
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  // 外側の縁取りを描画（太め）
  ctx.strokeStyle = outerOutlineColor;
  ctx.lineWidth = fontSize * 0.16; // 外側の縁取りの太さ
  ctx.strokeText(text, x, y);

  // 内側の縁取りを描画（細め）
  ctx.strokeStyle = innerOutlineColor;
  ctx.lineWidth = fontSize * 0.1; // 内側の縁取りの太さ
  ctx.strokeText(text, x, y);

  // テキスト本体を描画
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
}


function darkenColor(color, percent) {
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