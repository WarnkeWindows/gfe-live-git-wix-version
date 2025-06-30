/**
 * Window Estimator API Endpoints - Good Faith Exteriors
 * backend/api/window-estimator-endpoints.web.js
 * 
 * Consolidated API endpoints for the window estimator application
 * Updated for consistency with project standards
 */

import { ok, badRequest, serverError } from 'wix-http-functions';

// Core Data Services
import {
    logSystemEvent,
    logAnalyticsEvent,
    saveAIAnalysisResult,
    createCustomerLead,
    createOrUpdateCustomer,
    getCustomerByEmail,
    getOrCreateCustomerId,
    createQuoteItem,
    getWindowMaterials,
    getWindowTypes,
    getWindowBrands,
    getWindowOptions,
    getWindowProducts,
    getPricingConfiguration,
    healthCheck,
    createSuccessResponse,
    createErrorResponse,
    handleError
} from '../core/wix-data-service.web.js';

// AI Services
import {
    analyzeWindowImage,
    validateMeasurements,
    generateQuoteExplanation,
    generateCustomerCommunication,
    checkAnthropicHealth
} from '../ai/anthropic-service.web.js';

// Pricing Services
import {
    calculateSingleWindowPrice,
    calculateWindowQuote,
    validatePricingInputs
} from '../core/pricing-service.web.js';

// Email Services
import {
    sendQuoteEmail,
    sendAIAnalysisEmail,
    sendAppointmentConfirmationEmail,
    emailServiceHealthCheck
} from '../services/email-service.web.js';

// Utility Services
import {
    validateCustomerInfo,
    validateWindowDimensions,
    processWindowData,
    generateSessionData,
    safeExecute
} from '../utils/utilities-service.web.js';

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Creates success response with consistent format
 */
function successResponse(data, message = 'Operation successful') {
    return ok({
        success: true,
        data: data,
        message: message,
        timestamp: new Date().toISOString()
    });
}

/**
 * Handles errors consistently across all endpoints
 */
function handleRequestError(error, endpoint) {
    console.error(`❌ Error in ${endpoint}:`, error);
    
    // Log error to analytics
    logSystemEvent({
        eventType: 'api_error',
        endpoint: endpoint,
        message: error.message || error,
        details: error.stack || ''
    }).catch(logError => console.error('Failed to log error:', logError));
    
    return serverError({
        success: false,
        error: error.message || 'Internal server error',
        endpoint: endpoint,
        timestamp: new Date().toISOString()
    });
}

/**
 * Validates request body has required fields
 */
