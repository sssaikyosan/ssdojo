import { ServerKifu, Teban } from "../share/type";
import { BOARD_SIZE, KifuMove, MOVETIME } from "./const";
import { Emitter } from "./emitter";
import { Piece } from "./piece";

type PieceAndCaputure = [piece: Piece, capturePiece: Piece | undefined];

export class Board {
  emitter: Emitter;

  pieces: Piece[] = [];
  map: number[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(-2));

  kifu: ServerKifu[] = [];

  serverstarttime: number = 0;
  starttime: number = 0;
  time: number = 0;

  //コンストラクタ
  constructor(emitter = new Emitter()) {
    this.emitter = emitter;
  }

  /*
  盤面の初期化
  */
  init(servertime: number, time: number) {
    this.pieces = [];
    this.map = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(-2));
    this.kifu = [];
    this.serverstarttime = servertime;
    this.starttime = time;
    this.time = time;
    this.initPieces(1);
    this.initPieces(-1);
  }

  private initPieces(teban: Teban) {
    this.initPawnPiece(teban);
    let y = 4 + teban * 4;
    this.setPiece(0, y, 4, teban);
    this.setPiece(1, y, 5, teban);
    this.setPiece(2, y, 6, teban);
    this.setPiece(3, y, 7, teban);
    this.setPiece(4, y, 8, teban);
    this.setPiece(5, y, 7, teban);
    this.setPiece(6, y, 6, teban);
    this.setPiece(7, y, 5, teban);
    this.setPiece(8, y, 4, teban);
    this.setPiece(4 + teban * 3, y - teban, 2, teban);
    this.setPiece(4 - teban * 3, y - teban, 3, teban);
  }

  //歩の位置の初期化
  private initPawnPiece(teban: Teban) {
    let y = 4 + teban * 2;
    for (let x = 0; x < 9; x++) this.setPiece(x, y, 1, teban);
  }

  //駒を盤面上に設置する関数
  private setPiece(x: number, y: number, type: number, teban: Teban) {
    this.pieces.push(new Piece(type, x, y, teban, this.serverstarttime, this.starttime, this.pieces.length));
    this.map[x][y] = this.pieces.length - 1;
  }

  /*
  初期化ここまで
  */

  clone(emitter?: Emitter): Board {
    const board = new Board(emitter);
    board.pieces = this.pieces.map(p => p.clone());

    // 盤面のコピー
    for (let piece of this.pieces) {
      if (piece.x === -1) continue;
      board.map[piece.x][piece.y] = piece.idx;
    }

    return board;
  }

  public getPiece(x: number, y: number): Piece | undefined {
    return this.pieces[this.map[x][y]];
  }

  //駒の移動関数
  movePieceLocal(move: KifuMove) {
    const { x, nx, ny } = move;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;

    // 駒台の駒を打つ場合
    if (x === -1) {
      return this.putPiece(move);
    }

    // 駒を取得する
    const result = this.getCanMovePiece(move);
    if (result) {
      console.log(result[0], result[1]);
    }
    if (result == null) return false;
    const [piece, capturePiece] = result;
    // 駒を移動する
    this.movePiece(move, result);

    //勝敗判定
    this.checkGameEnd(piece, capturePiece, nx, ny);

    return true;
  }


  // 関数名変かも
  /**
   * `move`が成立する場合に移動する駒と取る駒を取得する
   */
  private getCanMovePiece({ x, y, nx, ny, narazu, teban, servertime }: KifuMove): PieceAndCaputure | undefined {
    //盤上の駒を動かす場合
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    const piece = this.getPiece(x, y);

    //nullチェック
    if (!piece) return;
    if (teban !== piece.teban) return;
    //時間チェック
    if (servertime - piece.lastMoveServerTime < MOVETIME) return;
    //駒の移動が可能かどうかを判定  // エラーチェック: ここでreturn
    if (!piece.canMove(this, nx, ny, narazu)) return;

    return [piece, this.getPiece(nx, ny)];
  }

  /**
   * @returns 移動が成功したか
   */
  private putPiece(move: KifuMove): boolean {
    const { y, nx, ny, teban, servertime } = move;
    console.log("putPiece");
    const handpiece: Piece | null = this.pieces.find(piece => piece.x === -1 && piece.y === y && piece.teban === teban) || null;
    console.log(handpiece);
    //nullチェック
    if (!handpiece) return false;
    if (handpiece.x !== move.x || handpiece.y !== move.y) return false;

    //駒台の駒を打つ
    handpiece.x = nx;
    handpiece.y = ny;
    this.map[nx][ny] = handpiece.idx;

    handpiece.lastMoveServerTime = servertime;
    handpiece.lastMoveTime = performance.now();

    return true;
  }

  private movePiece(
    { x, y, nx, ny, narazu, teban, servertime }: KifuMove,
    [piece, capturePiece]: PieceAndCaputure
  ): void {
    if (capturePiece) {
      if (capturePiece.type === undefined) {
        throw new Error("Captured piece type is undefined");
      }
      const unPromotedType = capturePiece.getUnPromotedType();
      if (unPromotedType === undefined) {
        throw new Error("Failed to get unpromoted type");
      }
      capturePiece.type = unPromotedType;
      capturePiece.x = -1;
      capturePiece.y = unPromotedType;  // 駒台の位置はtypeをそのまま使用
      capturePiece.teban = teban;
    }

    piece.x = nx;
    piece.y = ny;
    this.map[nx][ny] = this.map[x][y];
    this.map[x][y] = -2;

    // 相手陣に入った場合、成り駒にする
    if (!narazu && BoardUtil.isInEnemyTerritory(piece, ny)) {
      if (piece.type === undefined) {
        throw new Error("Piece type is undefined before promotion");
      }
      const promotedType = piece.getPromotedType();
      if (promotedType === undefined) {
        throw new Error("Failed to get promoted type");
      }
      piece.type = promotedType;
    }

    //時間更新
    piece.lastMoveServerTime = servertime;
    piece.lastMoveTime = performance.now();

    //棋譜更新
    const captype = capturePiece ? capturePiece.type : -1;
    this.kifu.push({ x, y, nx, ny, narazu, teban, captype, time: servertime, captime: 0 });
  }





  // TODO: AI用の関数は別で用意する


  private getCanMovePiece_AI({ x, y, nx, ny, narazu }: KifuMove): PieceAndCaputure | undefined {
    //盤上の駒を動かす場合
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return;
    const piece = this.getPiece(x, y);

    //nullチェック
    if (!piece) return;
    //駒の移動が可能かどうかを判定
    if (!piece.canMove(this, nx, ny, narazu)) return;

    return [piece, this.getPiece(nx, ny)];
  }

  private checkGameEnd(piece: Piece, npiece: Piece | undefined, nx: number, ny: number): void {
    // 勝敗判定
    if (npiece) {
      if (npiece.type === 8) {
        this.emitter.emit("endGame", piece.teban);
      }
    }
    if (piece.type === 8 && piece.teban === 1 && nx === 4 && ny === 0) {
      this.emitter.emit("endGame", 1);
    } else if (piece.type === 8 && piece.teban === -1 && nx === 4 && ny === 8) {
      this.emitter.emit("endGame", -1);
    }
  }
}

export const BoardUtil = {
  /** 駒が相手陣に入ったかどうかを判定 */
  isInEnemyTerritory: (piece: Piece, y: number): boolean => {
    if (piece.teban === 1) {
      // 先手の場合、後手陣（y <= 2）に入ったか、または移動元が後手陣内
      return y <= 2 || piece.y <= 2;
    } else if (piece.teban === -1) {
      // 後手の場合、先手陣（y >= 6）に入ったか、または移動元が先手陣内
      return y >= 6 || piece.y >= 6;
    }
    return false;
  },
} as const;