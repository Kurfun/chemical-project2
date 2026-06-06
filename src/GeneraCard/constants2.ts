import type { CPKElement, MoleculeConfig, Molecule3D, VseprShape } from './type4';

export const CPK: Record<string, CPKElement> = {
  H:  { fill: '#FFFFFF', stroke: '#BBBBBB', text: '#444444', valence: 1 },
  C:  { fill: '#404040', stroke: '#666666', text: '#FFFFFF', valence: 4 },
  N:  { fill: '#3050F8', stroke: '#1030C0', text: '#FFFFFF', valence: 5 },
  O:  { fill: '#FF0D0D', stroke: '#BB0000', text: '#FFFFFF', valence: 6 },
  F:  { fill: '#90E050', stroke: '#40A010', text: '#333333', valence: 7 },
  B:  { fill: '#FFB5B5', stroke: '#CC8888', text: '#333333', valence: 3 },
  S:  { fill: '#FFFF30', stroke: '#DDBB00', text: '#444444', valence: 6 },
  Cl: { fill: '#1FEF1F', stroke: '#109910', text: '#FFFFFF', valence: 7 },
  Be: { fill: '#C2C2D6', stroke: '#999999', text: '#444444', valence: 2 },
  Sn: { fill: '#429EB0', stroke: '#2D7180', text: '#FFFFFF', valence: 4 },
  P:  { fill: '#FF8000', stroke: '#CC6600', text: '#FFFFFF', valence: 5 },
  As: { fill: '#D170D1', stroke: '#9E499E', text: '#FFFFFF', valence: 5 },
  Xe: { fill: '#429EB0', stroke: '#26616D', text: '#FFFFFF', valence: 8 },
  Br: { fill: '#A72C15', stroke: '#731D0E', text: '#FFFFFF', valence: 7 },
  I:  { fill: '#9400D3', stroke: '#600095', text: '#FFFFFF', valence: 7 },
  Pt: { fill: '#D2691E', stroke: '#8B4513', text: '#FFFFFF', valence: 4 }
};

