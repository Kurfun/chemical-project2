<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3>{{ isEditing ? '編輯文獻資料' : '新增文獻書籤' }}</h3>
          <p>請填寫下方欄位。您可以選擇性上傳 PDF 檔案方便查閱。</p>
        </div>
        <button class="close-btn" @click="emit('close')">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- 標題 -->
        <div>
          <label class="field-label">論文標題 *</label>
          <textarea 
            v-model="form.title" 
            class="form-textarea" 
            rows="2" 
            placeholder="請在此貼上論文標題..."
            ref="titleInput"
          ></textarea>
        </div>

        <!-- 期刊 & 影響因子 -->
        <div class="form-grid">
          <div>
            <label class="field-label">發表期刊</label>
            <input v-model="form.journal" class="form-input" type="text" placeholder="例如：JACS, Nature Chem" />
          </div>
          <div>
            <label class="field-label">影響因子 (Impact Factor)</label>
            <input v-model="form.impactFactor" class="form-input" type="number" step="0.1" min="0" placeholder="例如：15.4" />
          </div>
        </div>

        <!-- 連結 -->
        <div>
          <label class="field-label">URL / DOI 連結</label>
          <input v-model="form.url" class="form-input" type="url" placeholder="https://ieeexplore.ieee.org/document/..." />
        </div>

        <!-- 研究主題 (Topic) -->
        <div>
          <label class="field-label">研究主題歸類</label>
          <select v-model="form.projectId" class="form-select">
            <option 
              v-for="proj in projects" 
              :key="proj.id" 
              :value="proj.id"
            >
              {{ proj.name }}
            </option>
          </select>
        </div>

        <!-- 閱讀進度狀態 -->
        <div>
          <label class="field-label">閱讀進度狀態</label>
          <div class="progress-dots">
            <button 
              v-for="col in columns" 
              :key="col.id"
              class="progress-dot-btn"
              :class="{ [`active-${form.status}`]: form.status === col.id }"
              @click="form.status = col.id"
            >
              {{ col.label }}
            </button>
          </div>
        </div>

        <!-- 星星評等 -->
        <div class="priority-row">
          <span class="priority-label">個人重要度評分</span>
          <div class="star-btns">
            <button 
              v-for="star in 5" 
              :key="star" 
              class="star-btn"
              :class="star <= form.rating ? 'on' : 'off'"
              @click="form.rating = star"
            >
              ★
            </button>
          </div>
        </div>

        <!-- 備忘錄 -->
        <div>
          <label class="field-label">實驗筆記 / 待辦備忘</label>
          <textarea 
            v-model="form.notes" 
            class="form-textarea" 
            rows="2" 
            placeholder="可填寫關鍵合成步驟、重要試劑純度要求或核心靈感..."
          ></textarea>
        </div>

        <!-- PDF 上傳區 -->
        <div>
          <label class="field-label">上傳論文 PDF (選填)</label>
          <div v-if="!form.pdfName" class="pdf-upload-area">
            <div 
              class="pdf-upload-zone" 
              :class="{ dragging: isPdfDragging }"
              @dragover.prevent="isPdfDragging = true"
              @dragleave="isPdfDragging = false"
              @drop.prevent="handlePdfDrop"
            >
              <input 
                type="file" 
                accept=".pdf" 
                class="file-hidden-input" 
                @change="handlePdfSelect" 
              />
              <div class="pdf-icon">📄</div>
              <div class="pdf-upload-title">拖曳 PDF 至此處，或點擊瀏覽檔案</div>
              <div class="pdf-upload-sub">附帶論文檔案，方便日後隨時在瀏覽器中閱讀</div>
            </div>
          </div>

          <!-- PDF 預覽與移除 -->
          <div v-else class="pdf-file-preview">
            <svg width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <span class="pdf-file-name">{{ form.pdfName }}</span>
            <span class="pdf-file-size">{{ pdfSizeLabel }}</span>
            <button class="pdf-remove-btn" @click="removePDF">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          v-if="isEditing" 
          class="btn btn-danger" 
          @click="emit('delete')"
        >
          刪除書籤
        </button>
        
        <div class="footer-right-btns">
          <button class="btn btn-ghost" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="handleSave">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ isEditing ? '儲存變更' : '加入書籤' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, nextTick } from 'vue';
