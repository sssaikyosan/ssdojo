export const MOVETIME = 5000;


export const BOARD_SIZE = 9;
export const LINEWIDTH = 2;
export const CELL_SIZE = 0.09;
export const MOUSE_HIGHLIGHT_COLOR = "#afb61e";
export const BOARD_COLOR = "#af6b1e";
export const LINE_COLOR = "#000000";

export const KOMADAI_OFFSET_RATIO = 0.1;
export const KOMADAI_WIDTH = 0.27;
export const KOMADAI_HEIGHT = 0.36;
export const KOMADAI_PIECE_OFFSET = 0.8;

export const TIMER_RADIUS = 0.1;
export const TIMER_LINEWIDTH = 0.1;
export const TIMER_OFFSET_X = 0.2;
export const TIMER_OFFSET_Y = - 0.2;
export const TIMER_BORDER_WIDTH = 0.04;
export const TIMER_BGCOLOR = "rgb(223, 223, 223)";
export const TIMER_COLOR = "rgb(31, 63, 221)";

export const MOVE_COLOR = "#cf8b1e";

export const KOMADAI_PIECE_TYPE = ["pawn", "lance", "knight", "silver", "gold", "bishop", "rook", "king", "king2"];

export const pieceMoves = {
  pawn: [
    { dx: 0, dy: -1, recursive: false } // 先手の場合、1マス前
  ],
  prom_pawn: [ // 成り駒（と金）
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false }
  ],
  lance: [
    { dx: 0, dy: -1, recursive: true } // 先手の場合、前方に無限
  ],
  prom_lance: [ // 成り駒（成香）
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false }
  ],
  knight: [
    { dx: 1, dy: -2, recursive: false },
    { dx: -1, dy: -2, recursive: false }
  ],
  prom_knight: [ // 成り駒（成桂）
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false }
  ],
  silver: [
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 1, recursive: false },
    { dx: -1, dy: 1, recursive: false }
  ],
  prom_silver: [ // 成り駒（成銀）
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false }
  ],
  gold: [
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false }
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
    { dx: 0, dy: -1, recursive: false }, // 上
    { dx: 0, dy: 1, recursive: false },  // 下
    { dx: 1, dy: 0, recursive: false },  // 右
    { dx: -1, dy: 0, recursive: false }  // 左
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
    { dx: 1, dy: -1, recursive: false }, // 右上
    { dx: -1, dy: -1, recursive: false },// 左上
    { dx: 1, dy: 1, recursive: false },  // 右下
    { dx: -1, dy: 1, recursive: false }  // 左下
  ],
  king: [
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false },
    { dx: 1, dy: 1, recursive: false },
    { dx: -1, dy: 1, recursive: false }
  ],
  king2: [ // 相手の王将
    { dx: 1, dy: -1, recursive: false },
    { dx: -1, dy: -1, recursive: false },
    { dx: 0, dy: -1, recursive: false },
    { dx: 1, dy: 0, recursive: false },
    { dx: -1, dy: 0, recursive: false },
    { dx: 0, dy: 1, recursive: false },
    { dx: 1, dy: 1, recursive: false },
    { dx: -1, dy: 1, recursive: false }
  ],
  none: []
} as const;


export type Move = { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: number, servertime: number; };