// public/cpu.js
export class CPU {
    worker;
    gameManager;

    constructor(gameManager) {
        this.gameManager = gameManager;
        this.setWorker(); // コンストラクタでワーカーのイベントハンドラを設定
    }

    gameStart(servertime, now) {
        this.worker.postMessage(["gameStart", { servertime: servertime, time: now }]);
    }

    boardChanged(move) {
        console.log("CPU: 盤面が変更されました。ワーカーに通知します。");
        this.worker.postMessage(["move", move]);
    }

    setWorker() {
        this.worker = new Worker(new URL("./worker.js", import.meta.url));
        this.worker.onmessage = (e) => {
            console.log("CPU: メッセージをワーカーから受信しました", e.data);
            // 受信したCPUの手をGameManagerに渡す
            if (this.gameManager && typeof this.gameManager.handleCpuMove === 'function') {
                this.gameManager.handleCpuMove(e.data.move);
            } else {
                console.error("CPU: GameManagerまたはhandleCpuMoveメソッドが見つかりません。");
            }
        };

        this.worker.onerror = (error) => {
            console.error("CPU: Worker error:", error);
        };
    }

    endGame() {
        console.log("CPU: ゲーム終了。ワーカーを停止します。");
        if (this.worker) {
            this.worker.terminate(); // Workerを停止
            this.worker = null; // 参照をクリア
        }
    }
}