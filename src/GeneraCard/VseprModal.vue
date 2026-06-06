<script setup lang="ts">
import { ref, reactive, nextTick, onUnmounted, computed } from 'vue';
import { CPK, VSEPR_SHAPES, EXAMPLES_3D_DATA } from './constants2';
import { projectModal, getPlaneVertices } from './utils';

const props = defineProps<{
  isOpen: boolean;
  initialVseprKey: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const activeVseprKey = ref<string>(props.initialVseprKey);
const currentModalMoleculeKey = ref<string>('H₂O');
const modalRotX = ref<number>(0.3);
const modalRotY = ref<number>(0.5);

const modalCanvasRef = ref<HTMLCanvasElement | null>(null);
const svgRefs = ref<Record<string, SVGGElement | null>>({});

let isDraggingModal = false;
let prevModalMouse = { x: 0, y: 0 };
let modalAnimId: number | null = null;

const modalLayers = reactive({
  sigma: true,
  cn: true
});

const activeVseprShape = computed(() => VSEPR_SHAPES.find(s => s.key === activeVseprKey.value));

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

  // 1. 化學鍵
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

  // 2. 球體原子
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

        mCtx.beginPath();
        mCtx.arc(a.sx - r * 0.3, a.sy - r * 0.3, r * 0.25, 0, Math.PI * 2);
        mCtx.fillStyle = 'rgba(255,255,255,0.45)';
        mCtx.fill();
      }
    });
  });

  // 3. 對稱鏡面 σ
  if (modalLayers.sigma && mol3d.planeNormals && mol3d.planeNormals.length > 0) {
    mol3d.planeNormals.forEach((normal, pIdx) => {
      const corners3D = getPlaneVertices(normal, 1.3);
      if (!corners3D) return;
      const corners = corners3D.map(pt =>
        projectModal(pt[0], pt[1], pt[2], modalRotX.value, modalRotY.value, mCanvas.width, mCanvas.height)
      );

      let r = 26, g = 86, b = 160;
      if (pIdx === 1) { r = 210; g = 70; b = 70; }
      else if (pIdx === 2) { r = 74; g = 122; b = 160; }

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

  // 4. 對稱軸 Cn
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
  VSEPR_SHAPES.forEach(shape => {
    const container = svgRefs.value[shape.key];
    if (!container) return;
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

function initModalElements() {
  showVseprDetail(activeVseprKey.value);
  nextTick(() => {
    startModalAutoRotation();
    drawVseprSvgPreviews();
  });
}

function handleClose() {
  if (modalAnimId) {
    cancelAnimationFrame(modalAnimId);
    modalAnimId = null;
  }
  emit('close');
}

// 拖曳控制
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
function onModalMouseUp() { isDraggingModal = false; }
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

onUnmounted(() => {
  if (modalAnimId) cancelAnimationFrame(modalAnimId);
});

defineExpose({
  initModalElements
});
</script>

<template>
  <div v-if="props.isOpen" class="vsepr-overlay show" @click.self="handleClose">
    <div class="vsepr-modal">
      <div class="vsepr-modal-header">
        <div>
          <div class="vsepr-modal-title">VSEPR 空間對稱互動教室</div>
          <div class="vsepr-modal-sub">點擊分子幾何形狀與其實體例子，可直接拖曳檢視 3D 模型與其對稱平面元素</div>
        </div>
        <button class="vsepr-close" @click="handleClose">關閉 ×</button>
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
</template>

<style scoped>
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
</style>