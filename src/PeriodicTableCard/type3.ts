export interface ElementData {
  z: number;
  sym: string;
  zh: string;
  en: string;
  mass: string;
  cat: string;
  config: string;
  state: '固態' | '液態' | '氣態';
  period: number;
  group: number | null;
}

export interface CategoryInfo {
  label: string;
  enLabel: string;
  bg: string;
  border: string;
  color: string;
}

export interface CategoryStyles {
  [key: string]: CategoryInfo;
}

export interface GameCard {
  text: string;
  matchId: number;
  isFlipped: boolean;
  isMatched: boolean;
}