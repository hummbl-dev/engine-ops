/*
 * Copyright (c) 2025, HUMMBL, LLC
 * SPDX-License-Identifier: BSL-1.1
 * Business Source License 1.1 | Change Date: 2029-01-01 | Change License: Apache-2.0
 *
 * This file is licensed under the Business Source License 1.1.
 * See LICENSE in the repository root for full license text.
 */

import { Logger } from './logger.js';
import os from 'os';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  component: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  timestamp: string;
  uptime: number;
}

export interface RemediationEvent {
  id: string;
  timestamp: string;
  component: string;
  issue: string;
  action: string;
  outcome: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

/**
 * HealthTracker monitors system health and tracks remediation actions
 */
export class HealthTracker {
  private logger: Logger;
  private startTime: number;
  private healthHistory: HealthCheckResult[] = [];
  private remediationLog: RemediationEvent[] = [];
  private maxHistorySize = 100;
  private maxRemediationLogSize = 500;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
    this.startTime = Date.now();
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheckResult[] = [];

    // Check system resources
    checks.push(this.checkCPU());
    checks.push(this.checkMemory());
    checks.push(this.checkUptime());

    // Determine overall health
    const unhealthyCount = checks.filter((c) => c.status === 'unhealthy').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    // Store in history
    checks.forEach((check) => this.addToHistory(check));

    const status: HealthStatus = {
      overall,
      checks,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };

    // Log if unhealthy
    if (overall === 'unhealthy') {
      this.logger.error('System health check failed', { status });
    } else if (overall === 'degraded') {
      this.logger.warn('System health degraded', { status });
    }

    return status;
  }

  /**
   * Check CPU usage
   */
  private checkCPU(): HealthCheckResult {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idlePercent = totalIdle / totalTick;
    const usagePercent = (1 - idlePercent) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    if (usagePercent > 90) {
      status = 'unhealthy';
      message = `CPU usage critical: ${usagePercent.toFixed(1)}%`;
    } else if (usagePercent > 70) {
      status = 'degraded';
      message = `CPU usage high: ${usagePercent.toFixed(1)}%`;
    } else {
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
        cores: cpus.length,
      },
    };
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheckResult {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = (usedMem / totalMem) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    if (usagePercent > 90) {
      status = 'unhealthy';
      message = `Memory usage critical: ${usagePercent.toFixed(1)}%`;
    } else if (usagePercent > 75) {
      status = 'degraded';
      message = `Memory usage high: ${usagePercent.toFixed(1)}%`;
    } else {
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
        used: usedMem,
      },
    };
  }

  /**
   * Check uptime
   */
  private checkUptime(): HealthCheckResult {
    const uptime = Date.now() - this.startTime;
    const uptimeSeconds = uptime / 1000;

    // Consider unhealthy if just started (potential crash loop)
    let status: 'healthy' | 'degraded' | 'unhealthy';
    let message: string;

    if (uptimeSeconds < 30) {
      status = 'degraded';
      message = `Service recently started: ${uptimeSeconds.toFixed(0)}s uptime`;
    } else {
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
        startTime: this.startTime,
      },
    };
  }

  /**
   * Log a remediation action
   */
  logRemediation(event: Omit<RemediationEvent, 'timestamp'>): void {
    const fullEvent: RemediationEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.remediationLog.push(fullEvent);

    // Trim log if too large
    if (this.remediationLog.length > this.maxRemediationLogSize) {
      this.remediationLog = this.remediationLog.slice(-this.maxRemediationLogSize);
    }

    // Log to main logger
    if (fullEvent.outcome === 'success') {
      this.logger.info(
        'Remediation action successful',
        fullEvent as unknown as Record<string, unknown>,
      );
    } else {
      this.logger.error(
        'Remediation action failed',
        fullEvent as unknown as Record<string, unknown>,
      );
    }
  }

  /**
   * Get recent remediation events
   */
  getRemediationLog(limit = 50): RemediationEvent[] {
    return this.remediationLog.slice(-limit);
  }

  /**
   * Get health history
   */
  getHealthHistory(limit = 50): HealthCheckResult[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Add check result to history
   */
  private addToHistory(check: HealthCheckResult): void {
    this.healthHistory.push(check);

    // Trim history if too large
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Reset start time (for testing)
   */
  resetStartTime(): void {
    this.startTime = Date.now();
  }

  /**
   * Get current status summary
   */
  getStatusSummary(): {
    uptime: number;
    healthChecks: number;
    remediationEvents: number;
    recentIssues: number;
  } {
    const recentIssues = this.healthHistory.slice(-10).filter((h) => h.status !== 'healthy').length;

    return {
      uptime: Date.now() - this.startTime,
      healthChecks: this.healthHistory.length,
      remediationEvents: this.remediationLog.length,
      recentIssues,
    };
  }
}
