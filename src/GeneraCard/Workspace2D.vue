<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { CPK } from './constants2';
import type { AtomInPlay, BondInPlay, LonePair, Particle, RepulsionCloud, StabilityGlow, BondOrder, MoleculeConfig } from './type4';
import { rotatePoint, getElectronDots, calculateAngle } from './utils';

const props = defineProps<{
  atoms: AtomInPlay[];
  bonds: BondInPlay[];
  lonePairs: LonePair[];
  activeMolecule: MoleculeConfig;
  structureLocked: boolean;
  stabilityGlow: StabilityGlow;
  repulsionCloud: RepulsionCloud;
}>();

const emit = defineEmits<{
  (e: 'update:atoms', val: AtomInPlay[]): void;
  (e: 'update:bonds', val: BondInPlay[]): void;
  (e: 'update:lonePairs', val: LonePair[]): void;
  (e: 'update-angle', info: { visible: boolean; label: string; valStr: string; pct: number; color: string; bg: string }): void;
  (e: 'trigger-repulsion', x: number, y: number): void;
  (e: 'show-feedback', text: string, type: 'success' | 'error' | 'info'): void;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const draggingAtom = ref<AtomInPlay | null>(null);
const selectedDot = ref<{ atomId: number; dotIndex: number; angle: number; wx: number; wy: number } | null>(null);

let rotationAngle = ref<number>(0);
let rotDragStart: { mx: number; my: number; startAngle: number; baseAngle: number } | null = null;
let atomBasePositions: Record<number, { x: number; y: number }> = {};
let particles: Particle[] = [];
let animId: number | null = null;

// 特效粒子生成
function createSparkles(x: number, y: number, color = '#EAF3DE', count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: ((Math.random() - 0.5) * 4) - 1,
      alpha: 1,
      size: Math.random() * 4 + 2,
      decay: Math.random() * 0.02 + 0.015,
      color,
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.1
    });
  }
}

// 物理慣性推移
function resolveElasticPhysics() {
  props.atoms.forEach(a => {
    if (a.targetX !== undefined && a.targetY !== undefined) {
      const dx = a.targetX - a.x;
      const dy = a.targetY - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) {
        a.x += dx * 0.15;
        a.y += dy * 0.15;
      } else {
        a.x = a.targetX;
        a.y = a.targetY;
        delete a.targetX;
        delete a.targetY;
      }
    }
  });
}

