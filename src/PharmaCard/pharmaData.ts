// ════════════════════════════════════════
//  pharmaData.ts
//  型別定義 + 靜態藥物資料 + shuffle 工具函式
// ════════════════════════════════════════

export interface Card {
  en: string
  zh: string
  symptom: string
  category: string
  cid: string
  formula: string
  effect: string
}

export const CARDS: Card[] = [
  { en: 'Triazolam',    zh: '酣樂欣',   symptom: '失眠症',   category: 'Benzodiazepines', cid: '5556',    formula: 'C<sub>17</sub>H<sub>12</sub>Cl<sub>2</sub>N<sub>4</sub>',                        effect: '強力安眠藥，快速誘導入睡。'     },
  { en: 'Brotizolam',   zh: '戀多眠',   symptom: '失眠症',   category: 'Benzodiazepines', cid: '2451',    formula: 'C<sub>15</sub>H<sub>10</sub>BrClN<sub>4</sub>S',                                effect: '常規安眠藥，延長睡眠時間。'     },
  { en: 'Duloxetine',   zh: '千憂解',   symptom: '憂鬱症',   category: 'SNRI',            cid: '60835',   formula: 'C<sub>17</sub>H<sub>19</sub>NOS',                                               effect: '抗憂鬱、抗焦慮、緩解疼痛。'     },
  { en: 'Milnacipran',  zh: '鬱思樂',   symptom: '憂鬱症',   category: 'SNRI',            cid: '4193',    formula: 'C<sub>15</sub>H<sub>22</sub>N<sub>2</sub>O',                                    effect: '改善憂鬱、提升抗壓與活力。'     },
  { en: 'Paroxetine',   zh: '百可舒',   symptom: '憂鬱症',   category: 'SSRI',            cid: '43815',   formula: 'C<sub>19</sub>H<sub>20</sub>FNO<sub>3</sub>',                                   effect: '強力抗憂鬱與各類焦慮症。'       },
  { en: 'Aripiprazole', zh: '安立復',   symptom: '思覺失調', category: 'DPA',             cid: '60795',   formula: 'C<sub>23</sub>H<sub>27</sub>Cl<sub>2</sub>N<sub>3</sub>O<sub>2</sub>',           effect: '穩定情緒，思覺失調與憂鬱。'     },
  { en: 'Risperidone',  zh: '理思必妥', symptom: '思覺失調', category: 'SDA',             cid: '5073',    formula: 'C<sub>23</sub>H<sub>27</sub>FN<sub>4</sub>O<sub>2</sub>',                        effect: '改善幻覺、妄想與思覺失調。'     },
  { en: 'Paliperidone', zh: '思維佳',   symptom: '思覺失調', category: 'SDA',             cid: '115147',  formula: 'C<sub>23</sub>H<sub>27</sub>FN<sub>4</sub>O<sub>3</sub>',                        effect: '長效控制幻覺與思覺失調。'       },
  { en: 'Morphine',     zh: '嗎啡',     symptom: '疼痛',     category: 'Opioid',          cid: '5288826', formula: 'C<sub>17</sub>H<sub>19</sub>NO<sub>3</sub>',                                    effect: '強效止痛藥，用於重度疼痛。'     },
  { en: 'Fentanyl',     zh: '芬太尼',   symptom: '疼痛',     category: 'Opioid',          cid: '3345',    formula: 'C<sub>22</sub>H<sub>28</sub>N<sub>2</sub>O',                                    effect: '強效止痛，多用於手術癌症。'     },
]

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}