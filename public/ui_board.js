import { KomadaiUI } from "./ui_komadai.js";
import { UI } from "./ui.js";
import { gameManager, pieceImages } from "./main25062902.js";
import { CELL_SIZE, BOARD_SIZE, BOARD_COLOR, LINE_COLOR, LINEWIDTH, MOUSE_HIGHLIGHT_COLOR, KOMADAI_OFFSET_RATIO, KOMADAI_HEIGHT, MOVETIME, TIMER_RADIUS, TIMER_LINEWIDTH, TIMER_BORDER_WIDTH, TIMER_OFFSET_X, TIMER_OFFSET_Y, TIMER_BGCOLOR, TIMER_COLOR, MOVE_COLOR, PIECE_MOVES, UNPROMODED_TYPES } from "./const.js";
import { sendPutPiece, sendMovePiece } from "./emit.js";

export class BoardUI extends UI {
  teban;
  board;
  komadai;

  cellSize = CELL_SIZE;
  boardSize = BOARD_SIZE;
  draggingPiece = null;
  draggingPiecePos = null;
  hoveredCell = null;
  started = false;
  lastsend = null;

  constructor(params) {
    super(params);
    this.width = 10000;
    this.height = 10000;
    this.board = params.board;
    let komadai = new KomadaiUI({
      x: this.x,
      y: this.y,
      board: params.board
    });
    this.komadai = komadai;
    this.teban = params.teban;
  }

  init(teban) {
    this.teban = teban;
  }

  renderSelf(ctx, scale) {
    ctx.save();
    this.drawBoard(ctx, scale);
    ctx.restore();
  }

  drawBoard(ctx, scale) {
    ctx.fillStyle = BOARD_COLOR;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINEWIDTH;

    const cellSize = this.cellSize * scale;
    ctx.save()
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

    ctx.restore()

    ctx.save();
    this.komadai.draw(ctx, scale, this.draggingPiece, this.teban);
    ctx.restore();

    ctx.save();

    if (this.draggingPiece) {
      this.drawMove(ctx, scale);
    }

    ctx.restore();
    ctx.save();

    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }

    // マウスオーバー中のセルをハイライト
    if (gameManager.teban !== 0 && this.hoveredCell) {
      ctx.fillStyle = MOUSE_HIGHLIGHT_COLOR;
      ctx.fillRect(
        this.hoveredCell.x * CELL_SIZE * scale + LINEWIDTH / 2 - CELL_SIZE * scale * 9 / 2,
        this.hoveredCell.y * CELL_SIZE * scale + LINEWIDTH / 2 - CELL_SIZE * scale * 9 / 2,
        CELL_SIZE * scale - LINEWIDTH,
        CELL_SIZE * scale - LINEWIDTH
      );
    }

    ctx.restore();

