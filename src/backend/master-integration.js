/**
 * Master GFE Integration - Good Faith Exteriors
 * backend/master-gfe-integration.js
 * 
 * UNIFIED HTTP Functions endpoint for the Window Estimator system
 * Handles all iframe communication and backend service integration
 * SYNCHRONIZED with frontend iframe protocols
 */

import { ok, badRequest, serverError } from 'wix-http-functions';
import { 
    COLLECTIONS, 
    SECRETS, 
    CONSTANTS, 
    FIELD_MAPPINGS,
    createSuccessResponse, 
    createErrorResponse,
    createIframeResponse,
    generateUniqueId,
    validateData,
    validateIframeMessage,
    isValidOrigin,
    sanitizeForWix
} from './config/collections.js';

// Import core services
import {
    logSystemEvent,
    logAnalyticsEvent,
    saveAIAnalysisResult,
    createCustomerLead,
    createOrUpdateCustomer,
    createQuoteItem,
    updateQuoteItemWithExplanation,
    getWindowProducts,
    getWindowMaterials,
    getWindowTypes,
    getWindowBrands,
    getWindowOptions,
    getPricingConfiguration,
    healthCheck,
    insertRecord,
    updateRecord
} from './core/wix-data-service.web.js';

import {
    analyzeWindowImage,
    generateQuoteExplanation,
    validateMeasurements,
    generateCustomerCommunication
} from './ai/anthropic-service.web.js';

import {
    calculateWindowQuote,
    calculateSingleWindowPrice,
    validatePricingInputs
} from './core/pricing-service.web.js';

import {
    sendCustomerEmail,
    sendQuoteEmail,
    sendAppointmentReminder
} from './services/email-service.js';

// =====================================================================
// UNIFIED UTILITY FUNCTIONS
// =====================================================================

/**
 * Creates standardized success response for all endpoints
 */
function successResponse(data, message = CONSTANTS.SUCCESS.MESSAGE_PROCESSED, extra = {}) {
    return ok(createSuccessResponse(data, message, extra));
}

/**
 * Handles errors with proper logging and unified response format
 */
function handleError(error, endpoint, context = {}) {
    console.error(`❌ Error in ${endpoint}:`, error);
    
    // Log error to analytics
    logSystemEvent({
        eventType: CONSTANTS.EVENTS.ERROR_OCCURRED,
        endpoint,
        message: error.message || error,
        details: {
            error: error.message,
            stack: error.stack,
            context
        }
    }).catch(logError => {
        console.error('Failed to log error:', logError);
    });
    
    return serverError(createErrorResponse(error, endpoint));
}

/**
 * Validates request body has required fields with unified error handling
 */
function validateRequestBody(body, requiredFields) {
    if (!body || typeof body !== 'object') {
        throw new Error(CONSTANTS.ERRORS.VALIDATION.INVALID_DATA);
    }
    
    const missing = requiredFields.filter(field => {
        const value = body[field];
        return value === undefined || value === null || 
               (typeof value === 'string' && value.trim() === '');
    });
    
    if (missing.length > 0) {
        throw new Error(`${CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD}: ${missing.join(', ')}`);
    }
    
    return true;
}

/**
 * Validates iframe message structure and origin
 */
function validateIframeRequest(request, requireOrigin = true) {
    const origin = request.headers['origin'] || request.headers['referer'];
    
    if (requireOrigin && !isValidOrigin(origin)) {
        throw new Error(CONSTANTS.ERRORS.VALIDATION.INVALID_ORIGIN);
    }
    
    return true;
}

/**
 * Generates session ID for tracking with unified format
 */
function generateSessionId() {
    return generateUniqueId('gfe_sess');
}

/**
 * Detects device type from source with enhanced detection
 */
function detectDeviceType(source, userAgent = '') {
    if (!source && !userAgent) return 'unknown';
    
    const sourceStr = (source || '').toLowerCase();
    const uaStr = (userAgent || '').toLowerCase();
    const combined = `${sourceStr} ${uaStr}`;
    
    const mobileIndicators = ['mobile', 'ios', 'android', 'phone', 'iphone'];
    const tabletIndicators = ['tablet', 'ipad'];
    
    if (mobileIndicators.some(indicator => combined.includes(indicator))) {
        return 'mobile';
    }
    if (tabletIndicators.some(indicator => combined.includes(indicator))) {
        return 'tablet';
    }
    return 'desktop';
}

