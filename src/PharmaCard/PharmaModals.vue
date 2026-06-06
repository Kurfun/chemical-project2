<template>
  <!-- ── 圖片點擊放大燈箱 (Lightbox Modal) ── -->
  <div v-if="isZoomed && !hasError" class="lightbox" @click="$emit('close-zoom')">
    <div class="lightbox-content" @click.stop>
      <button class="close-btn" @click="$emit('close-zoom')" aria-label="關閉燈箱">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="close-svg">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h3 class="lightbox-title">{{ title }}</h3>
      <div class="lightbox-img-wrapper">
        <img :src="imgSrc" alt="Molecular Big Image" class="lightbox-img">
      </div>
      <p class="lightbox-footer">數據來源：NCBI PubChem 資料庫 (CID: {{ cid }})</p>
    </div>
  </div>

  <!-- ── 🗑️ 清除內容彈出式對話框 (Confirmation Prompt) ── -->
  <div v-if="showClearPrompt" class="prompt-overlay" @click.self="$emit('cancel-clear')">
    <div class="prompt-card animate-pop">
      <div class="prompt-header">
        <span class="prompt-warning-icon">⚠️</span>
        <h4 class="prompt-title">清除自訂內容</h4>
      </div>
      <p class="prompt-message">確定要清除第 11 張自訂藥卡的所有內容嗎？清除後此張卡片將解鎖，可以重新編輯與建立新藥物。</p>
      <div class="prompt-actions">
        <button class="prompt-btn btn-cancel" @click="$emit('cancel-clear')">取消</button>
        <button class="prompt-btn btn-confirm" @click="$emit('confirm-clear')">確定清除</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PharmaModals',
  props: {
    // 燈箱
    isZoomed:        { type: Boolean, required: true },
    hasError:        { type: Boolean, required: true },
    title:           { type: String,  required: true },
    imgSrc:          { type: String,  required: true },
    cid:             { type: String,  required: true },
    // 清除確認
    showClearPrompt: { type: Boolean, required: true },
  },
  emits: ['close-zoom', 'cancel-clear', 'confirm-clear'],
})
</script>

<style scoped>
/* ── 圖片燈箱大圖模式 ── */
.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.lightbox-content {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f1f5f9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}
.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}
.lightbox-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1a3a6e;
  border-bottom: 2px solid #f1f5f9;
  padding-bottom: 8px;
}
.lightbox-img-wrapper {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
}
.lightbox-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.lightbox-footer {
  font-size: 0.65rem;
  color: #94a3b8;
  text-align: center;
}

/* ── 🗑️ 清除警告彈窗 ── */
.prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.prompt-card {
  background: #ffffff;
  border: 2px solid #1a3a6e;
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.prompt-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prompt-warning-icon {
  font-size: 1.4rem;
}
.prompt-title {
  font-size: 1.15rem;
  font-weight: bold;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
}
.prompt-message {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
  text-align: left;
}
.prompt-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
}
.prompt-btn {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.15s;
  font-family: 'Noto Serif TC', serif;
  -webkit-tap-highlight-color: transparent;
}
.btn-cancel {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.btn-cancel:hover { background: #e2e8f0; }
.btn-confirm {
  background: #ef4444;
  color: #ffffff;
}
.btn-confirm:hover { background: #dc2626; }

.animate-pop {
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}
</style>