import type { Paper, KanbanStatus, ResearchTopic } from './type5';

const props = defineProps<{
  isOpen: boolean;
  isEditing: boolean;
  paper: Paper | null;
  projects: ResearchTopic[];
  activeProject: string;
}>();

const emit = defineEmits(['close', 'save', 'delete']);

const titleInput = ref<HTMLTextAreaElement | null>(null);
const isPdfDragging = ref(false);

const columns = [
  { id: 'to_read', label: '待閱讀' },
  { id: 'reading', label: '閱讀中' },
  { id: 'experimented', label: '已驗證' },
  { id: 'archive', label: '已封存' }
] as const;

const form = reactive({
  title: '',
  journal: '',
  impactFactor: null as number | null,
  url: '',
  projectId: '',
  status: 'to_read' as KanbanStatus,
  rating: 3,
  notes: '',
  pdfData: null as string | null,
  pdfName: null as string | null
});

const pdfSizeLabel = computed(() => {
  if (form.pdfData) {
    const bytes = Math.round(form.pdfData.length * 0.75);
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  }
  return '';
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.isEditing && props.paper) {
      form.title = props.paper.title;
      form.journal = props.paper.journal;
      form.impactFactor = props.paper.impactFactor;
      form.url = props.paper.url;
      form.projectId = props.paper.projectId;
      form.status = props.paper.status;
      form.rating = props.paper.rating;
      form.notes = props.paper.notes;
      form.pdfData = props.paper.pdfData;
      form.pdfName = props.paper.pdfName;
    } else {
      const defaultProj = props.activeProject !== 'all' ? props.activeProject : (props.projects[0]?.id || '');
      form.title = '';
      form.journal = '';
      form.impactFactor = null;
      form.url = '';
      form.projectId = defaultProj;
      form.status = 'to_read';
      form.rating = 3;
      form.notes = '';
      form.pdfData = null;
      form.pdfName = null;
    }
    nextTick(() => {
      titleInput.value?.focus();
    });
  }
});

const handleSave = () => {
  if (!form.title.trim()) {
    titleInput.value?.focus();
    return;
  }
  emit('save', { ...form });
};

const handlePdfFile = (file: File) => {
  if (file.type !== 'application/pdf') return;
  const reader = new FileReader();
  reader.onload = (e) => {
    form.pdfData = e.target?.result as string;
    form.pdfName = file.name;
  };
  reader.readAsDataURL(file);
};

const handlePdfSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) handlePdfFile(files[0]);
};

const handlePdfDrop = (e: DragEvent) => {
  isPdfDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files[0]) handlePdfFile(files[0]);
};

