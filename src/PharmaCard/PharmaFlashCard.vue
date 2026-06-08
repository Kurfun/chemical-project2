<template>
  <div class="flashcard-wrapper">
    <!-- 進度條 -->
    <div class="progress-container">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
      <span class="progress-label">{{ currentIndex + 1 }} / {{ cards.length }}</span>
    </div>

    <!-- 卡片展示區 -->
    <div class="card-area">
      <!-- 左右切換快捷按鈕 (桌機外觀優化) -->
      <button class="nav-btn prev-btn" @click="prev" :disabled="currentIndex === 0" title="上一張 (←鍵)">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div
        class="card-scene"
        @click="handleCardClick"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
        @mousedown="onMouseDown"
        @mouseup="onMouseUp"
      >
        <div class="card-inner" :class="{ flipped: isFlipped }">

          <!-- ================= 正面卡片 ================= -->
          <div
            class="card-face card-front"
            :style="{ pointerEvents: isFlipped ? 'none' : 'auto' }"
          >
            <div class="face-header">
              <span class="brand-tag">{{ isCustomPage ? 'CUSTOM CARD' : 'PHARMA CARD' }}</span>
              <div class="face-tag">EN</div>
            </div>

            <!-- 分子背景裝飾圖樣 (SVG 線條) -->
            <div class="chemistry-bg">
              <svg viewBox="0 0 100 100" class="chem-svg">
                <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" fill="none" :stroke="isCustomPage && !isCustomCardSaved ? 'rgba(26, 58, 110, 0.03)' : 'rgba(26, 58, 110, 0.04)'" :stroke-dasharray="isCustomPage && !isCustomCardSaved ? '3,3' : 'none'" stroke-width="1.5"/>
                <line x1="50" y1="20" x2="50" y2="5" :stroke="isCustomPage && !isCustomCardSaved ? 'rgba(26, 58, 110, 0.03)' : 'rgba(26, 58, 110, 0.04)'" stroke-width="1.5" />
                <line x1="75" y1="35" x2="90" y2="30" :stroke="isCustomPage && !isCustomCardSaved ? 'rgba(26, 58, 110, 0.03)' : 'rgba(26, 58, 110, 0.04)'" stroke-width="1.5" />
                <circle cx="50" cy="5" r="2" fill="rgba(26, 58, 110, 0.06)" />
                <circle cx="90" cy="30" r="2" fill="rgba(26, 58, 110, 0.06)" />
              </svg>
            </div>

            <!-- 自訂第11頁且尚未鎖定：正面輸入框 -->
            <div v-if="isCustomPage && !isCustomCardSaved" class="front-main custom-input-group" @click.stop>
              <div class="input-field">
                <label class="input-label">英文藥名 (English Name)</label>
                <input
                  type="text"
                  v-model="customCard.en"
                  placeholder="Ex:Penicillin G"
                  class="custom-textbox"
                  @blur="fetchPubChemData"
                />
              </div>
              <div class="input-field">
                <label class="input-label">藥品類別 (Category)</label>
                <input
                  type="text"
                  v-model="customCard.category"
                  placeholder="Ex:category"
                  class="custom-textbox"
                />
              </div>
            </div>

            <!-- 一般第1-10頁 或 已鎖定的自訂第11頁：正面普通呈現 -->
            <div v-else class="front-main">
              <p class="card-english">{{ currentCard.en || '未命名藥物' }}</p>
              <span class="category-badge">{{ currentCard.category || '未設定類別' }}</span>
            </div>

            <p class="card-hint">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="hint-icon">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              {{ (isCustomPage && !isCustomCardSaved) ? '輸入完畢後，點擊此處或外圍翻面' : '點擊卡片翻面看分子結構與中文' }}
            </p>
          </div>

          <!-- ================= 背面卡片 ================= -->
          <div
            class="card-face card-back"
            :style="{ pointerEvents: isFlipped ? 'auto' : 'none' }"
          >
            <!-- 自訂第11頁且尚未鎖定：背面藥名輸入 -->
            <div v-if="isCustomPage && !isCustomCardSaved" class="face-header text-white/80" @click.stop>
              <input
                type="text"
                v-model="customCard.zh"
                placeholder="例:盤尼西林"
                class="custom-textbox-zh"
              />
              <div class="face-tag text-teal-100">中</div>
            </div>

            <!-- 一般第1-10頁 或 已鎖定的自訂第11頁：背面普通呈現 -->
            <div v-else class="face-header text-white/80">
              <span class="brand-tag-back text-teal-200">{{ currentCard.zh || '未命名藥物' }}</span>
              <div class="face-tag text-teal-100">中</div>
            </div>

            <div class="back-content">
              <!-- 化學「分子式」 -->
              <p class="back-name molecular-formula" v-html="isCustomPage ? formattedCustomFormula : currentCard.formula"></p>

              <!-- 分子結構圖展示區域 -->
              <div class="molecular-container" @click.stop="toggleZoom">
                <!-- 預加載動畫 -->
                <div v-if="imgLoading && !hasError" class="img-skeleton">
                  <div class="spinner"></div>
                  <span>結構加載中...</span>
                </div>

                <!-- 查無資料或未輸入英文名狀態 -->
                <div v-if="hasError" class="no-data-hint">
                  <span class="error-icon">⚠️</span>
                  <span>{{ customCard.en ? 'PubChem 查無此化學數據' : '請先在正面輸入英文藥名' }}</span>
                </div>

                <img
                  v-else
                  :src="isCustomPage ? getPubChemImgUrl(customCard.cid) : getPubChemImgUrl(currentCard.cid)"
                  :alt="currentCard.en + ' molecular structure'"
                  class="molecular-img"
                  :class="{ 'opacity-0': imgLoading, 'inverted-img': true }"
                  @load="imgLoading = false"
                  @error="handleImgError"
                />
                <span v-if="!hasError && (!isCustomPage || customCard.cid)" class="zoom-indicator">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg> 點擊放大
                </span>
              </div>

              <div class="back-divider"></div>

              <!-- 自訂第11頁且尚未鎖定：背面詳情輸入 -->
              <div v-if="isCustomPage && !isCustomCardSaved" class="info-rows-container" @click.stop>
                <div class="back-row custom-back-row">
                  <span class="back-icon">💉</span>
                  <div class="back-info w-full">
                    <span class="back-label">對應症狀</span>
                    <input
                      type="text"
                      v-model="customCard.symptom"
                      placeholder="例:細菌感染"
                      class="custom-row-input"
                    />
                  </div>
                </div>
                <div class="back-row custom-back-row">
                  <span class="back-icon">📋</span>
                  <div class="back-info w-full">
                    <span class="back-label">藥物功效</span>
                    <input
                      type="text"
                      v-model="customCard.effect"
                      placeholder="例:抑制細菌細胞壁合成，使其膨脹破裂。"
                      class="custom-row-input text-teal-300"
                    />
                  </div>
                </div>
              </div>

              <!-- 一般第1-10頁 或 已鎖定的自訂第11頁：詳細資訊唯讀列 -->
              <div v-else class="info-rows-container">
                <!-- 對應症狀 -->
                <div class="back-row">
                  <span class="back-icon">💉</span>
                  <div class="back-info">
                    <span class="back-label">對應症狀</span>
                    <span class="back-value">{{ currentCard.symptom || '未設定對應症狀' }}</span>
                  </div>
                </div>
                <!-- 藥物功效 -->
                <div class="back-row">
                  <span class="back-icon">📋</span>
                  <div class="back-info">
                    <span class="back-label">藥物功效</span>
                    <span class="back-value back-effect">{{ currentCard.effect || '未設定藥物功效' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- 右側按鈕：
           - 第10頁點擊「⊕」新增進入第11頁
           - 第11頁且已鎖定時轉為「🗑️」清除內容按鈕
           - 其餘頁面為下一張 chevron-right
      -->
      <button
        class="nav-btn next-btn"
        :class="{
          'plus-btn-style': isAtLastPredefined,
          'clear-btn-style': isCustomPage && isCustomCardSaved
        }"
        @click="handleNextClick"
        :disabled="currentIndex === cards.length - 1 && !isAtLastPredefined && (!isCustomPage || !isCustomCardSaved)"
        :title="isAtLastPredefined ? '新增自訂卡片 (⊕)' : (isCustomPage && isCustomCardSaved ? '清除自訂內容 (🗑️)' : '下一張 (→鍵)')"
      >
        <template v-if="isAtLastPredefined">
          <svg class="plus-icon-svg" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </template>
        <template v-else-if="isCustomPage && isCustomCardSaved">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </template>
        <template v-else>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </template>
      </button>
    </div>

    <!-- 導航點 -->
    <div class="dot-nav">
      <button
        v-for="(_, i) in cards"
        :key="i"
        class="dot"
        :class="{ active: i === currentIndex, 'custom-dot': i === 10 }"
        @click="goTo(i)"
      ></button>
    </div>

    <!-- 操控說明 -->
    <p class="keyboard-hint">
      <span class="device-desktop"><kbd>←</kbd> <kbd>→</kbd> 鍵切換，<kbd>空白鍵</kbd> 翻轉卡片</span>
      <span class="device-mobile">左右滑動切換卡片</span>
    </p>

    <!-- 燈箱 + 清除對話框（抽離至 PharmaModals） -->
    <PharmaModals
      :is-zoomed="isZoomed"
      :has-error="hasError"
      :title="`${isCustomPage ? (customCard.zh || '自訂藥物') : currentCard.zh} (${isCustomPage ? (customCard.en || 'Custom') : currentCard.en})`"
      :img-src="isCustomPage ? getPubChemImgUrl(customCard.cid) : getPubChemImgUrl(currentCard.cid)"
      :cid="isCustomPage ? customCard.cid : currentCard.cid"
      :show-clear-prompt="showClearPrompt"
      @close-zoom="isZoomed = false"
      @cancel-clear="showClearPrompt = false"
      @confirm-clear="confirmClear"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { usePharma } from './usePharma'
import PharmaModals from './PharmaModals.vue'

export default defineComponent({
  name: 'PharmaFlashCard',
  components: { PharmaModals },
  setup() {
    // 所有狀態與方法由 usePharma 統一提供
    return usePharma()
  }
})
</script>

<style scoped>
/* ── 全域字型與重設 ── */
.flashcard-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px 8px 24px;
  gap: 16px;
  user-select: none;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* ── 進度條樣式 ── */
.progress-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px;
}
.progress-track {
  flex: 1;
  height: 6px;
  background: #e2dfd5;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #1a3a6e;
  border-radius: 3px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #8c8266;
  letter-spacing: 0.05em;
  min-width: 45px;
  text-align: right;
}

