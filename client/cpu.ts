import { Board } from "./board";
import { BOARD_SIZE, KifuMove, MOVETIME, STARTHANDS, STARTMAP } from "./const";
import { CPUBoard, CPUMove, doMove, getAllPossibleMoves, Kifu, Pos, setBoard, undoMove } from "./cpuboard";
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

const PIECE_SCORE_TABLE = [
  0,
  105,
  700,
  576,
  227,
  279,
  444,
  529,
  99999,
  483,
  1002,
  730,
  348,
  535,
  543
];

export class CPU {
  board: Board | null = null;
  cpu_board: CPUBoard = {
    map: STARTMAP,
    hands: STARTHANDS
  };

  kifu: Kifu[] = [];

  moves: CPUMove[] = [];
  minaival: number = -Infinity;
  goodMoves: { move: CPUMove, aival: number; }[] = [];
  waitingMoves: CPUMove[] = [];
  idx: number = 0;

  lastSendTime: number = 0;
  thinkTime: number = 1000;

  // allMoves: CPUMove[][][] =
  //   [
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []]
  //   ];

  // allPuts: CPUMove[][][] =
  //   [
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []],
  //     [[], [], [], [], [], [], [], [], []]
  //   ];


  constructor(board: Board) {
    this.board = board;
  }

  //駒の価値のみで評価値を算出
  evaluatePosition(): number {
    let boardScore = 0;
    let handScore = 0;

    const map = this.cpu_board.map;

    // 盤面の駒を評価
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {

        if (map[i][j] == null) continue;
        boardScore += this.getPieceValue(map[i][j]!.type) * (map[i][j]!.owner ? 1 : -1);
      }
    }

    // 持ち駒を評価
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 7; j++) {
        handScore += this.getPieceValue(j) * (i === 1 ? 1 : -1) * 0.95;
      }
    }

    const totalScore = boardScore + handScore;
    // console.log('Evaluation:', {
    //   boardScore,
    //   handScore,
    //   totalScore
    // });
    return totalScore;
  }

  //駒の位置関係をもとにした評価（未実装
  // getPosVal(typeA: number, typeB: number, dir: number) {
  //   return POSITION_SCORE_TABLE[typeA][typeB][dir];
  // }

  // evalPos(): number {
  //   let score = 0;
  //   for (let i = 0; i < BOARD_SIZE; i++) {
  //     for (let j = 0; j < BOARD_SIZE; j++) {
  //       const piece = this.cpu_board.map[i][j];
  //       if (!piece) continue;
  //       const sidePiece = this.cpu_board.map[i + 1][j];
  //       const botPiece = this.cpu_board.map[i][j + 1];
  //       const sbPiece = this.cpu_board.map[i + 1][j + 1];
  //       if (sidePiece) score += this.getPosVal(piece.type, sidePiece.type, 0);
  //       if (botPiece) score += this.getPosVal(piece.type, botPiece.type, 1);
  //       if (sbPiece) score += this.getPosVal(piece.type, sbPiece.type, 2);
  //     }
  //   }
  //   return score;
  // }

  //駒の価値を取得
  getPieceValue(type: number): number {
    return PIECE_SCORE_TABLE[type];
  }

  // setAllMoves() {
  //   this.allMoves = [];
  //   for (let i = 0; i < BOARD_SIZE; i++) {
  //     for (let j = 0; j < BOARD_SIZE; j++) {
  //       const piece = this.cpu_board.map[i][j];
  //       if (!piece) continue;
  //       repeatMove(this.cpu_board, piece, i, j, (x, y) => {
  //         this.allMoves[i][j].push({ owner: piece.owner, from: { x: i, y: j }, to: { x, y }, nari: false });
  //         if (canNari(j, y, piece.type, piece.owner)) {
  //           this.allMoves[i][j].push({ owner: piece.owner, from: { x: i, y: j }, to: { x, y }, nari: true });
  //         }
  //         return false;
  //       });
  //     }
  //   }
  // }

  // myminimax(depth: number, isMaximizing: boolean, alpha: number = -Infinity, beta: number = Infinity, lastmove: CPUMove | null = null) {
  //   if (depth === 0) return this.evalPos();

  //   if (lastmove) {
  //     this.allMoves[lastmove.from.x][lastmove.from.y] = [];
  //     this.researchMoves(lastmove);
  //   }

  //   if (isMaximizing) {
  //     let maxEval = -Infinity;
  //     for (let i = 0; i < BOARD_SIZE; i++) {
  //       for (let j = 0; j < BOARD_SIZE; j++) {
  //         for (const move of this.allMoves[i][j]) {
  //           const movefrom = this.allMoves[i][j];
  //           this.kifu.push(doMove(this.cpu_board, move)!);

  //           const aival = this.myminimax(depth - 1, false, alpha, beta);
  //           undoMove(this.cpu_board, this.kifu.pop()!);
  //           for (const lastmove of movefrom) {
  //             this.allMoves[i][j].push(lastmove);
  //           }

  //           maxEval = Math.max(maxEval, aival!);
  //           alpha = Math.max(alpha, aival!);
  //           if (beta <= alpha) break;
  //         }
  //       }
  //     }
  //   } else {

  //   }
  // }

  // researchMoves(move: CPUMove) {
  //   const { owner, from, to, nari } = move;
  //   this.allMoves[from.x][from.y] = [];
  //   for (let i = 0; i < 2; i++) {
  //     for (let j = 0; j < 2; j++) {
  //       const lx = from.x + i - 1;
  //       const ly = from.y + j - 1;
  //       if (lx < 0 || lx >= 9 || ly < 0 || ly >= 9) continue;
  //       const nearPiece = this.cpu_board.map[lx][ly];
  //       if (!nearPiece) continue;
  //       if (nearPiece.owner !== owner) continue;
  //       for (const komamove of PIECE_MOVES[nearPiece.type]) {
  //         if (komamove.x === 1 - i && komamove.y === 1 - j) {
  //           this.allMoves[lx][ly].push({
  //             owner: owner,
  //             from: { x: lx, y: ly },
  //             to: { x: from.x, y: from.y },
  //             nari: false,
  //           });
  //         }
  //       }
  //     }
  //   }
  // }




  // ミニマックスで最善の手を選択
  minimax(cpu_board: CPUBoard, depth: number, isMaximizing: boolean, pos: Pos = { x: -1, y: -1 }, alpha: number = -Infinity, beta: number = Infinity) {
    //深さ０の場合は評価関数を呼び出す
    if (depth <= 0) return this.evaluatePosition();

    //すべての合法手を取得
    const moves = getAllPossibleMoves(cpu_board, isMaximizing ? true : false);
    if (moves.length === 0) {
      return isMaximizing ? -Infinity : Infinity;
    };

    shuffle(moves);
    //簡易評価による手のソート
    this.sortMoves(moves, isMaximizing);


    //互いに可能な限り評価が高くなるように手を選択
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const moveResult = doMove(cpu_board, move);
        if (!moveResult) {
          console.error("Invalid move:", move);
          continue;
        }
        this.kifu.push(moveResult);
        let aival: number;
        aival = this.minimax(cpu_board, depth - 1, false, move.to);
        const lastMove = this.kifu.pop();
        if (lastMove) {
          undoMove(cpu_board, lastMove);
        }

        maxEval = Math.max(maxEval, aival);
        alpha = Math.max(alpha, aival);

        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.kifu.push(doMove(cpu_board, move)!);
        const aival: number = this.minimax(cpu_board, depth - 1, true);
        undoMove(cpu_board, this.kifu.pop()!);

        minEval = Math.min(minEval, aival);
        beta = Math.min(beta, aival);

        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  //駒をとれる手を優先
  sortMoves(moves: CPUMove[], isMaximizing: boolean) {
    // キラームーブヒューリスティックによる手のソート
    moves.sort((a, b) => {
      const evalA = this.quickEvaluateMove(a);
      const evalB = this.quickEvaluateMove(b);
      return isMaximizing ? evalB - evalA : evalA - evalB;
    });
  }

  //簡易評価関数（取れる駒の価値のみ算出）
  quickEvaluateMove(move: CPUMove): number {
    const { to } = move;
    let score = 0;
    const targetPiece = this.cpu_board.map[to.x][to.y];
    if (targetPiece) {
      score += this.getPieceValue(targetPiece.type);
    }
    return score;
  }


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
      let piece: Piece | undefined = undefined;

      if (from.x === -1) {
        piece = pieces.find(p => p.x === -1 && p.y === from.y && p.teban === -1);
      } else if (from.x >= 0 && from.x < boardSize &&
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
    this.goodMoves.sort((a, b) => b.aival - a.aival);
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

  // fastmove(board: Board) {
  //   this.cpu_board = setBoard(board, this.cpu_board);
  //   this.moves = getAllPossibleMoves(this.cpu_board, true);
  //   this.minaival = this.minimax(this.cpu_board, 1, false);
  //   shuffle(this.moves);

  //   //簡易評価で手をソート;
  //   this.sortMoves(this.moves, true);

  //   //自分視点の手を評価
  //   for (const move of this.moves) {
  //     const moveResult = doMove(this.cpu_board, move);
  //     if (!moveResult) {
  //       console.error("Invalid move:", move);
  //     }
  //     this.kifu.push(moveResult!);
  //     let finalaival: number = 0;
  //     try {
  //       finalaival = this.minimax(this.cpu_board, 1, false);
  //     } finally {
  //       const lastMove = this.kifu.pop();
  //       if (lastMove) {
  //         undoMove(this.cpu_board, lastMove);
  //       }
  //     }

  //     if (finalaival > this.minaival) {
  //       this.waitingMoves.push(move);
  //     }
  //   }
  // }

  randfastmove(board: Board, time: number) {
    this.cpu_board = setBoard(board, this.cpu_board);
    this.moves = getAllPossibleMoves(this.cpu_board, true);
    this.minaival = this.minimax(this.cpu_board, 1, false);
    shuffle(this.moves);

    //簡易評価で手をソート;
    this.sortMoves(this.moves, true);

    //自分視点の手を評価
    for (const move of this.moves) {
      const moveResult = doMove(this.cpu_board, move);
      if (!moveResult) {
        console.error("Invalid move:", move);
      }
      this.kifu.push(moveResult!);
      let finalaival: number = 0;
      try {
        finalaival = this.minimax(this.cpu_board, 1, false);
      } finally {
        const lastMove = this.kifu.pop();
        if (lastMove) {
          undoMove(this.cpu_board, lastMove);
        }
      }

      if (finalaival > this.minaival) {
        this.waitingMoves.push(move);
        continue;
      }

      if (time < this.lastSendTime + this.thinkTime) continue;
      if (finalaival > this.minaival - 60) {
        this.waitingMoves.push(move);
        this.lastSendTime = time;
      }
    }
  }


  //毎フレーム呼び出される関数
  update(time: number) {
    if (this.board === null) return;
    if (time - this.board.starttime < 5000) return;
    this.checkWaitingMoves(this.board);
    this.sendMovePiece();

    this.randfastmove(this.board, time);
  }
}
