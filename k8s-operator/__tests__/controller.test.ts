import { describe, it, expect, jest } from '@jest/globals';

// Mock @kubernetes/client-node
const mockLoadFromDefault = jest.fn();
const mockMakeApiClient = jest.fn();
jest.mock('@kubernetes/client-node', () => {
    return {
        KubeConfig: jest.fn().mockImplementation(() => ({
            loadFromDefault: mockLoadFromDefault,
            makeApiClient: mockMakeApiClient
        })),
        CustomObjectsApi: jest.fn()
    };
});

describe('Controller', () => {
    it('should initialize KubeConfig and load defaults', async () => {
        // Import controller to trigger initialization
        // Note: Since controller.ts executes code at top level, we might need to isolate modules
        // For now, just verifying the mock was called is a good start if we can import it safely
        // However, controller.ts has a top-level startOperator call. 
        // We might need to refactor controller.ts to export the start function for better testing.
        // But for this test, let's just check if we can import it without erroring.

        jest.isolateModules(() => {
            require('../controller');
        });

        expect(mockLoadFromDefault).toHaveBeenCalled();
    });
});
