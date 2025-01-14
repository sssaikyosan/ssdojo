export class Keyboard {
  board = null;
  boardUI = null;
  keys = {
    " ": "pawn",
    "q": "lance",
    "w": "knight",
    "a": "silver",
    "s": "gold",
    "e": "rook",
    "d": "bishop",
    "z": "king",
    "x": "king2",
  }

  init(board, boardUI, canvas) {
    this.board = board;
    this.boardUI = boardUI;
    canvas.focus();
    canvas.addEventListener("keydown", (e) => {
      this.onKeyDown(e);
    });
  }

  onKeyDown(e) {
    const piecetype = this.keys[e.key];
    if (piecetype) {
      let pos = this.boardUI.hoveredCell;
      const piece = new Piece(this.board, piecetype, pos.x, pos.y, this.board.teban, this.board.starttime, 0);
      if (pos) {
        this.board.putPieceKey(pos.x, pos.y, piece);
      }
    }
  }
}