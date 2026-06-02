<script setup lang="ts">
import { computed } from 'vue';
import type { ElementData } from './type3';
import { CATEGORIES } from './elementsData';

const props = defineProps<{
  element: ElementData | null;
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const stateIcon: Record<string, string> = { '固態': '🪨', '液態': '💧', '氣態': '💨' };

const categoryStyle = computed(() => {
  if (!props.element) return { bg: '', border: '', color: '', label: '', enLabel: '' };
  const c = CATEGORIES[props.element.cat] || CATEGORIES.unknown;
  return {
    bg: c.bg,
    border: c.border,
    color: c.color,
    label: c.label,
    enLabel: c.enLabel
  };
});

// 將電子軌域組態中的「數字」渲染為上標 (Academic Superscript)
const formattedConfig = computed(() => {
  if (!props.element) return '';
  // 匹配電子數，例如 d¹⁰ 或 s² 並轉換為 <sup> 標籤
  return props.element.config.replace(/([spdfg])(\d+)/g, '$1<sup>$2</sup>');
});
</script>

<template>
  <div class="modal-overlay" :class="{ open: show }" @click.self="emit('close')">
    <div v-if="element" class="pt-modal">
      <button class="modal-close" @click="emit('close')">✕</button>
      
      <!-- 彈窗標頭 -->
      <div class="modal-header">
        <!-- 縮放元素框 -->
        <div 
          class="modal-symbol-box" 
          :style="{
            background: categoryStyle.bg,
            border: `2px solid ${categoryStyle.border}`,
            color: categoryStyle.color
          }"
        >
          <span class="modal-num">{{ element.z }}</span>
          <span class="modal-sym">{{ element.sym }}</span>
        </div>

        <!-- 元素中英文名 -->
        <div class="modal-title-area">
          <h2>{{ element.zh }}</h2>
          <div class="modal-en-sub">{{ element.en }}</div>
          <span 
            class="modal-cat-badge"
            :style="{
              background: categoryStyle.bg,
              color: categoryStyle.color,
              borderColor: categoryStyle.border
            }"
          >
            {{ categoryStyle.label }}
          </span>
        </div>
      </div>

      <!-- 屬性詳細網格 -->
      <div class="info-grid">
        <div class="grid-item">
          <span class="grid-label">原子序</span>
          <span class="grid-val font-code">{{ element.z }}</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">標準原子量</span>
          <span class="grid-val font-code">{{ element.mass }}</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">物理狀態</span>
          <span class="grid-val">{{ stateIcon[element.state] }} {{ element.state }}</span>
        </div>
        <div class="grid-item">
          <span class="grid-label">週期 / 族分類</span>
          <span class="grid-val">
            第 {{ element.period }} 週期 / 
            {{ element.group ? `第 ${element.group} 族` : '過渡元素' }}
          </span>
        </div>
      </div>

      <!-- 電子軌域組態 -->
      <div class="config-section">
        <span class="config-label">外層電子組態</span>
        <!-- 使用 v-html 來渲染上標組態 -->
        <div class="config-val font-code" v-html="formattedConfig"></div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.modal-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

/* 針對行動端的 bottom-sheet 設計，桌面端為置中 modal */
.pt-modal {
  background: #f4f1ea;
  border: 2px solid #1a3a6e;
  border-radius: 4px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  position: relative;
  box-shadow: 0 10px 30px rgba(26, 58, 110, 0.2);
  font-family: 'Noto Serif TC', serif;
  transform: translateY(20px);
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.15);
}

.modal-overlay.open .pt-modal {
  transform: translateY(0);
}

/* 行動端：底部抽屜滑出風格 (Mobile bottom sheet fallback) */
@media (max-width: 600px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .pt-modal {
    border-radius: 16px 16px 0 0;
    border-bottom: none;
    transform: translateY(100%);
  }
  .modal-overlay.open .pt-modal {
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #1a3a6e;
  cursor: pointer;
  opacity: 0.6;
}
.modal-close:hover { opacity: 1; }

/* 頂部元素摘要 */
.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1.5px dashed #1a3a6e33;
}

.modal-symbol-box {
  width: 72px;
  height: 72px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
  position: relative;
}

.modal-num {
  font-size: 0.65rem;
  font-family: 'Fira Code', monospace;
  position: absolute;
  top: 2px;
  left: 4px;
  opacity: 0.8;
}

.modal-sym {
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  line-height: 1;
  margin-top: 4px;
}

.modal-title-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-title-area h2 {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a3a6e;
}

.modal-en-sub {
  color: #555;
  font-size: 0.8rem;
  font-family: 'Fira Code', monospace;
}

.modal-cat-badge {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px;
  width: fit-content;
  border: 1px solid transparent;
  margin-top: 2px;
}

/* 網格屬性細節 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.grid-item {
  background: #ffffff;
  border: 1px solid #1a3a6e33;
  border-radius: 4px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.grid-label {
  font-size: 0.68rem;
  color: #666;
  letter-spacing: 0.1em;
}

.grid-val {
  font-size: 0.9rem;
  font-weight: bold;
  color: #1a3a6e;
}

/* 外層電子軌域組態 */
.config-section {
  background: #ffffff;
  border: 1px solid #1a3a6e33;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-size: 0.68rem;
  color: #666;
  letter-spacing: 0.1em;
}

.config-val {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a3a6e;
}

/* 程式碼字體微調 */
.font-code {
  font-family: 'Fira Code', monospace;
}
</style>