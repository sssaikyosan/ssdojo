import { Board } from "./board";
import { BOARD_SIZE, KOMADAI_PIECE_TYPE, Move } from "./const";
import { Emitter } from "./emitter";
import { Piece } from "./piece";
import { PieceType } from "./pieces";



export class CPU {
  board: Board | null = null;
  aiboard: Board = new Board(new Emitter());
  teban: number = 0;
  cputime: number = 0;
  time: number = 0;

  currentEval: number = 0;

  moves: Move[] = [];
  movepoints: { idx: number, aival: number; }[] = [];
  idx: number = 0;

  opponentMoves: Move[] = [];
  opevals: number[] = [];
  opidx: number = 0;

  init(board: Board, teban: number, time: number) {
    this.board = board;
    this.aiboard = new Board(new Emitter());
    this.teban = teban;
    this.cputime = 0;
    this.time = time;

    this.moves = [];

    this.movepoints = [];
    this.idx = 0;

    this.opponentMoves = [];
    this.opevals = [];
    this.opidx = 0;
  }

  evaluatePosition(): number {
    let score = 0;
    for (let piece of this.aiboard.pieces) {
      score += this.getPieceValue(piece.type) * piece.teban * this.teban;
    }
    return score;
  }

  getPieceValue(type: PieceType): number {
    // 駒の価値テーブル
    const values = {
      pawn: 105,
      prom_pawn: 483,
      lance: 227,
      prom_lance: 348,
      knight: 279,
      prom_knight: 535,
      silver: 444,
      prom_silver: 543,
      gold: 529,
      bishop: 576,
      horse: 730,
      rook: 700,
      dragon: 1002,
      king: 9999999,
      king2: 9999999,
      none: 0,
    };
    return values[type] || 0;
  }

  getValidPuts(piece: Piece) {
    const puts: Move[] = [];
    for (let nx = 0; nx < BOARD_SIZE; nx++) {
      for (let ny = 0; ny < BOARD_SIZE; ny++) {
        if (!piece.canMove(nx, ny, false)) continue;
        puts.push({ x: -1, y: KOMADAI_PIECE_TYPE.indexOf(piece.type), nx: nx, ny: ny, narazu: false, teban: piece.teban, servertime: this.time });
      }
    }
    return puts;
  }

  getAllLegalMoves(teban: number, time: number = Infinity) {
    const moves: Move[] = [];

    let pieceFlag = [false, false, false, false, false, false, false, false, false];

    //合法手を取得
    for (let piece of this.aiboard.pieces) {
      if (piece.teban !== teban) continue;
      if (piece.x === -1) {
        if (pieceFlag[piece.y]) continue;
        moves.push(...this.getValidPuts(piece));
        pieceFlag[piece.y] = true;
      } else {
        moves.push(...piece.getMoves(time));
      }
    }
    return moves;
  }

  // ミニマックスで最善の手を選択
  minimax(depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity) {
    if (depth === 0) return this.evaluatePosition();
    const moves = this.getAllLegalMoves(isMaximizing ? this.teban : -this.teban);
    if (moves.length === 0) {
      console.log("moves length is 0");
      return isMaximizing ? -Infinity : Infinity;
    };
    this.sortMoves(moves, isMaximizing);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        console.log("move", move);
        if (!this.aiboard.movePieceAI(move)) {
          throw new Error(`Invalid move: ${move.x},${move.y} -> ${move.nx},${move.ny}`);
        }
        const aival = this.minimax(depth - 1, false);
        this.aiboard.undoMoveForAI();

        maxEval = Math.max(maxEval, aival);
        alpha = Math.max(alpha, aival);

        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        console.log("move", move);
        if (!this.aiboard.movePieceAI(move)) {
          throw new Error(`Invalid move: ${move.x},${move.y} -> ${move.nx},${move.ny})`);
        }
        const aival = this.minimax(depth - 1, true);
        this.aiboard.undoMoveForAI();

        minEval = Math.min(minEval, aival);
        beta = Math.min(beta, aival);

        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  sortMoves(moves: Move[], isMaximizing: boolean) {
    // キラームーブヒューリスティックによる手のソート
    moves.sort((a, b) => {
      const evalA = this.quickEvaluateMove(a);
      const evalB = this.quickEvaluateMove(b);
      return isMaximizing ? evalB - evalA : evalA - evalB;
    });
  }

  quickEvaluateMove(move: Move): number {
    // 簡易的な手の評価
    let score = 0;

    // 駒の価値
    const targetPiece = this.aiboard.pieces[this.aiboard.map[move.nx][move.ny]];
    if (targetPiece) {
      score += this.getPieceValue(targetPiece.type);
    }
    return score;
  }

  deepCopyBoard(board: Board) {
    // this.aiboard = new Board(new Emitter());
    this.aiboard.pieces = [];
    this.aiboard.map = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(-2));

    // 駒リストのコピー
    for (const piece of board.pieces) {
      this.aiboard.pieces.push(new Piece(this.aiboard, piece.type, piece.x, piece.y, piece.teban, piece.lastMoveServerTime, piece.lastMoveTime, piece.idx));
    }

    // 盤面のコピー
    for (let piece of this.aiboard.pieces) {
      if (piece.x === -1) continue;
      this.aiboard.map[piece.x][piece.y] = piece.idx;
    }
    console.log("deepCopyBoard", this.aiboard.map);
    console.log("Board", board.map);
    console.log("deepCopyPieces", this.aiboard.pieces);
    console.log("Board", board.pieces);
  }

  reset() {
    this.moves = [];
    this.movepoints = [];
    this.idx = 0;

    this.opponentMoves = [];
    this.opevals = [];
    this.opidx = 0;
  }

  update(time: number) {
    console.log("start", this.aiboard.map);
    this.time = time;
    if (this.board === null) return;

    if (this.moves.length === 0) {
      this.deepCopyBoard(this.board);
      this.moves = this.getAllLegalMoves(this.teban, time);
      this.opponentMoves = this.getAllLegalMoves(-this.teban, time);
      return;
    }

    if (this.idx < this.moves.length) {
      this.aiboard.movePieceAI(this.moves[this.idx]);
      const aival = this.minimax(2, false);
      this.aiboard.undoMoveForAI();
      this.movepoints.push({ idx: this.idx, aival: aival });
      this.idx++;
      return;
    }

    if (this.opidx < this.opponentMoves.length) {
      this.aiboard.movePieceAI(this.opponentMoves[this.opidx]);
      const aival = this.minimax(2, true);
      this.aiboard.undoMoveForAI();
      this.opevals.push(aival);
      this.opidx++;
      return;
    }


    const lowestEval = Math.min(...this.opevals);
    this.movepoints.sort((a, b) => b.aival - a.aival);

    for (let i = 0; i < this.movepoints.length; i++) {
      if (this.movepoints[i].aival <= lowestEval) break;
      const bestmove: Move = this.moves[this.movepoints[i].idx];
      if (this.board.movePieceLocal(bestmove)) {
        // console.log(lowestEval, this.movepoints[i].aival);
        this.reset();
        return;
      }
    }
    this.reset();
    return;
  }
};