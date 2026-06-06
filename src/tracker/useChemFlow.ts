import { ref, computed, watch } from 'vue';
import type { ChemFlowState, Paper, ResearchTopic, KanbanStatus } from './type5';

// 使用 Vite 最標準且強韌的本地靜態資源路徑解析（不需透過 import 避免 TS 報錯）
const defaultPdfUrl = new URL('./保養品DIY_test.pdf', import.meta.url).href;

// 依照您的要求，維持原樣使用 chemflow_v1 不做更動
const LS_KEY = 'chemflow_v1';

const DEFAULT_STATE: ChemFlowState = {
  projects: [
    { id: 'p1', name: '全合成 (Total Synthesis)', description: '天然物與活性藥物成分的全合成研究。', color: '#8B5CF6' },
    { id: 'p2', name: '不對稱催化 (Asymmetric Catalysis)', description: '對映選擇性合成方法、金屬催化劑與有機催化劑。', color: '#10B981' },
    { id: 'p3', name: '有機金屬化學 (Organometallics)', description: '反應機制探討與偶聯反應研究。', color: '#3B82F6' }
  ],
  papers: [
    { 
      id: 'paper-1', 
      projectId: 'p1', 
      title: 'Making moisturizing lotion', 
      journal: 'IEEE not included', 
      impactFactor: 5, 
      url: 'https://www.youtube.com/watch?v=ZuPAfZr2v1o', 
      status: 'experimented', 
      rating: 5, 
      notes: 'Experimental equipment cannot be mixed.', 
      pdfData: null, 
      pdfName: null 
    },
    { 
      id: 'paper-2', 
      projectId: 'p1', 
      title: 'Enantioselective Total Synthesis of Strychnine via Tandem Catalysis', 
      journal: 'Nature Chemistry', 
      impactFactor: 21.6, 
      url: ' ', 
      status: 'reading', 
      rating: 4, 
      notes: '優雅的串聯有機催化反應，省去了中間步驟的純化手續。', 
      pdfData: null, 
      pdfName: null 
    },
    { 
      id: 'paper-3', 
      projectId: 'p2', 
      title: 'Palladium-Catalyzed Asymmetric Suzuki-Miyaura Coupling of Heteroaryl Boronic Acids', 
      journal: 'Angew. Chem. Int. Ed.', 
      impactFactor: 16.6, 
      url: ' ', 
      status: 'experimented', 
      rating: 5, 
      notes: 'BrettPhos 配體對於具有空間位阻的底物表現極佳。', 
      pdfData: null, 
      pdfName: null 
    }
  ],
  activeProject: 'all'
};

