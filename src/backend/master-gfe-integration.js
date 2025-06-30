The `master-gfe-integration.js` file serves as the unified HTTP Functions endpoint for the Good Faith Exteriors (GFE) Window Estimator system, handling all iframe communication and backend service integration [Prev Response, 259]. It acts as the central processor for all iframe events, ensuring consistency and synchronization with frontend protocols [Prev Response, 259]. This file consolidates the system's endpoints and integrates various core services [Prev Response, 189].

Below is the comprehensive code for `master-gfe-integration.js`, which is compatible with `gfe-window-estimator-endpoints.web.js` for full system connectivity, prior to the source data:

```javascript
// backend/master-gfe-integration.js

/**
 * Master GFE Integration - Good Faith Exteriors
 *
 * UNIFIED HTTP Functions endpoint for the Window Estimator system
 * Handles all iframe communication and backend service integration
 * SYNCHRONIZED with frontend iframe protocols
 * [Prev Response, 259, 320]
 */

import { ok, badRequest, serverError } from 'wix-http-functions'; //

// Import unified configuration and base utilities
import {
    COLLECTIONS, //
    SECRETS, //
    CONSTANTS, //
    FIELD_MAPPINGS, //
    createSuccessResponse, //
    createErrorResponse, //
    createIframeResponse, //
    generateUniqueId, //
    validateData, //
    validateIframeMessage, //
    isValidOrigin, //
    sanitizeForWix, //
    calculateUniversalInches //
} from './config/collections.js';

// Import core services from other backend modules
import {
    logSystemEvent, //
    logAnalyticsEvent, //
    saveAIAnalysisResult, //
    createCustomerLead, //
    createOrUpdateCustomer, //
    createQuoteItem, //
    updateQuoteItemWithExplanation, //
    getWindowProducts, //
    getWindowMaterials, //
    getWindowTypes, //
    getWindowBrands, //
    getWindowOptions, //
    getPricingConfiguration, //
    healthCheck, //
    insertRecord, //
    updateRecord //
} from './core/wix-data-service.web.js';

import {
    analyzeWindowImage, //
    generateQuoteExplanation, //
    validateMeasurements, //
    generateCustomerCommunication, //
    calculateAnalysisQualityScore //
} from './ai/anthropic-service.web.js';

import {
    calculateWindowQuote, //
    calculateSingleWindowPrice, //
    validatePricingInputs //
} from './core/pricing-service.web.js';

import {
    sendCustomerEmail, //
    sendQuoteEmail, //
    sendAppointmentReminder, //
    sendFollowupEmail //
} from './services/email-service.js';

// =====================================================================
// UNIFIED UTILITY FUNCTIONS (Internal to this file or re-exported)
// =====================================================================

/**
 * Creates standardized success response for all endpoints
 *
 */
function successResponse(data, message = CONSTANTS.SUCCESS.MESSAGE_PROCESSED, extra = {}) {
    return ok(createSuccessResponse(data, message, extra)); //
}

/**
 * Handles errors with proper logging and unified response format
 *
 */
function handleError(error, endpoint, context = {}) {
    console.error(`❌ Error in ${endpoint}:`, error); //
    // Log error to analytics
    logSystemEvent({
        eventType: CONSTANTS.EVENTS.ERROR_OCCURRED, //
        endpoint, //
        message: error.message || error, //
        stack: error.stack, // Not explicitly in but mentioned in
        ...context //
    }).catch(logError => console.error('Failed to log system event:', logError)); // Ensure logging doesn't block
    return serverError(createErrorResponse(error, endpoint)); //
}

/**
 * Validates incoming HTTP request origin for iframe security
 *
 */
function validateIframeRequest(request) {
    const origin = request.headers.origin || request.headers.referer; // Referer fallback for some contexts, common practice
    if (!isValidOrigin(origin)) { //
        throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_ORIGIN}: ${origin}`); //
    }
}

/**
 * Validates request body for required fields
 *
 */
function validateRequestBody(body, requiredFields) {
    const missingFields = requiredFields.filter(field => !Object.prototype.hasOwnProperty.call(body, field)); //
    if (missingFields.length > 0) {
        throw new Error(`${CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD}: ${missingFields.join(', ')}`); //
    }
    // Also check for empty strings/arrays for critical fields as implied by validation sources
    const emptyFields = requiredFields.filter(field => {
        const value = body[field];
        return (typeof value === 'string' && value.trim() === '') ||
               (Array.isArray(value) && value.length === 0) ||
               (value === null || value === undefined); // Check for null/undefined as well
    });
    if (emptyFields.length > 0) {
        throw new Error(`${CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD}: ${emptyFields.join(', ')} cannot be empty`); //
    }
}