function validateRequestBody(body, requiredFields) {
    const missing = [];
    for (const field of requiredFields) {
        if (!body || body[field] === undefined || body[field] === null || body[field] === '') {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        return {
            isValid: false,
            error: `Missing required fields: ${missing.join(', ')}`
        };
    }
    
    return { isValid: true };
}

/**
 * Extracts and validates JSON from request
 */
async function getRequestBody(request) {
    try {
        const body = await request.body.json();
        return { success: true, data: body };
    } catch (error) {
        return { 
            success: false, 
            error: 'Invalid JSON in request body' 
        };
    }
}

/**
 * Extracts query parameters from request URL
 */
function getQueryParams(request) {
    try {
        const url = new URL(request.url);
        const params = {};
        
        for (const [key, value] of url.searchParams.entries()) {
            params[key] = value;
        }
        
        return params;
    } catch (error) {
        console.error('❌ Failed to parse query parameters:', error);
        return {};
    }
}

// =====================================================================
// AI ANALYSIS ENDPOINTS
// =====================================================================

/**
 * POST /api/analyze-window
 * Analyzes window images using Claude AI
 */
export async function post_analyze_window(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['imageData']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        const analysisOptions = {
            analysisType: body.analysisType || 'detailed',
            includeRecommendations: body.includeRecommendations !== false,
            customerContext: body.customerContext || '',
            sessionName: body.sessionName || `session_${Date.now()}`,
            userEmail: body.userEmail || '',
            userPhone: body.userPhone || ''
        };
        
        const result = await analyzeWindowImage(body.imageData, analysisOptions);
        
        if (result.success) {
            // Send email if customer info provided
            if (body.userEmail && body.sendEmail !== false) {
                await safeExecute(async () => {
                    await sendAIAnalysisEmail(
                        { 
                            customerEmail: body.userEmail,
                            customerName: body.userName || '',
                            customerPhone: body.userPhone || ''
                        },
                        result.data
                    );
                }, 'sendAIAnalysisEmail');
            }
            
            return successResponse(result.data, 'Window analysis completed successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'post_analyze_window');
    }
}

/**
 * POST /api/validate-measurements
 * Validates window measurements using AI
 */
export async function post_validate_measurements(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['measurements', 'windowType']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        // Validate measurements using utility function first
        const dimensionValidation = validateWindowDimensions(
            body.measurements.width,
            body.measurements.height,
            body.measurements.quantity
        );
        
        if (!dimensionValidation.isValid) {
            return badRequest({ 
                success: false, 
                error: `Invalid measurements: ${dimensionValidation.errors.join(', ')}` 
            });
        }
        
        const result = await validateMeasurements(
            body.measurements, 
            body.windowType, 
            body.context || {}
        );
        
        if (result.success) {
            return successResponse(result.data, 'Measurements validated successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'post_validate_measurements');
    }
}

/**
 * POST /api/generate-quote-explanation
 * Generates personalized quote explanations using AI
 */
export async function post_generate_quote_explanation(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['quoteData']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        const result = await generateQuoteExplanation(
            body.quoteData, 
            body.customerProfile || {}
        );
        
        if (result.success) {
            return successResponse(result.data, 'Quote explanation generated successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'post_generate_quote_explanation');
    }
}

/**
 * POST /api/generate-customer-communication
 * Generates customer communication messages using AI
 */
export async function post_generate_customer_communication(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['customerInfo', 'messageType']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        const result = await generateCustomerCommunication(
            body.customerInfo,
            body.messageType,
            body.contextData || {}
        );
        
        if (result.success) {
            return successResponse(result.data, 'Customer communication generated successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'post_generate_customer_communication');
    }
}

// =====================================================================
// PRICING & QUOTE ENDPOINTS
// =====================================================================

/**
 * POST /api/calculate-quote
 * Calculates window replacement quotes
 */
export async function post_calculate_quote(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['windows']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        if (!Array.isArray(body.windows) || body.windows.length === 0) {
            return badRequest({ 
                success: false, 
                error: 'Windows array is required and must not be empty' 
            });
        }
        
        // Validate each window's data
        for (let i = 0; i < body.windows.length; i++) {
            const windowResult = processWindowData(body.windows[i]);
            if (!windowResult.success) {
                return badRequest({
                    success: false,
                    error: `Invalid window data at index ${i}: ${windowResult.error}`
                });
            }
            body.windows[i] = windowResult.data;
        }
        
        // Calculate the quote
        const quoteResult = await calculateWindowQuote(body.windows, body.customConfig);
        
        if (!quoteResult.success) {
            return serverError(quoteResult);
        }
        
        const quote = quoteResult.data;
        
        // Handle customer and quote storage if customer info provided
        if (body.customerInfo && body.customerInfo.customerEmail) {
            try {
                // Validate customer info
                const customerValidation = validateCustomerInfo(body.customerInfo);
                if (!customerValidation.isValid) {
                    console.warn('⚠️ Invalid customer info:', customerValidation.errors);
                } else {
                    // Get or create customer
                    const customerResult = await getOrCreateCustomerId(customerValidation.sanitized);
                    
                    if (customerResult.customerId) {
                        // Store each quote item
                        for (let i = 0; i < body.windows.length; i++) {
                            const window = body.windows[i];
                            const windowCalc = quote.windows[i];
                            
                            if (windowCalc && !windowCalc.error) {
                                await createQuoteItem({
                                    ...window,
                                    unitPrice: windowCalc.pricing?.basePrice || 0,
                                    totalPrice: windowCalc.summary?.total || 0,
                                    laborCost: windowCalc.summary?.installation || 0,
                                    customerInfo: customerValidation.sanitized,
                                    sessionId: body.sessionId || generateSessionData().sessionId,
                                    projectId: body.projectId || ''
                                });
                            }
                        }
                        
                        // Add customer info to quote
                        quote.customer = {
                            customerId: customerResult.customerId,
                            isNew: customerResult.isNew,
                            ...customerValidation.sanitized
                        };
                        
                        // Send quote email if requested
                        if (body.sendEmail !== false) {
                            await safeExecute(async () => {
                                await sendQuoteEmail(customerValidation.sanitized, quote);
                            }, 'sendQuoteEmail');
                        }
                    }
                }
                
            } catch (customerError) {
                console.error('❌ Failed to store customer/quote data:', customerError);
                // Continue with quote response even if storage fails
            }
        }
        
        await logSystemEvent({
            eventType: 'quote_calculated',
            message: 'Quote calculated successfully',
            details: {
                windowCount: body.windows.length,
                total: quote.totals.total,
                customerEmail: body.customerInfo?.customerEmail
            }
        });
        
        return successResponse(quote, 'Quote calculated successfully');
        
    } catch (error) {
        return handleRequestError(error, 'post_calculate_quote');
    }
}

/**
 * GET /api/configuration
 * Gets pricing configuration
 */
export async function get_configuration(request) {
    try {
        const result = await getPricingConfiguration();
        
        if (result.success) {
            return successResponse(result.data, 'Configuration retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_configuration');
    }
}

// =====================================================================
// PRODUCT DATA ENDPOINTS
// =====================================================================

/**
 * GET /api/materials
 * Gets window materials
 */
export async function get_materials(request) {
    try {
        const result = await getWindowMaterials();
        
        if (result.success) {
            return successResponse(result.data, 'Materials retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_materials');
    }
}

/**
 * GET /api/window-types
 * Gets window types
 */
export async function get_window_types(request) {
    try {
        const result = await getWindowTypes();
        
        if (result.success) {
            return successResponse(result.data, 'Window types retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_window_types');
    }
}

/**
 * GET /api/window-brands
 * Gets window brands
 */
export async function get_window_brands(request) {
    try {
        const result = await getWindowBrands();
        
        if (result.success) {
            return successResponse(result.data, 'Window brands retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_window_brands');
    }
}

/**
 * GET /api/window-options
 * Gets window options
 */
export async function get_window_options(request) {
    try {
        const result = await getWindowOptions();
        
        if (result.success) {
            return successResponse(result.data, 'Window options retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_window_options');
    }
}

/**
 * GET /api/window-products
 * Gets window products with optional filtering
 */
export async function get_window_products(request) {
    try {
        // Extract query parameters for filtering
        const queryParams = getQueryParams(request);
        const filters = {
            material: queryParams.material,
            windowType: queryParams.windowType,
            brand: queryParams.brand,
            isActive: queryParams.isActive === 'true'
        };
        
        // Remove null/undefined values
        Object.keys(filters).forEach(key => {
            if (filters[key] === null || filters[key] === undefined) {
                delete filters[key];
            }
        });
        
        const result = await getWindowProducts(filters);
        
        if (result.success) {
            return successResponse(result.data, 'Window products retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_window_products');
    }
}

// =====================================================================
// CUSTOMER MANAGEMENT ENDPOINTS
// =====================================================================

/**
 * POST /api/customer
 * Creates or updates customer
 */
export async function post_customer(request) {
    try {
        const bodyResult = await getRequestBody(request);
        if (!bodyResult.success) {
            return badRequest({ success: false, error: bodyResult.error });
        }
        
        const body = bodyResult.data;
        const validation = validateRequestBody(body, ['customerEmail']);
        if (!validation.isValid) {
            return badRequest({ success: false, error: validation.error });
        }
        
        // Validate customer info
        const customerValidation = validateCustomerInfo(body);
        if (!customerValidation.isValid) {
            return badRequest({ 
                success: false, 
                error: `Invalid customer data: ${customerValidation.errors.join(', ')}` 
            });
        }
        
        const result = await createCustomerLead(customerValidation.sanitized);
        
        if (result.success) {
            return successResponse(result.data, 'Customer saved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'post_customer');
    }
}

/**
 * GET /api/customer
 * Gets customer by email
 */
export async function get_customer(request) {
    try {
        const queryParams = getQueryParams(request);
        
        if (!queryParams.email) {
            return badRequest({ success: false, error: 'Email parameter is required' });
        }
        
        const result = await getCustomerByEmail(queryParams.email);
        
        if (result.success) {
            return successResponse(result.data, 'Customer retrieved successfully');
        } else {
            return serverError(result);
        }
        
    } catch (error) {
        return handleRequestError(error, 'get_customer');
    }
}

// =====================================================================
// SYSTEM HEALTH ENDPOINTS
// =====================================================================

/**
 * GET /api/system-health
 * Comprehensive system health check
 */
export async function get_system_health(request) {
    try {
        const healthResults = {
            database: null,
            ai: null,
            email: null,
            overall: 'unknown'
        };
        
        // Check database health
        try {
            const dbResult = await healthCheck();
            healthResults.database = dbResult.success ? 'healthy' : 'unhealthy';
        } catch (error) {
            healthResults.database = 'error';
        }
        
        // Check AI service health
        try {
            const aiResult = await checkAnthropicHealth();
            healthResults.ai = aiResult.success ? 'healthy' : 'unhealthy';
        } catch (error) {
            healthResults.ai = 'error';
        }
        
        // Check email service health
        try {
            const emailResult = await emailServiceHealthCheck();
            healthResults.email = emailResult.success ? 'healthy' : 'unhealthy';
        } catch (error) {
            healthResults.email = 'error';
        }
        
        // Determine overall health
        const services = [healthResults.database, healthResults.ai, healthResults.email];
        if (services.every(status => status === 'healthy')) {
            healthResults.overall = 'healthy';
        } else if (services.some(status => status === 'healthy')) {
            healthResults.overall = 'degraded';
        } else {
            healthResults.overall = 'unhealthy';
        }
        
        healthResults.timestamp = new Date().toISOString();
        
        return successResponse(healthResults, 'System health check completed');
        
    } catch (error) {
        return handleRequestError(error, 'get_system_health');
    }
}

// =====================================================================
// EXPORT SUMMARY
// =====================================================================

export {
    // AI Analysis endpoints
    post_analyze_window,
    post_validate_measurements,
    post_generate_quote_explanation,
    post_generate_customer_communication,
    
    // Pricing & Quote endpoints
    post_calculate_quote,
    get_configuration,
    
    // Product Data endpoints
    get_materials,
    get_window_types,
    get_window_brands,
    get_window_options,
    get_window_products,
    
    // Customer Management endpoints
    post_customer,
    get_customer,
    
    // System Health endpoints
    get_system_health
};

