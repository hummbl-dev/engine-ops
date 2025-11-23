"use strict";
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const registry_js_1 = require("../registry.js");
const base_plugin_js_1 = require("../base-plugin.js");
const interfaces_js_1 = require("../interfaces.js");
// Test plugin implementation
class TestPlugin extends base_plugin_js_1.BaseOptimizationPlugin {
    metadata = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        supportedTypes: ['resource']
    };
    canHandle(request) {
        return request.type === 'resource';
    }
    async optimize(request) {
        return {
            requestId: request.id,
            success: true,
            result: { test: true },
            metrics: { durationMs: 10, score: 1.0 }
        };
    }
}
(0, globals_1.describe)('PluginRegistry', () => {
    let registry;
    (0, globals_1.beforeEach)(() => {
        registry = new registry_js_1.PluginRegistry();
    });
    (0, globals_1.it)('should register a plugin', async () => {
        const plugin = new TestPlugin();
        await registry.register(plugin);
        const registered = registry.getPlugin('test-plugin');
        (0, globals_1.expect)(registered).toBeDefined();
        (0, globals_1.expect)(registered?.metadata.name).toBe('test-plugin');
    });
    (0, globals_1.it)('should throw error when registering duplicate plugin', async () => {
        const plugin1 = new TestPlugin();
        const plugin2 = new TestPlugin();
        await registry.register(plugin1);
        await (0, globals_1.expect)(registry.register(plugin2)).rejects.toThrow();
    });
    (0, globals_1.it)('should unregister a plugin', async () => {
        const plugin = new TestPlugin();
        await registry.register(plugin);
        await registry.unregister('test-plugin');
        const registered = registry.getPlugin('test-plugin');
        (0, globals_1.expect)(registered).toBeUndefined();
    });
    (0, globals_1.it)('should find suitable plugin for request', async () => {
        const plugin = new TestPlugin();
        await registry.register(plugin);
        const request = {
            id: 'test-1',
            type: 'resource',
            data: {}
        };
        const found = registry.findPlugin(request);
        (0, globals_1.expect)(found).toBeDefined();
        (0, globals_1.expect)(found?.metadata.name).toBe('test-plugin');
    });
    (0, globals_1.it)('should return undefined when no suitable plugin found', async () => {
        const plugin = new TestPlugin();
        await registry.register(plugin);
        const request = {
            id: 'test-1',
            type: 'scheduling',
            data: {}
        };
        const found = registry.findPlugin(request);
        (0, globals_1.expect)(found).toBeUndefined();
    });
    (0, globals_1.it)('should enable and disable plugins', async () => {
        const plugin = new TestPlugin();
        await registry.register(plugin);
        registry.disablePlugin('test-plugin');
        let config = registry.getConfig('test-plugin');
        (0, globals_1.expect)(config?.enabled).toBe(false);
        registry.enablePlugin('test-plugin');
        config = registry.getConfig('test-plugin');
        (0, globals_1.expect)(config?.enabled).toBe(true);
    });
    (0, globals_1.it)('should respect plugin priority', async () => {
        class HighPriorityPlugin extends TestPlugin {
            metadata = {
                name: 'high-priority',
                version: '1.0.0',
                description: 'High priority plugin',
                supportedTypes: ['resource']
            };
        }
        const lowPriority = new TestPlugin();
        const highPriority = new HighPriorityPlugin();
        await registry.register(lowPriority, { enabled: true, priority: 1 });
        await registry.register(highPriority, { enabled: true, priority: 10 });
        const request = {
            id: 'test-1',
            type: 'resource',
            data: {}
        };
        const found = registry.findPlugin(request);
        (0, globals_1.expect)(found?.metadata.name).toBe('high-priority');
    });
    (0, globals_1.it)('should emit events on plugin lifecycle', async () => {
        const plugin = new TestPlugin();
        const events = [];
        registry.on(interfaces_js_1.PluginEvent.REGISTERED, () => events.push(interfaces_js_1.PluginEvent.REGISTERED));
        registry.on(interfaces_js_1.PluginEvent.UNREGISTERED, () => events.push(interfaces_js_1.PluginEvent.UNREGISTERED));
        await registry.register(plugin);
        await registry.unregister('test-plugin');
        (0, globals_1.expect)(events).toContain(interfaces_js_1.PluginEvent.REGISTERED);
        (0, globals_1.expect)(events).toContain(interfaces_js_1.PluginEvent.UNREGISTERED);
    });
});
