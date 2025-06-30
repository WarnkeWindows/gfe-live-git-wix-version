/**
 * Logger Service - Good Faith Exteriors
 * backend/utils/logger.js
 * 
 * Comprehensive logging service for Wix backend
 * Consistent with updated backend patterns
 */

import wixData from 'wix-data';
import { COLLECTIONS, ERROR_CODES, SYSTEM_CONFIG } from '../config/constants.js';

// =====================================================================
// LOG LEVELS
// =====================================================================

export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace'
};

// =====================================================================
// LOGGER CLASS
// =====================================================================

class Logger {
    constructor() {
        this.logLevel = SYSTEM_CONFIG.LOG_LEVEL || 'info';
        this.retentionDays = SYSTEM_CONFIG.LOG_RETENTION_DAYS || 30;
        this.batchSize = 10;
        this.logQueue = [];
        this.isProcessing = false;
    }

    /**
     * Determines if a log level should be processed
     */
    shouldLog(level) {
        const levels = Object.values(LOG_LEVELS);
        const currentLevelIndex = levels.indexOf(this.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        return messageLevelIndex <= currentLevelIndex;
    }

    /**
     * Creates a standardized log entry
     */
    createLogEntry(level, message, context = {}, error = null) {
        const timestamp = new Date();
        
        return {
            timestamp: timestamp,
            level: level,
            message: message,
            context: JSON.stringify(context),
            errorDetails: error ? JSON.stringify({
                name: error.name,
                message: error.message,
                stack: error.stack
            }) : null,
            sessionId: context.sessionId || null,
            userId: context.userId || null,
            endpoint: context.endpoint || null,
            userAgent: context.userAgent || null,
            ipAddress: context.ipAddress || null,
            source: 'backend'
        };
    }

    /**
     * Adds log entry to queue for batch processing
     */
    async queueLog(logEntry) {
        this.logQueue.push(logEntry);
        
        // Process queue if it reaches batch size or if it's an error
        if (this.logQueue.length >= this.batchSize || logEntry.level === LOG_LEVELS.ERROR) {
            await this.processLogQueue();
        }
    }

    /**
     * Processes the log queue and saves to database
     */
    async processLogQueue() {
        if (this.isProcessing || this.logQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const logsToProcess = [...this.logQueue];
        this.logQueue = [];

        try {
            // Save logs to SystemEvents collection
            for (const logEntry of logsToProcess) {
                await wixData.save(COLLECTIONS.systemEvents, logEntry);
            }
            
            console.log(`✅ Processed ${logsToProcess.length} log entries`);
            
        } catch (error) {
            console.error('❌ Failed to save logs to database:', error);
            
            // Re-queue failed logs (but don't create infinite loop)
            if (logsToProcess.length < 100) {
                this.logQueue.unshift(...logsToProcess);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Error level logging
     */
    async error(message, context = {}, error = null) {
        if (!this.shouldLog(LOG_LEVELS.ERROR)) return;
        
        console.error(`❌ ERROR: ${message}`, context, error);
        
        const logEntry = this.createLogEntry(LOG_LEVELS.ERROR, message, context, error);
        await this.queueLog(logEntry);
    }

    /**
     * Warning level logging
     */
    async warn(message, context = {}) {
        if (!this.shouldLog(LOG_LEVELS.WARN)) return;
        
        console.warn(`⚠️ WARN: ${message}`, context);
        
        const logEntry = this.createLogEntry(LOG_LEVELS.WARN, message, context);
        await this.queueLog(logEntry);
    }

    /**
     * Info level logging
     */
    async info(message, context = {}) {
        if (!this.shouldLog(LOG_LEVELS.INFO)) return;
        
        console.log(`ℹ️ INFO: ${message}`, context);
        
        const logEntry = this.createLogEntry(LOG_LEVELS.INFO, message, context);
        await this.queueLog(logEntry);
    }

    /**
     * Debug level logging
     */
    async debug(message, context = {}) {
        if (!this.shouldLog(LOG_LEVELS.DEBUG)) return;
        
        console.log(`🐛 DEBUG: ${message}`, context);
        
        const logEntry = this.createLogEntry(LOG_LEVELS.DEBUG, message, context);
        await this.queueLog(logEntry);
    }

    /**
     * Trace level logging
     */
    async trace(message, context = {}) {
        if (!this.shouldLog(LOG_LEVELS.TRACE)) return;
        
        console.log(`🔍 TRACE: ${message}`, context);
        
        const logEntry = this.createLogEntry(LOG_LEVELS.TRACE, message, context);
        await this.queueLog(logEntry);
    }

    /**
     * Logs API requests
     */
    async logApiRequest(endpoint, method, requestData = {}, responseData = {}, duration = 0, statusCode = 200) {
        const context = {
            endpoint: endpoint,
            method: method,
            requestSize: JSON.stringify(requestData).length,
            responseSize: JSON.stringify(responseData).length,
            duration: duration,
            statusCode: statusCode
        };

        if (statusCode >= 400) {
            await this.error(`API request failed: ${method} ${endpoint}`, context);
        } else {
            await this.info(`API request: ${method} ${endpoint}`, context);
        }
    }

    /**
     * Logs database operations
     */
    async logDatabaseOperation(operation, collection, itemId = null, duration = 0, success = true, error = null) {
        const context = {
            operation: operation,
            collection: collection,
            itemId: itemId,
            duration: duration
        };

        if (success) {
            await this.debug(`Database ${operation}: ${collection}`, context);
        } else {
            await this.error(`Database ${operation} failed: ${collection}`, context, error);
        }
    }

    /**
     * Logs AI service operations
     */
    async logAIOperation(operation, model, inputSize = 0, outputSize = 0, duration = 0, success = true, error = null) {
        const context = {
            operation: operation,
            model: model,
            inputSize: inputSize,
            outputSize: outputSize,
            duration: duration
        };

        if (success) {
            await this.info(`AI operation: ${operation}`, context);
        } else {
            await this.error(`AI operation failed: ${operation}`, context, error);
        }
    }

    /**
     * Logs email operations
     */
    async logEmailOperation(operation, recipient, template, success = true, error = null) {
        const context = {
            operation: operation,
            recipient: recipient,
            template: template
        };

        if (success) {
            await this.info(`Email ${operation}: ${template}`, context);
        } else {
            await this.error(`Email ${operation} failed: ${template}`, context, error);
        }
    }

    /**
     * Logs user actions
     */
    async logUserAction(action, userId, sessionId, details = {}) {
        const context = {
            action: action,
            userId: userId,
            sessionId: sessionId,
            ...details
        };

        await this.info(`User action: ${action}`, context);
    }

    /**
     * Logs system events
     */
    async logSystemEvent(eventType, message, details = {}) {
        const context = {
            eventType: eventType,
            ...details
        };

        await this.info(`System event: ${eventType} - ${message}`, context);
    }

    /**
     * Logs performance metrics
     */
    async logPerformance(operation, duration, details = {}) {
        const context = {
            operation: operation,
            duration: duration,
            ...details
        };

        if (duration > 5000) { // Log as warning if operation takes more than 5 seconds
            await this.warn(`Slow operation: ${operation} (${duration}ms)`, context);
        } else {
            await this.debug(`Performance: ${operation} (${duration}ms)`, context);
        }
    }

    /**
     * Logs security events
     */
    async logSecurityEvent(eventType, severity, details = {}) {
        const context = {
            eventType: eventType,
            severity: severity,
            ...details
        };

        if (severity === 'high' || severity === 'critical') {
            await this.error(`Security event: ${eventType}`, context);
        } else {
            await this.warn(`Security event: ${eventType}`, context);
        }
    }

    /**
     * Flushes remaining logs in queue
     */
    async flush() {
        if (this.logQueue.length > 0) {
            await this.processLogQueue();
        }
    }

    /**
     * Cleans up old log entries
     */
    async cleanup() {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

            const query = wixData.query(COLLECTIONS.systemEvents)
                .lt('timestamp', cutoffDate);

            const results = await query.find();
            
            if (results.items.length > 0) {
                const itemsToDelete = results.items.map(item => item._id);
                await wixData.bulkRemove(COLLECTIONS.systemEvents, itemsToDelete);
                
                await this.info(`Cleaned up ${itemsToDelete.length} old log entries`, {
                    operation: 'log_cleanup',
                    deletedCount: itemsToDelete.length,
                    cutoffDate: cutoffDate.toISOString()
                });
            }

        } catch (error) {
            await this.error('Failed to cleanup old logs', { operation: 'log_cleanup' }, error);
        }
    }
}

// =====================================================================
// SINGLETON LOGGER INSTANCE
// =====================================================================

const logger = new Logger();

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

/**
 * Logs system events to Analytics collection (for backward compatibility)
 */
export async function logSystemEvent(eventData) {
    try {
        const analyticsEntry = {
            event: eventData.eventType || eventData.event || 'system_event',
            page: eventData.endpoint || eventData.page || 'backend',
            timestamp: eventData.timestamp || new Date(),
            sessionId: eventData.sessionId || null,
            userId: eventData.userId || null,
            eventProperties: JSON.stringify({
                message: eventData.message || '',
                details: eventData.details || '',
                endpoint: eventData.endpoint || '',
                ...eventData
            })
        };

        await wixData.save(COLLECTIONS.analytics, analyticsEntry);
        
        // Also log to system events
        await logger.logSystemEvent(
            eventData.eventType || 'system_event',
            eventData.message || 'System event logged',
            eventData
        );
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to log system event:', error);
        await logger.error('Failed to log system event', { eventData }, error);
        return false;
    }
}

/**
 * Logs analytics events (alias for logSystemEvent)
 */
export async function logAnalyticsEvent(eventData) {
    return await logSystemEvent(eventData);
}

/**
 * Creates a performance timer
 */
export function createPerformanceTimer(operation) {
    const startTime = Date.now();
    
    return {
        end: async (details = {}) => {
            const duration = Date.now() - startTime;
            await logger.logPerformance(operation, duration, details);
            return duration;
        }
    };
}

/**
 * Wraps a function with automatic performance logging
 */
export function withPerformanceLogging(fn, operationName) {
    return async function(...args) {
        const timer = createPerformanceTimer(operationName);
        try {
            const result = await fn.apply(this, args);
            await timer.end({ success: true });
            return result;
        } catch (error) {
            await timer.end({ success: false, error: error.message });
            throw error;
        }
    };
}

/**
 * Wraps a function with automatic error logging
 */
export function withErrorLogging(fn, context = {}) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            await logger.error(`Function error: ${fn.name}`, context, error);
            throw error;
        }
    };
}

// =====================================================================
// EXPORT LOGGER AND FUNCTIONS
// =====================================================================

export default logger;

export {
    logger,
    LOG_LEVELS,
    logSystemEvent,
    logAnalyticsEvent,
    createPerformanceTimer,
    withPerformanceLogging,
    withErrorLogging
};

