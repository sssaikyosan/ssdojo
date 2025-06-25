// public/cpu.js
export class CPU {
    worker = new Worker(new URL("./worker.js", import.meta.url));
    gameManager;

    constructor(gameManager) {
        this.gameManager = gameManager;
        this.setWorker(); // コンストラクタでワーカーのイベントハンドラを設定
    }

    gameStart(board) {
        this.worker.postMessage(board);
    }

    boardChanged(board) {
        console.log("CPU: 盤面が変更されました。ワーカーに通知します。");
        this.worker.postMessage(board);
    }

    setWorker() {
        this.worker.onmessage = (e) => {
            console.log("CPU: メッセージをワーカーから受信しました", e.data);
            // 受信したCPUの手をGameManagerに渡す
            if (this.gameManager && typeof this.gameManager.handleCpuMove === 'function') {
                this.gameManager.handleCpuMove(e.data);
            } else {
                console.error("CPU: GameManagerまたはhandleCpuMoveメソッドが見つかりません。");
            }
        };

        this.worker.onerror = (error) => {
            console.error("CPU: Worker error:", error);
        };
    }
}