const PIECE_MOVES = {
    pawn: [
        { dx: 0, dy: -1 } // 先手の場合、1マス前
    ],
    prom_pawn: [ // 成り駒（と金）
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }
    ],
    lance: [
        { dx: 0, dy: -1, recursive: true } // 先手の場合、前方に無限
    ],
    prom_lance: [ // 成り駒（成香）
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }
    ],
    knight: [
        { dx: 1, dy: -2 },
        { dx: -1, dy: -2 }
    ],
    prom_knight: [ // 成り駒（成桂）
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }
    ],
    silver: [
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 1 },
        { dx: -1, dy: 1 }
    ],
    prom_silver: [ // 成り駒（成銀）
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }
    ],
    gold: [
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 }
    ],
    bishop: [
        { dx: 1, dy: -1, recursive: true }, // 右上
        { dx: -1, dy: -1, recursive: true },// 左上
        { dx: 1, dy: 1, recursive: true },  // 右下
        { dx: -1, dy: 1, recursive: true }  // 左下
    ],
    horse: [ // 成り駒（馬）
        { dx: 1, dy: -1, recursive: true }, // 右上
        { dx: -1, dy: -1, recursive: true },// 左上
        { dx: 1, dy: 1, recursive: true },  // 右下
        { dx: -1, dy: 1, recursive: true }, // 左下
        { dx: 0, dy: -1 }, // 上
        { dx: 0, dy: 1 },  // 下
        { dx: 1, dy: 0 },  // 右
        { dx: -1, dy: 0 }  // 左
    ],
    rook: [
        { dx: 0, dy: -1, recursive: true }, // 上
        { dx: 0, dy: 1, recursive: true },  // 下
        { dx: 1, dy: 0, recursive: true },  // 右
        { dx: -1, dy: 0, recursive: true }  // 左
    ],
    dragon: [ // 成り駒（龍）
        { dx: 0, dy: -1, recursive: true }, // 上
        { dx: 0, dy: 1, recursive: true },  // 下
        { dx: 1, dy: 0, recursive: true },  // 右
        { dx: -1, dy: 0, recursive: true }, // 左
        { dx: 1, dy: -1 }, // 右上
        { dx: -1, dy: -1 },// 左上
        { dx: 1, dy: 1 },  // 右下
        { dx: -1, dy: 1 }  // 左下
    ],
    king: [
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: -1, dy: 1 }
    ],
    king2: [ // 相手の王将
        { dx: 1, dy: -1 },
        { dx: -1, dy: -1 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 1, dy: 1 },
        { dx: -1, dy: 1 }
    ]
};

const UNPROMODED_TYPES = ['pawn', 'lance', 'knight', 'silver', 'bishop', 'rook'];
const BOARD_SIZE = 9;
const MOVETIME = 5000;


function getUnPromotedType(type) {
    const promotedTypes = {
        prom_pawn: 'pawn',
        prom_lance: 'lance',
        prom_knight: 'prom_knight',
        prom_silver: 'silver',
        horse: 'bishop',
        dragon: 'rook'
    };
    return promotedTypes[type] || type;
}
function getPromotedType(type) {
    const promotedTypes = {
        pawn: 'prom_pawn',
        lance: 'prom_lance',
        knight: 'prom_knight',
        silver: 'prom_silver',
        bishop: 'horse',
        rook: 'dragon'
    };
    return promotedTypes[type] || type;
}

class Board {
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
    // komadaiServerTime = { sente: 0, gote: 0 };
    // komadaipTime = { sente: 0, gote: 0 };
    kifu = [];

    serverstarttime = 0;
    starttime = 0;
    time = 0;
    matched = false;
    started = false;
    finished = false;

    piecePoint = 0;

