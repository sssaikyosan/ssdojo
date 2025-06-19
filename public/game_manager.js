import { BoardUI } from './ui_board.js';
import { playSound } from './utils.js';
import { Board } from './board.js';

export class GameManager {
    socket;
    roomId;
    teban = null;
    cpu = null;

    board;
    boardUI;

    constructor(socket) {
        this.socket = socket;
        const board = new Board();
        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 })
    }

    setRoom(roomId, teban, servertime) {
        this.roomId = roomId;
        this.teban = teban;

        const board = new Board();
        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 })
        this.board.init(servertime, performance.now());
        this.boardUI.init(teban);
    }

    resetRoom() {
        this.roomId = null;
        this.teban = 0;
    }



    receiveMove(move) {
        const result = this.board.movePieceLocal(move);
        if (result.res) {
            if (result.capture === this.boardUI.draggingPiece) {
                this.boardUI.draggingPiece = null;
                this.boardUI.draggingPiecePos = null;
            }
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