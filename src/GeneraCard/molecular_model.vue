<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue';
import { CPK, MOLECULES } from './constants2';
import type { AtomInPlay, BondInPlay, LonePair, RepulsionCloud, StabilityGlow, BondOrder } from './type4';
import { calculateAngle } from './utils';

// 引入拆分的子元件
import Workspace2D from './Workspace2D.vue';
import VseprModal from './VseprModal.vue';
import HintPanel from './HintPanel.vue';

// --- Vue 響應式狀態管理 ---
const currentMolKey = ref<string>('H2O');
const atomsInPlay = ref<AtomInPlay[]>([]);
const bondsInPlay = ref<BondInPlay[]>([]);
const currentScore = ref<number>(0);

// 子元件參照
const workspaceRef = ref<InstanceType<typeof Workspace2D> | null>(null);
const modalRef = ref<InstanceType<typeof VseprModal> | null>(null);

// 遊戲內部狀態
const structureLocked = ref<boolean>(false);
const lonePairs = ref<LonePair[]>([]);
let lpIdCounter = 0;

// 特效反應響應包
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

// 即時鍵角（由 Workspace 同步至頂層 UI）
const isAngleDisplayVisible = ref<boolean>(false);
const angleLabel = ref<string>('實時鍵角');
const angleValueStr = ref<string>('—');
const angleBarWidth = ref<string>('0%');
const angleTextColor = ref<string>('#1a3a6e');
const angleBarBg = ref<string>('#1a3a6e');

// 反饋通知
const feedbackText = ref<string>('');
const feedbackType = ref<'success' | 'error' | 'info' | ''>('');

// 化學彩蛋卡片
const eggCardShow = ref<boolean>(false);
const eggEmoji = ref<string>('💧');
const eggTitle = ref<string>('');
const eggText = ref<string>('');

// Modal 彈窗開關與 Key 值
const isVseprModalOpen = ref<boolean>(false);
const activeVseprKey = ref<string>('bent_4');

// 計算屬性
const activeMolecule = computed(() => MOLECULES[currentMolKey.value]);

function triggerRepulsionWave(x: number, y: number) {
  repulsionCloud.active = true;
  repulsionCloud.x = x;
  repulsionCloud.y = y;
  repulsionCloud.radius = 10;
  repulsionCloud.alpha = 1.0;
  repulsionCloud.phase = 0;
  if (workspaceRef.value) {
    workspaceRef.value.createSparkles(x, y, '#F09595', 15);
  }
}

// 切換關卡與分子
function loadMol(key: string) {
  currentMolKey.value = key;
  const mol = MOLECULES[key];

  atomsInPlay.value = [];
  bondsInPlay.value = [];
  stabilityGlow.active = false;
  stabilityGlow.strength = 0;
  repulsionCloud.active = false;
  lonePairs.value = [];
  structureLocked.value = false;

  eggCardShow.value = false;
  isAngleDisplayVisible.value = false;
  angleLabel.value = '實時鍵角';

  // 初始化放置中心原子於 2D 畫布正中央
  const rx = 205; // Canvas 固定 width 410 / 2
  const ry = 105; // Canvas 固定 height 210 / 2
  atomsInPlay.value.push({
    id: 1,
    symbol: mol.centralAtom,
    x: rx,
    y: ry,
    isCentral: true
  });

  hideFeedback();
  activeVseprKey.value = mol.shapeKey;
}