/* ── 卡片工作區 ── */
.card-area {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 16px;
  margin: 12px 0;
}

/* 導航按鈕 (桌機版適用) */
.nav-btn {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  color: #1a3a6e;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(26, 58, 110, 0.1);
  transition: all 0.2s;
  z-index: 10;
}
.nav-btn:hover:not(:disabled) {
  background: #1a3a6e;
  color: #ffffff;
  transform: scale(1.1);
}
.nav-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
  border-color: #cbd5e1;
  color: #94a3b8;
}

/* 💡 ⊕ 新增按鈕特殊高亮閃爍樣式 */
.plus-btn-style {
  background: #c8a84b;
  border-color: #1a3a6e;
  color: #1a3a6e;
  animation: breathe 2s infinite ease-in-out;
  opacity: 1 !important;
}
.plus-btn-style:hover {
  background: #1a3a6e !important;
  color: #c8a84b !important;
  transform: scale(1.15) rotate(90deg);
}
.plus-icon-svg {
  stroke-width: 3px;
}

/* 💡 🗑️ 清除內容按鈕樣式 */
.clear-btn-style {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
  opacity: 1 !important;
}
.clear-btn-style:hover {
  background: #ef4444 !important;
  color: #ffffff !important;
  transform: scale(1.1);
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 4px rgba(200, 168, 75, 0.4); }
  50% { box-shadow: 0 0 14px rgba(200, 168, 75, 0.85); }
}