export const MOLECULES: Record<string, MoleculeConfig> = {
  H2O: {
    title: '水分子 H₂O — O 居中，形成 V 形彎曲結構',
    label: '建構區 — O 居中，兩個 H 各連一鍵',
    atoms: { O: 1, H: 2 }, centralAtom: 'O',
    shape: 'Bent', shapeKey: 'bent_4',
    hints: [
      ['中心原子', 'O (氧原子)'], ['孤對電子 (LP)', '2 對'],
      ['價電子對數 (Steric)', '4 (四面體排斥分佈)'],
      ['分子形狀幾何', 'Bent (V形彎曲)'], ['理論鍵角', '104.5°'],
      ['混成軌域', 'sp³（2 鍵結 + 2 孤對）'], ['極性', '極性分子'],
    ],
    hintText: '將 O 置於畫布中央，並分別拉線將兩顆 H 與 O 相連，呈現彎曲形。',
    funFact: '水分子的鍵角是 104.5°，比正四面體的 109.5° 還小——這是因為兩對孤對電子比鍵結電子更「霸道」，把 H 往內推。正是這個小小的 4.5° 差異，讓水有了表面張力、毛細現象，和所有孕育生命的奇蹟。',
    eggEmoji: '💧',
    eggTitle: '生命之水的秘密角度',
    xp: 120, levelLabel: '關卡 3 / 8', prog: 30, progLabel: '3 / 8 完成',
    validationRules: [
      {
        type: 'bent',
        targetAtoms: ['H', 'H'],
        expectedValue: 104.5,
        tolerance: 15,
        errorMessage: '❌ 答題錯誤！水分子不能是直線型，孤對電子會強烈壓擠 H 原子，使其呈現約 104.5° 彎曲形！'
      }
    ]
  },
  NH3: {
    title: '氨分子 NH₃ — N 居中，向外斜下呈三角錐',
    label: '建構區 — N 居中，三個 H 各連一鍵',
    atoms: { N: 1, H: 3 }, centralAtom: 'N',
    shape: 'Trigonal pyramidal', shapeKey: 'trigonal_pyramid',
    hints: [
      ['中心原子', 'N (氮原子)'], ['孤對電子 (LP)', '1 對'],
      ['價電子對數 (Steric)', '4 (四面體排斥)'], ['分子形狀幾何', 'Trigonal pyramidal (三角錐)'],
      ['理論鍵角', '107°'], ['混成軌域', 'sp³（1 孤對 + 3 N-H σ 鍵）'], ['極性', '極性分子'],
    ],
    hintText: '將 N 放在中央，三個 H 向斜下方展開呈放射對稱，各與 N 連接。',
    funFact: '氨的鍵角 107° 比四面體少了 2.5°，就是那一對孤對電子在頂端「霸佔」空間。有趣的是：正是 N 的這種形狀讓氨極易溶於水，成為地球上最重要的氮源，每年施放數億噸在農田裡。',
    eggEmoji: '🌱',
    eggTitle: 'NH₃ 養活了一半人類',
    xp: 140, levelLabel: '關卡 4 / 8', prog: 40, progLabel: '4 / 8 完成',
    validationRules: [
      {
        type: 'angle',
        targetAtoms: ['H', 'H'],
        expectedValue: 107,
        tolerance: 20,
        errorMessage: '❌ 答題錯誤！NH₃ 的三個 N-H 鍵應受頂部孤對電子向下推擠，形成約 107° 夾角三角錐。'
      }
    ]
  },
  BF3: {
    title: '三氟化硼 BF₃ — B 居中，平面三角對稱',
    label: '建構區 — B 居中，三個 F 各連一鍵',
    atoms: { B: 1, F: 3 }, centralAtom: 'B',
    shape: 'Trigonal planar', shapeKey: 'trigonal_planar',
    hints: [
      ['中心原子', 'B (硼原子)'], ['孤對電子 (LP)', '0'],
      ['價電子對數 (Steric)', '3 (平面對稱)'], ['分子形狀幾何', 'Trigonal planar (平面三角形)'],
      ['理論鍵角', '120°'], ['混成軌域', 'sp²（3 個 σ 鍵，空 p 軌域垂直分子面）'], ['極性', '非極性分子'],
    ],
    hintText: 'B 置於正中，三顆 F 以 120 度角均勻呈輻射狀與 B 連接。',
    funFact: 'BF₃ 是完美的平面三角形，因為硼只有 3 個價電子，沒有孤對電子——但這讓它成為超級「缺電子」的路易士酸。遇到任何有孤對電子的分子就立刻抓住，就像一個永遠張著嘴的小怪獸。',
    eggEmoji: '🔺',
    eggTitle: 'BF₃ 是貪婪的路易士酸',
    xp: 130, levelLabel: '關卡 5 / 8', prog: 50, progLabel: '5 / 8 完成',
    validationRules: [
      {
        type: 'angle',
        targetAtoms: ['F', 'F'],
        expectedValue: 120,
        tolerance: 15,
        errorMessage: '❌ 答題錯誤！BF₃ 應呈現 120° 平面三角形對稱結構。'
      }
    ]
  },
  CO2: {
    title: '二氧化碳 CO₂ — C 居中，呈直線型對稱',
    label: '建構區 — C 居中，兩個 O 排成一直線',
    atoms: { C: 1, O: 2 }, centralAtom: 'C',
    shape: 'Linear', shapeKey: 'linear',
    hints: [
      ['中心原子', 'C (碳原子)'], ['孤對電子 (LP)', '0'],
      ['價電子對數 (Steric)', '2 (直線)'], ['分子形狀幾何', 'Linear (直線型)'],
      ['理論鍵角', '180°'], ['混成軌域', 'sp（2 個 sp 形成 σ 鍵，2 個 p 形成 π 雙鍵）'], ['極性', '非極性分子'],
    ],
    hintText: '碳原子放在正中，左右排開兩顆氧原子，與碳在同一直線上並與之連接。',
    funFact: 'CO₂ 是完美的直線型，兩個雙鍵讓碳沒有孤對電子，分子雖然有極性鍵，卻因為完全對稱而抵消成非極性。這就是為什麼它能在大氣中自由飄移——但也正是同樣的非極性讓它吸收紅外線，造成溫室效應。',
    eggEmoji: '🌍',
    eggTitle: 'CO₂ — 完美對稱的氣候殺手',
    xp: 110, levelLabel: '關卡 2 / 8', prog: 20, progLabel: '2 / 8 完成',
    validationRules: [
      {
        type: 'linear',
        targetAtoms: ['O', 'O'],
        expectedValue: 180,
        tolerance: 15,
        errorMessage: '❌ 答題錯誤！CO₂ 的兩個氧原子受到 sp 排斥，應在同一直線上（呈 180° 直線對稱）！'
      }
    ]
  },
  CH4: {
    title: '甲烷 CH₄ — C 居中，呈正四面體空間',
    label: '建構區 — C 居中，四個 H 各連一鍵',
    atoms: { C: 1, H: 4 }, centralAtom: 'C',
    shape: 'Tetrahedral', shapeKey: 'tetrahedral',
    hints: [
      ['中心原子', 'C (碳原子)'], ['孤對電子 (LP)', '0'],
      ['價電子對數 (Steric)', '4'], ['分子形狀幾何', 'Tetrahedral (四面體)'],
      ['理論鍵角', '109.5°'], ['混成軌域', 'sp³（4 個等能 sp³ 指向四面體四頂點）'], ['極性', '非極性分子'],
    ],
    hintText: 'C 在中心，四顆 H 分別均勻朝向空間四角延伸（在二維面可畫為十字星狀）。',
    funFact: '甲烷的 109.5° 四面體角是大自然最喜歡的角度，因為它讓四個鍵盡可能遠離。令人意外的是：一頭牛每天打嗝釋放的甲烷，溫室效應是 CO₂ 的 25 倍——正四面體的美麗結構卻是地球暖化的幫兇之一。',
    eggEmoji: '🐄',
    eggTitle: 'CH₄ 與牛的溫室效應',
    xp: 150, levelLabel: '關卡 6 / 8', prog: 60, progLabel: '6 / 8 完成',
    validationRules: [
      {
        type: 'angle',
        targetAtoms: ['H', 'H'],
        expectedValue: 109.5,
        tolerance: 20,
        errorMessage: '❌ 答題錯誤！四個 C-H 鍵應呈現立體四面體均勻分佈，鍵角約為 109.5°。'
      }
    ]
  },
};

