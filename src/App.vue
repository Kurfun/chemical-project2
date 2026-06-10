<template>
  <div class="app-wrapper">
    
    <!-- ── 全域右上角古典側拉按鈕 (☰) ── -->
    <button 
      class="global-menu-trigger" 
      @click="toggleDrawer"
      aria-label="開啟導覽選單"
    >
      <span class="menu-icon-bars">☰</span>
    </button>

    <!-- ── 側拉導覽抽屜 (Side Drawer) ── -->
    <div class="drawer-overlay" :class="{ open: isDrawerOpen }" @click.self="closeDrawer">
      <div class="drawer-panel" :class="{ open: isDrawerOpen }">
        <button class="drawer-close-btn" @click="closeDrawer">✕</button>
        
        <!-- 抽屜頂部古典標頭 -->
        <div class="drawer-header">
          <div class="drawer-deco-line"></div>
          <h3 class="drawer-title">目錄</h3>
          <p class="drawer-subtitle">Chemistry Directory</p>
        </div>

        <!-- 導覽連結清單 (這裡依舊渲染完整的選單，包含 OrganicMatch) -->
        <nav class="drawer-nav-list">
          <!-- 返回首頁 -->
          <button 
            class="nav-link-btn" 
            :class="{ active: currentPage === 'home' }"
            @click="handleDrawerNavigate('home')"
          >
            <span class="nav-icon">🏠</span>
            <div class="nav-text-group">
              <span class="nav-zh">首頁</span>
              <span class="nav-en">Home Directory</span>
            </div>
          </button>

          <div class="nav-divider"></div>

          <!-- 各學科複習卡片連結 (動態讀取 MENU_ITEMS) -->
          <button 
            v-for="item in MENU_ITEMS" 
            :key="item.id"
            class="nav-link-btn"
            :class="{ active: currentPage === item.id }"
            @click="handleDrawerNavigate(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <div class="nav-text-group">
              <span class="nav-zh">{{ getCategoryZHName(item.id) }}</span>
              <span class="nav-en">{{ item.line1 }} {{ item.line2 }}</span>
            </div>
          </button>

          <div class="nav-divider"></div>

          <!-- 成果分析 -->
          <button 
            class="nav-link-btn results-link" 
            :class="{ active: currentPage === 'results' }"
            @click="handleDrawerNavigate('results')"
          >
            <span class="nav-icon">📊</span>
            <div class="nav-text-group">
              <span class="nav-zh">成果分析</span>
              <span class="nav-en">Analyze Dashboard</span>
            </div>
          </button>
        </nav>

        <!-- 抽屜底部版權小裝飾 -->
        <div class="drawer-footer">
          <div class="footer-divider"></div>
          <span>隨時切換章節進行複習</span>
        </div>
      </div>
    </div>

    <!-- ── 主畫面分流 ── -->

    <!-- 首頁 -->
    <HomeView
      v-if="currentPage === 'home'"
      @navigate="navigate"
    />

    <!-- 有機化學：配對遊戲 -->
    <SubPage
      v-else-if="currentPage === 'organic'"
      title="分子幾何與VSEPR"
      @navigate="navigate"
    >
      <molecular_model />
    </SubPage>

    <!-- 無機化學：點群互動檢視器 -->
    <SubPage
      v-else-if="currentPage === 'inorganic'"
      title="分子對稱性"
      @navigate="navigate"
    >
      <ChemingoViewer />
    </SubPage>

    <!-- 分析化學：互動式元素週期表 -->
    <SubPage
      v-else-if="currentPage === 'analytical'"
      title="週期表"
      @navigate="navigate"
    >
      <Periodic_Table />
    </SubPage>

    <!-- 藥用化學：單字卡 -->
    <SubPage
      v-else-if="currentPage === 'pharma'"
      title="單字卡"
      @navigate="navigate"
    >
      <PharmaFlashCard />
    </SubPage>

    <!-- 有機配對：測試頁面 (💡 路由識別碼已從 'test1' 修正為 'OrganicMatch') -->
    <SubPage
      v-else-if="currentPage === 'tracker'"
      title="文獻追蹤"
      @navigate="navigate"
    >
      <tracker />
    </SubPage>

    <!-- 成果分析 -->
    <SubPage
      v-else-if="currentPage === 'results'"
      title="成果分析"
      @navigate="navigate"
    >
      <ResultsPage />
    </SubPage>

    <!-- 換頁過場 -->
    <div class="transition-overlay" :class="{ active: transitioning }"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, provide } from 'vue'
import HomeView        from './HomeView.vue'
import SubPage         from './Other/SubPage.vue'
import molecular_model  from './GeneraCard/molecular_model.vue'
import PharmaFlashCard from './PharmaCard/PharmaFlashCard.vue'
import ResultsPage     from './ResultAnalyze/ResultsPage.vue'
import ChemingoViewer  from './InorganicCard3D/ChemingoViewer.vue'
import Periodic_Table  from './PeriodicTableCard/Periodic_Table.vue'
import OrganicMatch    from './Other/OrganicMatch.vue'
import tracker         from './tracker/ChemFlowDashboard.vue'
import { PAGE_TITLES, MENU_ITEMS } from './types'
import { VISITS_KEY, createVisits, type Visits } from './ResultAnalyze/useVisits'

// 可計數的頁面 key
const COUNTABLE = new Set<string>(['organic', 'inorganic', 'analytical', 'pharma'])

