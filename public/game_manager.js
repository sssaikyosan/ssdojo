import { BoardUI } from './ui_board.js';
import { Emitter } from './emitter.js';
import { playSound } from './utils.js';
import { Board } from './board.js';

export class GameManager {
    socket;
    emitter;
    roomId;
    teban = null;
    cpu = null;
    endgame = false;

    board;
    bortdUI;

    constructor(socket, emitter) {
        this.socket = socket;
        this.emitter = emitter;
        const board = new Board(emitter);
        this.board = board;
        this.boardUI = new BoardUI({ emitter: emitter, board: board, x: 0.0, y: 0.0 })
    }

    init(roomId, teban, servertime) {
        this.emitter.on("keydown", (piecetype) => {
            const pos = this.boardUI.hoveredCell;
            if (!pos) return false;
            if (!this.board.canPut(pos.x, pos.y, piecetype, this.teban)) return false;
            this.sendPutPiece(pos.x, pos.y, piecetype);
            return true;
        });

        this.emitter.on("movePiece", (data) => {
            if (!this.board.canMove(data.x, data.y, data.nx, data.ny, data.nari, this.teban)) return;
            this.sendMovePiece(data.x, data.y, data.nx, data.ny, data.nari);
        });

        this.emitter.on("putPiece", (data) => {
            if (!this.board.canPut(data.nx, data.ny, data.type, this.teban)) return;
            this.sendPutPiece(data.nx, data.ny, data.type);
        });

        this.roomId = roomId;
        this.teban = teban;

        this.board.init(servertime, performance.now());
        this.boardUI.init(teban);
        this.endgame = false;
    }

    sendPutPiece(nx, ny, type) {
        if (this.cpu === null) {
            this.socket.emit("putPiece", {
                nx: nx,
                ny: ny,
                type: type,
                teban: this.teban,
                roomId: this.roomId,
            });
            return true;
        }
        const put = {
            nx: nx,
            ny: ny,
            type: type,
            teban: this.teban,
            servertime: performance.now(),
        };
        this.receivePut(put);
        return true;
    }

    sendMovePiece(x, y, nx, ny, nari) {
        if (this.cpu === null) {
            this.socket.emit("movePiece", {
                x: x, y: y,
                nx: nx, ny: ny,
                nari: nari,
                teban: this.teban,
                roomId: this.roomId,
            });
            return true;
        }
        const move = {
            x: x,
            y: y,
            nx: nx,
            ny: ny,
            nari: nari,
            teban: this.teban,
            servertime: performance.now(),
        };
        this.receiveMove(move);
        return true;
    }

    receiveMove(move) {
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

    receivePut(put) {
        const result = this.board.putPieceLocal(put);
        if (result) {
            playSound("sound");
            return true;
        };
        return false;
    }

    update() {
        const time = performance.now();
        this.board.time = time;

        if (this.cpu !== null) {
            this.cpu.update(time);
        }
    }

}