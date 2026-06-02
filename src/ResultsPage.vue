<template>
  <div class="results-wrapper">

    <!-- ── 圓餅圖 ── -->
    <section class="chart-section">
      <h3 class="chart-title">複習次數比例</h3>
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

    <!-- ── 長條圖 ── -->
    <section class="chart-section">
      <h3 class="chart-title">複習次數統計</h3>
      <canvas ref="barCanvas" class="bar-canvas"></canvas>
    </section>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, inject, computed, watch, onMounted, nextTick } from 'vue'
import { VISITS_KEY, type Visits } from './useVisits'

// ── 科目設定 ──────────────────────────────────────────────
const SUBJECTS = [
  { key: 'organic'    as keyof Visits, label: '有機化學', color: '#e74c3c' },
  { key: 'inorganic'  as keyof Visits, label: '無機化學', color: '#27ae60' },
  { key: 'analytical' as keyof Visits, label: '分析化學', color: '#2980b9' },
  { key: 'pharma'     as keyof Visits, label: '藥用化學', color: '#f1c40f' },
]

const BAR_COLOR   = '#e67e22'
const AVG_COLOR   = '#f0a868'
const GRID_COLOR  = '#ddd8cc'
const TEXT_COLOR  = '#5a5040'

export default defineComponent({
  name: 'ResultsPage',
  setup() {
    const visitsRef = inject(VISITS_KEY)!
    const visits    = computed(() => visitsRef.value)

    const pieCanvas = ref<HTMLCanvasElement | null>(null)
    const barCanvas = ref<HTMLCanvasElement | null>(null)

    // ── 圓餅圖 ───────────────────────────────────────────
    function drawPie() {
      const canvas = pieCanvas.value
      if (!canvas) return
      const ctx  = canvas.getContext('2d')!
      const size = canvas.width
      const cx   = size / 2
      const cy   = size / 2
      const r    = size * 0.42

      ctx.clearRect(0, 0, size, size)

      const values = SUBJECTS.map(s => visits.value[s.key])
      const total  = values.reduce((a, b) => a + b, 0)

      if (total === 0) {
        // 空狀態：灰色虛線圓
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = '#c8c0b0'
        ctx.lineWidth   = 2
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle   = TEXT_COLOR
        ctx.font        = `${size * 0.08}px serif`
        ctx.textAlign   = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('尚無資料', cx, cy)
        return
      }

      let startAngle = -Math.PI / 2
      SUBJECTS.forEach((s, i) => {
        const slice = (values[i] / total) * Math.PI * 2
        if (slice === 0) return
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startAngle, startAngle + slice)
        ctx.closePath()
        ctx.fillStyle = s.color
        ctx.fill()
        ctx.strokeStyle = '#f4f1ea'
        ctx.lineWidth   = 2
        ctx.stroke()

        // 百分比標籤
        const pct = Math.round((values[i] / total) * 100)
        if (pct >= 8) {
          const mid = startAngle + slice / 2
          const lx  = cx + Math.cos(mid) * r * 0.65
          const ly  = cy + Math.sin(mid) * r * 0.65
          ctx.fillStyle    = '#fff'
          ctx.font         = `bold ${size * 0.09}px sans-serif`
          ctx.textAlign    = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${pct}%`, lx, ly)
        }
        startAngle += slice
      })
    }

    // ── 長條圖 ───────────────────────────────────────────
    function drawBar() {
      const canvas = barCanvas.value
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W   = canvas.width
      const H   = canvas.height

      ctx.clearRect(0, 0, W, H)

      const values  = SUBJECTS.map(s => visits.value[s.key])
      const avg     = values.reduce((a, b) => a + b, 0) / values.length
      const allVals = [...values, avg]
      const maxVal  = Math.max(10, ...allVals)

      // 計算 y 軸最大刻度（往上取整到好看的數字）
      const yMax    = Math.ceil(maxVal / 5) * 5 || 10
      const ticks   = 5

      const padL     = W * 0.12
      const padR     = W * 0.04
      const padT     = H * 0.08
      const fontSize = W * 0.055
      const lh       = fontSize * 1.3
      const padB     = 4 + lh * 2 + 8
      const chartW   = W - padL - padR
      const chartH   = H - padT - padB

      const labels    = [...SUBJECTS.map(s => s.label), '平均']
      const barCount  = labels.length                   // 5
      const barW      = (chartW / barCount) * 0.55
      const barGap    = chartW / barCount

      // 格線 & y 刻度
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth   = 1
      ctx.fillStyle   = TEXT_COLOR
      ctx.font        = `${fontSize}px sans-serif`
      ctx.textAlign   = 'right'
      ctx.textBaseline = 'middle'

      for (let t = 0; t <= ticks; t++) {
        const val = (yMax / ticks) * t
        const y   = padT + chartH - (val / yMax) * chartH
        ctx.beginPath()
        ctx.moveTo(padL, y)
        ctx.lineTo(padL + chartW, y)
        ctx.setLineDash(t === 0 ? [] : [3, 3])
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillText(String(Math.round(val)), padL - 4, y)
      }

      // 長條 & x 標籤
      allVals.forEach((val, i) => {
        const x      = padL + barGap * i + barGap / 2 - barW / 2
        const barH   = (val / yMax) * chartH
        const y      = padT + chartH - barH

        // 平均條用淡橘
        ctx.fillStyle = i < 4 ? BAR_COLOR : AVG_COLOR
        ctx.beginPath()
        // 圓角上緣
        const rad = Math.min(4, barW / 4)
        ctx.moveTo(x + rad, y)
        ctx.lineTo(x + barW - rad, y)
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + rad)
        ctx.lineTo(x + barW, padT + chartH)
        ctx.lineTo(x, padT + chartH)
        ctx.lineTo(x, y + rad)
        ctx.quadraticCurveTo(x, y, x + rad, y)
        ctx.closePath()
        ctx.fill()

        // 數值標籤（條頂）
        ctx.fillStyle    = TEXT_COLOR
        ctx.font         = `bold ${W * 0.055}px sans-serif`
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'bottom'
        const displayVal = i < 4 ? String(Math.round(val)) : val.toFixed(1)
        ctx.fillText(displayVal, x + barW / 2, y - 2)

        // x 軸標籤（兩行）
        ctx.font         = `${fontSize}px sans-serif`
        ctx.textBaseline = 'top'
        const line1 = labels[i].slice(0, 2)
        const line2 = labels[i].slice(2)
        ctx.fillText(line1, x + barW / 2, padT + chartH + 4)
        if (line2) ctx.fillText(line2, x + barW / 2, padT + chartH + 4 + lh)
      })
    }

    // ── 尺寸設定 & 重繪 ──────────────────────────────────
    function sizeCanvases() {
      const pie = pieCanvas.value
      const bar = barCanvas.value
      if (pie) { pie.width = pie.offsetWidth; pie.height = pie.offsetHeight }
      if (bar) { bar.width = bar.offsetWidth; bar.height = bar.offsetHeight }
    }

    function redraw() {
      sizeCanvases()
      drawPie()
      drawBar()
    }

    onMounted(async () => {
      await nextTick()
      redraw()
    })

    // visits 變動時重繪
    watch(visitsRef, () => { nextTick(redraw) }, { deep: true })

    return { visits, SUBJECTS, pieCanvas, barCanvas }
  }
})
</script>

<style scoped>
.results-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 20px;
  overflow-y: auto;
}

/* ── Section ─────────────────────────────────────────── */
.chart-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #8a8070;
  text-transform: uppercase;
}

.divider {
  height: 1px;
  background: #ddd8cc;
  flex-shrink: 0;
}

/* ── 圓餅圖區域 ──────────────────────────────────────── */
.pie-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pie-canvas {
  width: 150px;
  height: 150px;
  flex-shrink: 0;
}

/* ── 圖例 ────────────────────────────────────────────── */
.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  color: #3a3020;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label { flex: 1; }

.legend-count {
  font-weight: 700;
  color: #1a3a6e;
  min-width: 28px;
  text-align: right;
}

/* ── 長條圖 ──────────────────────────────────────────── */
.bar-canvas {
  width: 100%;
  height: 250px;
  display: block;
}
</style>