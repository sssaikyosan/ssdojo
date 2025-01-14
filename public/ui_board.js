class BoardUI extends UI {
  board = null;
  cellSize = CELL_SIZE;
  boardSize = BOARD_SIZE;
  draggingPiece = null;
  draggingPiecePos = null;
  hoveredCell = null;


  constructor(params) {
    super(params);
    this.width = CELL_SIZE * BOARD_SIZE;
    this.height = CELL_SIZE * BOARD_SIZE;
    this.board = params.board;
    let komadai = new KomadaiUI({
      x: this.x,
      y: this.y,
      board: params.board
    });
    this.komadai = komadai;
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

    this.komadai.draw(ctx, scale);
    ctx.restore();

    ctx.save();

    if (this.draggingPiece) {
      this.draggingPiece.drawMove(ctx, scale, this.board);
    }

    ctx.restore();
    ctx.save();

    if (this.board.teban == -1) {
      ctx.rotate(Math.PI);
    }

    // マウスオーバー中のセルをハイライト
    if (this.hoveredCell) {
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
    if (this.board.teban == -1) {
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
  getBoardPosition(pos) {
    const x = Math.floor(pos.x / CELL_SIZE + BOARD_SIZE / 2);
    const y = Math.floor(pos.y / CELL_SIZE + BOARD_SIZE / 2);
    let resX = 0;
    let resY = 0;

    if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize) {
      resX = 4 + this.board.teban * (x - 4);
      resY = 4 + this.board.teban * (y - 4);
      return { x: resX, y: resY };
    }
    return { x: -3, y: -3 };
  }

  getKomadaiPieceAt(pos) {
    const komadaiX = BOARD_SIZE * CELL_SIZE / 2 + CELL_SIZE * KOMADAI_OFFSET_RATIO;
    const komadaiY = BOARD_SIZE * CELL_SIZE / 2 - KOMADAI_HEIGHT;

    // クリック位置がどの駒の範囲内かをチェック
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const type = this.komadai.types[i][j];
        if (!type) continue;
        if (this.board.komadaiPieces[this.board.teban === 1 ? 'sente' : 'gote'][type] <= 0) continue;
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
    if (x == -3 || y == -3) {
      const komadaiPiece = this.getKomadaiPieceAt(pos);
      if (komadaiPiece) {
        this.draggingPiecePos = pos;
        this.draggingPiece = new Piece(this.board, komadaiPiece, -3, -3, this.board.teban, this.board.starttime, 0);
        this.board.komadaiPieces[this.board.teban === 1 ? 'sente' : 'gote'][komadaiPiece]--;
      }
    } else if (this.board.map[x][y]) {
      if (this.board.map[x][y].teban == this.board.teban) {
        this.draggingPiece = this.board.map[x][y];
        this.draggingPiecePos = pos;
      }
    }
  }

  onMouseMove(pos) {
    if (this.draggingPiece) {
      this.draggingPiecePos = pos;
    }
    const cell = this.getBoardPosition(pos);
    if (cell.x == -3 && cell.y == -3) {
      this.hoveredCell = null; // 盤面外ならリセット
    } else {
      this.hoveredCell = cell; // マウスオーバー中のセルを更新
    }
  }

  onMouseUp(pos) {
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos);
    if (this.draggingPiece.x == -3) this.board.putPiece(x, y, this.draggingPiece);
    else this.board.movePiece(x, y, this.draggingPiece, false);
    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }

  onMouseUpRight(pos) {
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos);
    if (x == -3 && y == -3) this.board.putPiece(x, y, this.draggingPiece);
    else this.board.movePiece(x, y, this.draggingPiece, true);
    this.draggingPiece = null;
    this.draggingPiecePos = null;
  }
}
