"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineOps = void 0;
const index_js_1 = require("../core/index.js");
/**
 * EngineOps: The public facade for the Engine Optimization Platform.
 *
 * This class provides a stable, high-level interface for interacting with the
 * core optimization engine. It handles initialization, request validation (via Core),
 * and resource management.
 */
class EngineOps {
    engine;
    constructor(config) {
        this.engine = new index_js_1.OptimizationEngine(config);
    }
    /**
     * Initialize the engine.
     * Must be called before submitting any requests.
     */
    async init() {
        await this.engine.init();
    }
    /**
     * Submit an optimization request.
     *
     * @param request The optimization request containing type and data.
     * @returns The optimization result.
     */
    async optimize(request) {
        return this.engine.optimize(request);
    }
    /**
     * Shutdown the engine and release resources.
     */
    async shutdown() {
        await this.engine.shutdown();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.engine.getCacheStats();
    }
    /**
     * Get anomaly detector for monitoring
     */
    getAnomalyDetector() {
        return this.engine.getAnomalyDetector();
    }
    /**
     * Get plugin registry
     */
    getPluginRegistry() {
        return this.engine.getPluginRegistry();
    }
    /**
     * Get workload collector
     */
    getWorkloadCollector() {
        return this.engine.getWorkloadCollector();
    }
}
exports.EngineOps = EngineOps;