    // 盤面の初期化
    init(servertime, time) {
        this.serverstarttime = servertime;
        // this.komadaiServerTime = { sente: servertime, gote: servertime };
        // this.komadaipTime = { sente: time, gote: time };
        this.starttime = time;
        this.time = time;
        this.matched = true;
        this.komadaiPieces = {
            sente: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 },
            gote: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 }
        };
        this.map = [[null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null]];
        this.initPieces(1);
        this.initPieces(-1);
    }

    //初期配置作成用関数（歩）
    initPawnPiece(teban) {
        let y = 4 + teban * 2;
        for (let x = 0; x < 9; x++) this.setPiece(x, y, 'pawn', teban);
    }

    //初期配置作成関数
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

    //無から駒を配置する関数
    setPiece(x, y, type, teban) {
        this.map[x][y] = { type: type, teban: teban, lastmovetime: this.serverstarttime, lastmoveptime: this.starttime };
    }

    //指定したマスへの移動が合法手か判定
    checkMove(xx, yy, teban, type, nari, nteban) {
        if (this.map[xx][yy] && this.map[xx][yy].teban === nteban) return false;
        if (nari) {
            if (teban === 1 && yy > 2) return false;
            if (teban === -1 && yy < 6) return false;
        } else {
            if (this.isTopCell(xx, yy, type, teban)) return false;
        }
        return true;
    }

    //移動可能かどうか判定
    canMove(x, y, nx, ny, nari, nteban) {
        const dx = nx - x;
        const dy = ny - y;

        const piece = this.map[x][y];

        const moves = PIECE_MOVES[piece.type];
        if (!moves) return false;

        for (const move of moves) {
            if (move.dx === dx && move.dy === dy * nteban) {
                return this.checkMove(x + move.dx, y + move.dy * nteban, piece.teban, piece.type, nari, nteban);
            }

            // 再帰的に動きを計算
            if (move.recursive) {
                let currentX = x + move.dx;
                let currentY = y + move.dy * nteban;
                while (currentX >= 0 && currentX < BOARD_SIZE && currentY >= 0 && currentY < BOARD_SIZE) {
                    if (this.map[currentX][currentY] && this.map[currentX][currentY].teban === nteban) break;
                    if (currentX === nx && currentY === ny) return this.checkMove(currentX, currentY, piece.teban, piece.type, nari, nteban);
                    if (this.map[currentX][currentY] && this.map[currentX][currentY].teban !== nteban) break;
                    currentX += move.dx;
                    currentY += move.dy * nteban;
                    if (currentX < 0 || currentX >= BOARD_SIZE || currentY < 0 || currentY >= BOARD_SIZE) break;
                }
            }
        }

        return false;
    }

    //指定した位置に駒を打てるか判定
    canPut(x, y, type, teban, servertime) {
        // if (servertime - (teban === 1 ? this.komadaiServerTime.sente : this.komadaiServerTime.gote) < MOVETIME) return false;
        if (this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type] <= 0) return false
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || this.map[x][y]) return false;
        if (this.isTopCell(x, y, type, teban)) return false;
        if (this.isNihu(x, y, type, teban)) return false;
        return true;
    }

    canPutPlace(x, y, type, teban) {
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE || this.map[x][y]) return false;
        if (this.isTopCell(x, y, type, teban)) return false;
        if (this.isNihu(x, y, type, teban)) return false;
        return true;
    }

    //歩、香、桂は最上段（２段目）に移動できないためこの関数で判定
    isTopCell(x, y, type, teban) {
        if (type === 'pawn' || type === 'lance') {
            if (teban === 1 && y === 0 || teban === -1 && y === 8) return true;
        }
        if (type === 'knight') {
            if (teban === 1 && y <= 1 || teban === -1 && y >= 7) return true;
        }
        return false;
    }

    //二歩判定
    isNihu(x, y, type, teban) {
        if (type === 'pawn') {
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (this.map[x][i] && this.map[x][i].type === 'pawn' && this.map[x][i].teban === teban) return true;
            }
        }
        return false;
    }

    //成り可能判定
    canPromote(y, ny, teban, type) {
        if (!UNPROMODED_TYPES.includes(type)) return false;
        if (teban === 1 && y < 3) return true;
        if (teban === 1 && ny < 3) return true;
        if (teban === -1 && y >= 6) return true;
        if (teban === -1 && ny >= 6) return true;
        return false;
    }

    //サーバーから手（打つ）を受け取ったときに起動する関数
    putPieceLocal(data) {
        const { x, y, nx, ny, type, nari, teban, roomId, servertime } = data;
        const lmp = performance.now();
        if (!this.canPut(nx, ny, type, teban, servertime)) return { res: false, capture: null };
        this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type]--;

        this.map[nx][ny] = { type: type, teban: teban, lastmovetime: servertime, lastmoveptime: lmp };
        this.kifu.push({ x: -2 + teban, y: -2 + teban, nx: nx, ny: ny });
        return { res: true, capture: null };
    }

    //サーバーから手（移動）を受け取ったときに起動する関数
    movePieceLocal(data) {
        const { x, y, nx, ny, type, nari, teban, roomId, servertime } = data;

        if (x === -1) {
            return this.putPieceLocal(data);
        }
        const lmp = performance.now();

        const result = this.getCanMovePiece(x, y, nx, ny, nari, teban, servertime);
        if (!result.res) return { res: false, capture: null };

        this.movePiece(data, result.capture, lmp);

        return result;
    }

    //指定した位置の駒が移動かどうか判定
    getCanMovePiece(x, y, nx, ny, nari, teban, servertime) {
        //盤上の駒を動かす場合
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return { res: false, capture: null };
        const piece = this.map[x][y];
        let capturePiece = null;

        //nullチェック
        if (!piece) return { res: false, capture: null };
        if (teban !== piece.teban) return { res: false, capture: null };
        //時間チェック
        if (servertime - piece.lastmovetime < MOVETIME) {
            return { res: false, capture: null };
        }
        //成りチェック
        if (nari && !this.canPromote(y, ny, teban, piece.type)) return { res: false, capture: null };
        //駒の移動が可能かどうかを判定  // エラーチェック: ここでreturn
        if (!this.canMove(x, y, nx, ny, nari, teban)) return { res: false, capture: null };

        if (this.map[nx][ny]) capturePiece = this.map[nx][ny].type;
        return { res: true, capture: capturePiece };
    }

    getCanMovePieceIgnoreTime(x, y, nx, ny, nari, teban, servertime) {
        //盤上の駒を動かす場合
        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return { res: false, capture: null };
        const piece = this.map[x][y];
        let capturePiece = null;

        //nullチェック
        if (!piece) return { res: false, capture: null };
        if (teban !== piece.teban) return { res: false, capture: null };
        //成りチェック
        if (nari && !this.canPromote(y, ny, teban, piece.type)) return { res: false, capture: null };
        //駒の移動が可能かどうかを判定  // エラーチェック: ここでreturn
        if (!this.canMove(x, y, nx, ny, nari, teban)) return { res: false, capture: null };

        if (this.map[nx][ny]) capturePiece = this.map[nx][ny].type;
        return { res: true, capture: capturePiece };
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

    //駒を移動させる時の処理
    movePiece(data, capturePiece, lmp) {
        const { x, y, nx, ny, type, nari, teban, roomId, servertime } = data;
        let captime = -1;
        if (capturePiece) {
            captime = this.map[nx][ny].lastmovetime;
            const unPromotedType = getUnPromotedType(capturePiece);
            this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][unPromotedType]++
        }

        let pieceType = this.map[x][y].type;
        if (nari) {
            pieceType = getPromotedType(this.map[x][y].type);
        }

        this.map[nx][ny] = { type: pieceType, teban: this.map[x][y].teban, lastmovetime: servertime, lastmoveptime: lmp };
        this.map[x][y] = null;

        //棋譜更新
        this.kifu.push({ x, y, nx, ny, nari, teban, capturePiece, time: servertime, captime: captime });
        return true;
    }


    checkGameEnd(data) {
        const { nx, ny, teban } = data;

        if (this.komadaiPieces["sente"]["king2"] > 0 || this.komadaiPieces["gote"]["king"] > 0) {
            return { player: teban, text: "勝利" };
        }
        if (this.map[nx][ny].type === "king" && teban === 1 && nx === 4 && ny === 0) {
            return { player: teban, text: "トライ勝ち" };
        } else if (this.map[nx][ny].type === "king2" && teban === -1 && nx === 4 && ny === 8) {
            return { player: teban, text: "トライ勝ち" };
        }
        return { player: 0, text: "" };
    }

    undoMove() {
        if (this.kifu.length <= 0) return false;
        const lastMove = this.kifu.pop();
        this.map[lastMove.x][lastMove.y] = this.map[lastMove.nx][lastMove.ny];
        if (lastMove.capturePiece) {
            this.map[lastMove.nx][lastMove.ny] = { type: lastMove.capturePiece, teban: -lastMove.teban, lastMovetime: lastMove.captime, lastMoveptime: this.starttime }
        }
    }
}





