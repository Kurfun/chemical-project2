<script setup lang="ts">
import type { ElementData } from './type3';
import { CATEGORIES } from './elementsData';

const props = defineProps<{
  elements: ElementData[];
  filteredZSet: Set<number> | null;
}>();

const emit = defineEmits<{
  (e: 'select-element', element: ElementData): void;
}>();

// 經典 18 欄佈局矩陣
const LAYOUT = [
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
  [3,4,0,0,0,0,0,0,0,0,0,0,5,6,7,8,9,10],
  [11,12,0,0,0,0,0,0,0,0,0,0,13,14,15,16,17,18],
  [19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36],
  [37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54],
  [55,56,-1,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86],
  [87,88,-2,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118]
];

// 鑭系 & 錒系 (主網格下方分離呈現)
const LANTHANIDES = [57,58,59,60,61,62,63,64,65,66,67,68,69,70,71];
const ACTINIDES = [89,90,91,92,93,94,95,96,97,98,99,100,101,102,103];

const getElementByZ = (z: number, elements: ElementData[]) => {
  return elements.find(el => el.z === z);
};

const getCategoryStyle = (cat: string) => {
  const c = CATEGORIES[cat] || CATEGORIES.unknown;
  return {
    bg: c.bg,
    border: c.border,
    color: c.color
  };
};

// 計算是否需要高亮或淡化
const isDimmed = (z: number, filteredZSet: Set<number> | null) => {
  if (!filteredZSet) return false;
  return !filteredZSet.has(z);
};

const isHighlighted = (z: number, filteredZSet: Set<number> | null) => {
  if (!filteredZSet) return false;
  return filteredZSet.has(z);
};
</script>

<template>
  <div class="table-wrapper">
    <!-- 主週期表 (7x18 網格) -->
    <div class="grid-table">
      <div v-for="(row, rIdx) in LAYOUT" :key="`row-${rIdx}`" class="table-row">
        <div v-for="(cell, cIdx) in row" :key="`cell-${cIdx}`" class="cell-wrapper">
          
          <!-- 化學元素格 -->
          <div v-if="cell > 0 && getElementByZ(cell, elements)"
               class="element-cell"
               :class="{ 
                 dimmed: isDimmed(cell, filteredZSet),
                 highlighted: isHighlighted(cell, filteredZSet)
               }"
               :style="{
                 background: getCategoryStyle(getElementByZ(cell, elements)!.cat).bg,
                 borderColor: getCategoryStyle(getElementByZ(cell, elements)!.cat).border,
                 color: getCategoryStyle(getElementByZ(cell, elements)!.cat).color
               }"
               @click="emit('select-element', getElementByZ(cell, elements)!)"
          >
            <span class="el-z">{{ cell }}</span>
            <span class="el-symbol">{{ getElementByZ(cell, elements)!.sym }}</span>
            <span class="el-name-zh">{{ getElementByZ(cell, elements)!.zh }}</span>
          </div>

          <!-- 導航過渡導覽格 (鑭/錒) -->
          <div v-else-if="cell === -1" class="lanthanide-spacer">
            <span class="spacer-text">57-71</span>
            <span class="spacer-sub">鑭系</span>
          </div>
          <div v-else-if="cell === -2" class="actinide-spacer">
            <span class="spacer-text">89-103</span>
            <span class="spacer-sub">錒系</span>
          </div>

          <!-- 空白格 -->
          <div v-else class="spacer-cell"></div>

        </div>
      </div>
    </div>

    <!-- 鑭系、錒系 獨立底部展示區 -->
    <div class="lan-act-container">
      <!-- 鑭系 -->
      <div class="extra-row">
        <!-- 絕對定位文字，置中於前兩格空白區 -->
        <div class="extra-label">鑭系元素</div>
        
        <!-- 前方 2 格空白，用來完美對齊第 3 欄 -->
        <div class="cell-wrapper"></div>
        <div class="cell-wrapper"></div>
        
        <!-- 鑭系元素 15 格，皆包覆在 cell-wrapper 中以固定尺寸 -->
        <div v-for="z in LANTHANIDES" :key="`lan-${z}`" class="cell-wrapper">
          <div class="element-cell"
               :class="{ 
                 dimmed: isDimmed(z, filteredZSet),
                 highlighted: isHighlighted(z, filteredZSet)
               }"
               :style="{
                 background: getCategoryStyle('lanthanide').bg,
                 borderColor: getCategoryStyle('lanthanide').border,
                 color: getCategoryStyle('lanthanide').color
               }"
               @click="emit('select-element', getElementByZ(z, elements)!)"
          >
            <span class="el-z">{{ z }}</span>
            <span class="el-symbol">{{ getElementByZ(z, elements)!.sym }}</span>
            <span class="el-name-zh">{{ getElementByZ(z, elements)!.zh }}</span>
          </div>
        </div>

        <!-- 後方 1 格空白補滿 18 欄 -->
        <div class="cell-wrapper"></div>
      </div>

      <!-- 錒系 -->
      <div class="extra-row">
        <!-- 絕對定位文字，置中於前兩格空白區 -->
        <div class="extra-label">錒系元素</div>
        
        <!-- 前方 2 格空白，用來完美對齊第 3 欄 -->
        <div class="cell-wrapper"></div>
        <div class="cell-wrapper"></div>
        
        <!-- 錒系元素 15 格，皆包覆在 cell-wrapper 中以固定尺寸 -->
        <div v-for="z in ACTINIDES" :key="`act-${z}`" class="cell-wrapper">
          <div class="element-cell"
               :class="{ 
                 dimmed: isDimmed(z, filteredZSet),
                 highlighted: isHighlighted(z, filteredZSet)
               }"
               :style="{
                 background: getCategoryStyle('actinide').bg,
                 borderColor: getCategoryStyle('actinide').border,
                 color: getCategoryStyle('actinide').color
               }"
               @click="emit('select-element', getElementByZ(z, elements)!)"
          >
            <span class="el-z">{{ z }}</span>
            <span class="el-symbol">{{ getElementByZ(z, elements)!.sym }}</span>
            <span class="el-name-zh">{{ getElementByZ(z, elements)!.zh }}</span>
          </div>
        </div>

        <!-- 後方 1 格空白補滿 18 欄 -->
        <div class="cell-wrapper"></div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  padding: 10px 0;
  -webkit-overflow-scrolling: touch;
}
.table-wrapper::-webkit-scrollbar {
  height: 6px;
}
.table-wrapper::-webkit-scrollbar-thumb {
  background: #1a3a6e33;
  border-radius: 3px;
}

