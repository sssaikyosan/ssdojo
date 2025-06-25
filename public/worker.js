// public/worker.js

onmessage = function (e) {
    console.log("Worker: メインスレッドからメッセージを受信しました", e.data);
    //postMessage(result); // メインスレッドに結果を送信
};

console.log("Worker: worker.js が起動しました");