import { BOARD_SIZE, SERVER_MOVETYME } from "./const";
import { getTimeDiff, setGameState, setScene, socket } from "./main";
import { Piece } from "./piece";
import { createResultScene } from "./scene";
import { playSound } from "./sounds";

export class Board {
  teban: number = 0;
  roomId: string = "";
  starttime: [number, number] = [0, 0];
  time: [number, number] = [0, 0];
  ptime: number = 0;
  pieces: Piece[] = []; // すべての駒を保持する配列
  map: (Piece | null)[][] = [[null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null]];
  hoveredCell: { x: number, y: number; } | null = null; // マウスオーバー中のセル
  komadaiPieces: { [key: string]: { [key: string]: number; }; } = {
    sente: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 },
    gote: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 }
  };

  cellSize = 0; // セルのサイズ
  constructor() {
    this.ptime = performance.now();
  }
  kifu: { x: number, y: number, nx: number, ny: number; }[] = [];

  // 盤面の初期化
  init(teban: number, roomId: string, time: [number, number]) {
    this.roomId = roomId;
    this.teban = teban;
    this.starttime = time;
    this.time = time;
    this.hoveredCell = null;
    this.kifu = [];
    this.komadaiPieces = {
      sente: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 },
      gote: { "pawn": 0, "lance": 0, "knight": 0, "silver": 0, "gold": 0, "bishop": 0, "rook": 0, "king": 0, "king2": 0 }
    };
    this.initPieces(1);
    this.initPieces(-1);
  }

  initPawnPiece(teban: number) {
    let y = 4 + teban * 2;
    for (let x = 0; x < 9; x++) this.setPiece(x, y, "pawn", teban);
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

  setPiece(x: number, y: number, type: string, teban: number) {
    this.map[x][y] = new Piece(this, type, x, y, teban, this.starttime, this.ptime);
    this.pieces.push(this.map[x][y]);
  }

  movePiece(nx: number, ny: number, piece: Piece, narazu: boolean) {
    if (this.kifu.length > 0 &&
      this.kifu.at(-1)?.x === piece.x &&
      this.kifu.at(-1)?.y === piece.y &&
      this.kifu.at(-1)?.nx === nx &&
      this.kifu.at(-1)?.ny === ny) return;
    socket.emit("movePiece", {
      x: piece.x,
      y: piece.y,
      nx: nx,
      ny: ny,
      narazu: narazu,
      type: piece.type,
      teban: this.teban,
      roomId: this.roomId,
    });
  }

  returnToKomadai(piece: Piece) {
    this.komadaiPieces[this.teban === 1 ? "sente" : "gote"][piece.type]++;
    this.pieces = this.pieces.filter(p => p !== piece);
    return;
  }

  canPut(x: number, y: number, piece: Piece) {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || this.map[x][y]) return false;
    if (this.isTopCell(y, piece)) return false;
    if (this.isNihu(x, piece)) return false;
    return true;
  }

  sendPutPiece(x: number, y: number, piece: Piece) {
    socket.emit("putPiece", {
      nx: x, ny: y,
      type: piece.type,
      teban: this.teban,
      roomId: this.roomId,
    });
  }

  putPiece(nx: number, ny: number, piece: Piece) {
    console.log(nx, ny, piece);
    if (!this.canPut(nx, ny, piece)) {
      this.returnToKomadai(piece);
      return;
    }
    if (this.kifu.length > 0 &&
      this.kifu[this.kifu.length - 1].x === -2 + piece.teban &&
      this.kifu[this.kifu.length - 1].y === -2 + piece.teban &&
      this.kifu[this.kifu.length - 1].nx === nx &&
      this.kifu[this.kifu.length - 1].ny === ny) return;
    this.sendPutPiece(nx, ny, piece);
    this.returnToKomadai(piece);
    console.log("putPiece", nx, ny, piece);
  }

  putPieceKey(x: number, y: number, piece: Piece) {
    if (this.komadaiPieces[this.teban === 1 ? "sente" : "gote"][piece.type] <= 0) return;
    if (!this.canPut(x, y, piece)) return;
    this.sendPutPiece(x, y, piece);
    console.log("putPieceKey", x, y, piece);
  }

  isTopCell(y: number, piece: Piece) {
    if (piece.type === "pawn" || piece.type === "lance") {
      if (this.teban === 1 && y === 0 || this.teban === -1 && y === 8) return true;
    }
    if (piece.type === "knight") {
      if (this.teban === 1 && y <= 1 || this.teban === -1 && y >= 7) return true;
    }
    return false;
  }

  isNihu(x: number, piece: Piece) {
    if (piece.type === "pawn") {
      for (let i = 0; i < BOARD_SIZE; i++) {
        const piece = this.map[x][i];
        if (piece && piece.type === "pawn" && piece.teban === this.teban) return true;
      }
    }
    return false;
  }

  newPut(data: { nx: number, ny: number, type: string, teban: number, roomId: string, time: [number, number]; }) {
    const lmp = performance.now();
    const { nx, ny, type, teban, roomId, time: time } = data;
    console.log(nx, ny, type, teban, roomId, time);
    if (this.komadaiPieces[teban === 1 ? "sente" : "gote"][type] <= 0) return;

    const piece = new Piece(this, type, nx, ny, teban, this.starttime, 0);
    if (!this.canPut(nx, ny, piece)) return;
    this.komadaiPieces[teban === 1 ? "sente" : "gote"][type]--;

    piece.lastMovepTime = lmp;
    piece.lastMoveTime = time;
    this.map[nx][ny] = piece;
    this.pieces.push(piece);
    this.kifu.push({ x: -2 + teban, y: -2 + teban, nx: nx, ny: ny });
    playSound("sound");
  }

  newMove(data: { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number, roomId: string, time: [number, number]; }) {
    const {
      x, y,
      nx, ny,
      narazu,
      teban,
      roomId,
      time: time
    }:
      {
        x: number, y: number,
        nx: number, ny: number,
        narazu: boolean,
        teban: number,
        roomId: string,
        time: [number, number];
      } = data;

    let piece: Piece | null = null;
    let npiece: Piece | null = null;
    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && this.map[x][y]) {
      piece = this.map[x][y];
    } else {
      return;
    }
    if (piece.teban !== teban) return;
    if (getTimeDiff(piece.lastMoveTime, time)[0] < SERVER_MOVETYME) return;
    if (this.kifu.length > 0 &&
      this.kifu[this.kifu.length - 1].x === x &&
      this.kifu[this.kifu.length - 1].y === y &&
      this.kifu[this.kifu.length - 1].nx === nx &&
      this.kifu[this.kifu.length - 1].ny === ny) return;
    if (piece.canMove(nx, ny, teban, this.map, narazu)) {
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && this.map[nx][ny]) {
        npiece = this.map[nx][ny];
        this.komadaiPieces[teban === 1 ? "sente" : "gote"][npiece.getUnPromotedType()]++;
        this.pieces = this.pieces.filter(p => p !== npiece);
        if (npiece.type === "king" || npiece.type === "king2") {
          const result = teban === this.teban ? "win" : "lose";
          setGameState(result);
          setScene(createResultScene(result));
        }
      }
      piece.x = nx;
      piece.y = ny;
      this.map[x][y] = null;
      this.map[nx][ny] = piece;

      // 相手陣に入った場合、成り駒にする
      if (!narazu && this.isInEnemyTerritory(piece, ny)) {
        piece.type = piece.getPromotedType();
      }

      piece.lastMoveTime = time;
      piece.lastMovepTime = performance.now();
      this.kifu.push({ x: x, y: y, nx: nx, ny: ny });
      playSound("sound");
    }
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