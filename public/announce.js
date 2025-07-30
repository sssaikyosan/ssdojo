/**
 * 横に流れるアナウンステキストUIを管理するクラス
 */
class AnnounceText {
    constructor(container, text = '', speed = 1) {
        this.container = container;
        this.text = text;
        this.speed = speed; // ピクセル/フレーム
        this.position = container.clientWidth;

        // スタイル設定
        this.element = document.createElement('div');
        this.setupStyle();
        this.updateText(text);
        container.appendChild(this.element);
    }

    setupStyle() {
        Object.assign(this.element.style, {
            position: 'absolute',
            whiteSpace: 'nowrap',
            font: getComputedStyle(this.container).font,
            color: '#fff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            pointerEvents: 'none'
        });
    }

    updateText(text) {
        this.text = text;
        this.element.textContent = text;
        // コンテナ外に初期位置を設定
        this.position = this.container.clientWidth;
    }

    update() {
        // 位置を更新
        this.position -= this.speed;

        // 左端まで来たら右端に戻す
        if (this.position + this.element.clientWidth < 0) {
            this.position = this.container.clientWidth;
        }

        this.element.style.transform = `translateX(${this.position}px)`;
    }

    show() {
        this.element.style.display = 'block';
    }

    hide() {
        this.element.style.display = 'none';
    }
}

// グローバルスコープに公開
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.AnnounceText = AnnounceText;
}

// モジュールとして扱うためのダミーexport
export { };