/**
 * Calculates lead priority based on total amount and context
 */
function calculateLeadPriority(totalAmount, mode = 'desktop', hasAIAnalysis = false) {
    const amount = parseFloat(totalAmount) || 0;
    
    if (amount >= 5000) return 'high';
    if (amount >= 2000) return 'medium';
    if (mode === 'mobile' || hasAIAnalysis) return 'medium'; // Boost for engagement
    return 'low';
}

/**
 * Calculates follow-up date based on lead value and engagement
 */
function calculateFollowUpDate(totalAmount, mode = 'desktop', hasEngagement = false) {
    const amount = parseFloat(totalAmount) || 0;
    const now = new Date();
    
    if (amount >= 5000 || hasEngagement) {
        // High-value or engaged leads: follow up within 2 hours
        return new Date(now.getTime() + 2 * 60 * 60 * 1000);
    } else if (amount >= 2000) {
        // Medium-value leads: follow up within 24 hours
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else {
        // Low-value leads: follow up within 3 days
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
}

/**
 * Generates tags for lead categorization with enhanced logic
 */
function generateLeadTags(pricing, specifications, source, mode, hasAIAnalysis = false) {
    const tags = [];
    
    // Add source tags
    if (source) {
        tags.push(`source:${source}`);
    }
    tags.push(`device:${detectDeviceType(source)}`);
    tags.push(`mode:${mode}`);
    
    // Add engagement tags
    if (hasAIAnalysis) {
        tags.push('ai-analyzed');
    }
    
    // Add value tags
    const total = parseFloat(pricing?.total) || 0;
    if (total >= 5000) tags.push('high-value');
    else if (total >= 2000) tags.push('medium-value');
    else tags.push('low-value');
    
    // Add specification tags
    if (specifications?.windowType) {
        tags.push(`window-type:${specifications.windowType}`);
    }
    if (specifications?.material) {
        tags.push(`material:${specifications.material}`);
    }
    if (specifications?.windowsDetected) {
        tags.push(`windows:${specifications.windowsDetected}`);
    }
    
    return tags;
}

/**
 * Sends internal notification for high-priority leads
 */
async function sendInternalNotification(notification) {
    try {
        await logSystemEvent({
            eventType: 'internal_notification',
            level: 'info',
            message: notification.message,
            details: notification
        });
        
        console.log('📧 Internal notification:', notification);
        
    } catch (error) {
        console.error('Failed to send internal notification:', error);
    }
}

/**
 * Tracks conversion analytics with enhanced data
 */
async function trackConversionAnalytics(quoteData, source, mode, hasAIAnalysis = false) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.CONVERSION_TRACKED,
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode: mode || 'desktop',
            value: parseFloat(quoteData.total) || 0,
            details: {
                windowCount: quoteData.windowCount || 0,
                averagePrice: quoteData.averagePrice || 0,
                materials: quoteData.materials || [],
                windowTypes: quoteData.windowTypes || [],
                hasAIAnalysis,
                deviceType: detectDeviceType(source)
            }
        });
    } catch (error) {
        console.error('Failed to track conversion analytics:', error);
    }
}

/**
 * Calculates AI analysis quality score with enhanced metrics
 */
function calculateQualityScore(analysisData) {
    if (!analysisData) return 0;
    
    let score = 0;
    const weights = {
        measurements: 0.3,
        windowType: 0.2,
        material: 0.2,
        condition: 0.1,
        confidence: 0.1,
        recommendations: 0.1
    };
    
    if (analysisData.measurements && 
        analysisData.measurements.width && 
        analysisData.measurements.height) {
        score += weights.measurements;
    }
    
    if (analysisData.windowType && analysisData.windowType !== 'unknown') {
        score += weights.windowType;
    }
    
    if (analysisData.material && analysisData.material !== 'unknown') {
        score += weights.material;
    }
    
    if (analysisData.condition && analysisData.condition !== 'unknown') {
        score += weights.condition;
    }
    
    if (analysisData.confidence && analysisData.confidence > 70) {
        score += weights.confidence;
    }
    
    if (analysisData.recommendations && analysisData.recommendations.length > 0) {
        score += weights.recommendations;
    }
    
    return Math.round(score * 100);
}

