<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { ElementData } from './type3'; 
import { ELEMENTS, CATEGORIES } from './elementsData';

// 匯入自訂拆分組件
import PeriodTableGrid from './PeriodTableGrid.vue';
import PeriodTableList from './PeriodTableList.vue';
import ElementGame from './ElementGame.vue';
import ElementModal from './ElementModal.vue';

// 狀態管理
const viewMode = ref<'grid' | 'list'>('grid');
const searchQuery = ref('');
const activeFilter = ref<string | null>(null);
const selectedElement = ref<ElementData | null>(null);

// 模組開關
const isGameOpen = ref(false);
const isModalOpen = ref(false);
const isToastOpen = ref(false);

// 自訂提示視窗內容
const toastTitle = ref('');
const toastMessage = ref('');

// ── 左右滾動提示狀態與 DOM ──
const legendScrollRef = ref<HTMLDivElement | null>(null);
const showLeftIndicator = ref(false);
const showRightIndicator = ref(false);

// 圖例分類清單
const catKeys = ['alkali', 'alkaline', 'transition', 'metalloid', 'nonmetal', 'halogen', 'noble', 'lanthanide', 'actinide'];

// 複合計算：取得符合當前「分類篩選」與「搜尋字串」的元素 Z 序集合
const filteredZSet = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const filter = activeFilter.value;

  if (!query && !filter) return null;

  const validSet = new Set<number>();
  ELEMENTS.forEach(el => {
    const matchFilter = !filter || el.cat === filter;
    const matchQuery = !query || 
      el.sym.toLowerCase().includes(query) || 
      el.zh.includes(query) || 
      el.en.toLowerCase().includes(query) ||
      el.z.toString() === query;

    if (matchFilter && matchQuery) {
      validSet.add(el.z);
    }
  });
  return validSet;
});

const handleSelectElement = (el: ElementData) => {
  selectedElement.value = el;
  isModalOpen.value = true;
};

// 觸發自訂優雅提示視窗
const triggerToast = (title: string, message: string) => {
  toastTitle.value = title;
  toastMessage.value = message;
  isToastOpen.value = true;
};

const closeToast = () => {
  isToastOpen.value = false;
};

const toggleFilter = (cat: string) => {
  if (activeFilter.value === cat) {
    activeFilter.value = null; // 取消篩選
  } else {
    activeFilter.value = cat;
  }
};

// ── 偵測滾動位置以控制左右漸變指示器 ──
const checkScrollable = () => {
  const el = legendScrollRef.value;
  if (el) {
    // 允許 5 像素的微小容錯誤差
    showLeftIndicator.value = el.scrollLeft > 5;
    showRightIndicator.value = el.scrollLeft < (el.scrollWidth - el.clientWidth - 5);
  }
};

const handleLegendScroll = () => {
  checkScrollable();
};

onMounted(() => {
  // 延遲以確保 DOM 元素已完全排版渲染完畢
  setTimeout(() => {
    checkScrollable();
  }, 120);
});
</script>

<template>
  <div class="periodic-container">
    
    <!-- 頂部操作列 -->
    <div class="control-panel">
      <!-- 搜尋框 -->
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜尋元素符號、中文、英文..." 
          class="pt-search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
      </div>

      <!-- 右側按鈕群 -->
      <div class="action-buttons">
        <!-- 視圖切換 -->
        <div class="toggle-group">
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'grid' }" 
            @click="viewMode = 'grid'"
          >
            網格
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: viewMode === 'list' }" 
            @click="viewMode = 'list'"
          >
            清單
          </button>
        </div>

        <!-- 配對遊戲按鈕 -->
        <button class="game-trigger-btn" @click="isGameOpen = true">
          <span>🎲 元素配對挑戰</span>
        </button>
      </div>
    </div>

    <!-- 中間分類圖例（已整合左右漸變指示器與滾動容器） -->
    <div class="legend-scroll-container">
      <div 
        ref="legendScrollRef"
        class="legend-scroll-wrapper"
        @scroll="handleLegendScroll"
      >
        <div class="legend">
          <button 
            v-for="key in catKeys" 
            :key="key"
            class="legend-item"
            :class="{ active: activeFilter === key }"
            :style="{
              color: CATEGORIES[key].color,
              background: activeFilter === key ? CATEGORIES[key].bg : '#ffffff88',
              borderColor: CATEGORIES[key].border
            }"
            @click="toggleFilter(key)"
          >
            {{ CATEGORIES[key].label }}
          </button>
        </div>
      </div>

      <!-- 左右兩端古典漸變消隱遮罩 -->
      <div class="scroll-mask left-mask" :class="{ show: showLeftIndicator }">
        <span class="scroll-arrow">‹</span>
      </div>
      <div class="scroll-mask right-mask" :class="{ show: showRightIndicator }">
        <span class="scroll-arrow">›</span>
      </div>
    </div>

    <!-- 主顯示區 -->
    <div class="main-content-view">
      <PeriodTableGrid 
        v-if="viewMode === 'grid'" 
        :elements="ELEMENTS" 
        :filtered-z-set="filteredZSet"
        @select-element="handleSelectElement"
      />
      <PeriodTableList 
        v-else 
        :elements="ELEMENTS" 
        :filtered-z-set="filteredZSet"
        @select-element="handleSelectElement"
      />
    </div>

    <!-- 詳細資訊彈窗 -->
    <ElementModal 
      :element="selectedElement" 
      :show="isModalOpen" 
      @close="isModalOpen = false"
    />

    <!-- 記憶配對遊戲 (直接載入完整的 118 號元素) -->
    <ElementGame 
      :elements="ELEMENTS" 
      :show="isGameOpen" 
      @close="isGameOpen = false"
      @trigger-toast="triggerToast"
    />

    <!-- 自訂古典提示彈窗 (Toast Overlay) -->
    <div class="toast-overlay" :class="{ open: isToastOpen }" @click.self="closeToast">
      <div class="toast-box">
        <div class="toast-header-deco"></div>
        <h3 class="toast-title">{{ toastTitle }}</h3>
        <p class="toast-msg">{{ toastMessage }}</p>
        <button class="toast-close-btn" @click="closeToast">確認</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.periodic-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: 'Noto Serif TC', 'Georgia', serif;
}