/**
 * Generates a unique session ID
 *
 */
function generateSessionId() {
    return generateUniqueId('gfe_sess'); //
}

/**
 * Detects device type based on source or user agent
 *
 */
function detectDeviceType(source, userAgent = '') {
    if (source === CONSTANTS.IFRAME_SOURCES.MOBILE) return 'mobile'; //
    if ([CONSTANTS.IFRAME_SOURCES.WEBSITE, CONSTANTS.IFRAME_SOURCES.VELO_PAGE, CONSTANTS.IFRAME_SOURCES.AI_ESTIMATOR].includes(source)) { //
        // Simplified user agent check for mobile vs desktop/tablet
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50i|770s|802s|a wa|abac|ac(er|oo|er)|ai(ko|ob)|al(av|ca|co)|amoi|an(d|on)|aq(io|or)|au(di|m|mi)|bl(at|da)|br(e|v)w|bumb|by(eo|lo)|ga(me|u)|g1 u|g560|gf 5|g9an|go(\.w|od)|haie|hcit|hd(m|p)c|hd-4|ad(g|l)|hlv3|ht(c|ok)|hu(aw|tc)|i(0x|20|g4|g5|g6|im)|in(la|nk)|fetc|hp(ib|tp)|kgt|kzsm|le(no|xi)|lg( g|\/|k)|lkt|lloc|maga|maud|md-dm|me(mo|o0|s0|v |zo)|mi(o8|oa|oo)|mmig|mn(ch|t2|v4)|mt(r|c)|nexus|ob(g1|g5)|p10h|p2a|p3dm|p9ry|pa(nb|lc|tx)|qc(ad|bl|lg)|qo o|qwap|r1a|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|pn)|sc(01|h |sc)|sdk\/|se(c(|0|1)|47|mc|nd|ri)|sgh |shar|sie(|m)|sk-0|sl(45|id)|sm(al|ri|sh)|sy(01|mb)|t2(mo|v)|tdg |tel(i|m)|tim |t-mo|tk(ad|ak)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5|70|ad|eg|ne|ro|zo)|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(| )|webc|whit|wi(g |nc|nd)|ws(49|ut)|xfg |yamu|ze(v|v)|zeto|zte /i.test(userAgent.substr(0,4))) {
            return 'mobile';
        }
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }
    return 'unknown'; //
}

/**
 * Calculates lead priority based on estimated value and mode
 *
 */
function calculateLeadPriority(estimatedValue = 0, mode = 'desktop') {
    if (estimatedValue >= 10000) return 'high'; // High value project
    if (estimatedValue >= 5000 && mode === 'mobile') return 'high'; // Mobile high value
    if (estimatedValue >= 2000) return 'medium'; //
    return 'low'; //
}

/**
 * Calculates suggested follow-up date for a lead
 *
 */
function calculateFollowUpDate(estimatedValue = 0, mode = 'desktop') {
    const now = new Date();
    const priority = calculateLeadPriority(estimatedValue, mode);
    if (priority === 'high') {
        now.setHours(now.getHours() + 2); // Within 2 hours for high-value leads
    } else if (priority === 'medium') {
        now.setDate(now.getDate() + 1); // Next day for medium
    } else {
        now.setDate(now.getDate() + 3); // 3 days for low
    }
    return now.toISOString();
}

/**
 * Generates lead tags based on various data points
 *
 */
function generateLeadTags(pricing, specifications, source, mode, aiAnalysisUsed) {
    const tags = new Set();
    if (source) tags.add(source); //
    if (mode) tags.add(mode); //
    if (aiAnalysisUsed) tags.add('ai-analyzed'); //

    const totalAmount = pricing?.summary?.finalTotal || pricing?.totalAmount;
    if (totalAmount) {
        if (totalAmount >= 10000) tags.add('value-high'); //
        else if (totalAmount >= 5000) tags.add('value-medium'); //
        else if (totalAmount > 0) tags.add('value-low'); //
    }

    if (specifications && Array.isArray(specifications)) {
        specifications.forEach(window => {
            if (window.windowType) tags.add(`type-${window.windowType.toLowerCase().replace(/\s/g, '-')}`); //
            if (window.material) tags.add(`material-${window.material.toLowerCase().replace(/\s/g, '-')}`); //
        });
    }

    return Array.from(tags); //
}

/**
 * Calculates customer data completeness score
 *
 */
