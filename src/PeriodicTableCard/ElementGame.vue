<script setup lang="ts">
import { ref, computed, onUnmounted, nextTick } from 'vue';
import type { ElementData, GameCard } from './type3';

const props = defineProps<{
  elements: ElementData[];
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'trigger-toast', title: string, msg: string): void;
}>();

// 遊戲執行狀態
const isPlaying = ref(false);
const cards = ref<GameCard[]>([]);
const flippedIndices = ref<number[]>([]);
const matchedCount = ref(0);
const secondsElapsed = ref(0);
const isEvaluating = ref(false); // 防點擊過速安全鎖
let timerInterval: number | null = null;

// ── 挑戰範圍輸入值 (預設為 '1~20') ──
const rangeInput = ref<string>('1~20');

// 智慧解析輸入範圍 (支援 n1~n2, n1-n2 與任意空格)
const parsedRange = computed(() => {
  const trimmed = rangeInput.value.trim();
  // 匹配：[數字][波浪號或減號][數字]
  const match = trimmed.match(/^\s*(\d+)\s*[~-]\s*(\d+)\s*$/);
  if (!match) return null;

  const r1 = parseInt(match[1], 10);
  const r2 = parseInt(match[2], 10);

  // 必須為正整數且在 1~118 合法區間內
  if (isNaN(r1) || isNaN(r2) || r1 <= 0 || r2 <= 0) return null;
  if (r1 > 118 || r2 > 118) return null;

  return {
    min: Math.min(r1, r2),
    max: Math.max(r1, r2)
  };
});

// 根據解析後的區間過濾元素池
const filteredPool = computed(() => {
  if (!parsedRange.value) return [];
  const { min, max } = parsedRange.value;
  return props.elements.filter(el => el.z >= min && el.z <= max);
});

// 驗證範圍是否合法 (範圍內元素數量必須大於等於 4)
const isRangeValid = computed(() => {
  if (!parsedRange.value) return false;
  return filteredPool.value.length >= 4;
});

// 經典 Fisher-Yates 洗牌演算法 (與單字卡一致)
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 清理計時器
onUnmounted(() => {
  stopTimer();
});

