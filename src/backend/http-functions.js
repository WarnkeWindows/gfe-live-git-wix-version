// Good Faith Exteriors - Velo HTTP Functions
// This file defines all the public API endpoints for the Wix site.
// It consolidates endpoints from various source files into a single gateway.

import { ok, serverError, badRequest } from 'wix-http-functions';

// Import service functions from the data layer
// Note: Ensure your data service file is located at 'backend/data/wix-data-service.jsw'
import {
    createCustomerLead,
    updateCustomerLeadStatus,
    getCustomerDetails,
    getProjectDetails,
    getQuoteItems,
    getAppointments,
    logSystemEvent,
    createQuote, // Assuming this is also in the data service
    updateLead   // Assuming this is also in the data service
} from 'backend/data/wix-data-service.jsw';

// Import integration functions from the API layer
import { 
    processLeadWithAI, 
    generateQuotePDF 
} from 'backend/api-integration.js';


// =============================================
// Helper Functions
// =============================================

/**
 * Generic error handler for all HTTP functions.
 * @param {Error} error - The error object.
 * @param {string} functionName - The name of the function where the error occurred.
 * @returns {object} - A serverError response.
 */
async function handleError(error, functionName) {
    console.error(`Error in ${functionName}:`, error);
    await logSystemEvent({
        eventType: 'http_function_error',
        message: `Error executing ${functionName}`,
        details: { error: error.message, stack: error.stack }
    });
    return serverError({
        body: {
            success: false,
            error: error.message
        }
    });
}

/**
 * Validates the request body for required fields.
 * @param {object} body - The request body JSON.
 * @param {string[]} requiredFields - An array of required field names.
 */
function validateRequestBody(body, requiredFields) {
    for (const field of requiredFields) {
        if (!body || body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && body[field].trim() === '')) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}


// =============================================
// CRM & Lead Management Endpoints
//
// =============================================

/**
 * Creates a new customer lead in the CRM.
 * Endpoint: /_functions/lead
 */
export async function post_lead(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['customerName', 'customerEmail']);

        // Enrich lead with AI before creation
        const aiProcessingResult = await processLeadWithAI(body);
        
        const result = await createCustomerLead({
            ...body,
            aiInsights: aiProcessingResult
        });

        if (!result.success) {
            throw new Error(result.error);
        }

        return ok({ body: {
            success: true,
            leadId: result.customerId,
            projectId: result.projectId,
            isNew: result.isNewCustomer,
            message: result.message
        }});
    } catch (error) {
        return handleError(error, 'post_lead');
    }
}

/**
 * Updates the status of an existing lead.
 * Endpoint: /_functions/lead_status
 */
export async function post_lead_status(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['customerId', 'leadStatus']);

        const { customerId, leadStatus, notes, updatedBy, sessionId } = body;
        const result = await updateCustomerLeadStatus(customerId, { leadStatus, notes, updatedBy, sessionId });

        if (!result.success) {
            throw new Error(result.error);
        }

        return ok({ body: {
            success: true,
            customerId: result.customerId,
            newStatus: result.leadStatus,
            message: result.message
        }});
    } catch (error) {
        return handleError(error, 'post_lead_status');
    }
}

/**
 * Retrieves full details for a customer.
 * Endpoint: /_functions/customer
 */
export async function get_customer(request) {
    try {
        const { customerId, email } = request.query;
        if (!customerId && !email) {
            throw new Error('Either customerId or email parameter is required.');
        }

        const identifier = customerId || email;
        const result = await getCustomerDetails(identifier);

        if (!result.success) {
            throw new Error(result.error);
        }
        
        return ok({ body: { success: true, ...result } });

    } catch (error) {
        return handleError(error, 'get_customer');
    }
}


// =============================================
// Quote & Project Endpoints
//
// =============================================

/**
 * Receives a request to generate a quote, processes it, and saves the record.
 * Endpoint: /_functions/quoteRequested
 */
export async function post_quoteRequested(request) {
    try {
        const quoteData = await request.body.json();
        validateRequestBody(quoteData, ['leadId', 'customerEmail']);

        // Generate the PDF via the external service
        const pdfResult = await generateQuotePDF(quoteData);
        
        // Create the quote record in the Wix database
        const quoteRecord = await createQuote({
            ...quoteData,
            pdfUrl: pdfResult.pdf_url,
            pdfGenerated: true
        });

        // Update the lead with the new quote information
        await updateLead(quoteData.leadId, {
            status: 'quoted',
            quoteId: quoteRecord._id
        });

        return ok({ body: {
            success: true,
            quoteId: quoteRecord._id,
            pdfUrl: pdfResult.pdf_url
        }});
    } catch (error) {
        return handleError(error, 'post_quoteRequested');
    }
}