function calculateCustomerDataCompleteness(data) {
    const fields = ['customerName', 'customerEmail', 'customerPhone', 'projectAddress']; //
    const completed = fields.filter(field => !!(data[field] && String(data[field]).trim())).length; //
    return Math.round((completed / fields.length) * 100); //
}

/**
 * Calculates a quality score for AI analysis results.
 * This is a simplified version based on descriptions for the master integration.
 * The full logic is typically within `anthropic-service.web.js` (e.g., `calculateAnalysisQualityScore`).
 * (listed as an exported utility of the master)
 * (description)
 */
function calculateQualityScore(analysis) {
    // Re-route to the more detailed function from anthropic-service if available,
    // otherwise provide a basic calculation here.
    if (typeof calculateAnalysisQualityScore === 'function') {
        return calculateAnalysisQualityScore(analysis); // Assuming it's imported
    }

    let score = 0;
    const weights = {
        windowsDetected: 0.2,
        windowType: 0.2,
        material: 0.15,
        condition: 0.15,
        measurements: 0.1,
        recommendations: 0.1,
        confidence: 0.1 // Overall confidence from AI
    };

    if (analysis && analysis.analysisResults) {
        const results = analysis.analysisResults;
        if (typeof results.windowsDetected === 'number' && results.windowsDetected > 0) score += weights.windowsDetected;
        if (results.windowType) score += weights.windowType;
        if (results.material) score += weights.material;
        if (results.condition) score += weights.condition;
        if (results.measurements && results.measurements.width && results.measurements.height) score += weights.measurements;
        if (results.recommendations && results.recommendations.length > 0) score += weights.recommendations;
        if (typeof results.overallConfidence === 'number' && results.overallConfidence >= 0 && results.overallConfidence <= 100) {
             score += (results.overallConfidence / 100) * weights.confidence; // Scale confidence contribution
        }
    }
    return Math.round(score * 100); // Return score out of 100, suggests 0-100 range
}


// =====================================================================
// PROCESSING FUNCTIONS (for analytics and lead management)
// =====================================================================

/**
 * Processes successful quote generation for analytics and lead management.
 *
 */
async function processQuoteGenerated(quoteData, source, mode) {
    try {
        const totalAmount = quoteData.summary?.finalTotal || quoteData.totalAmount || 0; //
        const windowCount = quoteData.summary?.windowCount || quoteData.windowCount || 0; //

        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.CONVERSION_TRACKED, //
            action: 'quote_generated', //
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode: mode || 'desktop', //
            value: totalAmount, //
            details: {
                windowCount: windowCount, //
                totalQuantity: quoteData.summary?.totalQuantity || quoteData.totalQuantity, //
                averagePrice: totalAmount / windowCount, //
                materials: quoteData.windows?.map(w => w.material), //
                windowTypes: quoteData.windows?.map(w => w.windowType), //
                usedAIAnalysis: !!quoteData.aiAnalysisId //
            }
        });

        const leadPriority = calculateLeadPriority(totalAmount, mode); //
        const followUpDate = calculateFollowUpDate(totalAmount, mode); //
        const tags = generateLeadTags(quoteData, quoteData.windows, source, mode, !!quoteData.aiAnalysisId); //

        // Potentially trigger internal notifications for high-priority leads
        if (leadPriority === 'high') {
            console.log(`🔥 High priority lead generated: Quote total $${totalAmount}`); // Placeholder for actual notification
            // Example: await sendInternalNotification('High Priority Lead', `New high-value quote from ${quoteData.customerInfo?.customerName || 'unknown'}. Total: $${totalAmount}`);
        }

        return { priority: leadPriority, followUpDate, tags }; //

    } catch (error) {
        console.error('Error processing quote generated:', error); //
        return null;
    }
}

/**
 * Processes customer information updates for analytics.
 *
 */
async function processCustomerInfoUpdated(data, source) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.USER_ENGAGEMENT, //
            action: 'customer_info_updated', //
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            details: {
                hasName: !!data.customerName, //
                hasEmail: !!data.customerEmail, //
                hasPhone: !!data.customerPhone, //
                hasAddress: !!data.projectAddress, //
                completeness: calculateCustomerDataCompleteness(data) //
            }
        });
    } catch (error) {
        console.error('Error processing customer info update:', error); //
    }
}

/**
 * Processes pricing calculations for analytics.
 *
 */