export const EXAMPLES_3D_DATA: Record<string, Molecule3D> = {
  'CO₂': {
    atoms: [{ t: 'C', x: 0, y: 0, z: 0 }, { t: 'O', x: -0.95, y: 0, z: 0 }, { t: 'O', x: 0.95, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'BeCl₂': {
    atoms: [{ t: 'Be', x: 0, y: 0, z: 0 }, { t: 'Cl', x: -1.2, y: 0, z: 0 }, { t: 'Cl', x: 1.2, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'C₂H₂': {
    atoms: [{ t: 'C', x: -0.4, y: 0, z: 0 }, { t: 'C', x: 0.4, y: 0, z: 0 }, { t: 'H', x: -1.05, y: 0, z: 0 }, { t: 'H', x: 1.05, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2], [1, 3]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'BF₃': {
    atoms: [{ t: 'B', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.87, z: 0 }, { t: 'F', x: 0.75, y: -0.43, z: 0 }, { t: 'F', x: -0.75, y: -0.43, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]]
  },
  'SO₃': {
    atoms: [{ t: 'S', x: 0, y: 0, z: 0 }, { t: 'O', x: 0, y: 0.87, z: 0 }, { t: 'O', x: 0.75, y: -0.43, z: 0 }, { t: 'O', x: -0.75, y: -0.43, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]]
  },
  'AlCl₃': {
    atoms: [{ t: 'Be', x: 0, y: 0, z: 0 }, { t: 'Cl', x: 0, y: 1.05, z: 0 }, { t: 'Cl', x: 0.9, y: -0.52, z: 0 }, { t: 'Cl', x: -0.9, y: -0.52, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]]
  },
  'SO₂': {
    atoms: [{ t: 'S', x: 0, y: 0.12, z: 0 }, { t: 'O', x: -0.85, y: -0.45, z: 0 }, { t: 'O', x: 0.85, y: -0.45, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'O₃': {
    atoms: [{ t: 'O', x: 0, y: 0.12, z: 0 }, { t: 'O', x: -0.78, y: -0.47, z: 0 }, { t: 'O', x: 0.78, y: -0.47, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'SnCl₂': {
    atoms: [{ t: 'Sn', x: 0, y: 0.18, z: 0 }, { t: 'Cl', x: -1.0, y: -0.35, z: 0 }, { t: 'Cl', x: 1.0, y: -0.35, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'CH₄': {
    atoms: [{ t: 'C', x: 0, y: 0, z: 0 }, { t: 'H', x: 0.57, y: 0.57, z: 0.57 }, { t: 'H', x: -0.57, y: -0.57, z: 0.57 }, { t: 'H', x: -0.57, y: 0.57, z: -0.57 }, { t: 'H', x: 0.57, y: -0.57, z: -0.57 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]]
  },
  'CCl₄': {
    atoms: [{ t: 'C', x: 0, y: 0, z: 0 }, { t: 'Cl', x: 0.65, y: 0.65, z: 0.65 }, { t: 'Cl', x: -0.65, y: -0.65, z: 0.65 }, { t: 'Cl', x: -0.65, y: 0.65, z: -0.65 }, { t: 'Cl', x: 0.65, y: -0.65, z: -0.65 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]]
  },
  'NH₄⁺': {
    atoms: [{ t: 'N', x: 0, y: 0, z: 0 }, { t: 'H', x: 0.57, y: 0.57, z: 0.57 }, { t: 'H', x: -0.57, y: -0.57, z: 0.57 }, { t: 'H', x: -0.57, y: 0.57, z: -0.57 }, { t: 'H', x: 0.57, y: -0.57, z: -0.57 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 1, 0], [1, -1, 0], [0, 1, 1]]
  },
  'NH₃': {
    atoms: [{ t: 'N', x: 0, y: 0.2, z: 0 }, { t: 'H', x: 0, y: -0.3, z: 0.8 }, { t: 'H', x: 0.69, y: -0.3, z: -0.4 }, { t: 'H', x: -0.69, y: -0.3, z: -0.4 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]]
  },
  'PH₃': {
    atoms: [{ t: 'P', x: 0, y: 0.2, z: 0 }, { t: 'H', x: 0, y: -0.38, z: 0.95 }, { t: 'H', x: 0.82, y: -0.38, z: -0.48 }, { t: 'H', x: -0.82, y: -0.38, z: -0.48 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]]
  },
  'PCl₃': {
    atoms: [{ t: 'P', x: 0, y: 0.25, z: 0 }, { t: 'Cl', x: 0, y: -0.35, z: 0.98 }, { t: 'Cl', x: 0.85, y: -0.35, z: -0.49 }, { t: 'Cl', x: -0.85, y: -0.35, z: -0.49 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]]
  },
  'H₂O': {
    atoms: [{ t: 'O', x: 0, y: 0.12, z: 0 }, { t: 'H', x: -0.78, y: -0.47, z: 0 }, { t: 'H', x: 0.78, y: -0.47, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'H₂S': {
    atoms: [{ t: 'S', x: 0, y: 0.15, z: 0 }, { t: 'H', x: -0.92, y: -0.55, z: 0 }, { t: 'H', x: 0.92, y: -0.55, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'OF₂': {
    atoms: [{ t: 'O', x: 0, y: 0.12, z: 0 }, { t: 'F', x: -0.82, y: -0.49, z: 0 }, { t: 'F', x: 0.78, y: -0.49, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'PCl₅': {
    atoms: [{ t: 'P', x: 0, y: 0, z: 0 }, { t: 'Cl', x: 0, y: 0.95, z: 0 }, { t: 'Cl', x: 0, y: -0.95, z: 0 }, { t: 'Cl', x: 0.85, y: 0, z: 0 }, { t: 'Cl', x: -0.42, y: 0, z: 0.73 }, { t: 'Cl', x: -0.42, y: 0, z: -0.73 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0]]
  },
  'PF₅': {
    atoms: [{ t: 'P', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.85, z: 0 }, { t: 'F', x: 0, y: -0.85, z: 0 }, { t: 'F', x: 0.75, y: 0, z: 0 }, { t: 'F', x: -0.37, y: 0, z: 0.65 }, { t: 'F', x: -0.37, y: 0, z: -0.65 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0]]
  },
  'AsF₅': {
    atoms: [{ t: 'As', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.9, z: 0 }, { t: 'F', x: 0, y: -0.9, z: 0 }, { t: 'F', x: 0.8, y: 0, z: 0 }, { t: 'F', x: -0.4, y: 0, z: 0.69 }, { t: 'F', x: -0.4, y: 0, z: -0.69 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[0, 0, 1], [1, 0, 0], [-0.5, 0.866, 0]]
  },
  'SF₄': {
    atoms: [{ t: 'S', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.9, z: 0.1 }, { t: 'F', x: 0, y: -0.9, z: 0.1 }, { t: 'F', x: 0.72, y: 0, z: -0.4 }, { t: 'F', x: -0.72, y: 0, z: -0.4 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'IF₄⁺': {
    atoms: [{ t: 'I', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.92, z: 0.1 }, { t: 'F', x: 0, y: -0.92, z: 0.1 }, { t: 'F', x: 0.75, y: 0, z: -0.42 }, { t: 'F', x: -0.75, y: 0, z: -0.42 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'XeO₂F₂': {
    atoms: [{ t: 'Xe', x: 0, y: 0, z: 0 }, { t: 'O', x: 0, y: 0.85, z: 0.1 }, { t: 'O', x: 0, y: -0.85, z: 0.1 }, { t: 'F', x: 0.72, y: 0, z: -0.4 }, { t: 'F', x: -0.72, y: 0, z: -0.4 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'ClF₃': {
    atoms: [{ t: 'Cl', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.88, z: 0 }, { t: 'F', x: 0, y: -0.88, z: 0 }, { t: 'F', x: 0.78, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'BrF₃': {
    atoms: [{ t: 'Br', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.9, z: 0 }, { t: 'F', x: 0, y: -0.9, z: 0 }, { t: 'F', x: 0.8, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'IF₃': {
    atoms: [{ t: 'I', x: 0, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.95, z: 0 }, { t: 'F', x: 0, y: -0.95, z: 0 }, { t: 'F', x: 0.85, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
    planeNormals: [[0, 0, 1], [1, 0, 0]]
  },
  'SF₆': {
    atoms: [{ t: 'S', x: 0, y: 0, z: 0 }, { t: 'F', x: 0.85, y: 0, z: 0 }, { t: 'F', x: -0.85, y: 0, z: 0 }, { t: 'F', x: 0, y: 0.85, z: 0 }, { t: 'F', x: 0, y: -0.85, z: 0 }, { t: 'F', x: 0, y: 0, z: 0.85 }, { t: 'F', x: 0, y: 0, z: -0.85 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'Mo(CO)₆': {
    atoms: [{ t: 'Xe', x: 0, y: 0, z: 0 }, { t: 'C', x: 0.65, y: 0, z: 0 }, { t: 'C', x: -0.65, y: 0, z: 0 }, { t: 'C', x: 0, y: 0.65, z: 0 }, { t: 'C', x: 0, y: -0.65, z: 0 }, { t: 'C', x: 0, y: 0, z: 0.65 }, { t: 'C', x: 0, y: 0, z: -0.65 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  '[Co(NH₃)₆]³⁺': {
    atoms: [{ t: 'Pt', x: 0, y: 0, z: 0 }, { t: 'N', x: 0.7, y: 0, z: 0 }, { t: 'N', x: -0.7, y: 0, z: 0 }, { t: 'N', x: 0, y: 0.7, z: 0 }, { t: 'N', x: 0, y: -0.7, z: 0 }, { t: 'N', x: 0, y: 0, z: 0.7 }, { t: 'N', x: 0, y: 0, z: -0.7 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'BrF₅': {
    atoms: [{ t: 'Br', x: 0, y: -0.1, z: 0 }, { t: 'F', x: 0, y: 0.85, z: 0 }, { t: 'F', x: 0.7, y: 0, z: 0.7 }, { t: 'F', x: -0.7, y: 0, z: 0.7 }, { t: 'F', x: -0.7, y: 0, z: -0.7 }, { t: 'F', x: 0.7, y: 0, z: -0.7 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[1, 0, 0], [0, 0, 1]]
  },
  'IF₅': {
    atoms: [{ t: 'I', x: 0, y: -0.1, z: 0 }, { t: 'F', x: 0, y: 0.9, z: 0 }, { t: 'F', x: 0.75, y: 0, z: 0.75 }, { t: 'F', x: -0.75, y: 0, z: 0.75 }, { t: 'F', x: -0.75, y: 0, z: -0.75 }, { t: 'F', x: 0.75, y: 0, z: -0.75 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[1, 0, 0], [0, 0, 1]]
  },
  'XeOF₄': {
    atoms: [{ t: 'Xe', x: 0, y: -0.1, z: 0 }, { t: 'O', x: 0, y: 0.85, z: 0 }, { t: 'F', x: 0.7, y: 0, z: 0.7 }, { t: 'F', x: -0.7, y: 0, z: 0.7 }, { t: 'F', x: -0.7, y: 0, z: -0.7 }, { t: 'F', x: 0.7, y: 0, z: -0.7 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
    planeNormals: [[1, 0, 0], [0, 0, 1]]
  },
  'XeF₄': {
    atoms: [{ t: 'Xe', x: 0, y: 0, z: 0 }, { t: 'F', x: 0.85, y: 0, z: 0.85 }, { t: 'F', x: -0.85, y: 0, z: 0.85 }, { t: 'F', x: -0.85, y: 0, z: -0.85 }, { t: 'F', x: 0.85, y: 0, z: -0.85 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  '[PtCl₄]²⁻': {
    atoms: [{ t: 'Pt', x: 0, y: 0, z: 0 }, { t: 'Cl', x: 0.9, y: 0, z: 0.9 }, { t: 'Cl', x: -0.9, y: 0, z: 0.9 }, { t: 'Cl', x: -0.9, y: 0, z: -0.9 }, { t: 'Cl', x: 0.9, y: 0, z: -0.9 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'ICl₄⁻': {
    atoms: [{ t: 'I', x: 0, y: 0, z: 0 }, { t: 'Cl', x: 0.9, y: 0, z: 0.9 }, { t: 'Cl', x: -0.9, y: 0, z: 0.9 }, { t: 'Cl', x: -0.9, y: 0, z: -0.9 }, { t: 'Cl', x: 0.9, y: 0, z: -0.9 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'XeF₂': {
    atoms: [{ t: 'Xe', x: 0, y: 0, z: 0 }, { t: 'F', x: -0.95, y: 0, z: 0 }, { t: 'F', x: 0.95, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'I₃⁻': {
    atoms: [{ t: 'I', x: 0, y: 0, z: 0 }, { t: 'I', x: -1.0, y: 0, z: 0 }, { t: 'I', x: 1.0, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  },
  'IF₂⁻': {
    atoms: [{ t: 'I', x: 0, y: 0, z: 0 }, { t: 'F', x: -0.95, y: 0, z: 0 }, { t: 'F', x: 0.95, y: 0, z: 0 }],
    bonds: [[0, 1], [0, 2]],
    planeNormals: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
  }
};

export const VSEPR_SHAPES: VseprShape[] = [
  {
    key: 'linear', name: 'Linear (直線型)', steric: 2, lone: 0, angle: '180°', pg: 'D∞h / C∞v',
    hybrid: 'sp', hybridDesc: '中心原子使用 1 個 s 軌域 + 1 個 p 軌域混成出 2 個 sp 軌域，呈直線方向。剩餘 2 個純 p 軌域各形成 π 鍵（如 CO₂ 的雙鍵）。',
    desc: '中心原子無孤對電子，兩個鍵結區域拉至最遠，所有原子排列呈一條直線。',
    lpEffect: '無孤對電子排擠作用，幾何鍵角為完美的 180°。',
    examples: [
      { f: 'CO₂', n: '二氧化碳', note: 'D∞h 對稱，具兩組碳氧雙鍵' },
      { f: 'BeCl₂', n: '二氯化鈹', note: '中心鈹原子僅 4 顆價電子' },
      { f: 'C₂H₂', n: '乙炔', note: '直線型有機高對稱分子' }
    ],
    draw: (ctx, cx, cy) => {
      ctx.beginPath(); ctx.moveTo(cx - 30, cy); ctx.lineTo(cx + 30, cy);
      ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = '#404040'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 30, cy, 7, 0, Math.PI * 2); ctx.fillStyle = '#FF0D0D'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 30, cy, 7, 0, Math.PI * 2); ctx.fillStyle = '#FF0D0D'; ctx.fill();
    }
  },
  {
    key: 'trigonal_planar', name: 'Trigonal planar (平面三角)', steric: 3, lone: 0, angle: '120°', pg: 'D₃h',
    hybrid: 'sp²', hybridDesc: '中心原子使用 1 個 s + 2 個 p 軌域混成出 3 個 sp² 軌域，在同一平面呈 120° 放射。剩餘 1 個純 p 軌域垂直分子平面，可形成 π 鍵或保持空著（路易士酸）。',
    desc: '中心原子無孤對電子，三個鍵結對均勻拉開至平面三角形的三個頂點。',
    lpEffect: '完全對稱，每個鍵角均呈現完美的 120°。',
    examples: [
      { f: 'BF₃', n: '三氟化硼', note: '缺電子硼原子，120度對稱' },
      { f: 'SO₃', n: '三氧化硫', note: 'S與O雙鍵平面共振' },
      { f: 'AlCl₃', n: '三氯化鋁', note: '常呈路易士酸性化合物' }
    ],
    draw: (ctx, cx, cy) => {
      const angles = [-90, 30, 150];
      angles.forEach(a => {
        const rad = a * Math.PI / 180;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 26 * Math.cos(rad), cy + 26 * Math.sin(rad));
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2.5; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#FFB5B5'; ctx.fill();
      angles.forEach(a => {
        const rad = a * Math.PI / 180;
        ctx.beginPath(); ctx.arc(cx + 26 * Math.cos(rad), cy + 26 * Math.sin(rad), 7, 0, Math.PI * 2);
        ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 'bent_3', name: 'Bent (角形/3區域)', steric: 3, lone: 1, angle: '<120°', pg: 'C₂v',
    hybrid: 'sp²', hybridDesc: '中心原子為 sp² 混成：2 個 sp² 軌域形成鍵結，1 個 sp² 軌域容納孤對電子。孤對電子佔據平面內位置，將鍵角從 120° 往內壓縮。',
    desc: '具有兩個鍵結對與一對孤對電子，孤對電子較大的排斥力壓縮了鍵角。',
    lpEffect: '一對孤對電子的雲團將底部的鍵角由 120° 往下壓縮（例如 SO₂ 約 119°）。',
    examples: [
      { f: 'SO₂', n: '二氧化硫', note: '夾角約 119°，含有1對孤對電子' },
      { f: 'O₃', n: '臭氧', note: '分子內共振，夾角約 117°' },
      { f: 'SnCl₂', n: '二氯化錫', note: '錫上孤對電子，氣態約 95°' }
    ],
    draw: (ctx, cx, cy) => {
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx - 24, cy - 16);
      ctx.moveTo(cx, cy + 4); ctx.lineTo(cx + 24, cy - 16);
      ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy + 4, 11, 0, Math.PI * 2); ctx.fillStyle = '#FFFF30'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 24, cy - 16, 7, 0, Math.PI * 2); ctx.fillStyle = '#1FEF1F'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 24, cy - 16, 7, 0, Math.PI * 2); ctx.fillStyle = '#1FEF1F'; ctx.fill();
    }
  },
  {
    key: 'tetrahedral', name: 'Tetrahedral (四面體)', steric: 4, lone: 0, angle: '109.5°', pg: 'Td',
    hybrid: 'sp³', hybridDesc: '中心原子使用 1 個 s + 3 個 p 軌域混成出 4 個等能 sp³ 軌域，指向正四面體四個頂點（鍵角 109.5°）。每個 sp³ 軌域與配位原子形成 σ 鍵。',
    desc: '中心原子無孤對電子，四個鍵結對均勻拉開，直指正四面體的四個頂點。',
    lpEffect: '完全對稱，空間鍵角均呈現完美的 109.5°。',
    examples: [
      { f: 'CH₄', n: '甲烷', note: '標準 Td 對稱空間結構' },
      { f: 'CCl₄', n: '四氯化碳', note: '高度對稱的非極性有機溶劑' },
      { f: 'NH₄⁺', n: '銨離子', note: '與甲烷互為等電子體結構' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx, cy - 26], [cx - 22, cy + 12], [cx + 22, cy + 12]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2.5; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy + 4, 11, 0, Math.PI * 2); ctx.fillStyle = '#404040'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 7, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      });
    }
  },
  {
    key: 'trigonal_pyramid', name: 'Trigonal pyramidal (三角錐)', steric: 4, lone: 1, angle: '107°', pg: 'C₃v',
    hybrid: 'sp³', hybridDesc: '中心原子為 sp³ 混成：3 個 sp³ 軌域形成鍵結，1 個 sp³ 軌域容納孤對電子。孤對電子雲比鍵結電子更龐大，將鍵角從 109.5° 壓縮至約 107°。',
    desc: '中心原子有一對孤對電子。頂部的孤對電子雲向下推擠，形成三角錐體。',
    lpEffect: '一對孤對電子的強排斥作用使鍵角由 109.5° 壓縮至約 107°（如 NH₃）。',
    examples: [
      { f: 'NH₃', n: '氨氣', note: '鍵角約 107°，具強極性特徵' },
      { f: 'PH₃', n: '磷化氫', note: '中心原子較大，鍵角降至 93°' },
      { f: 'PCl₃', n: '三氯化磷', note: '極性錐形結構錯合物' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx - 22, cy + 16], [cx + 22, cy + 16], [cx, cy - 22]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy + 2, 11, 0, Math.PI * 2); ctx.fillStyle = '#3050F8'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 7, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      });
    }
  },
  {
    key: 'bent_4', name: 'Bent (角形/4區域)', steric: 4, lone: 2, angle: '104.5°', pg: 'C₂v',
    hybrid: 'sp³', hybridDesc: '中心原子為 sp³ 混成：2 個 sp³ 軌域形成鍵結，另外 2 個 sp³ 軌域各容納一對孤對電子。兩對孤對電子雙重壓迫，鍵角被推擠至約 104.5°，明顯小於正四面體的 109.5°。',
    desc: '具有兩個鍵與兩對孤對電子。兩對孤對電子的極強推擠力顯著壓縮鍵角。',
    lpEffect: '兩對孤對電子雲雙重壓迫，鍵角被顯著推擠至約 104.5°。',
    examples: [
      { f: 'H₂O', n: '水分子', note: '理論鍵角 104.5°' },
      { f: 'H₂S', n: '硫化氫', note: '中心 S 原子大，夾角為 92.1°' },
      { f: 'OF₂', n: '二氟化氧', note: '氟強拉電子，鍵角約 103°' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx - 26, cy - 12], [cx + 26, cy - 12]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2.5; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy + 4, 11, 0, Math.PI * 2); ctx.fillStyle = '#FF0D0D'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 7, 0, Math.PI * 2); ctx.fillStyle = '#FFFFFF'; ctx.fill();
      });
    }
  },
  {
    key: 'trigonal_bipyramidal', name: 'Trigonal bipyramidal (三方雙錐)', steric: 5, lone: 0, angle: '90°/120°', pg: 'D₃h',
    desc: '五個鍵結對：三個在赤道平面（夾角120°），兩個在軸向位置（與赤道面夾90°）。',
    lpEffect: '無孤對電子。軸向與赤道鍵長稍有不同（軸向鍵通常較長）。',
    examples: [
      { f: 'PCl₅', n: '五氯化磷', note: '軸向Cl鍵長（219pm）大於赤道鍵' },
      { f: 'PF₅', n: '五氟化磷', note: '貝里假旋轉快速交換軸/赤向' },
      { f: 'AsF₅', n: '五氟化砷', note: '強路易士酸，D3h空間對稱' }
    ],
    draw: (ctx, cx, cy) => {
      const equatorial = [-90, 30, 150];
      equatorial.forEach(a => {
        const rad = a * Math.PI / 180;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 26 * Math.cos(rad), cy + 26 * Math.sin(rad));
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 26);
      ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 20);
      ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();

      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#FF8000'; ctx.fill();
      equatorial.forEach(a => {
        const rad = a * Math.PI / 180;
        ctx.beginPath(); ctx.arc(cx + 26 * Math.cos(rad), cy + 26 * Math.sin(rad), 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1FEF1F'; ctx.fill();
      });
      ctx.beginPath(); ctx.arc(cx, cy - 26, 6, 0, Math.PI * 2); ctx.fillStyle = '#1FEF1F'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy + 20, 6, 0, Math.PI * 2); ctx.fillStyle = '#1FEF1F'; ctx.fill();
    }
  },
  {
    key: 'seesaw', name: 'Seesaw (蹺蹺板)', steric: 5, lone: 1, angle: '<90°/<120°', pg: 'C₂v',
    desc: '四個鍵結與一個孤對電子。孤對電子優先佔據空間較寬裕的「赤道」位置。',
    lpEffect: '赤道孤對電子推擠其餘四顆配位基，使夾角皆小於理想值。',
    examples: [
      { f: 'SF₄', n: '四氟化硫', note: '極活潑的氟化試劑，蹺蹺板幾何' },
      { f: 'IF₄⁺', n: '四氟化碘陽離子', note: '非對稱四配位超價離子' },
      { f: 'XeO₂F₂', n: '二氟二氧化氙', note: '惰性氣體極性分子' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx, cy - 24], [cx, cy + 20], [cx - 22, cy + 8], [cx + 22, cy + 8]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#FFFF30'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 't_shape', name: 'T-shape (T形)', steric: 5, lone: 2, angle: '<90°', pg: 'C₂v',
    desc: '三個鍵結與兩對孤對電子。兩對孤對電子皆位於赤道平面，迫使另外三個原子呈T形。',
    lpEffect: '兩組赤道孤對電子往兩側擠壓，使垂直軸夾角小於完美的 90°。',
    examples: [
      { f: 'ClF₃', n: '三氟化氯', note: '極強氧化劑，夾角約 87.5°' },
      { f: 'BrF₃', n: '三氟化溴', note: '室溫下為強腐蝕液體' },
      { f: 'IF₃', n: '三氟化碘', note: '不穩定超價鹵素互化物' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx, cy - 22], [cx - 22, cy + 4], [cx + 22, cy + 4]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy + 4, 11, 0, Math.PI * 2); ctx.fillStyle = '#1FEF1F'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 'octahedral', name: 'Octahedral (正八面體)', steric: 6, lone: 0, angle: '90°', pg: 'Oh',
    desc: '六個鍵結對指向正八面體的六個頂點，空間極高度對稱對稱。',
    lpEffect: '無孤對電子。各原子位置在幾何上完全等效，夾角皆為理想 90°。',
    examples: [
      { f: 'SF₆', n: '六氟化硫', note: '高絕緣惰性氣體，Oh點群' },
      { f: 'Mo(CO)₆', n: '六羰基鉬', note: '過渡金屬配位八面體' },
      { f: '[Co(NH₃)₆]³⁺', n: '六氨合鈷離子', note: '經典八面體配位錯合物' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx - 24, cy], [cx + 24, cy], [cx, cy - 24], [cx, cy + 24], [cx - 16, cy - 12], [cx + 16, cy + 12]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#FFFF30'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 'square_pyramid', name: 'Square pyramidal (四方錐)', steric: 6, lone: 1, angle: '<90°', pg: 'C₄v',
    desc: '五個鍵結與一個孤對電子。頂端為軸向原子，底面四個原子在同一平面呈四方形。',
    lpEffect: '底部一組孤對電子由底向上推擠，使赤道-軸向夾角小於 90°。',
    examples: [
      { f: 'BrF₅', n: '五氟化溴', note: '超價鹵素極性四方錐' },
      { f: 'IF₅', n: '五氟化碘', note: '常溫為無色發煙液體' },
      { f: 'XeOF₄', n: '四氟氧化氙', note: '平面赤道為氟，頂端為氧雙鍵' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx - 20, cy + 14], [cx + 20, cy + 14], [cx - 20, cy - 8], [cx + 20, cy - 8], [cx, cy - 26]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy - 4, 11, 0, Math.PI * 2); ctx.fillStyle = '#A72C15'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 'square_planar', name: 'Square planar (平面正方形)', steric: 6, lone: 2, angle: '90°', pg: 'D₄h',
    desc: '四個鍵與兩對孤對電子。兩對孤對電子在軸向位置上下拉開相互抵消，剩餘四原子呈平面正方形。',
    lpEffect: '兩側孤對電子對抗完美抵消，使赤道夾角保持為精確的 90°。',
    examples: [
      { f: 'XeF₄', n: '四氟化氙', note: '第一個人工合成的二元惰性氣體化物' },
      { f: '[PtCl₄]²⁻', n: '四氯合鉑酸根', note: '過渡金屬 d8 平面正方形配位' },
      { f: 'ICl₄⁻', n: '四氯合碘酸根', note: '超價陰離子高對稱結構' }
    ],
    draw: (ctx, cx, cy) => {
      const nodes = [[cx - 22, cy], [cx + 22, cy], [cx, cy - 22], [cx, cy + 22]];
      nodes.forEach(n => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(n[0], n[1]);
        ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#429EB0'; ctx.fill();
      nodes.forEach(n => {
        ctx.beginPath(); ctx.arc(n[0], n[1], 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      });
    }
  },
  {
    key: 'linear_5', name: 'Linear (5對區域直線)', steric: 5, lone: 3, angle: '180°', pg: 'D∞h',
    desc: '兩個鍵與三對孤對電子。三組孤對電子平鋪在赤道平面（夾角120°），軸向兩個原子與中心呈一條直線。',
    lpEffect: '赤道三個孤對電子雲團對稱抵消，軸向夾角維持 180°。',
    examples: [
      { f: 'XeF₂', n: '二氟化氙', note: '高氧化力直線型超價氟化物' },
      { f: 'I₃⁻', n: '三碘陰離子', note: '經典碘液共振線性複雜陰離子' },
      { f: 'IF₂⁻', n: '二氟碘酸陰離子', note: '對稱 D∞h 超價鹵素化合物' }
    ],
    draw: (ctx, cx, cy) => {
      ctx.beginPath(); ctx.moveTo(cx - 28, cy); ctx.lineTo(cx + 28, cy);
      ctx.strokeStyle = '#AAAAAA'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fillStyle = '#429EB0'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx - 28, cy, 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + 28, cy, 6, 0, Math.PI * 2); ctx.fillStyle = '#90E050'; ctx.fill();
    }
  }
];