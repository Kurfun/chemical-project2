<template>
  <div class="match-wrapper">

    <!-- 載入中 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>載入分子資料中…</p>
    </div>

    <!-- 載入失敗 -->
    <div v-else-if="loadError" class="error-state">
      <p>⚠️ 無法連線至 PubChem</p>
      <button class="reset-btn" @click="loadData">重試</button>
    </div>

    <!-- 遊戲主體 -->
    <template v-else>
      <!-- 狀態列 -->
      <div class="status-bar">
        <div class="stat">
          <span class="stat-label">配對</span>
          <span class="stat-value">{{ matchedPct }}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">步數</span>
          <span class="stat-value">{{ moves }}</span>
        </div>
        <button class="reset-btn" @click="resetGame">↺ 重置</button>
      </div>

      <!-- 卡片格 4×2 -->
      <div class="card-grid">
        <div
          v-for="card in board"
          :key="card.uid"
          class="card-cell"
          :class="{
            selected: selectedUids.includes(card.uid),
            matched:  card.matched,
            wrong:    wrongUids.includes(card.uid),
          }"
          @click="pick(card)"
        >
          <!-- 分子式卡 -->
          <template v-if="card.type === 'formula'">
            <div class="card-tag">式</div>
            <div class="card-name">{{ card.name }}</div>
            <div class="card-formula">{{ card.formula }}</div>
          </template>

          <!-- 結構圖卡（PubChem PNG） -->
          <template v-else>
            <div class="card-tag">圖</div>
            <div class="card-name">{{ card.name }}</div>
            <img :src="card.imgUrl" :alt="card.name" class="card-img" loading="lazy" />
          </template>

          <!-- 配對成功遮罩 -->
          <div v-if="card.matched" class="matched-overlay">✓</div>
        </div>
      </div>

      <!-- 完成提示 -->
      <transition name="win-fade">
        <div v-if="allMatched" class="win-banner">
          <div class="win-icon">🎉</div>
          <p class="win-text">Finish!</p>
          <p class="win-sub">{{ moves }} steps in total</p>
          <button class="win-btn" @click="resetGame">Try Again</button>
        </div>
      </transition>
    </template>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'

// ── 完整分子清單（每局隨機抽 4 個） ──────────────────────
const ALL_NAMES = [
  'Methane', 'Ethanol', 'Glucose', 'Sucrose',
  'Acetone', 'Formaldehyde', 'Urea', 'Benzene',
]

const ROUND_SIZE = 4  // 每局使用幾組分子

const BASE = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name'

// ── 型別 ──────────────────────────────────────────────────
interface MolData { name: string; formula: string; imgUrl: string }

interface Card {
  uid:     string
  id:      number
  type:    'formula' | 'structure'
  name:    string
  formula: string
  imgUrl:  string
  matched: boolean
}

// ── 工具 ──────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 從 pool 隨機抽取 n 個不重複元素 */
function sample<T>(pool: T[], n: number): T[] {
  return shuffle([...pool]).slice(0, n)
}

function buildBoard(molecules: MolData[]): Card[] {
  const cards: Card[] = molecules.flatMap((m, i) => [
    { uid: `f-${i}-${Math.random()}`, id: i, type: 'formula',   ...m, matched: false },
    { uid: `s-${i}-${Math.random()}`, id: i, type: 'structure', ...m, matched: false },
  ])
  return shuffle(cards)
}

export default defineComponent({
  name: 'OrganicMatch',
  setup() {
    // ── 狀態 ──────────────────────────────────────────────
    const loading   = ref(true)
    const loadError = ref(false)
    const allMolecules = ref<MolData[]>([])   // 完整 8 筆快取
    const roundMols    = ref<MolData[]>([])   // 本局 4 筆

    const board        = ref<Card[]>([])
    const selectedUids = ref<string[]>([])
    const wrongUids    = ref<string[]>([])
    const moves        = ref(0)
    const locked       = ref(false)

    const matchedCount = computed(() => board.value.filter(c => c.matched).length / 2)
    const matchedPct = computed(() => Math.round((matchedCount.value / 4) * 100))
    const allMatched   = computed(() => roundMols.value.length > 0 && board.value.every(c => c.matched))

    // ── PubChem fetch ──────────────────────────────────────
    async function fetchMolecule(name: string): Promise<MolData> {
      const res = await fetch(`${BASE}/${name}/property/MolecularFormula/JSON`)
      const json = await res.json()
      const formula: string = json.PropertyTable.Properties[0].MolecularFormula
      const imgUrl = `${BASE}/${name}/PNG?image_size=150x150`
      return { name, formula, imgUrl }
    }

    async function loadData() {
      loading.value   = true
      loadError.value = false
      try {
        allMolecules.value = await Promise.all(ALL_NAMES.map(fetchMolecule))
        startRound()
      } catch {
        loadError.value = true
      } finally {
        loading.value = false
      }
    }

    // ── 開始一局（重新抽 4 個） ────────────────────────────
    function startRound() {
      roundMols.value    = sample(allMolecules.value, ROUND_SIZE)
      board.value        = buildBoard(roundMols.value)
      selectedUids.value = []
      wrongUids.value    = []
      moves.value        = 0
      locked.value       = false
    }

    // ── 遊戲邏輯 ──────────────────────────────────────────
    function pick(card: Card) {
      if (locked.value || card.matched) return
      if (selectedUids.value.includes(card.uid)) return
      if (selectedUids.value.length >= 2) return

      selectedUids.value = [...selectedUids.value, card.uid]

      if (selectedUids.value.length === 2) {
        locked.value = true
        moves.value++
        const [uid1, uid2] = selectedUids.value
        const c1 = board.value.find(c => c.uid === uid1)!
        const c2 = board.value.find(c => c.uid === uid2)!

        if (c1.id === c2.id && c1.type !== c2.type) {
          setTimeout(() => {
            board.value = board.value.map(c =>
              c.uid === uid1 || c.uid === uid2 ? { ...c, matched: true } : c
            )
            selectedUids.value = []
            locked.value = false
          }, 500)
        } else {
          wrongUids.value = [uid1, uid2]
          setTimeout(() => {
            selectedUids.value = []
            wrongUids.value    = []
            locked.value = false
          }, 800)
        }
      }
    }

    function resetGame() {
      startRound()  // 重置時重新抽題
    }

    onMounted(loadData)

    return {
      loading, loadError, board,
      selectedUids, wrongUids,
      moves, matchedCount,matchedPct, allMatched,
      pick, resetGame, loadData,
    }
  }
})
</script>

