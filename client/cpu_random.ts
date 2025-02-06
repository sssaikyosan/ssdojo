import { Board } from "./board";
import { BOARD_SIZE, KifuMove, MOVETIME, STARTHANDS, STARTMAP } from "./const";
import { CPU } from "./cpu";
import { CPUBoard, CPUMove, getAllPossibleMoves, Kifu, setBoard } from "./cpuboard";
import { gameManager } from "./main";
import { Piece } from "./piece";
import { shuffle } from "./utils";

/** 駒の価値テーブル */
/*
歩
香車
桂馬
飛車
銀
金
角
王
玉
と
成香
成桂
竜
成銀
馬
*/


export class CPURANDOM extends CPU {
  board: Board | null = null;
  cpu_board: CPUBoard = {
    map: STARTMAP,
    hands: STARTHANDS
  };

  kifu: Kifu[] = [];

  moves: CPUMove[] = [];
  goodMoves: { move: CPUMove, aival: number; }[] = [];
  waitingMoves: CPUMove[] = [];
  idx: number = 0;

  lastSendTime: number = 0;
  thinkTime: number = 100;


  //指し手を送信
  sendMovePiece() {
    const time = performance.now();
    for (let i = 0; i < this.waitingMoves.length; i++) {
      const move = this.waitingMoves[i];
      if (move.from.x >= 0) {
        const piece = this.board!.getPiece(move.from.x, move.from.y);
        if (!piece) continue;
        if (piece.lastMoveTime + MOVETIME > time) continue;
      }
      const send: KifuMove = {
        x: move.from.x,
        y: move.from.y,
        nx: move.to.x,
        ny: move.to.y,
        narazu: false,
        teban: -1,
        servertime: time,
      };


      if (gameManager.receiveMove(send)) {
        this.waitingMoves.splice(i, 1);
        return true;
      }
    }
    return false;
  }



  checkWaitingMoves(board: Board) {
    // キャッシュ用変数
    const boardSize = BOARD_SIZE;
    const pieces = board.pieces;
    const map = board.map;

    // 逆順ループでspliceによるインデックス問題を回避
    for (let i = this.waitingMoves.length - 1; i >= 0; i--) {
      const move = this.waitingMoves[i];
      const { from, to, nari } = move;
      let piece: Piece | undefined;

      // 持ち駒を打つ手の場合
      if (from.x === -1) {
        // キャッシュされたpieces配列を使用
        for (let j = 0, len = pieces.length; j < len; j++) {
          const p = pieces[j];
          if (p.teban != -1) break;
          if (p.x === -1 && p.y === from.y) {
            piece = p;
            break;
          }
        }
      }
      // 通常の手の場合
      else if (from.x >= 0 && from.x < boardSize &&
        from.y >= 0 && from.y < boardSize) {
        const idx = map[from.x][from.y];
        piece = pieces[idx];
      }

      // 無効な手を削除
      if (!piece || piece.teban !== -1 || !piece.canMove(board, to.x, to.y, !nari)) {
        this.waitingMoves.splice(i, 1);
      }
    }
  }

  decideMove(time: number) {
    if (time - this.lastSendTime < this.thinkTime) return;
    for (let i = 0; i < this.goodMoves.length; i++) {
      const move = this.goodMoves[i].move;
      for (const waitingMove of this.waitingMoves) {
        if (move.from.x === waitingMove.from.x &&
          move.from.y === waitingMove.from.y &&
          move.to.x === waitingMove.to.x &&
          move.to.y === waitingMove.to.y) {
          this.goodMoves.splice(i, 1);
          i--;
          continue;
        }
      }
      this.waitingMoves.push(move);
      break;
    }

    this.moves = [];
    this.idx = 0;
    this.kifu = [];
    this.goodMoves = [];
  }




  //毎フレーム呼び出される関数
  update(time: number) {
    if (this.board === null) return;
    if (time - this.board.starttime < 5000) return;
    this.checkWaitingMoves(this.board);
    this.sendMovePiece();

    if (this.lastSendTime + this.thinkTime < time) {
      const pieces = this.board.pieces;
      const map = this.board.map;
      this.cpu_board = setBoard(this.board, this.cpu_board);
      const rndmoves = getAllPossibleMoves(this.cpu_board, true);
      console.log(rndmoves.length);
      shuffle(rndmoves);
      for (let i = 0; i < rndmoves.length; i++) {
        const { from, to, nari } = rndmoves[i];
        if (from.x < 0) {
          const piece = pieces.find(p => p.x === -1 && p.type === from.y && p.teban === -1);
          if (!piece || !piece.canMove(this.board, to.x, to.y, !nari)) {
            rndmoves.splice(i, 1);
            i--;
            continue;
          }
        } else {
          const piece = pieces[map[from.x][from.y]];
          if (!piece || !piece.canMove(this.board, to.x, to.y, !nari)) {
            rndmoves.splice(i, 1);
            i--;
            continue;
          }

        }
        this.waitingMoves.push(rndmoves[i]);
        this.lastSendTime = time;
        break;
      }
    }
  }
}
