// ════════════════════════════════════════════════════════════════
//  types.ts — 定義完整的 TypeScript 型別介面
// ════════════════════════════════════════════════════════════════

export interface Atom {
  t: string;  // 原子符號 (如 'H', 'C', 'O')
  x: number;  // 3D 空間 X 座標
  y: number;  // 3D 空間 Y 座標
  z: number;  // 3D 空間 Z 座標
}

export interface Molecule {
  formula: string;      // 化學式
  name: string;         // 英文名稱
  pg: string;           // 點群標籤
  shape: string;        // 幾何形狀
  angle: string;        // 鍵角資訊
  elements: string;     // 對稱元素列表
  planeNormals: number[][]; // 鏡面法向量群
  atoms: Atom[];        // 原子陣列
  bonds: number[][];    // 鍵結對應索引 (例如 [0, 1] 代表原子 0 與原子 1 相連)
  desc: string;         // 結構推導與解析說明
}

export interface PointGroup {
  pg: string;           // 點群名稱 (如 "C₂ᵥ")
  sym: string;          // 包含的對稱操作 (如 "E, C₂, σv, σv′")
  mols: string[];       // 該點群所擁有的分子 Key 列表
}

export interface Layers {
  cn: boolean;          // 主要旋轉軸 Cₙ 顯示開關
  sigma: boolean;       // 對稱鏡面 σ 顯示開關
  i: boolean;           // 反轉中心 i 顯示開關
}

export interface RenderParams {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentKey: string | null;
  rotX: number;
  rotY: number;
  layers: Layers;
  moleculeData: Record<string, Molecule>;
}