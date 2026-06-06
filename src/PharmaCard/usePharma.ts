// ════════════════════════════════════════
//  usePharma.ts
//  所有商業邏輯的單一 Composable
//  （原 setup() 內容原封不動移入，確保功能完整）
// ════════════════════════════════════════

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { type Card, CARDS, shuffle } from './pharmaData'

export function usePharma() {

  // ── 狀態宣告 ──────────────────────────────────────
  const cards             = ref<Card[]>([])
  const currentIndex      = ref(0)
  const isFlipped         = ref(false)
  const isZoomed          = ref(false)
  const imgLoading        = ref(true)
  const hasError          = ref(false)
  const showClearPrompt   = ref(false)   // 控管清除警告對話框
  const isCustomCardSaved = ref(false)   // 是否鎖定/儲存自訂卡片，鎖定後改呈唯讀正常版面

  // 自訂第11頁的反應式狀態
  const customCard = ref<Card>({
    en: '', zh: '', symptom: '', category: '', cid: '', formula: '', effect: ''
  })

  // ── Computed ──────────────────────────────────────

  // 是否目前在自訂卡片頁面 (第11頁，索引為 10)
  const isCustomPage = computed(() => currentIndex.value === 10)

  // 是否在預設的最後一頁卡片 (第10頁，索引為 9)
  const isAtLastPredefined = computed(() => currentIndex.value === 9)

  const currentCard = computed(() => {
    if (isCustomPage.value) return customCard.value
    return cards.value[currentIndex.value] || CARDS[0]
  })

  const progressPct = computed(() => {
    if (cards.value.length === 0) return 0
    return ((currentIndex.value + 1) / cards.value.length) * 100
  })

  // 格式化自訂化學分子式下標樣式
  const formattedCustomFormula = computed(() => {
    const formula = customCard.value.formula
    if (!formula) return '尚無化學式數據'
    if (formula === '查無資料') return '查無分子式'
    // 將數字自動轉化為下標 sub (例如 C17H12Cl2N4 -> C<sub>17</sub>H<sub>12</sub>Cl<sub>2</sub>N<sub>4</sub>)
    return formula.replace(/([A-Za-z]+)(\d+)/g, '$1<sub>$2</sub>')
  })

  // ── 生命週期 ──────────────────────────────────────

  // 重新洗牌初始化
  onMounted(() => {
    cards.value = shuffle(CARDS)
  })

  // 切換卡片時，重設加載狀態與錯誤標記，並處理重新翻頁時自動鎖定自訂卡片
  // ⚠️ 注意：此 watch 同時跨越三個狀態域（導覽、自訂卡片、圖片），請勿拆散
  watch(currentIndex, (newIdx, oldIdx) => {
    // 重點邏輯：如果使用者編輯了第11張(Index 10)，一旦切換到別張(重新翻頁)，
    // 且只要英文名不為空，就自動鎖定為唯讀狀態
    if (oldIdx === 10 && newIdx !== 10) {
      if (customCard.value.en.trim() !== '') {
        isCustomCardSaved.value = true
      }
    }

    isFlipped.value = false
    imgLoading.value = true
    hasError.value = false

    if (newIdx === 10) {
      // 自訂卡片加載圖片判斷
      if (!isCustomCardSaved.value) {
        imgLoading.value = false
        hasError.value = !customCard.value.cid
      } else {
        imgLoading.value = !!customCard.value.cid
        hasError.value = !customCard.value.cid
      }
    }
  })

  // ── 卡片翻轉 ──────────────────────────────────────

  function flip() {
    isFlipped.value = !isFlipped.value
  }

  // 當點擊卡片時判定是否翻轉 (非鎖定狀態且在自訂輸入欄內，防止輸入框選取時卡片誤翻)
  function handleCardClick() {
    if (isCustomPage.value && !isCustomCardSaved.value) {
      // 編輯模式下，若點擊正面空白處或提示處可以翻轉，但在 input 上已使用 click.stop
      flip()
    } else {
      flip()
    }
  }

  // ── 燈箱放大 ──────────────────────────────────────

  function toggleZoom() {
    if (hasError.value) return
    isZoomed.value = !isZoomed.value
  }

  // ── PubChem API ───────────────────────────────────

  // 取得 PubChem API 圖片網址
  function getPubChemImgUrl(cid: string): string {
    if (!cid) return ''
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`
  }

  // PubChem 圖片加載失敗
  function handleImgError() {
    imgLoading.value = false
    hasError.value = true
  }

  // 查詢 PubChem 分子數據
  // ⚠️ 注意：查詢成功後 imgLoading 刻意設為 true，
  //    目的是讓 <img> 的 @load 事件來把它設回 false，請勿改成 false
  async function fetchPubChemData() {
    const rawName = customCard.value.en.trim()
    if (!rawName) {
      customCard.value.cid = ''
      customCard.value.formula = ''
      hasError.value = true
      imgLoading.value = false
      return
    }

    imgLoading.value = true
    hasError.value = false

    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(rawName)}/property/MolecularFormula,Title/JSON`
      const res = await fetch(url)
      if (!res.ok) throw new Error('查無此藥物資料')

      const data = await res.json()
      const prop = data?.PropertyTable?.Properties?.[0]
      if (prop && prop.CID) {
        customCard.value.cid = String(prop.CID)
        customCard.value.formula = prop.MolecularFormula || ''
        hasError.value = false
        imgLoading.value = true   // ← 刻意保留為 true，等 <img @load> 觸發再設回 false
      } else {
        throw new Error('查無 CID 數據')
      }
    } catch {
      customCard.value.cid = ''
      customCard.value.formula = '查無資料'
      hasError.value = true
      imgLoading.value = false
    }
  }

  // ── 卡片導覽 ──────────────────────────────────────

  function goTo(index: number) {
    if (index < 0 || index >= cards.value.length) return
    currentIndex.value = index
  }

  function prev() {
    if (currentIndex.value > 0) goTo(currentIndex.value - 1)
  }

  // 下一張（控制「⊕」新增卡片或在已鎖定自訂卡片點擊「🗑️」清除自訂項目）
  function next() {
    if (isAtLastPredefined.value && cards.value.length === 10) {
      // 擴展第11個欄位代表自訂卡片
      cards.value.push({ en: '', zh: '', symptom: '', category: '', cid: '', formula: '', effect: '' })
      goTo(10)
    } else if (isCustomPage.value && isCustomCardSaved.value) {
      // 如果處於自訂頁面且已儲存，往右滑動或按下一步均會提示「清除內容」
      showClearPrompt.value = true
    } else if (currentIndex.value < cards.value.length - 1) {
      goTo(currentIndex.value + 1)
    }
  }

  // 統一處理右側按鈕點擊
  function handleNextClick() {
    if (isCustomPage.value && isCustomCardSaved.value) {
      showClearPrompt.value = true
    } else {
      next()
    }
  }

  // ── 自訂卡片清除 ──────────────────────────────────

  // 確認清除自訂卡片內容並重置
  // ⚠️ 注意：此函式跨越 4 個狀態域，請整體保留，勿拆散
  function confirmClear() {
    customCard.value      = { en: '', zh: '', symptom: '', category: '', cid: '', formula: '', effect: '' }
    isCustomCardSaved.value = false
    isFlipped.value         = false
    hasError.value          = false
    imgLoading.value        = false
    showClearPrompt.value   = false
  }

  // ── 手勢 & 鍵盤事件 ───────────────────────────────

  // 手動觸控滑動支援 (整合清除內容提示)
  let touchStartX = 0
  function onTouchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX }
  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) < 50) return
    if (dx < 0) {
      // 往左滑（下一張動作）
      if (isCustomPage.value && isCustomCardSaved.value) {
        showClearPrompt.value = true
      } else {
        next()
      }
    } else {
      // 往右滑（上一張動作）
      prev()
    }
  }

  // 滑鼠拖拽支援 (整合清除內容提示)
  let mouseStartX = 0
  function onMouseDown(e: MouseEvent) { mouseStartX = e.clientX }
  function onMouseUp(e: MouseEvent) {
    const dx = e.clientX - mouseStartX
    if (Math.abs(dx) < 50) return
    if (dx < 0) {
      // 往左拖拽
      if (isCustomPage.value && isCustomCardSaved.value) {
        showClearPrompt.value = true
      } else {
        next()
      }
    } else {
      // 往右拖拽
      prev()
    }
  }

  // 鍵盤操控
  function onKey(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return // 輸入框焦點時不干擾輸入
    if (e.key === 'ArrowLeft') { prev() }
    if (e.key === 'ArrowRight') {
      if (isCustomPage.value && isCustomCardSaved.value) {
        showClearPrompt.value = true
      } else {
        next()
      }
    }
    if (e.key === ' ') {
      e.preventDefault()
      flip()
    }
  }

  onMounted(()   => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))

  // ── 統一 return（與原始 return 完全一致）────────────
  return {
    cards, currentIndex, currentCard, progressPct,
    isFlipped, isZoomed, imgLoading, hasError,
    customCard, isCustomPage, isAtLastPredefined, formattedCustomFormula,
    isCustomCardSaved, showClearPrompt,
    flip, handleCardClick, goTo, prev, next, toggleZoom, getPubChemImgUrl,
    onTouchStart, onTouchEnd, onMouseDown, onMouseUp, fetchPubChemData,
    handleImgError, handleNextClick, confirmClear
  }
}