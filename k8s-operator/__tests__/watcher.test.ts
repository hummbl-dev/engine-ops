import { describe, it, expect, jest } from '@jest/globals';

// Mock dependencies
const mockReconcile = jest.fn();
jest.mock('../reconciler', () => ({
    reconcile: mockReconcile
}));

const mockWatch = jest.fn();
jest.mock('@kubernetes/client-node', () => {
    return {
        KubeConfig: jest.fn().mockImplementation(() => ({
            loadFromDefault: jest.fn(),
            makeApiClient: jest.fn().mockReturnValue({}),
        })),
        CustomObjectsApi: jest.fn(),
        Watch: jest.fn().mockImplementation(() => ({
            watch: mockWatch
        }))
    };
});

describe('Watcher', () => {
    it('should start watching the correct path', async () => {
        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('../watcher');
        });

        expect(mockWatch).toHaveBeenCalledWith(
            '/apis/engineops.hummbl.dev/v1/optimizations',
            {},
            expect.any(Function),
            expect.any(Function)
        );
    });

    it('should call reconcile on ADDED event', async () => {
        let callback: ((type: string, obj: unknown) => Promise<void>) | undefined;
        mockWatch.mockImplementation((path, opts, cb, _errCb) => {
            callback = cb as (type: string, obj: unknown) => Promise<void>;
            return Promise.resolve({ abort: jest.fn() });
        });

        jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('../watcher');
        });

        const obj = { metadata: { name: 'test' } };
        if (callback) {
            await callback('ADDED', obj);
        }

        expect(mockReconcile).toHaveBeenCalledWith(obj, expect.anything());
    });
});
