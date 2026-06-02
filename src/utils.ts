import { CPK } from './constants2';
import type { AtomInPlay, BondInPlay, ElectronDot } from './type4';

// 二維點旋轉矩陣運算
export function rotatePoint(
  x: number,
  y: number,
  angle: number,
  cx: number,
  cy: number
): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - cx;
  const dy = y - cy;
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  };
}

// 3D 空間坐標正交投影
export function projectModal(
  x: number,
  y: number,
  z: number,
  rotX: number,
  rotY: number,
  width: number,
  height: number
): { x: number; y: number; depth: number } {
  const SCALE = 42;
  const FOV = 4;
  const CX = width / 2;
  const CY = height / 2;

  // 繞 Y 軸旋轉
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  // 繞 X 軸旋轉
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  const sf = (SCALE * FOV) / (FOV + z2 + 2);
  return {
    x: CX + x1 * sf,
    y: CY - y2 * sf,
    depth: z2,
  };
}

// 根據鏡面法向量動態生成 3D 投影平面多邊形頂點
export function getPlaneVertices(
  normal: [number, number, number],
  size: number = 1.3
): [number, number, number][] | null {
  let [nx, ny, nz] = normal;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len === 0) return null;
  nx /= len;
  ny /= len;
  nz /= len;

  const u_vect = { x: 0, y: 0, z: 0 };
  if (Math.abs(nx) < 0.9) {
    u_vect.x = 1;
  } else {
    u_vect.y = 1;
  }

  const tx = u_vect.y * nz - u_vect.z * ny;
  const ty = u_vect.z * nx - u_vect.x * nz;
  const tz = u_vect.x * ny - u_vect.y * nx;
  const tlen = Math.sqrt(tx * tx + ty * ty + tz * tz);
  u_vect.x = tx / tlen;
  u_vect.y = ty / tlen;
  u_vect.z = tz / tlen;

  let vx = ny * u_vect.z - nz * u_vect.y;
  let vy = nz * u_vect.x - nx * u_vect.z;
  let vz = nx * u_vect.y - ny * u_vect.x;

  const ux = u_vect.x * size;
  const uy = u_vect.y * size;
  const uz = u_vect.z * size;
  vx *= size;
  vy *= size;
  vz *= size;

  return [
    [-ux - vx, -uy - vy, -uz - vz],
    [ux - vx, uy - vy, uz - vz],
    [ux + vx, uy + vy, uz + vz],
    [-ux + vx, -uy + vy, -uz + vz],
  ];
}

// 計算原子的價電子點位置與佔用情況
export function getElectronDots(
  atom: AtomInPlay,
  bonds: BondInPlay[]
): ElectronDot[] {
  const cpkInfo = CPK[atom.symbol] || { fill: '#CCC', stroke: '#999', text: '#000', valence: 4 };
  const v = cpkInfo.valence;
  const r = (atom.symbol === 'H' ? 18 : 25) + 11;
  const dots: ElectronDot[] = [];

  for (let i = 0; i < v; i++) {
    const angle = (i / v) * Math.PI * 2 - Math.PI / 2;
    dots.push({
      angle,
      x: atom.x + Math.cos(angle) * r,
      y: (atom.displayY !== undefined ? atom.displayY : atom.y) + Math.sin(angle) * r,
      used: false,
    });
  }

  const bondCount = bonds
    .filter(b => b[0] === atom.id || b[1] === atom.id)
    .reduce((sum, b) => sum + (b[2] === 'triple' ? 3 : b[2] === 'double' ? 2 : 1), 0);

  for (let i = 0; i < Math.min(bondCount, dots.length); i++) {
    dots[i].used = true;
  }

  return dots;
}

// 輔助計算兩個配位子與中心原子的空間實際鍵角
export function calculateAngle(
  central: AtomInPlay,
  a: AtomInPlay,
  b: AtomInPlay
): number {
  const ay_val = a.displayY !== undefined ? a.displayY : a.y;
  const by_val = b.displayY !== undefined ? b.displayY : b.y;
  const cy_val = central.displayY !== undefined ? central.displayY : central.y;

  const ax = a.x - central.x;
  const ay = ay_val - cy_val;
  const bx = b.x - central.x;
  const by = by_val - cy_val;

  const dot = ax * bx + ay * by;
  const lenA = Math.sqrt(ax * ax + ay * ay) || 1;
  const lenB = Math.sqrt(bx * bx + by * by) || 1;
  const cosA = Math.max(-1, Math.min(1, dot / (lenA * lenB)));
  return Math.round((Math.acos(cosA) * 180) / Math.PI);
}