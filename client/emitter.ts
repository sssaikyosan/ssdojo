export class Emitter<T = any> {
  events: Map<string, Function[]> = new Map();

  // イベントリスナーの登録
  on(event: string, listener: (data: T) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  // イベントの発火
  emit(event: string, data: T): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(listener => listener(data));
    }
  }

  // イベントリスナーの削除
  off(event: string, listener: (data: T) => void): void {
    if (this.events.has(event)) {
      const listeners = this.events.get(event)!;
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // 一度だけ実行されるリスナー
  once(event: string, listener: (data: T) => void): void {
    const wrapper = (data: T) => {
      listener(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}