/**
 * Retrieves quote items based on filters.
 * Endpoint: /_functions/quotes
 */
export async function get_quotes(request) {
    try {
        const { customerId, email, sessionId, projectId, limit } = request.query;
        const filters = { customerId, customerEmail: email, sessionId, projectId, limit: parseInt(limit) };

        const result = await getQuoteItems(filters);

        if (!result.success) {
            throw new Error(result.error);
        }

        return ok({ body: { success: true, ...result }});
    } catch (error) {
        return handleError(error, 'get_quotes');
    }
}


// =============================================
// Health & Diagnostics Endpoints
//
// =============================================

/**
 * Provides a simple health check for the Velo backend functions.
 * Endpoint: /_functions/health
 */
export async function get_health(request) {
    const endpoints = [
        'lead', 'lead_status', 'customer', 'quoteRequested', 'quotes'
    ];
    
    await logSystemEvent({
        eventType: 'health_check',
        message: 'HTTP functions health check performed.'
    });

    return ok({
        body: {
            success: true,
            status: 'healthy',
            service: 'GFE Velo HTTP Functions',
            timestamp: new Date().toISOString(),
            availableEndpoints: endpoints
        }
    });
}
// http-functions.js
// This file serves as the main API endpoints for the Good Faith Exteriors Window Estimator application
// It handles all HTTP requests following proper Velo patterns.

import { ok, badRequest, serverError } from 'wix-http-functions'; [3, 4]

// Core Data Services imports
import {
    getWindowProducts, [3, 4]
    getWindowBrands, [3, 4]
    getMaterials, [3, 4]
    getWindowTypes, [3, 4]
    getWindowOptions, // Imported but not directly exposed as a top-level endpoint in the provided API Endpoints source. [5, 6]
    createOrUpdateCustomer, [5, 6]
    getCustomerByEmail, [5, 6]
    createQuoteItem, [5, 6]
    storeAIAnalysis, // Refers to saveAIAnalysisResult in wix-data-service.web.js [5, 6, 11, 12]
    logSystemEvent, [7, 9]
    getPricingConfiguration, [5, 6]
    healthCheck // Refers to the database health check in wix-data-service.web.js [5, 6, 13, 14]
} from '../core/wix-data-service.web.js'; [3, 4]

// AI Services imports
import {
    analyzeWindowImage, [5, 6]
    generateQuoteExplanation, [5, 6]
    validateMeasurements, [5, 6]
    generateCustomerCommunication, [5, 6]
    checkAnthropicHealth // Refers to the Anthropic service health check in anthropic-service.web.js [5, 6, 15]
} from '../ai/anthropic-service.web.js'; [5, 6]

// Pricing Service imports
import { calculateWindowQuote } from '../core/pricing-service.web.js'; [5, 6]

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Standard success response
 */
function successResponse(data, extra = {}) {
    return ok({ [7, 9, 16]
        success: true, [7, 9]
        ...data, [7, 9]
        ...extra, [7, 9]
        timestamp: new Date().toISOString() [7, 9]
    });
}

/**
 * Standard error handler
 */
function handleError(error, endpoint) {
    console.error(`Error in ${endpoint}:`, error); [7, 9]

    // Log error to analytics
    logSystemEvent({ [7, 9]
        eventType: 'api_error', [7, 9]
        level: 'error', [7, 9]
        message: `API endpoint error: ${endpoint}`, [7, 9]
        details: {
            error: error.message, [8, 10]
            endpoint, [8, 10]
            stack: error.stack [8, 10]
        }
    }).catch(logError => {
        console.error('Failed to log error:', logError); [8, 10]
    });

    return serverError({ [8, 10, 17]
        success: false, [8, 10]
        error: error.message || 'Internal server error', [8, 10]
        endpoint, [8, 10]
        timestamp: new Date().toISOString() [8, 10]
    });
}

/**
 * Validate request body
 */
function validateRequestBody(body, requiredFields = []) {
    if (!body) {
        throw new Error('Request body is required'); [18, 19]
    }
    for (const field of requiredFields) {
        if (!body[field]) {
            throw new Error(`Required field '${field}' is missing`); [18, 19]
        }
    }
    return true; [18, 19]
}

// =====================================================================
// AI ANALYSIS ENDPOINTS
// =====================================================================

/**
 * POST /api/analyze-window [20, 21]
 * Analyze window image using Claude AI [18, 19]
 */
