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

    constructor() {
        const promptPath = path.join(__dirname, '../prompts/summarize-logs/v1.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    }

    async summarize(logContent: string): Promise<LogSummary> {
        // 1. Sanitize Input (Safety Praxis)
        const sanitizedLogs = this.sanitizeLogs(logContent);

        // 2. Construct Prompt
        const _prompt = this.promptTemplate.replace('{{LOGS}}', sanitizedLogs);

        // 3. Call LLM (Mock for now)
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock response parsing
        return this.mockAnalysis(sanitizedLogs);
    }

    private sanitizeLogs(logs: string): string {
        // Simple PII redaction
        return logs
            .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]')
            .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    }

    private mockAnalysis(logs: string): LogSummary {
        const errorCount = (logs.match(/error/gi) || []).length;
        const uniqueErrors = [...new Set(logs.match(/Error: .*/g) || [])];

        return {
            summary: `Analyzed ${logs.length} chars of logs. Found ${errorCount} errors.`,
            errorCount,
            uniqueErrors,
            keyEvents: ['Service started', 'Connection established'],
            actionItems: errorCount > 0 ? ['Check database connection', 'Review firewall rules'] : ['No action needed']
        };
    }
}