async function processPricingCalculated(data, source) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.PRICING_CALCULATED, //
            action: 'quote_calculated', // Specific action for pricing calculation
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode: data.mode || 'desktop',
            value: data.total, //
            details: {
                windowCount: data.windowCount, //
                averagePrice: data.averagePrice, //
                pricePerUI: data.pricePerUI //
            }
        });
    } catch (error) {
        console.error('Error processing pricing calculated:', error); //
    }
}

/**
 * Processes AI analysis completion for analytics.
 *
 */
async function processAIAnalysisCompleted(analysisResult, sessionId, source, mode) {
    try {
        const quality = calculateQualityScore(analysisResult); //
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.AI_ANALYSIS_COMPLETED, //
            action: 'image_analyzed', //
            source: source || CONSTANTS.IFRAME_SOURCES.AI_ESTIMATOR, //
            mode: mode || 'desktop', //
            sessionId: sessionId, //
            qualityScore: quality, //
            details: {
                confidence: analysisResult.overallConfidence, //
                windowsDetected: analysisResult.windowsDetected, //
                measurementsDetected: !!(analysisResult.measurements?.width && analysisResult.measurements?.height), //
                windowType: analysisResult.windowType, //
                material: analysisResult.material, //
                condition: analysisResult.condition //
            }
        });
    } catch (error) {
        console.error('Error processing AI analysis completed:', error); //
    }
}

/**
 * Processes general user engagement events.
 *
 */
async function processUserEngagement(data, source, mode) {
    try {
        await logAnalyticsEvent({
            eventType: CONSTANTS.EVENTS.USER_ENGAGEMENT, //
            action: data.action || 'unknown', //
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode: mode || 'desktop', //
            details: data.details || {} //
        });
    } catch (error) {
        console.error('Error processing user engagement:', error); //
    }
}

/**
 * Processes error events for logging.
 *
 */
async function processErrorOccurred(data, source) {
    try {
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.ERROR_OCCURRED, //
            level: 'error', //
            source: source || CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            message: data.error || 'Unknown error from frontend', //
            details: data.details || {}, //
            userAgent: data.userAgent || 'N/A' // Additional detail from error logging description
        });
    } catch (error) {
        console.error('Error processing error event:', error); //
    }
}

// =====================================================================
// HTTP ENDPOINT FUNCTIONS (exposed via Wix HTTP Functions)
// All HTTP functions are exported using `export async function`
// [Prev Response, 259, 288]
// =====================================================================

/**
 * POST /_functions/ai-analysis
 * UNIFIED AI image analysis endpoint
 * [Prev Response, 265, 325]
 */
export async function post_ai_analysis(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //
        validateRequestBody(body, ['imageData']); //

        const {
            imageData,
            sessionId = generateSessionId(), //
            source = CONSTANTS.IFRAME_SOURCES.AI_ESTIMATOR, //
            mode = 'desktop' //
        } = body;

        const analysisResult = await analyzeWindowImage(imageData, { sessionId, source, mode, deviceType: detectDeviceType(source, request.headers['user-agent']) }); //

        if (!analysisResult.success) {
            throw new Error(analysisResult.error); //
        }

        const savedAnalysis = await saveAIAnalysisResult({ //
            sessionId: sessionId,
            originalImage: imageData,
            analysisResults: analysisResult.data,
            detectedMeasurements: analysisResult.data.measurements,
            confidenceScore: analysisResult.data.overallConfidence,
            aiRecommendations: analysisResult.data.recommendations,
            source: source,
            deviceType: detectDeviceType(source, request.headers['user-agent']),
            qualityScore: calculateQualityScore(analysisResult) //
        });

        await processAIAnalysisCompleted(analysisResult.data, sessionId, source, mode); //

        return successResponse({
            analysis: analysisResult.data, //
            savedAnalysisId: savedAnalysis.data._id, //
            sessionId, //
            usage: analysisResult.usage //
        }, CONSTANTS.SUCCESS.ANALYSIS_COMPLETE); //

    } catch (error) {
        return handleError(error, 'post_ai_analysis'); //
    }
}

/**
 * POST /_functions/pricing-calculator
 * UNIFIED pricing calculation endpoint
 * [Prev Response, 266, 326]
 */
