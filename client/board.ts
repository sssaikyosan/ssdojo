import { BOARD_SIZE, KOMADAI_PIECE_TYPE, MOVETIME } from "./const";
import { Emitter } from "./emitter";
import { Piece } from "./piece";
import { PieceType } from "./pieces";
import { playSound } from "./sounds";

export class Board {
  emitter: Emitter;

  pieces: Piece[] = [];
  map: (Piece | null)[][] = [[null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null]];

  komadaiPieces: { [key: string]: { [key: string]: number; }; } = {
    sente: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 },
    gote: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 }
  };

  kifu: { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number, time: number; }[] = [];

  serverstarttime: number = 0;
  starttime: number = 0;
  time: number = 0;


  //コンストラクタ
  constructor(emitter: Emitter) {
    this.emitter = emitter;
  }

  /*
  盤面の初期化
  */
  init(servertime: number, time: number) {
    this.pieces = [];
    this.map = [[null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null]];
    this.komadaiPieces = {
      sente: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 },
      gote: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 }
    };
    this.kifu = [];
    this.serverstarttime = servertime;
    this.starttime = time;
    this.time = time;
    this.initPieces(1);
    this.initPieces(-1);
  }

  initPieces(teban: number) {
    this.initPawnPiece(teban);
    let y = 4 + teban * 4;
    this.setPiece(0, y, "lance", teban);
    this.setPiece(1, y, "knight", teban);
    this.setPiece(2, y, "silver", teban);
    this.setPiece(3, y, "gold", teban);
    if (teban === 1) {
      this.setPiece(4, y, "king", teban);
    } else {
      this.setPiece(4, y, "king2", teban);
    }
    this.setPiece(5, y, "gold", teban);
    this.setPiece(6, y, "silver", teban);
    this.setPiece(7, y, "knight", teban);
    this.setPiece(8, y, "lance", teban);
    this.setPiece(4 + teban * 3, y - teban, "rook", teban);
    this.setPiece(4 - teban * 3, y - teban, "bishop", teban);
  }

  //歩の位置の初期化
  initPawnPiece(teban: number) {
    let y = 4 + teban * 2;
    for (let x = 0; x < 9; x++) this.setPiece(x, y, "pawn", teban);
  }

  //駒を盤面上に設置する関数
  setPiece(x: number, y: number, type: PieceType, teban: number) {
    this.map[x][y] = new Piece(this, type, x, y, teban, this.serverstarttime, this.starttime);
    this.pieces.push(this.map[x][y]);
  }

  /*
  初期化ここまで
  */


  //駒の移動が可能かどうかを判定する関数
  canMovePiece(x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number) {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || !this.map[x][y]) return false;
    const piece = this.map[x][y];
    if (piece.teban !== teban) return false;
    if (!piece.canMove(nx, ny, teban, this.map, narazu)) return false;
    return true;
  }


  //駒の移動関数
  movePieceLocal(x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number, servertime: number) {
    const piece: Piece | null = this.map[x][y];
    const npiece: Piece | null = this.map[nx][ny];

    //nullチェック
    if (!piece) return false;
    //時間チェック
    if (servertime - piece.lastMoveServerTime < MOVETIME) return false;


    /*
    ここから駒移動開始
    */

    //駒を取った場合
    if (npiece) {
      this.komadaiPieces[teban === 1 ? "sente" : "gote"][npiece.getUnPromotedType()]++;
      this.pieces = this.pieces.filter(p => p !== npiece);
    }

    piece.x = nx;
    piece.y = ny;
    this.map[x][y] = null;
    this.map[nx][ny] = piece;

    // 相手陣に入った場合、成り駒にする
    if (!narazu && this.isInEnemyTerritory(piece, ny)) {
      piece.type = piece.getPromotedType();
    }

    //時間更新
    piece.lastMoveServerTime = servertime;
    piece.lastMoveTime = performance.now();

    //棋譜更新
    this.kifu.push({ x: x, y: y, nx: nx, ny: ny, narazu: narazu, teban: teban, time: servertime });

    //音再生
    playSound("sound");

    //勝敗判定
    if (npiece) {
      if (npiece.type === "king" || npiece.type === "king2") {
        this.emitter.emit("endGame", teban);
      }
    }
    return true;
  }

  //駒が打てるか判定する関数
  canPutPiece(x: number, y: number, type: string, teban: number) {
    if (this.komadaiPieces[teban === 1 ? "sente" : "gote"][type] <= 0) return false;
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || this.map[x][y]) return false;
    if (this.isTopCell(y, type, teban)) return false;
    if (this.isNihu(x, type, teban)) return false;
    return true;
  }

  //駒を打つ関数
  putPieceLocal(nx: number, ny: number, type: PieceType, teban: number, servertime: number) {
    this.komadaiPieces[teban === 1 ? "sente" : "gote"][type]--;
    const piece = new Piece(this, type, nx, ny, teban, servertime, performance.now());
    this.map[nx][ny] = piece;
    this.pieces.push(piece);
    this.kifu.push({ x: -1, y: KOMADAI_PIECE_TYPE.indexOf(type), nx: nx, ny: ny, narazu: true, teban: teban, time: servertime });
    playSound("sound");
  }


  //盤面の１段目及び２段目の判定
  isTopCell(y: number, type: string, teban: number) {
    if (type === "pawn" || type === "lance") {
      if (teban === 1 && y === 0 || teban === -1 && y === 8) return true;
    }
    if (type === "knight") {
      if (teban === 1 && y <= 1 || teban === -1 && y >= 7) return true;
    }
    return false;
  }

  //２歩の判定
  isNihu(x: number, type: string, teban: number) {
    if (type === "pawn") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const piece = this.map[x][i];
        if (piece && piece.type === "pawn" && piece.teban === teban) return true;
      }
    }
    return false;
  }

  // 駒が相手陣に入ったかどうかを判定
  isInEnemyTerritory(piece: Piece, y: number) {
    if (piece.teban === 1) {
      // 先手の場合、後手陣（y <= 2）に入ったか
      return y <= 2;
    } else if (piece.teban === -1) {
      // 後手の場合、先手陣（y >= 6）に入ったか
      return y >= 6;
    }
    return false;
  }
}