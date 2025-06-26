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
    canPromote(x, y, ny) {
        const piece = this.map[x][y];
        if (!UNPROMODED_TYPES.includes(piece.type)) return false;
        if (piece.teban === 1 && y < 3) return true;
        if (piece.teban === 1 && ny < 3) return true;
        if (piece.teban === -1 && y >= 6) return true;
        if (piece.teban === -1 && ny >= 6) return true;
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
        if (nari && !this.canPromote(x, y, ny)) return { res: false, capture: null };
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
}
let board;
let legalMoves = [];



// メインスレッドからのメッセージを受信
onmessage = function (e) {
    console.log('Worker: メインスレッドからメッセージを受信しました', e.data);
    if (e.data[0] === "gameStart") {
        const data = e.data[1];
        board = new Board();
        board.init(data.servertime, data.time);
    }

    if (e.data[0] === "move") {
        board.movePieceLocal(e.data[1]);
    }

};

setInterval(() => {
    console.log('Worker: 3秒経過しました。CPUの手を計算します。');
    // ここにCPUの思考ロジックを実装
    const cpuMove = calculateCpuMove();

    console.log('Worker: CPUの手を計算しました', cpuMove);
    if (cpuMove) {
        // 計算結果をメインスレッドに送信
        postMessage({ move: cpuMove });
    }
}, 3000); // 3000ミリ秒 = 3秒

// CPUの思考ロジックを計算する関数
function calculateCpuMove() {
    getLegalMoves();
    if (legalMoves.length > 0) {
        // 合法手の中からランダムに選択
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        const randomMove = legalMoves[randomIndex];
        console.log('calculateCpuMove: ランダムに選択された合法手', randomMove);
        return randomMove;
    } else {
        // 合法手がない場合 (詰みなど)
        console.log('calculateCpuMove: 合法手がありません');
        return null;
    }
}

function getPeaceLeagalMoves(x, y) {
    const selectedPiece = board.map[x][y];
    console.log(selectedPiece);
    for (const move of PIECE_MOVES[selectedPiece.type]) {
        let moveX = x + move.dx * selectedPiece.teban;
        let moveY = y + move.dy * selectedPiece.teban;
        while (moveX >= 0 && moveX < BOARD_SIZE && moveY >= 0 && moveY < BOARD_SIZE) {
            const piece = board.map[moveX][moveY];
            if (piece && piece.teban === selectedPiece.teban) break;
            console.log(piece);

            if ((moveY > 8 + selectedPiece.teban * 3 || moveY < 0 + selectedPiece.teban * 3) && UNPROMODED_TYPES.includes(selectedPiece.type)) {
                legalMoves.push({
                    x: x, y: y, nx: moveX, ny: moveY, nari: true,
                    teban: selectedPiece.teban
                });
            }
            if (board.isTopCell(moveX, moveY, selectedPiece.type, selectedPiece.teban)) break;
            legalMoves.push({
                x: x, y: y, nx: moveX, ny: moveY, nari: false,
                teban: selectedPiece.teban
            });

            if (!move.recursive) break;
            if (piece) break;
            moveX += move.dx * selectedPiece.teban;
            moveY += move.dy * selectedPiece.teban;
        }
    }
}

// 合法手を取得する関数 (スケルトン - 要具体的な将棋ロジックの実装)
function getLegalMoves() {
    legalMoves = [];
    console.log('現在の盤面状態:', board); // 盤面状態の確認用
    if (board === null) return;
    console.log("getLegalMoves");
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (!board.map[i][j]) continue;
            if (board.map[i][j].teban !== -1) continue;
            getPeaceLeagalMoves(i, j);
        }
    }
}

