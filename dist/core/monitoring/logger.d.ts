export declare enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}
export interface LoggerConfig {
  level?: LogLevel;
  enableConsole?: boolean;
  enableTimestamps?: boolean;
}
/**
 * Structured logger for engine operations
 */
export declare class Logger {
  private level;
  private enableConsole;
  private enableTimestamps;
  constructor(config?: LoggerConfig);
  private log;
  private logToConsole;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>, error?: Error): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map
