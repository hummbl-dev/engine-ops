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

import { EventEmitter } from 'events';
import { IOptimizationPlugin, PluginConfig, PluginEvent, PluginEventData } from './interfaces.js';
import { OptimizationRequest } from '../interfaces.js';

/**
 * Plugin registry for managing optimization plugins
 */
export class PluginRegistry extends EventEmitter {
  private plugins: Map<string, IOptimizationPlugin> = new Map();
  private configs: Map<string, PluginConfig> = new Map();

  /**
   * Register a new plugin
   */
  public async register(plugin: IOptimizationPlugin, config?: PluginConfig): Promise<void> {
    const pluginName = plugin.metadata.name;

    if (this.plugins.has(pluginName)) {
      throw new Error(`Plugin ${pluginName} is already registered`);
    }

    // Set default config
    const pluginConfig: PluginConfig = {
      enabled: true,
      priority: 0,
      ...config,
    };

    // Initialize plugin
    await plugin.init(pluginConfig);

    // Store plugin and config
    this.plugins.set(pluginName, plugin);
    this.configs.set(pluginName, pluginConfig);

    // Emit event
    this.emitEvent(PluginEvent.REGISTERED, {
      pluginName,
      timestamp: Date.now(),
      data: plugin.metadata,
    });
  }

  /**
   * Unregister a plugin
   */
  public async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Shutdown plugin
    await plugin.shutdown();

    // Remove from registry
    this.plugins.delete(pluginName);
    this.configs.delete(pluginName);

    // Emit event
    this.emitEvent(PluginEvent.UNREGISTERED, {
      pluginName,
      timestamp: Date.now(),
    });
  }

  /**
   * Get a plugin by name
   */
  public getPlugin(pluginName: string): IOptimizationPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * Get all registered plugins
   */
  public getAllPlugins(): IOptimizationPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Find suitable plugin for a request
   */
  public findPlugin(request: OptimizationRequest): IOptimizationPlugin | undefined {
    // Get enabled plugins that can handle the request
    const candidates = Array.from(this.plugins.entries())
      .filter(([name, plugin]) => {
        const config = this.configs.get(name);
        return config?.enabled && plugin.canHandle(request);
      })
      .map(([name, plugin]) => ({
        name,
        plugin,
        priority: this.configs.get(name)?.priority || 0,
      }));

    // Sort by priority (higher priority first)
    candidates.sort((a, b) => b.priority - a.priority);

    // Return highest priority plugin
    return candidates[0]?.plugin;
  }

  /**
   * Enable a plugin
   */
  public enablePlugin(pluginName: string): void {
    const config = this.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    config.enabled = true;
    this.emitEvent(PluginEvent.ENABLED, {
      pluginName,
      timestamp: Date.now(),
    });
  }

  /**
   * Disable a plugin
   */
  public disablePlugin(pluginName: string): void {
    const config = this.configs.get(pluginName);
    if (!config) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    config.enabled = false;
    this.emitEvent(PluginEvent.DISABLED, {
      pluginName,
      timestamp: Date.now(),
    });
  }

  /**
   * Get plugin configuration
   */
  public getConfig(pluginName: string): PluginConfig | undefined {
    return this.configs.get(pluginName);
  }

  /**
   * Update plugin configuration
   */
  public async updateConfig(pluginName: string, config: Partial<PluginConfig>): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    const currentConfig = this.configs.get(pluginName);

    if (!plugin || !currentConfig) {
      throw new Error(`Plugin ${pluginName} not found`);
    }

    // Update config
    const newConfig = { ...currentConfig, ...config };
    this.configs.set(pluginName, newConfig);

    // Reinitialize plugin with new config
    await plugin.init(newConfig);
  }

  /**
   * Shutdown all plugins
   */
  public async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.plugins.values()).map((plugin) =>
      plugin.shutdown().catch((error) => {
        this.emitEvent(PluginEvent.ERROR, {
          pluginName: plugin.metadata.name,
          timestamp: Date.now(),
          error,
        });
      }),
    );

    await Promise.all(shutdownPromises);
    this.plugins.clear();
    this.configs.clear();
  }

  private emitEvent(event: PluginEvent, data: PluginEventData): void {
    this.emit(event, data);
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
