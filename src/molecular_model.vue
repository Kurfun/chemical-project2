<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { CPK, MOLECULES, EXAMPLES_3D_DATA, VSEPR_SHAPES } from './constants2';
import type{
  AtomInPlay,
  BondInPlay,
  LonePair,
  Particle,
  RepulsionCloud,
  StabilityGlow,
  BondOrder
} from './type4';
import {
  rotatePoint,
  projectModal,
  getPlaneVertices,
  getElectronDots,
  calculateAngle
} from './utils';

// --- Vue 響應式狀態管理 ---
const currentMolKey = ref<string>('H2O');
const atomsInPlay = ref<AtomInPlay[]>([]);
const bondsInPlay = ref<BondInPlay[]>([]);
const draggingAtom = ref<AtomInPlay | null>(null);
const currentScore = ref<number>(0);

// 常規變數與物理狀態
let selectedAtom: AtomInPlay | null = null;
let structureLocked = ref<boolean>(false);
let lonePairs = ref<LonePair[]>([]);
let lpIdCounter = 0;

// 電子點選擇狀態
let selectedDot = ref<{ atomId: number; dotIndex: number; angle: number; wx: number; wy: number } | null>(null);

// 旋轉與拖動記錄
let rotationAngle = ref<number>(0);
let rotDragStart: { mx: number; my: number; startAngle: number; baseAngle: number } | null = null;
let atomBasePositions: Record<number, { x: number; y: number }> = {};

// 粒子特效
let particles: Particle[] = [];
const repulsionCloud = reactive<RepulsionCloud>({
  active: false,
  x: 0,
  y: 0,
  radius: 0,
  maxRadius: 80,
  alpha: 0,
  phase: 0
});
const stabilityGlow = reactive<StabilityGlow>({
  active: false,
  strength: 0,
  phase: 0
});

// 即時鍵角
const isAngleDisplayVisible = ref<boolean>(false);
const angleLabel = ref<string>('Live bond angle');
const angleValueStr = ref<string>('—');
const angleBarWidth = ref<string>('0%');
const angleTextColor = ref<string>('#1a3a6e');
const angleBarBg = ref<string>('#1a3a6e');

// 反饋通知
const feedbackText = ref<string>('');
const feedbackType = ref<'success' | 'error' | 'info' | ''>('');

// 化學彩蛋
const eggCardShow = ref<boolean>(false);
const eggEmoji = ref<string>('💧');
const eggTitle = ref<string>('');
const eggText = ref<string>('');

// VSEPR Modal 狀態
const isVseprModalOpen = ref<boolean>(false);
const activeVseprKey = ref<string>('bent_4');
const currentModalMoleculeKey = ref<string>('H₂O');
const modalRotX = ref<number>(0.3);
const modalRotY = ref<number>(0.5);
let isDraggingModal = false;
let prevModalMouse = { x: 0, y: 0 };
const modalLayers = reactive({
  sigma: true,
  cn: true
});

// Canvas Refs
const canvasRef = ref<HTMLCanvasElement | null>(null);
const modalCanvasRef = ref<HTMLCanvasElement | null>(null);

// SVG 動態描繪 Refs 對應
const svgRefs = ref<Record<string, SVGGElement | null>>({});

// 循環計時器 IDs
let gameAnimId: number | null = null;
let modalAnimId: number | null = null;

// 計算屬性
const activeMolecule = computed(() => MOLECULES[currentMolKey.value]);
const activeVseprShape = computed(() => VSEPR_SHAPES.find(s => s.key === activeVseprKey.value));

// --- 輔助邏輯與特效驅動 ---
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

function triggerRepulsionWave(x: number, y: number) {
  repulsionCloud.active = true;
  repulsionCloud.x = x;
  repulsionCloud.y = y;
  repulsionCloud.radius = 10;
  repulsionCloud.alpha = 1.0;
  repulsionCloud.phase = 0;
  createSparkles(x, y, '#F09595', 15);
}

