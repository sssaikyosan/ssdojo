import { Teban } from "../share/type";

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

export const KOMADAI_PIECE_TYPE: (number | null)[] = [1, null, null, 4, 5, 2, 6, 7, 3, 8];
export const PROMOTE_TYPE: number[] = [0, 9, 10, 11, 12, 13, 14, 6, 7, 8, 9, 10, 11, 12, 13];
export const UNPROMOTE_TYPE: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6];

export const TIMER_RADIUS = 0.1;
export const TIMER_LINEWIDTH = 0.1;
export const TIMER_OFFSET_X = 0.2;
export const TIMER_OFFSET_Y = - 0.2;
export const TIMER_BORDER_WIDTH = 0.04;
export const TIMER_BGCOLOR = "rgb(223, 223, 223)";
export const TIMER_COLOR = "rgb(31, 63, 221)";

export const MOVE_COLOR = "#cf8b1e";

export type KifuMove = { x: number, y: number, nx: number, ny: number, narazu: boolean, teban: Teban, servertime: number; };

export const PIECE_MOVES = [
  //なし
  [],
  //歩
  [{ x: 0, y: -1, recursive: false }],
  //飛車
  [{ x: 0, y: -1, recursive: true }, { x: 0, y: 1, recursive: true }, { x: 1, y: 0, recursive: true }, { x: -1, y: 0, recursive: true }],
  //角
  [{ x: 1, y: -1, recursive: true }, { x: -1, y: 1, recursive: true }, { x: 1, y: 1, recursive: true }, { x: -1, y: -1, recursive: true }],
  //香車
  [{ x: 0, y: -1, recursive: true }],
  //桂馬
  [{ x: 1, y: -2, recursive: false }, { x: -1, y: -2, recursive: false }],
  //銀
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 1, recursive: false }, { x: -1, y: 1, recursive: false }],
  //金
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
  //王
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false },
  { x: 1, y: 1, recursive: false }, { x: -1, y: 1, recursive: false }],
  //と
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
  //竜
  [{ x: 0, y: -1, recursive: true }, { x: 0, y: 1, recursive: true }, { x: 1, y: 0, recursive: true }, { x: -1, y: 0, recursive: true },
  { x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 1, y: 1, recursive: false }, { x: -1, y: 1, recursive: false }],
  //馬
  [{ x: 1, y: -1, recursive: true }, { x: -1, y: -1, recursive: true }, { x: 1, y: 1, recursive: true }, { x: -1, y: 1, recursive: true },
  { x: 0, y: -1, recursive: false }, { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
  //成香
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
  //成桂
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
  //成銀
  [{ x: 1, y: -1, recursive: false }, { x: -1, y: -1, recursive: false }, { x: 0, y: -1, recursive: false },
  { x: 1, y: 0, recursive: false }, { x: -1, y: 0, recursive: false }, { x: 0, y: 1, recursive: false }],
];

export const STARTHANDS =
  [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

export const NULLMAP = [
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null]
];

export const STARTMAP = [
  [{ owner: true, type: 1 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 1 }],
  [{ owner: true, type: 2 }, { owner: true, type: 6 }, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, { owner: false, type: 3 }, { owner: false, type: 2 }],
  [{ owner: true, type: 4 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 4 }],
  [{ owner: true, type: 5 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 5 }],
  [{ owner: true, type: 7 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 7 }],
  [{ owner: true, type: 5 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 5 }],
  [{ owner: true, type: 4 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 4 }],
  [{ owner: true, type: 2 }, { owner: true, type: 3 }, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, { owner: false, type: 6 }, { owner: false, type: 2 }],
  [{ owner: true, type: 1 }, null, { owner: true, type: 0 }, null, null, null, { owner: false, type: 0 }, null, { owner: false, type: 1 }],
];

// export const POSITION_SCORE_TABLE =
//   [
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//     [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
//   ];