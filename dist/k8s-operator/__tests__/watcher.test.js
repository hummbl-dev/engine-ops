"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Mock dependencies
const mockReconcile = globals_1.jest.fn();
globals_1.jest.mock('../reconciler', () => ({
    reconcile: mockReconcile
}));
const mockWatch = globals_1.jest.fn();
globals_1.jest.mock('@kubernetes/client-node', () => {
    return {
        KubeConfig: globals_1.jest.fn().mockImplementation(() => ({
            loadFromDefault: globals_1.jest.fn(),
            makeApiClient: globals_1.jest.fn().mockReturnValue({}),
        })),
        CustomObjectsApi: globals_1.jest.fn(),
        Watch: globals_1.jest.fn().mockImplementation(() => ({
            watch: mockWatch
        }))
    };
});
(0, globals_1.describe)('Watcher', () => {
    (0, globals_1.it)('should start watching the correct path', async () => {
        globals_1.jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('../watcher');
        });
        (0, globals_1.expect)(mockWatch).toHaveBeenCalledWith('/apis/engineops.hummbl.dev/v1/optimizations', {}, globals_1.expect.any(Function), globals_1.expect.any(Function));
    });
    (0, globals_1.it)('should call reconcile on ADDED event', async () => {
        let callback;
        mockWatch.mockImplementation((path, opts, cb, _errCb) => {
            callback = cb;
            return Promise.resolve({ abort: globals_1.jest.fn() });
        });
        globals_1.jest.isolateModules(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            require('../watcher');
        });
        const obj = { metadata: { name: 'test' } };
        if (callback) {
            await callback('ADDED', obj);
        }
        (0, globals_1.expect)(mockReconcile).toHaveBeenCalledWith(obj, globals_1.expect.anything());
    });
});
