
class Piece {
  constructor(board, type, x, y, teban, lastMoveTime, ptime) {
    this.board = board;
    this.type = type;
    this.teban = teban;
    this.promoted = false;
    this.x = x;
    this.y = y;
    this.lastMoveTime = lastMoveTime;
    this.lastMovepTime = ptime;
  }

  draw(ctx, scale) {
    if (this.x === -3) return;
    ctx.save();
    ctx.translate(CELL_SIZE * (this.x - 4) * scale, CELL_SIZE * (this.y - 4) * scale);
    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }
    this.drawSelf(ctx, scale);
    ctx.restore();
  }

  drawSelf(ctx, scale) {
    const img = pieceImages[this.type];
    if (img) {
      ctx.drawImage(img, -CELL_SIZE * scale / 2, -CELL_SIZE * scale / 2, CELL_SIZE * scale, CELL_SIZE * scale);
    }
    let ptimeDiff = board.ptime - this.lastMovepTime;
    if (ptimeDiff < MOVETIME) {
      this.drawTimer(ctx, scale, board, ptimeDiff);
    }
  }

  drawDragging(ctx, scale, boardui) {
    ctx.save();
    ctx.translate(boardui.draggingPiecePos.x * scale, boardui.draggingPiecePos.y * scale);
    this.drawSelf(ctx, scale);
    ctx.restore();
  }

  // 成り駒の種類を返す
  getPromotedType() {
    const promotedTypes = {
      pawn: 'prom_pawn',
      lance: 'prom_lance',
      knight: 'prom_knight',
      silver: 'prom_silver',
      bishop: 'horse',
      rook: 'dragon'
    };
    return promotedTypes[this.type] || this.type;
  }

  // 成り駒の種類を返す
  getUnPromotedType() {
    const promotedTypes = {
      prom_pawn: 'pawn',
      prom_lance: 'lance',
      prom_knight: 'knight',
      prom_silver: 'silver',
      horse: 'bishop',
      dragon: 'rook'
    };
    return promotedTypes[this.type] || this.type;
  }

  canMove(nx, ny, nteban, map, narazu) {
    const dx = nx - this.x;
    const dy = ny - this.y;

    function checkMyPiece(xx, yy, teban, type) {
      if (map[xx][yy] && map[xx][yy].teban === nteban) return false;
      if (!narazu) return true;
      if (type === 'pawn' || type === 'lance') {
        if (teban === 1 && yy === 0) return false;
        if (teban === -1 && yy === 8) return false;
      } else if (type === 'knight') {
        if (teban === 1 && yy <= 1) return false;
        if (teban === -1 && yy >= 7) return false;
      }
      return true;
    }

    // 駒の種類に応じた動きを取得
    const moves = pieceMoves[this.type];
    if (!moves) return false;

    // 動きの中に一致するものがあるか確認
    for (const move of moves) {
      if (move.dx === dx && move.dy === dy * nteban) return checkMyPiece(this.x + move.dx, this.y + move.dy * nteban, this.teban, this.type);

      // 再帰的に動きを計算
      if (move.recursive) {
        let currentX = this.x + move.dx;
        let currentY = this.y + move.dy * nteban;
        while (currentX >= 0 && currentX < BOARD_SIZE && currentY >= 0 && currentY < BOARD_SIZE) {
          if (map[currentX][currentY] && map[currentX][currentY].teban === nteban) break;
          if (currentX === nx && currentY === ny) return checkMyPiece(currentX, currentY, this.teban, this.type);
          if (map[currentX][currentY] && map[currentX][currentY].teban !== nteban) break;
          currentX += move.dx;
          currentY += move.dy * nteban;
          if (currentX < 0 || currentX >= BOARD_SIZE || currentY < 0 || currentY >= BOARD_SIZE) break;
        }
      }
    }

    return false;
  }

  // 移動可能なマスの描画
  drawMove(ctx, scale, board) {
    ctx.fillStyle = MOVE_COLOR;
    for (let move of pieceMoves[this.type]) {
      let moveX = this.x;
      let moveY = this.y;
      while (true) {
        moveX = moveX + move.dx * this.teban;
        moveY = moveY + move.dy * this.teban;
        if (moveX < 0 || moveX >= BOARD_SIZE || moveY < 0 || moveY >= BOARD_SIZE) break;
        if (board.map[moveX][moveY] && board.map[moveX][moveY].teban == this.teban) break;
        ctx.save();
        if (this.teban == -1) {
          ctx.rotate(Math.PI);
        }
        ctx.fillRect(
          moveX * CELL_SIZE * scale - CELL_SIZE * scale * 9 / 2 + LINEWIDTH / 2,
          moveY * CELL_SIZE * scale - CELL_SIZE * scale * 9 / 2 + LINEWIDTH / 2,
          CELL_SIZE * scale - LINEWIDTH,
          CELL_SIZE * scale - LINEWIDTH
        );
        ctx.restore();
        if (!move.recursive) break;
        if (board.map[moveX][moveY] && board.map[moveX][moveY].teban != this.teban) break;
      }

    }

  }

  // ドーナツ型のタイマーを描画する関数
  drawTimer(ctx, scale, board, ptimeDiff) {
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
}