import { describe, it, expect, jest } from '@jest/globals';
import { CustomObjectsApi } from '@kubernetes/client-node';
import { reconcile } from '../reconciler';

// Mock optimizer
jest.mock('../optimizer', () => ({
  optimizeResources: jest.fn(),
}));
import { optimizeResources } from '../optimizer';
const mockOptimizeResources = optimizeResources as jest.MockedFunction<typeof optimizeResources>;

describe('Reconciler', () => {
  it('should skip if no spec is present', async () => {
    const k8sApi = {} as CustomObjectsApi;
    const customObject = { metadata: { name: 'test' } };

    await reconcile(customObject, k8sApi);

    expect(mockOptimizeResources).not.toHaveBeenCalled();
  });

  it('should call optimizer if spec is present', async () => {
    const k8sApi = {} as CustomObjectsApi;
    const customObject = {
      metadata: { name: 'test' },
      spec: { foo: 'bar' },
    };

    mockOptimizeResources.mockResolvedValue({ cpu: '100m' });

    await reconcile(customObject, k8sApi);

    expect(mockOptimizeResources).toHaveBeenCalledWith({ foo: 'bar' });
  });
});