export async function post_pricing_calculator(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //
        validateRequestBody(body, ['windows']); //

        const {
            windows,
            customerInfo = {},
            sessionId = generateSessionId(), //
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode = 'desktop' //
        } = body;

        // Validate each window's pricing inputs
        for (const window of windows) {
            validatePricingInputs(window); //
        }

        // Calculate quote with enhanced tracking
        const quoteResult = await calculateWindowQuote(windows, customerInfo, sessionId); //

        if (!quoteResult.success) {
            throw new Error(quoteResult.error); //
        }

        // Process analytics
        await processPricingCalculated({
            total: quoteResult.data.quote.summary.finalTotal, //
            windowCount: windows.length, //
            averagePrice: quoteResult.data.quote.summary.averagePrice, //
            pricePerUI: quoteResult.data.quote.pricing.pricePerUI, //
            mode,
            source
        }, source); //

        return successResponse({
            quote: quoteResult.data.quote, //
            breakdown: quoteResult.data.breakdown, //
            calculations: quoteResult.data.calculations, //
            sessionId //
        }, CONSTANTS.SUCCESS.QUOTE_CREATED); //

    } catch (error) {
        return handleError(error, 'post_pricing_calculator', {
            windowCount: request.body?.windows?.length //
        });
    }
}

/**
 * POST /_functions/quote-generator
 * UNIFIED quote generation and explanation endpoint
 * [Prev Response, 268, 328]
 */
export async function post_quote_generator(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //
        validateRequestBody(body, ['quoteData']); //

        const {
            quoteData,
            customerProfile = {},
            sessionId = generateSessionId(), //
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode = 'desktop', //
            saveQuote = true //
        } = body;

        // Generate explanation with enhanced context
        const explanationResult = await generateQuoteExplanation(quoteData, {
            ...customerProfile,
            source,
            mode,
            deviceType: detectDeviceType(source, request.headers['user-agent']) //
        });

        if (!explanationResult.success) {
            throw new Error(explanationResult.error); //
        }

        let quoteItemId = null;

        // Save quote if requested
        if (saveQuote) {
            const quoteItem = await createQuoteItem({ //
                sessionId: sessionId,
                customerId: customerProfile._id || null, // Assumed customerProfile might have an ID
                windowSpecifications: quoteData.windows,
                pricingDetails: quoteData.pricing,
                totalAmount: quoteData.summary.finalTotal,
                quoteStatus: 'generated',
                expirationDate: quoteData.metadata.expiresAt,
                source: source,
                mode: mode,
                deviceType: detectDeviceType(source, request.headers['user-agent'])
            });

            if (quoteItem.success) {
                quoteItemId = quoteItem.data._id; //
                // Update with explanation
                await updateQuoteItemWithExplanation(quoteItemId, {
                    explanation: explanationResult.data.explanation, //
                    explanationGenerated: new Date().toISOString() //
                });
            } else {
                 console.warn('Failed to save initial quote item:', quoteItem.error); // Log warning if saving fails
            }
        }

        // Process quote generated analytics
        const processingResult = await processQuoteGenerated(quoteData, source, mode); //

        return successResponse({
            explanation: explanationResult.data.explanation, //
            quoteId: quoteItemId, //
            sessionId, //
            usage: explanationResult.data.usage, //
            processing: processingResult //
        }, CONSTANTS.SUCCESS.QUOTE_CREATED); //

    } catch (error) {
        return handleError(error, 'post_quote_generator'); //
    }
}

/**
 * POST /_functions/email-service
 * UNIFIED email sending endpoint
 * [Prev Response, 271, 329]
 */
