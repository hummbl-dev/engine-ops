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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PluginRegistry } from '../registry.js';
import { BaseOptimizationPlugin } from '../base-plugin.js';
import { PluginMetadata, PluginEvent } from '../interfaces.js';
import { OptimizationRequest, OptimizationResult } from '../../interfaces.js';

// Test plugin implementation
class TestPlugin extends BaseOptimizationPlugin {
  public readonly metadata: PluginMetadata = {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin',
    supportedTypes: ['resource'],
  };

  public canHandle(request: OptimizationRequest): boolean {
    return request.type === 'resource';
  }

  public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    return {
      requestId: request.id,
      success: true,
      result: { test: true },
      metrics: { durationMs: 10, score: 1.0 },
    };
  }
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it('should register a plugin', async () => {
    const plugin = new TestPlugin();
    await registry.register(plugin);

    const registered = registry.getPlugin('test-plugin');
    expect(registered).toBeDefined();
    expect(registered?.metadata.name).toBe('test-plugin');
  });

  it('should throw error when registering duplicate plugin', async () => {
    const plugin1 = new TestPlugin();
    const plugin2 = new TestPlugin();

    await registry.register(plugin1);
    await expect(registry.register(plugin2)).rejects.toThrow();
  });

  it('should unregister a plugin', async () => {
    const plugin = new TestPlugin();
    await registry.register(plugin);
    await registry.unregister('test-plugin');

    const registered = registry.getPlugin('test-plugin');
    expect(registered).toBeUndefined();
  });

  it('should find suitable plugin for request', async () => {
    const plugin = new TestPlugin();
    await registry.register(plugin);

    const request: OptimizationRequest = {
      id: 'test-1',
      type: 'resource',
      data: {},
    };

    const found = registry.findPlugin(request);
    expect(found).toBeDefined();
    expect(found?.metadata.name).toBe('test-plugin');
  });

  it('should return undefined when no suitable plugin found', async () => {
    const plugin = new TestPlugin();
    await registry.register(plugin);

    const request: OptimizationRequest = {
      id: 'test-1',
      type: 'scheduling',
      data: {},
    };

    const found = registry.findPlugin(request);
    expect(found).toBeUndefined();
  });

  it('should enable and disable plugins', async () => {
    const plugin = new TestPlugin();
    await registry.register(plugin);

    registry.disablePlugin('test-plugin');
    let config = registry.getConfig('test-plugin');
    expect(config?.enabled).toBe(false);

    registry.enablePlugin('test-plugin');
    config = registry.getConfig('test-plugin');
    expect(config?.enabled).toBe(true);
  });

  it('should respect plugin priority', async () => {
    class HighPriorityPlugin extends TestPlugin {
      public readonly metadata: PluginMetadata = {
        name: 'high-priority',
        version: '1.0.0',
        description: 'High priority plugin',
        supportedTypes: ['resource'],
      };
    }

    const lowPriority = new TestPlugin();
    const highPriority = new HighPriorityPlugin();

    await registry.register(lowPriority, { enabled: true, priority: 1 });
    await registry.register(highPriority, { enabled: true, priority: 10 });

    const request: OptimizationRequest = {
      id: 'test-1',
      type: 'resource',
      data: {},
    };

    const found = registry.findPlugin(request);
    expect(found?.metadata.name).toBe('high-priority');
  });

  it('should emit events on plugin lifecycle', async () => {
    const plugin = new TestPlugin();
    const events: PluginEvent[] = [];

    registry.on(PluginEvent.REGISTERED, () => events.push(PluginEvent.REGISTERED));
    registry.on(PluginEvent.UNREGISTERED, () => events.push(PluginEvent.UNREGISTERED));

    await registry.register(plugin);
    await registry.unregister('test-plugin');

    expect(events).toContain(PluginEvent.REGISTERED);
    expect(events).toContain(PluginEvent.UNREGISTERED);
  });
});
