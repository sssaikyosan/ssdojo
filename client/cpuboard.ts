import { Board } from "./board";
import { BOARD_SIZE, PIECE_MOVES, PROMOTE_TYPE, UNPROMOTE_TYPE } from "./const";


export type CPUPiece = {
  type: number;
  owner: boolean;
};

export type CPUBoard = {
  map: (CPUPiece | null)[][];
  hands: number[][];
};
export type Pos = { x: number, y: number; };
export type CPUMove = { owner: boolean, from: Pos, to: Pos, nari: boolean; };
export type Kifu = { move: CPUMove, take: number; };

//成りが可能か判定
export function canNari(y: number, ny: number, type: number, owner: boolean) {
  if (type > 6 || type === 5) return false;
  if (!owner && y <= 2) return true;
  if (!owner && ny <= 2) return true;
  if (owner && y >= 6) return true;
  if (owner && ny >= 6) return true;
  return false;
}

//最上段に行けない駒の判定
export function isTopcell(y: number, type: number, owner: boolean) {
  if (type !== 0 && type !== 1 && type !== 2) return false;
  if (type === 0 || type === 1) {
    if (owner && y === 8) return true;
    if (!owner && y === 0) return true;
  } else if (type === 2) {
    if (owner && y >= 7) return true;
    if (!owner && y <= 1) return true;
  }
  return false;
}

//２歩の判定
export function isNihu(board: CPUBoard, x: number, type: number, owner: boolean) {
  if (type !== 0) return false;
  for (let i = 0; i < 9; i++) {
    const target = board.map[x][i];
    if (target && target.type === 0 && target.owner === owner) return true;
  }
  return false;
}

//打てる手を全て返す関数
export function getAllPuts(board: CPUBoard, owner: boolean) {
  const moves: CPUMove[] = [];
  const hands = board.hands[owner ? 1 : 0];
  const map = board.map;

  // 持ち駒の種類ごとに処理
  for (let k = 0; k < 7; k++) {
    if (hands[k] === 0) continue;

    // 各マスをチェック
    for (let i = 0; i < 9; i++) {
      // 二歩チェック用フラグ
      let nihuCheck = k === 0;
      let nihuFound = false;

      for (let j = 0; j < 9; j++) {
        // 既に駒がある場合はスキップ
        if (map[i][j]) continue;

        // 二歩チェック
        if (nihuCheck && !nihuFound) {
          nihuFound = isNihu(board, i, k, owner);
        }

        // 打てる手を追加
        if (!isTopcell(j, k, owner) && !(nihuCheck && nihuFound)) {
          moves.push({ owner, from: { x: -1, y: k }, to: { x: i, y: j }, nari: false });
        }
      }
    }
  }
  return moves;
}

export function getPieceMoves(board: CPUBoard, owner: boolean, i: number, j: number) {
  const piece = board.map[i][j];
  if (!piece || piece.owner !== owner) return [];
  const moves: CPUMove[] = [];
  repeatMove(board, piece, i, j, (x, y) => {
    moves.push({ owner: piece.owner, from: { x: i, y: j }, to: { x, y }, nari: false });
    if (canNari(j, y, piece.type, piece.owner)) {
      moves.push({ owner: piece.owner, from: { x: i, y: j }, to: { x, y }, nari: true });
    }
    return false;
  });
  return moves;
}


//動かせる手を全て返す関数
export function getAllMoves(board: CPUBoard, owner: boolean) {
  const moves: CPUMove[] = [];

  // 盤面を走査
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      // 駒の移動可能な手を取得
      const pieceMoves = getPieceMoves(board, owner, i, j);
      moves.push(...pieceMoves);
    }
  }
  return moves;
}

//合法手をすべて返す関数
export function getAllPossibleMoves(board: CPUBoard, owner: boolean) {
  const moves: CPUMove[] = [];
  moves.push(...getAllMoves(board, owner));
  moves.push(...getAllPuts(board, owner));
  return moves;
}



//駒の移動可能座標をプレイヤーの向きに合わせる関数
export function directionForOwner(dir: { x: number, y: number; }, owner: boolean) {
  if (owner) return { x: -dir.x, y: -dir.y };
  else return dir;
}

//駒の移動可能位置で　引数に入れた関数　を実行する関数
export function repeatMove(board: CPUBoard, piece: CPUPiece, startX: number, startY: number, cb: (x: number, y: number) => boolean) {
  const moves = PIECE_MOVES[piece.type];
  const map = board.map;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    const dir = directionForOwner(move, piece.owner);
    let moveX = startX + dir.x;
    let moveY = startY + dir.y;

    while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
      const target = map[moveX][moveY];

      // 自駒にぶつかったら終了
      if (target && target.owner === piece.owner) break;

      // コールバック実行
      if (cb(moveX, moveY)) return true;

      // 再帰的でない移動なら終了
      if (!move.recursive) break;
      if (target) break;

      // 次の移動位置
      moveX += dir.x;
      moveY += dir.y;
    }
  }
  return false;
}

export function isInEnemyTerritory(y: number, owner: boolean) {
  return (!owner && y < 3) || (owner && y >= 6);
}



//駒を移動する関数
export function movePiece(board: CPUBoard, move: CPUMove) {
  const { from, to } = move;
  board.map[to.x][to.y] = board.map[from.x][from.y];
  board.map[from.x][from.y] = null;
}