export async function post_email_service(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //
        validateRequestBody(body, ['type', 'customerEmail']); //

        const {
            type, //
            customerEmail, //
            customerName, //
            quoteData, //
            appointmentData, //
            sessionId = generateSessionId(), //
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE //
        } = body;

        let emailResult;

        switch (type) {
            case 'quote': //
                validateRequestBody(body, ['quoteData']); //
                emailResult = await sendQuoteEmail({ //
                    customerEmail, //
                    customerName, //
                    quoteData, //
                    sessionId, //
                    source // Pass source for logging
                });
                break;
            case 'appointment_reminder': //
                validateRequestBody(body, ['appointmentData']); //
                emailResult = await sendAppointmentReminder({ //
                    customerEmail, //
                    customerName, //
                    appointmentData, //
                    source // Pass source for logging
                });
                break;
            case 'follow_up': //
                validateRequestBody(body, ['customerEmail']); // For follow-up, customerEmail is critical
                emailResult = await sendFollowupEmail({
                    customerEmail,
                    customerName,
                    customerAddress: body.customerAddress, // Optional for follow-up
                    quoteData: body.quoteData, // Optional, can be used for context
                    source
                });
                break;
            default:
                throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_DATA}: Unsupported email type: ${type}`); //
        }

        if (!emailResult.success) {
            throw new Error(emailResult.error); //
        }

        // Log email sent system event
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.EMAIL_SENT, //
            emailType: type, //
            recipient: customerEmail, //
            sessionId, //
            source //
        });

        return successResponse({
            emailSent: true, //
            emailId: emailResult.data.emailId, //
            type, //
            recipient: customerEmail //
        }, CONSTANTS.SUCCESS.EMAIL_SENT); //

    } catch (error) {
        return handleError(error, 'post_email_service'); //
    }
}

/**
 * POST /_functions/customer-service
 * UNIFIED customer data management endpoint (create/update/create_lead)
 * [Prev Response, 274, 331]
 * This endpoint processes various customer-related actions, including lead creation and updates.
 */
export async function post_customer_service(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //
        validateRequestBody(body, ['action']); //

        const {
            action, //
            customerData, //
            sessionId = generateSessionId(), //
            source = CONSTANTS.IFRAME_SOURCES.WEBSITE, //
            mode = 'desktop' //
        } = body;

        let result;

        switch (action) {
            case 'create': //
            case 'update': //
                validateRequestBody(body, ['customerData']); //
                const enhancedCustomerData = { //
                    ...customerData,
                    sessionId,
                    source,
                    deviceType: detectDeviceType(source, request.headers['user-agent']), //
                    leadPriority: calculateLeadPriority(customerData.estimatedValue, mode), //
                    completeness: calculateCustomerDataCompleteness(customerData) //
                };
                result = await createOrUpdateCustomer(enhancedCustomerData); //
                // Process customer info update for analytics
                await processCustomerInfoUpdated(customerData, source); //
                break;
            case 'create_lead': //
                validateRequestBody(body, ['customerData']); //
                const leadData = { //
                    ...customerData,
                    sessionId,
                    source,
                    leadPriority: calculateLeadPriority(customerData.estimatedValue, mode), //
                    followUpDate: calculateFollowUpDate(customerData.estimatedValue, mode), //
                    tags: generateLeadTags( //
                        customerData.pricing,
                        customerData.specifications,
                        source,
                        mode,
                        !!(customerData.aiAnalysis || customerData.analysis) // Check if AI analysis was used
                    )
                };
                result = await createCustomerLead(leadData); //
                break;
            default:
                throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_DATA}: Unsupported customer action: ${action}`); //
        }

        if (!result.success) {
            throw new Error(result.error); //
        }

        return successResponse({
            customer: result.data, //
            action, //
            sessionId //
        }, CONSTANTS.SUCCESS.CUSTOMER_SAVED); //

    } catch (error) {
        return handleError(error, 'post_customer_service'); //
    }
}

/**
 * GET /_functions/system-data
 * UNIFIED system data endpoint for iframe initialization
 * Provides initial product, configuration, and UI constants to iframes.
 * [Prev Response, 277, 334]
 */
export async function get_system_data(request) {
    try {
        const query = request.query || {}; //
        const { type, includeAll = false } = query; //
        const data = {};

        // Load different data types based on request
        if (!type || type === 'products' || includeAll) {
            const productsResult = await getWindowProducts(); //
            data.products = productsResult.success ? productsResult.data : []; //
        }
        if (!type || type === 'materials' || includeAll) {
            const materialsResult = await getWindowMaterials(); //
            data.materials = materialsResult.success ? materialsResult.data : []; //
        }
        if (!type || type === 'windowTypes' || includeAll) {
            const windowTypesResult = await getWindowTypes(); //
            data.windowTypes = windowTypesResult.success ? windowTypesResult.data : []; //
        }
        if (!type || type === 'brands' || includeAll) {
            const brandsResult = await getWindowBrands(); //
            data.brands = brandsResult.success ? brandsResult.data : []; //
        }
        if (!type || type === 'options' || includeAll) {
            const optionsResult = await getWindowOptions(); //
            data.options = optionsResult.success ? optionsResult.data : []; //
        }
        if (!type || type === 'configuration' || includeAll) {
            const configResult = await getPricingConfiguration(); //
            data.configuration = configResult.success ? configResult.data : null; //
        }

        // Add UI constants for iframe consistency
        data.uiElements = CONSTANTS.UI_ELEMENT_IDS; //
        data.iframeEvents = CONSTANTS.IFRAME_EVENTS; //
        data.iframeSources = CONSTANTS.IFRAME_SOURCES; //
        data.companyInfo = CONSTANTS.COMPANY; // Added, as company info is common

        return successResponse(data); //

    } catch (error) {
        return handleError(error, 'get_system_data'); //
    }
}

/**
 * GET /_functions/system-health
 * UNIFIED system health check endpoint
 * Reports overall system status including database and constant counts.
 * [Prev Response, 279, 336]
 */
