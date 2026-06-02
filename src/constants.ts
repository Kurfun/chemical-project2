// ════════════════════════════════════════════════════════════════
//  constants.ts — 分子座標、點群以及 CPK 化學常數資料庫
// ════════════════════════════════════════════════════════════════

import type { PointGroup, Molecule } from './types2';

export const POINT_GROUPS: PointGroup[] = [
  { pg: "C₁",  sym: "E",                        mols: ["CHFClBr"] },
  { pg: "Cᵢ",  sym: "E, i",                     mols: ["trans-1,2-C₂H₄Cl₂", "meso-tartaric acid"] },
  { pg: "Cₛ",  sym: "E, σ",                     mols: ["SOCl₂", "CHFCl₂"] },
  { pg: "C₂",  sym: "E, C₂",                    mols: ["H₂O₂ (skewed)"] },
  { pg: "C₂ᵥ", sym: "E, C₂, σv, σv′",           mols: ["H₂O", "SO₂", "NH₂Cl"] },
  { pg: "C₃ᵥ", sym: "E, 2C₃, 3σv",              mols: ["NH₃", "PCl₃", "CHCl₃"] },
  { pg: "C₂ₕ", sym: "E, C₂, i, σh",             mols: ["trans-2-butene", "trans-N₂H₂"] },
  { pg: "D₂ₕ", sym: "E, 3C₂, 3σ, i",            mols: ["C₂H₄", "N₂O₄", "naphthalene"] },
  { pg: "D₃ₕ", sym: "E, 2C₃, 3C₂, σh, 2S₃, 3σv", mols: ["BF₃", "SO₃", "PCl₅"] },
  { pg: "D₄ₕ", sym: "E, 2C₄, C₂, …, i, σh",    mols: ["XeF₄", "[PtCl₄]²⁻"] },
  { pg: "D₆ₕ", sym: "E, 2C₆, 2C₃, C₂, …, σh",  mols: ["C₆H₆", "coronene"] },
  { pg: "D₃d", sym: "E, 2C₃, 3C₂, i, 2S₆, 3σd", mols: ["C₂H₆ (staggered)", "cyclohexane (chair)"] },
  { pg: "D₄d", sym: "E, 2S₈, 2C₄, …, 4C₂, 4σd", mols: ["S₈"] },
  { pg: "Tᵈ",  sym: "E, 8C₃, 3C₂, 6S₄, 6σd",   mols: ["CH₄", "SiF₄", "CCl₄"] },
  { pg: "Oₕ",  sym: "E, 8C₃, 6C₂, 6C₄, …, i",  mols: ["SF₆", "[Fe(CN)₆]³⁻", "UF₆"] },
  { pg: "D∞ₕ", sym: "E, 2C∞, ∞C₂, i, 2S∞, ∞σv", mols: ["CO₂", "N₂", "C₂H₂"] },
  { pg: "C∞ᵥ", sym: "E, 2C∞, ∞σv",              mols: ["HCl", "CO", "HCN"] },
];