/**
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 * ここからCPUアルゴリズム実装
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 * ＊＊＊＊＊＊＊＊＊＊＊＊＊＊
 */

let startTime = 0;
let board;
let cpuMoves = [];
let playerMoves = [];
let cpuKingPos = { x: 4, y: 0 };
let playerKingPos = { x: 4, y: 8 };

function normalAlgolysm(servertime) {

    const cpuCaptureMoves = [];
    const playerCaptureMoves = [];
    const playerCaptureMovesIgnoreTime = [];
    const kingCollisionMoves = [];
    const kingCollisionMovesIgnoreTime = [];
    const kingEscapeMoves = [];
    const kingEscapeMovesIgnoreTime = [];
    const collisionMoves = [];
    const collisionMovesIgnoreTime = [];
    const escapeMoves = [];
    const escapeMovesIgnoreTime = [];
    const safetyCapMoves = [];
    const cpuLeagalMoves = getLeagalMoves(-1, servertime, false);
    const playerLeagalMoves = getLeagalMoves(1, servertime, true);

    for (const move of cpuLeagalMoves) {
        if (move.nx === playerKingPos.x && move.ny === playerKingPos.ny) {
            postMessage({ move: move });
            return true;
        }
    }

    //放置すると取られる駒を検索
    for (const move of playerLeagalMoves) {
        const res = board.getCanMovePieceIgnoreTime(move.x, move.y, move.nx, move.ny, move.nari, move.teban, servertime);
        if (res.capture !== null) {
            if (move.ignoretime) {
                playerCaptureMovesIgnoreTime.push(move);
            } else {
                playerCaptureMoves.push(move);
            }
        }
    }

    //放置すると取られる駒で駒をとれる手を検索
    for (const move of playerCaptureMoves) {
        const targetPieceMoves = getPieceLeagalMoves(move.nx, move.ny, -1, servertime, false);
        for (const targetmove of targetPieceMoves) {
            if ((targetmove.nx === move.x) && (targetmove.ny === move.y)) {
                collisionMoves.push(targetmove);
            };
            //放置すると取られる駒で逃げる手を検索
            if (!isDanger(targetmove.x, targetmove.y, targetmove.nx, targetmove.ny, -1)) {
                escapeMoves.push(targetmove);
            }
        }
    }

    //放置すると取られる駒で駒をとれる手を検索IgnoreTime
    for (const move of playerCaptureMovesIgnoreTime) {
        const targetPieceMoves = getPieceLeagalMoves(move.nx, move.ny, -1, servertime, false);
        for (const targetmove of targetPieceMoves) {
            if ((targetmove.nx === move.x) && (targetmove.ny === move.y)) {
                collisionMovesIgnoreTime.push(targetmove);
            };
            //放置すると取られる駒で逃げる手を検索
            if (!isDanger(targetmove.x, targetmove.y, targetmove.nx, targetmove.ny, -1)) {
                escapeMovesIgnoreTime.push(targetmove);
            }
        }
    }

    //取られそうな玉で逆にとる手があれば指す
    for (const move of collisionMoves) {
        if ((move.x === cpuKingPos.x) && (move.y === cpuKingPos.y)) {
            if (!isDanger(move.x, move.y, move.nx, move.ny, -1)) {
                kingCollisionMoves.push(move);
            }
        }
    }
    if (kingCollisionMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * kingCollisionMoves.length);
        const randomMove = kingCollisionMoves[randomIndex];
        console.log('calculateCpuMove: 取られそうな玉で逆にとる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }


    //取られそうな玉で逆にとる手があれば指す
    for (const move of collisionMovesIgnoreTime) {
        if ((move.x === cpuKingPos.x) && (move.y === cpuKingPos.y)) {
            if (!isDanger(move.x, move.y, move.nx, move.ny, -1)) {
                kingCollisionMovesIgnoreTime.push(move);
            }
        }
    }
    if (kingCollisionMovesIgnoreTime.length > 0) {
        const randomIndex = Math.floor(Math.random() * kingCollisionMovesIgnoreTime.length);
        const randomMove = kingCollisionMovesIgnoreTime[randomIndex];
        console.log('calculateCpuMove: 取られそうな玉で逆にとる手があれば指すignoretime', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    //玉が危険な位置に行く手を削除



    console.log("cpuKingPos", cpuKingPos.x, cpuKingPos.y);
    console.log("collisionMoves", collisionMoves);
    console.log("collisionMovesIgnoreTime", collisionMovesIgnoreTime);

    //玉が逃げる手があれば指す
    for (const move of escapeMoves) {
        if ((move.x === cpuKingPos.x) && (move.y === cpuKingPos.y)) {
            kingEscapeMoves.push(move);
        }
    }
    if (kingEscapeMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * kingEscapeMoves.length);
        const randomMove = kingEscapeMoves[randomIndex];
        console.log('calculateCpuMove: 玉が逃げる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    //玉が逃げる手があれば指すIgnoreTime
    for (const move of escapeMovesIgnoreTime) {
        if ((move.x === cpuKingPos.x) && (move.y === cpuKingPos.y)) {
            kingEscapeMovesIgnoreTime.push(move);
        }
    }
    if (kingEscapeMovesIgnoreTime.length > 0) {
        const randomIndex = Math.floor(Math.random() * kingEscapeMovesIgnoreTime.length);
        const randomMove = kingEscapeMovesIgnoreTime[randomIndex];
        console.log('calculateCpuMove: 玉が逃げる手があれば指すignoretime', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    const collisionMovesKingfiltered = collisionMoves.filter(item => ((item.x !== cpuKingPos.x) || (item.y !== cpuKingPos.y) || !isDanger(item.x, item.y, item.nx, item.ny, item.teban)));

    //取られそう駒で逆にとる手があれば指す
    if (collisionMovesKingfiltered.length > 0) {
        const randomIndex = Math.floor(Math.random() * collisionMovesKingfiltered.length);
        const randomMove = collisionMovesKingfiltered[randomIndex];
        console.log('calculateCpuMove: 取られそうな駒で逆にとる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    const collisionMovesIgnoreTimeKingfiltered = collisionMovesIgnoreTime.filter(item => ((item.x !== cpuKingPos.x) || (item.y !== cpuKingPos.y) || !isDanger(item.x, item.y, item.nx, item.ny, item.teban)));

    //取られそう駒で逆にとる手があれば指すIgnoreTime
    if (collisionMovesIgnoreTimeKingfiltered.length > 0) {
        const randomIndex = Math.floor(Math.random() * collisionMovesIgnoreTimeKingfiltered.length);
        const randomMove = collisionMovesIgnoreTimeKingfiltered[randomIndex];
        console.log('calculateCpuMove: 取られそうな駒で逆にとる手があれば指すignoretime', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    //駒を取れる手を検索
    for (const move of cpuLeagalMoves) {
        const res = board.getCanMovePiece(move.x, move.y, move.nx, move.ny, move.nari, move.teban, servertime);
        if (res.capture !== null) {
            cpuCaptureMoves.push(move);
        }
    }

    //安全に駒をとれる手を検索
    for (const move of cpuCaptureMoves) {
        if (!isDanger(move.x, move.y, move.nx, move.ny, -1)) {
            safetyCapMoves.push(move);
        }
    }

    //安全に駒をとれる手があれば指す
    if (safetyCapMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * safetyCapMoves.length);
        const randomMove = safetyCapMoves[randomIndex];
        console.log('calculateCpuMove: 安全に駒をとれる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }

    //駒を逃げれる手があれば指す
    if (escapeMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * escapeMoves.length);
        const randomMove = escapeMoves[randomIndex];
        console.log('calculateCpuMove: 駒を逃げれる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }


    const cpuCaptureMovesKingfiltered = cpuCaptureMoves.filter(item => ((item.x !== cpuKingPos.x) || (item.y !== cpuKingPos.y) || !isDanger(item.x, item.y, item.nx, item.ny, item.teban)));

    //駒を取れる手があれば指す
    if (cpuCaptureMovesKingfiltered.length > 0) {
        const randomIndex = Math.floor(Math.random() * cpuCaptureMovesKingfiltered.length);
        const randomMove = cpuCaptureMovesKingfiltered[randomIndex];
        console.log('calculateCpuMove: 駒を取れる手があれば指す', randomMove);
        postMessage({ move: randomMove });
        return true;
    }
}


function randomMoveNoKingDanger(servertime) {
    const cpuLeagalMoves = getLeagalMoves(-1, servertime, false)
    //玉が危険な位置に行く手は消去
    const cpuLeagalMovesKingfiltered = cpuLeagalMoves.filter(item => ((item.x !== cpuKingPos.x) || (item.y !== cpuKingPos.y)) || !isDanger(item.x, item.y, item.nx, item.ny, item.teban));

    cpuLeagalMovesKingfiltered.push(...getAllLeagalPuts(-1));
    //ここまでの条件に適合する手がなければランダムに選択
    if (cpuLeagalMovesKingfiltered.length > 0) {
        const randomIndex = Math.floor(Math.random() * cpuLeagalMovesKingfiltered.length);
        const randomMove = cpuLeagalMovesKingfiltered[randomIndex];
        console.log('calculateCpuMove: ランダムに選択', randomMove);
        postMessage({ move: randomMove });
        return true;
    }
}


function getPosLeagalPuts(x, y, teban) {
    let leagalPuts = [];
    for (const type of UNPROMODED_TYPES) {
        if (board.isNihu(x, y, type, teban)) continue;
        if (board.isTopCell(x, y, type, teban)) continue;
        if (board.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type] > 0) {
            leagalPuts.push({
                x: -1,
                y: -1,
                nx: x,
                ny: y,
                nari: false,
                type: type,
                teban: teban,
                ignoretime: false
            });
        }
    }
    return leagalPuts;
}

function getPieceLeagalMoves(x, y, teban, servertime, ignoretime) {
    const pieceLeagalMoves = [];
    const selectedPiece = board.map[x][y];
    if (!selectedPiece) return [];
    if (selectedPiece.teban !== teban) return [];
    if (!ignoretime && (selectedPiece.lastmovetime >= (servertime - MOVETIME))) return [];

    for (const move of PIECE_MOVES[selectedPiece.type]) {
        let moveX = x;
        let moveY = y;
        while (true) {
            moveX += move.dx * selectedPiece.teban;
            moveY += move.dy * selectedPiece.teban;
            if (moveX < 0 || moveX >= BOARD_SIZE || moveY < 0 || moveY >= BOARD_SIZE) break;
            const piece = board.map[moveX][moveY];
            if (piece && piece.teban === selectedPiece.teban) break;

            if (board.canPromote(move.y, moveY, teban, selectedPiece.type)) {
                if (selectedPiece.lastmovetime >= (servertime - MOVETIME)) {
                    pieceLeagalMoves.push({
                        x: x,
                        y: y,
                        nx: moveX,
                        ny: moveY,
                        nari: true,
                        type: null,
                        teban: teban,
                        ignoretime: true
                    });
                } else {
                    pieceLeagalMoves.push({
                        x: x,
                        y: y,
                        nx: moveX,
                        ny: moveY,
                        nari: true,
                        type: null,
                        teban: teban,
                        ignoretime: false
                    });
                }
            } else {
                if (board.isTopCell(moveX, moveY, selectedPiece.type, selectedPiece.teban)) break;
                if (selectedPiece.lastmovetime >= (servertime - MOVETIME)) {
                    pieceLeagalMoves.push({
                        x: x,
                        y: y,
                        nx: moveX,
                        ny: moveY,
                        nari: false,
                        type: null,
                        teban: teban,
                        ignoretime: true
                    });
                } else {
                    pieceLeagalMoves.push({
                        x: x,
                        y: y,
                        nx: moveX,
                        ny: moveY,
                        nari: false,
                        type: null,
                        teban: teban,
                        ignoretime: false
                    });
                }
            }

            if (!move.recursive) break;
            if (piece) break;
        }
    }
    return pieceLeagalMoves;
}

function isDanger(x, y, nx, ny, teban) {
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (i === 0 && j === 0) continue;
            if (i < 0 || i > 8 || j < 0 || j > 8) continue;
            let attackerX = nx;
            let attackerY = ny;
            let recursive = false;
            while (true) {
                attackerX += i;
                attackerY += j;
                if (attackerX < 0 || attackerX > 8 || attackerY < 0 || attackerY > 8) break;
                const attacker = board.map[attackerX][attackerY];
                if (!attacker || ((attackerX === x) && (attackerY === y))) {
                    recursive = true;
                    continue;
                }
                if (attacker.teban === teban) break;
                for (const move of PIECE_MOVES[attacker.type]) {
                    if (move.dx === i && (move.dy === (j * teban))) {
                        if (recursive) {
                            if (move.recursive) return true;
                        } else {
                            return true;
                        }
                    }
                }
                break;
            }
        }
    }
    if (y - 2 * teban >= 0 && y - 2 * teban < 9) {
        if (x > 0) {
            const lpiece = board.map[x - 1][y - 2 * teban];
            if (lpiece && lpiece.type === 'knight') return true;
        } else if (x < 8) {
            const rpiece = board.map[x + 1][y - 2 * teban];
            if (rpiece && rpiece.type === 'knight') return true;
        }
    }
    return false;
}

// 合法手を取得する関数 (スケルトン - 要具体的な将棋ロジックの実装)
function getLeagalMoves(teban, servertime, ignoretime) {
    const leagalMoves = [];
    if (board === null) return [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board.map[i][j]) {
                leagalMoves.push(...getPieceLeagalMoves(i, j, teban, servertime, ignoretime));
            }
        }
    }
    return leagalMoves;
}

function getAllLeagalPuts(teban) {
    const leagalPuts = [];
    if (board === null) return;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board.map[i][j] === null) {
                console.log("board.map[i][j] === null");
                leagalPuts.push(...getPosLeagalPuts(i, j, teban));
            }
        }
    }
    return leagalPuts;
}

function copyBoard() {
    let boardcopy = new Board();
    boardcopy.serverstarttime = board.serverstarttime;
    boardcopy.starttime = board.starttime;
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            boardcopy.map[i][j] = { type: board.map[i][j].type, teban: board.map[i][j].teban };
        }
    }
    for (const type of UNPROMODED_TYPES) {
        boardcopy.komadaiPieces['sente'][type] = board.komadaiPieces['sente'][type];
        boardcopy.komadaiPieces['gote'][type] = board.komadaiPieces['gote'][type];
    }
    return boardcopy;
}

function setcpu(lev) {
    //レベル０アルゴリズム（ランダムムーブ）
    if (lev === '0') {
        level0cpu();
    } else if (lev === '1') {
        level1cpu();
    } else if (lev === '2') {
        level2cpu();
    }
}

function randomMove(servertime) {
    const cpuLeagalMoves = getLeagalMoves(-1, servertime, false);
    cpuLeagalMoves.push(...getAllLeagalPuts(-1));
    if (cpuLeagalMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * cpuLeagalMoves.length);
        const randomMove = cpuLeagalMoves[randomIndex];
        console.log('calculateCpuMove: ランダムに選択された合法手', randomMove);
        postMessage({ move: randomMove });
    } else {
        console.log('calculateCpuMove: 合法手がありません');
        return null;
    }
}

function level0cpu() {
    setInterval(() => {
        const servertime = startTime + performance.now();
        randomMove(servertime);
    }, 3000);
}

function level1cpu() {
    setInterval(() => {
        const servertime = startTime + performance.now();
        if (!normalAlgolysm(servertime)) {
            randomMoveNoKingDanger(servertime);
        }
    }, 3000);
}

function level2cpu() {
    setInterval(() => {
        const servertime = startTime + performance.now();
        normalAlgolysm(servertime);
    }, 190);
    setInterval(() => {
        const servertime = startTime + performance.now();
        randomMoveNoKingDanger(servertime);
    }, 1000);
}

function level3cpu() {
    setInterval(() => {
        const servertime = startTime + performance.now();
        let boardcopy = copyBoard();

        const playerLeagalMoves = getLeagalMoves(1, servertime, false);
        const playerLeagalMovesIgnoreTime = getLeagalMoves(1, servertime, true);
        const cpuLeagalMoves = getLeagalMoves(1, servertime, false);
        const cpuLeagalMovesIgnoreTime = getLeagalMoves(1, servertime, true);

    }, 3000);
}

// メインスレッドからのメッセージを受信
onmessage = function (e) {
    console.log('Worker: メインスレッドからメッセージを受信しました', e.data);
    if (e.data[0] === "gameStart") {
        const data = e.data[1];
        board = new Board();
        startTime = data.servertime;
        board.init(data.servertime, data.time);
        setcpu(data.level);
    }

    if (e.data[0] === "move") {
        const move = e.data[1];
        board.movePieceLocal(e.data[1]);
        if (move.x === cpuKingPos.x && move.y === cpuKingPos.y) {
            cpuKingPos = { x: move.nx, y: move.ny };
        } else if (move.x === playerKingPos.x && move.y === playerKingPos.y) {
            playerKingPos = { x: move.nx, y: move.ny };
        }
    }
};


