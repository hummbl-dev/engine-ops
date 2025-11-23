import { AnomalyDetector } from '../detector';
import { LLMAnalysisProvider } from '../llm-provider';
import { GeminiClient } from '../../ai/clients/gemini';

describe('AI-Enhanced Anomaly Detection', () => {
    let detector: AnomalyDetector;
    let analysisProvider: LLMAnalysisProvider;

    beforeEach(() => {
        const client = new GeminiClient({ apiKey: 'mock-key', model: 'gemini-pro' });
        analysisProvider = new LLMAnalysisProvider(client);
        detector = new AnomalyDetector({
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
