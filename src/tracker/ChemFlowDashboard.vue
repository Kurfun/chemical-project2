<template>
  <div class="chemflow-container">
    <!-- ═══════ TOP NAV (分頁與搜尋) ═══════ -->
    <nav class="topnav">
      <div class="topnav-left">
        <button 
          class="proj-tab" 
          :class="{ active: state.activeProject === 'all' }" 
          @click="state.activeProject = 'all'"
        >
          所有論文 <span class="proj-tab-count">{{ state.papers.length }}</span>
        </button>
        <div class="tab-divider"></div>

        <!-- 課題分頁 (支援拖曳排序) -->
        <div 
          v-for="(proj, idx) in state.projects" 
          :key="proj.id"
          class="proj-tab"
          :class="{ 
            active: state.activeProject === proj.id,
            'drag-over': dragOverId === proj.id 
          }"
          draggable="true"
          @click="state.activeProject = proj.id"
          @dragstart="handleDragStart(idx)"
          @dragover.prevent="handleDragOver(proj.id)"
          @dragleave="handleDragLeave"
          @drop="handleDrop(idx)"
          @dragend="handleDragEnd"
        >
          <span class="proj-tab-dot" :style="{ background: proj.color }"></span>
          <span class="proj-tab-text">{{ proj.name }}</span>
          <span class="proj-tab-count">{{ getProjectPaperCount(proj.id) }}</span>
          
          <button 
            class="proj-tab-del" 
            title="刪除課題"
            @click.stop="triggerDeleteProject(proj)"
          >
            ✕
          </button>
        </div>

        <div class="tab-divider"></div>
        <button class="new-topic-btn" @click="showProjectModal = true">
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          新增主題
        </button>
      </div>

      <div class="topnav-right">
        <div class="search-wrap">
          <svg class="search-icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="searchQuery" 
            class="search-input" 
            type="text" 
            placeholder="搜尋標題、期刊、筆記..." 
          />
        </div>

        <button class="btn-bookmark" @click="openNewBookmarkModal">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          新增書籤
        </button>
      </div>
    </nav>

    <!-- 副標題與狀態膠囊 -->
    <div class="subheader">
      <div class="subheader-left">
        <span class="subheader-title">{{ currentProjectName }}</span>
        <span class="subheader-count">共 {{ filteredPapers.length }} 篇文獻</span>
      </div>

      <div class="status-filter-bar">
        <span class="status-filter-label">篩選狀態</span>
        <button 
          v-for="col in columns" 
          :key="col.id" 
          class="sf-pill"
          :class="{ [`active-${col.id}`]: activeStatusFilters.has(col.id) }"
          @click="toggleStatusFilter(col.id)"
        >
          <span class="sf-pill-dot" :style="{ background: col.dot }"></span>
          {{ col.label }}
        </button>
        <button 
          v-if="activeStatusFilters.size > 0" 
          class="sf-clear" 
          @click="clearStatusFilter"
        >
          ✕ 清除
        </button>
      </div>
    </div>

    <!-- 看板主體 -->
    <div class="workspace">
      <div class="kanban-board">
        <div 
          v-for="col in visibleColumns" 
          :key="col.id" 
          class="kanban-col"
        >
          <div class="col-header" :class="col.cls">
            <span class="col-title">
              <span class="col-title-dot" :style="{ background: col.dot }"></span>
              {{ col.label }}
            </span>
            <span class="col-count">{{ getPapersByStatus(col.id).length }}</span>
          </div>

          <div class="col-body">
            <div v-if="getPapersByStatus(col.id).length === 0" class="col-empty">
              此處尚無任何文獻
            </div>

            <!-- 自治文獻卡片元件 -->
            <PaperCard 
              v-for="paper in getPapersByStatus(col.id)" 
              :key="paper.id"
              :paper="paper"
              :other-statuses="getOtherStatuses(col.id)"
              @edit="openEditBookmarkModal"
              @quick-move="quickMove"
              @open-pdf="openPDFReader"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯文獻之 Modal 元件 -->
    <PaperBookmarkModal 
      :is-open="showBookmarkModal"
      :is-editing="isEditing"
      :paper="selectedPaper"
      :projects="state.projects"
      :active-project="state.activeProject"
      @close="showBookmarkModal = false"
      @save="handleSaveBookmark"
      @delete="triggerDeletePaper"
    />

    <!-- 新增課題之 Modal 元件 -->
    <ProjectModal 
      :is-open="showProjectModal"
      @close="showProjectModal = false"
      @submit="handleCreateProject"
    />

    <!-- 刪除文獻確認對話框 -->
    <div v-if="showDeletePaperConfirm" class="modal-overlay">
      <div class="confirm-dialog">
        <h3>確定要刪除此文獻書籤？</h3>
        <p>此動作無法還原，請確認您不再需要此筆資料。</p>
        <div class="confirm-btns">
          <button class="btn btn-ghost" @click="showDeletePaperConfirm = false">取消</button>
          <button class="btn btn-primary btn-danger-bg" @click="confirmDeletePaper">確認刪除</button>
        </div>
      </div>
    </div>

    <!-- 刪除主題確認對話框 -->
    <div v-if="showDeleteProjectConfirm" class="modal-overlay">
      <div class="confirm-dialog">
        <h3>確認刪除此研究課題？</h3>
        <p><strong>{{ pendingDeleteProjectObj?.name }}</strong></p>
        <p class="warning-text">
          這將會連同該課題下的所有文獻（共 {{ getProjectPaperCount(pendingDeleteProjectObj?.id || '') }} 篇）一併刪除！
        </p>
        <div class="confirm-btns">
          <button class="btn btn-ghost" @click="showDeleteProjectConfirm = false">取消</button>
          <button class="btn btn-primary btn-danger-bg" @click="confirmDeleteProject">確認刪除</button>
        </div>
      </div>
    </div>

    <!-- PDF 檢視彈出視窗元件 -->
    <PdfViewerModal 
      :is-open="pdfReaderState.isOpen"
      :base64-data="pdfReaderState.pdfData"
      :filename="pdfReaderState.pdfName"
      @close="pdfReaderState.isOpen = false"
    />

    <!-- Toast 輕量化系統通知 -->
    <div v-if="toast.show" class="toast">
      <div class="toast-dot"></div>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useChemFlow } from './useChemFlow';
