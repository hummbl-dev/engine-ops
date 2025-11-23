"use strict";
/*
 * Copyright (c) 2025, HUMMBL, LLC
 * SPDX-License-Identifier: BSL-1.1
 * Business Source License 1.1 | Change Date: 2029-01-01 | Change License: Apache-2.0
 *
 * This file is licensed under the Business Source License 1.1.
 * See LICENSE in the repository root for full license text.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthTracker = void 0;
const logger_js_1 = require("./logger.js");
const os_1 = __importDefault(require("os"));
/**
 * HealthTracker monitors system health and tracks remediation actions
 */
class HealthTracker {
    logger;
    startTime;
    healthHistory = [];
    remediationLog = [];
    maxHistorySize = 100;
    maxRemediationLogSize = 500;
    constructor(logger) {
        this.logger = logger || new logger_js_1.Logger();
        this.startTime = Date.now();
    }
    /**
     * Perform comprehensive health check
     */
    async checkHealth() {
        const checks = [];
        // Check system resources
        checks.push(this.checkCPU());
        checks.push(this.checkMemory());
        checks.push(this.checkUptime());
        // Determine overall health
        const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
        const degradedCount = checks.filter(c => c.status === 'degraded').length;
        let overall;
        if (unhealthyCount > 0) {
            overall = 'unhealthy';
        }
        else if (degradedCount > 0) {
            overall = 'degraded';
        }
        else {
            overall = 'healthy';
        }
        // Store in history
        checks.forEach(check => this.addToHistory(check));
        const status = {
            overall,
            checks,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime
        };
        // Log if unhealthy
        if (overall === 'unhealthy') {
            this.logger.error('System health check failed', { status });
        }
        else if (overall === 'degraded') {
            this.logger.warn('System health degraded', { status });
        }
        return status;
    }
    /**
     * Check CPU usage
     */
    checkCPU() {
        const cpus = os_1.default.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        const idlePercent = totalIdle / totalTick;
        const usagePercent = (1 - idlePercent) * 100;
        let status;
        let message;
        if (usagePercent > 90) {
            status = 'unhealthy';
            message = `CPU usage critical: ${usagePercent.toFixed(1)}%`;
        }
        else if (usagePercent > 70) {
            status = 'degraded';
            message = `CPU usage high: ${usagePercent.toFixed(1)}%`;
        }
        else {
            status = 'healthy';
            message = `CPU usage normal: ${usagePercent.toFixed(1)}%`;
        }
        return {
            status,
            component: 'cpu',
            message,
            timestamp: new Date().toISOString(),
            metadata: {
                usage: usagePercent,
                cores: cpus.length
            }
        };
    }
    /**
     * Check memory usage
     */
    checkMemory() {
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const usagePercent = (usedMem / totalMem) * 100;
        let status;
        let message;
        if (usagePercent > 90) {
            status = 'unhealthy';
            message = `Memory usage critical: ${usagePercent.toFixed(1)}%`;
        }
        else if (usagePercent > 75) {
            status = 'degraded';
            message = `Memory usage high: ${usagePercent.toFixed(1)}%`;
        }
        else {
            status = 'healthy';
            message = `Memory usage normal: ${usagePercent.toFixed(1)}%`;
        }
        return {
            status,
            component: 'memory',
            message,
            timestamp: new Date().toISOString(),
            metadata: {
                usage: usagePercent,
                total: totalMem,
                free: freeMem,
                used: usedMem
            }
        };
    }
    /**
     * Check uptime
     */
    checkUptime() {
        const uptime = Date.now() - this.startTime;
        const uptimeSeconds = uptime / 1000;
        // Consider unhealthy if just started (potential crash loop)
        let status;
        let message;
        if (uptimeSeconds < 30) {
            status = 'degraded';
            message = `Service recently started: ${uptimeSeconds.toFixed(0)}s uptime`;
        }
        else {
            status = 'healthy';
            message = `Service stable: ${uptimeSeconds.toFixed(0)}s uptime`;
        }
        return {
            status,
            component: 'uptime',
            message,
            timestamp: new Date().toISOString(),
            metadata: {
                uptime,
                startTime: this.startTime
            }
        };
    }
    /**
     * Log a remediation action
     */
    logRemediation(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date().toISOString()
        };
        this.remediationLog.push(fullEvent);
        // Trim log if too large
        if (this.remediationLog.length > this.maxRemediationLogSize) {
            this.remediationLog = this.remediationLog.slice(-this.maxRemediationLogSize);
        }
        // Log to main logger
        if (fullEvent.outcome === 'success') {
            this.logger.info('Remediation action successful', fullEvent);
        }
        else {
            this.logger.error('Remediation action failed', fullEvent);
        }
    }
    /**
     * Get recent remediation events
     */
    getRemediationLog(limit = 50) {
        return this.remediationLog.slice(-limit);
    }
    /**
     * Get health history
     */
    getHealthHistory(limit = 50) {
        return this.healthHistory.slice(-limit);
    }
    /**
     * Add check result to history
     */
    addToHistory(check) {
        this.healthHistory.push(check);
        // Trim history if too large
        if (this.healthHistory.length > this.maxHistorySize) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
        }
    }
    /**
     * Reset start time (for testing)
     */
    resetStartTime() {
        this.startTime = Date.now();
    }
    /**
     * Get current status summary
     */
    getStatusSummary() {
        const recentIssues = this.healthHistory
            .slice(-10)
            .filter(h => h.status !== 'healthy').length;
        return {
            uptime: Date.now() - this.startTime,
            healthChecks: this.healthHistory.length,
            remediationEvents: this.remediationLog.length,
            recentIssues
        };
    }
}
exports.HealthTracker = HealthTracker;