// 產生新的配位原子
function spawnAtom(symbol: string) {
  const mol = activeMolecule.value;
  const countInPlay = atomsInPlay.value.filter(a => a.symbol === symbol).length;
  const targetCount = mol.atoms[symbol] || 0;

  if (countInPlay >= targetCount) {
    showFeedback(`已達到該原子最大加入上限！`, 'error');
    return;
  }

  const id = atomsInPlay.value.length + 1;
  const rx = 50 + Math.random() * (410 - 100);
  const ry = 50 + Math.random() * (210 - 100);

  atomsInPlay.value.push({
    id,
    symbol,
    x: rx,
    y: ry,
    isCentral: false
  });

  if (workspaceRef.value) {
    workspaceRef.value.createSparkles(rx, ry, CPK[symbol].fill, 6);
  }
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

function handleAngleUpdate(info: { visible: boolean; label: string; valStr: string; pct: number; color: string; bg: string }) {
  isAngleDisplayVisible.value = info.visible;
  angleLabel.value = info.label;
  angleValueStr.value = info.valStr;
  angleBarWidth.value = `${info.pct}%`;
  angleTextColor.value = info.color;
  angleBarBg.value = info.bg;
}

function showTheoreticalAngle() {
  const mol = activeMolecule.value;
  const idealAngle = mol.hints.find(h => h[0].includes('理論夾角') || h[0].includes('理論鍵角'))?.[1] || '—';

  isAngleDisplayVisible.value = true;
  angleLabel.value = '理論鍵角';
  const idealNum = parseFloat(idealAngle) || 0;
  angleValueStr.value = idealAngle;
  angleTextColor.value = '#1a3a6e';

  const pct = Math.max(0, Math.min(100, ((idealNum - 90) / 90) * 100));
  angleBarWidth.value = `${pct}%`;
  angleBarBg.value = '#c8a84b';
}

function lockStructure(correct: boolean) {
  structureLocked.value = true;
  if (correct) {
    showCorrectStructure();
  }
}

// 根據 VSEPR 排斥力對稱夾角自動重排並校正
function showCorrectStructure() {
  const mol = activeMolecule.value;
  const cx = 205;
  const cy = 105;

  const layoutMap: Record<string, { center: string; offsets: Record<string, [number, number]>; bonds: [number, number, BondOrder][]; lp: 'auto' | any[] }> = {
    H2O: { center: 'O', offsets: { O: [0, 0], H1: [-0.45, 0.32], H2: [0.45, 0.32] }, bonds: [[0, 1, 'single'], [0, 2, 'single']], lp: 'auto' },
    NH3: { center: 'N', offsets: { N: [0, 0], H1: [-0.42, 0.32], H2: [0.42, 0.32], H3: [0, -0.5] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single']], lp: 'auto' },
    BF3: { center: 'B', offsets: { B: [0, 0], F1: [0, -0.52], F2: [0.45, 0.26], F3: [-0.45, 0.26] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single']], lp: [] },
    CO2: { center: 'C', offsets: { C: [0, 0], O1: [-0.52, 0], O2: [0.52, 0] }, bonds: [[0, 1, 'double'], [0, 2, 'double']], lp: [] },
    CH4: { center: 'C', offsets: { C: [0, 0], H1: [0, -0.5], H2: [0.45, 0.25], H3: [-0.45, 0.25], H4: [0, 0.52] }, bonds: [[0, 1, 'single'], [0, 2, 'single'], [0, 3, 'single'], [0, 4, 'single']], lp: [] }
  };

  const layout = layoutMap[currentMolKey.value];
  if (!layout) return;

  const scale = 210 * 0.38;

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

  // 計算並預覽 VSEPR 排斥角弧度
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

// 提交判定 (完全數據驅動化驗證引擎)
function checkAnswer() {
  const mol = activeMolecule.value;

  // 1. 驗證原子數量
  const placedCounts: Record<string, number> = {};
  atomsInPlay.value.forEach(a => {
    placedCounts[a.symbol] = (placedCounts[a.symbol] || 0) + 1;
  });

  for (const [symbol, count] of Object.entries(mol.atoms)) {
    if ((placedCounts[symbol] || 0) !== count) {
      showFeedback(`❌ 答題錯誤！原子數量不符，需要 ${count} 個 ${symbol}，目前只有 ${placedCounts[symbol] || 0} 個。`, 'error');
      triggerRepulsionWave(205, 105);
      return;
    }
  }

  // 2. 驗證中心原子存在
  const central = atomsInPlay.value.find(a => a.symbol === mol.centralAtom);
  if (!central) {
    showFeedback(`❌ 答題錯誤！找不到中心原子！`, 'error');
    return;
  }

  // 3. 驗證配位原子是否皆正確連線至中央原子
  const outers = atomsInPlay.value.filter(a => a.id !== central.id);
  const connectionsToCentral = bondsInPlay.value.filter(b => b.includes(central.id));

  if (connectionsToCentral.length !== outers.length) {
    showFeedback(`❌ 答題錯誤！連結不完整，所有配位原子都應連接到中央的 ${mol.centralAtom} 原子。`, 'error');
    triggerRepulsionWave(central.x, central.y);
    return;
  }

  // 4. 通用數據驅動幾何規則驗證
  if (mol.validationRules) {
    for (const rule of mol.validationRules) {
      if (rule.type === 'bent' || rule.type === 'linear' || rule.type === 'angle') {
        const targetAtomsInPlay = outers.filter(a => rule.targetAtoms.includes(a.symbol));
        if (targetAtomsInPlay.length >= 2) {
          const currentAngle = calculateAngle(central, targetAtomsInPlay[0], targetAtomsInPlay[1]);
          const angleDiff = Math.abs(currentAngle - rule.expectedValue);

          // 水彎曲判定 (不可成直線，夾角差太大)
          if (rule.type === 'bent' && angleDiff > rule.tolerance) {
            showFeedback(rule.errorMessage, 'error');
            triggerRepulsionWave(central.x, central.y - 30);
            return;
          }
          // 直線型判定 (必須呈對稱直線，偏離不可太大)
          if (rule.type === 'linear' && angleDiff > rule.tolerance) {
            showFeedback(rule.errorMessage, 'error');
            triggerRepulsionWave(central.x, central.y);
            return;
          }
          // 一般鍵角容差判定
          if (rule.type === 'angle' && angleDiff > rule.tolerance) {
            showFeedback(rule.errorMessage, 'error');
            triggerRepulsionWave(central.x, central.y);
            return;
          }
        }
      }
    }
  }

  // 解鎖成功特效
  stabilityGlow.active = true;
  stabilityGlow.phase = 0;
  if (workspaceRef.value) {
    workspaceRef.value.createSparkles(central.x, central.y, '#c8a84b', 24);
  }
  lockStructure(true);

  const idealAngle = mol.hints.find(h => h[0].includes('理論夾角') || h[0].includes('理論鍵角'))?.[1] || '—';
  showFeedback(`✅ 恭喜答題正確！成功建構了 ${mol.title.split('—')[0]}！\n✅ 正確答案：${mol.shape}，理論鍵角 ${idealAngle}`, 'success');

  eggEmoji.value = mol.eggEmoji || '💧';
  eggTitle.value = mol.eggTitle || '化學小彩蛋';
  eggText.value = mol.funFact;
  eggCardShow.value = true;

  showTheoreticalAngle();
  currentScore.value += mol.xp;
}

function openVsepr() {
  isVseprModalOpen.value = true;
  nextTick(() => {
    if (modalRef.value) {
      modalRef.value.initModalElements();
    }
  });
}

function closeVsepr() {
  isVseprModalOpen.value = false;
}

onMounted(() => {
  loadMol('H2O');
});
</script>

<template>
  <div class="molecular-model-app">
    <!-- VSEPR 科普互動 Modal 彈窗 -->
    <VseprModal
      ref="modalRef"
      :isOpen="isVseprModalOpen"
      :initialVseprKey="activeVseprKey"
      @close="closeVsepr"
    />

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
          v-for="(mol, key) in MOLECULES"
          :key="key"
          class="mol-btn"
          :class="{ active: key === currentMolKey }"
          @click="loadMol(key)"
        >
          {{ mol.title.split('—')[0].trim() }}
        </button>
      </div>

      <div class="body">
        <div class="challenge-row">
          <div class="challenge-badge">目標分子</div>
          <div class="challenge-title">{{ activeMolecule.title }}</div>
        </div>

        <!-- ── 桌機雙欄 / 手機單欄 容器 ── -->
        <div class="desktop-layout">

          <!-- ── 左欄：Canvas 建構區 + 原子庫 ── -->
          <div class="left-col">
            <Workspace2D
              ref="workspaceRef"
              v-model:atoms="atomsInPlay"
              v-model:bonds="bondsInPlay"
              v-model:lonePairs="lonePairs"
              :activeMolecule="activeMolecule"
              :structureLocked="structureLocked"
              :stabilityGlow="stabilityGlow"
              :repulsionCloud="repulsionCloud"
              @update-angle="handleAngleUpdate"
              @trigger-repulsion="triggerRepulsionWave"
              @show-feedback="showFeedback"
            />

            <div v-if="structureLocked" class="lock-hint">
              ✓ 結構對稱已解鎖 — 可按住拖曳旋轉分子觀察對稱幾何
            </div>

            <!-- 原子庫（桌機置於 canvas 下方） -->
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
                <div class="reset-chip" @click="loadMol(currentMolKey)">
                  <span>🔄 重置</span>
                </div>
              </div>
            </div>

            <!-- 操作說明小卡 -->
            <div v-if="!structureLocked" class="legend-panel">
              <span><span class="legend-dot yellow"></span>未鍵結電子</span>
              <span><span class="legend-dot blue"></span>鍵結電子</span>
              <span>連結兩原子的電子點形成穩定共價鍵</span>
            </div>

            <!-- 彩蛋知識卡（桌機：置於左欄） -->            <div v-if="eggCardShow" class="egg-card show">
              <div class="egg-header">
                <span class="egg-emoji">{{ eggEmoji }}</span>
                <span class="egg-title">{{ eggTitle }}</span>
                <span class="egg-badge">化學彩蛋</span>
              </div>
              <div class="egg-text">{{ eggText }}</div>
            </div>
          </div>

          <!-- ── 右欄：VSEPR 提示 + 按鈕 ── -->
          <div class="right-col">

            <!-- VSEPR 智慧提示面板 -->
            <HintPanel
              :activeMolecule="activeMolecule"
              @open-vsepr="openVsepr"
            />

            <!-- 鍵角顯示（桌機：移至右欄） -->
            <div v-if="isAngleDisplayVisible" class="angle-display">
              <span>{{ angleLabel }}</span>
              <div class="angle-value" :style="{ color: angleTextColor }">{{ angleValueStr }}</div>
              <div class="angle-bar-wrap">
                <div class="angle-bar" :style="{ width: angleBarWidth, background: angleBarBg }"></div>
              </div>
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

            <!-- 反饋警告（桌機：按鈕下方） -->
            <div
              v-if="feedbackText"
              class="feedback show"
              :class="feedbackType"
              v-html="feedbackText"
            ></div>

          </div><!-- end right-col -->
        </div><!-- end desktop-layout -->
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

/* ── Desktop two-column layout ── */
.desktop-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.left-col  { display: flex; flex-direction: column; gap: 8px; }
.right-col { display: flex; flex-direction: column; gap: 12px; }

@media (min-width: 720px) {
  /* 卡片在桌機撐開到雙欄所需寬度 */
  .card {
    max-width: 860px;
  }

  .body {
    padding: 18px 20px;
  }

  /* 桌機：左右並排；左欄固定 Canvas 比例，右欄自動填滿 */
  .desktop-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
  }

  /* 左欄：Canvas 固定寬度，維持 410:210 比例 */
  .left-col {
    flex: 0 0 420px;
    min-width: 0;
  }

  /* 右欄：自動填滿剩餘空間，有最小寬度避免過窄 */
  .right-col {
    flex: 1 1 0;
    min-width: 240px;
  }

  /* 桌機下提交按鈕固定在右欄底部 */
  .right-col .btn-row {
    margin-top: auto;
  }
}
</style>