export async function post_analyze_window(request) { [1, 18, 19]
    try {
        const body = await request.body.json(); [18, 19, 22]
        validateRequestBody(body, ['imageData']); [18, 19]

        const { imageData, context = {}, analysisType = 'detailed' } = body; [18, 19]

        // Analyze image with Claude
        const analysisResult = await analyzeWindowImage(imageData, { [18, 19, 23]
            analysisType, [24, 25]
            includeRecommendations: true, [24, 25]
            ...context // Pass additional context to AI service [23]
        });

        // Store analysis results in Wix Data
        await storeAIAnalysis({ [11, 12, 24, 25]
            sessionName: context.sessionId || 'anonymous',
            userEmail: context.userEmail || '',
            userPhone: context.userPhone || '',
            projectType: 'Window Replacement',
            sessionNotes: analysisResult.analysis.notes || '',
            windowImage: analysisResult.analysis.imageDataPreview || '', // This field might need to be structured for preview storage if not directly from analysis result
            measuredWidth: analysisResult.analysis.estimatedWidth || '48', [24, 25]
            measuredHeight: analysisResult.analysis.estimatedHeight || '48', [26, 27]
            confidencePercent: analysisResult.analysis.confidence || '50', [26, 27]
            detectedType: analysisResult.analysis.windowType || 'Unknown', [26, 27]
            aiAnalysisData: analysisResult.analysis, [26, 27]
            processingMetadata: {
                model: analysisResult.usage?.model || 'claude-3-5-sonnet', [26, 27]
                tokens: analysisResult.usage?.total_tokens || 0, [26, 27]
                timestamp: analysisResult.timestamp [26, 27]
            }
        });

        return successResponse({ [26, 27]
            sessionId: context.sessionId, [26, 27]
            analysis: analysisResult.analysis, [26, 27]
            confidence: analysisResult.analysis.confidence, [26, 27]
            rawResponse: analysisResult.rawResponse,
            usage: analysisResult.usage,
            timestamp: analysisResult.timestamp
        });

    } catch (error) {
        return handleError(error, 'post_analyze_window'); [26, 27]
    }
}

/**
 * POST /api/generate-quote-explanation [20, 21]
 * Generate personalized explanations using Claude AI [26, 27]
 */
export async function post_generate_quote_explanation(request) { [1, 26, 27]
    try {
        const body = await request.body.json(); [22, 28, 29]
        validateRequestBody(body, ['quoteData', 'customerProfile']); // Based on parameters for generateQuoteExplanation [30, 31]

        const { quoteData, customerProfile = {}, sessionId } = body; [28, 29]

        const explanationResult = await generateQuoteExplanation(quoteData, customerProfile); [28-30]

        if (!explanationResult.success) {
            throw new Error(explanationResult.error); [28, 29]
        }

        // Note: The provided source for window-estimator-endpoints.web.js [3-10, 18, 19, 24-29, 32-57] does not show
        // explicitly calling updateQuoteItemWithExplanation here, but the wix-data-service
        // does include this as a 'critical function' [58, 59]. For comprehensive integration,
        // a call to update the quote item in the database with the generated explanation would be logical here.

        return successResponse({ [28, 29]
            explanation: explanationResult.explanation, [28, 29]
            sessionId, [28, 29]
            usage: explanationResult.usage [28, 29]
        });

    } catch (error) {
        return handleError(error, 'post_generate_quote_explanation'); [28, 29]
    }
}

/**
 * POST /api/validate-measurements [20, 21]
 * Validate window measurements using AI [26, 27]
 */
export async function post_validate_measurements(request) { [1, 26, 27]
    try {
        const body = await request.body.json(); [22, 28, 29]
        validateRequestBody(body, ['measurements', 'windowType']); [28, 29]

        const { measurements, windowType, sessionId, context = {} } = body; [28, 29]

        const validationResult = await validateMeasurements(measurements, windowType, context); [28, 29, 60]

        if (!validationResult.success) {
            throw new Error(validationResult.error); [28, 29]
        }

        return successResponse({ [28, 29]
            validation: validationResult.validation, [32, 45]
            isValid: validationResult.validation.isValid, [32, 45]
            sessionId, [32, 45]
            usage: validationResult.usage [32, 45]
        });

    } catch (error) {
        return handleError(error, 'post_validate_measurements'); [32, 45]
    }
}

/**
 * POST /api/generate-customer-communication [20, 21]
 * Generate customer communication messages [32, 45]
 */
