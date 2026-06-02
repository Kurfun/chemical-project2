<script setup lang="ts">
// ════════════════════════════════════════════════════════════════
//  ChemingoViewer.vue — 適配專案設計系統（深藍金、手機單欄）
// ════════════════════════════════════════════════════════════════

import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { POINT_GROUPS, MOLECULE_DATA } from './constants';
import { renderMolecule } from './math-engine';
import type { Layers } from './types2';

// ── 1. 響應式狀態 ────────────────────────────────────────────────
const currentKey         = ref<string | null>(null);
const selectedPg = ref<string>('C₂ᵥ');

const rotX = ref<number>(0.25);
const rotY = ref<number>(0.5);
const isDragging = ref<boolean>(false);
const prevMouse  = reactive({ x: 0, y: 0 });

const layers = reactive<Layers>({ cn: true, sigma: true, i: false });

// ── 2. DOM Refs ──────────────────────────────────────────────────
const moleculeCanvas = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animFrameId: number | null = null;

// ── 3. Computed ──────────────────────────────────────────────────
const activeMolecule = computed(() =>
  currentKey.value ? MOLECULE_DATA[currentKey.value] ?? null : null
);

const hasInversionCenter = computed(() => {
  const el = activeMolecule.value?.elements;
  if (!el) return false;
  return el.includes(', i') || el.includes(' i,') || el.endsWith(' i');
});

// 選定點群後可用的分子清單
const availableMols = computed(() => {
  const g = POINT_GROUPS.find(g => g.pg === selectedPg.value);
  return g ? g.mols : [];
});

// ── 4. 渲染排程 ──────────────────────────────────────────────────
function triggerRender() {
  if (!moleculeCanvas.value || !ctx) return;
  renderMolecule({
    canvas: moleculeCanvas.value,
    ctx,
    currentKey: currentKey.value,
    rotX: rotX.value,
    rotY: rotY.value,
    layers,
    moleculeData: MOLECULE_DATA,
  });
}

function animate() {
  if (!isDragging.value) { rotY.value += 0.0012; triggerRender(); }
  animFrameId = requestAnimationFrame(animate);
}

function handleSelectMolecule(key: string) {
  currentKey.value = key;
  if (!hasInversionCenter.value) layers.i = false;
  triggerRender();
}

function toggleLayer(layerKey: keyof Layers) {
  if (layerKey === 'i' && !hasInversionCenter.value) return;
  layers[layerKey] = !layers[layerKey];
  triggerRender();
}


// ── 5. 事件處理 ──────────────────────────────────────────────────
function startDrag(clientX: number, clientY: number) {
  isDragging.value = true;
  prevMouse.x = clientX; prevMouse.y = clientY;
}
function moveDrag(clientX: number, clientY: number) {
  if (!isDragging.value) return;
  rotY.value += (clientX - prevMouse.x) * 0.012;
  rotX.value += (clientY - prevMouse.y) * 0.012;
  prevMouse.x = clientX; prevMouse.y = clientY;
  triggerRender();
}
function stopDrag() { isDragging.value = false; }

const handleResize = () => {
  const canvas = moleculeCanvas.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
  triggerRender();
};

// ── 6. 生命週期 ──────────────────────────────────────────────────
onMounted(() => {
  const canvas = moleculeCanvas.value;
  if (canvas) {
    ctx = canvas.getContext('2d');
    handleResize();
    window.addEventListener('resize', handleResize);
  }
  setTimeout(() => {
    const c2v = POINT_GROUPS.find(item => item.pg === 'C₂ᵥ');
    if (c2v?.mols[0]) handleSelectMolecule(c2v.mols[0]);
  }, 100);
  animate();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (animFrameId) cancelAnimationFrame(animFrameId);
});

watch(layers, () => { triggerRender(); }, { deep: true });
</script>

