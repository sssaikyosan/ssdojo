const SERVER_MOVETYME = 5;
const BOARD_SIZE = 9;
const KOMADAI_WIDTH_RATIO = 3;
const KOMADAI_HEIGHT_RATIO = 4;
const KOMADAI_OFFSET_RATIO = 0.1;
const BOARD_COLOR = '#af6b1e';
const LINE_COLOR = '#000000';
const MOUSE_HIGHLIGHT_COLOR = '#afb61e';

const LINEWIDTH = 2;

class Board {
  constructor(teban, roomId, time) {
    this.roomId = roomId;
    this.map = [[null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null]];
    this.pieces = []; // すべての駒を保持する配列
    this.hoveredCell = null; // マウスオーバー中のセル
    this.cellSize = 0; // セルのサイズ
    this.komadaiWidth = 0; // 駒台の幅
    this.komadaiHeight = 0; // 駒台の高さ
    this.offsetX = 0; // 盤面のXオフセット
    this.offsetY = 0; // 盤面のYオフセット
    this.teban = teban;
    this.draggingPiece = null;
    this.draggingPieceX = 0;
    this.draggingPieceY = 0;
    this.currentMove = 0;
    this.starttime = time;
    this.time = time;
    this.ptime = performance.now();
    this.komadaiPieces = {
      sente: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 },
      gote: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 }
    };
  }

  // 盤面の初期化
  init() {
    this.hoveredCell = null;
    this.draggingPiece = null;
    this.draggingPieceX = 0;
    this.draggingPieceY = 0;
    this.currentMove = 0;
    this.komadaiPieces = {
      sente: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 },
      gote: { 'pawn': 0, 'lance': 0, 'knight': 0, 'silver': 0, 'gold': 0, 'bishop': 0, 'rook': 0, 'king': 0, 'king2': 0 }
    };
    this.pieces = [
      // 1段目（後手）
      new Piece('lance', 0, 0, -1, this.starttime, this.ptime),
      new Piece('knight', 1, 0, -1, this.starttime, this.ptime),
      new Piece('silver', 2, 0, -1, this.starttime, this.ptime),
      new Piece('gold', 3, 0, -1, this.starttime, this.ptime),
      new Piece('king2', 4, 0, -1, this.starttime, this.ptime),  // 後手の玉
      new Piece('gold', 5, 0, -1, this.starttime, this.ptime),
      new Piece('silver', 6, 0, -1, this.starttime, this.ptime),
      new Piece('knight', 7, 0, -1, this.starttime, this.ptime),
      new Piece('lance', 8, 0, -1, this.starttime, this.ptime),
      // 2段目（後手）
      new Piece('bishop', 7, 1, -1, this.starttime, this.ptime),
      new Piece('rook', 1, 1, -1, this.starttime, this.ptime),
      // 3段目（後手）
      new Piece('pawn', 0, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 1, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 2, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 3, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 4, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 5, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 6, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 7, 2, -1, this.starttime, this.ptime),
      new Piece('pawn', 8, 2, -1, this.starttime, this.ptime),
      // 1段目（先手）
      new Piece('lance', 0, 8, 1, this.starttime, this.ptime),
      new Piece('knight', 1, 8, 1, this.starttime, this.ptime),
      new Piece('silver', 2, 8, 1, this.starttime, this.ptime),
      new Piece('gold', 3, 8, 1, this.starttime, this.ptime),
      new Piece('king', 4, 8, 1, this.starttime, this.ptime),  // 先手の玉
      new Piece('gold', 5, 8, 1, this.starttime, this.ptime),
      new Piece('silver', 6, 8, 1, this.starttime, this.ptime),
      new Piece('knight', 7, 8, 1, this.starttime, this.ptime),
      new Piece('lance', 8, 8, 1, this.starttime, this.ptime),
      // 2段目（先手）
      new Piece('rook', 7, 7, 1, this.starttime, this.ptime),
      new Piece('bishop', 1, 7, 1, this.starttime, this.ptime),
      // 3段目（先手）
      new Piece('pawn', 0, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 1, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 2, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 3, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 4, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 5, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 6, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 7, 6, 1, this.starttime, this.ptime),
      new Piece('pawn', 8, 6, 1, this.starttime, this.ptime),
    ];
    this.pieceToMap();
  }

  pieceToMap() {
    for (let i = 0; i < this.pieces.length; i++) {
      this.map[this.pieces[i].x][this.pieces[i].y] = this.pieces[i];
    }
  }

  resize() {
    this.cellSize = Math.min(canvas.width - this.komadaiWidth, canvas.height) * CELL_SIZE_RATIO;
    this.offsetX = (canvas.width - BOARD_SIZE * this.cellSize) / 2;
    this.offsetY = (canvas.height - BOARD_SIZE * this.cellSize) / 2;
    this.komadaiWidth = this.cellSize * KOMADAI_WIDTH_RATIO;
    this.komadaiHeight = this.cellSize * KOMADAI_HEIGHT_RATIO;
  }

  // 駒台の描画
  drawKomadai() {
    const komadaiX = this.offsetX + BOARD_SIZE * this.cellSize + this.cellSize * KOMADAI_OFFSET_RATIO;
    const komadaiY = this.offsetY + BOARD_SIZE * this.cellSize - this.komadaiHeight;
    ctx.fillStyle = BOARD_COLOR; // 駒台の色
    ctx.strokeStyle = LINE_COLOR;

    for (let i = 0; i < 2; i++) {
      ctx.fillRect(komadaiX, komadaiY, this.komadaiWidth, this.komadaiHeight);
      ctx.strokeRect(komadaiX, komadaiY, this.komadaiWidth, this.komadaiHeight);
      ctx.translate(this.offsetX + 9 * this.cellSize / 2, this.offsetY + 9 * this.cellSize / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-this.offsetX - 9 * this.cellSize / 2, -this.offsetY - 9 * this.cellSize / 2);
    }

    this.drawKomadaiPieces(komadaiX, komadaiY, this.komadaiPieces.sente, 1);
    this.drawKomadaiPieces(komadaiX, komadaiY, this.komadaiPieces.gote, -1);
  }

  // 駒台の駒を描画
  drawKomadaiPiece(x, y, type, komadai) {
    const img = pieceImages[type];
    const pieceSize = this.cellSize * 0.8;
    const padding = this.cellSize * 0.1;
    let kx = x;
    for (let i = 0; i < komadai[type]; i++) {
      ctx.drawImage(img, kx + (komadai[type] - i - 1) * padding, y, pieceSize, pieceSize);
    }
  }

  drawKomadaiPieces(x, y, komadai, teban) {
    const komadaiOffsetX = x + this.cellSize * 0.1;
    const komadaiOffsetY = y + this.cellSize * 0.1;
    const pieceSize = this.cellSize * 0.8; // 駒のサイズ
    const padding = this.cellSize * 0.1; // 駒間の余白
    ctx.save();
    if (teban === -1) {
      ctx.translate(this.offsetX + 9 * this.cellSize / 2, this.offsetY + 9 * this.cellSize / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-this.offsetX - 9 * this.cellSize / 2, -this.offsetY - 9 * this.cellSize / 2);
    }
    if (komadai['pawn'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX, komadaiOffsetY, 'pawn', komadai);
    }
    if (komadai['lance'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX, komadaiOffsetY + this.cellSize, 'lance', komadai);
    }
    if (komadai['knight'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX + this.cellSize, komadaiOffsetY + this.cellSize, 'knight', komadai);
    }
    if (komadai['silver'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX, komadaiOffsetY + 2 * this.cellSize, 'silver', komadai);
    }
    if (komadai['gold'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX + this.cellSize, komadaiOffsetY + 2 * this.cellSize, 'gold', komadai);
    }
    if (komadai['bishop'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX, komadaiOffsetY + 3 * this.cellSize, 'bishop', komadai);
    }
    if (komadai['rook'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX + this.cellSize, komadaiOffsetY + 3 * this.cellSize, 'rook', komadai);
    }
    if (komadai['king2'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX + this.cellSize * 2, komadaiOffsetY + 3 * this.cellSize, 'king2', komadai);
    }
    if (komadai['king'] > 0) {
      this.drawKomadaiPiece(komadaiOffsetX + this.cellSize * 2, komadaiOffsetY + 2 * this.cellSize, 'king', komadai);
    }

    ctx.restore();
  }

  // 盤面の描画
  draw() {
    ctx.save();

    if (this.teban === -1) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.fillStyle = BOARD_COLOR;
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = LINEWIDTH;



    // 盤面を中央に描画
    ctx.fillRect(this.offsetX, this.offsetY, BOARD_SIZE * this.cellSize, BOARD_SIZE * this.cellSize);

    // 縦線
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
      ctx.lineTo(this.offsetX + i * this.cellSize, this.offsetY + BOARD_SIZE * this.cellSize);
      ctx.stroke();
    }

    // 横線
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
      ctx.lineTo(this.offsetX + BOARD_SIZE * this.cellSize, this.offsetY + i * this.cellSize);
      ctx.stroke();
    }

    // 駒台を描画
    this.drawKomadai();

    if (this.teban === -1) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }
    ctx.restore();

    //ドラッグ中の駒の動きを描画
    if (this.draggingPiece) {
      this.draggingPiece.drawMove(this);
    }

    ctx.save();

    if (this.teban === -1) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // マウスオーバー中のセルをハイライト
    if (this.hoveredCell) {
      ctx.fillStyle = MOUSE_HIGHLIGHT_COLOR; // 半透明の黄色
      ctx.fillRect(
        this.offsetX + this.hoveredCell.x * this.cellSize + LINEWIDTH / 2,
        this.offsetY + this.hoveredCell.y * this.cellSize + LINEWIDTH / 2,
        this.cellSize - LINEWIDTH,
        this.cellSize - LINEWIDTH
      );
    }

    // 駒を描画
    this.pieces.forEach(piece => {
      if (piece !== this.draggingPiece) {
        piece.draw(this);
      }
    });

    ctx.restore();

    // ドラッグ中の駒を描画
    if (this.draggingPiece) {
      this.draggingPiece.drawDragging(this);
    }
  }

  getKomadaiPieceAt(mouseX, mouseY) {
    const komadaiX = this.offsetX + BOARD_SIZE * this.cellSize + this.cellSize * KOMADAI_OFFSET_RATIO;
    const komadaiY = this.offsetY + BOARD_SIZE * this.cellSize - this.komadaiHeight;

    // 持ち駒の種類と位置を定義
    const komadaiPieces = [
      { type: 'pawn', x: komadaiX, y: komadaiY },
      { type: 'lance', x: komadaiX, y: komadaiY + this.cellSize },
      { type: 'knight', x: komadaiX + this.cellSize, y: komadaiY + this.cellSize },
      { type: 'silver', x: komadaiX, y: komadaiY + 2 * this.cellSize },
      { type: 'gold', x: komadaiX + this.cellSize, y: komadaiY + 2 * this.cellSize },
      { type: 'bishop', x: komadaiX, y: komadaiY + 3 * this.cellSize },
      { type: 'rook', x: komadaiX + this.cellSize, y: komadaiY + 3 * this.cellSize },
      { type: 'king2', x: komadaiX + 2 * this.cellSize, y: komadaiY + 3 * this.cellSize },
      { type: 'king', x: komadaiX + 2 * this.cellSize, y: komadaiY + 2 * this.cellSize }
    ];

    // クリック位置がどの駒の範囲内かをチェック
    for (const piece of komadaiPieces) {
      if (this.komadaiPieces[this.teban === 1 ? 'sente' : 'gote'][piece.type] > 0) {
        if (
          mouseX >= piece.x &&
          mouseX <= piece.x + this.cellSize &&
          mouseY >= piece.y &&
          mouseY <= piece.y + this.cellSize
        ) {
          return piece.type; // クリックされた駒の種類を返す
        }
      }
    }

    return null; // クリック位置に駒がない場合はnullを返す
  }

  // マウスの位置から盤面の位置を取得
  getBoardPosition(mouseX, mouseY) {
    const x = Math.floor((mouseX - this.offsetX) / this.cellSize);
    const y = Math.floor((mouseY - this.offsetY) / this.cellSize);
    let resX = 0;
    let resY = 0;

    if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
      resX = 4 + this.teban * (x - 4);
      resY = 4 + this.teban * (y - 4);
      return { x: resX, y: resY };
    }
    return { x: -3, y: -3 };
  }

  onMouseDown(pos) {
    const { x, y } = this.getBoardPosition(pos.x, pos.y);
    if (x == -3 || y == -3) {
      const komadaiPiece = this.getKomadaiPieceAt(pos.x, pos.y);
      if (komadaiPiece) {
        this.draggingPieceX = pos.x;
        this.draggingPieceY = pos.y;
        this.draggingPiece = new Piece(komadaiPiece, -3, -3, this.teban, 0);
        this.komadaiPieces[this.teban === 1 ? 'sente' : 'gote'][komadaiPiece]--;
      }
    };
    // クリックされた駒を探す
    for (let i = 0; i < this.pieces.length; i++) {
      if (this.pieces[i].teban != this.teban) continue;
      if (this.pieces[i].x == x && this.pieces[i].y == y) {
        this.draggingPiece = this.pieces[i];
        this.draggingPieceX = pos.x;
        this.draggingPieceY = pos.y;
        break;
      }
    }
  }

  onMouseMove(pos) {
    if (this.draggingPiece) {
      this.draggingPieceX = pos.x;
      this.draggingPieceY = pos.y;
    }

    const cell = this.getBoardPosition(pos.x, pos.y);
    if (cell.x == -3 && cell.y == -3) {
      this.hoveredCell = null; // 盤面外ならリセット
    } else {
      this.hoveredCell = cell; // マウスオーバー中のセルを更新
    }
  }

  onMouseUp(pos, isRightClick) {
    if (!this.draggingPiece) return;
    const { x, y } = this.getBoardPosition(pos.x, pos.y);

    const returnToKomadai = () => {
      this.komadaiPieces[this.teban === 1 ? 'sente' : 'gote'][this.draggingPiece.type]++;
      this.pieces = this.pieces.filter(p => p !== this.draggingPiece);
      this.draggingPiece = null;
      return;
    };

    if (x === -3 || y === -3) {
      if (this.draggingPiece.x === -3 && this.draggingPiece.y === -3) returnToKomadai();
      this.draggingPiece = null;
      return;
    };

    if (this.draggingPiece.x === -3 && this.draggingPiece.y === -3) {

      if (this.map[x][y]) returnToKomadai();
      if (this.draggingPiece.type === 'pawn' || this.draggingPiece.type === 'lance') {
        if (this.teban === 1 && y === 0 || this.teban === -1 && y === 8) returnToKomadai();
      }
      if (this.draggingPiece.type === 'knight') {
        if (this.teban === 1 && y <= 1 || this.teban === -1 && y >= 7) returnToKomadai();
      }
      //二歩の判定
      if (this.draggingPiece.type === 'pawn') {
        for (let i = 0; i < BOARD_SIZE; i++) {
          if (this.map[x][i] && this.map[x][i].type === 'pawn' && this.map[x][i].teban === this.teban) returnToKomadai();
        }
      }
      socket.emit('putPiece', {
        x: x,
        y: y,
        type: this.draggingPiece.type,
        teban: this.teban,
        roomId: this.roomId
      });
      returnToKomadai();
    } else {
      if (!this.draggingPiece.canMove(x, y, this.teban, this.map)) {
        this.draggingPiece = null;
        return
      };

      // 駒のデータをシリアライズ
      const moveData = {
        x: this.draggingPiece.x,
        y: this.draggingPiece.y,
        nx: x,
        ny: y,
        narazu: isRightClick,
        teban: this.teban,
        roomId: this.roomId
      };

      this.draggingPiece = null;
      socket.emit('movePiece', moveData);
    }
  }

  newPut(data) {
    const { x, y, type, teban, roomId, currentMove: moveNumber } = data;
    if (this.map[x][y]) return;
    if (this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type] <= 0) return;
    //最上段の判定
    if (type === 'pawn' || type === 'lance') {
      if (teban === 1 && y === 0) return;
      if (teban === -1 && y === 8) return;
    }
    if (type === 'knight') {
      if (teban === 1 && y <= 1) return;
      if (teban === -1 && y >= 7) return;
    }
    //二歩の判定
    if (type === 'pawn') {
      for (let i = 0; i < BOARD_SIZE; i++) {
        if (this.map[x][i] && this.map[x][i].type === 'pawn' && this.map[x][i].teban === teban) {
          return;
        }
      }
    }
    this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][type]--;
    this.map[x][y] = new Piece(type, x, y, teban, data.time);
    this.pieces.push(this.map[x][y]);
    this.map[x][y].lastMoveTime = data.time;
    this.currentMove = moveNumber;
    this.map[x][y].lastMovepTime = performance.now();
    playSound('sound');
  }

  newMove(data) {
    const { x, y, nx, ny, narazu, teban, roomId, time: time } = data;
    let piece = null;
    let npiece = null;
    if (this.map[x][y]) {
      piece = this.map[x][y];
    } else {
      return;
    }
    if (piece.teban !== teban) return;
    if (getTimeDiff(piece.lastMoveTime, time)[0] < SERVER_MOVETYME) return;
    if (piece.canMove(nx, ny, teban, this.map, narazu)) {
      if (this.map[nx][ny]) {
        npiece = this.map[nx][ny];
        this.komadaiPieces[teban === 1 ? 'sente' : 'gote'][npiece.getUnPromotedType()]++;
        this.pieces = this.pieces.filter(p => p !== npiece);
        if (npiece.type === 'king' || npiece.type === 'king2') {
          const result = teban === this.teban ? "win" : "lose";
          gameState = result;
          scene = new ResultScene(result);
          // socket.emit('resign', { roomId: roomId, winner: teban });
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
      playSound('sound');
    }
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
}