export const MOLECULE_DATA: Record<string, Molecule> = {
  // ── C₁ ──────────────────────────────────────────────────────
  "CHFClBr": {
    formula: "CHFClBr", name: "Bromochlorofluoromethane", pg: "C₁",
    shape: "不對稱四面體", angle: "~109.5°", elements: "E", planeNormals: [],
    desc: "中心碳原子連接四個完全不同的取代基（H, F, Cl, Br），分子缺乏任何旋轉對稱軸與對稱面，為典型手性分子，僅具有恆等操作 E。",
    atoms: [
      { t: 'C',  x: 0,    y: 0,     z: 0 },
      { t: 'H',  x: 0,    y: 0.95,  z: 0 },
      { t: 'F',  x: 0.75, y: -0.3,  z: 0.55 },
      { t: 'Cl', x: -0.85,y: -0.35, z: 0.45 },
      { t: 'Br', x: 0.1,  y: -0.3,  z: -0.95 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  // ── Cᵢ ──────────────────────────────────────────────────────
  "trans-1,2-C₂H₄Cl₂": {
    formula: "trans-C₂H₄Cl₂", name: "trans-1,2-Dichloroethane", pg: "Cᵢ",
    shape: "反疊式構造", angle: "~109.5°", elements: "E, i", planeNormals: [],
    desc: "在反疊式構型中，兩個氯原子、兩個碳原子、四個氫原子以 C-C 鍵中點為中心對稱分佈。分子唯一的對稱元素為位於 C-C 中點的反轉中心 i。",
    atoms: [
      { t: 'C',  x: -0.55, y: 0,    z: 0 },
      { t: 'C',  x:  0.55, y: 0,    z: 0 },
      { t: 'Cl', x: -1.1,  y: 1.1,  z: -0.3 },
      { t: 'Cl', x:  1.1,  y: -1.1, z:  0.3 },
      { t: 'H',  x: -0.9,  y: -0.6, z: -0.6 },
      { t: 'H',  x:  0.9,  y:  0.6, z:  0.6 },
      { t: 'H',  x: -0.7,  y: -0.3, z:  0.8 },
      { t: 'H',  x:  0.7,  y:  0.3, z: -0.8 },
    ],
    bonds: [[0,1],[0,2],[1,3],[0,4],[1,5],[0,6],[1,7]],
  },

  "meso-tartaric acid": {
    formula: "meso-C₄H₆O₆", name: "meso-Tartaric Acid", pg: "Cᵢ",
    shape: "內消旋對稱", angle: "混合", elements: "E, i", planeNormals: [],
    desc: "內消旋酒石酸在特定構象下，分子的上半部與下半部各基團呈相反方向排列，使得整分子僅存在一個位於物理中心的對稱中心 i。",
    atoms: [
      { t: 'C', x: -0.5, y:  0.4, z:  0 },
      { t: 'C', x:  0.5, y: -0.4, z:  0 },
      { t: 'C', x: -1.2, y:  0.8, z:  1.2 },
      { t: 'C', x:  1.2, y: -0.8, z: -1.2 },
      { t: 'O', x: -0.8, y:  1.2, z: -0.8 },
      { t: 'O', x:  0.8, y: -1.2, z:  0.8 },
      { t: 'H', x: -0.2, y: -0.4, z:  0.6 },
      { t: 'H', x:  0.2, y:  0.4, z: -0.6 },
    ],
    bonds: [[0,1],[0,2],[1,3],[0,4],[1,5],[0,6],[1,7]],
  },

  // ── Cₛ ──────────────────────────────────────────────────────
  "SOCl₂": {
    formula: "SOCl₂", name: "Thionyl Chloride", pg: "Cₛ",
    shape: "三角錐形", angle: "~108°", elements: "E, σ", planeNormals: [[1, 0, 0]],
    desc: "中心硫原子含一對孤對電子，SOCl₂ 呈類三角錐。唯一的對稱元素為通過 S=O 鍵並平分 Cl-S-Cl 夾角的垂直鏡面 σ。",
    atoms: [
      { t: 'S',  x:  0,    y:  0.1, z: 0 },
      { t: 'O',  x:  0,    y:  1.0, z: 0 },
      { t: 'Cl', x: -0.85, y: -0.4, z: 0.45 },
      { t: 'Cl', x:  0.85, y: -0.4, z: 0.45 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  "CHFCl₂": {
    formula: "CHFCl₂", name: "Dichlorofluoromethane", pg: "Cₛ",
    shape: "不規則四面體", angle: "~109.5°", elements: "E, σ", planeNormals: [[0, 0, 1]],
    desc: "分子結構中擁有兩個相同的氯原子。唯一的鏡面對稱面通過 C-H、C-F 鍵，並將兩個 Cl 原子鏡像對稱。",
    atoms: [
      { t: 'C',  x:  0,    y:  0.1, z:  0 },
      { t: 'H',  x:  0,    y:  1.0, z:  0 },
      { t: 'F',  x:  0.85, y: -0.4, z:  0 },
      { t: 'Cl', x: -0.65, y: -0.4, z:  0.85 },
      { t: 'Cl', x: -0.65, y: -0.4, z: -0.85 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  // ── C₂ ──────────────────────────────────────────────────────
  "H₂O₂ (skewed)": {
    formula: "H₂O₂", name: "Hydrogen Peroxide", pg: "C₂",
    shape: "偏轉扭曲型", angle: "O-O-H ~94.8°", elements: "E, C₂", planeNormals: [],
    desc: "過氧化氫分子呈雙面夾角構型 (skewed)。垂直於 O-O 鍵中點有一條唯一的 C₂ 旋轉對稱軸，無任何對稱鏡面。",
    atoms: [
      { t: 'O', x: -0.5, y:  0,     z:  0.15 },
      { t: 'O', x:  0.5, y:  0,     z: -0.15 },
      { t: 'H', x: -0.85,y:  0.75,  z: -0.3 },
      { t: 'H', x:  0.85,y: -0.75,  z:  0.3 },
    ],
    bonds: [[0,1],[0,2],[1,3]],
  },

  // ── C₂ᵥ ─────────────────────────────────────────────────────
  "H₂O": {
    formula: "H₂O", name: "Water (Bent)", pg: "C₂ᵥ",
    shape: "V形", angle: "104.5°",
    elements: "E, C₂, σv(xz), σv(yz)", planeNormals: [[1, 0, 0], [0, 0, 1]],
    desc: "中心 O 原子有 2 孤對電子，使鍵角壓縮至 104.5°。具備一條 C₂ 軸與兩個通過該軸的垂直鏡面。",
    atoms: [
      { t: 'O', x:  0,    y:  0.12, z: 0 },
      { t: 'H', x: -0.78, y: -0.47, z: 0 },
      { t: 'H', x:  0.78, y: -0.47, z: 0 },
    ],
    bonds: [[0,1],[0,2]],
  },

  "SO₂": {
    formula: "SO₂", name: "Sulfur Dioxide (Bent)", pg: "C₂ᵥ",
    shape: "V形", angle: "119.5°",
    elements: "E, C₂, σv, σv′", planeNormals: [[1, 0, 0], [0, 0, 1]],
    desc: "S=O 雙鍵加上孤對電子，形成 V 形結構。C₂ 軸通過 S 原子，兩個鏡面分別為分子平面及平分鍵角的面。",
    atoms: [
      { t: 'S', x:  0,    y:  0.1,  z: 0 },
      { t: 'O', x: -0.85, y: -0.45, z: 0 },
      { t: 'O', x:  0.85, y: -0.45, z: 0 },
    ],
    bonds: [[0,1],[0,2]],
  },

  "NH₂Cl": {
    formula: "NH₂Cl", name: "Chloramine", pg: "C₂ᵥ",
    shape: "扭曲三角錐形", angle: "~102°",
    elements: "E, C₂, σv, σv′", planeNormals: [[1, 0, 0]],
    desc: "氯胺結構為不對稱三角錐。其主軸為 C₂，擁有一個垂直於 H-N-H 面的垂直鏡面，對稱性較 NH₃ 略低。",
    atoms: [
      { t: 'N',  x:  0,    y:  0.1,  z: 0 },
      { t: 'Cl', x:  0,    y:  0.95, z: 0 },
      { t: 'H',  x: -0.65, y: -0.5,  z: 0.45 },
      { t: 'H',  x:  0.65, y: -0.5,  z: 0.45 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  // ── C₃ᵥ ─────────────────────────────────────────────────────
  "NH₃": {
    formula: "NH₃", name: "Ammonia (Trigonal Pyramidal)", pg: "C₃ᵥ",
    shape: "三角錐形", angle: "106.7°",
    elements: "E, 2C₃, 3σv",
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "N 原子頂端 1 孤對電子，三個 N-H 鍵形成三角錐。C₃ 軸通過 N 與錐底三角形中心，三個 σv 各含一條 N-H 鍵。",
    atoms: [
      { t: 'N', x:  0,    y:  0.2,  z:  0 },
      { t: 'H', x:  0,    y: -0.3,  z:  0.8 },
      { t: 'H', x:  0.69, y: -0.3,  z: -0.4 },
      { t: 'H', x: -0.69, y: -0.3,  z: -0.4 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  "PCl₃": {
    formula: "PCl₃", name: "Phosphorus Trichloride", pg: "C₃ᵥ",
    shape: "三角錐形", angle: "100°",
    elements: "E, 2C₃, 3σv",
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "與 NH₃ 等電子結構，P 原子頂端孤對電子，三個 P-Cl 鍵形成較寬底部三角錐。",
    atoms: [
      { t: 'P',  x:  0,    y:  0.2,  z:  0 },
      { t: 'Cl', x:  0,    y: -0.3,  z:  0.85 },
      { t: 'Cl', x:  0.74, y: -0.3,  z: -0.42 },
      { t: 'Cl', x: -0.74, y: -0.3,  z: -0.42 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  "CHCl₃": {
    formula: "CHCl₃", name: "Chloroform", pg: "C₃ᵥ",
    shape: "三角錐形", angle: "108°",
    elements: "E, 2C₃, 3σv",
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "C 原子頂端有一個 H，底部三個 Cl 等距排列。C₃ 軸通過 H-C 鍵，三個 σv 各含一個 Cl 原子。",
    atoms: [
      { t: 'C',  x:  0,    y:  0.15, z:  0 },
      { t: 'H',  x:  0,    y:  0.95, z:  0 },
      { t: 'Cl', x:  0,    y: -0.35, z:  0.88 },
      { t: 'Cl', x:  0.76, y: -0.35, z: -0.44 },
      { t: 'Cl', x: -0.76, y: -0.35, z: -0.44 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  // ── C₂ₕ ─────────────────────────────────────────────────────
  "trans-2-butene": {
    formula: "trans-C₄H₈", name: "trans-2-Butene", pg: "C₂ₕ",
    shape: "平面對稱型", angle: "~120°",
    elements: "E, C₂, i, σh", planeNormals: [[0, 0, 1]],
    desc: "甲基以反式雙鍵兩側對稱排列。具一條垂直於分子平面的 C₂ 軸、反轉中心 i，以及分子平面所在的水平鏡面 σh。",
    atoms: [
      { t: 'C', x: -0.65, y:  0,    z:  0 },
      { t: 'C', x:  0.65, y:  0,    z:  0 },
      { t: 'C', x: -1.45, y:  1.1,  z:  0 },
      { t: 'C', x:  1.45, y: -1.1,  z:  0 },
      { t: 'H', x: -1.1,  y: -0.85, z:  0 },
      { t: 'H', x:  1.1,  y:  0.85, z:  0 },
      { t: 'H', x: -2.2,  y:  0.8,  z:  0.6 },
      { t: 'H', x: -2.2,  y:  0.8,  z: -0.6 },
      { t: 'H', x:  2.2,  y: -0.8,  z:  0.6 },
      { t: 'H', x:  2.2,  y: -0.8,  z: -0.6 },
    ],
    bonds: [[0,1],[0,2],[1,3],[0,4],[1,5],[2,6],[2,7],[3,8],[3,9]],
  },

  "trans-N₂H₂": {
    formula: "trans-N₂H₂", name: "trans-Diazene", pg: "C₂ₕ",
    shape: "平面反式", angle: "~106°",
    elements: "E, C₂, i, σh", planeNormals: [[0, 0, 1]],
    desc: "兩氫原子分處雙鍵兩側反向平面排列。具備一個垂直分子平面的 C₂ 軸、雙鍵中點的反轉中心 i，與分子水平鏡面 σh。",
    atoms: [
      { t: 'N', x: -0.55, y:  0,    z: 0 },
      { t: 'N', x:  0.55, y:  0,    z: 0 },
      { t: 'H', x: -1.05, y:  0.75, z: 0 },
      { t: 'H', x:  1.05, y: -0.75, z: 0 },
    ],
    bonds: [[0,1],[0,2],[1,3]],
  },

  // ── D₂ₕ ─────────────────────────────────────────────────────
  "C₂H₄": {
    formula: "C₂H₄", name: "Ethylene (Planar)", pg: "D₂ₕ",
    shape: "平面", angle: "120°",
    elements: "E, 3C₂, 3σ, i", planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "C=C 雙鍵分子，完全平面。有三個互相垂直的 C₂ 軸、三個互相垂直的鏡面，以及反轉中心 i。",
    atoms: [
      { t: 'C', x: -0.4,  y:  0,    z: 0 },
      { t: 'C', x:  0.4,  y:  0,    z: 0 },
      { t: 'H', x: -0.85, y:  0.55, z: 0 },
      { t: 'H', x: -0.85, y: -0.55, z: 0 },
      { t: 'H', x:  0.85, y:  0.55, z: 0 },
      { t: 'H', x:  0.85, y: -0.55, z: 0 },
    ],
    bonds: [[0,1],[0,2],[0,3],[1,4],[1,5]],
  },

  "N₂O₄": {
    formula: "N₂O₄", name: "Dinitrogen Tetroxide", pg: "D₂ₕ",
    shape: "平面高對稱", angle: "混合",
    elements: "E, 3C₂, 3σ, i", planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "六個原子共平面。N-N 鍵垂直主軸，結構呈現高二面體對稱 D₂h，擁有一個反轉中心 i 與三個正交的鏡面。",
    atoms: [
      { t: 'N', x: -0.75, y:  0,    z: 0 },
      { t: 'N', x:  0.75, y:  0,    z: 0 },
      { t: 'O', x: -1.3,  y:  0.85, z: 0 },
      { t: 'O', x: -1.3,  y: -0.85, z: 0 },
      { t: 'O', x:  1.3,  y:  0.85, z: 0 },
      { t: 'O', x:  1.3,  y: -0.85, z: 0 },
    ],
    bonds: [[0,1],[0,2],[0,3],[1,4],[1,5]],
  },

  "naphthalene": {
    formula: "C₁₀H₈", name: "Naphthalene (Planar)", pg: "D₂ₕ",
    shape: "平面雙環芳烴", angle: "120°",
    elements: "E, 3C₂, 3σ, i", planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "萘分子為平面雙苯環共軛體。具有三個互相正交的 C₂ 軸（其一穿過兩環中鍵，另二在分子面上），且包含一個位於幾何中點的反轉中心 i。",
    atoms: [
      { t: 'C', x: -0.7, y:  0.7, z: 0 }, { t: 'C', x:  0.7, y:  0.7, z: 0 },
      { t: 'C', x:  1.4, y:  0,   z: 0 }, { t: 'C', x:  0.7, y: -0.7, z: 0 },
      { t: 'C', x: -0.7, y: -0.7, z: 0 }, { t: 'C', x: -1.4, y:  0,   z: 0 },
      { t: 'C', x:  2.5, y:  0.7, z: 0 }, { t: 'C', x:  3.1, y:  0,   z: 0 },
      { t: 'C', x:  2.5, y: -0.7, z: 0 },
      { t: 'C', x: -2.5, y:  0.7, z: 0 }, { t: 'C', x: -3.1, y:  0,   z: 0 },
      { t: 'C', x: -2.5, y: -0.7, z: 0 },
      { t: 'H', x:  3.8, y:  0,   z: 0 }, { t: 'H', x: -3.8, y:  0,   z: 0 },
    ],
    bonds: [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
      [1,6],[6,7],[7,8],[8,3],
      [5,9],[9,10],[10,11],[11,4],
      [7,12],[10,13],
    ],
  },

  // ── D₃ₕ ─────────────────────────────────────────────────────
  "BF₃": {
    formula: "BF₃", name: "Boron Trifluoride (Planar)", pg: "D₃ₕ",
    shape: "平面三角形", angle: "120°",
    elements: "E, 2C₃, 3C₂, σh, 2S₃, 3σv",
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "B 無孤對電子，三個 B-F 鍵完全平面。C₃ 軸垂直分子平面，σh 即為分子所在平面，另有三個 C₂ 軸通過 B-F 鍵。",
    atoms: [
      { t: 'B', x:  0,    y:  0,    z: 0 },
      { t: 'F', x:  0,    y:  0.87, z: 0 },
      { t: 'F', x:  0.75, y: -0.43, z: 0 },
      { t: 'F', x: -0.75, y: -0.43, z: 0 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  "SO₃": {
    formula: "SO₃", name: "Sulfur Trioxide (Planar)", pg: "D₃ₕ",
    shape: "平面三角形", angle: "120°",
    elements: "E, 2C₃, 3C₂, σh, 2S₃, 3σv",
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "S 以雙鍵連接三個等效 O，形成完美平面三角形。對稱性高，具 C₃ 主軸、σh 水平鏡面與 3 個 C₂ 副軸。",
    atoms: [
      { t: 'S', x:  0,    y:  0,    z: 0 },
      { t: 'O', x:  0,    y:  0.87, z: 0 },
      { t: 'O', x:  0.75, y: -0.43, z: 0 },
      { t: 'O', x: -0.75, y: -0.43, z: 0 },
    ],
    bonds: [[0,1],[0,2],[0,3]],
  },

  "PCl₅": {
    formula: "PCl₅", name: "Phosphorus Pentachloride (Trigonal Bipyramidal)", pg: "D₃ₕ",
    shape: "三方雙錐", angle: "90°/120°",
    elements: "E, 2C₃, 3C₂, σh, 2S₃, 3σv",
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "赤道 3 個 Cl（120° 間隔）+ 軸向 2 個 Cl（180°），形成三方雙錐。赤道平面為 σh，C₃ 為主軸。",
    atoms: [
      { t: 'P',  x: 0,    y:  0,    z:  0 },
      { t: 'Cl', x: 0,    y:  0.9,  z:  0 },
      { t: 'Cl', x: 0,    y: -0.9,  z:  0 },
      { t: 'Cl', x: 0.75, y:  0,    z:  0 },
      { t: 'Cl', x: -0.75,y:  0,    z:  0 },
      { t: 'Cl', x: 0,    y:  0,    z:  0.75 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5]],
  },

  // ── D₄ₕ ─────────────────────────────────────────────────────
  "XeF₄": {
    formula: "XeF₄", name: "Xenon Tetrafluoride (Square Planar)", pg: "D₄ₕ",
    shape: "平面正方形", angle: "90°",
    elements: "E, 2C₄, C₂, 2C₂′, 2C₂″, i, 2S₄, σh, 2σv, 2σd",
    planeNormals: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    desc: "Xe 有 2 孤對電子佔上下軸，4 個 F 在赤道平面形成正方形。含 C₄ 主軸、σh 平面及反轉中心 i。",
    atoms: [
      { t: 'Xe', x:  0,   y: 0, z:  0 },
      { t: 'F',  x:  0.9, y: 0, z:  0 },
      { t: 'F',  x: -0.9, y: 0, z:  0 },
      { t: 'F',  x:  0,   y: 0, z:  0.9 },
      { t: 'F',  x:  0,   y: 0, z: -0.9 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  "[PtCl₄]²⁻": {
    formula: "[PtCl₄]²⁻", name: "Tetrachloroplatinate(II)", pg: "D₄ₕ",
    shape: "平面正方形", angle: "90°",
    elements: "E, 2C₄, C₂, 2C₂′, 2C₂″, i, 2S₄, σh, 2σv, 2σd",
    planeNormals: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    desc: "典型的 d⁸ 配位化合物平面正方形構型。鉑金屬位於中心，四個氯離子完美坐落於正方形的四角，擁有 D₄ₕ 超高對稱性與反轉中心 i。",
    atoms: [
      { t: 'Xe', x:  0,    y: 0, z:  0 }, // Pt (以 Xe 代色)
      { t: 'Cl', x:  0.95, y: 0, z:  0 },
      { t: 'Cl', x: -0.95, y: 0, z:  0 },
      { t: 'Cl', x:  0,    y: 0, z:  0.95 },
      { t: 'Cl', x:  0,    y: 0, z: -0.95 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  // ── D₆ₕ ─────────────────────────────────────────────────────
  "C₆H₆": {
    formula: "C₆H₆", name: "Benzene (Planar)", pg: "D₆ₕ",
    shape: "平面正六邊形", angle: "120°",
    elements: "E, 2C₆, 2C₃, C₂, …, i, σh",
    planeNormals: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    desc: "苯分子為完美正六邊形平面。擁有極高的 D₆ₕ 對稱，主軸為垂直於平面的 C₆ 軸，具有水平鏡面 σh、六個垂直鏡面與反轉中心 i。",
    atoms: [
      { t: 'C', x:  0,    y:  0.8,  z: 0 }, { t: 'C', x:  0.69, y:  0.4,  z: 0 },
      { t: 'C', x:  0.69, y: -0.4,  z: 0 }, { t: 'C', x:  0,    y: -0.8,  z: 0 },
      { t: 'C', x: -0.69, y: -0.4,  z: 0 }, { t: 'C', x: -0.69, y:  0.4,  z: 0 },
      { t: 'H', x:  0,    y:  1.4,  z: 0 }, { t: 'H', x:  1.21, y:  0.7,  z: 0 },
      { t: 'H', x:  1.21, y: -0.7,  z: 0 }, { t: 'H', x:  0,    y: -1.4,  z: 0 },
      { t: 'H', x: -1.21, y: -0.7,  z: 0 }, { t: 'H', x: -1.21, y:  0.7,  z: 0 },
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]],
  },

  "coronene": {
    formula: "C₂₄H₁₂", name: "Coronene (Superbenzene)", pg: "D₆ₕ",
    shape: "平面多環芳烴", angle: "120°",
    elements: "E, 2C₆, 2C₃, …, i, σh",
    planeNormals: [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
    desc: "冠烯 (Coronene) 又稱超苯，由七個苯環高度共軛並合為完美對稱大平面，點群與苯分子同為最高級的 D₆ₕ。",
    atoms: [
      { t: 'C', x:  0,    y:  0.5,  z: 0 }, { t: 'C', x:  0.43, y:  0.25, z: 0 },
      { t: 'C', x:  0.43, y: -0.25, z: 0 }, { t: 'C', x:  0,    y: -0.5,  z: 0 },
      { t: 'C', x: -0.43, y: -0.25, z: 0 }, { t: 'C', x: -0.43, y:  0.25, z: 0 },
      { t: 'C', x:  0,    y:  1.0,  z: 0 }, { t: 'C', x:  0.86, y:  0.5,  z: 0 },
      { t: 'C', x:  0.86, y: -0.5,  z: 0 }, { t: 'C', x:  0,    y: -1.0,  z: 0 },
      { t: 'C', x: -0.86, y: -0.5,  z: 0 }, { t: 'C', x: -0.86, y:  0.5,  z: 0 },
      { t: 'H', x:  0,    y:  1.5,  z: 0 }, { t: 'H', x:  1.3,  y:  0.75, z: 0 },
    ],
    bonds: [
      [0,1],[1,2],[2,3],[3,4],[4,5],[5,0],
      [0,6],[1,7],[2,8],[3,9],[4,10],[5,11],
      [6,12],[7,13],
    ],
  },

  // ── D₃d ─────────────────────────────────────────────────────
  "C₂H₆ (staggered)": {
    formula: "C₂H₆", name: "Ethane (Staggered)", pg: "D₃d",
    shape: "交叉式", angle: "109.5°",
    elements: "E, 2C₃, 3C₂, i, 2S₆, 3σd",
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "交叉構形乙烷具有反轉中心 i，C₃ 主軸沿 C-C 鍵，3 個 C₂ 副軸平分兩端 H 間距，3 個 σd 鏡面。",
    atoms: [
      { t: 'C', x: -0.38, y:  0,    z:  0 },
      { t: 'C', x:  0.38, y:  0,    z:  0 },
      { t: 'H', x: -0.75, y:  0.6,  z:  0.4 },
      { t: 'H', x: -0.75, y: -0.7,  z:  0.2 },
      { t: 'H', x: -0.75, y:  0.1,  z: -0.65 },
      { t: 'H', x:  0.75, y:  0.7,  z: -0.2 },
      { t: 'H', x:  0.75, y: -0.6,  z: -0.4 },
      { t: 'H', x:  0.75, y: -0.1,  z:  0.65 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[1,5],[1,6],[1,7]],
  },

  "cyclohexane (chair)": {
    formula: "C₆H₁₂", name: "Cyclohexane (Chair)", pg: "D₃d",
    shape: "椅型構象", angle: "~109.5°",
    elements: "E, 2C₃, 3C₂, i, 2S₆, 3σd",
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
    desc: "椅型環己烷中，六個碳原子呈上下交錯排列，避免了張力。分子存在一條穿過中心幾何投影垂直的 C₃ 軸，並含一個反轉中心 i 位於空間中心。",
    atoms: [
      { t: 'C', x:  0,    y:  0.8,  z:  0.25 },
      { t: 'C', x:  0.69, y:  0.4,  z: -0.25 },
      { t: 'C', x:  0.69, y: -0.4,  z:  0.25 },
      { t: 'C', x:  0,    y: -0.8,  z: -0.25 },
      { t: 'C', x: -0.69, y: -0.4,  z:  0.25 },
      { t: 'C', x: -0.69, y:  0.4,  z: -0.25 },
      { t: 'H', x:  0,    y:  1.4,  z:  0.6 },
      { t: 'H', x:  0,    y: -1.4,  z: -0.6 },
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[3,7]],
  },

  // ── D₄d ─────────────────────────────────────────────────────
  "S₈": {
    formula: "S₈", name: "Octasulfur (Crown)", pg: "D₄d",
    shape: "皇冠型八硫環", angle: "~108°",
    elements: "E, 2S₈, 2C₄, 4C₂, 4σd",
    planeNormals: [[1, 0, 0], [0, 1, 0]],
    desc: "S₈ 呈現典型的皇冠狀結構，硫原子以交替上下（W形）相連。具有垂直於分子的 C₄ 旋轉軸，4個二重旋轉對稱軸 C₂ 與 4個對角鏡面，無反轉中心 i。",
    atoms: [
      { t: 'S', x:  0,    y:  1.0,  z:  0.35 },
      { t: 'S', x:  0.7,  y:  0.7,  z: -0.35 },
      { t: 'S', x:  1.0,  y:  0,    z:  0.35 },
      { t: 'S', x:  0.7,  y: -0.7,  z: -0.35 },
      { t: 'S', x:  0,    y: -1.0,  z:  0.35 },
      { t: 'S', x: -0.7,  y: -0.7,  z: -0.35 },
      { t: 'S', x: -1.0,  y:  0,    z:  0.35 },
      { t: 'S', x: -0.7,  y:  0.7,  z: -0.35 },
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]],
  },

  // ── Tᵈ ──────────────────────────────────────────────────────
  "CH₄": {
    formula: "CH₄", name: "Methane (Tetrahedral)", pg: "Tᵈ",
    shape: "正四面體", angle: "109.5°",
    elements: "E, 8C₃, 3C₂, 6S₄, 6σd",
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]],
    desc: "完美正四面體。4 條 C₃ 軸（過 C-H 鍵）、3 條 C₂ 軸（平分鍵角）、6 個 σd 對角鏡面，共 24 個對稱操作。",
    atoms: [
      { t: 'C', x:  0,    y:  0,    z:  0 },
      { t: 'H', x:  0.57, y:  0.57, z:  0.57 },
      { t: 'H', x: -0.57, y: -0.57, z:  0.57 },
      { t: 'H', x: -0.57, y:  0.57, z: -0.57 },
      { t: 'H', x:  0.57, y: -0.57, z: -0.57 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  "SiF₄": {
    formula: "SiF₄", name: "Silicon Tetrafluoride (Tetrahedral)", pg: "Tᵈ",
    shape: "正四面體", angle: "109.5°",
    elements: "E, 8C₃, 3C₂, 6S₄, 6σd",
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]],
    desc: "與 CH₄ 等電子體，正四面體結構。Si-F 鍵長較長，但點群對稱性完全相同。",
    atoms: [
      { t: 'Si', x:  0,    y:  0,    z:  0 },
      { t: 'F',  x:  0.62, y:  0.62, z:  0.62 },
      { t: 'F',  x: -0.62, y: -0.62, z:  0.62 },
      { t: 'F',  x: -0.62, y:  0.62, z: -0.62 },
      { t: 'F',  x:  0.62, y: -0.62, z: -0.62 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  "CCl₄": {
    formula: "CCl₄", name: "Carbon Tetrachloride", pg: "Tᵈ",
    shape: "正四面體", angle: "109.5°",
    elements: "E, 8C₃, 3C₂, 6S₄, 6σd",
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]],
    desc: "C 中心四個 Cl 對等排列，正四面體。Cl 半徑較大，鍵長較長，但點群仍為 Tᵈ。",
    atoms: [
      { t: 'C',  x:  0,    y:  0,    z:  0 },
      { t: 'Cl', x:  0.65, y:  0.65, z:  0.65 },
      { t: 'Cl', x: -0.65, y: -0.65, z:  0.65 },
      { t: 'Cl', x: -0.65, y:  0.65, z: -0.65 },
      { t: 'Cl', x:  0.65, y: -0.65, z: -0.65 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
  },

  // ── Oₕ ──────────────────────────────────────────────────────
  "SF₆": {
    formula: "SF₆", name: "Sulfur Hexafluoride (Octahedral)", pg: "Oₕ",
    shape: "正八面體", angle: "90°",
    elements: "E, 8C₃, 6C₂, 6C₄, 3C₂, i, 6S₄, 8S₆, 3σh, 6σd",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "完美正八面體，48 個對稱操作，為常見分子中最高對稱性之一。含反轉中心 i。",
    atoms: [
      { t: 'S', x:  0,   y:  0,   z:  0 },
      { t: 'F', x:  0.9, y:  0,   z:  0 },
      { t: 'F', x: -0.9, y:  0,   z:  0 },
      { t: 'F', x:  0,   y:  0.9, z:  0 },
      { t: 'F', x:  0,   y: -0.9, z:  0 },
      { t: 'F', x:  0,   y:  0,   z:  0.9 },
      { t: 'F', x:  0,   y:  0,   z: -0.9 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
  },

  "[Fe(CN)₆]³⁻": {
    formula: "[Fe(CN)₆]³⁻", name: "Ferricyanide Complex", pg: "Oₕ",
    shape: "正八面體錯合物", angle: "90°",
    elements: "E, 8C₃, 6C₄, i, 3σh",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "中心 Fe³⁺ 與六個 CN⁻ 氰根配位基配位，呈現完美的 Oh 對稱空間八面體結構。含高度密集的 C₄, C₃ 對稱軸與反轉中心 i。",
    atoms: [
      { t: 'Fe', x:  0,   y:  0,   z:  0 },
      { t: 'N',  x:  1.0, y:  0,   z:  0 }, { t: 'N', x: -1.0, y:  0,   z:  0 },
      { t: 'N',  x:  0,   y:  1.0, z:  0 }, { t: 'N', x:  0,   y: -1.0, z:  0 },
      { t: 'N',  x:  0,   y:  0,   z:  1.0 }, { t: 'N', x:  0,   y:  0,   z: -1.0 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
  },

  "UF₆": {
    formula: "UF₆", name: "Uranium Hexafluoride", pg: "Oₕ",
    shape: "正八面體", angle: "90°",
    elements: "E, 8C₃, 6C₄, i, 3σh",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "鈾同位素離心分離之核心分子，呈現緊密的 Oh 點群正八面體結構，分子正中央的 U 原子為完美的幾何反轉中心 i。",
    atoms: [
      { t: 'U', x:  0,    y:  0,    z:  0 },
      { t: 'F', x:  0.85, y:  0,    z:  0 }, { t: 'F', x: -0.85, y:  0,    z:  0 },
      { t: 'F', x:  0,    y:  0.85, z:  0 }, { t: 'F', x: -0.85, y:  0,    z:  0 },
      { t: 'F', x:  0,    y:  0,    z:  0.85 }, { t: 'F', x:  0,    y:  0,    z: -0.85 },
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
  },

  // ── D∞ₕ ─────────────────────────────────────────────────────
  "CO₂": {
    formula: "CO₂", name: "Carbon Dioxide (Linear)", pg: "D∞ₕ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞C₂, i, 2S∞, ∞σv",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "對稱中心在中央 C 原子，C∞ 軸為 C-C-O 連線，具無限多個 C₂ 副軸與垂直鏡面，並含反轉中心 i。",
    atoms: [
      { t: 'C', x:  0,    y: 0, z: 0 },
      { t: 'O', x: -0.95, y: 0, z: 0 },
      { t: 'O', x:  0.95, y: 0, z: 0 },
    ],
    bonds: [[0,1],[0,2]],
  },

  "N₂": {
    formula: "N₂", name: "Dinitrogen (Linear)", pg: "D∞ₕ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞C₂, i, 2S∞, ∞σv",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "同核雙原子分子，具反轉中心 i（位於兩 N 中點）。C∞ 沿鍵軸，無限多個 C₂ 與 σv 對稱元素。",
    atoms: [
      { t: 'N', x: -0.55, y: 0, z: 0 },
      { t: 'N', x:  0.55, y: 0, z: 0 },
    ],
    bonds: [[0,1]],
  },

  "C₂H₂": {
    formula: "C₂H₂", name: "Acetylene (Linear)", pg: "D∞ₕ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞C₂, i, 2S∞, ∞σv",
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    desc: "H-C≡C-H 線形排列，反轉中心在三鍵中點。最簡單的有機線形分子，D∞h 點群。",
    atoms: [
      { t: 'H', x: -1.05, y: 0, z: 0 },
      { t: 'C', x: -0.4,  y: 0, z: 0 },
      { t: 'C', x:  0.4,  y: 0, z: 0 },
      { t: 'H', x:  1.05, y: 0, z: 0 },
    ],
    bonds: [[0,1],[1,2],[2,3]],
  },

  // ── C∞ᵥ ─────────────────────────────────────────────────────
  "HCl": {
    formula: "HCl", name: "Hydrogen Chloride (Linear)", pg: "C∞ᵥ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞σv", planeNormals: [[0, 1, 0], [0, 0, 1]],
    desc: "異核雙原子分子，無反轉中心（兩端不同）。C∞ 沿鍵軸，具無限多個包含鍵軸的垂直鏡面 σv。",
    atoms: [
      { t: 'H',  x: -0.65, y: 0, z: 0 },
      { t: 'Cl', x:  0.65, y: 0, z: 0 },
    ],
    bonds: [[0,1]],
  },

  "CO": {
    formula: "CO", name: "Carbon Monoxide (Linear)", pg: "C∞ᵥ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞σv", planeNormals: [[0, 1, 0], [0, 0, 1]],
    desc: "異核雙原子，兩端為不同原子，無 i。C∞ 為鍵軸，無限多個 σv 通過鍵軸。",
    atoms: [
      { t: 'C', x: -0.57, y: 0, z: 0 },
      { t: 'O', x:  0.57, y: 0, z: 0 },
    ],
    bonds: [[0,1]],
  },

  "HCN": {
    formula: "HCN", name: "Hydrogen Cyanide (Linear)", pg: "C∞ᵥ",
    shape: "線形", angle: "180°",
    elements: "E, 2C∞, ∞σv", planeNormals: [[0, 1, 0], [0, 0, 1]],
    desc: "H-C≡N 線形分子，H 與 N 不同，無反轉中心。具 C∞ 軸及無限個含鍵軸的鏡面 σv。",
    atoms: [
      { t: 'H', x: -0.98, y: 0, z: 0 },
      { t: 'C', x: -0.33, y: 0, z: 0 },
      { t: 'N', x:  0.62, y: 0, z: 0 },
    ],
    bonds: [[0,1],[1,2]],
  },
};

export const CPK: Record<string, string> = {
  H:  '#FFFFFF', C:  '#404040', N:  '#3050F8', O:  '#FF0D0D',
  F:  '#90E050', Cl: '#1FEF1F', S:  '#FFFF30', P:  '#FF8000',
  B:  '#FFA500', Si: '#F0C8A0', Xe: '#429EB0', U:  '#D270B3',
  Fe: '#932626', Br: '#A72C15',
};

export const RADII: Record<string, number> = {
  H: 13, C: 20, N: 20, O: 20, F: 18, Cl: 24, S: 24, P: 24,
  B: 20, Si: 22, Xe: 26, U: 28, Fe: 24, Br: 26,
};