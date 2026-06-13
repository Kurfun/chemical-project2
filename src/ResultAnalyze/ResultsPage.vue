<template>
  <div class="results-wrapper">

    <!-- ── 1. 圓餅圖（含右側排行榜按鈕） ── -->
    <section class="chart-section">
      <div class="chart-header">
        <h3 class="chart-title">複習次數比例</h3>
        <button class="leaderboard-btn" @click="showModal = true">
          <span class="btn-icon">🏆</span>
          <span class="btn-text">排行榜</span>
        </button>
      </div>

      <div class="pie-area">
        <canvas ref="pieCanvas" class="pie-canvas"></canvas>
        <div class="pie-legend">
          <div v-for="item in SUBJECTS" :key="item.key" class="legend-item">
            <span class="legend-dot" :style="{ background: item.color }"></span>
            <span class="legend-label">{{ item.label }}</span>
            <span class="legend-count">{{ visits[item.key] }} 次</span>
          </div>
        </div>
      </div>
    </section>

    <div class="divider"></div>

    <!-- ── 2. 長條圖（已放大佈局尺寸與項目字體） ── -->
    <section class="chart-section">
      <h3 class="chart-title bar-title">複習次數統計</h3>
      <div class="bar-container">
        <canvas ref="barCanvas" class="bar-canvas"></canvas>
      </div>
    </section>

    <!-- ── 🏆 彈出式排行榜（Modal Overlay） ── -->
    <div class="modal-overlay" :class="{ 'is-active': showModal }" @click.self="showModal = false">
      <div class="modal-card" :class="{ 'is-active': showModal }">
        
        <!-- 彈窗標頭 -->
        <div class="modal-header">
          <div class="modal-title-group">
            <h4 class="modal-title">排名</h4>
            <p class="modal-subtitle">rank</p>
          </div>
          <button class="modal-close-x" @click="showModal = false">×</button>
        </div>

        <!-- 排名列表 -->
        <div class="leaderboard-list">
          <div 
            v-for="(player, index) in rankedPlayers" 
            :key="player.name" 
            class="leaderboard-item"
            :class="{ 'is-self': player.isSelf, 'is-top-three': index < 3 }"
          >
            <!-- 排名徽章 -->
            <div class="rank-badge" :class="'rank-' + (index + 1)">
              <span v-if="index === 0">👑</span>
              <span v-else-if="index === 1">Ⅱ</span>
              <span v-else-if="index === 2">Ⅲ</span>
              <span v-else>{{ index + 1 }}</span>
            </div>

            <!-- 玩家資訊 -->
            <div class="player-info">
              <div class="player-meta">
                <span class="player-name">{{ player.name }}</span>
                <span v-if="player.isSelf" class="self-tag">汝</span>
              </div>
              <!-- 簡易視覺進度條 -->
              <div class="progress-track">
                <div 
                  class="progress-bar" 
                  :style="{ width: Math.min(100, (player.score / 5) * 100) + '%' }"
                  :class="{ 'bar-gold': player.isSelf }"
                ></div>
              </div>
            </div>

            <!-- 分數顯示 -->
            <div class="player-score">
              <span class="score-num">{{ player.score }}</span>
              <span class="score-unit">次</span>
            </div>
          </div>
        </div>

        <!-- 底部激勵語錄提示 -->
        <div class="leaderboard-tip" v-if="selfRank > 1">
          💡 還差 <strong class="highlight">{{ 5 - selfScore }}</strong> 次複習，即可登頂！
        </div>
        <div class="leaderboard-tip success" v-else>
          🎉 恭喜User1得了MVP!
        </div>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { VISITS_KEY, type Visits } from './useVisits'

// ── 科目設定 ──────────────────────────────────────────────
const SUBJECTS = [
  { key: 'organic',    label: '普通化學', color: '#1a3a6e' },
  { key: 'inorganic',  label: '無機化學', color: '#c8a84b' },
  { key: 'analytical', label: '週期表', color: '#a39b82' },
  { key: 'pharma',     label: '藥理學', color: '#5c7a95' }
] as const

