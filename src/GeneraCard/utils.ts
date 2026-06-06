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

// 根據鄰近成鍵方向向量精準消耗價電子點，提昇路易士結構式的視覺對齊度
export function getElectronDots(
  atom: AtomInPlay,
  bonds: BondInPlay[],
  allAtomsInPlay: AtomInPlay[] = []
): ElectronDot[] {
  const cpkInfo = CPK[atom.symbol] || { fill: '#CCC', stroke: '#999', text: '#000', valence: 4 };
  const v = cpkInfo.valence;
  const r = (atom.symbol === 'H' ? 18 : 25) + 11;
  const dots: ElectronDot[] = [];

  // 1. 初始化所有價電子點的位置 (呈對稱分佈)
  for (let i = 0; i < v; i++) {
    const angle = (i / v) * Math.PI * 2 - Math.PI / 2;
    dots.push({
      angle,
      x: atom.x + Math.cos(angle) * r,
      y: (atom.displayY !== undefined ? atom.displayY : atom.y) + Math.sin(angle) * r,
      used: false,
    });
  }

  // 2. 找出所有與該原子相連的鍵結，並計算對應配位子的成鍵弧度
  const connectedBonds = bonds.filter(b => b[0] === atom.id || b[1] === atom.id);
  const bondAngles: number[] = [];

  connectedBonds.forEach(bond => {
    const partnerId = bond[0] === atom.id ? bond[1] : bond[0];
    const partner = allAtomsInPlay.find(a => a.id === partnerId);
    if (partner) {
      const py = partner.displayY !== undefined ? partner.displayY : partner.y;
      const ay = atom.displayY !== undefined ? atom.displayY : atom.y;
      
      // 計算中心到外圍的角度
      const angle = Math.atan2(py - ay, partner.x - atom.x);
      
      // 依鍵結類型決定要消耗幾顆電子
      const order = bond[2] === 'triple' ? 3 : bond[2] === 'double' ? 2 : 1;
      for (let k = 0; k < order; k++) {
        bondAngles.push(angle);
      }
    }
  });

  // 3. 貪婪匹配：將角度最接近成鍵向量的電子點標記為 used
  bondAngles.forEach(targetAngle => {
    let bestDotIndex = -1;
    let minDiff = Infinity;

    dots.forEach((dot, idx) => {
      if (!dot.used) {
        let diff = Math.abs(dot.angle - targetAngle);
        while (diff > Math.PI) {
          diff = Math.PI * 2 - diff;
        }
        if (diff < minDiff) {
          minDiff = diff;
          bestDotIndex = idx;
        }
      }
    });

    if (bestDotIndex !== -1) {
      dots[bestDotIndex].used = true;
    }
  });

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