export async function get_system_health(request) {
    try {
        const healthResult = await healthCheck(); //
        const systemHealth = { //
            status: healthResult.success ? 'healthy' : 'unhealthy', //
            services: healthResult.data?.services || {}, //
            timestamp: new Date().toISOString(), //
            version: '2.0', //
            uptime: process.uptime ? Math.floor(process.uptime()) : 'unknown', // (Note: `process.uptime` is Node.js specific, may not be available in Wix Velo)
            constants: {
                uiElementsCount: Object.keys(CONSTANTS.UI_ELEMENT_IDS).length, //
                iframeEventsCount: Object.keys(CONSTANTS.IFRAME_EVENTS).length, //
                collectionsCount: Object.keys(COLLECTIONS).length //
            }
        };

        return successResponse({
            system: systemHealth //
        });

    } catch (error) {
        return handleError(error, 'get_system_health'); //
    }
}

/**
 * POST /_functions/iframe-message
 * UNIFIED central handler for all incoming iframe communication messages
 * This endpoint acts as a general router for messages from iframes to various backend functionalities.
 * [Prev Response, 280, 336]
 */
export async function post_iframe_message(request) {
    try {
        validateIframeRequest(request); //
        const body = await request.body.json(); //

        // Validate iframe message structure
        validateIframeMessage(body); //
        validateRequestBody(body, ['source', 'action']); //

        const {
            source, //
            action, //
            data = {}, //
            sessionId = generateSessionId(), //
            mode = 'desktop' //
        } = body;

        console.log(`📨 Processing iframe message: ${action} from ${source}`); //

        let result;

        // Create a mock request object that mirrors the structure expected by other post_ functions
        // This is necessary because post_iframe_message "re-routes" the request.
        const mockRequest = {
            headers: request.headers, // Pass original headers, e.g., for user-agent
            body: {
                json: () => Promise.resolve({
                    ...data,
                    sessionId,
                    source,
                    mode //
                })
            },
            query: data // For GET requests routed via POST_IFRAME_MESSAGE
        };

        switch (action) {
            case CONSTANTS.IFRAME_EVENTS.ANALYZE_WINDOW: //
                result = await post_ai_analysis(mockRequest); //
                break;
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_QUOTE: //
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_PRICE: //
                result = await post_pricing_calculator(mockRequest); //
                break;
            case CONSTANTS.IFRAME_EVENTS.GENERATE_QUOTE_EXPLANATION: //
                result = await post_quote_generator(mockRequest);
                break;
            case CONSTANTS.IFRAME_EVENTS.EMAIL_QUOTE: //
                // Email specific data needed
                mockRequest.body.json = () => Promise.resolve({
                    type: 'quote',
                    customerEmail: data.customerEmail,
                    customerName: data.customerName,
                    quoteData: data.quoteData,
                    sessionId,
                    source
                });
                result = await post_email_service(mockRequest); //
                break;
            case CONSTANTS.IFRAME_EVENTS.SAVE_CUSTOMER: //
                mockRequest.body.json = () => Promise.resolve({
                    action: 'create', // Or 'update', depending on logic; for simplicity assuming 'create'
                    customerData: data,
                    sessionId,
                    source,
                    mode
                });
                result = await post_customer_service(mockRequest); //
                break;
            case CONSTANTS.IFRAME_EVENTS.LOAD_INITIAL_DATA: //
                result = await get_system_data(mockRequest); //
                break;
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGED: //
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGEMENT: //
                await processUserEngagement(data, source, mode); //
                result = successResponse({ processed: true }); //
                break;
            case CONSTANTS.IFRAME_EVENTS.ERROR_OCCURRED: //
            case CONSTANTS.IFRAME_EVENTS.ERROR: //
                await processErrorOccurred(data, source); //
                result = successResponse({ processed: true }); //
                break;
            default:
                console.warn(`⚠️ Unhandled iframe action: ${action}`); //
                result = successResponse({
                    processed: false,
                    message: `${CONSTANTS.ERRORS.IFRAME.UNSUPPORTED_ACTION}: ${action}` //
                });
        }

        return result;

    } catch (error) {
        return handleError(error, 'post_iframe_message', {
            source: request.body?.source, //
            action: request.body?.action //
        });
    }
}

/**
 * Master message handler for iframe communication
 * UNIFIED central processor for all iframe events
 * This function is designed to be called by Wix's internal messaging API for iframes (e.g., `onMessage`).
 * It routes messages to the appropriate HTTP endpoint functions by constructing a compatible request object.
 * [Prev Response, 284, 339]
 */
