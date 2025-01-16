import { Emitter } from "./emitter";
import { PieceType } from "./pieces";

export class Keyboard {
  emitter: Emitter;
  keys: { [key: string]: PieceType; } = {
    " ": "pawn",
    "q": "lance",
    "w": "knight",
    "a": "silver",
    "s": "gold",
    "e": "rook",
    "d": "bishop",
    "z": "king",
    "x": "king2",
  };

  constructor(emitter: Emitter) {
    this.emitter = emitter;
  }

  Init(canvas: HTMLCanvasElement) {
    canvas.focus();
    canvas.addEventListener("keydown", (e) => {
      this.onKeyDown(e);
    });
  }

  setKeybind(keys: { [key: string]: PieceType; }) {
    this.keys = keys;
    localStorage.setItem("keybind", JSON.stringify(keys));
  }

  onKeyDown(e: KeyboardEvent) {
    const piecetype: PieceType | undefined = this.keys[e.key];
    if (piecetype) this.emitter.emit("keydown", piecetype);
  }
}