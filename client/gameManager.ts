
import { Socket } from "socket.io";
import { Board } from "./board";
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
  cpu: number = -1;

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


  Init(roomId: string, teban: number, cpu: number, servertime: number, time: number) {
    //イベントを受け取る
    this.emitter.on("keydown", (piecetype: PieceType) => {
      console.log(piecetype);
      const pos = this.boardUI.hoveredCell;
      if (!pos) return;
      if (!this.board.canPutPiece(pos.x, pos.y, piecetype, this.teban)) return;
      this.sendPutPiece(pos.x, pos.y, piecetype);
    });

    this.emitter.on("movePiece", (data: { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number; }) => {
      if (!this.board.canMovePiece(data.x, data.y, data.nx, data.ny, data.narazu, this.teban)) return;
      this.sendMovePiece(data.x, data.y, data.nx, data.ny, data.narazu);
    });

    this.emitter.on("putPiece", (data: { nx: number, ny: number, type: PieceType, teban: number, servertime: number; }) => {
      if (!this.board.canPutPiece(data.nx, data.ny, data.type, data.teban)) return;
      this.sendPutPiece(data.nx, data.ny, data.type);
    });

    this.gameState = "playing";
    this.roomId = roomId;
    this.teban = teban;
    this.cpu = cpu;
    this.board.init(servertime, time);
    this.boardUI.init(teban);
  }

  canSendPiece(nx: number, ny: number) {
    if (this.board.kifu.length > 0 &&
      this.board.kifu.at(-1)?.teban === this.teban &&
      this.board.kifu.at(-1)?.nx === nx &&
      this.board.kifu.at(-1)?.ny === ny) return false;
    return true;
  }

  sendMovePiece(x: number, y: number, nx: number, ny: number, narazu: boolean) {
    if (this.cpu === -1) {
      if (!this.canSendPiece(nx, ny)) return false;
      this.socket.emit("movePiece", {
        x: x, y: y,
        nx: nx, ny: ny,
        narazu: narazu,
        teban: this.teban,
        roomId: this.roomId,
      });
    } else {
      this.board.movePieceLocal(x, y, nx, ny, narazu, this.teban, performance.now());
    }
    return true;
  }

  sendPutPiece(nx: number, ny: number, type: PieceType) {
    if (this.cpu === -1) {
      if (!this.canSendPiece(nx, ny)) return false;
      this.socket.emit("putPiece", {
        nx: nx, ny: ny,
        type: type,
        teban: this.teban,
        roomId: this.roomId,
      });
    } else {
      this.board.putPieceLocal(nx, ny, type, this.teban, performance.now());
    }
    return true;
  }

  update() {
    this.board.time = performance.now();
  }
};
