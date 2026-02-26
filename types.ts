
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
  actionPlan: string[]; // Deprecated but kept for compatibility
  firstStep: string;
  competitors: string[];
  validationEvidence: Array<{
    type: 'search_trend' | 'competitor_count' | 'market_size' | 'other';
    content: string;
    sourceUrl?: string;
  }>;
  trendingRegion?: string;
  
  // Enhanced Actionable Fields
  targetPlatforms?: string[]; // e.g. ["Upwork", "Etsy", "ProductHunt"]
  monetizationStrategy?: string[]; // e.g. ["SaaS Subscription", "One-time Digital Product"]
  technicalImplementation?: {
    dataSources: string[]; // e.g. ["Twitter API", "Google Trends", "Specific Website URL"]
    scriptFunction: string; // What the script actually does
    stepByStepGuide: string[]; // Detailed technical steps
  };
  
  // New: Investment & Requirements
  prerequisites?: {
    budget: string; // e.g. "$50/mo for VPS"
    timeCommitment: string; // e.g. "2h setup, 0h daily"
    technicalRequirements: string[]; // e.g. ["Python", "OpenAI API Key"]
    accountsNeeded: string[]; // e.g. ["Twitter Developer Account", "Stripe"]
  };
}

export interface DiscoveryNode {
  id: string;
  label: string;
  description: string;
  type: 'sector' | 'niche'; // Kept for UI styling
  subCount?: number;
  isLeaf?: boolean; // New: determines if this is an actionable endpoint
}

export interface ExplorationResult {
  decision: 'expand' | 'finalize';
  nodes?: DiscoveryNode[];
  scanResult?: ScanResult;
}

export interface AutomationResult {
  code: string;
  language: string; // e.g., 'python', 'javascript'
  instructions: string;
  dependencies: string[];
  setupGuide?: string; // Environment setup and requirements
  humanTasks?: string[]; // What the human must do manually
  automationScope?: string; // What this script actually automates
  
  // Business Context Fields
  targetUser?: string; // Who buys this?
  valueProposition?: string; // Why they buy?
  monetizationStrategy?: string; // How to charge?
  deliverable?: string; // What is the output product?
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

export interface DiscoveryStep {
  id: string;
  type: 'selection' | 'result';
  title: string;
  items?: DiscoveryNode[]; // For type='selection'
  result?: ScanResult;     // For type='result'
  isLoading?: boolean;
  selectedItemId?: string; // Track which item was selected in this step
  error?: string; // Optional error message
}

export interface UserProfile {
  timeAvailable: 'full_time' | 'part_time' | 'weekends';
  skills: string[]; // e.g., 'coding', 'design', 'writing', 'marketing', 'none'
  budget: 'zero' | 'low' | 'high'; // <$100, $100-$1000, >$1000
  interests: string[];
}
