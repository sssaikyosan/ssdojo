import { BOARD_SIZE, KOMADAI_PIECE_TYPE, Move, MOVETIME } from "./const";
import { Emitter } from "./emitter";
import { Piece } from "./piece";
import { PieceType } from "./pieces";
import { playSmallSound } from "./sounds";

export class Board {
  emitter: Emitter;

  pieces: Piece[] = [];
  map: number[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(-2));

  kifu: { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number, captype: number, time: number, captime: number; }[] = [];

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
    this.map = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(-1));
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
    this.pieces.push(new Piece(this, type, x, y, teban, this.serverstarttime, this.starttime, this.pieces.length));
    this.map[x][y] = this.pieces.length - 1;
  }

  /*
  初期化ここまで
  */



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

  checkGameEnd(piece: Piece, npiece: Piece | null, nx: number, ny: number): void {
    // 勝敗判定
    if (npiece) {
      if (npiece.type === "king" || npiece.type === "king2") {
        this.emitter.emit("endGame", piece.teban);
      }
    }
    if (piece.type === "king" && nx === 4 && ny === 0) {
      this.emitter.emit("endGame", 1);
    } else if (piece.type === "king2" && nx === 4 && ny === 8) {
      this.emitter.emit("endGame", -1);
    }
  }




  //駒の移動関数
  movePieceLocal(move: Move) {
    const { x, y, nx, ny, narazu, teban, servertime } = move;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;


    //駒台の駒を打つ場合
    if (x === -1) {
      const handpiece = this.pieces.find(piece => piece.x === -1 && piece.y === y && piece.teban === teban) || null;

      //nullチェック
      if (!handpiece) return false;

      //駒台の駒を打つ
      handpiece.x = nx;
      handpiece.y = ny;
      this.map[nx][ny] = handpiece.idx;

      //音再生
      playSmallSound("sound");
      return true;
    }


    //盤上の駒を動かす場合
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return false;
    const piece: Piece | null = this.pieces[this.map[x][y]] || null;
    const npiece: Piece | null = this.pieces[this.map[nx][ny]] || null;

    //nullチェック
    if (!piece) return false;
    //時間チェック
    if (servertime - piece.lastMoveServerTime < MOVETIME) return false;

    //駒の移動が可能かどうかを判定
    if (!piece.canMove(nx, ny, narazu)) return false;


    /*
    ここから駒移動開始
    */

    //駒を取った場合
    if (npiece) {
      npiece.type = npiece.getUnPromotedType();
      npiece.x = -1;
      npiece.y = KOMADAI_PIECE_TYPE.indexOf(npiece.type);
      npiece.teban = teban;
    }

    piece.x = nx;
    piece.y = ny;
    this.map[nx][ny] = this.map[x][y];
    this.map[x][y] = -2;

    // 相手陣に入った場合、成り駒にする
    if (!narazu && this.isInEnemyTerritory(piece, ny)) {
      piece.type = piece.getPromotedType();
    }

    //時間更新
    piece.lastMoveServerTime = servertime;
    piece.lastMoveTime = performance.now();

    //棋譜更新
    const captype = npiece ? npiece.getTypeNum(npiece.type) : -1;
    this.kifu.push({ x: x, y: y, nx: nx, ny: ny, narazu: narazu, teban: teban, captype: captype, time: servertime, captime: 0 });

    console.log("kifu", this.kifu.at(-1));

    //音再生
    playSmallSound("sound");

    //勝敗判定
    this.checkGameEnd(piece, npiece, nx, ny);

    return true;
  }




  //駒の移動関数(CPU用)
  movePieceAI(move: Move) {
    console.log("movePieceAI", this.kifu.length, move);
    console.log("map", this.map);
    console.log("pieces", this.pieces);
    const { x, y, nx, ny, narazu, teban, servertime } = move;
    if (nx < 0 || nx >= BOARD_SIZE || ny < 0 || ny >= BOARD_SIZE) return false;


    //駒台の駒を打つ場合
    if (x === -1) {
      const handpiece = this.pieces.find(piece => piece.x === -1 && piece.y === y && piece.teban === teban) || null;

      //nullチェック
      if (!handpiece) {
        console.log(`[${x},${y}] piece is null`);
        return false;
      }

      //駒台の駒を打つ
      handpiece.x = nx;
      handpiece.y = ny;
      this.map[nx][ny] = handpiece.idx;
      return true;
    }


    //盤上の駒を動かす場合
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
      console.log("out of board");
      return false;
    }
    const piece: Piece | null = this.pieces[this.map[x][y]] || null;
    const npiece: Piece | null = this.pieces[this.map[nx][ny]] || null;

    //nullチェック
    if (!piece) {
      console.log(`[${x},${y}] piece is null`);
      return false;
    }

    //時間チェック
    // if (servertime - piece.lastMoveServerTime < MOVETIME) {
    //   console.log(`[${piece}] time not enough`);
    //   return false;
    // }

    //駒の移動が可能かどうかを判定
    if (!piece.canMove(nx, ny, narazu)) {
      console.log(`${piece},[${nx},${ny}] cant move error`);
      return false;
    }


    /*
    ここから駒移動開始
    */

    //駒を取った場合
    if (npiece) {
      npiece.type = npiece.getUnPromotedType();
      npiece.x = -1;
      npiece.y = KOMADAI_PIECE_TYPE.indexOf(npiece.type);
      npiece.teban = teban;
    }

    piece.x = nx;
    piece.y = ny;
    this.map[nx][ny] = piece.idx;
    this.map[x][y] = -2;

    // 相手陣に入った場合、成り駒にする
    if (!narazu && this.isInEnemyTerritory(piece, ny)) {
      piece.type = piece.getPromotedType();
    }

    //時間更新
    piece.lastMoveServerTime = servertime;
    piece.lastMoveTime = performance.now();

    const captype = npiece ? npiece.getTypeNum(npiece.type) : -1;

    //棋譜更新
    this.kifu.push({ x: x, y: y, nx: nx, ny: ny, narazu: narazu, teban: teban, captype: captype, time: servertime, captime: 0 });
    console.log("movefin", this.kifu.length);
    console.log("map", this.map);
    console.log("pieces", this.pieces);
    return true;
  }




  //チェックなしの駒移動の取り消し関数（CPU用
  undoMoveForAI() {


    const lastmove = this.kifu.pop();
    console.log("undoMoveForAI", this.kifu.length, lastmove);
    console.log("lastmove", this.map);
    console.log("pieces", this.pieces);
    if (!lastmove) {
      console.log("lastmove not found");
      return false;
    }

    if (lastmove.x === -1) {
      const piece = this.pieces[this.map[lastmove.nx][lastmove.ny]];
      if (piece) {
        this.map[lastmove.nx][lastmove.ny] = -2;
        piece.x = -1;
        piece.y = lastmove.y;
      }
      return true;
    }

    this.map[lastmove.x][lastmove.y] = this.map[lastmove.nx][lastmove.ny];
    this.map[lastmove.nx][lastmove.ny] = -2;

    if (lastmove.captype !== -1) {
      const npiece = this.pieces.find(p => p.x === -1 && p.y === lastmove.captype && p.teban !== lastmove.teban);
      if (npiece) {
        this.map[lastmove.nx][lastmove.ny] = npiece.idx;
        npiece.x = lastmove.nx;
        npiece.y = lastmove.ny;
        npiece.lastMoveServerTime = lastmove.captime;
        npiece.teban = -lastmove.teban;
      }
    }
    console.log(this.map);
    console.log("undofin", this.kifu.length);
    console.log("map", this.map);
    console.log("pieces", this.pieces);
    return true;
  }
}