export async function post_generate_customer_communication(request) { [1, 32, 45]
    try {
        const body = await request.body.json(); [22, 32, 45]
        validateRequestBody(body, ['customerInfo', 'messageType']); [32, 45]

        const { customerInfo, messageType, contextData = {} } = body; [32, 45]

        const communicationResult = await generateCustomerCommunication( [32, 45, 61]
            customerInfo, [33, 46]
            messageType, [33, 46]
            contextData [33, 46]
        );

        if (!communicationResult.success) {
            throw new Error(communicationResult.error); [33, 46]
        }

        return successResponse({ [33, 46]
            message: communicationResult.message, [33, 46]
            messageType, [33, 46]
            usage: communicationResult.usage [33, 46]
        });

    } catch (error) {
        return handleError(error, 'post_generate_customer_communication'); [33, 46]
    }
}

// =====================================================================
// PRICING AND QUOTE ENDPOINTS
// =====================================================================

/**
 * POST /api/calculate-quote [20, 21]
 * Calculate window replacement quote [33, 46]
 */
export async function post_calculate_quote(request) { [1, 33, 46]
    try {
        const body = await request.body.json(); [22, 34, 47]
        validateRequestBody(body, ['windows']); [34, 47]

        const { windows, customerInfo = {}, sessionId } = body; [34, 47]

        // Get pricing configuration
        const configResult = await getPricingConfiguration(); [34, 47, 62, 63]
        const config = configResult.config; [34, 47]

        // Calculate quote for each window
        const quoteResult = await calculateWindowQuote(windows, config); [34, 47, 64]

        if (!quoteResult.success) {
            throw new Error(quoteResult.error); [34, 47]
        }

        // Store quote items if customer info provided
        if (customerInfo.email) { [34, 47]
            const customerResult = await createOrUpdateCustomer(customerInfo); [34, 47, 65]

            if (customerResult.success) { [35, 48]
                // Store each quote item
                for (const window of quoteResult.quote.windows) { [35, 48]
                    await createQuoteItem({ [35, 48, 66, 67]
                        customerEmail: customerInfo.email, [35, 48]
                        sessionId, [35, 48]
                        ...window [35, 48]
                    });
                }
            }
        }

        return successResponse({ [35, 48]
            quote: quoteResult.quote, [35, 48]
            sessionId, [35, 48]
            calculation: quoteResult.calculation [35, 48]
        });

    } catch (error) {
        return handleError(error, 'post_calculate_quote'); [35, 48]
    }
}

// =====================================================================
// DATA RETRIEVAL ENDPOINTS
// =====================================================================

/**
 * GET /api/window-products [68, 69]
 * Get window products catalog [36, 49]
 */
export async function get_window_products(request) { [1, 36, 49]
    try {
        const { limit = 50, category, brand } = request.query; [36, 49, 70]

        const productsResult = await getWindowProducts({ [36, 49, 71]
            limit: parseInt(limit), [36, 49]
            category, [36, 49]
            brand [36, 49]
        });

        if (!productsResult.success) {
            throw new Error(productsResult.error); [36, 49]
        }

        return successResponse({ [36, 49]
            products: productsResult.products || productsResult.items, [37, 50]
            totalCount: productsResult.totalCount, [37, 50]
            currentCount: productsResult.currentCount [37, 50]
        });

    } catch (error) {
        return handleError(error, 'get_window_products'); [37, 50]
    }
}

/**
 * GET /api/materials [68, 69]
 * Get window materials [37, 50]
 */
export async function get_materials(request) { [1, 37, 50]
    try {
        const { limit = 100 } = request.query; [37, 50, 70]

        const materialsResult = await getMaterials({ [37, 50, 72, 73]
            limit: parseInt(limit) [38, 51]
        });

        if (!materialsResult.success) {
            throw new Error(materialsResult.error); [38, 51]
        }

        return successResponse({ [38, 51]
            materials: materialsResult.materials, [38, 51]
            totalCount: materialsResult.totalCount, [38, 51]
            currentCount: materialsResult.currentCount [38, 51]
        });

    } catch (error) {
        return handleError(error, 'get_materials'); [38, 51]
    }
}

/**
 * GET /api/window-types [68, 69]
 * Get window types [38, 51]
 */
export async function get_window_types(request) { [1, 38, 51]
    try {
        const { limit = 100 } = request.query; [38, 51, 70]

        const typesResult = await getWindowTypes({ [38, 51, 74, 75]
            limit: parseInt(limit) [39, 52]
        });

        if (!typesResult.success) {
            throw new Error(typesResult.error); [39, 52]
        }

        return successResponse({ [39, 52]
            windowTypes: typesResult.windowTypes, [39, 52]
            totalCount: typesResult.totalCount, [39, 52]
            currentCount: typesResult.currentCount [39, 52]
        });

    } catch (error) {
        return handleError(error, 'get_window_types'); [39, 52]
    }
}

