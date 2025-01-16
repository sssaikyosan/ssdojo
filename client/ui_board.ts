import { Board } from "./board";
import { BOARD_COLOR, BOARD_SIZE, CELL_SIZE, KOMADAI_HEIGHT, KOMADAI_OFFSET_RATIO, LINE_COLOR, LINEWIDTH, MOUSE_HIGHLIGHT_COLOR } from "./const";
import { Emitter } from "./emitter";
import { Piece } from "./piece";
import { PieceType, PieceTypes } from "./pieces";
import { UI, UiParams } from "./ui";
import { KomadaiUI } from "./ui_komadai";

export interface BoardUiParams extends UiParams {
  emitter: Emitter;
  board: Board;
  teban: number;
}

export class BoardUI extends UI {
  emitter: Emitter;
  x: number = 0;
  y: number = 0;
  touchable: boolean = false;

  teban: number;
  board: Board;
  komadai: KomadaiUI | null = null;
  cellSize: number = CELL_SIZE;
  boardSize: number = BOARD_SIZE;
  draggingPiece: Piece | null = null;
  draggingPiecePos: { x: number, y: number; } | null = null;
  hoveredCell: { x: number, y: number; } | null = null;



  constructor(params: BoardUiParams) {
    super(params);
    this.emitter = params.emitter;
    this.board = params.board;
    let komadai = new KomadaiUI({
      x: params.x,
      y: params.y,
      board: params.board
    });
    this.komadai = komadai;
    this.teban = params.teban;
  }

  init(teban: number) {
    this.teban = teban;
  }

  renderSelf(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.save();
    this.drawBoard(ctx, scale);
    ctx.restore();
  }

  drawBoard(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.fillStyle = BOARD_COLOR;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINEWIDTH;

    const cellSize = this.cellSize * scale;
    ctx.save();
    ctx.translate(-cellSize * this.boardSize / 2, -cellSize * this.boardSize / 2);
    ctx.fillRect(0, 0, this.boardSize * cellSize, this.boardSize * cellSize);

    // 縦線
    for (let i = 0; i <= this.boardSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, cellSize * 9);
      ctx.stroke();
    }

    for (let i = 0; i <= this.boardSize; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(cellSize * 9, i * cellSize);
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    if (this.komadai) this.komadai.draw(ctx, scale, this.draggingPiece, this.teban);
    else console.log("komadai is null");
    ctx.restore();

    ctx.save();

    if (this.draggingPiece && this.draggingPiece.x !== -1) {
      this.draggingPiece.drawMove(ctx, scale);
    }

    ctx.restore();
    ctx.save();

    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }

    // マウスオーバー中のセルをハイライト
    if (this.hoveredCell) {
      ctx.fillStyle = MOUSE_HIGHLIGHT_COLOR;
      ctx.fillRect(
        this.hoveredCell.x * this.cellSize * scale + LINEWIDTH / 2 - this.cellSize * scale * 9 / 2,
        this.hoveredCell.y * this.cellSize * scale + LINEWIDTH / 2 - this.cellSize * scale * 9 / 2,
        this.cellSize * scale - LINEWIDTH,
        this.cellSize * scale - LINEWIDTH
      );
    }

    ctx.restore();

    ctx.save();
    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }

    // 駒を描画
    this.board.pieces.forEach(piece => {
      if (piece !== this.draggingPiece) {
        piece.draw(ctx, scale);
      }
    });

    ctx.restore();

    if (this.draggingPiece) {
      this.draggingPiece.drawDragging(ctx, scale, this);
    }
  }

  // マウスの位置から盤面の位置を取得
  getBoardPosition(pos: { x: number, y: number; }) {
    const x = Math.floor(pos.x / this.cellSize + BOARD_SIZE / 2);
    const y = Math.floor(pos.y / this.cellSize + BOARD_SIZE / 2);
    let resX = 0;
    let resY = 0;

    if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
      resX = 4 + this.teban * (x - 4);
      resY = 4 + this.teban * (y - 4);
      return { x: resX, y: resY };
    }
    return { x: -1, y: -1 };
  }

  getKomadaiPieceAt(pos: { x: number, y: number; }) {
    const komadaiX = BOARD_SIZE * this.cellSize / 2 + this.cellSize * KOMADAI_OFFSET_RATIO;
    const komadaiY = BOARD_SIZE * this.cellSize / 2 - KOMADAI_HEIGHT;

    // クリック位置がどの駒の範囲内かをチェック
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        if (!this.komadai) {
          console.log("komadai is null");
          continue;
        };
        const type = this.komadai.types[i][j];
        if (!type) continue;
        if (this.board.komadaiPieces[this.teban === 1 ? "sente" : "gote"][type] <= 0) continue;
        if (
          pos.x >= komadaiX + j * this.cellSize &&
          pos.x <= komadaiX + j * this.cellSize + this.cellSize &&
          pos.y >= komadaiY + i * this.cellSize &&
          pos.y <= komadaiY + i * this.cellSize + this.cellSize
        ) {
          return type;
        }
      }
    }
    return null;
  }

  onMouseDown(pos: { x: number, y: number; }) {
    const { x, y } = this.getBoardPosition(pos);
    if (x === -1 && y === -1) {
      const komadaiPiece = this.getKomadaiPieceAt(pos);
      if (komadaiPiece) {
        this.draggingPiecePos = pos;
        this.draggingPiece = new Piece(this.board, komadaiPiece as PieceType, -1, PieceTypes.findIndex(type => type === komadaiPiece), this.teban, this.board.serverstarttime, this.board.starttime);
      }
    } else if (this.board.map[x][y]) {
      if (this.board.map[x][y].teban == this.teban) {
        this.draggingPiece = this.board.map[x][y];
        this.draggingPiecePos = pos;
      }
    }
  }

  onMouseMove(pos: { x: number, y: number; }) {
    if (this.draggingPiece) {
      this.draggingPiecePos = pos;
    }
    const cell = this.getBoardPosition(pos);
    if (cell.x === -1 && cell.y === -1) {
      this.hoveredCell = null; // 盤面外ならリセット
    } else {
      this.hoveredCell = cell; // マウスオーバー中のセルを更新
    }
  }

  onMouseUp(pos: { x: number, y: number; }) {
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos);
    console.log("onMouseUp", x, y, this.draggingPiece.x, this.draggingPiece.y);
    if (this.draggingPiece.x === -1) {
      const data = {
        nx: x,
        ny: y,
        type: this.draggingPiece.type,
        teban: this.teban,
      };
      this.emitter.emit("putPiece", data);
    } else {
      const data = {
        x: this.draggingPiece.x,
        y: this.draggingPiece.y,
        nx: x,
        ny: y,
        narazu: false,
        teban: this.teban,
      };
      this.emitter.emit("movePiece", data);
    }


    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }

  onMouseUpRight(pos: { x: number, y: number; }) {
    if (!this.draggingPiece) return;
    const npos = this.getBoardPosition(pos);

    if (this.draggingPiece.x === -1) {
      const data = {
        nx: npos.x,
        ny: npos.y,
        type: this.draggingPiece.type,
        narazu: true,
        teban: this.teban,
      };
      this.emitter.emit("putPiece", data);
    } else {
      const data = {
        x: this.draggingPiece.x,
        y: this.draggingPiece.y,
        nx: npos.x,
        ny: npos.y,
        narazu: true,
        teban: this.teban,
      };
      this.emitter.emit("movePiece", data);
    }
    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }

  getDraggingPos() {
    if (!this.draggingPiece) return null;
    return { x: this.draggingPiecePos?.x, y: this.draggingPiecePos?.y };
  }
}