export default defineComponent({
  name: 'ResultsPage',
  setup() {
    const visits = inject(VISITS_KEY, ref<Visits>({
      organic: 0,
      inorganic: 0,
      analytical: 0,
      pharma: 0
    }))

    // 控制彈出視窗開關
    const showModal = ref(false)

    // ── 繪圖相關 DOM 參照 ──────────────────────────────────
    const pieCanvas = ref<HTMLCanvasElement | null>(null)
    const barCanvas = ref<HTMLCanvasElement | null>(null)

    // ── 📊 圓餅圖與長條圖邏輯 ──────────────────────────────
    const totalCount = computed(() => {
      const v = visits.value
      return v.organic + v.inorganic + v.analytical + v.pharma
    })

    // ── 🏆 排行榜相關邏輯 ──────────────────────────────────
    // 初始化其他 4 位同儕的複習次數 (0~4 隨機次數，在 session 中保持不變)
    const opponents = ref([
      { name: 'Jason', score: Math.floor(Math.random() * 5) },
      { name: 'lyna',  score: Math.floor(Math.random() * 5) },
      { name: 'misa',  score: Math.floor(Math.random() * 5) },
      { name: 'kevin', score: Math.floor(Math.random() * 5) }
    ])

    // 自己 (User1) 的複習總次數
    const selfScore = computed(() => totalCount.value)

    // 合併自己並進行排序
    const rankedPlayers = computed(() => {
      const list = [
        { name: 'User1', score: selfScore.value, isSelf: true },
        ...opponents.value.map(op => ({ name: op.name, score: op.score, isSelf: false }))
      ]
      
      // 先比次數 (降序)；次數相同時，將「自己」排在前面，否則依名稱排序保持列表穩定
      return list.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score
        }
        if (a.isSelf) return -1
        if (b.isSelf) return 1
        return a.name.localeCompare(b.name)
      })
    })

    // 計算自己的當前名次
    const selfRank = computed(() => {
      return rankedPlayers.value.findIndex(player => player.isSelf) + 1
    })

    // ── 🎨 Canvas 繪製核心邏輯 ─────────────────────────────
    const drawPie = () => {
      const canvas = pieCanvas.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      ctx.scale(2, 2)

      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      const radius = Math.min(cx, cy) - 4

      if (totalCount.value === 0) {
        ctx.beginPath()
        ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2)
        ctx.strokeStyle = '#ddd8cc'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = '#8a8070'
        ctx.font = "italic 11px 'Noto Serif TC', serif"
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('尚無複習資料', cx, cy)
        return
      }

      let startAngle = -Math.PI / 2
      SUBJECTS.forEach((sub) => {
        const count = visits.value[sub.key]
        if (count === 0) return

        const ratio = count / totalCount.value
        const angle = ratio * Math.PI * 2
        const endAngle = startAngle + angle

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = sub.color
        ctx.fill()

        if (ratio >= 0.08) {
          const midAngle = startAngle + angle / 2
          const lx = cx + (radius * 0.6) * Math.cos(midAngle)
          const ly = cy + (radius * 0.6) * Math.sin(midAngle)
          ctx.fillStyle = '#ffffff'
          ctx.font = "bold 9px sans-serif"
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${Math.round(ratio * 100)}%`, lx, ly)
        }

        startAngle = endAngle
      })
    }

    const drawBar = () => {
      const canvas = barCanvas.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * 2
      canvas.height = rect.height * 2
      ctx.scale(2, 2)

      const w = rect.width
      const h = rect.height
      ctx.clearRect(0, 0, w, h)

      const paddingLeft = 32
      const paddingRight = 12
      const paddingTop = 20
      const paddingBottom = 44 // 擴增至 44，為 14px 項目文字預留充足折行與溢出緩衝空間

      const chartW = w - paddingLeft - paddingRight
      const chartH = h - paddingTop - paddingBottom

      const counts = SUBJECTS.map(s => visits.value[s.key])
      const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length

      // 加入明確的 isAvg 標記以利精確判定小數點顯示
      const data = [
        ...SUBJECTS.map(s => ({ label: s.label, val: visits.value[s.key], color: s.color, isAvg: false })),
        { label: '平均值', val: avg, color: '#f0a868', isAvg: true }
      ]

      const maxVal = Math.max(...data.map(d => d.val), 5)
      const yTicksCount = 5
      const yMax = Math.ceil(maxVal / yTicksCount) * yTicksCount

      ctx.strokeStyle = '#e6e1d3'
      ctx.lineWidth = 1
      ctx.fillStyle = '#8a8070'
      ctx.font = "10px sans-serif"
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'

      for (let i = 0; i <= yTicksCount; i++) {
        const val = (yMax / yTicksCount) * i
        const y = paddingTop + chartH - (val / yMax) * chartH
        
        ctx.beginPath()
        ctx.moveTo(paddingLeft, y)
        ctx.lineTo(w - paddingRight, y)
        ctx.stroke()

        ctx.fillText(val.toFixed(0), paddingLeft - 6, y)
      }

      const barCount = data.length
      const groupW = chartW / barCount
      const barW = Math.min(22, groupW * 0.55)

      data.forEach((item, i) => {
        const x = paddingLeft + (i * groupW) + (groupW - barW) / 2
        const barH = (item.val / yMax) * chartH
        const y = paddingTop + chartH - barH

        if (barH > 0) {
          ctx.fillStyle = item.color
          ctx.beginPath()
          const radius = Math.min(4, barH)
          ctx.moveTo(x, y + barH)
          ctx.lineTo(x, y + radius)
          ctx.quadraticCurveTo(x, y, x + radius, y)
          ctx.lineTo(x + barW - radius, y)
          ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
          ctx.lineTo(x + barW, y + barH)
          ctx.closePath()
          ctx.fill()

          ctx.fillStyle = '#1a3a6e'
          ctx.font = "bold 9px sans-serif"
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          // 透過 item.isAvg 精確決定小數點顯示：平均值一律保留 1 位小數，一般學科則為 0 位（整數）
          ctx.fillText(item.val.toFixed(item.isAvg ? 1 : 0), x + barW / 2, y - 2)
        }

        ctx.fillStyle = '#4a453a'
        ctx.font = "14px 'Noto Serif TC', serif" // 字體放大至 14px，完全與圓餅圖 0.88rem (14px) 保持一致
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'

        const line1 = item.label.substring(0, 2)
        const line2 = item.label.substring(2)
        ctx.fillText(line1, x + barW / 2, paddingTop + chartH + 4)
        if (line2) {
          ctx.fillText(line2, x + barW / 2, paddingTop + chartH + 20) // 行距從 18px 稍微調整至 20px，完美契合字級
        }
      })
    }

    let resizeObserver: ResizeObserver | null = null

    const redraw = () => {
      drawPie()
      drawBar()
    }

    onMounted(() => {
      nextTick(() => {
        redraw()
        if (pieCanvas.value && barCanvas.value) {
          resizeObserver = new ResizeObserver(() => {
            redraw()
          })
          if (pieCanvas.value.parentElement) {
            resizeObserver.observe(pieCanvas.value.parentElement)
          }
        }
      })
    })

    onUnmounted(() => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    })

    watch(visits, () => {
      redraw()
    }, { deep: true })

    return {
      visits,
      pieCanvas,
      barCanvas,
      SUBJECTS,
      rankedPlayers,
      selfScore,
      selfRank,
      showModal
    }
  }
})
</script>

<style scoped>
/* ── 基礎排版 ────────────────────────────────────────── */
.results-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 10px 4px 30px;
}

.chart-section {
  width: 100%;
  max-width: 500px;           /* 控制電腦版不過寬，維持一致視覺 */
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── 標題與按鈕對齊排版 ─────────────────────────────── */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid #eeeae1;
  padding-bottom: 8px;
}

.chart-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #8a8070;
  text-transform: uppercase;
}

/* 長條圖標題維持置中樣式 */
.bar-title {
  text-align: center;
  border-bottom: none;
  padding-bottom: 0;
}

/* 排行榜觸發按鈕 */
.leaderboard-btn {
  background: #fff;
  border: 1px solid #1a3a6e;
  border-radius: 4px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

.leaderboard-btn:hover,
.leaderboard-btn:active {
  background: #1a3a6e;
  color: #fff;
}

.btn-icon {
  font-size: 0.85rem;
}

.btn-text {
  font-size: 0.72rem;
  font-weight: bold;
  letter-spacing: 0.1em;
}

.divider {
  width: 100%;
  max-width: 500px;
  height: 1px;
  background: #ddd8cc;
  flex-shrink: 0;
}

/* ── 圓餅圖區域 ──────────────────────────────────────── */
.pie-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
}

.pie-canvas {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 0.88rem;
  color: #4a453a;
  min-width: 60px;
}

.legend-count {
  font-size: 0.85rem;
  font-weight: bold;
  color: #1a3a6e;
}

/* ── 長條圖區域（加大高度，減少底部空白） ── */
.bar-container {
  position: relative;
  width: 100%;
  height: 240px; /* 已從 160px 提升至 240px，使其看起來飽滿 */
}

.bar-canvas {
  width: 100%;
  height: 100%;
}

/* ── 🏆 彈出式排行榜 (Modal) ────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.modal-overlay.is-active {
  opacity: 1;
  pointer-events: all;
}

.modal-card {
  background: #fdfbf7;
  border: 2px solid #1a3a6e;
  border-radius: 6px;
  width: 100%;
  max-width: 420px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  transform: scale(0.9);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-card.is-active {
  transform: scale(1);
}

/* 彈窗標頭 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eeeae1;
  padding-bottom: 12px;
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;  /* 確保靠左對齊 */
  text-align: left;         /* 文字內容靠左 */
  gap: 4px;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: bold;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 0.72rem;
  color: #a39b82;
  line-height: 1.4;
}

.modal-close-x {
  background: transparent;
  border: none;
  font-size: 1.6rem;
  color: #8a8070;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s;
}

.modal-close-x:hover {
  color: #e74c3c;
}

/* 列表容器 */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  background: #fbf9f3;
  border: 1px solid #eeeae1;
  border-radius: 4px;
  padding: 8px 12px;
  transition: transform 0.2s;
}

.leaderboard-item.is-self {
  background: #fdfaf2;
  border: 1px dashed #c8a84b;
  box-shadow: 0 2px 6px rgba(200, 168, 75, 0.1);
  transform: scale(1.01);
}

/* 排名徽章 */
.rank-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Georgia', serif;
  font-weight: bold;
  font-size: 0.8rem;
  color: #8a8070;
  margin-right: 12px;
  border-radius: 50%;
}

.rank-1 { color: #d4af37; font-size: 1.1rem; }
.rank-2 { color: #a0a0a0; }
.rank-3 { color: #cd7f32; }

/* 玩家資訊 */
.player-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-right: 12px;
}

.player-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.player-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #4a453a;
}

.self-tag {
  background: #c8a84b;
  color: #fff;
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: bold;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: #eeeae1;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #1a3a6e;
  border-radius: 2px;
  transition: width 0.4s ease-out;
}

.progress-bar.bar-gold {
  background: #c8a84b;
}

/* 分數 */
.player-score {
  text-align: right;
  min-width: 44px;
  font-family: sans-serif;
}

.score-num {
  font-size: 1rem;
  font-weight: bold;
  color: #1a3a6e;
}

.leaderboard-item.is-self .score-num {
  color: #c8a84b;
}

.score-unit {
  font-size: 0.72rem;
  color: #8a8070;
  margin-left: 2px;
}

/* 動態小語 */
.leaderboard-tip {
  font-size: 0.75rem;
  color: #6e675b;
  text-align: center;
  background: #f5f2eb;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.4;
}

.leaderboard-tip .highlight {
  color: #c8a84b;
  font-size: 0.85rem;
}

.leaderboard-tip.success {
  background: #edf4ed;
  color: #2e5a2e;
  border: 1px solid #d0e1d0;
}

/* 手機窄螢幕微調 */
@media (max-width: 360px) {
  .pie-area {
    gap: 12px;
  }
  .pie-canvas {
    width: 110px;
    height: 110px;
  }
  .legend-label {
    min-width: 50px;
    font-size: 0.8rem;
  }
}
</style>