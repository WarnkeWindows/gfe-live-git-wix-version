/**
 * Utilities Service - Good Faith Exteriors
 * backend/utils/utilities-service.web.js
 * 
 * Shared utility functions used across the application
 * Provides common functionality for data processing, validation, and formatting
 */

import { 
    COLLECTIONS, 
    FIELD_MAPPINGS, 
    VALIDATION_SCHEMAS,
    validateData, 
    sanitizeForWix, 
    generateUniqueId,
    calculateUniversalInches,
    CONSTANTS 
} from '../config/collections.js';

import {
    logSystemEvent,
    createSuccessResponse,
    createErrorResponse,
    handleError
} from '../core/wix-data-service.web.js';

// =====================================================================
// DATA FORMATTING UTILITIES
// =====================================================================

/**
 * Formats currency values consistently
 */
export function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$0.00';
    }
    
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Formats phone numbers consistently
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Return original if not 10 digits
    return phone;
}

/**
 * Formats dimensions consistently
 */
export function formatDimensions(width, height, unit = 'in') {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    
    if (w <= 0 || h <= 0) {
        return 'Invalid dimensions';
    }
    
    return `${w}" × ${h}"`;
}

/**
 * Formats window specifications for display
 */
export function formatWindowSpecs(windowData) {
    try {
        const specs = [];
        
        if (windowData.windowType) {
            specs.push(windowData.windowType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
        }
        
        if (windowData.material) {
            specs.push(windowData.material.charAt(0).toUpperCase() + windowData.material.slice(1));
        }
        
        if (windowData.brand && windowData.brand !== 'standard') {
            specs.push(windowData.brand.charAt(0).toUpperCase() + windowData.brand.slice(1));
        }
        
        if (windowData.width && windowData.height) {
            specs.push(formatDimensions(windowData.width, windowData.height));
        }
        
        return specs.join(' • ');
        
    } catch (error) {
        console.error('❌ Failed to format window specs:', error);
        return 'Window Specifications';
    }
}

// =====================================================================
// VALIDATION UTILITIES
// =====================================================================

/**
 * Validates email address format
 */
export function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Validates phone number format
 */
export function isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Must be exactly 10 digits
    return digits.length === 10;
}

/**
 * Validates window dimensions
 */
export function validateWindowDimensions(width, height, quantity = 1) {
    const errors = [];
    
    const w = parseFloat(width);
    const h = parseFloat(height);
    const q = parseInt(quantity, 10);
    
    if (isNaN(w) || w <= 0) {
        errors.push('Width must be a positive number');
    } else if (w < 12 || w > 120) {
        errors.push('Width must be between 12 and 120 inches');
    }
    
    if (isNaN(h) || h <= 0) {
        errors.push('Height must be a positive number');
    } else if (h < 12 || h > 120) {
        errors.push('Height must be between 12 and 120 inches');
    }
    
    if (isNaN(q) || q <= 0) {
        errors.push('Quantity must be a positive integer');
    } else if (q > 50) {
        errors.push('Quantity cannot exceed 50 windows');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        sanitized: {
            width: w,
            height: h,
            quantity: q
        }
    };
}

/**
 * Validates customer information
 */
export function validateCustomerInfo(customerData) {
    const errors = [];
    
    if (!customerData) {
        errors.push('Customer data is required');
        return { isValid: false, errors };
    }
    
    // Email is required
    if (!customerData.customerEmail) {
        errors.push('Customer email is required');
    } else if (!isValidEmail(customerData.customerEmail)) {
        errors.push('Invalid email format');
    }
    
    // Phone validation if provided
    if (customerData.customerPhone && !isValidPhoneNumber(customerData.customerPhone)) {
        errors.push('Invalid phone number format');
    }
    
    // Name validation if provided
    if (customerData.customerName && customerData.customerName.trim().length < 2) {
        errors.push('Customer name must be at least 2 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        sanitized: {
            customerName: customerData.customerName?.trim() || '',
            customerEmail: customerData.customerEmail?.trim().toLowerCase() || '',
            customerPhone: customerData.customerPhone ? formatPhoneNumber(customerData.customerPhone) : '',
            customerAddress: customerData.customerAddress?.trim() || '',
            notes: customerData.notes?.trim() || ''
        }
    };
}