// =====================================================================
// MESSAGE PROCESSING FUNCTIONS
// =====================================================================

/**
 * Processes quote generated events with enhanced analytics
 */
async function processQuoteGenerated(data, source, mode) {
    try {
        const hasAIAnalysis = !!(data.aiAnalysis || data.analysis);
        const priority = calculateLeadPriority(data.total, mode, hasAIAnalysis);
        const followUpDate = calculateFollowUpDate(data.total, mode, hasAIAnalysis);
        const tags = generateLeadTags(data.pricing, data.specifications, source, mode, hasAIAnalysis);
        
        // Track conversion
        await trackConversionAnalytics(data, source, mode, hasAIAnalysis);
        
        // Send notification for high-value leads
        if (priority === 'high') {
            await sendInternalNotification({
                type: 'high_value_quote',
                message: `High-value quote generated: $${data.total}`,
                priority,
                followUpDate,
                customerInfo: data.customerInfo,
                total: data.total,
                source,
                hasAIAnalysis
            });
        }
        
        return { priority, followUpDate, tags, hasAIAnalysis };
        
    } catch (error) {
        console.error('Error processing quote generated:', error);
        return null;
    }
}

/**
 * Processes customer info updates with validation
 */
async function processCustomerInfoUpdated(data, source) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.USER_ENGAGEMENT,
            action: 'customer_info_updated',
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            details: {
                hasName: !!data.customerName,
                hasEmail: !!data.customerEmail,
                hasPhone: !!data.customerPhone,
                hasAddress: !!data.projectAddress,
                completeness: calculateCustomerDataCompleteness(data)
            }
        });
    } catch (error) {
        console.error('Error processing customer info update:', error);
    }
}

/**
 * Calculates customer data completeness score
 */
function calculateCustomerDataCompleteness(data) {
    const fields = ['customerName', 'customerEmail', 'customerPhone', 'projectAddress'];
    const completed = fields.filter(field => !!(data[field] && data[field].trim())).length;
    return Math.round((completed / fields.length) * 100);
}

/**
 * Processes pricing calculations with enhanced tracking
 */
async function processPricingCalculated(data, source) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.PRICING_CALCULATED,
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            value: parseFloat(data.total) || 0,
            details: {
                windowCount: data.windowCount || 0,
                averagePrice: data.averagePrice || 0,
                pricePerUI: data.pricePerUI || 0,
                deviceType: detectDeviceType(source)
            }
        });
    } catch (error) {
        console.error('Error processing pricing calculation:', error);
    }
}

/**
 * Processes AI analysis completion with quality scoring
 */
async function processAIAnalysisCompleted(data, source) {
    try {
        const qualityScore = calculateQualityScore(data.analysis);
        
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.AI_ANALYSIS_COMPLETED,
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            qualityScore,
            details: {
                hasWindows: (data.analysis?.windowsDetected || 0) > 0,
                confidence: data.analysis?.confidence || 0,
                measurementsDetected: !!data.analysis?.measurements,
                windowType: data.analysis?.windowType || 'unknown',
                material: data.analysis?.material || 'unknown',
                condition: data.analysis?.condition || 'unknown'
            }
        });
    } catch (error) {
        console.error('Error processing AI analysis:', error);
    }
}

/**
 * Processes user engagement events with detailed tracking
 */
async function processUserEngagement(data, source, mode) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.USER_ENGAGEMENT,
            action: data.action || 'interaction',
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode: mode || 'desktop',
            details: {
                ...data.details || {},
                deviceType: detectDeviceType(source),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error processing user engagement:', error);
    }
}

/**
 * Processes error events with enhanced context
 */