/**
 * GET /api/window-brands [68, 69]
 * Get window brands [39, 52]
 */
export async function get_window_brands(request) { [1, 39, 52]
    try {
        const { limit = 100 } = request.query; [40, 53, 70]

        const brandsResult = await getWindowBrands({ [40, 53, 74, 76]
            limit: parseInt(limit) [40, 53]
        });

        if (!brandsResult.success) {
            throw new Error(brandsResult.error); [40, 53]
        }

        return successResponse({ [40, 53]
            brands: brandsResult.brands, [40, 53]
            totalCount: brandsResult.totalCount, [40, 53]
            currentCount: brandsResult.currentCount [40, 53]
        });

    } catch (error) {
        return handleError(error, 'get_window_brands'); [40, 53]
    }
}

// =====================================================================
// CUSTOMER ENDPOINTS
// =====================================================================

/**
 * POST /api/customer [68, 69]
 * Create or update customer [40, 53]
 */
export async function post_customer(request) { [1, 40, 53]
    try {
        const body = await request.body.json(); [22, 40, 53]
        validateRequestBody(body, ['email']); [40, 53]

        const customerResult = await createOrUpdateCustomer(body); [40, 53, 65]

        if (!customerResult.success) {
            throw new Error(customerResult.error); [41, 54]
        }

        return successResponse({ [41, 54]
            customer: customerResult.customer, [41, 54]
            isNew: customerResult.isNew, [41, 54]
            action: customerResult.action [41, 54]
        });

    } catch (error) {
        return handleError(error, 'post_customer'); [41, 54]
    }
}

/**
 * GET /api/customer [68, 69]
 * Get customer by email [41, 54]
 */
export async function get_customer(request) { [1, 41, 54]
    try {
        const { email } = request.query; [41, 54, 70]

        if (!email) {
            throw new Error('Email parameter is required'); [41, 54]
        }

        const customerResult = await getCustomerByEmail(email); [41, 54, 65, 74]

        if (!customerResult.success) {
            throw new Error(customerResult.error); [42, 55]
        }

        return successResponse({ [42, 55]
            customer: customerResult.customer, [42, 55]
            exists: customerResult.exists [42, 55]
        });

    } catch (error) {
        return handleError(error, 'get_customer'); [42, 55]
    }
}

// =====================================================================
// SYSTEM ENDPOINTS
// =====================================================================

/**
 * GET /api/system-health [68, 69]
 * Check system health status [42, 55]
 */
export async function get_system_health(request) { [1, 42, 55]
    try {
        // Run database and Anthropic AI health checks concurrently
        const [dbHealth, aiHealth] = await Promise.all([ [42, 55]
            healthCheck(), // from wix-data-service.web.js [13, 14, 43, 56]
            checkAnthropicHealth() // from anthropic-service.web.js [15, 43, 56]
        ]);

        const systemHealth = {
            status: dbHealth.status === 'healthy' && aiHealth.status === 'healthy' ? 'healthy' : 'unhealthy', [43, 56]
            services: { [43, 56]
                'wix-data': {
                    status: dbHealth.status, [43, 56]
                    responseTime: dbHealth.responseTime, [43, 56]
                    checks: dbHealth.checks [43, 56]
                },
                'claude-ai': {
                    status: aiHealth.status, [44, 57]
                    error: aiHealth.error [44, 57]
                },
                'secrets-manager': { status: 'healthy' }, // Assumed healthy if secrets can be retrieved by other services [44, 57]
                'http-functions': { status: 'healthy' } // Assumed healthy if this endpoint responds [44, 57]
            },
            timestamp: new Date().toISOString() [44, 57]
        };

        return successResponse({ [44, 57]
            system: systemHealth [44, 57]
        });

    } catch (error) {
        return handleError(error, 'get_system_health'); [44, 57]
    }
}

/**
 * GET /api/configuration [68, 69]
 * Get system configuration [44, 57]
 */
export async function get_configuration(request) { [1, 44, 57]
    try {
        const configResult = await getPricingConfiguration(); [44, 57, 62, 63]

        if (!configResult.success) {
            throw new Error(configResult.error); [44, 57]
        }

        return successResponse({ [44, 57]
            configuration: configResult.config, [4, 77]
            usingDefaults: configResult.usingDefaults || false [4, 77]
        });

    } catch (error) {
        return handleError(error, 'get_configuration'); [4, 77]
    }
}