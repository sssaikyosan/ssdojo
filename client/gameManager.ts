
import { Socket } from "socket.io";
import { Board } from "./board";
import { KOMADAI_PIECE_TYPE, Move } from "./const";
import { CPU } from "./cpu";
import { Emitter } from "./emitter";
import { GameState } from "./main";
import { Piece } from "./piece";
import { PieceType } from "./pieces";
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
  teban: number = 0;
  cpu: CPU | null = null;
  endgame: boolean = false;

  board: Board;
  boardUI: BoardUI;

  draggingPiece: Piece | null = null;
  draggingPiecePos: { x: number, y: number; } | null = null;
  hoveredCell: { x: number, y: number; } | null = null;

  constructor(params: GameManagerParams) {
    this.socket = params.socket;
    this.emitter = params.emitter;

    const board = new Board(params.emitter);
    this.board = board;
    this.boardUI = new BoardUI({ emitter: params.emitter, board: board, x: 0, y: 0, teban: this.teban });
  }


  Init(roomId: string, teban: number, cpu: CPU | null, servertime: number, time: number) {
    // キーを受け取る
    this.emitter.on("keydown", (piecetype: PieceType) => {
      const pos = this.boardUI.hoveredCell;
      if (!pos) return;
      if (!this.board.pieces[this.board.map[pos.x][pos.y]].canMove(-1, KOMADAI_PIECE_TYPE.indexOf(piecetype), false)) return;
      this.sendMovePiece(pos.x, pos.y, -1, KOMADAI_PIECE_TYPE.indexOf(piecetype), false);
    });

    // 指し手を受け取る
    this.emitter.on("movePiece", (data: Move) => {
      console.log(data);
      console.log(this.board.pieces);
      const piece: Piece | undefined = data.x === -1
        ? this.board.pieces.find(piece =>
          piece.x === -1 &&
          piece.y === data.y &&
          piece.teban === data.teban
        )
        : this.board.pieces[this.board.map[data.x][data.y]];
      console.log(piece);
      if (!piece) return;
      if (!piece.canMove(data.nx, data.ny, data.narazu)) return;
      this.sendMovePiece(data.x, data.y, data.nx, data.ny, data.narazu);
    });

    this.gameState = "playing";
    this.roomId = roomId;
    this.teban = teban;
    this.board.init(servertime, time);
    this.boardUI.init(teban);
    this.endgame = false;
    this.cpu = cpu;
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
    } else {
      const move: Move = {
        x: x, y: y,
        nx: nx, ny: ny,
        narazu: narazu,
        teban: this.teban,
        servertime: performance.now(),
      };
      this.board.movePieceLocal(move);
    }
    return true;
  }

  gameEnd() {

  }

  update() {

    if (this.cpu !== null) {
      const time = performance.now();
      this.board.time = time - this.board.serverstarttime;
      this.cpu.update(time);
    } else {
      const time = performance.now();
      this.board.time = time - this.board.starttime;
    }
  }
}
