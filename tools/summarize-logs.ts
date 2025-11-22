import { LogSummarizer } from '../core/tools/log-summarizer';
import * as fs from 'fs';

async function main() {
    const logFile = process.argv[2];
    if (!logFile) {
        console.error('Usage: ts-node tools/summarize-logs.ts <logfile>');
        process.exit(1);
    }

    try {
        const content = fs.readFileSync(logFile, 'utf-8');
        const summarizer = new LogSummarizer();

        console.log('Analyzing logs...');
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
