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
exports.BaseOptimizationPlugin = void 0;
/**
 * Base abstract class for optimization plugins
 */
class BaseOptimizationPlugin {
    config;
    isInitialized = false;
    async init(config) {
        this.config = config;
        this.isInitialized = true;
    }
    async shutdown() {
        this.isInitialized = false;
    }
    checkInitialized() {
        if (!this.isInitialized) {
            throw new Error(`Plugin ${this.metadata.name} not initialized`);
        }
    }
}
exports.BaseOptimizationPlugin = BaseOptimizationPlugin;
