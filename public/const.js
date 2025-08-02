export const SERVER_MOVETYME = 5;
export const MOVETIME = 5;

export const BOARD_SIZE = 9;
export const LINEWIDTH = 2;
export const CELL_SIZE = 0.09;
export const MOUSE_HIGHLIGHT_COLOR = '#afb61e';
export const BOARD_COLOR = '#af6b1e';
export const LINE_COLOR = '#000000';

export const KOMADAI_OFFSET_RATIO = 0.1;
export const KOMADAI_WIDTH = 0.27;
export const KOMADAI_HEIGHT = 0.36;
export const KOMADAI_PIECE_OFFSET = 0.8;

export const KOMADAI_TIMER_SIZE = 0.09;
export const KOMADAI_TIMER_LINEWITH = 0.8;
export const KOMADAI_TIMER_OFFSET_X = 0.55;
export const KOMADAI_TIMER_OFFSET_Y = 0.24;
export const KOMADAI_TIMER_COLOR = 'rgba(31, 63, 221,0.5)';

export const TIMER_RADIUS = 0.1;
export const TIMER_LINEWIDTH = 0.1;
export const TIMER_OFFSET_X = 0.2;
export const TIMER_OFFSET_Y = - 0.2;
export const TIMER_BORDER_WIDTH = 0.04;
export const TIMER_BGCOLOR = 'rgb(223, 223, 223)';
export const TIMER_COLOR = 'rgb(31, 63, 221)';
export const TIMER_RESERVE_COLOR = 'rgb(155, 155, 155)';

export const ARROW_COLOR = 'rgba(31, 63, 221, 0.4)'

export const MOVE_COLOR = '#cf8b1e'
export const UNPROMODED_TYPES = ['pawn', 'lance', 'knight', 'silver', 'bishop', 'rook'];
export const PIECE_MOVES = {
  pawn: [
    { dx: 0, dy: -1 } // 先手の場合、1マス前
  ],
  prom_pawn: [ // 成り駒（と金）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  lance: [
    { dx: 0, dy: -1, recursive: true } // 先手の場合、前方に無限
  ],
  prom_lance: [ // 成り駒（成香）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  knight: [
    { dx: 1, dy: -2 },
    { dx: -1, dy: -2 }
  ],
  prom_knight: [ // 成り駒（成桂）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  silver: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ],
  prom_silver: [ // 成り駒（成銀）
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  gold: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 }
  ],
  bishop: [
    { dx: 1, dy: -1, recursive: true }, // 右上
    { dx: -1, dy: -1, recursive: true },// 左上
    { dx: 1, dy: 1, recursive: true },  // 右下
    { dx: -1, dy: 1, recursive: true }  // 左下
  ],
  horse: [ // 成り駒（馬）
    { dx: 1, dy: -1, recursive: true }, // 右上
    { dx: -1, dy: -1, recursive: true },// 左上
    { dx: 1, dy: 1, recursive: true },  // 右下
    { dx: -1, dy: 1, recursive: true }, // 左下
    { dx: 0, dy: -1 }, // 上
    { dx: 0, dy: 1 },  // 下
    { dx: 1, dy: 0 },  // 右
    { dx: -1, dy: 0 }  // 左
  ],
  rook: [
    { dx: 0, dy: -1, recursive: true }, // 上
    { dx: 0, dy: 1, recursive: true },  // 下
    { dx: 1, dy: 0, recursive: true },  // 右
    { dx: -1, dy: 0, recursive: true }  // 左
  ],
  dragon: [ // 成り駒（龍）
    { dx: 0, dy: -1, recursive: true }, // 上
    { dx: 0, dy: 1, recursive: true },  // 下
    { dx: 1, dy: 0, recursive: true },  // 右
    { dx: -1, dy: 0, recursive: true }, // 左
    { dx: 1, dy: -1 }, // 右上
    { dx: -1, dy: -1 },// 左上
    { dx: 1, dy: 1 },  // 右下
    { dx: -1, dy: 1 }  // 左下
  ],
  king: [
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ],
  king2: [ // 相手の王将
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 }
  ]
};

export const CHARACTER_FOLDER = "characters25071801"
export const characterInfo = {
  rei: {
    name: "緋月 零",
    romaji: "Hizuki Rei",
    profile: "夜の街を拠点とする、謎に包まれたフリーランスの「解決屋」ある\nいはエージェント。どんな困難な依頼でも、法に触れるか否かを問\nわず、高額な報酬と引き換えに完璧に遂行すると噂される。"
  },
  aoi: {
    name: "水瀬 葵",
    romaji: "Minase Aoi",
    profile: "都内の高校に通う、ごく普通の目立たない女子高生。しかし夜にな\nると、その姿は伝説的な天才ゲーマー兼ホワイトハッカー「サイバ\nー・セレネ」へと変貌する。"
  },
  akira: {
    name: "日輪 晶",
    romaji: "Hinowa Akira",
    profile: "街の片隅で、会員制の隠れ家ジャズバー「Solstice」を経営する若\nき女性オーナー。その裏の顔は、裏社会のあらゆる情報が集まる\n中立の情報屋「オラクル」。"
  }
}

export const CHARA_QUOTES = {
  rei: [
    "…仕事の時間だ。",
    "…依頼内容を確認した。",
    "お前は知りすぎた。",
    "迷いは敗北への第一歩だ。",
    "…無駄な時間は嫌いだ。"
  ],
  aoi: [
    "…よし、いくよ。",
    "…そこ、射線通ってるよ。",
    "敵の構成、読み切った。",
    "はい、お疲れ様でしたー。",
    "…ログイン完了。"
  ],
  akira: [
    "取引成立、かしら？",
    "私のお店では、どうかお静かに。",
    "人は誰でも、何かの駒なのよ。",
    "…面白い話ね。もう少し聞かせて。",

    "情報には価値があるの。"
  ]
}