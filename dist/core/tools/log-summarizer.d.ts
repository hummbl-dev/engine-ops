import { LLMClient } from '../ai/client';
export interface LogSummary {
  summary: string;
  errorCount: number;
  uniqueErrors: string[];
  keyEvents: string[];
  actionItems: string[];
}
export declare class LogSummarizer {
  private promptTemplate;
  private client;
  constructor(client: LLMClient);
  summarize(logContent: string): Promise<LogSummary>;
  private sanitizeLogs;
}
//# sourceMappingURL=log-summarizer.d.ts.map
