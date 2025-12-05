import { Logger } from './logger.js';
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
export declare class HealthTracker {
  private logger;
  private startTime;
  private healthHistory;
  private remediationLog;
  private maxHistorySize;
  private maxRemediationLogSize;
  constructor(logger?: Logger);
  /**
   * Perform comprehensive health check
   */
  checkHealth(): Promise<HealthStatus>;
  /**
   * Check CPU usage
   */
  private checkCPU;
  /**
   * Check memory usage
   */
  private checkMemory;
  /**
   * Check uptime
   */
  private checkUptime;
  /**
   * Log a remediation action
   */
  logRemediation(event: Omit<RemediationEvent, 'timestamp'>): void;
  /**
   * Get recent remediation events
   */
  getRemediationLog(limit?: number): RemediationEvent[];
  /**
   * Get health history
   */
  getHealthHistory(limit?: number): HealthCheckResult[];
  /**
   * Add check result to history
   */
  private addToHistory;
  /**
   * Reset start time (for testing)
   */
  resetStartTime(): void;
  /**
   * Get current status summary
   */
  getStatusSummary(): {
    uptime: number;
    healthChecks: number;
    remediationEvents: number;
    recentIssues: number;
  };
}
//# sourceMappingURL=health-tracker.d.ts.map
