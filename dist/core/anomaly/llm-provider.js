"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMAnalysisProvider = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LLMAnalysisProvider {
    promptTemplate;
    client;
    constructor(client) {
        this.client = client;
        // Load prompt template
        const promptPath = path.join(__dirname, '../prompts/anomaly-analysis/v1.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    }
    async analyze(alert, recentLogs) {
        // Construct the prompt
        const prompt = this.constructPrompt(alert, recentLogs);
        try {
            // Call the LLM client
            const response = await this.client.complete(prompt);
            // Parse the response (assuming JSON output as per prompt)
            // In a real system, we'd have robust JSON parsing/repair here
            const result = JSON.parse(response.content);
            return {
                rootCauseHypothesis: result.rootCauseHypothesis,
                remediationSuggestion: result.remediationSuggestion,
                confidenceScore: result.confidenceScore,
                relevantLogs: result.relevantLogs
            };
        }
        catch (error) {
            console.error(`[AI Analysis] Error with provider ${this.client.getProviderName()}:`, error);
            // Fallback or rethrow
            return {
                rootCauseHypothesis: "Analysis failed due to LLM error.",
                remediationSuggestion: "Check LLM provider status.",
                confidenceScore: 0,
                relevantLogs: []
            };
        }
    }
    constructPrompt(alert, logs) {
        return this.promptTemplate
            .replace('{{METRIC_NAME}}', alert.metricName)
            .replace('{{METRIC_VALUE}}', alert.value.toString())
            .replace('{{LOGS}}', logs.join('\n'));
    }
}
exports.LLMAnalysisProvider = LLMAnalysisProvider;