/* ── 3D 字卡容器 ── */
/* ── 3D 字卡容器 ── */
.card-scene {
  width: min(320px, 80vw);
  height: min(440px, 110vw);
  perspective: 1200px;
  -webkit-perspective: 1200px;           /* ← 新增 */
  cursor: pointer;
}

.card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;  /* ← 新增 */
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);              /* ← 新增：強制 GPU 分層（正面） */
  -webkit-transform: translateZ(0);      /* ← 新增 */
  padding: 24px 20px;
  box-shadow: 0 10px 25px -5px rgba(26, 58, 110, 0.15), 0 8px 10px -6px rgba(26, 58, 110, 0.15);
}

/* ← 新增這整段：背面預設旋轉 180 度 */
.card-back {
  transform: translateZ(0) rotateY(180deg);
  -webkit-transform: translateZ(0) rotateY(180deg);
}

/* 頂部標頭格式 */
.face-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-bottom: 1px solid rgba(26, 58, 110, 0.08);
  padding-bottom: 8px;
}
.card-back .face-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  justify-content: center;
  position: relative;
}
.brand-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #1a3a6e;
}
.face-tag {
  font-size: 0.7rem;
  font-weight: 900;
  background: rgba(26, 58, 110, 0.08);
  color: #1a3a6e;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-back .face-tag {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  position: absolute;
  right: 0;
}

/* ── 卡片正面 ── */
.card-front {
  background: #ffffff;
  border: 2px solid #1a3a6e;
}