import PaperCard from './PaperCard.vue';
import PaperBookmarkModal from './PaperBookmarkModal.vue';
import ProjectModal from './ProjectModal.vue';
import PdfViewerModal from './PdfViewerModal.vue';
import type { Paper, KanbanStatus, ResearchTopic } from './type5.ts';

const {
  state,
  searchQuery,
  activeStatusFilters,
  filteredPapers,
  createProject,
  deleteProject,
  reorderProjects,
  addPaper,
  updatePaper,
  deletePaper,
  movePaper,
  toggleStatusFilter,
  clearStatusFilter
} = useChemFlow();

const columns = [
  { id: 'to_read', label: '待閱讀 (To Read)', shortLabel: '待讀', cls: 'col-toread', dot: '#9ca3af' },
  { id: 'reading', label: '閱讀中 (Reading)', shortLabel: '閱讀', cls: 'col-reading', dot: '#3b82f6' },
  { id: 'experimented', label: '已驗證 (Experimented)', shortLabel: '驗證', cls: 'col-experimented', dot: '#10b981' },
  { id: 'archive', label: '封存 (Archive)', shortLabel: '封存', cls: 'col-archive', dot: '#8b5cf6' }
] as const;

const visibleColumns = computed(() => {
  if (activeStatusFilters.value.size > 0) {
    return columns.filter(col => activeStatusFilters.value.has(col.id));
  }
  return columns;
});

const currentProjectName = computed(() => {
  if (state.value.activeProject === 'all') return '所有研究項目';
  const proj = state.value.projects.find(p => p.id === state.value.activeProject);
  return proj ? proj.name : '';
});

const getProjectPaperCount = (projId: string) => {
  return state.value.papers.filter(p => p.projectId === projId).length;
};

const getPapersByStatus = (status: KanbanStatus) => {
  return filteredPapers.value.filter(p => p.status === status);
};

const getOtherStatuses = (currentStatus: KanbanStatus) => {
  return columns.filter(col => col.id !== currentStatus);
};

const statusLabel = (s: KanbanStatus) => {
  return { to_read: '待閱讀', reading: '閱讀中', experimented: '已驗證', archive: '已封存' }[s];
};

// Toast 控制
const toast = reactive({ show: false, message: '', timer: null as any });
const showToast = (msg: string) => {
  toast.message = msg;
  toast.show = true;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { toast.show = false; }, 3000);
};