/* 頂部操作列 */
.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #1a3a6e;
  opacity: 0.6;
  font-size: 0.95rem;
}

.pt-search-input {
  width: 100%;
  padding: 10px 38px 10px 34px;
  font-size: 0.95rem;
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
  transition: all 0.2s;
}

.pt-search-input:focus {
  outline: none;
  border-color: #c8a84b;
  box-shadow: 0 0 6px rgba(200, 168, 75, 0.2);
}

.clear-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 0.85rem;
  color: #1a3a6e;
  cursor: pointer;
  opacity: 0.5;
}
.clear-btn:hover { opacity: 0.9; }

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 切換按鈕組 */
.toggle-group {
  display: flex;
  background: #fff;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  overflow: hidden;
}

.toggle-btn {
  padding: 8px 16px;
  font-size: 0.85rem;
  border: none;
  background: transparent;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-btn.active {
  background: #1a3a6e;
  color: #f4f1ea;
}

/* 遊戲觸發按鈕 */
.game-trigger-btn {
  background: #fff;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 0.85rem;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 600;
}
.game-trigger-btn:hover, .game-trigger-btn:active {
  background: #1a3a6e;
  color: #f4f1ea;
}

/* ── 具有左右漸變遮罩的滾動容器 ── */
.legend-scroll-container {
  position: relative;
  width: 100%;
}

.legend-scroll-wrapper {
  width: 100%;
  overflow-x: auto;
  padding: 6px 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* 隱藏 Firefox 預設滾動條 */
}
.legend-scroll-wrapper::-webkit-scrollbar {
  display: none; /* 隱藏 Webkit 瀏覽器預設滾動條 */
}

.legend {
  display: flex;
  gap: 8px;
  padding: 2px 24px; /* 兩端留白，防止首尾分類按鈕被漸變遮罩完全擋住 */
}

.legend-item {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid transparent;
  font-family: 'Noto Serif TC', serif;
  transition: all 0.15s ease;
  user-select: none;
}

.legend-item.active {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
}

/* ── 漸變指示器主體 ── */
.scroll-mask {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 32px;
  pointer-events: none; /* 避免遮罩阻擋點擊事件 */
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.25s ease;
  z-index: 10;
}

.scroll-mask.show {
  opacity: 1;
}

/* 左右箭頭微標誌，增加引導質感 */
.scroll-arrow {
  font-size: 1.1rem;
  font-weight: bold;
  color: #1a3a6e;
  opacity: 0.45;
  text-shadow: 0 1px 1px #fff;
  animation: bounce-side 1.5s infinite ease-in-out;
}

.left-mask {
  left: 0;
  background: linear-gradient(to right, #f4f1ea 30%, rgba(244, 241, 234, 0) 100%);
}
.left-mask .scroll-arrow {
  margin-right: 8px;
}

.right-mask {
  right: 0;
  background: linear-gradient(to left, #f4f1ea 30%, rgba(244, 241, 234, 0) 100%);
}
.right-mask .scroll-arrow {
  margin-left: 8px;
}

/* 左右微幅彈跳動畫，明示可滑動 */
@keyframes bounce-side {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
.left-mask .scroll-arrow {
  animation-name: bounce-left;
}
@keyframes bounce-left {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-3px); }
}

/* ── 提示 Overlay ── */
.toast-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.toast-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.toast-box {
  background: #f4f1ea;
  border: 2px solid #1a3a6e;
  border-radius: 4px;
  width: 100%;
  max-width: 340px;
  padding: 24px;
  text-align: center;
  position: relative;
  box-shadow: 0 10px 25px rgba(26,58,110,0.15);
  transform: scale(0.9);
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.15);
}

.toast-overlay.open .toast-box {
  transform: scale(1);
}

.toast-header-deco {
  height: 4px;
  background: #c8a84b;
  width: 50px;
  margin: 0 auto 16px auto;
}

.toast-title {
  color: #1a3a6e;
  font-size: 1.2rem;
  margin-bottom: 8px;
  font-weight: 700;
}

.toast-msg {
  color: #333333;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.toast-close-btn {
  background: #1a3a6e;
  color: #f4f1ea;
  border: none;
  border-radius: 4px;
  padding: 8px 24px;
  font-size: 0.9rem;
  font-family: 'Noto Serif TC', serif;
  cursor: pointer;
  transition: background 0.15s;
}

.toast-close-btn:hover {
  background: #12284c;
}
</style>