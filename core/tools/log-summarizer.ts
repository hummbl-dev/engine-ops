import { LLMClient } from '../ai/client';
import * as fs from 'fs';
import * as path from 'path';

export interface LogSummary {
  summary: string;
  errorCount: number;
  uniqueErrors: string[];
  keyEvents: string[];
  actionItems: string[];
}

export class LogSummarizer {
  private promptTemplate: string;
  private client: LLMClient;

  constructor(client: LLMClient) {
    this.client = client;
    const promptPath = path.join(__dirname, '../prompts/summarize-logs/v1.md');
    this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  }

  async summarize(logContent: string): Promise<LogSummary> {
    // 1. Sanitize Input (Safety Praxis)
    const sanitizedLogs = this.sanitizeLogs(logContent);

    // 2. Construct Prompt
    const prompt = this.promptTemplate.replace('{{LOGS}}', sanitizedLogs);

    try {
      // 3. Call LLM
      const response = await this.client.complete(prompt);

      // 4. Parse Response
      // In a real system, use Zod or similar for validation
      return JSON.parse(response.content);
    } catch (error) {
      console.error(
        `[Log Summarizer] Error with provider ${this.client.getProviderName()}:`,
        error,
      );
      throw error;
    }
  }

  private sanitizeLogs(logs: string): string {
    // Simple PII redaction
    return logs
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  }
}
