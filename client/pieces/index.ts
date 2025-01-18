import { promiser } from "../utils";
import bishop from "./bishop.png";
import dragon from "./dragon.png";
import gold from "./gold.png";
import horse from "./horse.png";
import king from "./king.png";
import king2 from "./king2.png";
import knight from "./knight.png";
import lance from "./lance.png";
import pawn from "./pawn.png";
import prom_knight from "./prom_knight.png";
import prom_lance from "./prom_lance.png";
import prom_pawn from "./prom_pawn.png";
import prom_silver from "./prom_silver.png";
import rook from "./rook.png";
import silver from "./silver.png";

export const PieceFileFiles = {
  bishop,
  dragon,
  gold,
  horse,
  king,
  king2,
  knight,
  lance,
  pawn,
  prom_knight,
  prom_lance,
  prom_pawn,
  prom_silver,
  rook,
  silver,
} as const;

export const PieceTypeNormals = ["pawn", "none", "none", "lance", "knight", "rook", "silver", "gold", "bishop", "king", "king2"] as const;
export type PieceTypeNormal = typeof PieceTypeNormals[number];
export const PieceTypeNaris = ["prom_pawn", "none", "none", "prom_lance", "prom_knight", "dragon", "prom_silver", "none", "horse", "none", "none"] as const;
export type PieceTypeNari = typeof PieceTypeNaris[number];
export const PieceTypes = [...PieceTypeNormals, ...PieceTypeNaris] as const;
export type PieceType = typeof PieceTypes[number];

export let PieceImages: Record<PieceType, HTMLImageElement> = {} as any;

/**
 * ピース画像の初期化を行います
 */
export function PieceImageInit() {
  return PieceTypes.map(piece => {
    const p = promiser();
    const img = new Image();
    if (piece === "none") {
      img.src = PieceFileFiles["king2"];
    } else {
      img.src = PieceFileFiles[piece];
    }
    img.onload = () => {
      PieceImages[piece] = img;
      p.resolve();
    };
    img.onerror = () => {
      console.error(`ピース:${piece} の読み込みに失敗しました. PATH:${img.src}`);
      p.reject();
    };
    return p.promise;
  });
}