async function processErrorOccurred(data, source) {
    try {
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.ERROR_OCCURRED,
            level: 'error',
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
            message: data.error || 'Unknown error',
            details: {
                ...data.details || {},
                deviceType: detectDeviceType(source),
                userAgent: data.userAgent || '',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error processing error event:', error);
    }
}

// =====================================================================
// HTTP ENDPOINT FUNCTIONS
// =====================================================================

/**
 * POST /_functions/ai-analysis
 * UNIFIED AI image analysis endpoint
 */
export async function post_ai_analysis(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        validateRequestBody(body, ['imageData']);
        
        const { 
            imageData, 
            context = {}, 
            sessionId = generateSessionId(),
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode = 'desktop'
        } = body;
        
        // Enhanced context with device detection
        const enhancedContext = {
            ...context,
            sessionId,
            source,
            mode,
            deviceType: detectDeviceType(source, request.headers['user-agent']),
            timestamp: new Date().toISOString()
        };
        
        // Perform AI analysis
        const analysisResult = await analyzeWindowImage(imageData, enhancedContext);
        
        if (!analysisResult.success) {
            throw new Error(analysisResult.error);
        }
        
        // Save analysis result with enhanced data
        const saveResult = await saveAIAnalysisResult({
            sessionId,
            originalImage: imageData,
            analysisResults: analysisResult.data.analysis,
            detectedMeasurements: analysisResult.data.measurements,
            confidenceScore: analysisResult.data.confidence,
            aiRecommendations: analysisResult.data.recommendations,
            source,
            deviceType: enhancedContext.deviceType,
            qualityScore: calculateQualityScore(analysisResult.data.analysis)
        });
        
        // Process analytics
        await processAIAnalysisCompleted({
            analysis: analysisResult.data.analysis,
            sessionId
        }, source);
        
        return successResponse({
            analysis: analysisResult.data.analysis,
            measurements: analysisResult.data.measurements,
            recommendations: analysisResult.data.recommendations,
            confidence: analysisResult.data.confidence,
            sessionId,
            usage: analysisResult.data.usage,
            qualityScore: calculateQualityScore(analysisResult.data.analysis)
        }, CONSTANTS.SUCCESS.ANALYSIS_COMPLETE);
        
    } catch (error) {
        return handleError(error, 'post_ai_analysis', { 
            hasImageData: !!request.body?.imageData 
        });
    }
}

/**
 * POST /_functions/pricing-calculator
 * UNIFIED pricing calculation endpoint
 */
export async function post_pricing_calculator(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        validateRequestBody(body, ['windows']);
        
        const { 
            windows, 
            customerInfo = {}, 
            sessionId = generateSessionId(),
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode = 'desktop'
        } = body;
        
        // Validate each window's pricing inputs
        for (const window of windows) {
            validatePricingInputs(window);
        }
        
        // Calculate quote with enhanced tracking
        const quoteResult = await calculateWindowQuote(windows, customerInfo, sessionId);
        
        if (!quoteResult.success) {
            throw new Error(quoteResult.error);
        }
        
        // Process analytics
        await processPricingCalculated({
            total: quoteResult.data.quote.summary.finalTotal,
            windowCount: windows.length,
            averagePrice: quoteResult.data.quote.summary.averagePrice,
            pricePerUI: quoteResult.data.quote.pricing.pricePerUI
        }, source);
        
        return successResponse({
            quote: quoteResult.data.quote,
            breakdown: quoteResult.data.breakdown,
            calculations: quoteResult.data.calculations,
            sessionId
        }, CONSTANTS.SUCCESS.QUOTE_CREATED);
        
    } catch (error) {
        return handleError(error, 'post_pricing_calculator', { 
            windowCount: request.body?.windows?.length 
        });
    }
}

/**
 * POST /_functions/quote-generator
 * UNIFIED quote generation and explanation endpoint
 */
export async function post_quote_generator(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        validateRequestBody(body, ['quoteData']);
        
        const { 
            quoteData, 
            customerProfile = {}, 
            sessionId = generateSessionId(),
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode = 'desktop',
            saveQuote = true
        } = body;
        
        // Generate explanation with enhanced context
        const explanationResult = await generateQuoteExplanation(quoteData, {
            ...customerProfile,
            source,
            mode,
            deviceType: detectDeviceType(source, request.headers['user-agent'])
        });
        
        if (!explanationResult.success) {
            throw new Error(explanationResult.error);
        }
        
        let quoteItemId = null;
        
        // Save quote if requested
        if (saveQuote) {
            const quoteItem = await createQuoteItem({
                sessionId,
                customerId: customerProfile.customerId,
                windowSpecifications: quoteData.windows || quoteData.specifications,
                pricingDetails: quoteData.pricing || quoteData,
                totalAmount: quoteData.total || quoteData.summary?.finalTotal,
                quoteStatus: 'generated',
                source,
                deviceType: detectDeviceType(source),
                leadPriority: calculateLeadPriority(
                    quoteData.total || quoteData.summary?.finalTotal, 
                    mode, 
                    !!(quoteData.aiAnalysis || quoteData.analysis)
                )
            });
            
            if (quoteItem.success) {
                quoteItemId = quoteItem.data.quoteId;
                
                // Update with explanation
                await updateQuoteItemWithExplanation(quoteItemId, {
                    explanation: explanationResult.data.explanation,
                    explanationGenerated: new Date().toISOString()
                });
            }
        }
        
        // Process quote generated analytics
        const processingResult = await processQuoteGenerated(quoteData, source, mode);
        
        return successResponse({
            explanation: explanationResult.data.explanation,
            quoteId: quoteItemId,
            sessionId,
            usage: explanationResult.data.usage,
            processing: processingResult
        }, CONSTANTS.SUCCESS.QUOTE_CREATED);
        
    } catch (error) {
        return handleError(error, 'post_quote_generator');
    }
}

