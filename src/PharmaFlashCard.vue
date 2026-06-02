<template>
  <div class="flashcard-wrapper">
    <!-- 進度 -->
    <div class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
      <span class="progress-label">{{ currentIndex + 1 }} / {{ cards.length }}</span>
    </div>

    <!-- 卡片區 -->
    <div class="card-area">
      <div
        class="card-scene"
        @click="flip"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
      >
        <div class="card-inner" :class="{ flipped: isFlipped }">

          <!-- 正面：英文藥名 -->
          <div class="card-face card-front">
            <div class="face-tag">EN</div>
            <p class="card-english">{{ currentCard.en }}</p>
            <p class="card-hint">點擊查看詳細資訊</p>
          </div>

          <!-- 背面：中文名 / 症狀 / 類別 -->
          <div class="card-face card-back">
            <div class="face-tag">中</div>

            <div class="back-content">
              <!-- 中文藥名 -->
              <p class="back-name">{{ currentCard.zh }}</p>

              <div class="back-divider"></div>

              <!-- 對應症狀 -->
              <div class="back-row">
                <span class="back-icon">💉</span>
                <div class="back-info">
                  <span class="back-label">對應症狀</span>
                  <span class="back-value">{{ currentCard.symptom }}</span>
                </div>
              </div>

              <!-- 藥物類別 -->
              <div class="back-row">
                <span class="back-icon">📋</span>
                <div class="back-info">
                  <span class="back-label">藥物類別</span>
                  <span class="back-value back-category">{{ currentCard.category }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>


    </div>

    <!-- 導航點 -->
    <div class="dot-nav">
      <button
        v-for="(_, i) in cards"
        :key="i"
        class="dot"
        :class="{ active: i === currentIndex }"
        @click="goTo(i)"
      ></button>
    </div>

    <p class="keyboard-hint">← → 左右滑動切換</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'

interface Card { en: string; zh: string; symptom: string; category: string }

const CARDS: Card[] = [
  { en: 'Triazolam',    zh: '酣樂欣',   symptom: '失眠症',   category: 'Benzodiazepines' },
  { en: 'Brotizolam',   zh: '戀多眠',   symptom: '失眠症',   category: 'Benzodiazepines' },
  { en: 'Duloxetine',   zh: '千憂解',   symptom: '憂鬱症',   category: 'SNRI'            },
  { en: 'Milnacipran',  zh: '鬱思樂',   symptom: '憂鬱症',   category: 'SNRI'            },
  { en: 'Paroxetine',   zh: '百可舒',   symptom: '憂鬱症',   category: 'SSRI'            },
  { en: 'Aripiprazole', zh: '安立復',   symptom: '思覺失調', category: 'DPA'             },
  { en: 'Risperidone',  zh: '理思必妥', symptom: '思覺失調', category: 'SDA'             },
  { en: 'Paliperidone', zh: '思維佳',   symptom: '思覺失調', category: 'SDA'             },
  { en: 'Morphine',     zh: '嗎啡',     symptom: '疼痛',     category: 'Opioid'          },
  { en: 'Fentanyl',     zh: '芬太尼',   symptom: '疼痛',     category: 'Opioid'          },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default defineComponent({
  name: 'PharmaFlashCard',
  setup() {
    const cards        = shuffle(CARDS)   // 每次進入重新洗牌
    const currentIndex = ref(0)
    const isFlipped    = ref(false)
    const swipeHint    = ref<'prev' | 'next' | null>(null)

    const currentCard = computed(() => cards[currentIndex.value])
    const progressPct = computed(() => ((currentIndex.value + 1) / cards.length) * 100)

    function flip() { isFlipped.value = !isFlipped.value }

    function goTo(index: number) {
      if (index < 0 || index >= cards.length) return
      isFlipped.value = false
      setTimeout(() => { currentIndex.value = index }, 150)
    }

    function prev() { if (currentIndex.value > 0) goTo(currentIndex.value - 1) }
    function next() { if (currentIndex.value < cards.length - 1) goTo(currentIndex.value + 1) }

    function showHint(dir: 'prev' | 'next') {
      swipeHint.value = dir
      setTimeout(() => { swipeHint.value = null }, 600)
    }

    let touchStartX = 0
    function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX }
    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - touchStartX
      if (Math.abs(dx) < 40) return
      if (dx < 0) { showHint('next'); next() }
      else        { showHint('prev'); prev() }
    }

    let mouseStartX = 0
    function onMouseDown(e: MouseEvent) { mouseStartX = e.clientX }
    function onMouseUp(e: MouseEvent) {
      const dx = e.clientX - mouseStartX
      if (Math.abs(dx) < 40) return
      if (dx < 0) { showHint('next'); next() }
      else        { showHint('prev'); prev() }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { showHint('prev'); prev() }
      if (e.key === 'ArrowRight') { showHint('next'); next() }
      if (e.key === ' ')          { flip() }
    }
    onMounted(()   => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    return {
      cards, currentIndex, currentCard, progressPct,
      isFlipped, swipeHint,
      flip, goTo,
      onTouchStart, onTouchEnd, onMouseDown, onMouseUp,
    }
  }
})
</script>

<style scoped>
.flashcard-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0 24px;
  gap: 20px;
  user-select: none;
}

