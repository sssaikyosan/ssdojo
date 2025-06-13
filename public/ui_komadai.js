import { CELL_SIZE, KOMADAI_WIDTH, KOMADAI_HEIGHT, BOARD_SIZE, KOMADAI_OFFSET_RATIO, BOARD_COLOR, LINE_COLOR } from "./const.js";
import { ctx, pieceImages } from "./main.js";
import { drawTextWithDoubleOutline } from "./utils.js";

export class KomadaiUI {
  cellSize = CELL_SIZE;
  constructor(params) {
    this.x = params.x;
    this.y = params.y;
    this.board = params.board;
  }
  types = [
    ['pawn', null, null],
    ['lance', 'knight', 'rook'],
    ['silver', 'gold', 'bishop'],
    ['king', 'king2', null]];

  draw(ctx, scale, draggingPiece, viewteban) {
    this.width = KOMADAI_WIDTH * scale;
    this.height = KOMADAI_HEIGHT * scale;
    this.drawKomadai(ctx, scale, 'sente', draggingPiece, viewteban);
    this.drawKomadai(ctx, scale, 'gote', draggingPiece, viewteban);
  }


  drawKomadai(ctx, scale, teban, draggingPiece, viewteban) {
    const x = BOARD_SIZE * CELL_SIZE * scale / 2 + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    const y = BOARD_SIZE * CELL_SIZE * scale / 2 - KOMADAI_HEIGHT * scale;
    const myteban = viewteban === 1 ? 'sente' : 'gote';
    ctx.fillStyle = BOARD_COLOR; // 駒台の色
    ctx.save();
    if (teban !== myteban) ctx.rotate(Math.PI);
    ctx.strokeStyle = LINE_COLOR;
    ctx.fillRect(x, y, this.width, this.height);
    ctx.strokeRect(x, y, this.width, this.height);
    this.drawKomadaiPieces(x, y, scale, this.board.komadaiPieces[teban], draggingPiece, teban, viewteban);
    ctx.restore();
  }

  drawKomadaiPieces(x, y, scale, komadai, draggingPiece, teban, viewteban) {
    const komadaiOffsetX = x + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    const komadaiOffsetY = y + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    ctx.translate(komadaiOffsetX, komadaiOffsetY);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      for (let j = 0; j < 3; j++) {
        if (this.types[i][j]) {
          this.drawKomadaiPiece(this.types[i][j], komadai, scale, draggingPiece, teban, viewteban);
          ctx.translate(CELL_SIZE * scale, 0);
        };
      }
      ctx.restore();
      ctx.translate(0, CELL_SIZE * scale);
    }
  }

  // 駒台の駒を描画
  drawKomadaiPiece(type, komadai, scale, draggingPiece, teban, viewteban) {
    const img = pieceImages[type];
    const pieceSize = CELL_SIZE * 0.8 * scale;
    const padding = CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    let drag = 0;
    if (draggingPiece !== null && draggingPiece.x === -1 && draggingPiece.type === type && teban === viewteban) {
      drag = 1;
    };
    for (let i = 0; i < (komadai[type] - drag); i++) {
      ctx.drawImage(img, (komadai[type] - i - 1) * padding, 0, pieceSize, pieceSize);
    }
  }

  onMouseDown(pos) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        if (pos.x / 2 > i * this.cellSize && pos.x / 2 < (i + 1) * this.cellSize &&
          pos.y > j * this.cellSize && pos.y < (j + 1) * this.cellSize) {
          if (this.types[i][j]) {
            this.board.draggingPiece = this.board.komadaiPieces[this.board.teban][this.types[i][j]];
          }
        }
      }
    }
  }
}