const removePDF = () => {
  form.pdfData = null;
  form.pdfName = null;
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(26, 58, 110, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 16px; overflow-y: auto;
}
.modal {
  background: #ffffff; border: 1.5px solid #1a3a6e; border-radius: 8px;
  width: 100%; max-width: 520px; box-shadow: 0 10px 30px rgba(26, 58, 110, 0.15);
  display: flex; flex-direction: column; max-height: 92vh;
}
.modal-header {
  padding: 15px 18px; border-bottom: 1px solid #e6dfd3;
  display: flex; align-items: center; justify-content: space-between;
  background: #f4f1ea; border-radius: 6px 6px 0 0;
}
.modal-header h3 { font-size: 13px; font-weight: 700; color: #1a3a6e; }
.modal-header p { font-size: 10px; color: #8a8070; margin-top: 2px; }
.close-btn { background: none; border: none; cursor: pointer; color: #1a3a6e; display: flex; align-items: center; border-radius: 6px; padding: 3px; }
.close-btn:hover { background: #e6dfd3; }
.modal-body { padding: 16px 18px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 13px; }
.modal-footer { padding: 12px 18px; border-top: 1px solid #e6dfd3; display: flex; align-items: center; justify-content: space-between; }
.footer-right-btns { display: flex; gap: 8px; margin-left: auto; }
label.field-label { display: block; font-size: 10px; font-weight: 700; color: #1a3a6e; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.form-input, .form-textarea, .form-select {
  width: 100%; background: #ffffff; border: 1.5px solid #c8b89a; border-radius: 4px;
  padding: 8px 10px; font-size: 12px; font-family: inherit; color: #1a3a6e; outline: none;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: #1a3a6e; box-shadow: 0 0 0 2px rgba(26, 58, 110, 0.08); }
.form-textarea { resize: none; }
.form-select { cursor: pointer; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.progress-dots { display: flex; gap: 5px; flex-wrap: wrap; }
.progress-dot-btn {
  padding: 5px 10px; border-radius: 4px; border: 1.5px solid #c8b89a;
  font-size: 10px; font-weight: 700; cursor: pointer; background: #f4f1ea; color: #1a3a6e;
}
.progress-dot-btn.active-to_read { background: #e6dfd3; color: #1a3a6e; border-color: #c8b89a; }
.progress-dot-btn.active-reading { background: #eff6ff; color: #3b82f6; border-color: #93c5fd; }
.progress-dot-btn.active-experimented { background: #ecfdf5; color: #10b981; border-color: #6ee7b7; }
.progress-dot-btn.active-archive { background: #f5f3ff; color: #8b5cf6; border-color: #c4b5fd; }
.priority-row { display: flex; align-items: center; justify-content: space-between; background: #f4f1ea; border: 1.5px solid #c8b89a; border-radius: 4px; padding: 8px 12px; }
.priority-label { font-size: 10px; font-weight: 700; color: #1a3a6e; text-transform: uppercase; letter-spacing: 0.06em; }
.star-btns { display: flex; gap: 4px; }
.star-btn { background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1; padding: 0; }
.star-btn:hover { transform: scale(1.25); }
.star-btn.on { color: #c8a84b; }
.star-btn.off { color: #e6dfd3; }
.pdf-upload-area { position: relative; }
.pdf-upload-zone {
  border: 2px dashed #c8b89a; border-radius: 4px; padding: 20px 14px;
  text-align: center; cursor: pointer; background: #f4f1ea; position: relative;
}
.pdf-upload-zone:hover, .pdf-upload-zone.dragging { border-color: #1a3a6e; background: #eef2ff; }
.file-hidden-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.pdf-icon { font-size: 26px; margin-bottom: 6px; }
.pdf-upload-title { font-size: 12px; font-weight: 700; color: #1a3a6e; margin-bottom: 3px; }
.pdf-upload-sub { font-size: 10px; color: #8a8070; }
.pdf-file-preview { display: flex; align-items: center; gap: 8px; background: #fff5f5; border: 1px solid #fecaca; border-radius: 4px; padding: 10px 12px; }
.pdf-file-name { font-size: 11px; font-weight: 500; color: #1a3a6e; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pdf-file-size { font-size: 10px; color: #8a8070; white-space: nowrap; }
.pdf-remove-btn { background: none; border: none; cursor: pointer; color: #ef4444; padding: 2px; border-radius: 4px; display: flex; }
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 14px; border-radius: 4px; font-size: 12px; font-weight: 700; font-family: inherit; border: none; cursor: pointer; }
.btn:active { transform: scale(0.98); }
.btn-primary { background: #1a3a6e; color: #fff; }
.btn-primary:hover { background: #12284c; }
.btn-ghost { background: #f4f1ea; border: 1.5px solid #c8b89a; color: #1a3a6e; }
.btn-ghost:hover { background: #e6dfd3; }
.btn-danger { background: none; color: #ef4444; }
.btn-danger:hover { background: #fff5f5; }
</style>