const SERVER_MOVETYME = 5;
const MOVETIME = 5000;


const BOARD_SIZE = 9;
const LINEWIDTH = 2;
const CELL_SIZE = 0.09;
const MOUSE_HIGHLIGHT_COLOR = '#afb61e';
const BOARD_COLOR = '#af6b1e';
const LINE_COLOR = '#000000';

const KOMADAI_OFFSET_RATIO = 0.1;
const KOMADAI_WIDTH = 0.27;
const KOMADAI_HEIGHT = 0.36;
const KOMADAI_PIECE_OFFSET = 0.8;

const TIMER_RADIUS = 0.1;
const TIMER_LINEWIDTH = 0.1;
const TIMER_OFFSET_X = 0.2;
const TIMER_OFFSET_Y = - 0.2;
const TIMER_BORDER_WIDTH = 0.04;
const TIMER_BGCOLOR = 'rgb(223, 223, 223)';
const TIMER_COLOR = 'rgb(31, 63, 221)';

const MOVE_COLOR = '#cf8b1e'

const pieceMoves = {
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