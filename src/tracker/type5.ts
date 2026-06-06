export type KanbanStatus = 'to_read' | 'reading' | 'experimented' | 'archive';

export interface ResearchTopic {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Paper {
  id: string;
  projectId: string;
  title: string;
  journal: string;
  impactFactor: number | null;
  url: string;
  rating: number; // 1 至 5 星
  notes: string;
  status: KanbanStatus;
  pdfData: string | null; // Base64 Data URL
  pdfName: string | null;
}

export interface ChemFlowState {
  projects: ResearchTopic[];
  papers: Paper[];
  activeProject: string; // 'all' 或特定的專案 ID
}