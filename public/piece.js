const TIMER_RADIUS = 0.1;
const TIMER_LINEWIDTH = 0.1;
const TIMER_OFFSET_X = 0.2;
const TIMER_OFFSET_Y = - 0.2;
const TIMER_BORDER_WIDTH = 0.04;
const TIMER_BGCOLOR = 'rgb(223, 223, 223)';
const TIMER_COLOR = 'rgb(31, 63, 221)';

const MOVE_COLOR = '#cf8b1e'

const MOVETIME = 5000;

const pieceMoves = {
  pawn: [
    { dx: 0, dy: -1 } // 先手の場合、1マス前
  ],
  prom_pawn: [ // 成り駒（と金）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  lance: [
    { dx: 0, dy: -1, recursive: true } // 先手の場合、前方に無限
  ],
  prom_lance: [ // 成り駒（成香）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  knight: [
    { dx: 1, dy: -2 },
    { dx: -1, dy: -2 }
  ],
  prom_knight: [ // 成り駒（成桂）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  silver: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ],
  prom_silver: [ // 成り駒（成銀）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  gold: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  bishop: [
    { dx: 1, dy: -1, recursive: true }, // 右上
    { dx: -1, dy: -1, recursive: true },// 左上
    { dx: 1, dy: 1, recursive: true },  // 右下
    { dx: -1, dy: 1, recursive: true }  // 左下
  ],
  horse: [ // 成り駒（馬）
    { dx: 1, dy: -1, recursive: true }, // 右上
    { dx: -1, dy: -1, recursive: true },// 左上
    { dx: 1, dy: 1, recursive: true },  // 右下
    { dx: -1, dy: 1, recursive: true }, // 左下
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 },  // 下
    { dx: 1, dy: 0 },  // 右
    { dx: -1, dy: 0 }  // 左
  ],
  rook: [
    { dx: 0, dy: -1, recursive: true }, // 上
    { dx: 0, dy: 1, recursive: true },  // 下
    { dx: 1, dy: 0, recursive: true },  // 右
    { dx: -1, dy: 0, recursive: true }  // 左
  ],
  dragon: [ // 成り駒（龍）
    { dx: 0, dy: -1, recursive: true }, // 上
    { dx: 0, dy: 1, recursive: true },  // 下
    { dx: 1, dy: 0, recursive: true },  // 右
    { dx: -1, dy: 0, recursive: true }, // 左
    { dx: 1, dy: -1 }, // 右上
    { dx: -1, dy: -1 },// 左上
    { dx: 1, dy: 1 },  // 右下
    { dx: -1, dy: 1 }  // 左下
  ],
  king: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ],
  king2: [ // 相手の王将
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ]
};

class Piece {
  constructor(type, x, y, teban, lastMoveTime, ptime) {
    this.type = type;
    this.teban = teban;
    this.promoted = false;
    this.x = x;
    this.y = y;
    this.lastMoveTime = lastMoveTime;
    this.lastMovepTime = ptime;
  }

  draw(board) {
    if (this.x == -1 || this.y == -1) return;
    const img = pieceImages[this.type];
    if (img) {
      ctx.save();

      ctx.translate(board.offsetX + this.x * board.cellSize, board.offsetY + this.y * board.cellSize);
      if (this.teban == -1) {
        ctx.rotate(Math.PI);
        ctx.translate(-board.cellSize, -board.cellSize);
      }
      ctx.drawImage(img, 0, 0, board.cellSize, board.cellSize);
      ctx.restore();
    }
    let ptimeDiff = board.ptime - this.lastMovepTime;
    if (ptimeDiff < MOVETIME) {
      this.drawTimer(board, ptimeDiff);
    }
  }

  drawDragging(board) {
    const img = pieceImages[this.type];
    if (img) {
      ctx.drawImage(img, board.draggingPieceX - board.cellSize / 2, board.draggingPieceY - board.cellSize / 2, board.cellSize, board.cellSize);
      let ptimeDiff = board.ptime - this.lastMovepTime;
      if (ptimeDiff < MOVETIME) {
        this.drawDragTimer(board, ptimeDiff);
      }
    }
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
      console.log(xx, yy, type);
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

  drawMove(board) {

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
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(Math.PI);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
        ctx.fillRect(
          board.offsetX + moveX * board.cellSize + LINEWIDTH / 2,
          board.offsetY + moveY * board.cellSize + LINEWIDTH / 2,
          board.cellSize - LINEWIDTH,
          board.cellSize - LINEWIDTH
        );
        ctx.restore();
        if (!move.recursive) break;
        if (board.map[moveX][moveY] && board.map[moveX][moveY].teban != this.teban) break;
      }

    }

  }

  // ドーナツ型のタイマーを描画する関数
  drawTimer(board, ptimeDiff) {
    const radius = board.cellSize * TIMER_RADIUS;
    const lineWidth = board.cellSize * TIMER_LINEWIDTH;
    const borderWidth = board.cellSize * TIMER_BORDER_WIDTH;
    const progress = ptimeDiff / MOVETIME;

    // タイマーの背景（灰色の円）
    ctx.beginPath();
    ctx.arc(
      board.offsetX + this.x * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_X * board.cellSize,
      board.offsetY + this.y * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_Y * board.cellSize,
      radius, 0, Math.PI * 2, false
    );
    ctx.strokeStyle = TIMER_BGCOLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // タイマーの進捗（青い円弧）
    ctx.beginPath();
    ctx.arc(
      board.offsetX + this.x * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_X * board.cellSize,
      board.offsetY + this.y * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_Y * board.cellSize,
      radius, -board.teban * Math.PI / 2, -board.teban * Math.PI / 2 + Math.PI * 2 * progress, false
    );
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // 縁取りを描画
    ctx.beginPath();
    ctx.arc(
      board.offsetX + this.x * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_X * board.cellSize,
      board.offsetY + this.y * board.cellSize + board.cellSize * 1 / 2 + this.teban * TIMER_OFFSET_Y * board.cellSize,
      radius + lineWidth / 2, 0, Math.PI * 2, false
    );
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

  }

  drawDragTimer(board, ptimeDiff) {
    const radius = board.cellSize * TIMER_RADIUS; // タイマーの半径
    const lineWidth = board.cellSize * TIMER_LINEWIDTH; // ドーナツの太さ
    const borderWidth = board.cellSize * TIMER_BORDER_WIDTH;
    const progress = ptimeDiff / MOVETIME; // 3秒を3000ミリ秒として計算

    // タイマーの背景（灰色の円）
    ctx.beginPath();
    ctx.arc(board.draggingPieceX + TIMER_OFFSET_X * board.cellSize,
      board.draggingPieceY + TIMER_OFFSET_Y * board.cellSize,
      radius, 0, Math.PI * 2, false);
    ctx.strokeStyle = TIMER_BGCOLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // タイマーの進捗（青い円弧）
    ctx.beginPath();
    ctx.arc(board.draggingPieceX + TIMER_OFFSET_X * board.cellSize,
      board.draggingPieceY + TIMER_OFFSET_Y * board.cellSize,
      radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false);
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // 縁取りを描画
    ctx.beginPath();
    ctx.arc(board.draggingPieceX + TIMER_OFFSET_X * board.cellSize,
      board.draggingPieceY + TIMER_OFFSET_Y * board.cellSize,
      radius + lineWidth / 2, 0, Math.PI * 2, false);
    ctx.strokeStyle = TIMER_COLOR;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
}