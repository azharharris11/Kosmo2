export interface ClientData {
  rawText: string;
  files: File[];
  concerns: string;
  analysisDate: string; // Format YYYY-MM
  selectedModel: 'gemini-2.5-flash' | 'gemini-3-pro-preview';
}

export interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

export interface ReportState {
  isLoading: boolean;
  isStreaming: boolean;
  content: string;
  error: string | null;
  generatedDate: string | null;
  currentSection: string | null;
  usage: UsageStats | null;
}

export enum Step {
  INPUT = 'INPUT',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
}