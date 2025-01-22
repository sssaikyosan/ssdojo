export type HrTime = [number, number];

export type Teban = 1 | -1;

// 駒台から置いた場合 x:-1, y:駒の種類ID
// 取った場合は captype が種類
export interface ServerKifu {
  /** 駒台から置いた場合は `-1` */
  x: number;
  /** 駒台から置いた場合はその駒の種別 (`PieceTypeNormals`のindex) */
  y: number;
  nx: number;
  ny: number;
  narazu: boolean;
  teban: Teban;
  captype: number;  //駒の種類の値
  time: number;
  captime: number;
}


//  これ今書くと長いから後で時間があれば
export type IoEvent =
  | "requestMatch"
  | "putPiece" | "newMove"
  | "movePiece"
  | "leaveRoom"
  | "opponentDisconnected";

