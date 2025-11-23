"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const reconciler_1 = require("../reconciler");
// Mock optimizer
globals_1.jest.mock('../optimizer', () => ({
    optimizeResources: globals_1.jest.fn()
}));
const optimizer_1 = require("../optimizer");
const mockOptimizeResources = optimizer_1.optimizeResources;
(0, globals_1.describe)('Reconciler', () => {
    (0, globals_1.it)('should skip if no spec is present', async () => {
        const k8sApi = {};
        const customObject = { metadata: { name: 'test' } };
        await (0, reconciler_1.reconcile)(customObject, k8sApi);
        (0, globals_1.expect)(mockOptimizeResources).not.toHaveBeenCalled();
    });
    (0, globals_1.it)('should call optimizer if spec is present', async () => {
        const k8sApi = {};
        const customObject = {
            metadata: { name: 'test' },
            spec: { foo: 'bar' }
        };
        mockOptimizeResources.mockResolvedValue({ cpu: '100m' });
        await (0, reconciler_1.reconcile)(customObject, k8sApi);
        (0, globals_1.expect)(mockOptimizeResources).toHaveBeenCalledWith({ foo: 'bar' });
    });
});
