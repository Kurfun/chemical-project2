// ── 共用型別 & 資料 ──────────────────────────────────────

export interface MenuItem {
  id: string
  line1: string
  line2: string
  icon: string
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'organic',    line1: 'molecular', line2: 'model', icon: '⬡'  },
  { id: 'inorganic',  line1: 'Inorganic', line2: '3D structure', icon: '⚛'  },
  { id: 'analytical', line1: 'Mendeleev,s', line2: 'Dream', icon: '💤'  },
  { id: 'pharma',     line1: 'Medicine', line2: 'Cards', icon: '💊' },
]

export const PAGE_TITLES: Record<string, string> = {
  organic:    'Molecular',
  inorganic:  '3D structure',
  analytical: 'Mendeleev_Zzz',
  pharma:     'Medicine',
  results:    'Analyze',
}