function getCanvasXY(e: { clientX: number; clientY: number }, canvasElement: HTMLCanvasElement) {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// 提升手機端點擊原子的容錯度 (r + 12 讓粗手指也能輕鬆點選)
function hitTestAtom(mx: number, my: number) {
  return props.atoms.find(atom => {
    const r = atom.symbol === 'H' ? 18 : 25;
    const dy = atom.displayY !== undefined ? atom.displayY : atom.y;
    return Math.sqrt((atom.x - mx) ** 2 + (dy - my) ** 2) < r + 12;
  });
}

// 手指觸控優化：將點擊判定半徑從 9px 大幅擴展到 22px！解決手機難以點選電子點拉線的硬傷
function hitTestDot(mx: number, my: number) {
  for (const atom of props.atoms) {
    const dots = getElectronDots(atom, props.bonds, props.atoms);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      // 將 2D 平面距離判定放寬至 22px，指尖操作極度絲滑！
      if (Math.sqrt((d.x - mx) ** 2 + (d.y - my) ** 2) < 22) {
        return { atomId: atom.id, dotIndex: i, angle: d.angle, wx: d.x, wy: d.y, used: d.used };
      }
    }
  }
  return null;
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return;
  
  // 阻斷瀏覽器的預設滑動干擾，防範手機下拉刷新
  if (e.cancelable) e.preventDefault();

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const { x: mx, y: my } = getCanvasXY({ clientX, clientY }, canvasRef.value);

  if (props.structureLocked) {
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    const startAngle = Math.atan2(my - cy, mx - cx);
    rotDragStart = { mx, my, startAngle, baseAngle: rotationAngle.value };
    return;
  }

  const dotHit = hitTestDot(mx, my);
  if (dotHit) {
    if (!selectedDot.value) {
      selectedDot.value = dotHit;
    } else if (selectedDot.value.atomId !== dotHit.atomId) {
      const a1 = props.atoms.find(a => a.id === selectedDot.value!.atomId);
      const a2 = props.atoms.find(a => a.id === dotHit.atomId);
      if (a1 && a2) {
        if (a1.symbol === 'H' && a2.symbol === 'H') {
          emit('trigger-repulsion', (a1.x + a2.x) / 2, (a1.y + a2.y) / 2);
          emit('show-feedback', '❌ 鍵結錯誤！H 原子不能與另一個 H 直接連結！', 'error');
        } else {
          const freeOnA1 = getElectronDots(a1, props.bonds, props.atoms).filter(d => !d.used).length;
          const freeOnA2 = getElectronDots(a2, props.bonds, props.atoms).filter(d => !d.used).length;
          const canForm = Math.min(freeOnA1, freeOnA2, 1);
          if (canForm > 0) {
            toggleBond(a1.id, a2.id, 'single');
            createSparkles((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#B5D4F4', 8);
          } else {
            emit('show-feedback', '⚠️ 沒有足夠的自由電子可以形成鍵結', 'error');
          }
        }
      }
      selectedDot.value = null;
    } else {
      selectedDot.value = null;
    }
    return;
  }

  const clicked = hitTestAtom(mx, my);
  if (clicked) {
    draggingAtom.value = clicked;
    selectedDot.value = null;
  } else {
    selectedDot.value = null;
  }
}

function onPointerMove(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return;

  // 阻止手機端背景滾動干擾
  if (e.cancelable) e.preventDefault();

  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const { x: mx, y: my } = getCanvasXY({ clientX, clientY }, canvasRef.value);

  if (props.structureLocked && rotDragStart) {
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    const curAngle = Math.atan2(my - cy, mx - cx);
    const delta = curAngle - rotDragStart.startAngle;
    rotationAngle.value = rotDragStart.baseAngle + delta;
    applyRotation();
    return;
  }

  if (!draggingAtom.value || props.structureLocked) return;
  draggingAtom.value.x = Math.max(25, Math.min(canvasRef.value.width - 25, mx));
  draggingAtom.value.y = Math.max(25, Math.min(canvasRef.value.height - 25, my));
}

function onPointerUp() {
  draggingAtom.value = null;
  rotDragStart = null;
}

function toggleBond(id1: number, id2: number, order: BondOrder) {
  const bondsCopy = [...props.bonds];
  const idx = bondsCopy.findIndex(b => (b[0] === id1 && b[1] === id2) || (b[0] === id2 && b[1] === id1));
  if (idx > -1) {
    const cur = bondsCopy[idx][2] || 'single';
    if (cur === 'single') bondsCopy[idx][2] = 'double';
    else if (cur === 'double') bondsCopy[idx][2] = 'triple';
    else bondsCopy.splice(idx, 1);
  } else {
    bondsCopy.push([id1, id2, order]);
  }
  emit('update:bonds', bondsCopy);
}

function applyRotation() {
  if (!canvasRef.value) return;
  const cx = canvasRef.value.width / 2;
  const cy = canvasRef.value.height / 2;
  const atomsCopy = props.atoms.map(a => {
    const base = atomBasePositions[a.id];
    if (!base) return a;
    const p = rotatePoint(base.x, base.y, rotationAngle.value, cx, cy);
    return { ...a, x: p.x, y: p.y };
  });
  emit('update:atoms', atomsCopy);
}

function saveBasePositions() {
  atomBasePositions = {};
  props.atoms.forEach(a => {
    atomBasePositions[a.id] = { x: a.x, y: a.y };
  });
}

function updateAngleDisplay() {
  const central = props.atoms.find(a => a.symbol === props.activeMolecule.centralAtom);
  const outers = props.atoms.filter(a => a.symbol !== props.activeMolecule.centralAtom);

  if (!central || outers.length < 2) {
    emit('update-angle', { visible: false, label: '', valStr: '—', pct: 0, color: '#1a3a6e', bg: '#1a3a6e' });
    return;
  }

  const deg = calculateAngle(central, outers[0], outers[1]);
  const pct = Math.max(0, Math.min(100, ((deg - 90) / 90) * 100));

  const idealAngleText = props.activeMolecule.hints.find(h => h[0].includes('鍵角') || h[0].includes('bond') || h[0].toLowerCase().includes('angle'))?.[1] || '109.5';
  const ideal = parseFloat(idealAngleText) || 109.5;
  const diff = Math.abs(deg - ideal);

  let color = '#1a3a6e';
  let bg = '#1a3a6e';
  if (diff < 8) {
    bg = '#c8a84b';
  } else if (diff < 18) {
    bg = '#8a8070';
    color = '#8a8070';
  } else {
    bg = '#b33939';
    color = '#b33939';
  }

  emit('update-angle', {
    visible: true,
    label: '實時鍵角',
    valStr: `${deg}°`,
    pct,
    color,
    bg
  });
}

function drawWorkspace() {
  const canvasElement = canvasRef.value;
  if (!canvasElement) return;
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (props.structureLocked) {
    ctx.save();
    ctx.font = '11px Georgia, "Noto Serif TC", serif';
    ctx.fillStyle = 'rgba(26,58,110,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('☞ 拖動旋轉分子觀察對稱結構', canvasElement.width / 2, canvasElement.height - 10);
    ctx.restore();
  }

  // 1. 繪製化學鍵
  props.bonds.forEach(([id1, id2, order]) => {
    const a1 = props.atoms.find(a => a.id === id1);
    const a2 = props.atoms.find(a => a.id === id2);
    if (!a1 || !a2) return;
    const x1 = a1.x;
    const y1 = a1.displayY !== undefined ? a1.displayY : a1.y;
    const x2 = a2.x;
    const y2 = a2.displayY !== undefined ? a2.displayY : a2.y;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const bondColor = props.stabilityGlow.active ? '#c8a84b' : '#1a3a6e';
    const gaps = { single: [0], double: [-5, 5], triple: [-9, 0, 9] };
    const offsets = gaps[order || 'single'] || gaps.single;

    offsets.forEach(off => {
      ctx.beginPath();
      ctx.moveTo(x1 + nx * off, y1 + ny * off);
      ctx.lineTo(x2 + nx * off, y2 + ny * off);
      ctx.strokeStyle = bondColor;
      ctx.lineWidth = off === 0 && offsets.length === 1 ? 8 : 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
    });
  });

  // 2. 繪製已解鎖的自動孤對電子
  props.lonePairs.forEach(lp => {
    const atom = props.atoms.find(a => a.id === lp.atomId);
    if (!atom) return;
    const r = atom.symbol === 'H' ? 18 : 25;
    const rad = (lp.angle * Math.PI) / 180;
    const dist = r + 11;
    const cx = atom.x + Math.cos(rad) * dist;
    const cy = (atom.displayY !== undefined ? atom.displayY : atom.y) + Math.sin(rad) * dist;
    const perpX = -Math.sin(rad) * 4;
    const perpY = Math.cos(rad) * 4;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx - perpX, cy - perpY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a3a6e';
    ctx.globalAlpha = 0.82;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + perpX, cy + perpY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#1a3a6e';
    ctx.fill();
    ctx.restore();
  });

  // 3. 繪製球狀 CPK 原子體
  props.atoms.forEach(atom => {
    const scheme = CPK[atom.symbol] || { fill: '#CCC', stroke: '#999', text: '#000' };
    const radius = atom.symbol === 'H' ? 18 : 25;
    const dy = atom.displayY !== undefined ? atom.displayY : atom.y;

    if (props.stabilityGlow.active) {
      ctx.beginPath();
      ctx.arc(atom.x, dy, radius + 8, 0, Math.PI * 2);
      const radGrad = ctx.createRadialGradient(atom.x, dy, radius, atom.x, dy, radius + 8);
      radGrad.addColorStop(0, 'rgba(200, 168, 75, 0.4)');
      radGrad.addColorStop(1, 'rgba(200, 168, 75, 0)');
      ctx.fillStyle = radGrad;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(atom.x, dy, radius, 0, Math.PI * 2);
    ctx.fillStyle = scheme.fill;
    ctx.fill();
    ctx.strokeStyle = scheme.stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(atom.x - radius * 0.3, dy - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    ctx.fillStyle = scheme.text;
    ctx.font = 'bold 12px "Noto Serif TC", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(atom.symbol, atom.x, dy);
  });

  // 4. 繪製原子外環價電子點
  if (!props.structureLocked) {
    props.atoms.forEach(atom => {
      const dots = getElectronDots(atom, props.bonds, props.atoms);
      dots.forEach((d, i) => {
        const isSelected = selectedDot.value && selectedDot.value.atomId === atom.id && selectedDot.value.dotIndex === i;
        const r = d.used ? 3 : 4;

        if (isSelected) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, r + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(200, 168, 75, 0.35)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = d.used ? 'rgba(26,58,110,0.3)' : '#c8a84b';
        ctx.strokeStyle = d.used ? '#1a3a6e' : '#8a8070';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();
      });
    });
  }

  // 5. 渲染物理特效
  renderAndRunFX(ctx);

  // 6. 即時同步鍵角
  if (!props.structureLocked) updateAngleDisplay();
}

function renderAndRunFX(ctx: CanvasRenderingContext2D) {
  // 粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.spin += p.spinSpeed;
    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.spin);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    for (let j = 0; j < 4; j++) {
      ctx.lineTo(0, -p.size);
      ctx.lineTo(p.size * 0.3, -p.size * 0.3);
      ctx.rotate(Math.PI / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 電子排斥力波動圈
  const cloud = props.repulsionCloud;
  if (cloud.active) {
    cloud.radius += (cloud.maxRadius - cloud.radius) * 0.1;
    cloud.alpha -= 0.025;
    cloud.phase += 0.2;
    if (cloud.alpha <= 0) {
      cloud.active = false;
    } else {
      ctx.save();
      ctx.globalAlpha = cloud.alpha * 0.45;
      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 10, cloud.x, cloud.y, cloud.radius);
      grad.addColorStop(0, 'rgba(200, 168, 75, 0.85)');
      grad.addColorStop(0.5, 'rgba(26, 58, 110, 0.4)');
      grad.addColorStop(1, 'rgba(200, 168, 75, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(200, 168, 75, ${cloud.alpha})`;
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + cloud.phase;
        ctx.beginPath();
        ctx.moveTo(cloud.x + Math.cos(a) * 15, cloud.y + Math.sin(a) * 15);
        ctx.lineTo(cloud.x + Math.cos(a) * cloud.radius, cloud.y + Math.sin(a) * cloud.radius);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 成功對稱解鎖波
  const glow = props.stabilityGlow;
  if (glow.active) {
    glow.phase += 0.05;
    const waveOffset = Math.sin(glow.phase * 3) * 1.5;
    props.atoms.forEach(a => {
      a.displayY = a.y + (draggingAtom.value ? 0 : waveOffset);
    });
    ctx.save();
    ctx.globalAlpha = Math.sin(glow.phase * 2) * 0.15 + 0.2;
    ctx.strokeStyle = '#c8a84b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    props.atoms.forEach(a => {
      ctx.arc(a.x, a.displayY !== undefined ? a.displayY : a.y, 35, 0, Math.PI * 2);
    });
    ctx.stroke();
    ctx.restore();
  } else {
    props.atoms.forEach(a => {
      a.displayY = a.y;
    });
  }
}

watch(() => props.structureLocked, (locked) => {
  if (locked) {
    rotationAngle.value = 0;
    setTimeout(() => {
      saveBasePositions();
    }, 50);
  }
});

onMounted(() => {
  function tick() {
    resolveElasticPhysics();
    drawWorkspace();
    animId = requestAnimationFrame(tick);
  }
  tick();
});

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId);
});

defineExpose({
  createSparkles
});
</script>

<template>
  <div class="canvas-wrap" :class="{ locked: props.structureLocked }">
    <div class="canvas-label">
      {{ props.structureLocked ? '建構區 — 結構已確認並鎖定，可拖曳旋轉觀察' : props.activeMolecule.label }}
    </div>
    <!-- w-full h-auto 配合 aspect-ratio 達成完美的全適應流體 Canvas。touch-action: none 防止手指拖曳時網頁亂晃 -->
    <canvas
      ref="canvasRef"
      width="410"
      height="210"
      id="mol-canvas"
      class="responsive-canvas"
      @mousedown="onPointerDown"
      @mousemove="onPointerMove"
      @mouseup="onPointerUp"
      @mouseleave="onPointerUp"
      @touchstart="onPointerDown"
      @touchmove="onPointerMove"
      @touchend="onPointerUp"
    ></canvas>
    <div v-if="!props.structureLocked" class="canvas-hint">
      點擊電子點拉線 ｜ 拖動原子調整位置
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap {
  background: #ffffff;
  border: 2px solid #1a3a6e;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}
.canvas-label {
  font-size: 10px;
  font-weight: 600;
  color: #1a3a6e;
  padding: 8px 12px 0;
  letter-spacing: 0.02em;
}
/* 實現高度自適應：寬度撐滿 100%，高度自動依照 410:210 的完美比例，在小螢幕手機上完美流體不溢出 */
.responsive-canvas {
  display: block;
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 410 / 210;
  cursor: default;
  touch-action: none; /* 強制阻斷瀏覽器原生的橡皮筋滾動與下拉刷新 */
}
.canvas-hint { 
  text-align: center; 
  font-size: 9px; 
  color: #8a8070; 
  padding: 4px 10px; 
  letter-spacing: 0.02em; 
  line-height: 1.3;
}
</style>