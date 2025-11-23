"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const detector_1 = require("../detector");
const llm_provider_1 = require("../llm-provider");
const gemini_1 = require("../../ai/clients/gemini");
describe('AI-Enhanced Anomaly Detection', () => {
    let detector;
    let analysisProvider;
    beforeEach(() => {
        const client = new gemini_1.GeminiClient({ apiKey: 'mock-key', model: 'gemini-pro' });
        analysisProvider = new llm_provider_1.LLMAnalysisProvider(client);
        detector = new detector_1.AnomalyDetector({
            windowSize: 10,
            threshold: 2, // Low threshold to trigger easily
            minSamples: 5,
            verbose: true
        }, analysisProvider);
    });
    it('should trigger AI analysis on anomaly', async () => {
        // Spy on analyze method
        const analyzeSpy = jest.spyOn(analysisProvider, 'analyze');
        // Train the detector with normal values
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('cpu_usage', 50);
        }
        // Inject anomaly
        detector.recordMetric('cpu_usage', 90);
        // Wait for async analysis (mock delay is 500ms)
        await new Promise(resolve => setTimeout(resolve, 600));
        expect(analyzeSpy).toHaveBeenCalled();
        const result = await analyzeSpy.mock.results[0].value;
        expect(result.rootCauseHypothesis).toBeDefined();
        expect(result.confidenceScore).toBeGreaterThan(0);
        expect(result.relevantLogs).toBeDefined();
    });
});