    ctx.save();
    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }

    // 駒を描画
    this.drawPieces(ctx, scale);

    ctx.restore();

    if (this.draggingPiece) {
      this.drawDragging(ctx, scale);
    }
  }

  // マウスの位置から盤面の位置を取得
  getBoardPosition(pos) {
    const x = Math.floor(pos.x / CELL_SIZE + BOARD_SIZE / 2);
    const y = Math.floor(pos.y / CELL_SIZE + BOARD_SIZE / 2);
    let resX = 0;
    let resY = 0;

    if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
      resX = 4 + this.teban * (x - 4);
      resY = 4 + this.teban * (y - 4);
      return { x: resX, y: resY };
    }
    return { x: -1, y: -1 };
  }

  getKomadaiPieceAt(pos) {
    const komadaiX = BOARD_SIZE * CELL_SIZE / 2 + CELL_SIZE * KOMADAI_OFFSET_RATIO;
    const komadaiY = BOARD_SIZE * CELL_SIZE / 2 - KOMADAI_HEIGHT;

    // クリック位置がどの駒の範囲内かをチェック
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const type = this.komadai.types[i][j];
        if (!type) continue;
        if (this.board.komadaiPieces[this.teban === 1 ? 'sente' : 'gote'][type] <= 0) continue;
        if (
          pos.x >= komadaiX + j * CELL_SIZE &&
          pos.x <= komadaiX + j * CELL_SIZE + CELL_SIZE &&
          pos.y >= komadaiY + i * CELL_SIZE &&
          pos.y <= komadaiY + i * CELL_SIZE + CELL_SIZE
        ) {
          return type;
        }
      }
    }
    return null;
  }

  onMouseDown(pos) {
    const { x, y } = this.getBoardPosition(pos);
    if (x == -1 || y == -1) {
      const komadaiPiece = this.getKomadaiPieceAt(pos);
      if (komadaiPiece) {
        this.draggingPiecePos = pos;
        this.draggingPiece = { x: -1, y: -1, type: komadaiPiece, lastmoveptime: -5000 };
        // this.board.komadaiPieces[this.board.teban === 1 ? 'sente' : 'gote'][komadaiPiece]--;
      }
    } else if (this.board.map[x][y]) {
      if (this.board.map[x][y].teban == this.teban) {
        const piece = this.board.map[x][y];
        this.draggingPiece = { x: x, y: y, type: piece.type, lastmoveptime: piece.lastmoveptime };
        this.draggingPiecePos = pos;
      }
    }
  }

  onMouseMove(pos) {
    if (this.draggingPiece) {
      this.draggingPiecePos = pos;
    }
    const cell = this.getBoardPosition(pos);
    if (cell.x == -1 && cell.y == -1) {
      this.hoveredCell = null; // 盤面外ならリセット
    } else {
      this.hoveredCell = cell; // マウスオーバー中のセルを更新
    }
  }

  onMouseUp(pos) {
    console.log("mouseUp");
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos);
    if (this.draggingPiece.x === -1) {
      sendPutPiece(x, y, this.draggingPiece.type);
      if (gameManager.cpu === null) {
        const time = this.board.serverstarttime + performance.now() - this.board.starttime;
        const result = this.board.canPut(x, y, this.draggingPiece.type, gameManager.teban, time);
        if (result.res) {
          this.lastsend = { x: null, y: null, type: this.draggingPiece.type };
        }
      }
    } else {
      let nari = false;
      if (this.board.canPromote(this.draggingPiece.y, y, gameManager.teban, this.draggingPiece.type)) {
        nari = true;
      }
      sendMovePiece(this.draggingPiece.x, this.draggingPiece.y, x, y, nari);
      if (gameManager.cpu === null) {
        const time = this.board.serverstarttime + performance.now() - this.board.starttime;
        const result = this.board.getCanMovePiece(this.draggingPiece.x, this.draggingPiece.y, x, y, nari, gameManager.teban, time);
        if (result.res) {
          this.lastsend = { x: this.draggingPiece.x, y: this.draggingPiece.y, type: null };
        }
      }
    }
    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }

  onMouseUpRight(pos) {
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos);
    if (this.draggingPiece.x === -1) {
      sendPutPiece(x, y, this.draggingPiece.type);
      if (gameManager.cpu === null) {
        const time = this.board.serverstarttime + performance.now() - this.board.starttime;
        const result = this.board.canPut(x, y, this.draggingPiece.type, gameManager.teban, time);
        if (result.res) {
          this.lastsend = { x: null, y: null, type: this.draggingPiece.type };
        }
      }
    } else {
      sendMovePiece(this.draggingPiece.x, this.draggingPiece.y, x, y, false);
      if (gameManager.cpu === null) {
        const time = this.board.serverstarttime + performance.now() - this.board.starttime;
        const result = this.board.getCanMovePiece(this.draggingPiece.x, this.draggingPiece.y, x, y, false, gameManager.teban, time);
        if (result.res) {
          this.lastsend = { x: this.draggingPiece.x, y: this.draggingPiece.y, type: null };
        }
      }
    }
    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }


  drawPieceSelf(ctx, scale, piece) {
    let img = pieceImages[piece.type];
    if (img) {
      ctx.drawImage(img, -CELL_SIZE * scale / 2, -CELL_SIZE * scale / 2, CELL_SIZE * scale, CELL_SIZE * scale);
    }

    const timeDiff = performance.now() - piece.lastmoveptime;
    if (timeDiff < MOVETIME) {
      this.drawTimer(ctx, scale, timeDiff);
    }
  };

  drawPiece(ctx, scale, x, y) {
    if (this.lastsend && x === this.lastsend.x && y === this.lastsend.y) {
      return;
    }
    const piece = this.board.map[x][y];
    if (!piece) return
    ctx.save();
    ctx.translate(CELL_SIZE * (x - 4) * scale, CELL_SIZE * (y - 4) * scale);
    if (piece.teban == -1) {
      ctx.rotate(Math.PI);
    }
    this.drawPieceSelf(ctx, scale, piece);
    ctx.restore();
  }

  drawPieces(ctx, scale) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (this.draggingPiece && i === this.draggingPiece.x && j === this.draggingPiece.y) continue;
        this.drawPiece(ctx, scale, i, j);
      }
    }
  }

  drawDragging(ctx, scale) {
    ctx.save();
    ctx.translate(this.draggingPiecePos.x * scale, this.draggingPiecePos.y * scale);
    this.drawPieceSelf(ctx, scale, this.draggingPiece);
    ctx.restore();
  }

  drawTimer(ctx, scale, ptimeDiff) {
    const radius = Math.max(0, CELL_SIZE * TIMER_RADIUS * scale);
    const lineWidth = CELL_SIZE * TIMER_LINEWIDTH * scale;
    const borderWidth = CELL_SIZE * TIMER_BORDER_WIDTH * scale;
    const progress = ptimeDiff / MOVETIME;

    // タイマーの背景（灰色の円）
    ctx.beginPath();
    ctx.arc(
      TIMER_OFFSET_X * CELL_SIZE * scale,
      TIMER_OFFSET_Y * CELL_SIZE * scale,
      radius, 0, Math.PI * 2, false
    );
    ctx.strokeStyle = TIMER_BGCOLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // タイマーの進捗（青い円弧）
    ctx.beginPath();
    ctx.arc(
      TIMER_OFFSET_X * CELL_SIZE * scale,
      TIMER_OFFSET_Y * CELL_SIZE * scale,
      radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false
    );
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // 縁取りを描画
    ctx.beginPath();
    ctx.arc(
      TIMER_OFFSET_X * CELL_SIZE * scale,
      TIMER_OFFSET_Y * CELL_SIZE * scale,
      radius + lineWidth / 2, 0, Math.PI * 2, false
    );
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

  }


  drawMove(ctx, scale) {
    ctx.fillStyle = MOVE_COLOR;

    function drawSquare(moveX, moveY, teban) {
      ctx.save();
      if (teban === -1) {
        ctx.rotate(Math.PI);
      }
      ctx.fillRect(
        moveX * CELL_SIZE * scale - CELL_SIZE * scale * 9 / 2 + LINEWIDTH / 2,
        moveY * CELL_SIZE * scale - CELL_SIZE * scale * 9 / 2 + LINEWIDTH / 2,
        CELL_SIZE * scale - LINEWIDTH,
        CELL_SIZE * scale - LINEWIDTH
      );
      ctx.restore();
      return false;
    }

    if (this.draggingPiece.x < 0) return;

    for (const move of PIECE_MOVES[this.draggingPiece.type]) {
      let moveX = this.draggingPiece.x + move.dx * this.teban;
      let moveY = this.draggingPiece.y + move.dy * this.teban;
      while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
        const piece = this.board.map[moveX][moveY];
        if (piece && piece.teban === this.teban) break;
        if (drawSquare(moveX, moveY, this.teban)) return true;
        if (!move.recursive) break;
        if (piece) break;
        moveX += move.dx * this.teban;
        moveY += move.dy * this.teban;
      }
    }
  }
}
