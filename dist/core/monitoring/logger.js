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
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Structured logger for engine operations
 */
class Logger {
    level;
    enableConsole;
    enableTimestamps;
    constructor(config = {}) {
        this.level = config.level ?? LogLevel.INFO;
        this.enableConsole = config.enableConsole ?? true;
        this.enableTimestamps = config.enableTimestamps ?? true;
    }
    log(level, levelName, message, context, error) {
        if (level < this.level)
            return;
        const entry = {
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
    logToConsole(entry) {
        const parts = [];
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
    debug(message, context) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, 'INFO', message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, 'WARN', message, context);
    }
    error(message, context, error) {
        this.log(LogLevel.ERROR, 'ERROR', message, context, error);
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
}
exports.Logger = Logger;
// Global logger instance
exports.logger = new Logger();