/* ── Progress ───────────────────────────────────────── */
.progress-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}
.progress-track {
  flex: 1;
  height: 4px;
  background: #ddd8cc;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #f4f1ea;
  border-radius: 2px;
  transition: width 0.35s ease;
}
.progress-label {
  font-size: 0.75rem;
  color: #a09880;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* ── Card Area ──────────────────────────────────────── */
.card-area {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}



/* ── 3D Scene ───────────────────────────────────────── */
.card-scene {
  width: min(300px, 82vw);
  height: min(360px, 64vw);
  perspective: 900px;
  cursor: pointer;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.card-inner.flipped { transform: rotateY(180deg); }

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  padding: 28px 24px;
}

/* ── 正面 ────────────────────────────────────────────── */
.card-front {
  background: #ffffff;
  border: 2px solid #1a3a6e;
  box-shadow: 4px 6px 0px #1a3a6e;
  gap: 16px;
}

/* ── 背面 ────────────────────────────────────────────── */
.card-back {
  background: #1a3a6e;
  border: 2px solid #1a3a6e;
  box-shadow: 4px 6px 0px #0f2550;
  transform: rotateY(180deg);
  gap: 12px;
  justify-content: space-between;
}

.face-tag {
  position: absolute;
  top: 14px;
  right: 16px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  opacity: 0.4;
}
.card-front .face-tag { color: #1a3a6e; }
.card-back  .face-tag { color: #f4f1ea; }

/* ── 正面內容 ────────────────────────────────────────── */
.card-english {
  font-size: clamp(1.4rem, 5.5vw, 1.9rem);
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.04em;
  text-align: center;
  line-height: 1.3;
}

/* ── 背面內容 ────────────────────────────────────────── */
.back-content {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

.back-name {
  font-size: clamp(1.5rem, 6vw, 2rem);
  font-weight: 700;
  color: #f4f1ea;
  letter-spacing: 0.2em;
  text-align: center;
}

.back-divider {
  width: 60%;
  height: 1px;
  background: #f4f1ea;
  opacity: 0.2;
}

.back-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ffffff18;
  border-radius: 8px;
  padding: 8px 14px;
}

.back-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.back-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.back-label {
  font-size: 0.6rem;
  letter-spacing: 0.18em;
  color: #f4f1ea;
  opacity: 0.55;
}

.back-value {
  font-size: clamp(0.85rem, 3.2vw, 1rem);
  font-weight: 600;
  color: #f4f1ea;
  letter-spacing: 0.08em;
}

.back-category {
  font-style: italic;
  color: #c8a84b;
  letter-spacing: 0.12em;
}

/* ── 提示文字 ────────────────────────────────────────── */
.card-hint {
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  opacity: 0.4;
  text-align: center;
  flex-shrink: 0;
}
.card-front .card-hint { color: #1a3a6e; }

/* ── Dot Nav ────────────────────────────────────────── */
.dot-nav {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: #ddd8cc;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}
.dot.active {
  background: #1a3a6e;
  transform: scale(1.3);
}

/* ── Keyboard hint ──────────────────────────────────── */
.keyboard-hint {
  font-size: 0.65rem;
  color: #c0b8a8;
  letter-spacing: 0.12em;
}
</style>