import { BoardUI } from './ui_board.js';
import { audioManager } from './main25062103.js'; // audio_manager.jsからインポート
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
            audioManager.playSound("sound");
            return true;
        };
        return false;
    }

    update() {
        const time = performance.now();
        this.board.time = time;
        if (this.board.matched && !this.board.started && this.board.time - this.board.starttime > 5000) {
            this.board.started = true;
            audioManager.playSound('match');
        }

        if (this.cpu !== null) {
            this.cpu.update(time);
        }
    }
}