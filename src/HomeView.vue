<template>
  <div class="screen home-screen">
    <!-- ── Header ── -->
    <header class="app-header">
      <div class="header-deco"></div>
      <h1 class="app-title">
        <span class="title-zh">化學</span>
        <span class="title-accent">複習</span>
        <span class="title-app">APP</span>
      </h1>
      <p class="app-subtitle">Chemistry Review</p>
    </header>

    <!-- ── 限制在 4+1 個卡片（過濾掉隱藏項目） ── -->
    <main class="grid-container">
      <button
        v-for="item in visibleMenuItems"
        :key="item.id"
        class="menu-card"
        @click="$emit('navigate', item.id)"
      >
        <div class="card-icon">{{ item.icon }}</div>
        <div class="card-label">
          <span class="label-line1">{{ item.line1 }}</span>
          <span class="label-line2">{{ item.line2 }}</span>
        </div>
        <div class="card-arrow">→</div>
      </button>
    </main>

    <!-- ── 成果分析 ── -->
    <button class="results-btn" @click="$emit('navigate', 'results')">
      <div class="results-left">
        <span class="results-icon">📊</span>
        <span class="results-label">成果分析</span>
      </div>
      <span class="results-arrow">→</span>
    </button>

    <!-- ── Footer ── -->
    <footer class="home-footer">
      <div class="footer-line"></div>
      <span>輕觸卡片開始複習</span>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { MENU_ITEMS } from './types'

export default defineComponent({
  name: 'HomeView',
  emits: ['navigate'],
  setup() {
    // 💡 建立計算屬性：過濾掉含有 hideOnHome: true 的項目，首頁只會顯示沒被隱藏的卡片
    const visibleMenuItems = computed(() => {
      return MENU_ITEMS.filter(item => !item.hideOnHome)
    })

    return { visibleMenuItems }
  }
})
</script>

<style scoped>
/* ── Reset ──────────────────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }

.screen {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0 20px 32px;
}

/* ── Header ─────────────────────────────────────────── */
.app-header {
  position: relative;
  padding: 52px 0 28px;
  text-align: center;
}

.header-deco {
  position: absolute;
  top: 0; left: -20px; right: -20px;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    #1a3a6e 0px, #1a3a6e 28px,
    #c8a84b 28px, #c8a84b 32px,
    #f4f1ea 32px, #f4f1ea 44px
  );
}

.app-title {
  font-size: 2.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  color: #1a3a6e;
}

.title-accent {
  color: #1a3a6e;
  position: relative;
}
.title-accent::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0; right: 0;
  height: 3px;
  background: #c8a84b;
  border-radius: 2px;
}
.title-app {
  color: #c8a84b;
  font-size: 1.4rem;
  font-style: italic;
  margin-left: 6px;
  letter-spacing: 0.15em;
}

.app-subtitle {
  margin-top: 10px;
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #8a8070;
}

/* ── Grid ───────────────────────────────────────────── */
.grid-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 8px 0;
}

/* ── Menu Cards ─────────────────────────────────────── */
.menu-card {
  position: relative;
  background: #fff;
  border: 2px solid #1a3a6e;
  border-radius: 4px;
  padding: 24px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.18s ease;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
}

.menu-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #1a3a6e;
  transform: translateY(100%);
  transition: transform 0.22s ease;
  z-index: 0;
}
.menu-card:hover::before,
.menu-card:active::before { transform: translateY(0); }

.menu-card:active { transform: scale(0.97); }

.menu-card:hover .card-label,
.menu-card:active .card-label,
.menu-card:hover .card-icon,
.menu-card:active .card-icon { color: #f4f1ea; }

.card-icon {
  position: relative;
  z-index: 1;
  font-size: 1.8rem;
  line-height: 1;
  color: #c8a84b;
  transition: color 0.22s;
}

.card-label {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: #1a3a6e;
  transition: color 0.22s;
}

.label-line1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.12em;
}
.label-line2 {
  font-size: 1.05rem;
  letter-spacing: 0.2em;
  opacity: 0.85;
}

.card-arrow {
  position: absolute;
  bottom: 10px; right: 12px;
  z-index: 1;
  font-size: 0.9rem;
  color: #c8a84b;
  opacity: 0.7;
  transition: transform 0.18s;
}
.menu-card:hover .card-arrow,
.menu-card:active .card-arrow { transform: translateX(4px); opacity: 1; }

/* ── Results Button ─────────────────────────────────── */
.results-btn {
  margin-top: 4px;
  width: 100%;
  background: #fff;
  border: 2px solid #1a3a6e;
  border-radius: 4px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.18s, color 0.18s, transform 0.15s;
}
.results-btn:hover,
.results-btn:active { background: #1a3a6e; color: #f4f1ea; }
.results-btn:active { transform: scale(0.98); }

.results-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.results-icon { font-size: 1.4rem; }
.results-label {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
}
.results-arrow { font-size: 1rem; opacity: 0.7; }

/* ── Footer ─────────────────────────────────────────── */
.home-footer {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.7rem;
  letter-spacing: 0.15em;
  color: #a09880;
}
.footer-line {
  flex: 1;
  height: 1px;
  background: #c8b89a;
}
</style>