import { EventEmitter } from 'events';
import { IOptimizationPlugin, PluginConfig } from './interfaces.js';
import { OptimizationRequest } from '../interfaces.js';
/**
 * Plugin registry for managing optimization plugins
 */
export declare class PluginRegistry extends EventEmitter {
    private plugins;
    private configs;
    /**
     * Register a new plugin
     */
    register(plugin: IOptimizationPlugin, config?: PluginConfig): Promise<void>;
    /**
     * Unregister a plugin
     */
    unregister(pluginName: string): Promise<void>;
    /**
     * Get a plugin by name
     */
    getPlugin(pluginName: string): IOptimizationPlugin | undefined;
    /**
     * Get all registered plugins
     */
    getAllPlugins(): IOptimizationPlugin[];
    /**
     * Find suitable plugin for a request
     */
    findPlugin(request: OptimizationRequest): IOptimizationPlugin | undefined;
    /**
     * Enable a plugin
     */
    enablePlugin(pluginName: string): void;
    /**
     * Disable a plugin
     */
    disablePlugin(pluginName: string): void;
    /**
     * Get plugin configuration
     */
    getConfig(pluginName: string): PluginConfig | undefined;
    /**
     * Update plugin configuration
     */
    updateConfig(pluginName: string, config: Partial<PluginConfig>): Promise<void>;
    /**
     * Shutdown all plugins
     */
    shutdownAll(): Promise<void>;
    private emitEvent;
}
export declare const pluginRegistry: PluginRegistry;
//# sourceMappingURL=registry.d.ts.map