/**
 * POST /_functions/email-service
 * UNIFIED email sending endpoint
 */
export async function post_email_service(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        validateRequestBody(body, ['type', 'customerEmail']);
        
        const { 
            type, 
            customerEmail, 
            customerName,
            quoteData,
            appointmentData,
            sessionId = generateSessionId(),
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE
        } = body;
        
        let emailResult;
        
        switch (type) {
            case 'quote':
                validateRequestBody(body, ['quoteData']);
                emailResult = await sendQuoteEmail({
                    customerEmail,
                    customerName,
                    quoteData,
                    sessionId
                });
                break;
                
            case 'appointment_reminder':
                validateRequestBody(body, ['appointmentData']);
                emailResult = await sendAppointmentReminder({
                    customerEmail,
                    customerName,
                    appointmentData
                });
                break;
                
            default:
                throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_DATA}: Unsupported email type: ${type}`);
        }
        
        if (!emailResult.success) {
            throw new Error(emailResult.error);
        }
        
        // Log email sent event
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.EMAIL_SENT,
            emailType: type,
            recipient: customerEmail,
            sessionId,
            source
        });
        
        return successResponse({
            emailSent: true,
            emailId: emailResult.data.emailId,
            type,
            recipient: customerEmail
        }, CONSTANTS.SUCCESS.EMAIL_SENT);
        
    } catch (error) {
        return handleError(error, 'post_email_service');
    }
}

/**
 * POST /_functions/customer-service
 * UNIFIED customer data management endpoint
 */
export async function post_customer_service(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        validateRequestBody(body, ['action']);
        
        const { 
            action, 
            customerData,
            sessionId = generateSessionId(),
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE,
            mode = 'desktop'
        } = body;
        
        let result;
        
        switch (action) {
            case 'create':
            case 'update':
                validateRequestBody(body, ['customerData']);
                
                const enhancedCustomerData = {
                    ...customerData,
                    sessionId,
                    source,
                    deviceType: detectDeviceType(source, request.headers['user-agent']),
                    leadPriority: calculateLeadPriority(customerData.estimatedValue, mode),
                    completeness: calculateCustomerDataCompleteness(customerData)
                };
                
                result = await createOrUpdateCustomer(enhancedCustomerData);
                
                // Process customer info update
                await processCustomerInfoUpdated(customerData, source);
                break;
                
            case 'create_lead':
                validateRequestBody(body, ['customerData']);
                
                const leadData = {
                    ...customerData,
                    sessionId,
                    source,
                    leadPriority: calculateLeadPriority(customerData.estimatedValue, mode),
                    followUpDate: calculateFollowUpDate(customerData.estimatedValue, mode),
                    tags: generateLeadTags(
                        customerData.pricing,
                        customerData.specifications,
                        source,
                        mode,
                        !!(customerData.aiAnalysis || customerData.analysis)
                    )
                };
                
                result = await createCustomerLead(leadData);
                break;
                
            default:
                throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_DATA}: Unsupported customer action: ${action}`);
        }
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return successResponse({
            customer: result.data,
            action,
            sessionId
        }, CONSTANTS.SUCCESS.CUSTOMER_SAVED);
        
    } catch (error) {
        return handleError(error, 'post_customer_service');
    }
}

/**
 * GET /_functions/system-data
 * UNIFIED system data endpoint for iframe initialization
 */