// ══════════════════════════════ TAB DRAG & DROP ══════════════════════════════
const draggingIndex = ref<number | null>(null);
const dragOverId = ref<string | null>(null);

const handleDragStart = (idx: number) => { draggingIndex.value = idx; };
const handleDragOver = (projId: string) => { dragOverId.value = projId; };
const handleDragLeave = () => { dragOverId.value = null; };
const handleDrop = (targetIdx: number) => {
  if (draggingIndex.value !== null && draggingIndex.value !== targetIdx) {
    reorderProjects(draggingIndex.value, targetIdx);
    showToast('主題順序已更新！');
  }
};
const handleDragEnd = () => { draggingIndex.value = null; dragOverId.value = null; };

// ══════════════════════════════ 刪除主題 ══════════════════════════════
const showDeleteProjectConfirm = ref(false);
const pendingDeleteProjectObj = ref<ResearchTopic | null>(null);

const triggerDeleteProject = (proj: ResearchTopic) => {
  pendingDeleteProjectObj.value = proj;
  showDeleteProjectConfirm.value = true;
};
const confirmDeleteProject = () => {
  if (pendingDeleteProjectObj.value) {
    deleteProject(pendingDeleteProjectObj.value.id);
    showToast(`課題 "${pendingDeleteProjectObj.value.name}" 及其文獻已順利刪除。`);
    showDeleteProjectConfirm.value = false;
    pendingDeleteProjectObj.value = null;
  }
};

// ══════════════════════════════ 快速搬移 ══════════════════════════════
const quickMove = (paperId: string, newStatus: KanbanStatus) => {
  movePaper(paperId, newStatus);
  showToast(`已移動至: ${statusLabel(newStatus)}`);
};

// ══════════════════════════════ 書籤表單協調 ══════════════════════════════
const showBookmarkModal = ref(false);
const isEditing = ref(false);
const selectedPaper = ref<Paper | null>(null);

const openNewBookmarkModal = () => {
  isEditing.value = false;
  selectedPaper.value = null;
  showBookmarkModal.value = true;
};

const openEditBookmarkModal = (paper: Paper) => {
  isEditing.value = true;
  selectedPaper.value = paper;
  showBookmarkModal.value = true;
};

const handleSaveBookmark = (paperData: Omit<Paper, 'id'>) => {
  if (isEditing.value && selectedPaper.value) {
    updatePaper(selectedPaper.value.id, paperData);
    showToast('書籤資料已更新！');
  } else {
    addPaper(paperData);
    showToast('成功加入書籤！');
  }
  showBookmarkModal.value = false;
};

// ══════════════════════════════ 刪除論文 ══════════════════════════════
const showDeletePaperConfirm = ref(false);

const triggerDeletePaper = () => {
  showBookmarkModal.value = false;
  showDeletePaperConfirm.value = true;
};

const confirmDeletePaper = () => {
  if (isEditing.value && selectedPaper.value) {
    deletePaper(selectedPaper.value.id);
    showToast('文獻書籤已順利刪除。');
    showDeletePaperConfirm.value = false;
    selectedPaper.value = null;
  }
};

// ══════════════════════════════ PDF 檢視 ══════════════════════════════
const pdfReaderState = reactive({ isOpen: false, pdfData: null as string | null, pdfName: null as string | null });
const openPDFReader = (paper: Paper) => {
  pdfReaderState.pdfData = paper.pdfData;
  pdfReaderState.pdfName = paper.pdfName;
  pdfReaderState.isOpen = true;
};

// ══════════════════════════════ 新增主題 ══════════════════════════════
const showProjectModal = ref(false);
const handleCreateProject = (projData: { name: string; description: string; color: string }) => {
  createProject(projData.name, projData.description, projData.color);
  showToast(`研究課題 "${projData.name}" 建立成功！`);
  showProjectModal.value = false;
};
</script>

<style scoped>
.chemflow-container {
  --bg: #f4f1ea;
  --surface: #ffffff;
  --border: #c8b89a;
  --border-light: #e6dfd3;
  --text: #1a3a6e;
  --text-muted: #8a8070;
  --text-light: #a09880;
  --accent: #1a3a6e;
  --accent-dark: #12284c;
  --accent-light: #e6dfd3;
  --green: #10b981;
  --green-light: #ecfdf5;
  --blue: #3b82f6;
  --blue-light: #eff6ff;
  --amber: #c8a84b;
  --red: #ef4444;
  --purple: #8b5cf6;
  --purple-light: #f5f3ff;

  background: var(--bg);
  color: var(--text);
  min-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  font-size: 13px;
  line-height: 1.5;
  font-family: inherit;
  
  /* 統一中央對齊限制，左右留白比照上方「測試頁面」 header 寬度 */
  width: 100% !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
  padding: 0 !important;
  box-sizing: border-box;
}