<style scoped>
.match-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 0 16px;
  user-select: none;
  position: relative;
}

/* ── 載入 / 錯誤 ─────────────────────────────────────── */
.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #8a8070;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
}

.spinner {
  width: 32px; height: 32px;
  border: 3px solid #ddd8cc;
  border-top-color: #1a3a6e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Status Bar ──────────────────────────────────────── */
.status-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.stat-label { font-size: 0.62rem; letter-spacing: 0.15em; color: #a09880; }
.stat-value { font-size: 1rem; font-weight: 700; color: #1a3a6e; }

.reset-btn {
  margin-left: auto;
  background: none;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  padding: 5px 14px;
  font-family: inherit;
  font-size: 0.8rem;
  color: #1a3a6e;
  cursor: pointer;
  letter-spacing: 0.08em;
  transition: background 0.15s, color 0.15s;
}
.reset-btn:hover, .reset-btn:active { background: #1a3a6e; color: #f4f1ea; }

/* ── Grid：4 欄 × 2 列 ───────────────────────────────── */
.card-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);  /* 2欄 */
  grid-template-rows: repeat(4, 1fr);     /* 4列 */
  gap: 12px;
}

/* ── Card ────────────────────────────────────────────── */
.card-cell {
  position: relative;
  background: #fff;
  border: 2px solid #c8c0b0;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 10px;
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s, opacity 0.3s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  /* 4×2 時卡片更方正，比原來 3/4 更高 */
  aspect-ratio: 5/4;
}
.card-cell:hover:not(.matched) {
  border-color: #1a3a6e;
  box-shadow: 2px 4px 0 #1a3a6e22;
  transform: translateY(-2px);
}
.card-cell.selected {
  border-color: #1a3a6e;
  box-shadow: 0 0 0 3px #1a3a6e44;
  background: #eef2f9;
}
.card-cell.wrong {
  border-color: #c0392b;
  background: #fdf0ef;
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-5px); }
  75%      { transform: translateX(5px); }
}
.card-cell.matched { opacity: 0.28; cursor: default; pointer-events: none; }

.card-tag {
  position: absolute;
  top: 5px; right: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #c8a84b;
}
.card-name {
  font-size: clamp(0.6rem, 2.5vw, 0.8rem);
  color: #8a8070;
  letter-spacing: 0.03em;
  text-align: center;
}
.card-formula {
  font-size: clamp(1rem, 4vw, 1.3rem);
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.05em;
  text-align: center;
}

/* PubChem PNG 圖片：4×2 時可放更大 */
.card-img {
  width: 70%;
  aspect-ratio: 1;
  object-fit: contain;
  mix-blend-mode: multiply;
}

/* ── Matched Overlay ─────────────────────────────────── */
.matched-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #2ecc71;
  background: #fff8;
  border-radius: 8px;
}

/* ── Win Banner ──────────────────────────────────────── */
.win-banner {
  position: absolute;
  inset: 0;
  background: #ffffffee;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 25px;
  border-radius: 8px;
  z-index: 10;
}
.win-icon  { font-size: 3rem; }
.win-text  { font-size: 1.3rem; font-weight: 700; color: #1a3a6e; letter-spacing: 0.15em; }
.win-sub   { font-size: 0.8rem; color: #a09880; letter-spacing: 0.1em; }
.win-btn {
  margin-top: 10px;
  background: #1a3a6e;
  color: #f4f1ea;
  border: none;
  border-radius: 4px;
  padding: 12px 32px;
  font-family: inherit;
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: background 0.15s;
}
.win-btn:hover { background: #0f2550; }

.win-fade-enter-active { transition: opacity 0.4s, transform 0.4s; }
.win-fade-enter-from   { opacity: 0; transform: scale(0.94); }
</style>
