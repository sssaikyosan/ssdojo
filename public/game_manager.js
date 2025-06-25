// public/game_manager.js
import { BoardUI } from './ui_board.js';
import { audioManager } from './main25062501.js'; // audio_manager.jsからインポート
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

    setRoom(roomId, teban, servertime, cpu = null) {
        this.roomId = roomId;
        this.teban = teban;

        const board = new Board();
        this.board = board;
        this.boardUI = new BoardUI({ gameManager: this, board: board, x: 0.0, y: 0.0 });
        this.board.init(servertime, performance.now());
        this.boardUI.init(teban);

        if (cpu) {
            console.log("GameManager: CPU対戦を開始します。");
            this.cpu = new CPU(this); // GameManager自身をCPUに渡す

            // ゲーム開始時にCPUが先手の場合、ワーカーに盤面情報を送信して思考を開始
            // リアルタイム将棋では手番の概念が異なるが、ここでは初期配置後の最初の思考トリガーとして使用
            // CPUの手番が1であると仮定
            if (this.teban === 1) {
                console.log("GameManager: CPUが先手です。ゲーム開始時にワーカーに盤面情報を送信します。");
                this.cpu.boardChanged(this.board); // 盤面情報をワーカーに送信
            }

        } else {
            this.cpu = null; // CPU対戦でない場合はnull
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
        if (move.teban === this.teban) {
            this.boardUI.lastsend = null;
        }
        const result = this.board.movePieceLocal(move);
        if (result.res) {
            if (result.capture === this.boardUI.draggingPiece) {
                this.boardUI.draggingPiece = null;
                this.boardUI.draggingPiecePos = null;
            }
            audioManager.playSound("sound");

            const gameEnd = this.board.checkGameEnd(move);

            if (gameEnd.player !== 0) {
                endCPUGame({ winPlayer: gameEnd.player, text: gameEnd.text });
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
        // 受信した手をゲームに適用する
        // receiveMoveと同様のロジックで手を適用できるか確認
        // ただし、CPUの手はサーバーを経由しないため、socket.emitは不要
        const result = this.board.movePieceLocal(move);
        if (result.res) {
            console.log("GameManager: CPUの手を適用しました。");
            // UIの更新など、手が進んだ後の処理をここに追加
            // 例: this.boardUI.updateBoard();
            audioManager.playSound("sound"); // 効果音

            // CPUが手を指した後も、引き続き思考が必要な場合（例：連続王手など）に備え、
            // 再度ワーカーに盤面情報を送信することも検討。
            // ただし、無限ループにならないように注意が必要。
            // ここではシンプルに、CPUの手を適用した後に再度思考を促す処理は追加しない。
            // 必要であれば、worker側で連続思考のロジックを実装するか、
            // GameManager側で一定時間後に再度通知するなどの制御を追加。

        } else {
            console.error("GameManager: CPUの手の適用に失敗しました。", move);
            // エラーハンドリング
        }
    }


    update() {
        const time = performance.now();
        this.board.time = time;
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