.topnav {
  background: var(--surface); 
  border: 2px solid var(--border);
  padding: 0 16px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  gap: 12px; 
  height: auto; 
  min-height: 52px; 
  position: sticky; 
  top: 0; 
  z-index: 20;
  flex-wrap: wrap;
  border-radius: 4px 4px 0 0; /* 加強閉合框的精緻感 */
}
@media (min-width: 768px) {
  .topnav {
    padding: 0 24px;
    flex-wrap: nowrap;
    height: 52px;
  }
}

.topnav-left { display: flex; align-items: center; gap: 0; overflow-x: auto; flex-shrink: 1; min-width: 0; }
.proj-tab {
  display: flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 4px; border: none; background: none;
  font-family: inherit; font-size: 12px; font-weight: 700; color: var(--text-muted); cursor: grab; white-space: nowrap; transition: background 0.12s, color 0.12s; position: relative;
}
.proj-tab:hover { background: var(--bg); color: var(--text); }
.proj-tab.active { color: var(--accent); background: var(--accent-light); }
.proj-tab.drag-over { outline: 2px dashed var(--accent); outline-offset: -2px; background: var(--accent-light); }
.proj-tab-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.proj-tab-count { font-size: 10px; font-weight: 700; background: rgba(26,58,110,0.08); color: inherit; padding: 1px 6px; border-radius: 20px; }
.proj-tab.active .proj-tab-count { background: rgba(26,58,110,0.15); }
.proj-tab-del {
  display: none; align-items: center; justify-content: center; width: 15px; height: 15px;
  border-radius: 50%; background: rgba(26,58,110,0.1); color: inherit; font-size: 9px; margin-left: 2px; border: none; cursor: pointer;
}
.proj-tab:hover .proj-tab-del { display: flex; }
.proj-tab-del:hover { background: var(--red) !important; color: #fff !important; }
.tab-divider { width: 1px; height: 20px; background: var(--border); flex-shrink: 0; margin: 0 8px; }
.new-topic-btn {
  display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 4px; border: 1.5px dashed var(--border); background: none;
  font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-muted); cursor: pointer; white-space: nowrap; transition: border-color 0.12s, color 0.12s, background 0.12s; margin-left: 4px;
}
.new-topic-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

.topnav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-left: auto; padding: 4px 0; }
.search-wrap { position: relative; }
.search-icon { position: absolute; left: 9px; top: 50%; transform: translateY(-50%); color: var(--text-light); pointer-events: none; }
.search-input {
  background: var(--bg); border: 1.5px solid var(--border); border-radius: 4px; padding: 7px 12px 7px 30px;
  font-size: 12px; font-family: inherit; color: var(--text); outline: none; width: 160px; transition: border 0.15s, background 0.15s;
}
@media (min-width: 768px) {
  .search-input { width: 200px; }
}
.search-input:focus { border-color: var(--accent); background: var(--surface); }
.btn-bookmark {
  display: flex; align-items: center; gap: 6px; padding: 7px 14px; background: var(--accent); color: #fff;
  border: none; border-radius: 4px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap;
}
.btn-bookmark:hover { background: var(--accent-dark); }

/* 副標題調優：設定側邊邊框，與 topnav 寬度邊緣對齊 */
.subheader {
  padding: 12px 16px 8px; 
  display: flex; 
  align-items: center; 
  justify-content: space-between;
  gap: 12px; 
  flex-wrap: wrap; 
  border-left: 2px solid var(--border);
  border-right: 2px solid var(--border);
  border-bottom: 2px solid var(--border-light); 
  background: var(--surface);
  
  width: 100% !important;
  max-width: 100% !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-sizing: border-box;
}
@media (min-width: 768px) {
  .subheader {
    padding: 12px 24px 8px;
  }
}