.front-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  z-index: 2;
  text-align: center;
  width: 100%;
}
.card-english {
  font-size: clamp(1.6rem, 5.8vw, 2.1rem);
  font-weight: 850;
  color: #1a3a6e;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.category-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1a3a6e;
  background: #f0f4f9;
  padding: 4px 12px;
  border-radius: 30px;
  border: 1px solid rgba(26, 58, 110, 0.15);
}

/* ── 自訂輸入文字框欄位設計 ── */
.custom-input-group {
  gap: 14px;
}
.input-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.input-label {
  font-size: 0.65rem;
  font-weight: 800;
  color: #1a3a6e;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.custom-textbox {
  width: 100%;
  background: #fdfbf7;
  border: 1.5px solid #1a3a6e;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.95rem;
  font-weight: bold;
  color: #1a3a6e;
  outline: none;
  font-family: sans-serif;
  transition: all 0.25s;
}
.custom-textbox:focus {
  background: #ffffff;
  border-color: #c8a84b;
  box-shadow: 0 0 8px rgba(200, 168, 75, 0.25);
}

/* 化學背景網格 */
.chemistry-bg {
  position: absolute;
  inset: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}
.chem-svg {
  width: 85%;
  height: 85%;
}

/* ── 卡片背面 ── */
.card-back {
  background: #1a3a6e;
  border: 2px solid #10264d;
  transform: rotateY(180deg);
}

/* 背面自訂中文文字框 */
.custom-textbox-zh {
  width: 80%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 1.05rem;
  font-weight: bold;
  color: #2dd4bf;
  text-align: center;
  outline: none;
  transition: all 0.25s;
}
.custom-textbox-zh:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: #2dd4bf;
}

/* 卡片背面頂部的中文名稱專屬樣式 */
.brand-tag-back {
  font-size: clamp(1.15rem, 4.2vw, 1.45rem);
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #2dd4bf;
  text-align: center;
}

.back-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 12px;
  padding-top: 16px;
}

/* 化學分子式樣式調整 */
.back-name.molecular-formula {
  font-size: clamp(1.2rem, 4.5vw, 1.55rem);
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.02em;
  text-align: center;
  margin-top: 4px;
  min-height: 28px;
}

/* 下標化學數字的樣式優化 */
.back-name.molecular-formula :deep(sub) {
  font-size: 0.65em;
  bottom: -0.1em;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
}

/* ── 核心：結構圖排版 ── */
.molecular-container {
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 8px;
  transition: background 0.2s;
}
.molecular-container:hover {
  background: rgba(255, 255, 255, 0.1);
}

.molecular-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity 0.3s;
}

/* 查無數據提示面板 */
.no-data-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.45);
}
.error-icon {
  font-size: 1.3rem;
}

.inverted-img {
  filter: invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.1);
  mix-blend-mode: screen;
}

/* 加載骨架屏 */
.img-skeleton {
  position: absolute;
  inset: 0;
  background: #11264b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #2dd4bf;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.zoom-indicator {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.55rem;
  color: rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  gap: 3px;
}

.back-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
}

/* 資訊排版群組 */
.info-rows-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 6px 12px;
}

.custom-back-row {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.2);
}

.back-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.back-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.back-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
}

.back-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
}

.custom-row-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: bold;
  color: #ffffff;
  outline: none;
  padding: 2px 0;
  font-family: sans-serif;
}
.custom-row-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 藥物功效文字特效 */
.back-effect {
  font-weight: 700;
  color: #2dd4bf;
}

/* ── 提示說明區 ── */
.card-hint {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}
.card-front .card-hint {
  color: rgba(26, 58, 110, 0.5);
}
.hint-icon {
  width: 12px;
  height: 12px;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

/* ── 導航小圓點 ── */
.dot-nav {
  display: flex;
  gap: 6px;
  align-items: center;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  background: #cbd5e1;
  cursor: pointer;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.dot.active {
  background: #1a3a6e;
  width: 20px;
  border-radius: 4px;
}
.dot.custom-dot {
  background: #e2dfd5;
  border: 1px solid #c8a84b;
}
.dot.custom-dot.active {
  background: #c8a84b;
}

/* ── 鍵盤輔助提示 ── */
.keyboard-hint {
  font-size: 0.7rem;
  color: #94a3b8;
  letter-spacing: 0.05em;
  text-align: center;
}
kbd {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.65rem;
  font-weight: 700;
  color: #475569;
  box-shadow: 0 1px 1px rgba(0,0,0,0.1);
  margin: 0 2px;
}

/* 響應式佈局調整 */
.device-desktop { display: inline; }
.device-mobile  { display: none; }

@media (max-width: 640px) {
  .nav-btn { display: none; }
  .device-desktop { display: none; }
  .device-mobile  { display: block; }
}
</style>