// =====================================================================
// DATA PROCESSING UTILITIES
// =====================================================================

/**
 * Processes window data for consistency
 */
export function processWindowData(windowData) {
    try {
        const processed = {
            windowType: windowData.windowType?.toLowerCase().trim() || 'double-hung',
            material: windowData.material?.toLowerCase().trim() || 'vinyl',
            brand: windowData.brand?.toLowerCase().trim() || 'standard',
            width: parseFloat(windowData.width) || 36,
            height: parseFloat(windowData.height) || 48,
            quantity: parseInt(windowData.quantity, 10) || 1,
            glassOptions: windowData.glassOptions?.trim() || '',
            notes: windowData.notes?.trim() || ''
        };
        
        // Validate processed data
        const validation = validateWindowDimensions(processed.width, processed.height, processed.quantity);
        
        if (!validation.isValid) {
            throw new Error(`Invalid window data: ${validation.errors.join(', ')}`);
        }
        
        return {
            success: true,
            data: processed
        };
        
    } catch (error) {
        console.error('❌ Failed to process window data:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Calculates window area in square feet
 */
export function calculateWindowArea(width, height, quantity = 1) {
    try {
        const w = parseFloat(width);
        const h = parseFloat(height);
        const q = parseInt(quantity, 10);
        
        if (isNaN(w) || isNaN(h) || isNaN(q) || w <= 0 || h <= 0 || q <= 0) {
            throw new Error('Invalid dimensions or quantity');
        }
        
        // Convert inches to square feet
        const areaPerWindow = (w * h) / 144; // 144 square inches = 1 square foot
        const totalArea = areaPerWindow * q;
        
        return {
            areaPerWindow: Math.round(areaPerWindow * 100) / 100,
            totalArea: Math.round(totalArea * 100) / 100,
            universalInches: calculateUniversalInches(w, h, q)
        };
        
    } catch (error) {
        console.error('❌ Failed to calculate window area:', error);
        return {
            areaPerWindow: 0,
            totalArea: 0,
            universalInches: 0
        };
    }
}

/**
 * Generates session tracking data
 */
export function generateSessionData(userInfo = {}) {
    const sessionId = generateUniqueId('session');
    const timestamp = new Date().toISOString();
    
    return {
        sessionId: sessionId,
        timestamp: timestamp,
        userAgent: userInfo.userAgent || '',
        ipAddress: userInfo.ipAddress || '',
        referrer: userInfo.referrer || '',
        source: userInfo.source || 'direct',
        deviceType: detectDeviceType(userInfo.userAgent || ''),
        sessionData: {
            startTime: timestamp,
            lastActivity: timestamp,
            pageViews: 1,
            interactions: 0
        }
    };
}

/**
 * Detects device type from user agent
 */
export function detectDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'tablet';
    } else {
        return 'desktop';
    }
}

// =====================================================================
// ERROR HANDLING UTILITIES
// =====================================================================

/**
 * Safely executes a function with error handling
 */
export async function safeExecute(func, context = 'unknown') {
    try {
        const result = await func();
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error(`❌ Safe execution failed in ${context}:`, error);
        
        await logSystemEvent({
            eventType: 'safe_execution_error',
            message: `Safe execution failed in ${context}`,
            details: {
                error: error.message,
                context: context,
                stack: error.stack
            }
        });
        
        return {
            success: false,
            error: error.message,
            context: context
        };
    }
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff(func, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await func();
        } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries - 1) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    throw lastError;
}

// =====================================================================
// EXPORT SUMMARY
// =====================================================================

export {
    // Data formatting
    formatCurrency,
    formatPhoneNumber,
    formatDimensions,
    formatWindowSpecs,
    
    // Validation
    isValidEmail,
    isValidPhoneNumber,
    validateWindowDimensions,
    validateCustomerInfo,
    
    // Data processing
    processWindowData,
    calculateWindowArea,
    generateSessionData,
    detectDeviceType,
    
    // Error handling
    safeExecute,
    retryWithBackoff
};