.subheader-left { display: flex; align-items: center; gap: 8px; }
.subheader-title { font-size: 15px; font-weight: 700; color: var(--text); }
.subheader-count { font-size: 11px; color: var(--text-muted); background: var(--bg); border: 1.5px solid var(--border); padding: 2px 8px; border-radius: 20px; }
.status-filter-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.status-filter-label { font-size: 10px; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.06em; margin-right: 2px; }
.sf-pill {
  display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; border: 1.5px solid var(--border);
  background: var(--bg); font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.12s; white-space: nowrap;
}
.sf-pill:hover { border-color: #aaa; }
.sf-pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sf-pill.active-to_read { background: #e6dfd3; color: #1a3a6e; border-color: #c8b89a; }
.sf-pill.active-reading { background: var(--blue-light); color: var(--blue); border-color: var(--blue); }
.sf-pill.active-experimented { background: var(--green-light); color: var(--green); border-color: var(--green); }
.sf-pill.active-archive { background: var(--purple-light); color: var(--purple); border-color: var(--purple); }
.sf-clear {
  font-size: 10px; font-weight: 700; color: var(--text-light); background: none; border: none;
  cursor: pointer; padding: 3px 6px; border-radius: 4px; transition: color 0.12s, background 0.12s;
}
.sf-clear:hover { color: var(--text); background: var(--bg); }

/* 工作區調優：將左右邊距完全歸零，使直欄與上方的 header 白條完美切齊 */
.workspace { 
  flex: 1; 
  padding: 14px 0 20px 0; /* 左右 padding 完全設為 0 */
  overflow-y: auto; 
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

.kanban-board { 
  display: flex; 
  gap: 12px; 
  align-items: flex-start; 
  min-height: 100%; 
  overflow-x: auto; 
  padding-bottom: 16px; 
}
@media (min-width: 768px) {
  .kanban-board {
    gap: 14px;
  }
}

.kanban-col {
  width: 280px; min-width: 280px; background: var(--surface); border: 1.5px solid var(--border);
  border-radius: 8px; display: flex; flex-direction: column; max-height: calc(100vh - 220px);
}
.col-header {
  padding: 11px 14px; border-bottom: 1.5px solid var(--border-light); display: flex; align-items: center;
  justify-content: space-between; border-top: 3px solid transparent; border-radius: 6px 6px 0 0;
}
.col-header.col-toread { border-top-color: #9ca3af; }
.col-header.col-reading { border-top-color: var(--blue); }
.col-header.col-experimented { border-top-color: var(--green); }
.col-header.col-archive { border-top-color: var(--purple); }
.col-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; }
.col-title-dot { width: 6px; height: 6px; border-radius: 50%; }
.col-count { font-size: 10px; font-weight: 700; background: rgba(26,58,110,0.06); padding: 1px 7px; border-radius: 12px; color: var(--text-muted); }
.col-body { padding: 10px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 80px; }
.col-empty { border: 1.5px dashed var(--border); border-radius: 6px; height: 64px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-light); }

.modal-overlay { position: fixed; inset: 0; background: rgba(26, 58, 110, 0.45); backdrop-filter: blur(2px); z-index: 1000; }
.confirm-dialog { background: var(--surface); border: 1.5px solid var(--border); border-radius: 8px; width: 100%; max-width: 340px; padding: 20px; box-shadow: 0 10px 30px rgba(26, 58, 110, 0.15); margin: auto; }
.confirm-dialog h3 { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #1a3a6e; }
.confirm-dialog p { font-size: 11px; color: var(--text-muted); margin-bottom: 12px; }
.confirm-dialog p.warning-text { color: var(--red); margin-top: 6px; margin-bottom: 16px; font-weight: 700; }
.confirm-btns { display: flex; justify-content: flex-end; gap: 8px; }
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 14px; border-radius: 4px; font-size: 12px; font-weight: 700; font-family: inherit; border: none; cursor: pointer; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-dark); }
.btn-ghost { background: var(--bg); border: 1.5px solid var(--border); color: var(--text-muted); }
.btn-ghost:hover { background: var(--border-light); color: var(--text); }
.btn-danger-bg { background: var(--red); color: white; }
.btn-danger-bg:hover { background: #dc2626; }
.toast {
  position: fixed; bottom: 24px; right: 24px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 8px;
  padding: 10px 14px; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; box-shadow: 0 4px 20px rgba(26,58,110,0.1); z-index: 2000; max-width: 280px; animation: toastIn 0.2s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.toast-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--amber); animation: pulse 1.5s infinite; flex-shrink: 0; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
</style>