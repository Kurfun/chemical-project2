<template>
  <div class="paper-card" @click="emit('edit', paper)">
    <div class="card-title">{{ paper.title }}</div>

    <!-- 標籤區 -->
    <div class="card-tags">
      <span v-if="paper.journal" class="tag tag-journal">{{ paper.journal }}</span>
      <span v-if="paper.impactFactor !== null" class="tag tag-if">IF {{ paper.impactFactor }}</span>
      <span v-if="paper.url" class="tag tag-url" @click.stop="openURL(paper.url)">🔗 DOI 連結</span>
    </div>

    <!-- 備忘筆記 -->
    <div v-if="paper.notes" class="card-note">{{ paper.notes }}</div>

    <!-- PDF 檔案開啟徽章 -->
    <div 
      v-if="paper.pdfName && paper.pdfData" 
      class="card-pdf" 
      @click.stop="emit('openPdf', paper)"
    >
      <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
      </svg>
      <span class="card-pdf-name">{{ paper.pdfName }}</span>
    </div>

    <!-- 頁尾 -->
    <div class="card-footer">
      <span class="progress-badge" :class="paper.status">{{ statusLabel(paper.status) }}</span>
      <div class="stars">
        <span 
          v-for="i in 5" 
          :key="i" 
          class="star" 
          :class="i <= paper.rating ? 'on' : 'off'"
        >
          ★
        </span>
      </div>
    </div>

    <!-- 移動看板直欄之快捷按鈕 -->
    <div class="card-move-btns" @click.stop>
      <button 
        v-for="other in otherStatuses" 
        :key="other.id" 
        class="move-btn"
        @click="emit('quickMove', paper.id, other.id)"
      >
        → {{ other.shortLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Paper, KanbanStatus } from './type5';

defineProps<{
  paper: Paper;
  otherStatuses: Array<{ id: KanbanStatus; label: string; shortLabel: string }>;
}>();

const emit = defineEmits(['edit', 'quickMove', 'openPdf']);

const openURL = (url: string) => {
  window.open(url, '_blank');
};

const statusLabel = (s: KanbanStatus) => {
  return { to_read: '待閱讀', reading: '閱讀中', experimented: '已驗證', archive: '已封存' }[s];
};
</script>

<style scoped>
.paper-card {
  background: #f4f1ea;
  border: 1.5px solid #c8b89a;
  border-radius: 6px;
  padding: 11px 12px;
  cursor: pointer;
  transition: box-shadow 0.15s, background 0.12s, border-color 0.12s;
}
.paper-card:hover {
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(26, 58, 110, 0.08);
  border-color: #1a3a6e;
}
.card-title {
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.45;
  color: #1a3a6e;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 7px;
  transition: color 0.12s;
}
.paper-card:hover .card-title { color: #c8a84b; }
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.tag {
  font-size: 9.5px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid transparent;
}
.tag-journal { background: #e6dfd3; color: #1a3a6e; border-color: #c8b89a; }
.tag-if { background: #eef2ff; color: #1a3a6e; border-color: #bfdbfe; }
.tag-url { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; cursor: pointer; }
.card-note {
  font-size: 10px;
  color: #8a8070;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 7px;
}
.card-pdf {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #ef4444;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 7px;
  cursor: pointer;
  width: fit-content;
  max-width: 100%;
}
.card-pdf:hover { background: #fee2e2; }
.card-pdf-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px; }
.card-footer {
  border-top: 1px solid #e6dfd3;
  padding-top: 7px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stars { display: flex; gap: 2px; }
.star { font-size: 10px; }
.star.on { color: #c8a84b; }
.star.off { color: #e6dfd3; }
.progress-badge {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid;
}
.progress-badge.to_read { background: #e6dfd3; color: #1a3a6e; border-color: #c8b89a; }
.progress-badge.reading { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }
.progress-badge.experimented { background: #ecfdf5; color: #10b981; border-color: #a7f3d0; }
.progress-badge.archive { background: #f5f3ff; color: #8b5cf6; border-color: #ddd6fe; }
.card-move-btns {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid #e6dfd3;
}
.move-btn {
  font-size: 9.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #ffffff;
  border: 1.5px solid #c8b89a;
  color: #1a3a6e;
  font-weight: 700;
  cursor: pointer;
}
.move-btn:hover { background: #f4f1ea; color: #c8a84b; border-color: #1a3a6e; }
</style>