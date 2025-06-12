import { BOARD_SIZE, MOVETIME, PIECE_MOVES, UNPROMODED_TYPES } from "./const.js";
import { getPromotedType, getUnPromotedType } from "./utils.js";

export class Board {
  emitter;
  pieces = []; // すべての駒を保持する配列
  map = [[null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null]];
  komadaiPieces = {
    sente: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 },
    gote: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 }
  };
  kifu = [];

  serverstarttime = 0;
  starttime = 0;
  time = 0;

  constructor(emitter) {
    this.emitter = emitter
  }


  // 盤面の初期化
  init(servertime, time) {
    this.serverstarttime = servertime;
    this.starttime = time;
    this.time = time;
    this.currentMove = 0;
    this.komadaiPieces = {
      sente: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 },
      gote: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 }
    };
    this.initPieces(1);
    this.initPieces(-1);
  }

  initPawnPiece(teban) {
    let y = 4 + teban * 2;
    for (let x = 0; x < 9; x++) this.setPiece(x, y, 'pawn', teban);
  }

  initPieces(teban) {
    this.initPawnPiece(teban);
    let y = 4 + teban * 4;
    this.setPiece(0, y, 'lance', teban);
    this.setPiece(1, y, 'knight', teban);
    this.setPiece(2, y, 'silver', teban);
    this.setPiece(3, y, 'gold', teban);
    if (teban === 1) {
      this.setPiece(4, y, 'king', teban);
    } else {
      this.setPiece(4, y, 'king2', teban);
    }
    this.setPiece(5, y, 'gold', teban);
    this.setPiece(6, y, 'silver', teban);
    this.setPiece(7, y, 'knight', teban);
    this.setPiece(8, y, 'lance', teban);
    this.setPiece(4 + teban * 3, y - teban, 'rook', teban);
    this.setPiece(4 - teban * 3, y - teban, 'bishop', teban);
  }

  setPiece(x, y, type, teban) {
    this.map[x][y] = { type: type, teban: teban, lastmovetime: this.serverstarttime, lastmoveptime: this.starttime };
  }

  returnToKomadai(type, teban) {
    this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type]++;
    return;
  }

  checkMyPiece(xx, yy, teban, type, nari, nteban) {
    if (this.map[xx][yy] && this.map[xx][yy].teban === nteban) return false;
    if (nari) {
      if (teban === 1 && yy > 2) return false;
      if (teban === -1 && yy < 6) return false;
    } else {
      if (type === 'pawn' || type === 'lance') {
        if (teban === 1 && yy === 0) return false;
        if (teban === -1 && yy === 8) return false;
      } else if (type === 'knight') {
        if (teban === 1 && yy <= 1) return false;
        if (teban === -1 && yy >= 7) return false;
      }
    }
    return true;
  }

  canMove(x, y, nx, ny, nari, nteban) {
    const dx = nx - x;
    const dy = ny - y;

    const piece = this.map[x][y];

    const moves = PIECE_MOVES[piece.type];
    if (!moves) return false;

    for (const move of moves) {
      if (move.dx === dx && move.dy === dy * nteban) {
        return this.checkMyPiece(x + move.dx, y + move.dy * nteban, piece.teban, piece.type, nari, nteban);
      }

      // 再帰的に動きを計算
      if (move.recursive) {
        let currentX = x + move.dx;
        let currentY = y + move.dy * nteban;
        while (currentX >= 0 && currentX < BOARD_SIZE && currentY >= 0 && currentY < BOARD_SIZE) {
          if (this.map[currentX][currentY] && this.map[currentX][currentY].teban === nteban) break;
          if (currentX === nx && currentY === ny) return this.checkMyPiece(currentX, currentY, piece.teban, piece.type, nari, nteban);
          if (this.map[currentX][currentY] && this.map[currentX][currentY].teban !== nteban) break;
          currentX += move.dx;
          currentY += move.dy * nteban;
          if (currentX < 0 || currentX >= BOARD_SIZE || currentY < 0 || currentY >= BOARD_SIZE) break;
        }
      }
    }

    return false;
  }

  canPut(x, y, type, teban) {
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || this.map[x][y]) return false;
    if (this.isTopCell(x, y, type, teban)) return false;
    if (this.isNihu(x, y, type, teban)) return false;
    return true;
  }

  isTopCell(x, y, type, teban) {
    if (type === 'pawn' || type === 'lance') {
      if (teban === 1 && y === 0 || teban === -1 && y === 8) return true;
    }
    if (type === 'knight') {
      if (teban === 1 && y <= 1 || teban === -1 && y >= 7) return true;
    }
    return false;
  }

  isNihu(x, y, type, teban) {
    if (type === 'pawn') {
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (this.map[x][i] && this.map[x][i].type === 'pawn' && this.map[x][i].teban === teban) return true;
      }
    }
    return false;
  }

  canPromote(x, y, ny) {
    const piece = this.map[x][y];
    if (!UNPROMODED_TYPES.includes(piece.type)) return false;
    if (piece.teban === 1 && y < 3) return true;
    if (piece.teban === 1 && ny < 3) return true;
    if (piece.teban === -1 && y >= 6) return true;
    if (piece.teban === -1 && ny >= 6) return true;
    return false;
  }

  putPieceLocal(data) {
    const lmp = performance.now();
    const { nx, ny, type, teban, roomId, servertime } = data;
    if (this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type] <= 0) return false;

    if (!this.canPut(nx, ny, type, teban)) return false;
    this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type]--;

    this.map[nx][ny] = { type: type, teban: teban, lastmovetime: servertime, lastmoveptime: lmp };
    this.kifu.push({ x: -2 + teban, y: -2 + teban, nx: nx, ny: ny })

    return true;
  }

  movePieceLocal(data) {
    const lmp = performance.now();
    const { x, y, nx, ny, nari, teban, roomId, servertime } = data;

    const result = this.getCanMovePiece(x, y, nx, ny, nari, teban, servertime);
    console.log('res', result);
    if (result.length === 0) return [false, null];
    const [piece, capturePiece] = result;

    // 駒を移動する
    this.movePiece(data, piece, capturePiece, lmp);

    //勝敗判定
    this.checkGameEnd(piece, capturePiece, nx, ny);

    return [true, capturePiece];
  }

  getCanMovePiece(x, y, nx, ny, nari, teban, servertime) {
    //盤上の駒を動かす場合
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return [];
    const piece = this.map[x][y];
    console.log('piece', piece);
    console.log('time', servertime);

    //nullチェック
    if (!piece) return [];
    if (teban !== piece.teban) return [];
    //時間チェック
    if (servertime - piece.lastmovetime < MOVETIME) {
      return [];
    }
    //成りチェック
    if (nari && !this.canPromote(x, y, ny)) return [];
    //駒の移動が可能かどうかを判定  // エラーチェック: ここでreturn
    if (!this.canMove(x, y, nx, ny, nari, teban)) return [];

    return [piece, this.map[nx][ny]];
  }

  // 駒が相手陣に入ったかどうかを判定
  isInEnemyTerritory(piece, y) {
    if (piece.teban === 1) {
      // 先手の場合、後手陣（y <= 2）に入ったか
      return y <= 2;
    } else if (piece.teban === -1) {
      // 後手の場合、先手陣（y >= 6）に入ったか
      return y >= 6;
    }
    return false;
  }


  movePiece({ x, y, nx, ny, nari, teban, servertime }, piece, capturePiece, lmp) {
    let captime = -1;
    if (capturePiece) {
      captime = capturePiece.lastmovetime;
      const unPromotedType = getUnPromotedType(capturePiece.type);
      let t = '';
      if (teban === 1) {
        t = 'sente';
      } else if (teban === -1) {
        t = 'gote';
      } else {
        return false;
      }
      this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][unPromotedType]++
    }

    let type = piece.type;
    if (nari) {
      type = getPromotedType(piece.type);
    }

    this.map[nx][ny] = { type: type, teban: piece.teban, lastmovetime: servertime, lastmoveptime: lmp };
    this.map[x][y] = null;

    //棋譜更新
    const captype = capturePiece ? capturePiece.type : null;
    this.kifu.push({ x, y, nx, ny, nari, teban, captype, time: servertime, captime: captime });
  }

  checkGameEnd(piece, npiece, nx, ny) {
    // 勝敗判定
    if (npiece) {
      if (npiece.type === "king" || npiece.type === "king2") {
        this.emitter.emit("endGame", piece.teban);
      }
    }
    if (piece.type === "king" && piece.teban === 1 && nx === 4 && ny === 0) {
      this.emitter.emit("endGame", 1);
    } else if (piece.type === "king2" && piece.teban === -1 && nx === 4 && ny === 8) {
      this.emitter.emit("endGame", -1);
    }
  }
}