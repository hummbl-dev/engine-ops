import { LogSummarizer } from '../core/tools/log-summarizer';
import { GrokClient } from '../core/ai/clients/grok';
import * as fs from 'fs';

async function main(): Promise<void> {
    const logFile = process.argv[2];
    if (!logFile) {
        console.error('Usage: ts-node tools/summarize-logs.ts <logfile>');
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(logFile, 'utf-8');
        // Use Grok for log summarization
        const client = new GrokClient({ apiKey: 'mock-key', model: 'grok-1' });
        const summarizer = new LogSummarizer(client);

        console.log('Analyzing logs with Grok...');
        const summary = await summarizer.summarize(content);

        console.log(JSON.stringify(summary, null, 2));
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
