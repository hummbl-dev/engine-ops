'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const globals_1 = require('@jest/globals');
// Mock @kubernetes/client-node
const mockLoadFromDefault = globals_1.jest.fn();
const mockMakeApiClient = globals_1.jest.fn();
globals_1.jest.mock('@kubernetes/client-node', () => {
  return {
    KubeConfig: globals_1.jest.fn().mockImplementation(() => ({
      loadFromDefault: mockLoadFromDefault,
      makeApiClient: mockMakeApiClient,
    })),
    CustomObjectsApi: globals_1.jest.fn(),
  };
});
(0, globals_1.describe)('Controller', () => {
  (0, globals_1.it)('should load controller module without errors', async () => {
    // Import controller to verify it loads successfully
    // Note: controller.ts executes code at top level with startOperator()
    // We're just verifying it doesn't throw errors during import
    (0, globals_1.expect)(() => {
      globals_1.jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../controller');
      });
    }).not.toThrow();
  });
});