export async function get_system_data(request) {
    try {
        const query = request.query || {};
        const { type, includeAll = false } = query;
        
        const data = {};
        
        // Load different data types based on request
        if (!type || type === 'products' || includeAll) {
            const productsResult = await getWindowProducts();
            data.products = productsResult.success ? productsResult.data : [];
        }
        
        if (!type || type === 'materials' || includeAll) {
            const materialsResult = await getWindowMaterials();
            data.materials = materialsResult.success ? materialsResult.data : [];
        }
        
        if (!type || type === 'windowTypes' || includeAll) {
            const typesResult = await getWindowTypes();
            data.windowTypes = typesResult.success ? typesResult.data : [];
        }
        
        if (!type || type === 'brands' || includeAll) {
            const brandsResult = await getWindowBrands();
            data.brands = brandsResult.success ? brandsResult.data : [];
        }
        
        if (!type || type === 'options' || includeAll) {
            const optionsResult = await getWindowOptions();
            data.options = optionsResult.success ? optionsResult.data : [];
        }
        
        if (!type || type === 'configuration' || includeAll) {
            const configResult = await getPricingConfiguration();
            data.configuration = configResult.success ? configResult.data : null;
        }
        
        // Add UI constants for iframe consistency
        data.uiElements = CONSTANTS.UI_ELEMENT_IDS;
        data.iframeEvents = CONSTANTS.IFRAME_EVENTS;
        data.iframeSources = CONSTANTS.IFRAME_SOURCES;
        
        return successResponse(data);
        
    } catch (error) {
        return handleError(error, 'get_system_data');
    }
}

/**
 * GET /_functions/system-health
 * UNIFIED system health check endpoint
 */
export async function get_system_health(request) {
    try {
        const healthResult = await healthCheck();
        
        const systemHealth = {
            status: healthResult.success ? 'healthy' : 'unhealthy',
            services: healthResult.data?.services || {},
            timestamp: new Date().toISOString(),
            version: '2.0',
            uptime: process.uptime ? Math.floor(process.uptime()) : 'unknown',
            constants: {
                uiElementsCount: Object.keys(CONSTANTS.UI_ELEMENT_IDS).length,
                iframeEventsCount: Object.keys(CONSTANTS.IFRAME_EVENTS).length,
                collectionsCount: Object.keys(COLLECTIONS).length
            }
        };
        
        return successResponse({
            system: systemHealth
        });
        
    } catch (error) {
        return handleError(error, 'get_system_health');
    }
}

/**
 * POST /_functions/iframe-message
 * UNIFIED central handler for iframe communication messages
 */
