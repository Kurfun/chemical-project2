<template>
  <div class="screen sub-screen">
    <div class="sub-bg-deco"></div>

    <!-- ── Header ── -->
    <div class="sub-header">
      <button class="back-btn" @click="$emit('navigate', 'home')">
        <span class="back-arrow">←</span>
        <span>返回</span>
      </button>
      <h2 class="sub-title">{{ title }}</h2>
    </div>

    <!-- ── 內容插槽：預設顯示暫無資料，未來可替換 ── -->
    <slot>
      <div class="empty-state">
        <div class="empty-icon">🧪</div>
        <p class="empty-text">暫無資料</p>
        <p class="empty-sub">此章節內容即將上線</p>
        <button class="return-btn" @click="$emit('navigate', 'home')">
          ← 返回首頁
        </button>
      </div>
    </slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SubPage',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
  emits: ['navigate'],
})
</script>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.screen {
  width: 100%;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 0 20px 32px;
}

.sub-screen { justify-content: flex-start; }

/* ── Top deco bar ───────────────────────────────────── */
.sub-bg-deco {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    #1a3a6e 0px, #1a3a6e 28px,
    #c8a84b 28px, #c8a84b 32px,
    #f4f1ea 32px, #f4f1ea 44px
  );
}

/* ── Sub Header ─────────────────────────────────────── */
.sub-header {
  padding: 52px 0 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 0.85rem;
  color: #1a3a6e;
  cursor: pointer;
  letter-spacing: 0.05em;
  transition: background 0.15s, color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.back-btn:hover,
.back-btn:active { background: #1a3a6e; color: #f4f1ea; }

.back-arrow { font-size: 1rem; }

.sub-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.12em;
}

/* ── Empty State (default slot) ─────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-bottom: 60px;
}

.empty-icon {
  font-size: 3.5rem;
  filter: grayscale(0.4);
  animation: float 3s ease-in-out infinite;
  margin-bottom: 20px; 
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

.empty-text {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.2em;
}
.empty-sub {
  font-size: 0.8rem;
  color: #a09880;
  letter-spacing: 0.15em;
  margin-top: -4px;
}

.return-btn {
  margin-top: 24px;
  background: #1a3a6e;
  color: #f4f1ea;
  border: none;
  border-radius: 4px;
  padding: 14px 36px;
  font-family: inherit;
  font-size: 1rem;
  letter-spacing: 0.15em;
  cursor: pointer;
  transition: background 0.18s, transform 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.return-btn:hover  { background: #0f2550; }
.return-btn:active { transform: scale(0.97); }
</style>