//駒を打つ関数
export function putpiece(board: CPUBoard, move: CPUMove) {
  const { owner, from, to } = move;

  // 座標のバリデーション
  if (to.x < 0 || to.x >= 9 || to.y < 0 || to.y >= 9) {
    throw new Error(`Invalid position: ${to.x},${to.y}`);
  }

  // 持ち駒の確認
  const handIndex = owner ? 1 : 0;
  const pieceType = from.y;

  if (!board.hands[handIndex] || !board.hands[handIndex][pieceType]) {
    throw new Error(`Invalid hand structure: ${handIndex},${pieceType}`);
  }

  if (board.hands[handIndex][pieceType] === 0) {
    throw new Error(`No piece in hand: ${handIndex},${pieceType}`);
  }

  // 駒を盤面に配置
  board.map[to.x][to.y] = { type: pieceType, owner: owner };
  board.hands[handIndex][pieceType]--;
}

//駒を取る関数
export function takePiece(board: CPUBoard, pos: Pos) {
  const piece = board.map[pos.x][pos.y];
  if (!piece) {
    throw new Error(`No piece at position: ${pos.x},${pos.y}`);
  }

  board.map[pos.x][pos.y] = null;
  board.hands[piece.owner ? 0 : 1][UNPROMOTE_TYPE[piece.type]]++;
  return piece.type;
}



//指し手を進める関数
export function doMove(board: CPUBoard, move: CPUMove) {
  const { from, to } = move;

  //駒を打つ場合
  if (move.from.x < 0) {
    try {
      putpiece(board, move);
      return { move, take: -1 };
    } catch (e) {
      console.error("Invalid put move:", move, e);
      return null;
    }
  }

  let taketype: number = -1;
  const piece = board.map[from.x][from.y];
  if (!piece) {
    throw new Error(`No piece at position: ${from.x},${from.y}`);
  }

  //駒を動かす場合

  //敵陣内なら成り判定
  if (move.nari && canNari(from.y, to.y, piece.type, piece.owner)) {
    piece.type = PROMOTE_TYPE[piece.type];
  }
  //移動先の駒を取得
  if (board.map[move.to.x][move.to.y]) {
    taketype = takePiece(board, move.to);
  }
  //駒を移動
  movePiece(board, move);

  return { move, take: taketype };
}

//指し手を戻す関数
export function undoMove(board: CPUBoard, kifuMove: Kifu) {
  const { move, take } = kifuMove;
  const piece = board.map[move.to.x][move.to.y];
  if (!piece) {
    throw new Error(`No piece at position: ${move.to.x},${move.to.y}`);
  }

  //打っていた場合
  if (move.from.x < 0) {
    putBack(board, move);
    return;
  }

  //駒を動かす
  moveBack(board, move);

  //駒をとっていた場合
  if (take !== -1) {
    takeBack(board, move, take);
  }

  //成りの場合
  if (kifuMove.move.nari) {
    piece.type = UNPROMOTE_TYPE[piece.type];
  }
}

//打った駒を戻す関数
export function putBack(board: CPUBoard, move: CPUMove) {
  const { from, to } = move;

  board.hands[move.owner ? 1 : 0][from.y]++;
  board.map[to.x][to.y] = null;
}

//動かした駒を戻す関数
export function moveBack(board: CPUBoard, move: CPUMove) {
  const { from, to } = move;

  // 境界チェック
  if (from.x < 0 || from.x >= board.map.length || from.y < 0 || from.y >= board.map[0].length ||
    to.x < 0 || to.x >= board.map.length || to.y < 0 || to.y >= board.map[0].length) {
    throw new Error("Invalid move coordinates");
  }

  board.map[from.x][from.y] = board.map[to.x][to.y];
  board.map[to.x][to.y] = null;
}

//取った駒を戻す関数
export function takeBack(board: CPUBoard, move: CPUMove, take: number) {

  const { from, to } = move;
  const type = UNPROMOTE_TYPE[take];

  const piece = board.map[from.x][from.y];
  if (!piece) throw new Error("piece is null");

  // 持ち駒のタイプが正しいか確認
  if (type < 0 || type >= board.hands[piece.owner ? 1 : 0].length) {
    console.error(`Invalid piece type: ${type}`);
    console.error(`Valid range: 0-${board.hands[piece.owner ? 1 : 0].length - 1}`);
    return;
  }

  // 持ち駒の数を確認
  const currentHand = board.hands[piece.owner ? 1 : 0][type];

  if (currentHand <= 0) {
    console.error(`No ${type} pieces in hand for player ${piece.owner ? 1 : 0}`);
    console.error("Hands state:", board.hands);
    return;
  }

  board.hands[piece.owner ? 1 : 0][type]--;
  board.map[to.x][to.y] = { owner: !piece.owner, type: take };
}


//盤面をCPUの脳内盤面にコピーする関数
export function setBoard(board: Board, cpu_board: CPUBoard) {
  const map = cpu_board.map;
  const hands = cpu_board.hands;

  // 持ち駒を初期化
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      map[i][j] = null;
    }
  }
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < hands.length; j++) {
      hands[i][j] = 0;
    }
  }

  const pieces = board.pieces;
  //駒をセット
  for (let i = 0; i < board.pieces.length; i++) {
    const type = pieces[i].type;

    //持ち駒をセット
    if (pieces[i].x < 0) {
      const handIndex = pieces[i].teban === -1 ? 1 : 0;
      if (type >= 0 && type < cpu_board.hands[handIndex].length) {
        cpu_board.hands[handIndex][type]++;
      }
    } else {
      //盤面をセット
      const owner = pieces[i].teban === -1;
      cpu_board.map[pieces[i].x][pieces[i].y] = { owner: owner, type: type };
    }
  }
  return cpu_board;
}

