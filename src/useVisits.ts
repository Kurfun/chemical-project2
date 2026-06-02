// ── 全域點擊計數 composable ──────────────────────────────
// App.vue 用 provide(VISITS_KEY, visits) 注入
// 各子頁 用 inject(VISITS_KEY) 取得並 +1
// ResultsPage 用 inject(VISITS_KEY) 讀取繪圖

import { ref, type InjectionKey, type Ref } from 'vue'

export interface Visits {
  organic:    number
  inorganic:  number
  analytical: number
  pharma:     number
}

export type VisitsRef = Ref<Visits>

// Injection key（型別安全）
export const VISITS_KEY: InjectionKey<VisitsRef> = Symbol('visits')

// 建立初始計數（在 App.vue setup 呼叫一次）
export function createVisits(): VisitsRef {
  return ref<Visits>({
    organic:    0,
    inorganic:  0,
    analytical: 0,
    pharma:     0,
  })
}