type ResolveType<T> = [T] extends [void] ? () => void : (value: T) => void;

/**
 * 任意の型`T`を返すプロミスを作成します
 */
export function promiser<T = void>() {
  let resolve: ResolveType<T> = null!;
  let reject: (reason?: any) => void = null!;
  const promise = new Promise<T>(((res, rej) => [resolve, reject] = [res as ResolveType<T>, rej]));
  return { promise, resolve, reject };
}

/**
 * テキストを描画する
 * @param ctx
 * @param text 表示するテキスト
 * @param x X座標
 * @param y Y座標
 * @param fontSize フォントサイズ
 * @param colors テキストの色
 * @param position テキストの配置（"left", "right", "center"など）
 * @param textBaseline  テキストのベースライン（"top", "middle", "bottom"など）
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  colors: string[],
  textBaseline: CanvasTextBaseline = "middle",
  position: CanvasTextAlign = "center"
) {
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline;
  ctx.textAlign = position;
  ctx.strokeStyle = "#00000000";
  ctx.fillStyle = colors[0];
  ctx.fillText(text, x, y);
}

/**
 * テキストを描画する
 * @param ctx
 * @param text 表示するテキスト
 * @param x X座標
 * @param y Y座標
 * @param fontSize フォントサイズ
 * @param colors テキストの色
 * @param textBaseline テキストのベースライン（"top", "middle", "bottom"など）
 * @param position テキストの配置（"left", "right", "center"など）
 */
export function drawTextWithOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  colors: string[],
  textBaseline: CanvasTextBaseline = "middle",
  position: CanvasTextAlign = "center"
) {
  ctx.save();
  ctx.font = `${fontSize}px Arial`;
  ctx.textBaseline = textBaseline;
  ctx.textAlign = position;
  // 縁取りを描画
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = fontSize * 0.16;
  ctx.strokeText(text, x, y);

  // テキスト本体を描画
  ctx.fillStyle = colors[0];
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * テキストを描画する
 * @param ctx
 * @param text 表示するテキスト
 * @param x X座標
 * @param y Y座標
 * @param fontSize フォントサイズ
 * @param colors テキストの色
 * @param textBaseline テキストのベースライン（"top", "middle", "bottom"など）
 * @param position テキストの配置（"left", "right", "center"など）
 */
export function drawTextWithDoubleOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  colors: string[],
  textBaseline: CanvasTextBaseline = "middle",
  position: CanvasTextAlign = "center"
) {
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


export function darkenColor(color: string, percent: number) {
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

