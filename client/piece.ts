import { Board } from "./board";
import { BOARD_SIZE, CELL_SIZE, KOMADAI_PIECE_TYPE, LINEWIDTH, Move, MOVE_COLOR, MOVETIME, pieceMoves, TIMER_BGCOLOR, TIMER_BORDER_WIDTH, TIMER_COLOR, TIMER_LINEWIDTH, TIMER_OFFSET_X, TIMER_OFFSET_Y, TIMER_RADIUS } from "./const";
import { PieceImages, PieceType, PieceTypes } from "./pieces";
import { BoardUI } from "./ui_board";



export class Piece {
  board: Board;
  type: PieceType;
  teban: number;
  x: number;
  y: number;
  lastMoveServerTime: number;
  lastMoveTime: number;
  idx: number;

  constructor(board: Board, type: PieceType, x: number, y: number, teban: number, servertime: number, time: number, idx: number) {
    this.board = board;
    this.type = type;
    this.teban = teban;
    this.x = x;
    this.y = y;
    this.lastMoveServerTime = servertime;
    this.lastMoveTime = time;
    this.idx = idx;
  }



  // 成り駒の種類を返す
  getPromotedType() {
    const promotedTypes = {
      pawn: "prom_pawn",
      lance: "prom_lance",
      knight: "prom_knight",
      silver: "prom_silver",
      bishop: "horse",
      rook: "dragon"
    };
    return promotedTypes[this.type as keyof typeof promotedTypes] as PieceType || this.type;
  }

  // 成り駒の種類を返す
  getUnPromotedType() {
    const promotedTypes = {
      prom_pawn: "pawn",
      prom_lance: "lance",
      prom_knight: "knight",
      prom_silver: "silver",
      horse: "bishop",
      dragon: "rook"
    };
    return promotedTypes[this.type as keyof typeof promotedTypes] as PieceType || this.type;
  }

  // 駒の種類を数値で返す
  getTypeNum(type: PieceType) {
    return PieceTypes.indexOf(type);
  }



  //移動先のマスに自分の駒があるかどうかを判定
  //１段目及び２段目の判定
  checkMyPiece(xx: number, yy: number, narazu: boolean, teban: number, type: PieceType) {
    if (this.board.pieces[this.board.map[xx][yy]] && this.board.pieces[this.board.map[xx][yy]].teban === teban) return false;
    if (!narazu) return true;
    if (type === "pawn" || type === "lance") {
      if (teban === 1 && yy === 0) return false;
      if (teban === -1 && yy === 8) return false;
    } else if (type === "knight") {
      if (teban === 1 && yy <= 1) return false;
      if (teban === -1 && yy >= 7) return false;
    }
    return true;
  }

  //２歩の判定
  isNotNihu(nx: number, teban: number, type: PieceType) {
    if (type !== "pawn") return true;
    for (let i = 0; i < BOARD_SIZE; i++) {
      const piece = this.board.pieces[this.board.map[nx][i]];
      if (piece && piece.type === "pawn" && piece.teban === teban) return false;
    }
    return true;
  }

  //指定した位置に移動可能か判定
  canMove(nx: number, ny: number, narazu: boolean) {
    console.log(this);
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;
    const teban = this.teban;

    //駒台の駒を打つ場合
    if (this.x === -1) {
      if (ny < 0 || ny >= KOMADAI_PIECE_TYPE.length) return false;
      if (this.board.map[nx][ny] !== -1) return false;
      if (this.checkMyPiece(nx, ny, true, teban, this.type)) {
        return this.isNotNihu(nx, teban, this.type);
      }
      return false;
    }

    // 駒の種類に応じた動きを取得
    const moves: readonly { dx: number, dy: number, recursive: boolean; }[] = pieceMoves[this.type];
    if (!moves) return false;

    // 動きの中に一致するものがあるか確認
    return this.repeatMove((x, y) => {
      if (x === nx && y === ny) return this.checkMyPiece(nx, ny, narazu, teban, this.type);
      return false;
    });
  }


  // 駒の動きを繰り返す関数
  repeatMove(cb: (x: number, y: number) => boolean) {
    console.log("repeatMove", this.x, this.y);
    for (let move of pieceMoves[this.type]) {
      let moveX = this.x + move.dx * this.teban;
      let moveY = this.y + move.dy * this.teban;
      while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
        const piece = this.board.pieces[this.board.map[moveX][moveY]];
        if (piece && piece.teban == this.teban) break;
        if (cb(moveX, moveY)) return true;
        if (!move.recursive) break;
        if (piece) break;
        moveX += move.dx * this.teban;
        moveY += move.dy * this.teban;
      }
    }
    return false;
  }

  getMoves(time: number) {
    const moves: Move[] = [];
    if (this.x === -1) return moves;
    for (let move of pieceMoves[this.type]) {
      let moveX = this.x + move.dx * this.teban;
      let moveY = this.y + move.dy * this.teban;
      while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
        const piece = this.board.pieces[this.board.map[moveX][moveY]];
        if (piece && piece.teban == this.teban) break;
        moves.push({ x: this.x, y: this.y, nx: moveX, ny: moveY, narazu: false, teban: this.teban, servertime: time });
        if (!move.recursive) break;
        if (piece) break;
        moveX += move.dx * this.teban;
        moveY += move.dy * this.teban;
      }
    }
    return moves;
  }










  /*＊＊＊＊＊＊＊＊＊*/
  /*ここから描画用関数*/
  /*＊＊＊＊＊＊＊＊＊*/

  // 駒の描画
  draw(ctx: CanvasRenderingContext2D, scale: number) {
    if (this.x === -1) return;
    ctx.save();
    ctx.translate(CELL_SIZE * (this.x - 4) * scale, CELL_SIZE * (this.y - 4) * scale);
    if (this.teban == -1) {
      ctx.rotate(Math.PI);
    }
    this.drawSelf(ctx, scale);
    ctx.restore();
  }

  drawSelf(ctx: CanvasRenderingContext2D, scale: number) {
    const img = PieceImages[this.type as keyof typeof PieceImages];
    if (img) {
      ctx.drawImage(img, -CELL_SIZE * scale / 2, -CELL_SIZE * scale / 2, CELL_SIZE * scale, CELL_SIZE * scale);
    }

    const timeDiff = performance.now() - this.lastMoveTime;
    if (timeDiff < MOVETIME) {
      this.drawTimer(ctx, scale, timeDiff);
    }
  }

  drawDragging(ctx: CanvasRenderingContext2D, scale: number, boardui: BoardUI) {
    if (!boardui.draggingPiecePos) return;
    ctx.save();
    ctx.translate(boardui.draggingPiecePos.x * scale, boardui.draggingPiecePos.y * scale);
    this.drawSelf(ctx, scale);
    ctx.restore();
  }


  // 移動可能なマスの描画
  drawMove(ctx: CanvasRenderingContext2D, scale: number) {
    ctx.fillStyle = MOVE_COLOR;
    this.repeatMove((moveX, moveY) => {
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
      return false;
    });
  }


  // ドーナツ型のタイマーを描画する関数
  drawTimer(ctx: CanvasRenderingContext2D, scale: number, ptimeDiff: number) {
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