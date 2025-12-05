'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
const log_summarizer_1 = require('../core/tools/log-summarizer');
const grok_1 = require('../core/ai/clients/grok');
const fs = __importStar(require('fs'));
async function main() {
  const logFile = process.argv[2];
  if (!logFile) {
    console.error('Usage: ts-node tools/summarize-logs.ts <logfile>');
    process.exit(1);
  }
  try {
    const content = fs.readFileSync(logFile, 'utf-8');
    // Use Grok for log summarization
    const client = new grok_1.GrokClient({ apiKey: 'mock-key', model: 'grok-1' });
    const summarizer = new log_summarizer_1.LogSummarizer(client);
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
