import { describe, it, expect, jest } from '@jest/globals';

// Mock @kubernetes/client-node
const mockLoadFromDefault = jest.fn();
const mockMakeApiClient = jest.fn();
jest.mock('@kubernetes/client-node', () => {
  return {
    KubeConfig: jest.fn().mockImplementation(() => ({
      loadFromDefault: mockLoadFromDefault,
      makeApiClient: mockMakeApiClient,
    })),
    CustomObjectsApi: jest.fn(),
  };
});

describe('Controller', () => {
  it('should load controller module without errors', async () => {
    // Import controller to verify it loads successfully
    // Note: controller.ts executes code at top level with startOperator()
    // We're just verifying it doesn't throw errors during import

    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../controller');
      });
    }).not.toThrow();
  });
});