export async function post_iframe_message(request) {
    try {
        validateIframeRequest(request);
        const body = await request.body.json();
        
        // Validate iframe message structure
        validateIframeMessage(body);
        validateRequestBody(body, ['source', 'action']);
        
        const { 
            source, 
            action, 
            data = {},
            sessionId = generateSessionId(),
            mode = 'desktop'
        } = body;
        
        console.log(`📨 Processing iframe message: ${action} from ${source}`);
        
        // Route message based on action with unified handling
        let result;
        
        switch (action) {
            case CONSTANTS.IFRAME_EVENTS.ANALYZE_WINDOW:
                result = await post_ai_analysis({
                    ...request,
                    body: { 
                        json: () => Promise.resolve({
                            ...data,
                            sessionId,
                            source,
                            mode
                        })
                    }
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_QUOTE:
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_PRICE:
                result = await post_pricing_calculator({
                    ...request,
                    body: { 
                        json: () => Promise.resolve({
                            ...data,
                            sessionId,
                            source,
                            mode
                        })
                    }
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.GENERATE_QUOTE_EXPLANATION:
                result = await post_quote_generator({
                    ...request,
                    body: { 
                        json: () => Promise.resolve({
                            ...data,
                            sessionId,
                            source,
                            mode
                        })
                    }
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.EMAIL_QUOTE:
                result = await post_email_service({
                    ...request,
                    body: { 
                        json: () => Promise.resolve({
                            ...data,
                            sessionId,
                            source
                        })
                    }
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.SAVE_CUSTOMER:
                result = await post_customer_service({
                    ...request,
                    body: { 
                        json: () => Promise.resolve({
                            action: 'create',
                            customerData: data,
                            sessionId,
                            source,
                            mode
                        })
                    }
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.LOAD_INITIAL_DATA:
                result = await get_system_data({
                    ...request,
                    query: data
                });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGED:
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGEMENT:
                await processUserEngagement(data, source, mode);
                result = successResponse({ processed: true });
                break;
                
            case CONSTANTS.IFRAME_EVENTS.ERROR_OCCURRED:
            case CONSTANTS.IFRAME_EVENTS.ERROR:
                await processErrorOccurred(data, source);
                result = successResponse({ processed: true });
                break;
                
            default:
                console.warn(`⚠️ Unhandled iframe action: ${action}`);
                result = successResponse({ 
                    processed: false, 
                    message: `Action ${action} acknowledged but not handled`
                });
        }
        
        return result;
        
    } catch (error) {
        return handleError(error, 'post_iframe_message', { 
            source: request.body?.source,
            action: request.body?.action 
        });
    }
}

/**
 * Master message handler for iframe communication
 * UNIFIED central processor for all iframe events
 */
export async function handleMasterEstimatorMessage(event, context) {
    try {
        const { source, action, data, sessionId, mode } = event;
        
        console.log(`📨 Master handler processing: ${action} from ${source}`);
        
        // Validate event structure
        validateIframeMessage({ source, action });
        
        // Generate session ID if not provided
        const effectiveSessionId = sessionId || generateSessionId();
        
        // Create unified request object
        const request = {
            headers: context?.headers || {},
            body: {
                json: () => Promise.resolve({
                    ...data,
                    sessionId: effectiveSessionId,
                    source,
                    mode: mode || 'desktop'
                })
            },
            query: {}
        };
        
        // Route to appropriate handler
        switch (action) {
            case CONSTANTS.IFRAME_EVENTS.ANALYZE_WINDOW:
                return await post_ai_analysis(request);
                
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_QUOTE:
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_PRICE:
                return await post_pricing_calculator(request);
                
            case CONSTANTS.IFRAME_EVENTS.GENERATE_QUOTE_EXPLANATION:
                return await post_quote_generator(request);
                
            case CONSTANTS.IFRAME_EVENTS.EMAIL_QUOTE:
                return await post_email_service(request);
                
            case CONSTANTS.IFRAME_EVENTS.SAVE_CUSTOMER:
                return await post_customer_service({
                    ...request,
                    body: {
                        json: () => Promise.resolve({
                            action: 'create',
                            customerData: data,
                            sessionId: effectiveSessionId,
                            source,
                            mode: mode || 'desktop'
                        })
                    }
                });
                
            case CONSTANTS.IFRAME_EVENTS.LOAD_INITIAL_DATA:
                return await get_system_data(request);
                
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGED:
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGEMENT:
                await processUserEngagement(data, source, mode);
                return createIframeResponse(true, { processed: true }, 'User engagement tracked');
                
            case CONSTANTS.IFRAME_EVENTS.ERROR_OCCURRED:
            case CONSTANTS.IFRAME_EVENTS.ERROR:
                await processErrorOccurred(data, source);
                return createIframeResponse(true, { processed: true }, 'Error logged');
                
            default:
                console.warn(`⚠️ Unhandled iframe action in master handler: ${action}`);
                return createIframeResponse(false, null, `Action ${action} not supported`, action);
        }
        
    } catch (error) {
        console.error('❌ Error in handleMasterEstimatorMessage:', error);
        return createErrorResponse(error, 'handleMasterEstimatorMessage');
    }
}

// =====================================================================
// EXPORT ALL FUNCTIONS
// =====================================================================

export default {
    // HTTP Endpoints
    post_ai_analysis,
    post_pricing_calculator,
    post_quote_generator,
    post_email_service,
    post_customer_service,
    get_system_data,
    get_system_health,
    post_iframe_message,
    
    // Master Handler
    handleMasterEstimatorMessage,
    
    // Utility Functions
    successResponse,
    handleError,
    validateRequestBody,
    validateIframeRequest,
    generateSessionId,
    detectDeviceType,
    calculateLeadPriority,
    calculateFollowUpDate,
    generateLeadTags,
    calculateQualityScore,
    
    // Processing Functions
    processQuoteGenerated,
    processCustomerInfoUpdated,
    processPricingCalculated,
    processAIAnalysisCompleted,
    processUserEngagement,
    processErrorOccurred
};