const startTimer = () => {
  stopTimer();
  secondsElapsed.value = 0;
  timerInterval = window.setInterval(() => {
    secondsElapsed.value++;
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// 建立配對遊戲
const startNewGame = () => {
  if (!isRangeValid.value) return;

  stopTimer();
  flippedIndices.value = [];
  matchedCount.value = 0;
  isEvaluating.value = false;
  
  // 1. 從過濾後的元素池中隨機抽取 4 個元素
  const pool = shuffle(filteredPool.value).slice(0, 4);

  // 2. 建立 8 張卡牌 (4 張中文名稱，4 張英文名稱)
  const rawCards: GameCard[] = [];
  pool.forEach(el => {
    rawCards.push({
      text: el.zh,
      matchId: el.z,
      isFlipped: false,
      isMatched: false
    });
    rawCards.push({
      text: el.en,
      matchId: el.z,
      isFlipped: false,
      isMatched: false
    });
  });

  // 3. 洗牌
  cards.value = shuffle(rawCards);
  isPlaying.value = true;
  
  nextTick(() => {
    startTimer();
  });
};

const handleCardClick = (index: number) => {
  if (isEvaluating.value) return; // 如果正在比對中，不可點擊
  
  const card = cards.value[index];
  if (card.isMatched || card.isFlipped || flippedIndices.value.length >= 2) return;

  card.isFlipped = true;
  flippedIndices.value.push(index);

  if (flippedIndices.value.length === 2) {
    isEvaluating.value = true; // 開啟比對鎖，等待期間禁止所有點擊
    const [firstIdx, secondIdx] = flippedIndices.value;
    const cardA = cards.value[firstIdx];
    const cardB = cards.value[secondIdx];

    // 情況 A：配對成功 (matchId 均為原子序)
    if (cardA.matchId === cardB.matchId) {
      setTimeout(() => {
        cardA.isMatched = true;
        cardB.isMatched = true;
        matchedCount.value++;
        flippedIndices.value = [];
        isEvaluating.value = false; // 解鎖

        if (matchedCount.value === 4) {
          stopTimer();
          setTimeout(() => {
            emit('trigger-toast', '🏆 挑戰完成！', `恭喜您在 ${secondsElapsed.value} 秒內成功配對了 4 組元素！再接再厲！`);
            isPlaying.value = false;
          }, 400);
        }
      }, 600); // 停滯 0.6 秒
    } else {
      // 情況 B：配對失敗，翻回正面
      setTimeout(() => {
        cardA.isFlipped = false;
        cardB.isFlipped = false;
        flippedIndices.value = [];
        isEvaluating.value = false; // 解鎖
      }, 1000);
    }
  }
};

const handleClose = () => {
  stopTimer();
  isPlaying.value = false;
  emit('close');
};
</script>

<template>
  <div class="game-overlay" :class="{ open: show }" @click.self="handleClose">
    <div class="game-modal">
      <button class="game-close" @click="handleClose">✕</button>

      <div class="game-header">
        <h2 class="game-title">🧠 元素記憶配對</h2>
        <p class="game-desc">翻開卡牌，將「中文元素名」與其「英文名稱」成功配對！</p>
      </div>

      <!-- 準備開始畫面 (僅保留單一輸入框，與開始挑戰按鈕等寬居中) -->
      <div v-if="!isPlaying" class="lobby-view">
        <div class="lobby-deco">⬡</div>
        
        <!-- 🎯 優化後的極簡單一輸入框 -->
        <div class="config-wrapper">
          <input 
            v-model="rangeInput" 
            type="text" 
            placeholder="1~20" 
            class="range-text-input"
            title="請輸入挑戰範圍，例如: 1~20"
          />
          
          <!-- 狀態驗證微細文字 -->
          <div class="validation-label">
            <span v-if="isRangeValid" class="msg-success">
              ✓ 篩選出 <strong>{{ filteredPool.length }}</strong> 個元素可供抽選
            </span>
            <span v-else class="msg-error">
              ⚠️ 格式須為正整數 n1~n2 且包含 ≥4 個元素
            </span>
          </div>
        </div>

        <button 
          class="lobby-start-btn" 
          :disabled="!isRangeValid"
          @click="startNewGame"
        >
          開始挑戰
        </button>
      </div>

      <!-- 進行遊戲畫面 -->
      <div v-else class="play-view">
        <!-- 計時看板 -->
        <div class="timer-board">
          <span class="clock-icon">⏱️</span>
          <span class="time-count">{{ secondsElapsed }} 秒</span>
        </div>

        <!-- 8 張卡牌格 (雙欄) -->
        <div class="game-grid">
          <div v-for="(card, idx) in cards" :key="idx" class="g-card" @click="handleCardClick(idx)">
            <div class="g-inner" :class="{ flipped: card.isFlipped || card.isMatched, matched: card.isMatched }">
              
              <!-- 卡背：古典深藍底 -->
              <div class="g-card-face g-card-back">
                <div class="g-back-border">
                  <img src="/logo2.png" class="g-back-logo-img" alt="Logo" />
                </div>
              </div>

              <!-- 卡面：古典淡色襯線卡片 -->
              <div class="g-card-face g-card-front">
                <span class="g-text">{{ card.text }}</span>
              </div>

            </div>
          </div>
        </div>

        <button class="game-reset-btn" @click="startNewGame">重新洗牌</button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.game-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.game-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

.game-modal {
  background: #f4f1ea;
  border: 2px solid #1a3a6e;
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
  padding: 24px;
  position: relative;
  box-shadow: 0 10px 30px rgba(26,58,110,0.18);
  font-family: 'Noto Serif TC', serif;
  transform: translateY(15px);
  transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.15);
}

.game-overlay.open .game-modal {
  transform: translateY(0);
}

.game-close {
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
.game-close:hover { opacity: 1; }

.game-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1.5px dashed #1a3a6e22;
}

.game-title {
  color: #1a3a6e;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.game-desc {
  font-size: 0.78rem;
  color: #555555;
  line-height: 1.4;
  padding: 0 10px;
}

/* 準備室風格 */
.lobby-view {
  text-align: center;
  padding: 16px 0 20px;
}

.lobby-deco {
  font-size: 3rem;
  color: #c8a84b;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

/* 🎯 極簡單一輸入框容器 */
.config-wrapper {
  margin: 0 auto 20px auto;
  width: 180px; /* 與按鈕完美等寬比例 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* 文字輸入框：極具質感的古典輸入風格 */
.range-text-input {
  width: 100%;
  padding: 10px;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  background: #ffffff;
  color: #1a3a6e;
  font-family: 'Fira Code', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  box-shadow: inset 0 1px 3px rgba(26,58,110,0.06);
  transition: all 0.2s;
}

.range-text-input:focus {
  outline: none;
  border-color: #c8a84b;
  box-shadow: 0 0 0 2px rgba(200, 168, 75, 0.2);
}

.validation-label {
  font-size: 0.65rem;
  min-height: 1rem;
  white-space: nowrap;
}

.msg-success {
  color: #27ae60;
  font-weight: 600;
}

.msg-error {
  color: #c0392b;
  font-weight: bold;
}

.lobby-start-btn {
  background: #1a3a6e;
  color: #f4f1ea;
  border: none;
  border-radius: 4px;
  padding: 12px 48px;
  font-size: 0.95rem;
  font-family: 'Noto Serif TC', serif;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: bold;
  letter-spacing: 0.08em;
  width: 180px; /* 與輸入框完美對齊 */
}

.lobby-start-btn:hover:not(:disabled) {
  background: #12284c;
}

.lobby-start-btn:disabled {
  background: #c8c5be;
  color: #8a8882;
  cursor: not-allowed;
}

/* 遊戲中畫面 */
.timer-board {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 14px;
  background: #ffffff;
  border: 1px solid #1a3a6e44;
  padding: 4px 14px;
  border-radius: 20px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.clock-icon { font-size: 0.85rem; }
.time-count {
  font-size: 0.85rem;
  font-family: 'Fira Code', monospace;
  color: #1a3a6e;
  font-weight: 700;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.g-card {
  perspective: 900px;
  cursor: pointer;
  height: 76px;
}

.g-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
  transform-style: preserve-3d;
}

.g-inner.flipped {
  transform: rotateY(180deg);
}

.g-inner.matched {
  opacity: 0.45;
  transform: rotateY(180deg);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
}

.g-card-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

/* 卡背：高質感古典深藍 */
.g-card-back {
  background: #1a3a6e;
  border: 1.5px solid #c8a84b;
  padding: 3px;
  transform: rotateY(0deg);
}

.g-back-border {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(200, 168, 75, 0.4);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.g-back-logo-img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
  pointer-events: none;
}

/* 卡面：高雅羊皮紙白 */
.g-card-front {
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  transform: rotateY(180deg);
  box-shadow: inset 0 0 10px rgba(26,58,110,0.05);
  padding: 4px 8px;
}

.g-text {
  font-size: clamp(0.75rem, 3.2vw, 1rem);
  font-weight: bold;
  color: #1a3a6e;
  text-align: center;
  word-break: break-word;
  line-height: 1.2;
}

.game-reset-btn {
  background: none;
  border: 1.5px solid #1a3a6e;
  color: #1a3a6e;
  font-family: 'Noto Serif TC', serif;
  border-radius: 4px;
  padding: 8px 24px;
  font-size: 0.85rem;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  transition: all 0.15s;
}
.game-reset-btn:hover {
  background: #1a3a6e;
  color: #f4f1ea;
}
</style>