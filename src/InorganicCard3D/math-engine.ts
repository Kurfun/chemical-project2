// ════════════════════════════════════════════════════════════════
//  math-engine.ts — 純幾何計算與 Canvas 渲染引擎 (無狀態純函數)
// ════════════════════════════════════════════════════════════════

import { CPK, RADII } from './constants';
import type { RenderParams } from './types2';

/**
 * 透過 Gram-Schmidt 正交化，將法向量轉換為對稱面在 3D 空間的四角端點
 */
export function getPlaneVertices(normal: number[], size: number = 1.35): number[][] | null {
  let [nx, ny, nz] = normal;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len === 0) return null;
  nx /= len; ny /= len; nz /= len;

  let ux = Math.abs(nx) < 0.9 ? 1 : 0;
  let uy = ux === 0 ? 1 : 0;
  let uz = 0;

  let tx = uy * nz - uz * ny;
  let ty = uz * nx - ux * nz;
  let tz = ux * ny - uy * nx;
  const tlen = Math.sqrt(tx * tx + ty * ty + tz * tz);
  ux = tx / tlen; uy = ty / tlen; uz = tz / tlen;

  let vx = ny * uz - nz * uy;
  let vy = nz * ux - nx * uz;
  let vz = nx * uy - ny * ux;

  ux *= size; uy *= size; uz *= size;
  vx *= size; vy *= size; vz *= size;

  return [
    [-ux - vx, -uy - vy, -uz - vz],
    [ ux - vx,  uy - vy,  uz - vz],
    [ ux + vx,  uy + vy,  uz + vz],
    [-ux + vx, -uy + vy, -uz + vz],
  ];
}

/**
 * 3D 空間座標 → 2D 透視投影投影 (含雙軸旋轉與深度緩衝資訊)
 */
export function project(
  x: number, y: number, z: number,
  width: number, height: number,
  rotX: number, rotY: number
) {
  const SCALE = 115, FOV = 4;
  const CX = width / 2, CY = height / 2;

  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;

  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  const sf = SCALE * FOV / (FOV + z2 + 2);
  return { x: CX + x1 * sf, y: CY - y2 * sf, depth: z2 };
}

/**
 * 繪製空白狀態的背景提示
 */
export function drawPlaceholder(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(26,58,92,0.08)';
  ctx.font = '500 14px DM Sans';
  ctx.textAlign = 'center';
  ctx.fillText('← 請從右側選擇分子點群', canvas.width / 2, canvas.height / 2 - 10);
  ctx.fillText('即可即時進行 3D 互動檢視',  canvas.width / 2, canvas.height / 2 + 14);
  ctx.textAlign = 'left';
}

/**
 * 畫家演算法主渲染邏輯 (Painter's Algorithm)
 */
export function renderMolecule({
  canvas,
  ctx,
  currentKey,
  rotX,
  rotY,
  layers,
  moleculeData
}: RenderParams): void {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (!currentKey) { 
    drawPlaceholder(canvas, ctx); 
    return; 
  }

  const mol = moleculeData[currentKey];
  if (!mol) { 
    drawPlaceholder(canvas, ctx); 
    return; 
  }

  const { width, height } = canvas;

  // 1. 投影所有分子中的原子頂點
  const proj = mol.atoms.map(a => {
    const p = project(a.x, a.y, a.z, width, height, rotX, rotY);
    return { ...a, sx: p.x, sy: p.y, depth: p.depth };
  });

  const drawQueue: Array<{ depth: number; draw: () => void }> = [];

  // ── A. 繪製化學鍵 ──
  mol.bonds.forEach(([i, j]) => {
    const a1 = proj[i];
    const a2 = proj[j];
    if (!a1 || !a2) return;
    drawQueue.push({
      depth: (a1.depth + a2.depth) / 2,
      draw: () => {
        ctx.beginPath();
        ctx.moveTo(a1.sx, a1.sy);
        ctx.lineTo(a2.sx, a2.sy);
        ctx.strokeStyle = '#CCDDF0';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.stroke();
      },
    });
  });

  // ── B. 繪製原子 CPK 實體球與高光 ──
  proj.forEach(a => {
    drawQueue.push({
      depth: a.depth,
      draw: () => {
        const baseR = RADII[a.t] || 18;
        const r = baseR * (4 / (4 + a.depth + 2));

        ctx.beginPath();
        ctx.arc(a.sx, a.sy, r, 0, Math.PI * 2);
        ctx.fillStyle = CPK[a.t] || '#CCCCCC';
        ctx.fill();

        ctx.strokeStyle = 'rgba(26,58,92,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(a.sx - r * 0.28, a.sy - r * 0.28, r * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fill();
      },
    });
  });

  // ── C. 繪製主要旋轉軸 Cₙ ──
  if (layers.cn) {
    const top = project(0, 1.5, 0, width, height, rotX, rotY);
    const bot = project(0, -1.5, 0, width, height, rotX, rotY);
    drawQueue.push({
      depth: Math.max(top.depth, bot.depth) + 0.1,
      draw: () => {
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.strokeStyle = 'rgba(26,86,160,0.75)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        ctx.fillStyle = '#1A56A0';
        ctx.font = 'bold 11px DM Sans';
        ctx.fillText('Cₙ', top.x + 7, top.y + 4);
      },
    });
  }

  // ── D. 繪製對稱鏡面 σ ──
  const PLANE_COLORS = [
    [26,  86, 160],   // 藍面
    [210, 70,  70],   // 紅面
    [74, 122, 160],   // 綠藍面
    [151,196,  89],   // 綠面
  ];
  if (layers.sigma && mol.planeNormals && mol.planeNormals.length > 0) {
    mol.planeNormals.forEach((normal, pIdx) => {
      const corners3D = getPlaneVertices(normal);
      if (!corners3D) return;
      const corners = corners3D.map(pt => project(pt[0], pt[1], pt[2], width, height, rotX, rotY));
      const [r, g, b] = PLANE_COLORS[pIdx % PLANE_COLORS.length]!;
      const avgDepth = corners.reduce((sum, c) => sum + c.depth, 0) / 4 - 0.15;

      drawQueue.push({
        depth: avgDepth,
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(corners[0]!.x, corners[0]!.y);
          corners.slice(1).forEach(c => ctx.lineTo(c.x, c.y));
          ctx.closePath();
          ctx.fillStyle   = `rgba(${r},${g},${b},0.12)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        },
      });
    });
  }

  // ── E. 繪製反轉中心 i ──
  if (layers.i) {
    const c = project(0, 0, 0, width, height, rotX, rotY);
    drawQueue.push({
      depth: c.depth + 0.2,
      draw: () => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 17, 0, Math.PI * 2);
        ctx.strokeStyle = '#4A7AA0';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#4A7AA0';
        ctx.font = 'bold 11px DM Sans';
        ctx.fillText('i', c.x + 20, c.y + 4);
      },
    });
  }

  // 2. 依照 Z-depth 深度自遠至近進行排序重繪
  drawQueue.sort((a, b) => b.depth - a.depth).forEach(item => item.draw());
}