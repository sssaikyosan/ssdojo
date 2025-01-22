import { Emitter } from "./emitter";
export class Keyboard {
  emitter: Emitter;
  keys: { [key: string]: number; } = {
    " ": 1,  // pawn
    "q": 4,  // lance
    "w": 5,  // knight
    "e": 2,  // rook
    "a": 6,  // silver
    "s": 7,  // gold
    "d": 3,  // bishop
    "z": 8,  // king
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

  setKeybind(keys: { [key: string]: number; }) {
    this.keys = keys;
    localStorage.setItem("keybind", JSON.stringify(keys));
  }

  onKeyDown(e: KeyboardEvent) {
    console.log("keydown", e.key);
    const piecetype: number | undefined = this.keys[e.key];
    if (piecetype) this.emitter.emit("keydown", piecetype);
  }
}