// 物理慣性推移
function resolveElasticPhysics() {
  atomsInPlay.value.forEach(a => {
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

// 取得 Canvas 本地平面座標
function getCanvasXY(e: { clientX: number; clientY: number }, canvasElement: HTMLCanvasElement) {
  const rect = canvasElement.getBoundingClientRect();
  const scaleX = canvasElement.width / rect.width;
  const scaleY = canvasElement.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// 中心點碰撞偵測
function hitTestAtom(mx: number, my: number) {
  return atomsInPlay.value.find(atom => {
    const r = atom.symbol === 'H' ? 18 : 25;
    const dy = atom.displayY !== undefined ? atom.displayY : atom.y;
    return Math.sqrt((atom.x - mx) ** 2 + (dy - my) ** 2) < r + 5;
  });
}

// 價電子點碰撞偵測
function hitTestDot(mx: number, my: number) {
  for (const atom of atomsInPlay.value) {
    const dots = getElectronDots(atom, bondsInPlay.value);
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = d.x - mx;
      const dy = d.y - my;
      if (Math.sqrt(dx * dx + dy * dy) < 9) {
        return { atomId: atom.id, dotIndex: i, angle: d.angle, wx: d.x, wy: d.y, used: d.used };
      }
    }
  }
  return null;
}

// 點擊/觸控互動分支
function onPointerDown(e: MouseEvent | TouchEvent) {
  if (!canvasRef.value) return;
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const { x: mx, y: my } = getCanvasXY({ clientX, clientY }, canvasRef.value);

  // 1. 已鎖定結構：允許滑鼠滑動進行三維旋轉繞軸效果
  if (structureLocked.value) {
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    const startAngle = Math.atan2(my - cy, mx - cx);
    rotDragStart = { mx, my, startAngle, baseAngle: rotationAngle.value };
    return;
  }

  // 2. 價電子點鍵結檢測
  const dotHit = hitTestDot(mx, my);
  if (dotHit) {
    if (!selectedDot.value) {
      selectedDot.value = dotHit;
    } else if (selectedDot.value.atomId !== dotHit.atomId) {
      const a1 = atomsInPlay.value.find(a => a.id === selectedDot.value!.atomId);
      const a2 = atomsInPlay.value.find(a => a.id === dotHit.atomId);
      if (a1 && a2) {
        if (a1.symbol === 'H' && a2.symbol === 'H') {
          triggerRepulsionWave((a1.x + a2.x) / 2, (a1.y + a2.y) / 2);
          showFeedback('❌ 鍵結錯誤！H 原子不能與另一個 H 直接連結！', 'error');
        } else {
          // 自動生成或疊加鍵數
          const freeOnA1 = getElectronDots(a1, bondsInPlay.value).filter(d => !d.used).length;
          const freeOnA2 = getElectronDots(a2, bondsInPlay.value).filter(d => !d.used).length;
          const canForm = Math.min(freeOnA1, freeOnA2, 1);
          if (canForm > 0) {
            toggleBond(a1.id, a2.id, 'single');
            createSparkles((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#B5D4F4', 8);
          } else {
            showFeedback('⚠️ 沒有足夠的自由電子可以形成鍵結', 'error');
          }
        }
      }
      selectedDot.value = null;
    } else {
      selectedDot.value = null;
    }
    return;
  }

  // 3. 一般拖曳原子
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
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const { x: mx, y: my } = getCanvasXY({ clientX, clientY }, canvasRef.value);

  // 鎖定狀態下的整體旋轉
  if (structureLocked.value && rotDragStart) {
    const cx = canvasRef.value.width / 2;
    const cy = canvasRef.value.height / 2;
    const curAngle = Math.atan2(my - cy, mx - cx);
    const delta = curAngle - rotDragStart.startAngle;
    rotationAngle.value = rotDragStart.baseAngle + delta;
    applyRotation();
    return;
  }

  if (!draggingAtom.value || structureLocked.value) return;
  draggingAtom.value.x = Math.max(25, Math.min(canvasRef.value.width - 25, mx));
  draggingAtom.value.y = Math.max(25, Math.min(canvasRef.value.height - 25, my));
}

function onPointerUp() {
  draggingAtom.value = null;
  rotDragStart = null;
}

function saveBasePositions() {
  atomsInPlay.value.forEach(a => {
    atomBasePositions[a.id] = { x: a.x, y: a.y };
  });
}

function applyRotation() {
  if (!canvasRef.value) return;
  const cx = canvasRef.value.width / 2;
  const cy = canvasRef.value.height / 2;
  atomsInPlay.value.forEach(a => {
    const base = atomBasePositions[a.id];
    if (!base) return;
    const p = rotatePoint(base.x, base.y, rotationAngle.value, cx, cy);
    a.x = p.x;
    a.y = p.y;
  });
}

// 增刪或升級兩原子間共價鍵
function toggleBond(id1: number, id2: number, order: BondOrder) {
  const existingIndex = bondsInPlay.value.findIndex(
    b => (b[0] === id1 && b[1] === id2) || (b[0] === id2 && b[1] === id1)
  );
  if (existingIndex > -1) {
    const cur = bondsInPlay.value[existingIndex][2] || 'single';
    if (cur === 'single') {
      bondsInPlay.value[existingIndex][2] = 'double';
    } else if (cur === 'double') {
      bondsInPlay.value[existingIndex][2] = 'triple';
    } else {
      bondsInPlay.value.splice(existingIndex, 1);
    }
  } else {
    bondsInPlay.value.push([id1, id2, order]);
  }
}

// 即時刷新並在主畫布重繪所有物件
function drawWorkspace() {
  const canvasElement = canvasRef.value;
  if (!canvasElement) return;
  const ctx = canvasElement.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // 鎖定旋轉提示
  if (structureLocked.value) {
    ctx.save();
    ctx.font = '11px Georgia, "Noto Serif TC", serif';
    ctx.fillStyle = 'rgba(26,58,110,0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('☞ 拖動旋轉分子觀察對稱結構', canvasElement.width / 2, canvasElement.height - 10);
    ctx.restore();
  }

  // 1. 繪製化學鍵
  bondsInPlay.value.forEach(([id1, id2, order]) => {
    const a1 = atomsInPlay.value.find(a => a.id === id1);
    const a2 = atomsInPlay.value.find(a => a.id === id2);
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

    const bondColor = stabilityGlow.active ? '#c8a84b' : '#1a3a6e';
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

  // 2. 繪製已解鎖的自動孤對電子（模擬 VSEPR 空間排斥）
  lonePairs.value.forEach(lp => {
    const atom = atomsInPlay.value.find(a => a.id === lp.atomId);
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
  atomsInPlay.value.forEach(atom => {
    const scheme = CPK[atom.symbol] || { fill: '#CCC', stroke: '#999', text: '#000' };
    const radius = atom.symbol === 'H' ? 18 : 25;
    const dy = atom.displayY !== undefined ? atom.displayY : atom.y;

    if (selectedAtom === atom) {
      ctx.beginPath();
      ctx.arc(atom.x, dy, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200, 168, 75, 0.2)';
      ctx.fill();
    }

    if (stabilityGlow.active) {
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

    // 擬真高光
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

  // 4. 繪製原子外環未成鍵/已成鍵電子點
  if (!structureLocked.value) {
    atomsInPlay.value.forEach(atom => {
      const dots = getElectronDots(atom, bondsInPlay.value);
      dots.forEach((d, i) => {
        const isSelected =
          selectedDot.value &&
          selectedDot.value.atomId === atom.id &&
          selectedDot.value.dotIndex === i;
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

  // 5. 繪製特效
  renderAndRunFX(ctx);

  // 6. 即時同步鍵角
  if (!structureLocked.value) updateAngleDisplay();
}

// 特效渲染流程
function renderAndRunFX(ctx: CanvasRenderingContext2D) {
  // 粒子爆炸
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
  if (repulsionCloud.active) {
    repulsionCloud.radius += (repulsionCloud.maxRadius - repulsionCloud.radius) * 0.1;
    repulsionCloud.alpha -= 0.025;
    repulsionCloud.phase += 0.2;
    if (repulsionCloud.alpha <= 0) {
      repulsionCloud.active = false;
    } else {
      ctx.save();
      ctx.globalAlpha = repulsionCloud.alpha * 0.45;
      const grad = ctx.createRadialGradient(
        repulsionCloud.x,
        repulsionCloud.y,
        10,
        repulsionCloud.x,
        repulsionCloud.y,
        repulsionCloud.radius
      );
      grad.addColorStop(0, 'rgba(200, 168, 75, 0.85)');
      grad.addColorStop(0.5, 'rgba(26, 58, 110, 0.4)');
      grad.addColorStop(1, 'rgba(200, 168, 75, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(repulsionCloud.x, repulsionCloud.y, repulsionCloud.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(200, 168, 75, ${repulsionCloud.alpha})`;
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + repulsionCloud.phase;
        ctx.beginPath();
        ctx.moveTo(repulsionCloud.x + Math.cos(a) * 15, repulsionCloud.y + Math.sin(a) * 15);
        ctx.lineTo(
          repulsionCloud.x + Math.cos(a) * repulsionCloud.radius,
          repulsionCloud.y + Math.sin(a) * repulsionCloud.radius
        );
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 成功解鎖懸浮波
  if (stabilityGlow.active) {
    stabilityGlow.phase += 0.05;
    const waveOffset = Math.sin(stabilityGlow.phase * 3) * 1.5;
    atomsInPlay.value.forEach(a => {
      a.displayY = a.y + (draggingAtom.value ? 0 : waveOffset);
    });
    ctx.save();
    ctx.globalAlpha = Math.sin(stabilityGlow.phase * 2) * 0.15 + 0.2;
    ctx.strokeStyle = '#c8a84b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    atomsInPlay.value.forEach(a => {
      ctx.arc(a.x, a.displayY !== undefined ? a.displayY : a.y, 35, 0, Math.PI * 2);
    });
    ctx.stroke();
    ctx.restore();
  } else {
    atomsInPlay.value.forEach(a => {
      a.displayY = a.y;
    });
  }
}

// 主渲染循環
function startGameLoop() {
  function tick() {
    resolveElasticPhysics();
    drawWorkspace();
    gameAnimId = requestAnimationFrame(tick);
  }
  tick();
}

// 切換關卡分子
function loadMol(key: string) {
  currentMolKey.value = key;
  const mol = MOLECULES[key];

  atomsInPlay.value = [];
  bondsInPlay.value = [];
  draggingAtom.value = null;
  stabilityGlow.active = false;
  stabilityGlow.strength = 0;
  repulsionCloud.active = false;
  lonePairs.value = [];
  structureLocked.value = false;
  rotationAngle.value = 0;
  atomBasePositions = {};
  selectedDot.value = null;

  eggCardShow.value = false;
  isAngleDisplayVisible.value = false;
  angleLabel.value = 'Live bond angle';

  const canvasElement = canvasRef.value;
  if (canvasElement) {
    const rx = canvasElement.width / 2;
    const ry = canvasElement.height / 2;
    atomsInPlay.value.push({
      id: 1,
      symbol: mol.centralAtom,
      x: rx,
      y: ry,
      isCentral: true
    });
  }

  hideFeedback();
  activeVseprKey.value = mol.shapeKey;
}

// 產生新的配位原子至工作區
function spawnAtom(symbol: string) {
  const mol = activeMolecule.value;
  const countInPlay = atomsInPlay.value.filter(a => a.symbol === symbol).length;
  const targetCount = mol.atoms[symbol] || 0;

  if (countInPlay >= targetCount) {
    showFeedback(`已達到該原子最大加入上限！`, 'error');
    return;
  }

  const canvasElement = canvasRef.value;
  if (!canvasElement) return;

  const id = atomsInPlay.value.length + 1;
  const rx = 50 + Math.random() * (canvasElement.width - 100);
  const ry = 50 + Math.random() * (canvasElement.height - 100);

  atomsInPlay.value.push({
    id,
    symbol,
    x: rx,
    y: ry,
    isCentral: false
  });

  createSparkles(rx, ry, CPK[symbol].fill, 6);
  hideFeedback();
}

function showFeedback(text: string, type: 'success' | 'error' | 'info') {
  feedbackText.value = text;
  feedbackType.value = type;
}

function hideFeedback() {
  feedbackText.value = '';
  feedbackType.value = '';
}

function updateAngleDisplay() {
  const mol = activeMolecule.value;
  const central = atomsInPlay.value.find(a => a.symbol === mol.centralAtom);
  const outers = atomsInPlay.value.filter(a => a.symbol !== mol.centralAtom);

  if (!central || outers.length < 2) {
    isAngleDisplayVisible.value = false;
    return;
  }

  const deg = calculateAngle(central, outers[0], outers[1]);
  isAngleDisplayVisible.value = true;
  angleValueStr.value = deg + '°';

  // 對應 90°-180° 控制進度條
  const pct = Math.max(0, Math.min(100, ((deg - 90) / 90) * 100));
  angleBarWidth.value = pct + '%';

  const idealAngleText = mol.hints.find(h => h[0].includes('鍵角') || h[0].includes('bond') || h[0].toLowerCase().includes('angle'))?.[1] || '109.5';
  const ideal = parseFloat(idealAngleText) || 109.5;
  const diff = Math.abs(deg - ideal);

  if (diff < 8) {
    angleBarBg.value = '#c8a84b';
    angleTextColor.value = '#1a3a6e';
  } else if (diff < 18) {
    angleBarBg.value = '#8a8070';
    angleTextColor.value = '#8a8070';
  } else {
    angleBarBg.value = '#b33939';
    angleTextColor.value = '#b33939';
  }
}

function showTheoreticalAngle() {
  const mol = activeMolecule.value;
  const idealAngle = mol.hints.find(h => h[0].includes('理論鍵角'))?.[1] || '—';

  isAngleDisplayVisible.value = true;
  angleLabel.value = '理論鍵角';
  const idealNum = parseFloat(idealAngle) || 0;
  angleValueStr.value = idealAngle;
  angleTextColor.value = '#1a3a6e';

  const pct = Math.max(0, Math.min(100, ((idealNum - 90) / 90) * 100));
  angleBarWidth.value = pct + '%';
  angleBarBg.value = '#c8a84b';
}

function lockStructure(correct: boolean) {
  structureLocked.value = true;
  rotationAngle.value = 0;
  if (correct) {
    showCorrectStructure();
  }
  setTimeout(() => {
    saveBasePositions();
  }, 50);
}

// 根據理想 VSEPR 對稱配置，自動拉直重排分子結構
function showCorrectStructure() {
  const mol = activeMolecule.value;
  const cx = canvasRef.value ? canvasRef.value.width / 2 : 205;
  const cy = canvasRef.value ? canvasRef.value.height / 2 : 105;

  const layoutMap: Record<string, { center: string; offsets: Record<string, [number, number]>; bonds: [number, number, BondOrder][]; lp: 'auto' | any[] }> = {
    H2O: { center: 'O', offsets: { O: [0, 0], H1: [-0.45, 0.32], H2: [0.45, 0.32] }, bonds: [[0, 1, 'single'], [0, 2, 'single']], lp: 'auto' },
    NH3: { center: 'N', offsets: { N: [0, 0], H1: [-0.42, 0.32], H2: [0.42, 0.32], H3: [0, -0.5] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single']], lp: 'auto' },
    BF3: { center: 'B', offsets: { B: [0, 0], F1: [0, -0.52], F2: [0.45, 0.26], F3: [-0.45, 0.26] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single']], lp: [] },
    CO2: { center: 'C', offsets: { C: [0, 0], O1: [-0.52, 0], O2: [0.52, 0] }, bonds: [[0, 1, 'double'], [0, 2, 'double']], lp: [] },
    CH4: { center: 'C', offsets: { C: [0, 0], H1: [0, -0.5], H2: [0.45, 0.25], H3: [-0.45, 0.25], H4: [0, 0.52] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single'], [0, 4, 'single']], lp: [] }
  };

  const layout = layoutMap[currentMolKey.value];
  if (!layout) return;

  const W = canvasRef.value ? canvasRef.value.width : 410;
  const H = canvasRef.value ? canvasRef.value.height : 210;
  const scale = Math.min(W, H) * 0.38;

  // 確認並補齊原子
  for (const [symbol, count] of Object.entries(mol.atoms)) {
    const existing = atomsInPlay.value.filter(a => a.symbol === symbol).length;
    for (let i = existing; i < count; i++) {
      atomsInPlay.value.push({
        id: atomsInPlay.value.length + 1,
        symbol,
        x: cx,
        y: cy,
        isCentral: symbol === mol.centralAtom
      });
    }
  }

  const symbolCounts: Record<string, number> = {};
  atomsInPlay.value.forEach(a => {
    const sym = a.symbol;
    symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
    const key = sym === layout.center ? sym : sym + symbolCounts[sym];
    const off = layout.offsets[key];
    if (off) {
      a.x = cx + off[0] * scale;
      a.y = cy + off[1] * scale;
    }
  });

  bondsInPlay.value = [];
  layout.bonds.forEach(([i, j, order]) => {
    const a1 = atomsInPlay.value[i];
    const a2 = atomsInPlay.value[j];
    if (a1 && a2) bondsInPlay.value.push([a1.id, a2.id, order]);
  });

  // 計算並生成 VSEPR 最佳排斥角的孤對電子
  lonePairs.value = [];
  const centralAtomObj = atomsInPlay.value.find(a => a.symbol === mol.centralAtom);
  if (centralAtomObj) {
    if (layout.lp === 'auto') {
      const bondedAtoms = atomsInPlay.value.filter(a => a.id !== centralAtomObj.id);
      if (bondedAtoms.length > 0) {
        let sumX = 0, sumY = 0;
        bondedAtoms.forEach(b => {
          const dx = b.x - centralAtomObj.x;
          const dy = b.y - centralAtomObj.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          sumX += dx / len;
          sumY += dy / len;
        });
        const lpAngle = Math.atan2(-sumY, -sumX) * 180 / Math.PI;

        if (currentMolKey.value === 'H2O') {
          lonePairs.value.push({ atomId: centralAtomObj.id, angle: lpAngle - 30, id: ++lpIdCounter });
          lonePairs.value.push({ atomId: centralAtomObj.id, angle: lpAngle + 30, id: ++lpIdCounter });
        } else {
          lonePairs.value.push({ atomId: centralAtomObj.id, angle: lpAngle, id: ++lpIdCounter });
        }
      }
    }
  }
}

// 提交判定
function checkAnswer() {
  const mol = activeMolecule.value;

  // 1. 驗證原子數
  const placedCounts: Record<string, number> = {};
  atomsInPlay.value.forEach(a => {
    placedCounts[a.symbol] = (placedCounts[a.symbol] || 0) + 1;
  });

  for (const [symbol, count] of Object.entries(mol.atoms)) {
    if ((placedCounts[symbol] || 0) !== count) {
      const idealAngle = mol.hints.find(h => h[0].includes('理論鍵角'))?.[1] || '—';
      lockStructure(true);
      showFeedback(`❌ 答題錯誤！原子數量不符，需要 ${count} 個 ${symbol}，目前只有 ${placedCounts[symbol] || 0} 個。<br>✅ 正確答案已顯示：${mol.shape}，理論鍵角 ${idealAngle}`, 'error');
      if (canvasRef.value) triggerRepulsionWave(canvasRef.value.width / 2, canvasRef.value.height / 2);
      showTheoreticalAngle();
      return;
    }
  }

  // 2. 中心原子連線判定
  const central = atomsInPlay.value.find(a => a.symbol === mol.centralAtom);
  if (!central) {
    lockStructure(true);
    showFeedback(`❌ 答題錯誤！找不到中心原子！<br>✅ 正確答案已顯示於建構區`, 'error');
    showTheoreticalAngle();
    return;
  }

  const outers = atomsInPlay.value.filter(a => a.id !== central.id);
  const connectionsToCentral = bondsInPlay.value.filter(b => b.includes(central.id));

  if (connectionsToCentral.length !== outers.length) {
    const idealAngle = mol.hints.find(h => h[0].includes('理論鍵角'))?.[1] || '—';
    lockStructure(true);
    showFeedback(`❌ 答題錯誤！連結不完整，所有配位原子都應連接到中央的 ${mol.centralAtom} 原子。<br>✅ 正確答案已顯示：${mol.shape}，理論鍵角 ${idealAngle}`, 'error');
    triggerRepulsionWave(central.x, central.y);
    showTheoreticalAngle();
    return;
  }

  // 二氧化碳直線判定
  if (currentMolKey.value === 'CO2') {
    const o1 = outers[0];
    const o2 = outers[1];
    let diff = Math.abs(Math.atan2(o1.y - central.y, o1.x - central.x) - Math.atan2(o2.y - central.y, o2.x - central.x));
    if (diff > Math.PI) diff = 2 * Math.PI - diff;

    if (diff < 2.5) {
      lockStructure(true);
      showFeedback(`❌ 答題錯誤！CO₂ 的兩個 O 應呈 180° 直線對稱排列。<br>✅ 正確答案已顯示：Linear（直線型），理論鍵角 180°`, 'error');
      triggerRepulsionWave(central.x, central.y);
      showTheoreticalAngle();
      return;
    }
  }

  // 水彎曲判定
  if (currentMolKey.value === 'H2O') {
    const h1 = outers[0];
    const h2 = outers[1];
    const diff = Math.abs(Math.atan2(h1.y - central.y, h1.x - central.x) - Math.atan2(h2.y - central.y, h2.x - central.x));
    if (diff < 0.5 || Math.abs(diff - Math.PI) < 0.4) {
      lockStructure(true);
      showFeedback(`❌ 答題錯誤！水分子不能是直線型，孤對電子將 H 擠壓至約 104.5°。<br>✅ 正確答案已顯示：Bent（V 形彎曲），理論鍵角 104.5°`, 'error');
      triggerRepulsionWave(central.x, central.y - 30);
      showTheoreticalAngle();
      return;
    }
  }

  // 解鎖成功特效
  stabilityGlow.active = true;
  stabilityGlow.phase = 0;
  createSparkles(central.x, central.y, '#c8a84b', 24);
  lockStructure(true);

  const idealAngle = mol.hints.find(h => h[0].includes('理論鍵角'))?.[1] || '—';
  showFeedback(`✅ 恭喜答題正確！成功建構了 ${mol.title.split('—')[0]}！\n✅ 正確答案：${mol.shape}，理論鍵角 ${idealAngle}`, 'success');

  // 解鎖彩蛋卡片
  eggEmoji.value = mol.eggEmoji || '💧';
  eggTitle.value = mol.eggTitle || '化學小彩蛋';
  eggText.value = mol.funFact;
  eggCardShow.value = true;

  showTheoreticalAngle();
  currentScore.value += mol.xp;
}

// --- 3D 模擬 VSEPR 旋轉檢視器 ---
function renderModal3D() {
  const mCanvas = modalCanvasRef.value;
  if (!mCanvas) return;
  const mCtx = mCanvas.getContext('2d');
  if (!mCtx) return;

  mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);

  const mol3d = EXAMPLES_3D_DATA[currentModalMoleculeKey.value];
  if (!mol3d) return;

  const proj = mol3d.atoms.map(a => {
    const p = projectModal(a.x, a.y, a.z, modalRotX.value, modalRotY.value, mCanvas.width, mCanvas.height);
    return { ...a, sx: p.x, sy: p.y, depth: p.depth };
  });

  const drawQueue: { depth: number; draw: () => void }[] = [];

  // 1. 繪製化學鍵
  mol3d.bonds.forEach(([i, j]) => {
    const a1 = proj[i];
    const a2 = proj[j];
    if (a1 && a2) {
      drawQueue.push({
        depth: (a1.depth + a2.depth) / 2,
        draw: () => {
          mCtx.beginPath();
          mCtx.moveTo(a1.sx, a1.sy);
          mCtx.lineTo(a2.sx, a2.sy);
          mCtx.strokeStyle = '#90B4CC';
          mCtx.lineWidth = 5;
          mCtx.lineCap = 'round';
          mCtx.stroke();
        }
      });
    }
  });

  // 2. 繪製球體原子
  proj.forEach(a => {
    drawQueue.push({
      depth: a.depth,
      draw: () => {
        const scheme = CPK[a.t] || { fill: '#CCC', stroke: '#999', text: '#000' };
        const baseR = a.t === 'H' ? 10 : a.t === 'C' ? 14 : 15;
        const r = baseR * (4 / (4 + a.depth + 2));

        mCtx.beginPath();
        mCtx.arc(a.sx, a.sy, r, 0, Math.PI * 2);
        mCtx.fillStyle = scheme.fill;
        mCtx.fill();
        mCtx.strokeStyle = scheme.stroke;
        mCtx.lineWidth = 1.5;
        mCtx.stroke();

        // 擬真反光
        mCtx.beginPath();
        mCtx.arc(a.sx - r * 0.3, a.sy - r * 0.3, r * 0.25, 0, Math.PI * 2);
        mCtx.fillStyle = 'rgba(255,255,255,0.45)';
        mCtx.fill();
      }
    });
  });

  // 3. 繪製對稱平面 σ (Sigma Plane)
  if (modalLayers.sigma && mol3d.planeNormals && mol3d.planeNormals.length > 0) {
    mol3d.planeNormals.forEach((normal, pIdx) => {
      const corners3D = getPlaneVertices(normal, 1.3);
      if (!corners3D) return;
      const corners = corners3D.map(pt =>
        projectModal(pt[0], pt[1], pt[2], modalRotX.value, modalRotY.value, mCanvas.width, mCanvas.height)
      );

      let r = 26, g = 86, b = 160;
      if (pIdx === 1) {
        r = 210; g = 70; b = 70;
      } else if (pIdx === 2) {
        r = 74; g = 122; b = 160;
      }

      drawQueue.push({
        depth: corners.reduce((sum, c) => sum + c.depth, 0) / 4 - 0.15,
        draw: () => {
          mCtx.beginPath();
          mCtx.moveTo(corners[0].x, corners[0].y);
          corners.slice(1).forEach(c => mCtx.lineTo(c.x, c.y));
          mCtx.closePath();
          mCtx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
          mCtx.fill();
          mCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.45)`;
          mCtx.lineWidth = 1.5;
          mCtx.stroke();
        }
      });
    });
  }

  // 4. 繪製對稱旋轉軸 Cn (Symmetry Axis)
  if (modalLayers.cn) {
    const top = projectModal(0, 1.3, 0, modalRotX.value, modalRotY.value, mCanvas.width, mCanvas.height);
    const bot = projectModal(0, -1.3, 0, modalRotX.value, modalRotY.value, mCanvas.width, mCanvas.height);

    drawQueue.push({
      depth: Math.max(top.depth, bot.depth) + 0.15,
      draw: () => {
        mCtx.beginPath();
        mCtx.moveTo(top.x, top.y);
        mCtx.lineTo(bot.x, bot.y);
        mCtx.strokeStyle = 'rgba(26, 86, 160, 0.7)';
        mCtx.lineWidth = 2;
        mCtx.stroke();

        mCtx.fillStyle = '#1A56A0';
        mCtx.font = 'bold 9px DM Sans';
        mCtx.fillText('Cₙ', top.x + 6, top.y + 3);
      }
    });
  }

  // 依據 Z-Depth 畫家演算法繪製物件
  drawQueue.sort((a, b) => b.depth - a.depth).forEach(q => q.draw());
}

function startModalAutoRotation() {
  if (modalAnimId) cancelAnimationFrame(modalAnimId);
  function tick() {
    if (!isDraggingModal) {
      modalRotY.value += 0.008;
      renderModal3D();
    }
    modalAnimId = requestAnimationFrame(tick);
  }
  tick();
}

// 彈出 VSEPR 精細圖形資訊
function showVseprDetail(key: string) {
  activeVseprKey.value = key;
  const shape = VSEPR_SHAPES.find(s => s.key === key);
  if (shape && shape.examples.length > 0) {
    currentModalMoleculeKey.value = shape.examples[0].f;
  }
  nextTick(() => {
    renderModal3D();
  });
}

function drawVseprSvgPreviews() {
  // 將動態 shape 描繪在每個卡片的小 SVG 畫布中
  VSEPR_SHAPES.forEach(shape => {
    const container = svgRefs.value[shape.key];
    if (!container) return;
    
    // 清空現有子節點
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 56;
    const ctx2d = canvas.getContext('2d');
    if (ctx2d) {
      shape.draw(ctx2d, 36, 28);
      
      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttribute('href', canvas.toDataURL());
      img.setAttribute('width', '72');
      img.setAttribute('height', '56');
      img.setAttribute('x', '0');
      img.setAttribute('y', '0');
      container.appendChild(img);
    }
  });
}

function selectModalExample(formula: string) {
  currentModalMoleculeKey.value = formula;
  renderModal3D();
}

function openVsepr() {
  isVseprModalOpen.value = true;
  if (!activeVseprKey.value) {
    activeVseprKey.value = activeMolecule.value.shapeKey;
  }
  showVseprDetail(activeVseprKey.value);
  nextTick(() => {
    startModalAutoRotation();
    drawVseprSvgPreviews();
  });
}

function closeVsepr() {
  isVseprModalOpen.value = false;
  if (modalAnimId) {
    cancelAnimationFrame(modalAnimId);
    modalAnimId = null;
  }
}

// 3D 模擬拖曳控制事件
function onModalMouseDown(e: MouseEvent) {
  isDraggingModal = true;
  prevModalMouse = { x: e.clientX, y: e.clientY };
}

function onModalMouseMove(e: MouseEvent) {
  if (!isDraggingModal) return;
  const deltaX = e.clientX - prevModalMouse.x;
  const deltaY = e.clientY - prevModalMouse.y;
  modalRotY.value += deltaX * 0.012;
  modalRotX.value += deltaY * 0.012;
  prevModalMouse = { x: e.clientX, y: e.clientY };
  renderModal3D();
}

function onModalMouseUp() {
  isDraggingModal = false;
}

function onModalTouchStart(e: TouchEvent) {
  isDraggingModal = true;
  prevModalMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}

function onModalTouchMove(e: TouchEvent) {
  if (!isDraggingModal) return;
  const deltaX = e.touches[0].clientX - prevModalMouse.x;
  const deltaY = e.touches[0].clientY - prevModalMouse.y;
  modalRotY.value += deltaX * 0.012;
  modalRotX.value += deltaY * 0.012;
  prevModalMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  renderModal3D();
}

// Vue 生命週期初始化
onMounted(() => {
  loadMol('H2O');
  startGameLoop();
});

onUnmounted(() => {
  if (gameAnimId) cancelAnimationFrame(gameAnimId);
  if (modalAnimId) cancelAnimationFrame(modalAnimId);
});
</script>

<template>
  <div class="molecular-model-app">
    <!-- VSEPR 科普互動 Modal 彈窗 -->
    <div
      v-if="isVseprModalOpen"
      class="vsepr-overlay show"
      @click.self="closeVsepr"
    >
      <div class="vsepr-modal">
        <div class="vsepr-modal-header">
          <div>
            <div class="vsepr-modal-title">VSEPR 空間對稱互動教室</div>
            <div class="vsepr-modal-sub">點擊分子幾何形狀與其實體例子，可直接拖曳檢視 3D 模型與其對稱平面元素</div>
          </div>
          <button class="vsepr-close" @click="closeVsepr">關閉 ×</button>
        </div>
        <div class="vsepr-modal-body">
          <div class="vsepr-section-title">選擇幾何空間形狀</div>
          <div class="vsepr-grid">
            <div
              v-for="shape in VSEPR_SHAPES"
              :key="shape.key"
              class="vsepr-shape-card"
              :class="{ active: shape.key === activeVseprKey }"
              @click="showVseprDetail(shape.key)"
            >
              <div class="vshape-badge">{{ shape.steric }}e · {{ shape.lone }}lp</div>
              <svg class="vshape-svg" viewBox="0 0 72 56" width="72" height="56">
                <g :ref="(el) => { if (el) svgRefs[shape.key] = el as SVGGElement }"></g>
              </svg>
              <div class="vshape-name">{{ shape.name }}</div>
              <div class="vshape-angle">{{ shape.angle }}</div>
            </div>
          </div>

          <!-- 形狀細節 -->
          <div v-if="activeVseprShape" class="vsepr-detail show">
            <div class="vd-header">
              <div class="vd-diagram-3d">
                <canvas
                  ref="modalCanvasRef"
                  width="170"
                  height="170"
                  id="modal-3d-canvas"
                  @mousedown="onModalMouseDown"
                  @mousemove="onModalMouseMove"
                  @mouseup="onModalMouseUp"
                  @mouseleave="onModalMouseUp"
                  @touchstart="onModalTouchStart"
                  @touchmove="onModalTouchMove"
                  @touchend="onModalMouseUp"
                ></canvas>
                <div class="canvas-3d-label">{{ currentModalMoleculeKey }} (3D)</div>
              </div>
              <div class="vd-info">
                <div class="vd-title">{{ activeVseprShape.name }}</div>
                <div class="vd-sub">配位對 {{ activeVseprShape.steric }} · {{ activeVseprShape.lone }} 對孤電子對 · {{ activeVseprShape.pg }}</div>
                <div class="vd-row"><span class="vd-key">幾何描述</span><span class="vd-val">{{ activeVseprShape.desc }}</span></div>
                <div class="vd-row"><span class="vd-key">理想夾角</span><span class="vd-val">{{ activeVseprShape.angle }}</span></div>
                <div class="vd-row"><span class="vd-key">孤對電子影響</span><span class="vd-val">{{ activeVseprShape.lpEffect }}</span></div>
                <div v-if="activeVseprShape.hybrid" class="vd-row hybrid-row">
                  <span class="vd-key">混成軌域</span>
                  <span class="vd-val">
                    <span class="hybrid-badge">{{ activeVseprShape.hybrid }}</span>
                    {{ activeVseprShape.hybridDesc }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 對稱層顯示切換 -->
            <div class="sym-toggles">
              <label class="sym-toggle-lbl">
                <input type="checkbox" v-model="modalLayers.sigma" @change="renderModal3D"> 顯示對稱鏡面 σ
              </label>
              <label class="sym-toggle-lbl">
                <input type="checkbox" v-model="modalLayers.cn" @change="renderModal3D"> 顯示對稱軸 Cₙ
              </label>
            </div>

            <div>
              <div class="vd-examples-title">分子範例 (點擊即時載入3D模型與對稱面)</div>
              <div class="vd-ex-chips">
                <div
                  v-for="ex in activeVseprShape.examples"
                  :key="ex.f"
                  class="vd-ex-chip"
                  :class="{ active: ex.f === currentModalMoleculeKey }"
                  @click="selectModalExample(ex.f)"
                >
                  <div class="vd-ex-formula">{{ ex.f }}</div>
                  <div class="vd-ex-name">{{ ex.n }}</div>
                  <div class="vd-ex-note">{{ ex.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主遊戲建構卡片 -->
    <div class="card">
      <div class="topbar">
        <div>
          <div class="topbar-eyebrow">{{ activeMolecule.levelLabel }}</div>
          <div class="topbar-title">球棒模型與價鍵對稱建構</div>
        </div>
        <div class="xp-pill">⭐ {{ currentScore }} XP</div>
      </div>

      <div class="prog-row">
        <div class="prog-track">
          <div class="progress-fill" :style="{ width: activeMolecule.prog + '%' }"></div>
        </div>
        <div class="prog-lbl">{{ activeMolecule.progLabel }}</div>
      </div>

      <!-- 分子選單 -->
      <div class="mol-select">
        <button
          v-for="(_, key) in MOLECULES"
          :key="key"
          class="mol-btn"
          :class="{ active: key === currentMolKey }"
          @click="loadMol(key)"
        >
          {{ key === 'H2O' ? 'H₂O' : key === 'NH3' ? 'NH₃' : key === 'BF3' ? 'BF₃' : key === 'CO2' ? 'CO₂' : 'CH₄' }}
        </button>
      </div>

      <div class="body">
        <div class="challenge-row">
          <div class="challenge-badge">目標分子</div>
          <div class="challenge-title">{{ activeMolecule.title }}</div>
        </div>

        <!-- 2D 拖曳 Canvas 區 -->
        <div class="canvas-wrap" :class="{ locked: structureLocked }">
          <div class="canvas-label">
            {{ structureLocked ? '建構區 — 結構已確認並鎖定，可拖曳旋轉觀察' : activeMolecule.label }}
          </div>
          <canvas
            ref="canvasRef"
            width="410"
            height="210"
            id="mol-canvas"
            @mousedown="onPointerDown"
            @mousemove="onPointerMove"
            @mouseup="onPointerUp"
            @mouseleave="onPointerUp"
            @touchstart="onPointerDown"
            @touchmove="onPointerMove"
            @touchend="onPointerUp"
          ></canvas>
          <div v-if="!structureLocked" class="canvas-hint">
            點擊原子上的電子點 → 再點選另一原子的電子點以形成共價鍵 ｜ 拖動原子 = 移動位置
          </div>
        </div>
        <div v-if="structureLocked" class="lock-hint">
          ✓ 結構對稱已解鎖 — 可按住拖曳旋轉分子觀察對稱幾何
        </div>

        <!-- 原子庫 (僅在未鎖定時呈現) -->
        <div v-if="!structureLocked" class="atom-tray">
          <div class="atom-tray-label">配位原子庫 (點擊加入)</div>
          <div class="atom-tray-row">
            <template v-for="(count, symbol) in activeMolecule.atoms" :key="symbol">
              <div
                v-if="symbol !== activeMolecule.centralAtom || count > 1"
                class="atom-chip"
                @click="spawnAtom(symbol)"
              >
                <span
                  class="atom-dot"
                  :style="{ background: CPK[symbol].fill, borderColor: CPK[symbol].stroke }"
                ></span>
                <span>加入 {{ symbol }} × {{ symbol === activeMolecule.centralAtom ? count - 1 : count }}</span>
              </div>
            </template>
            <!-- 重置 -->
            <div class="reset-chip" @click="loadMol(currentMolKey)">
              <span>🔄 重置</span>
            </div>
          </div>
        </div>

        <!-- 操作說明小卡 -->
        <div v-if="!structureLocked" class="legend-panel">
          <span>
            <span class="legend-dot yellow"></span>未鍵結電子
          </span>
          <span>
            <span class="legend-dot blue"></span>鍵結電子
          </span>
          <span>連結兩原子的電子點形成穩定共價鍵</span>
        </div>

        <!-- 反饋警告 -->
        <div
          v-if="feedbackText"
          class="feedback show"
          :class="feedbackType"
          v-html="feedbackText"
        ></div>

        <!-- VSEPR 智慧提示面板 -->
        <div class="hint-panel">
          <div class="hint-header" @click="openVsepr" title="點擊查看 VSEPR 科普">
            <div class="hint-title-row">
              <span style="font-size:14px;">💡</span>
              <span class="hint-title">VSEPR 空間提示</span>
              <span class="hint-shape-badge">{{ activeMolecule.shape }}</span>
            </div>
            <span class="hint-expand-icon">▼</span>
          </div>
          <div class="hint-rows-wrap">
            <div
              v-for="hint in activeMolecule.hints"
              :key="hint[0]"
              class="hint-row"
              :class="{ hybrid: hint[0].includes('混成') }"
            >
              <span class="hint-key">{{ hint[0] }}</span>
              <span class="hint-val">
                <span v-if="hint[0].includes('混成')" style="font-weight:700;font-style:italic;color:#1a3a6e">
                  {{ hint[1] }}
                </span>
                <span v-else>{{ hint[1] }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 鍵角顯示 -->
        <div v-if="isAngleDisplayVisible" class="angle-display">
          <span>{{ angleLabel }}</span>
          <div class="angle-value" :style="{ color: angleTextColor }">{{ angleValueStr }}</div>
          <div class="angle-bar-wrap">
            <div class="angle-bar" :style="{ width: angleBarWidth, background: angleBarBg }"></div>
          </div>
        </div>

        <!-- 彩蛋知識卡 -->
        <div v-if="eggCardShow" class="egg-card show">
          <div class="egg-header">
            <span class="egg-emoji">{{ eggEmoji }}</span>
            <span class="egg-title">{{ eggTitle }}</span>
            <span class="egg-badge">化學彩蛋</span>
          </div>
          <div class="egg-text">{{ eggText }}</div>
        </div>

        <!-- 提交按鈕 -->
        <div class="btn-row">
          <button
            class="btn-submit"
            :class="{ 'success-state': structureLocked }"
            @click="structureLocked ? loadMol(currentMolKey) : checkAnswer()"
          >
            {{ structureLocked ? '重新挑戰 🔄' : '提交驗證對稱結構 →' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.molecular-model-app {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-family: 'Noto Serif TC', Georgia, serif;
}

.card {
  width: 100%;
  max-width: 440px;
  border: 2px solid #1a3a6e;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 4px 6px 0px #1a3a6e;
}

/* ── Topbar ── */
.topbar {
  background: #1a3a6e;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.topbar-eyebrow { font-size: 0.65rem; font-weight: 500; color: #f4f1ea; opacity: 0.7; letter-spacing: 0.1em; }
.topbar-title { font-size: 1.05rem; font-weight: 700; color: #f4f1ea; margin-top: 1px; letter-spacing: 0.05em; }
.xp-pill {
  background: rgba(255,255,255,0.15);
  border: 0.5px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #f4f1ea;
}

/* ── Progress ── */
.prog-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #f4f1ea;
  border-bottom: 1.5px solid #1a3a6e;
}
.prog-track { flex: 1; height: 5px; background: #ddd8cc; border-radius: 2px; }
.progress-fill  { height: 100%; background: #1a3a6e; border-radius: 2px; transition: width 0.4s; }
.prog-lbl   { font-size: 10px; font-weight: 600; color: #1a3a6e; white-space: nowrap; letter-spacing: 0.1em; }

/* ── Molecule selector ── */
.mol-select {
  display: flex;
  gap: 6px;
  padding: 9px 14px;
  overflow-x: auto;
  scrollbar-width: none;
  background: #ffffff;
  border-bottom: 1.5px solid #1a3a6e;
}
.mol-select::-webkit-scrollbar { display: none; }
.mol-btn {
  font-family: inherit;
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 700;
  color: #1a3a6e;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s;
}
.mol-btn:hover { background: #f4f1ea; }
.mol-btn.active { background: #1a3a6e; color: #f4f1ea; border-color: #1a3a6e; }

/* ── Body ── */
.body { padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #ffffff; }

/* ── Challenge header ── */
.challenge-row { display: flex; align-items: center; gap: 8px; }
.challenge-badge {
  background: #f4f1ea;
  color: #1a3a6e;
  border: 1px solid #1a3a6e;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  letter-spacing: 0.05em;
  white-space: nowrap;
}
.challenge-title { font-size: 11.5px; font-weight: 600; color: #1a3a6e; letter-spacing: 0.02em; }

/* ── Canvas ── */
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
#mol-canvas { display: block; cursor: default; touch-action: none; }
.canvas-hint { text-align: center; font-size: 9.5px; color: #8a8070; padding: 2px 0 6px; letter-spacing: 0.02em; }

/* ── VSEPR hint panel ── */
.hint-panel {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  overflow: hidden;
}
.hint-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.hint-header:hover { background: #f4f1ea; }
.hint-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hint-title {
  font-size: 11px;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.hint-shape-badge {
  background: #f4f1ea;
  color: #1a3a6e;
  border: 1px solid #1a3a6e;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.hint-expand-icon {
  font-size: 11px;
  color: #1a3a6e;
  transition: transform 0.25s;
  flex-shrink: 0;
}
.hint-rows-wrap { padding: 0 13px 10px; display: block; }
.hint-row {
  display: flex;
  justify-content: space-between;
  font-size: 10.5px;
  padding: 5px 0;
  border-bottom: 1px dashed #ddd8cc;
}
.hint-row:last-child { border-bottom: none; }
.hint-key { color: #8a8070; font-weight: 600; }
.hint-val { color: #1a3a6e; font-weight: 700; }
.hint-row.hybrid { background: #f4f1ea; border-radius: 4px; padding: 5px 8px; margin: 2px -8px; }

/* ── VSEPR modal overlay ── */
.vsepr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 30, 60, 0.45);
  z-index: 1000;
  align-items: center;
  justify-content: center;
  padding: 16px;
  display: none;
}
.vsepr-overlay.show { display: flex; }
.vsepr-modal {
  background: #f4f1ea;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border: 2px solid #1a3a6e;
  box-shadow: 0 20px 48px rgba(0,0,0,0.15);
}
.vsepr-modal-header {
  background: #1a3a6e;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px 10px 0 0;
  position: sticky;
  top: 0;
  z-index: 5;
}
.vsepr-modal-title { font-size: 14px; font-weight: 700; color: #f4f1ea; letter-spacing: 0.05em; }
.vsepr-modal-sub { font-size: 11px; color: #A8C8E8; margin-top: 2px; }
.vsepr-close {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 4px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #f4f1ea;
  cursor: pointer;
  font-family: inherit;
}
.vsepr-modal-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

/* shape grid */
.vsepr-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
}
.vsepr-shape-card {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 8px;
  padding: 10px 8px 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}
.vsepr-shape-card:hover { border-color: #c8a84b; background: #f4f1ea; }
.vsepr-shape-card.active { border: 2px solid #c8a84b; background: #f4f1ea; }
.vshape-svg { width: 64px; height: 52px; display: block; margin: 0 auto 6px; }
.vshape-name { font-size: 11px; font-weight: 700; color: #1a3a6e; margin-bottom: 2px; }
.vshape-angle { font-size: 10px; color: #8a8070; }
.vshape-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f4f1ea;
  color: #1a3a6e;
  border: 1px solid #1a3a6e;
  margin-bottom: 5px;
}

/* detail pane */
.vsepr-detail {
  background: #ffffff;
  border: 2px solid #1a3a6e;
  border-radius: 8px;
  padding: 14px;
  display: none;
  flex-direction: column;
  gap: 12px;
}
.vsepr-detail.show { display: flex; }
.vd-header { display: flex; gap: 14px; flex-wrap: wrap; }
.vd-diagram-3d {
  background: #f4f1ea;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  width: 170px;
  height: 170px;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}
#modal-3d-canvas { width: 100%; height: 100%; display: block; cursor: grab; }
#modal-3d-canvas:active { cursor: grabbing; }
.canvas-3d-label {
  position: absolute;
  bottom: 6px;
  left: 6px;
  font-size: 9px;
  font-weight: 700;
  background: rgba(255,255,255,0.85);
  padding: 2px 6px;
  border-radius: 4px;
  color: #1a3a6e;
  pointer-events: none;
}
.vd-info { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 200px; }
.vd-title { font-size: 13.5px; font-weight: 700; color: #1a3a6e; }
.vd-sub { font-size: 10.5px; color: #8a8070; }
.vd-row { display: flex; flex-direction: column; gap: 1px; padding: 4px 0; border-bottom: 1px dashed #ddd8cc; }
.vd-row:last-child { border-bottom: none; }
.vd-key { font-size: 9px; font-weight: 700; color: #8a8070; text-transform: uppercase; letter-spacing: 0.04em; }
.vd-val { font-size: 11px; color: #1a3a6e; line-height: 1.4; }
.hybrid-row { background: #f4f1ea; border-radius: 6px; padding: 6px 8px !important; border: 1.5px solid #1a3a6e !important; }
.hybrid-badge {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 700;
  font-style: italic;
  background: #1a3a6e;
  color: #f4f1ea;
  border-radius: 4px;
  padding: 1px 7px;
  margin-right: 5px;
  vertical-align: middle;
}

/* Symmetry Layer Controls */
.sym-toggles {
  display: flex;
  gap: 12px;
  background: #f4f1ea;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1.5px solid #1a3a6e;
  align-items: center;
}
.sym-toggle-lbl {
  font-size: 10.5px;
  font-weight: 700;
  color: #1a3a6e;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.vd-examples-title { font-size: 9px; font-weight: 700; color: #8a8070; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
.vd-ex-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.vd-ex-chip {
  background: #f4f1ea;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  text-align: left;
  min-width: 110px;
}
.vd-ex-chip:hover { background: #ffffff; border-color: #c8a84b; }
.vd-ex-chip.active { background: #1a3a6e; border-color: #1a3a6e; color: #f4f1ea; }
.vd-ex-formula { font-size: 12px; font-weight: 700; color: inherit; }
.vd-ex-chip:not(.active) .vd-ex-formula { color: #1a3a6e; }
.vd-ex-name { font-size: 10px; color: inherit; opacity: 0.85; margin-top: 1px; }
.vd-ex-chip:not(.active) .vd-ex-name { color: #1a3a6e; }
.vd-ex-note { font-size: 9px; color: inherit; opacity: 0.7; margin-top: 1px; }
.vd-ex-chip:not(.active) .vd-ex-note { color: #8a8070; }
.vsepr-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* ── Atom tray ── */
.atom-tray {
  background: #f4f1ea;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  padding: 9px 12px;
}
.atom-tray-label {
  font-size: 10px;
  font-weight: 700;
  color: #1a3a6e;
  margin-bottom: 7px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.atom-tray-row { display: flex; gap: 7px; flex-wrap: wrap; }
.atom-chip {
  font-family: inherit;
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: #1a3a6e;
  cursor: pointer;
  transition: all 0.15s;
}
.atom-chip:hover { background: #f4f1ea; }
.atom-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; border: 1.5px solid rgba(0,0,0,0.18); box-sizing: border-box; }
.reset-chip {
  font-family: inherit;
  background: #FCEBEB;
  border: 1.5px solid #F09595;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  color: #A32D2D;
  cursor: pointer;
  transition: all 0.15s;
}
.reset-chip:hover { background: #f9d2d2; }

/* ── Legend panel ── */
.legend-panel {
  font-size: 10px;
  color: #1a3a6e;
  background: #ffffff;
  border: 1.5px dashed #1a3a6e;
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 3px;
}
.legend-dot.yellow {
  background: #c8a84b;
  border: 1.5px solid #8a8070;
}
.legend-dot.blue {
  background: rgba(26,58,110,0.3);
  border: 1.5px solid #1a3a6e;
}

/* ── Feedback ── */
.feedback {
  border-radius: 6px;
  padding: 9px 13px;
  font-size: 11.5px;
  font-weight: 600;
  display: none;
  line-height: 1.5;
}
.feedback.show { display: block; }
.feedback.success { background: #EAF3DE; color: #27500A; border: 1.5px solid #97C459; }
.feedback.error   { background: #FCEBEB; color: #791F1F; border: 1.5px solid #F09595; }
.feedback.info    { background: #f4f1ea; color: #1a3a6e; border: 1.5px solid #1a3a6e; }

/* ── Buttons ── */
.btn-row { display: flex; gap: 8px; }
.btn-submit {
  font-family: inherit;
  width: 100%;
  background: #1a3a6e;
  color: #f4f1ea;
  border: none;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
  letter-spacing: 0.1em;
}
.btn-submit:hover { background: #0f2550; }

/* ── Chemical Egg Card ── */
.egg-card {
  border-radius: 6px;
  padding: 11px 14px;
  background: #f4f1ea;
  border: 1.5px solid #1a3a6e;
  display: none;
  flex-direction: column;
  gap: 6px;
  animation: egg-slide-in 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.egg-card.show { display: flex; }
@keyframes egg-slide-in {
  from { opacity:0; transform: translateY(8px) scale(0.97); }
  to   { opacity:1; transform: translateY(0) scale(1); }
}
.egg-header { display: flex; align-items: center; gap: 8px; }
.egg-emoji { font-size: 22px; }
.egg-title { font-size: 12px; font-weight: 700; color: #1a3a6e; }
.egg-badge { font-size: 9px; font-weight: 700; background: #c8a84b; color: #1a3a6e; border-radius: 4px; padding: 2px 6px; margin-left: auto; }
.egg-text { font-size: 11px; color: #1a3a6e; line-height: 1.65; }

/* Bond angle live display */
.angle-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #8a8070;
  padding: 4px 0 2px;
}
.angle-value {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 52px;
}
.angle-bar-wrap { flex: 1; height: 5px; background: #ddd8cc; border-radius: 3px; }
.angle-bar { height: 5px; border-radius: 3px; transition: width 0.25s, background-color 0.25s; }

.lock-hint {
  font-size: 10px;
  color: #c8a84b;
  text-align: center;
  padding: 3px 0 6px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
</style>