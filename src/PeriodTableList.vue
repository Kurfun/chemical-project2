<script setup lang="ts">
import type { ElementData } from './type3';
import { CATEGORIES } from './elementsData';

defineProps<{
  elements: ElementData[];
  filteredZSet: Set<number> | null;
}>();

const emit = defineEmits<{
  (e: 'select-element', element: ElementData): void;
}>();

const getCategoryStyle = (cat: string) => {
  const c = CATEGORIES[cat] || CATEGORIES.unknown;
  return {
    bg: c.bg,
    border: c.border,
    color: c.color,
    label: c.label
  };
};

const isVisible = (z: number, filteredZSet: Set<number> | null) => {
  if (!filteredZSet) return true;
  return filteredZSet.has(z);
};
</script>

<template>
  <div class="list-view-container">
    <template v-for="el in elements" :key="el.z">
      <div 
        v-show="isVisible(el.z, filteredZSet)"
        class="pt-list-item"
        @click="emit('select-element', el)"
      >
        <!-- 元素縮圖盒 -->
        <div 
          class="list-item-sym-box" 
          :style="{
            background: getCategoryStyle(el.cat).bg,
            border: `1.5px solid ${getCategoryStyle(el.cat).border}`,
            color: getCategoryStyle(el.cat).color
          }"
        >
          <span class="box-z">{{ el.z }}</span>
          <span class="box-sym">{{ el.sym }}</span>
        </div>

        <!-- 元素標題 -->
        <div class="list-item-info">
          <div class="title-row">
            <span class="zh-name">{{ el.zh }}</span>
            <span class="en-name">{{ el.en }}</span>
          </div>
          <div class="detail-row">
            <span class="mass-val">原子量: {{ el.mass }}</span>
            <span class="state-badge">{{ el.state }}</span>
          </div>
        </div>

        <!-- 右側分類標籤 -->
        <div class="category-indicator">
          <span 
            class="cat-badge"
            :style="{
              background: getCategoryStyle(el.cat).bg,
              color: getCategoryStyle(el.cat).color,
              borderColor: getCategoryStyle(el.cat).border
            }"
          >
            {{ getCategoryStyle(el.cat).label }}
          </span>
          <span class="arrow">→</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.list-view-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 4px;
}

.pt-list-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 4px;
  padding: 10px 14px;
  margin-bottom: 8px;
  border: 1.5px solid #1a3a6e;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 2px 4px rgba(26,58,110,0.03);
}

.pt-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(26,58,110,0.08);
  border-color: #c8a84b;
}

.pt-list-item:active {
  transform: scale(0.98);
}

.list-item-sym-box {
  width: 44px;
  height: 44px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Fira Code', monospace;
  font-weight: 700;
  margin-right: 12px;
  flex-shrink: 0;
  position: relative;
}

.box-z {
  font-size: 0.52rem;
  position: absolute;
  top: 1px;
  left: 3px;
  opacity: 0.75;
}

.box-sym {
  font-size: 0.9rem;
  line-height: 1;
  margin-top: 2px;
}

.list-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.zh-name {
  font-size: 1.05rem;
  font-weight: bold;
  color: #1a3a6e;
}

.en-name {
  font-size: 0.75rem;
  color: #666;
  font-family: 'Fira Code', monospace;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: #666;
}

.state-badge {
  background: #f4f1ea;
  padding: 1px 6px;
  border-radius: 3px;
  color: #1a3a6e;
  font-weight: 600;
}

.category-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cat-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 3px;
  border: 1px solid transparent;
}

.arrow {
  color: #c8a84b;
  font-size: 0.85rem;
}
</style>