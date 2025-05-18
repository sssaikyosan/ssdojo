import { Socket } from "socket.io";
import { Teban } from "../share/type";
import { Board } from "./board";
import { KifuMove } from "./const";
import { CPU } from "./cpu";
import { Emitter } from "./emitter";
import { GameState } from "./main";
import { Piece } from "./piece";
import { playSound } from "./sounds";
import { BoardUI } from "./ui_board";

export interface GameManagerParams {
  socket: Socket;
  emitter: Emitter;
}

export class GameManager {
  gameState: GameState = "title";
  socket: Socket;
  emitter: Emitter;
  roomId: string = "";
  teban: Teban = null!;     // TODO: 後で考える
  cpu: CPU | null = null;
  endgame: boolean = false;

  board: Board;
  boardUI: BoardUI;

  constructor(params: GameManagerParams) {
    this.socket = params.socket;
    this.emitter = params.emitter;

    const board = new Board(params.emitter);
    this.board = board;
    this.boardUI = new BoardUI({ emitter: params.emitter, board: board, x: 0, y: 0, teban: this.teban });
  }


  init(roomId: string, teban: Teban, servertime: number, time: number) {
    // キーを受け取る
    this.emitter.on("keydown", (piecetype: number) => {
      const pos = this.boardUI.hoveredCell;
      if (!pos) return false;
      const piece = this.board.pieces.find(piece => piece.x === -1 && piece.y === piecetype && piece.teban === this.teban);
      if (!piece) return false;
      if (!piece.canMove(this.board, pos.x, pos.y, false)) return false;
      this.sendMovePiece(-1, piecetype, pos.x, pos.y, false);
      return true;
    });

    // 指し手を受け取る
    this.emitter.on("movePiece", (data: KifuMove) => {
      const piece: Piece | undefined = data.x === -1
        ? this.board.pieces.find(piece =>
          piece.x === -1 &&
          piece.y === data.y &&
          piece.teban === data.teban
        )
        : this.board.pieces[this.board.map[data.x][data.y]];
      if (!piece) return;
      if (!piece.canMove(this.board, data.nx, data.ny, data.narazu)) return;
      this.sendMovePiece(data.x, data.y, data.nx, data.ny, data.narazu);
    });

    this.gameState = "playing";
    this.roomId = roomId;
    this.teban = teban;
    // TODO: 初期化は new するほうが良い
    this.board.init(servertime, time);
    this.boardUI.init(teban);
    this.endgame = false;
  }

  initFromCpu(roomId: string, teban: Teban) {
    const time = performance.now();
    this.init(roomId, teban, time, time);
    this.cpu = new CPU(this.board);
  }

  canSendPiece(nx: number, ny: number) {
    if (this.board.kifu.length > 0 &&
      this.board.kifu.at(-1)?.teban === this.teban &&
      this.board.kifu.at(-1)?.nx === nx &&
      this.board.kifu.at(-1)?.ny === ny) return false;
    return true;
  }

  sendMovePiece(x: number, y: number, nx: number, ny: number, narazu: boolean) {
    if (this.cpu === null) {
      if (!this.canSendPiece(nx, ny)) return false;
      this.socket.emit("movePiece", {
        x: x, y: y,
        nx: nx, ny: ny,
        narazu: narazu,
        teban: this.teban,
        roomId: this.roomId,
      });
      return true;
    }
    const move: KifuMove = {
      x: x, y: y,
      nx: nx, ny: ny,
      narazu: narazu,
      teban: this.teban,
      servertime: performance.now(),
    };
    this.receiveMove(move);
    return true;
  }

  receiveMove(move: KifuMove) {
    const result = this.board.movePieceLocal(move);
    if (result[0]) {
      if (result[1] === this.boardUI.draggingPiece) {
        this.boardUI.draggingPiece = null;
        this.boardUI.draggingPiecePos = null;
      }
      playSound("sound");
      return true;
    };
    return false;
  }

  gameEnd() {

  }

  update() {
    const time = performance.now();
    this.board.time = time;

    if (this.cpu !== null) {
      this.cpu.update(time);
    }
  }
}
