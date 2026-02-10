
export type Language = 'en' | 'zh';

export enum Difficulty {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export interface FilterOption {
  id: string;
  label: { en: string; zh: string };
  category: 'team' | 'budget' | 'skill' | 'time';
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  estimatedMonthlyRevenue: string;
  automationScore: number; // 0-100
  difficulty: Difficulty;
  tags: string[];
  actionPlan: string[];
  trendingRegion?: string;
}

export interface DiscoveryNode {
  id: string;
  label: string;
  description: string;
  type: 'sector' | 'niche';
  subCount?: number;
}

export interface AutomationResult {
  code: string;
  language: string; // e.g., 'python', 'javascript'
  instructions: string;
  dependencies: string[];
}

export interface AgentAsset extends AutomationResult {
  assetId: string;
  sourceOpportunityId: string;
  sourceOpportunityTitle: string;
  createdAt: string;
}

export interface SearchSource {
  title: string;
  uri: string;
}

export interface ScanResult {
  opportunities: Opportunity[];
  marketOverview: string;
  sources: SearchSource[];
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
