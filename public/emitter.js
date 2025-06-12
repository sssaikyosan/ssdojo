export class Emitter {
    events = new Map();

    // イベントリスナーの登録
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(listener);
    }

    // イベントの発火
    emit(event, data) {
        console.log('emitted', data);
        if (this.events.has(event)) {
            this.events.get(event).forEach(listener => listener(data));
        }
    }

    // イベントリスナーの削除
    off(event, listener) {
        if (this.events.has(event)) {
            const listeners = this.events.get(event);
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    // 一度だけ実行されるリスナー
    once(event, listener) {
        const wrapper = (data) => {
            listener(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
}