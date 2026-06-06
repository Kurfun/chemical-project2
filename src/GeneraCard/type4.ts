export interface CPKElement {
  fill: string;
  stroke: string;
  text: string;
  valence: number;
}

export interface ValidationRule {
  type: 'angle' | 'linear' | 'bent';
  targetAtoms: string[];  // 參與檢測的外圍原子符號，例如 ['H', 'H']
  expectedValue: number;   // 理想角度
  tolerance: number;       // 容許偏差（度）
  errorMessage: string;    // 驗證失敗時的自訂警告訊息
}

export interface MoleculeConfig {
  title: string;
  label: string;
  atoms: Record<string, number>;
  centralAtom: string;
  shape: string;
  shapeKey: string;
  hints: [string, string][];
  hintText: string;
  funFact: string;
  eggEmoji: string;
  eggTitle: string;
  xp: number;
  levelLabel: string;
  prog: number;
  progLabel: string;
  validationRules?: ValidationRule[]; // 聲明式幾何驗證規則
}

export interface Atom3D {
  t: string;
  x: number;
  y: number;
  z: number;
}

export interface Molecule3D {
  atoms: Atom3D[];
  bonds: [number, number][];
  planeNormals?: [number, number, number][];
}

export interface ExampleChip {
  f: string;
  n: string;
  note: string;
}

export interface VseprShape {
  key: string;
  name: string;
  steric: number;
  lone: number;
  angle: string;
  pg: string;
  hybrid?: string;
  hybridDesc?: string;
  desc: string;
  lpEffect: string;
  examples: ExampleChip[];
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number) => void;
}

export interface AtomInPlay {
  id: number;
  symbol: string;
  x: number;
  y: number;
  displayY?: number;
  isCentral: boolean;
  targetX?: number;
  targetY?: number;
}

export type BondOrder = 'single' | 'double' | 'triple';
export type BondInPlay = [number, number, BondOrder];

export interface LonePair {
  atomId: number;
  angle: number;
  id: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  decay: number;
  color: string;
  spin: number;
  spinSpeed: number;
}

export interface RepulsionCloud {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  phase: number;
}

export interface StabilityGlow {
  active: boolean;
  strength: number;
  phase: number;
}

export interface ElectronDot {
  angle: number;
  x: number;
  y: number;
  used: boolean;
}