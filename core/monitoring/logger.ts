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

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
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
export class Logger {
    private level: LogLevel;
    private enableConsole: boolean;
    private enableTimestamps: boolean;

    constructor(config: LoggerConfig = {}) {
        this.level = config.level ?? LogLevel.INFO;
        this.enableConsole = config.enableConsole ?? true;
        this.enableTimestamps = config.enableTimestamps ?? true;
    }

    private log(level: LogLevel, levelName: string, message: string, context?: Record<string, unknown>, error?: Error): void {
        if (level < this.level) return;

        const entry: LogEntry = {
            timestamp: this.enableTimestamps ? new Date().toISOString() : '',
            level: levelName,
            message,
            context,
            error
        };

        if (this.enableConsole) {
            this.logToConsole(entry);
        }
    }

    private logToConsole(entry: LogEntry): void {
        const parts: string[] = [];

        if (entry.timestamp) {
            parts.push(`[${entry.timestamp}]`);
        }

        parts.push(`[${entry.level}]`);
        parts.push(entry.message);

        const message = parts.join(' ');

        switch (entry.level) {
            case 'ERROR':
                console.error(message, entry.context || '', entry.error || '');
                break;
            case 'WARN':
                console.warn(message, entry.context || '');
                break;
            case 'DEBUG':
                console.debug(message, entry.context || '');
                break;
            default:
                console.log(message, entry.context || '');
        }
    }

    public debug(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, 'DEBUG', message, context);
    }

    public info(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, 'INFO', message, context);
    }

    public warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, 'WARN', message, context);
    }

    public error(message: string, context?: Record<string, unknown>, error?: Error): void {
        this.log(LogLevel.ERROR, 'ERROR', message, context, error);
    }

    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    public getLevel(): LogLevel {
        return this.level;
    }
}

// Global logger instance
export const logger = new Logger();