export default defineComponent({
  name: 'App',
  components: { 
    HomeView, 
    SubPage, 
    molecular_model, 
    PharmaFlashCard, 
    ResultsPage, 
    ChemingoViewer, 
    Periodic_Table,
    OrganicMatch,
    tracker 
  },
  setup() {
    const currentPage   = ref<string>('home')
    const transitioning = ref<boolean>(false)
    const isDrawerOpen  = ref<boolean>(false)

    // ── 全域點擊計數，provide 給子孫元件
    const visits = createVisits()
    provide(VISITS_KEY, visits)

    const currentPageTitle = computed(
      () => PAGE_TITLES[currentPage.value] ?? ''
    )

    // 中文對照，提供側拉選單顯示中文大標題
    const getCategoryZHName = (id: string) => {
      const names: Record<string, string> = {
        organic: '分子結構實作',
        inorganic: '3D分子結構',
        analytical: '週期表',
        pharma: '單字卡',
        tracker: '文獻追蹤' 
      }
      return names[id] || '化學章節'
    }

    function toggleDrawer() {
      isDrawerOpen.value = !isDrawerOpen.value
    }

    function closeDrawer() {
      isDrawerOpen.value = false
    }

    function navigate(page: string) {
      // 進入四大核心主題方塊時才 +1
      if (COUNTABLE.has(page)) {
        visits.value[page as keyof Visits]++
      }

      transitioning.value = true
      setTimeout(() => {
        currentPage.value   = page
        transitioning.value = false
      }, 250)
    }

    // 處理抽屜選單跳轉：先關閉抽屜，隨後執行轉場跳轉
    function handleDrawerNavigate(page: string) {
      closeDrawer()
      // 若點選的已經是當前頁面，則不重複執行過場
      if (page === currentPage.value) return;
      
      setTimeout(() => {
        navigate(page)
      }, 150)
    }

    return { 
      currentPage, 
      currentPageTitle, 
      transitioning, 
      isDrawerOpen,
      MENU_ITEMS,
      getCategoryZHName,
      toggleDrawer,
      closeDrawer,
      navigate,
      handleDrawerNavigate
    }
  }
})
</script>

<style>
/* ── 全域 ────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #f4f1ea;
  font-family: 'Noto Serif TC', 'Georgia', serif;
}

.app-wrapper {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  background: #f4f1ea;
  overflow: hidden;
}

/* ── 全域右上角側拉按鈕 (☰) ── */
.global-menu-trigger {
  position: absolute;
  top: 52px;
  right: 24px;
  width: 38px;
  height: 38px;
  background: #ffffff;
  border: 1.5px solid #1a3a6e;
  border-radius: 4px;
  color: #1a3a6e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1500;
  box-shadow: 0 2px 5px rgba(26,58,110,0.08);
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.global-menu-trigger:hover,
.global-menu-trigger:active {
  background: #1a3a6e;
  color: #f4f1ea;
}

.menu-icon-bars {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: bold;
}

/* ── 側拉選單遮罩 (Overlay) ── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 58, 110, 0.4);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 1600;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.28s ease;
}

.drawer-overlay.open {
  opacity: 1;
  pointer-events: auto;
}

/* ── 側拉抽屜本體 (Drawer Panel) ── */
.drawer-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(300px, 85vw);
  background: #f4f1ea;
  border-left: 2px solid #1a3a6e;
  box-shadow: -5px 0 25px rgba(26,58,110,0.18);
  padding: 48px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  transform: translateX(100%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-panel.open {
  transform: translateX(0);
}

/* 關閉按鈕 */
.drawer-close-btn {
  position: absolute;
  top: 14px;
  left: 16px;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #1a3a6e;
  cursor: pointer;
  opacity: 0.6;
  font-family: inherit;
  transition: opacity 0.15s;
}
.drawer-close-btn:hover { opacity: 1; }

/* 抽屜標頭 */
.drawer-header {
  text-align: center;
  padding: 16px 0 10px;
  position: relative;
}

.drawer-deco-line {
  height: 4px;
  background: #c8a84b;
  width: 44px;
  margin: 0 auto 12px auto;
}

.drawer-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.08em;
}

.drawer-subtitle {
  font-size: 0.65rem;
  color: #8a8070;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 4px;
}

/* 導覽連結清單 */
.drawer-nav-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  scrollbar-width: none;
}
.drawer-nav-list::-webkit-scrollbar { display: none; }

.nav-link-btn {
  width: 100%;
  background: #ffffff;
  border: 1.5px solid #c8b89a;
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.nav-link-btn:hover:not(.active),
.nav-link-btn:active:not(.active) {
  border-color: #1a3a6e;
  background: #ffffff;
}

.nav-link-btn.active {
  background: #1a3a6e;
  border-color: #1a3a6e;
  color: #f4f1ea !important;
}

.nav-icon {
  font-size: 1.3rem;
  flex-shrink: 0;
  color: #c8a84b;
  line-height: 1;
}
.nav-link-btn.active .nav-icon {
  color: #f4f1ea;
}

.nav-text-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-zh {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a3a6e;
  letter-spacing: 0.05em;
}
.nav-link-btn.active .nav-zh {
  color: #f4f1ea;
}

.nav-en {
  font-size: 0.62rem;
  color: #8a8070;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.nav-link-btn.active .nav-en {
  color: #a8c4e8;
}

/* 分割線 */
.nav-divider {
  height: 1px;
  background: #e6dfd3;
  margin: 6px 0;
}

/* 成果分析連結樣式 */
.results-link {
  border-style: dashed;
}

/* 抽屜底部 */
.drawer-footer {
  text-align: center;
  font-size: 0.65rem;
  color: #a09880;
  letter-spacing: 0.1em;
}

.footer-divider {
  height: 1px;
  background: #c8b89a;
  margin-bottom: 12px;
  opacity: 0.4;
}

/* ── 過場遮罩 ────────────────────────────────────────── */
.transition-overlay {
  position: fixed;
  inset: 0;
  background: #1a3a6e;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  z-index: 1999;
}
.transition-overlay.active {
  opacity: 0.15;
  pointer-events: all;
}
</style>