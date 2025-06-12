export class Keyboard {
  emitter;
  keys = {
    ' ': 'pawn',
    'q': 'lance',
    'w': 'knight',
    'a': 'silver',
    's': 'gold',
    'e': 'rook',
    'd': 'bishop',
    'z': 'king',
    'x': 'king2',
  }

  constructor(emitter) {
    this.emitter = emitter;
  }

  init(canvas) {
    canvas.focus();
    canvas.addEventListener('keydown', (e) => {
      this.onKeyDown(e);
    });
  }

  onKeyDown(e) {
    const piecetype = this.keys[e.key];
    if (piecetype) this.emitter.emit("keydown", piecetype);
  }
}