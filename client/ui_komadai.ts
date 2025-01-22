import { Teban } from "../share/type";
import { Board } from "./board";
import { BOARD_COLOR, BOARD_SIZE, CELL_SIZE, KOMADAI_HEIGHT, KOMADAI_OFFSET_RATIO, KOMADAI_PIECE_TYPE, KOMADAI_WIDTH, LINE_COLOR } from "./const";
import { ctx } from "./main";
import { Piece } from "./piece";
import { PieceImages, PieceTypes } from "./pieces";
import { drawTextWithDoubleOutline } from "./utils";

interface KomadaiUiParams {
  x: number;
  y: number;
  board: Board;
}

export class KomadaiUI {
  x: number;
  y: number;
  board: Board;
  width: number;
  height: number;
  cellSize: number;
  shortcut: { [key: string]: string; } = {
    "pawn": "Space",
    "lance": "Q",
    "knight": "W",
    "rook": "E",
    "silver": "A",
    "gold": "S",
    "bishop": "D",
  };

  constructor(params: KomadaiUiParams) {
    this.x = params.x;
    this.y = params.y;
    this.width = 0;
    this.height = 0;
    this.board = params.board;
    this.cellSize = CELL_SIZE;
  }

  draw(ctx: CanvasRenderingContext2D, scale: number, dragging: Piece | null, viewteban: Teban) {
    this.width = KOMADAI_WIDTH * scale;
    this.height = KOMADAI_HEIGHT * scale;
    this.drawKomadai(ctx, scale, "sente", dragging, viewteban);
    this.drawKomadai(ctx, scale, "gote", dragging, viewteban);
  }


  drawKomadai(ctx: CanvasRenderingContext2D, scale: number, teban: string, dragging: Piece | null, viewteban: Teban) {
    const x = BOARD_SIZE * CELL_SIZE * scale / 2 + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    const y = BOARD_SIZE * CELL_SIZE * scale / 2 - KOMADAI_HEIGHT * scale;
    const myteban = viewteban === 1 ? "sente" : "gote";
    ctx.fillStyle = BOARD_COLOR; // 駒台の色
    ctx.save();
    if (teban !== myteban) ctx.rotate(Math.PI);
    ctx.strokeStyle = LINE_COLOR;
    ctx.fillRect(x, y, this.width, this.height);
    ctx.strokeRect(x, y, this.width, this.height);
    this.drawKomadaiPieces(x, y, scale, teban, myteban, dragging);
    ctx.restore();
  }

  drawKomadaiPieces(x: number, y: number, scale: number, teban: string, myteban: string, dragging: Piece | null) {
    const komadaiOffsetX = x + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    const komadaiOffsetY = y + CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    ctx.translate(komadaiOffsetX, komadaiOffsetY);
    for (let i = 0; i < 4; i++) {
      ctx.save();
      for (let j = 0; j < 3; j++) {
        const type: number | null = KOMADAI_PIECE_TYPE[i * 3 + j];
        if (teban === myteban && type !== null && this.shortcut[PieceTypes[type]]) {
          drawTextWithDoubleOutline(ctx, this.shortcut[PieceTypes[type]], 0.02 * scale, 0.05 * scale, CELL_SIZE * 0.4 * scale, ["#ffcc88", "#00000000", "#00000000"], "center" as CanvasTextBaseline, "left");
        }
        if (type !== null) {
          this.drawKomadaiPiece(type, teban, myteban, scale, dragging);
          ctx.translate(CELL_SIZE * scale, 0);
        };
      }
      ctx.restore();
      ctx.translate(0, CELL_SIZE * scale);
    }
  }

  // 駒台の駒を描画
  drawKomadaiPiece(type: number, teban: string, myteban: string, scale: number, dragging: Piece | null) {
    const numteban = teban === "sente" ? 1 : -1;
    const onmyKomadai = this.board.pieces.filter(piece => piece.type === type && piece.x === -1 && piece.teban === numteban);
    const img = PieceImages[PieceTypes[type]];
    const pieceSize = CELL_SIZE * 0.8 * scale;
    const padding = CELL_SIZE * KOMADAI_OFFSET_RATIO * scale;
    let x = dragging?.type === type && dragging?.x === -1 && teban === myteban ? 1 : 0;
    for (let i = 0 + x; i < onmyKomadai.length; i++) {
      ctx.drawImage(img, (onmyKomadai.length - i - 1) * padding, 0, pieceSize, pieceSize);
    }
  }

  // onMouseDown(pos: { x: number, y: number; }) {
  //   for (let i = 0; i < 4; i++) {
  //     for (let j = 0; j < 3; j++) {
  //       if (pos.x / 2 > i * this.cellSize && pos.x / 2 < (i + 1) * this.cellSize &&
  //         pos.y > j * this.cellSize && pos.y < (j + 1) * this.cellSize) {
  //         if (this.types[i][j]) {
  //           this.boardUI.draggingPiece = this.board.komadaiPieces[this.boardUI.teban][this.types[i][j]];
  //         }
  //       }
  //     }
  //   }
  // }
}