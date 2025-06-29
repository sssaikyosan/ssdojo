// public/game_manager.js
import { BoardUI } from './ui_board.js';
import { audioManager } from './main25062802.js'; // audio_manager.jsからインポート
import { Board } from './board.js';
import { CPU } from './cpu.js'; // CPUクラスをインポート
import { endCPUGame } from './scene_game.js';

export class GameManager {
    socket;
    roomId;
    teban = null;
    cpu = null; // CPUインスタンスを保持するプロパティ

    board;
    boardUI;

    constructor(socket) {
        this.socket = socket;
        const board = new Board();
        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 })
    }

    setRoom(roomId, teban, servertime, cpulevel = null) {
        const now = performance.now();
        this.roomId = roomId;
        this.teban = teban;

        const board = new Board();
        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 });
        this.board.init(servertime, now);
        this.boardUI.init(teban);

        if (cpulevel !== null) {
            console.log("GameManager: CPU対戦を開始します。");
            this.cpu = new CPU(this, cpulevel); // GameManager自身をCPUに渡す
            this.cpu.gameStart(servertime, now);
        }
    }

    setRoomBoard(roomId, board) {
        this.roomId = roomId;
        this.teban = 0;

        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 })
        this.boardUI.init(0);
        this.cpu = null;
    }

    resetRoom() {
        this.roomId = null;
        this.teban = 0;
        if (this.cpu) {
            this.cpu.worker.terminate();
        }
        this.cpu = null;
    }


    receiveMove(move) {
        console.log("GameManager: 手を受信しました", move);
        this.boardUI.lastsend = null;
        const result = this.board.movePieceLocal(move);
        if (result.res) {
            if (this.boardUI.draggingPiece && move.nx === this.boardUI.draggingPiece.x && move.ny === this.boardUI.draggingPiece.y) {
                this.boardUI.draggingPiece = null;
                this.boardUI.draggingPiecePos = null;
            }
            audioManager.playSound("sound");

            const gameEnd = this.board.checkGameEnd(move);

            if (gameEnd.player !== 0 && this.cpu !== null) {
                this.cpu.endGame();
                endCPUGame({ winPlayer: gameEnd.player, text: gameEnd.text });
                this.cpu = null;
            }

            // リアルタイム将棋では手番に関係なく思考が必要になる可能性があるため、
            // プレイヤーの手が適用されたら常にCPUに盤面変化を通知
            if (this.cpu !== null) {
                console.log("GameManager: 盤面が変化しました。CPUに通知します。");
                this.cpu.boardChanged(move); // 盤面情報をワーカーに送信
            }

            return true;
        };
        return false;
    }

    // Web WorkerからCPUの手を受け取るメソッド
    handleCpuMove(move) {
        console.log("GameManager: CPUの手を受信しました", move);
        const serverMove = { ...move, servertime: performance.now() }
        console.log(serverMove);
        const result = this.board.movePieceLocal(serverMove);
        if (result.res) {
            console.log("GameManager: CPUの手を適用しました。");
            audioManager.playSound("sound"); // 効果音
            if ((result.capture.x === this.boardUI.draggingPiece.x) && (result.capture.y === this.boardUI.draggingPiece.y)) {
                this.boardUI.draggingPiece = null;
                this.boardUI.draggingPiecePos = null;
            }
            const gameEnd = this.board.checkGameEnd(move);
            if (gameEnd.player !== 0 && this.cpu !== null) {
                this.cpu.endGame();
                endCPUGame({ winPlayer: gameEnd.player, text: gameEnd.text });
                this.cpu = null;
            }
            this.cpu.boardChanged(move);

        } else {
            console.error("GameManager: CPUの手の適用に失敗しました。", move);
            // エラーハンドリング
        }
    }


    update() {
        const time = performance.now();
        if (!this.board.finished) {
            this.board.time = time;
        }
        if (this.board.matched && !this.board.started && !this.board.finished && this.board.time - this.board.starttime > 5000) {
            this.board.started = true;
            audioManager.playSound('match');
        }

        // GameManagerのupdateからはCPUのupdateを直接呼ばないように変更
        // CPUの思考はWeb Workerで行い、結果はhandleCpuMoveで受け取る
        // if (this.cpu !== null) {
        //     this.cpu.update(time);
        // }
    }
}