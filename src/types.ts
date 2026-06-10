// ── 共用型別 & 資料 ──────────────────────────────────────

export interface MenuItem {
  id: string
  line1: string
  line2: string
  icon: string
  hideOnHome?: boolean;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'organic',    line1: '普通化學', line2: '分子幾何與VSEPR', icon: '⚗'  },
  { id: 'inorganic',  line1: '無機化學', line2: '分子對稱性', icon: '⬢'  },
  { id: 'analytical', line1: '元素', line2: '週期表', icon: '⚛'  },
  { id: 'pharma',     line1: '藥理學', line2: '單字卡', icon: '💊' },
  { id: 'tracker',    line1: '文獻追蹤',line2: '進度版', icon: '✏️', hideOnHome: true } 
]

export const PAGE_TITLES: Record<string, string> = {
  organic:    '分子幾何與VSEPR',
  inorganic:  '分子對稱性',
  analytical: '週期表',
  pharma:     '單字卡',
  results:    '成果分析',
  tracker: '文獻追蹤' 
}