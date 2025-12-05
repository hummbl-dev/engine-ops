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
exports.LogSummarizer = void 0;
const fs = __importStar(require('fs'));
const path = __importStar(require('path'));
class LogSummarizer {
  promptTemplate;
  client;
  constructor(client) {
    this.client = client;
    const promptPath = path.join(__dirname, '../prompts/summarize-logs/v1.md');
    this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  }
  async summarize(logContent) {
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
  sanitizeLogs(logs) {
    // Simple PII redaction
    return logs
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
  }
}
exports.LogSummarizer = LogSummarizer;