<template>
  <div class="viewer-wrapper">

    <!-- ── Canvas 區 ──────────────────────────────────────── -->
    <div class="canvas-block">
      <!-- 分子資訊條 -->
      <div class="mol-info-bar">
        <div class="mol-formula">
          {{ activeMolecule ? activeMolecule.formula : '—' }}
        </div>
        <div class="mol-name">
          {{ activeMolecule ? activeMolecule.name : '請選擇分子' }}
        </div>
        <div class="pg-badge" :class="{ empty: !activeMolecule }">
          {{ activeMolecule ? activeMolecule.pg : '—' }}
        </div>
      </div>

      <!-- 3D Canvas -->
      <div class="canvas-wrapper">
        <canvas
          ref="moleculeCanvas"
          @mousedown="startDrag($event.clientX, $event.clientY)"
          @mousemove="moveDrag($event.clientX, $event.clientY)"
          @mouseup="stopDrag"
          @mouseleave="stopDrag"
          @touchstart.passive="startDrag($event.touches[0]!.clientX, $event.touches[0]!.clientY)"
          @touchmove="moveDrag($event.touches[0]!.clientX, $event.touches[0]!.clientY)"
          @touchend="stopDrag"
        ></canvas>

        <div class="canvas-chips" v-if="activeMolecule">
          <span class="chip">{{ activeMolecule.shape }}</span>
          <span class="chip">{{ activeMolecule.angle }}</span>
        </div>
      </div>
    </div>

    <!-- ── 控制面板 ──────────────────────────────────────── -->
    <div class="control-panel">

      <!-- 點群 × 分子選擇 -->
      <div class="panel-section-title">點群 × 分子選擇</div>
      <div class="select-row">
        <!-- 點群下拉 -->
        <div class="select-wrap">
          <select
            class="chem-select"
            v-model="selectedPg"
            @change="currentKey = null"
          >
            <option v-for="g in POINT_GROUPS" :key="g.pg" :value="g.pg">
              {{ g.pg }}
            </option>
          </select>
        </div>

        <!-- 分子下拉（選好點群後才啟用） -->
        <div class="select-wrap">
          <select
            class="chem-select"
            :disabled="availableMols.length === 0"
            :value="currentKey ?? ''"
            @change="handleSelectMolecule(($event.target as HTMLSelectElement).value)"
          >
            <option value="" disabled>分子</option>
            <option v-for="mol in availableMols" :key="mol" :value="mol">
              {{ mol }}
            </option>
          </select>
        </div>
      </div>

      <!-- 對稱元素圖層 -->
      <div class="panel-section-title">對稱元素圖層</div>
      <div class="toggle-block">
        <div class="toggle-row">
          <span class="toggle-label">主要旋轉軸 Cₙ</span>
          <div class="toggle-switch" :class="{ on: layers.cn }" @click="toggleLayer('cn')">
            <div class="knob"></div>
          </div>
        </div>
        <div class="toggle-row">
          <span class="toggle-label">對稱鏡面 σ</span>
          <div class="toggle-switch" :class="{ on: layers.sigma }" @click="toggleLayer('sigma')">
            <div class="knob"></div>
          </div>
        </div>
        <div
          class="toggle-row"
          :style="{ opacity: hasInversionCenter ? 1 : 0.35, pointerEvents: hasInversionCenter ? 'auto' : 'none' }"
        >
          <span class="toggle-label">對稱中心 i（限線形/高對稱分子）</span>
          <div class="toggle-switch" :class="{ on: layers.i }" @click="toggleLayer('i')">
            <div class="knob"></div>
          </div>
        </div>
      </div>

      <!-- 點群推導資訊 -->
      <div class="panel-section-title">點群推導</div>
      <div class="reveal-card">
        <div class="reveal-row">
          <span class="reveal-tag">對稱元素</span>
          <span class="reveal-elements">{{ activeMolecule ? activeMolecule.elements : '—' }}</span>
        </div>
        <div class="reveal-divider"></div>
        <div class="reveal-tag">幾何結構解析</div>
        <p class="reveal-desc">
          {{ activeMolecule ? activeMolecule.desc : '請從上方選擇一個分子以查看對稱性分析。' }}
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────── */
.viewer-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 24px;
  font-family: 'Noto Serif TC', 'Georgia', serif;
  color: #1a3a6e;
}

/* ── Canvas Block ────────────────────────────────────────── */
.canvas-block {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 2px solid #1a3a6e;
  border-radius: 8px;
  overflow: hidden;
}

/* 分子資訊條 */
.mol-info-bar {
  background: #1a3a6e;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mol-formula {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f4f1ea;
  letter-spacing: 0.05em;
}

.mol-name {
  flex: 1;
  font-size: 0.72rem;
  color: #a8c4e8;
  letter-spacing: 0.08em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pg-badge {
  background: rgba(255,255,255,0.18);
  color: #c8a84b;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 4px;
  letter-spacing: 0.06em;
  flex-shrink: 0;
  transition: opacity 0.2s;
}
.pg-badge.empty { opacity: 0.4; color: #f4f1ea; }

/* Canvas */
.canvas-wrapper {
  position: relative;
  width: 100%;
  background: #f9f7f2;
}

canvas {
  width: 100%;
  height: min(280px, 60vw);
  display: block;
  cursor: grab;
}
canvas:active { cursor: grabbing; }

/* 資訊 Chips */
.canvas-chips {
  position: absolute;
  bottom: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
  pointer-events: none;
}

.chip {
  background: rgba(244, 241, 234, 0.92);
  border: 1px solid #c8b89a;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.06em;
}

/* ── Control Panel ───────────────────────────────────────── */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-section-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8a8070;
  padding-top: 4px;
}

/* ── Select Row ──────────────────────────────────────────── */
.select-row {
  display: flex;
  gap: 8px;
}

.select-wrap {
  flex: 1;
  position: relative;
}

.select-wrap::after {
  content: '▾';
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: #8a8070;
  pointer-events: none;
}

.chem-select {
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background: #fff;
  border: 1.5px solid #c8b89a;
  border-radius: 6px;
  padding: 8px 28px 8px 10px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1a3a6e;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: border-color 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chem-select:focus {
  outline: none;
  border-color: #1a3a6e;
  box-shadow: 0 0 0 2px #1a3a6e22;
}

.chem-select:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Toggle Controls ─────────────────────────────────────── */
.toggle-block {
  background: #fff;
  border: 1.5px solid #c8b89a;
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: opacity 0.2s;
}

.toggle-label {
  font-size: 0.72rem;
  color: #3a3020;
  flex: 1;
  line-height: 1.4;
  letter-spacing: 0.03em;
}

.toggle-switch {
  width: 36px;
  height: 20px;
  background: #c8b89a;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
}
.toggle-switch.on { background: #1a3a6e; }

.knob {
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: left 0.2s;
}
.toggle-switch.on .knob { left: 19px; }

/* ── Reveal Card ─────────────────────────────────────────── */
.reveal-card {
  background: #fff;
  border: 1.5px solid #c8b89a;
  border-radius: 6px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reveal-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.reveal-tag {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  color: #8a8070;
  text-transform: uppercase;
  flex-shrink: 0;
}

.reveal-elements {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.04em;
}

.reveal-divider {
  height: 1px;
  background: #e0d8cc;
}

.reveal-desc {
  font-size: 0.72rem;
  color: #5a4e3a;
  line-height: 1.7;
  letter-spacing: 0.03em;
}
</style>