/* 經典網格週期表 */
.grid-table {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 900px;
  padding-bottom: 12px;
}

.table-row {
  display: flex;
  gap: 4px;
}

.cell-wrapper {
  width: 46px;
  height: 56px;
  flex-shrink: 0;
}

/* 元素格基本設計 */
.element-cell {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  border: 1.5px solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

/* 微互動與浮起 */
@media (pointer: fine) {
  .element-cell:hover {
    transform: translateY(-3px) scale(1.08);
    box-shadow: 0 4px 8px rgba(26,58,110,0.15);
    z-index: 10;
  }
}

.element-cell:active {
  transform: scale(0.95);
}

.dimmed {
  opacity: 0.18 !important;
  filter: grayscale(0.5);
  transform: scale(0.92);
}

.highlighted {
  opacity: 1 !important;
  box-shadow: 0 0 0 1.5px currentColor, 0 4px 8px rgba(0,0,0,0.1);
  font-weight: bold;
}

/* 內文字型與對齊 */
.el-z {
  position: absolute;
  top: 2px;
  left: 3px;
  font-size: 0.55rem;
  font-family: 'Fira Code', monospace;
  opacity: 0.75;
  line-height: 1; 
}

.el-symbol {
  font-size: 0.95rem;
  font-weight: 700;
  font-family: 'Fira Code', monospace;
  line-height: 1;
  margin-top: 8px; 
}

.el-name-zh {
  font-size: 0.7rem;
  font-weight: 600;
  margin-top: 1px;
}

/* 過渡導覽格 */
.lanthanide-spacer, .actinide-spacer {
  width: 100%;
  height: 100%;
  border: 1.5px dashed #1a3a6e55;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #1a3a6e;
  opacity: 0.7;
}

.spacer-text {
  font-size: 0.55rem;
  font-family: 'Fira Code', monospace;
}

.spacer-sub {
  font-size: 0.6rem;
  font-weight: bold;
}

.spacer-cell {
  width: 100%;
  height: 100%;
}

/* 底部獨立鑭/錒系呈現 */
.lan-act-container {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 900px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1.5px dashed #1a3a6e33;
  position: relative;
}

.extra-row {
  display: flex;
  gap: 4px;
  align-items: center;
  position: relative;
}

.extra-label {
  position: absolute;
  left: 0;
  width: 96px;
  font-size: 0.75rem;
  font-weight: bold;
  color: #1a3a6e;
  text-align: center;
  opacity: 0.85;
  pointer-events: none;
  z-index: 5;
}
</style>