export function useChemFlow() {
  // 讀取初始化資料
  const state = ref<ChemFlowState>((() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return { ...DEFAULT_STATE, activeProject: 'all' };
      const saved = JSON.parse(raw);
      return {
        projects: saved.projects || DEFAULT_STATE.projects,
        papers: saved.papers || DEFAULT_STATE.papers,
        activeProject: 'all'
      };
    } catch (e) {
      return { ...DEFAULT_STATE, activeProject: 'all' };
    }
  })());

  // 搜尋與篩選狀態
  const searchQuery = ref('');
  const activeStatusFilters = ref<Set<KanbanStatus>>(new Set());

  // 自動預載專案目錄下的 保養品DIY_test.pdf 檔案，並轉換為 Base64 格式掛載至 paper-1
  const preloadDefaultPdf = async () => {
    try {
      // 尋找 paper-1
      const targetPaper = state.value.papers.find(p => p.id === 'paper-1');
      
      // 如果 paper-1 存在，且目前還沒有載入過 PDF 實體資料 (避免覆蓋使用者手動上傳的檔案)
      if (targetPaper && !targetPaper.pdfData) {
        // 直接非同步 fetch 由 Vite 幫我們精確解析出的本地資源連結
        const response = await fetch(defaultPdfUrl);
        
        if (!response.ok) {
          throw new Error(`無法讀取本地 PDF 檔案 (HTTP 狀態碼: ${response.status})`);
        }
        
        const blob = await response.blob();
        
        // 使用 FileReader 將 Blob 檔案內容轉化為 Base64 字串
        const reader = new FileReader();
        reader.onloadend = () => {
          targetPaper.pdfData = reader.result as string;
          targetPaper.pdfName = '保養品DIY_test.pdf';
          
          // 重新整理陣列引用，觸發 Vue 雙向響應系統進行自動 LocalStorage 快取與 UI 更新
          state.value.papers = [...state.value.papers];
          console.log('ChemFlow: 成功自動掛載同層的 保養品DIY_test.pdf 檔案！');
        };
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.warn('ChemFlow: 無法載入預設 PDF 檔案。請確認 保養品DIY_test.pdf 確實與 useChemFlow.ts 置於同個資料夾。', err);
    }
  };

  // 執行非同步預載
  preloadDefaultPdf();

  // 監聽變化並自動儲存（包含大檔案 LocalStorage 空間爆滿降級防護）
  watch(state, (newState) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        projects: newState.projects,
        papers: newState.papers
      }));
    } catch (e) {
      console.warn('ChemFlow: LocalStorage 空間不足，嘗試移除 PDF 檔案進行輕量化備份。');
      try {
        const litePapers = newState.papers.map(p => ({ ...p, pdfData: null }));
        localStorage.setItem(LS_KEY, JSON.stringify({
          projects: newState.projects,
          papers: litePapers
        }));
      } catch (err) {
        console.error('ChemFlow: 無法寫入 LocalStorage。', err);
      }
    }
  }, { deep: true });

  // 篩選與搜尋計算屬性
  const filteredPapers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim();
    return state.value.papers.filter(p => {
      // 課題過濾
      if (state.value.activeProject !== 'all' && p.projectId !== state.value.activeProject) return false;
      // 狀態膠囊多選過濾
      if (activeStatusFilters.value.size > 0 && !activeStatusFilters.value.has(p.status)) return false;
      // 模糊文字搜尋
      if (q) {
        const hay = [p.title, p.journal, p.notes, p.url].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  // 課題相關動作
  const createProject = (name: string, description: string, color: string) => {
    const proj: ResearchTopic = {
      id: `p-${Date.now()}`,
      name,
      description,
      color
    };
    state.value.projects.push(proj);
    state.value.activeProject = proj.id;
  };

  const deleteProject = (projId: string) => {
    state.value.papers = state.value.papers.filter(p => p.projectId !== projId);
    state.value.projects = state.value.projects.filter(p => p.id !== projId);
    if (state.value.activeProject === projId) {
      state.value.activeProject = 'all';
    }
  };

  const reorderProjects = (srcIdx: number, tgtIdx: number) => {
    const [moved] = state.value.projects.splice(srcIdx, 1);
    state.value.projects.splice(tgtIdx, 0, moved);
  };

  // 論文相關動作
  const addPaper = (paper: Omit<Paper, 'id'>) => {
    state.value.papers.unshift({
      ...paper,
      id: `paper-${Date.now()}`
    });
  };

  const updatePaper = (id: string, updatedData: Partial<Paper>) => {
    state.value.papers = state.value.papers.map(p => {
      if (p.id === id) {
        return { ...p, ...updatedData };
      }
      return p;
    });
  };

  const deletePaper = (id: string) => {
    state.value.papers = state.value.papers.filter(p => p.id !== id);
  };

  const movePaper = (paperId: string, newStatus: KanbanStatus) => {
    state.value.papers = state.value.papers.map(p => 
      p.id === paperId ? { ...p, status: newStatus } : p
    );
  };

  // 狀態多選膠囊動作
  const toggleStatusFilter = (status: KanbanStatus) => {
    if (activeStatusFilters.value.has(status)) {
      activeStatusFilters.value.delete(status);
    } else {
      activeStatusFilters.value.add(status);
    }
    // 觸發 Vue 響應式重新整理
    activeStatusFilters.value = new Set(activeStatusFilters.value);
  };

  const clearStatusFilter = () => {
    activeStatusFilters.value.clear();
    activeStatusFilters.value = new Set();
  };

  return {
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
  };
}