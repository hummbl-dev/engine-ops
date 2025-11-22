/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EngineOps } from '../api.js';
import { IOptimizationPlugin } from '../../core/plugins/interfaces.js';

export const pluginsRouter = Router();

// Singleton engine instance
const engine = new EngineOps({ verbose: false, enablePlugins: true, enableWorkloadCollection: true });
let engineInitialized = false;

// Ensure engine is initialized
async function ensureEngineInitialized(): Promise<void> {
    if (!engineInitialized) {
        await engine.init();
        engineInitialized = true;
    }
}

/**
 * GET /api/v1/plugins
 * List all registered plugins
 */
pluginsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const registry = engine.getPluginRegistry();
        const plugins = registry.getAllPlugins();

        const pluginList = plugins.map((plugin: IOptimizationPlugin) => ({
            name: plugin.metadata.name,
            version: plugin.metadata.version,
            description: plugin.metadata.description,
            author: plugin.metadata.author,
            supportedTypes: plugin.metadata.supportedTypes,
            config: registry.getConfig(plugin.metadata.name)
        }));

        res.status(200).json({
            plugins: pluginList,
            count: pluginList.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/plugins/:name
 * Get specific plugin details
 */
pluginsRouter.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const registry = engine.getPluginRegistry();
        const plugin = registry.getPlugin(req.params.name);

        if (!plugin) {
            res.status(404).json({
                error: 'Plugin not found',
                name: req.params.name
            });
            return;
        }

        res.status(200).json({
            metadata: plugin.metadata,
            config: registry.getConfig(plugin.metadata.name)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/plugins/:name/enable
 * Enable a plugin
 */
pluginsRouter.post('/:name/enable', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const registry = engine.getPluginRegistry();

        registry.enablePlugin(req.params.name);

        res.status(200).json({
            message: 'Plugin enabled',
            name: req.params.name
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/v1/plugins/:name/disable
 * Disable a plugin
 */
pluginsRouter.post('/:name/disable', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const registry = engine.getPluginRegistry();

        registry.disablePlugin(req.params.name);

        res.status(200).json({
            message: 'Plugin disabled',
            name: req.params.name
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/workload-data
 * Get workload collection statistics
 */
pluginsRouter.get('/workload-data/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const collector = engine.getWorkloadCollector();
        const stats = collector.getStats();

        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/workload-data/export
 * Export workload data for ML training
 */
pluginsRouter.get('/workload-data/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const collector = engine.getWorkloadCollector();

        const requestType = req.query.type as string;
        const data = requestType
            ? collector.getDataByType(requestType)
            : collector.getAllData();

        res.status(200).json({
            data,
            count: data.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/v1/workload-data/training-format
 * Export data in ML training format
 */
pluginsRouter.get('/workload-data/training-format', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();
        const collector = engine.getWorkloadCollector();
        const trainingData = collector.exportForTraining();

        res.status(200).json(trainingData);
    } catch (error) {
        next(error);
    }
});
