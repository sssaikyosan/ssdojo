import { Teban } from "../share/type";
import { Board } from "./board";
import { BOARD_SIZE, CELL_SIZE, LINEWIDTH, MOVE_COLOR, MOVETIME, PIECE_MOVES, TIMER_BGCOLOR, TIMER_BORDER_WIDTH, TIMER_COLOR, TIMER_LINEWIDTH, TIMER_OFFSET_X, TIMER_OFFSET_Y, TIMER_RADIUS } from "./const";
import { PieceImages, PieceTypeNormals, PieceTypes } from "./pieces";
import { BoardUI } from "./ui_board";

export class Piece {
  type: number;
  /** 駒台にある場合は `-1` */
  x: number;
  /** 駒台にある場合は (`PieceTypeNormals`のindex) */
  y: number;
  teban: Teban;
  lastMoveServerTime: number;
  lastMoveTime: number;
  idx: number;

  constructor(type: number, x: number, y: number, teban: Teban, servertime: number, time: number, idx: number) {
    this.type = type;
    this.teban = teban;
    this.x = x;
    this.y = y;
    this.lastMoveServerTime = servertime;
    this.lastMoveTime = time;
    this.idx = idx;
  }

  clone(): Piece {
    return new Piece(
      this.type,
      this.x,
      this.y,
      this.teban,
      this.lastMoveServerTime,
      this.lastMoveTime,
      this.idx,
    );
  }

  // 成り駒の種類を返す
  getPromotedType() {
    if (this.type < 7) return this.type + 8;
    return this.type;
  }

  // 成り駒の種類を返す
  getUnPromotedType() {
    if (this.type < 9) return this.type;
    return this.type - 8;
  }



  //移動先のマスに自分の駒があるかどうかを判定   とりあえず引数で
  //１段目及び２段目の判定
  isTopCell(y: number, narazu: boolean, teban: Teban, type: number) {
    if (!narazu) return false;
    if (type === 1 || type === 4) {
      if (teban === 1 && y === 0) return true;
      if (teban === -1 && y === 8) return true;
    } else if (type === 5) {
      if (teban === 1 && y <= 1) return true;
      if (teban === -1 && y >= 7) return true;
    }
    return false;
  }

  //２歩の判定 ピースの責任ではない    とりあえず引数で
  isNihu(board: Board, nx: number, teban: Teban, type: number) {
    if (type !== 1) return false;
    const pieces = board.pieces;
    const line = board.map[nx];
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!pieces[line[i]]) continue;
      if (pieces[line[i]].type !== 1) continue;
      if (pieces[line[i]].teban !== teban) continue;
      return true;
    }
    return false;
  }

  isMyPiece(board: Board, x: number, y: number, teban: number) {
    if (board.pieces[board.map[x][y]] && board.pieces[board.map[x][y]].teban === teban) return true;
    return false;
  }

  //指定した位置に移動可能か判定
  canMove(board: Board, nx: number, ny: number, narazu: boolean) {
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;
    const teban = this.teban;

    //駒台の駒を打つ場合
    if (this.x === -1) {
      if (this.y < 0 || this.y >= PieceTypeNormals.length) return false;
      if (board.map[nx][ny] !== -2) return false;
      if (this.isMyPiece(board, nx, ny, teban)) false;
      if (this.isTopCell(ny, true, teban, this.y)) return false;
      if (this.isNihu(board, nx, teban, this.y)) return false;
      return true;
    }

    // 駒の種類に応じた動きを取得
    const moves: readonly { x: number, y: number, recursive: boolean; }[] = PIECE_MOVES[this.type];
    if (!moves) return false;
    // 動きの中に一致するものがあるか確認
    return this.repeatMove(board, (x, y) => {
      if (x !== nx || y !== ny) return false;
      if (this.isMyPiece(board, x, y, teban)) return false;
      if (this.isTopCell(y, narazu, teban, this.type)) return false;
      return true;
    });
  }

  // 駒の動きを繰り返す関数 これは？　保留…    とりあえず引数で
  repeatMove(board: Board, cb: (x: number, y: number) => boolean) {
    for (const move of PIECE_MOVES[this.type]) {
      let moveX = this.x + move.x * this.teban;
      let moveY = this.y + move.y * this.teban;
      while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
        const piece = board.pieces[board.map[moveX][moveY]];
        if (piece && piece.teban === this.teban) break;
        if (cb(moveX, moveY)) return true;
        if (!move.recursive) break;
        if (piece) break;
        moveX += move.x * this.teban;
        moveY += move.y * this.teban;
      }
    }
    return false;
  }









  // 駒自身が描画関数を持つより、
  // 駒を描画するクラスを作るべきかも
  // 将棋のロジックを持つ駒と、描画用の駒。
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
    let img = PieceImages[PieceTypes[this.type]];
    if (this.type === 8 && this.teban === -1) img = PieceImages["king2"];
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


  // 移動可能なマスの描画   とりあえず引数で‥
  drawMove(board: Board, ctx: CanvasRenderingContext2D, scale: number) {
    ctx.fillStyle = MOVE_COLOR;
    this.repeatMove(board, (moveX, moveY) => {
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