export async function handleMasterEstimatorMessage(event, context) {
    try {
        const { source, action, data, sessionId, mode } = event; //
        console.log(`📨 Master handler processing: ${action} from ${source}`); //

        // Validate event structure
        validateIframeMessage({ source, action }); //

        // Generate session ID if not provided
        const effectiveSessionId = sessionId || generateUniqueId('gfe_sess'); //

        // Create unified request object to pass to other handlers
        const request = {
            headers: context?.headers || {}, //
            body: {
                json: () => Promise.resolve({
                    ...data,
                    sessionId: effectiveSessionId,
                    source,
                    mode: mode || 'desktop' //
                })
            },
            query: data // For GET requests routed via this handler
        };

        // Route to appropriate handler
        switch (action) {
            case CONSTANTS.IFRAME_EVENTS.ANALYZE_WINDOW: //
                return await post_ai_analysis(request); //
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_QUOTE: //
            case CONSTANTS.IFRAME_EVENTS.CALCULATE_PRICE: //
                return await post_pricing_calculator(request); //
            case CONSTANTS.IFRAME_EVENTS.GENERATE_QUOTE_EXPLANATION: //
                return await post_quote_generator(request); //
            case CONSTANTS.IFRAME_EVENTS.EMAIL_QUOTE: //
                // Email specific data needed
                request.body.json = () => Promise.resolve({
                    type: 'quote',
                    customerEmail: data.customerEmail,
                    customerName: data.customerName,
                    quoteData: data.quoteData,
                    sessionId: effectiveSessionId,
                    source
                });
                return await post_email_service(request); //
            case CONSTANTS.IFRAME_EVENTS.SAVE_CUSTOMER: //
                request.body.json = () => Promise.resolve({
                    action: 'create', // Or 'update'
                    customerData: data,
                    sessionId: effectiveSessionId,
                    source,
                    mode: mode || 'desktop'
                });
                return await post_customer_service(request); //
            case CONSTANTS.IFRAME_EVENTS.LOAD_INITIAL_DATA: //
                return await get_system_data(request); //
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGED: //
            case CONSTANTS.IFRAME_EVENTS.USER_ENGAGEMENT: //
                await processUserEngagement(data, source, mode); //
                return createIframeResponse(true, { processed: true }, 'User engagement tracked', action); //
            case CONSTANTS.IFRAME_EVENTS.ERROR_OCCURRED: //
            case CONSTANTS.IFRAME_EVENTS.ERROR: //
                await processErrorOccurred(data, source); //
                return createIframeResponse(true, { processed: true }, 'Error logged', action); //
            default:
                console.warn(`⚠️ Unhandled iframe action in master handler: ${action}`); //
                return createIframeResponse(false, null, `${CONSTANTS.ERRORS.IFRAME.UNSUPPORTED_ACTION}: ${action}`, action); //
        }

    } catch (error) {
        console.error('❌ Error in handleMasterEstimatorMessage:', error); //
        return createErrorResponse(error, 'handleMasterEstimatorMessage'); //
    }
}

// =====================================================================
// EXPORT ALL FUNCTIONS (as required for Wix HTTP Functions)
// =====================================================================

// Note: In Wix Velo, for HTTP functions (`.web.js`), individual functions
// are typically exposed directly via `export async function`.
// However, the source provided (``) shows a `export default { ... }` structure.
// This might indicate it's also designed as a web module (`.jsw`) or a pattern
// to centralize all exports. Following the explicit source for the export structure.

export default {
    // HTTP Endpoints
    post_ai_analysis, //
    post_pricing_calculator, //
    post_quote_generator, //
    post_email_service, //
    post_customer_service, //
    get_system_data, //
    get_system_health, //
    post_iframe_message, //

    // Master Handler
    handleMasterEstimatorMessage, //

    // Utility Functions (exported for potential internal use or testing, or re-export)
    successResponse, //
    handleError, //
    validateRequestBody, //
    validateIframeRequest, //
    generateSessionId, //
    detectDeviceType, //
    calculateLeadPriority, //
    calculateFollowUpDate, //
    generateLeadTags, //
    calculateCustomerDataCompleteness, // (listed implicitly as part of the master)
    calculateQualityScore, //

    // Processing Functions (exported for consistency if they are part of a larger module export)
    processQuoteGenerated, //
    processCustomerInfoUpdated, //
    processPricingCalculated, //
    processAIAnalysisCompleted, //
    processUserEngagement, //
    processErrorOccurred //
};
```