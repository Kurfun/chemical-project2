<template>
  <div 
    v-if="isOpen" 
    class="modal-overlay" 
    @click.self="close"
  >
    <div class="pdf-viewer-modal">
      <div class="pdf-viewer-header">
        <h4 class="pdf-title-text">{{ filename || 'PDF 閱讀器' }}</h4>
        
        <div class="pdf-viewer-controls">
          <!-- 頁數快速跳轉與滾動指示器 -->
          <div class="pdf-page-ctrl">
            <button 
              class="pdf-page-btn" 
              :disabled="currentPage <= 1" 
              @click="scrollToPage(currentPage - 1)"
            >
              ‹
            </button>
            <span class="pdf-page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button 
              class="pdf-page-btn" 
              :disabled="currentPage >= totalPages" 
              @click="scrollToPage(currentPage + 1)"
            >
              ›
            </button>
          </div>

          <!-- 縮放比例按鈕 -->
          <button class="pdf-zoom-btn" @click="zoom(-0.2)">−</button>
          <span class="zoom-indicator">{{ Math.round(scale * 100) }}%</span>
          <button class="pdf-zoom-btn" @click="zoom(0.2)">+</button>

          <!-- 關閉按鈕 -->
          <button class="close-btn" @click="close">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- PDF Canvas 繪製主體 -->
      <div 
        ref="viewerBody" 
        class="pdf-viewer-body" 
        @scroll="handleViewerScroll"
      >
        <div v-if="loading" class="pdf-loading">
          <div class="pdf-spinner"></div>
          <span>正在讀取文獻 PDF...</span>
        </div>

        <div v-else class="pdf-canvas-container">
          <div 
            v-for="pageNo in totalPages" 
            :key="pageNo" 
            :id="`pdf-page-wrapper-${pageNo}`"
            class="pdf-canvas-wrap"
          >
            <canvas :ref="el => setCanvasRef(el, pageNo)"></canvas>
            <div class="page-number-hint">第 {{ pageNo }} 頁</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  base64Data: string | null;
  filename: string | null;
}>();

const emit = defineEmits(['close']);

const loading = ref(false);
const scale = ref(1.3);
const currentPage = ref(1);
const totalPages = ref(0);
const canvasRefs = ref<Record<number, HTMLCanvasElement>>({});
const viewerBody = ref<HTMLElement | null>(null);

let pdfjsLib: any = null;
let pdfDoc: any = null;

const setCanvasRef = (el: any, pageNo: number) => {
  if (el) {
    canvasRefs.value[pageNo] = el as HTMLCanvasElement;
  }
};

// 動態載入 PDF.js 庫，解決 iframe 與沙盒環境下的相容性
const loadLibrary = async (): Promise<boolean> => {
  if ((window as any).pdfjsLib) {
    pdfjsLib = (window as any).pdfjsLib;
    return true;
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

const loadPdfDocument = async () => {
  if (!props.base64Data) return;
  loading.value = true;
  totalPages.value = 0;
  currentPage.value = 1;
  canvasRefs.value = {};

  const loaded = await loadLibrary();
  if (!loaded || !pdfjsLib) {
    loading.value = false;
    alert('無法載入 PDF.js 解析庫，請確認您的網路連線。');
    return;
  }

  try {
    const base64Raw = props.base64Data.split(',')[1] || props.base64Data;
    const binary = atob(base64Raw);
    const len = binary.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      arr[i] = binary.charCodeAt(i);
    }

    pdfDoc = await pdfjsLib.getDocument({ data: arr }).promise;
    totalPages.value = pdfDoc.numPages;
    loading.value = false;

    await nextTick();
    renderAllPages();
  } catch (err: any) {
    console.error('PDF 解析失敗: ', err);
    loading.value = false;
  }
};

const renderPage = async (pageNo: number) => {
  if (!pdfDoc) return;
  try {
    const page = await pdfDoc.getPage(pageNo);
    const canvas = canvasRefs.value[pageNo];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const viewport = page.getViewport({ scale: scale.value });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    await page.render(renderContext).promise;
  } catch (e) {
    console.warn(`第 ${pageNo} 頁渲染被取消或發生異常。`);
  }
};

const renderAllPages = async () => {
  for (let i = 1; i <= totalPages.value; i++) {
    await renderPage(i);
  }
};

const zoom = (delta: number) => {
  scale.value = Math.max(0.6, Math.min(2.5, scale.value + delta));
  if (pdfDoc) {
    renderAllPages();
  }
};

const scrollToPage = (pageNo: number) => {
  if (pageNo < 1 || pageNo > totalPages.value) return;
  const target = document.getElementById(`pdf-page-wrapper-${pageNo}`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
    currentPage.value = pageNo;
  }
};

const handleViewerScroll = () => {
  if (!viewerBody.value || totalPages.value === 0) return;
  const scrollTop = viewerBody.value.scrollTop;

  // 動態估算目前使用者在哪一頁
  let detectedPage = 1;
  let minDiff = Infinity;

  for (let i = 1; i <= totalPages.value; i++) {
    const el = document.getElementById(`pdf-page-wrapper-${i}`);
    if (el) {
      const offsetTop = el.offsetTop;
      const diff = Math.abs(offsetTop - scrollTop - 40);
      if (diff < minDiff) {
        minDiff = diff;
        detectedPage = i;
      }
    }
  }
  currentPage.value = detectedPage;
};

const close = () => {
  pdfDoc = null;
  emit('close');
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      loadPdfDocument();
    });
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 12, 0.45);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
}

.pdf-viewer-modal {
  background: #ffffff;
  border: 1px solid #e4e4e0;
  border-radius: 16px;
  width: 96vw;
  max-width: 1000px;
  height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  overflow: hidden;
  margin: auto;
}

.pdf-viewer-header {
  padding: 12px 18px;
  border-bottom: 1px solid #f0f0ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f6f6f4;
  flex-shrink: 0;
  gap: 12px;
}

.pdf-title-text {
  font-size: 13px;
  font-weight: 600;
  color: #1c1c1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.pdf-viewer-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.pdf-page-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f6f6f4;
  border: 1px solid #e4e4e0;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: #888884;
}

.pdf-page-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  color: #888884;
  font-size: 15px;
  line-height: 1;
  border-radius: 4px;
  transition: background 0.1s, color 0.1s;
}

.pdf-page-btn:hover:not(:disabled) {
  background: #e4e4e0;
  color: #1c1c1a;
}

.pdf-page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.pdf-zoom-btn {
  background: #ffffff;
  border: 1px solid #e4e4e0;
  border-radius: 7px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #888884;
  transition: background 0.1s;
}

.pdf-zoom-btn:hover {
  background: #f6f6f4;
  color: #1c1c1a;
}

.zoom-indicator {
  font-size: 11px;
  font-weight: 600;
  color: #888884;
  min-width: 36px;
  text-align: center;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #888884;
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 4px;
  transition: color 0.12s, background 0.12s;
}

.close-btn:hover {
  color: #1c1c1a;
  background: #f0f0ed;
}

.pdf-viewer-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  background: #525659;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 16px;
  scroll-behavior: smooth;
}

.pdf-canvas-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.pdf-canvas-wrap {
  background: white;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 4px;
}

.pdf-canvas-wrap canvas {
  display: block;
  max-width: 100%;
}

.page-number-hint {
  font-size: 10px;
  color: #888884;
  padding: 4px 0 2px 0;
  text-align: center;
}

.pdf-loading {
  color: #ccc;
  font-size: 13px;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pdf-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>