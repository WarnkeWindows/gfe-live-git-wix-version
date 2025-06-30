/**
 * Wix Data Service - Good Faith Exteriors
 * backend/core/wix-data-service.web.js
 * 
 * Comprehensive data management service for all Wix collections
 * Handles CRUD operations, caching, and data validation
 */

import wixData from 'wix-data';
import { 
    COLLECTIONS, 
    CONSTANTS, 
    FIELD_MAPPINGS,
    VALIDATION_SCHEMAS,
    createSuccessResponse, 
    createErrorResponse,
    generateUniqueId,
    validateData,
    sanitizeForWix
} from '../config/collections.js';

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Generates session ID for tracking
 */
export function generateSessionId() {
    return generateUniqueId('gfe_sess');
}

/**
 * Handles errors with proper logging
 */
export function handleError(error, endpoint, context = {}) {
    console.error(`❌ Error in ${endpoint}:`, error);
    
    // Log error to analytics (don't await to prevent circular dependency)
    logSystemEvent({
        eventType: CONSTANTS.EVENTS.ERROR_OCCURRED,
        level: 'error',
        message: `Data service error: ${endpoint}`,
        details: {
            error: error.message,
            endpoint,
            context
        }
    }).catch(logError => {
        console.error('Failed to log error:', logError);
    });
    
    return createErrorResponse(error, endpoint);
}

/**
 * Creates success response
 */
export function successResponse(data, message = 'Operation successful', extra = {}) {
    return createSuccessResponse(data, message, extra);
}

/**
 * Validates required fields in data object
 */
function validateRequiredFields(data, requiredFields, objectName = 'object') {
    if (!data || typeof data !== 'object') {
        throw new Error(`Invalid ${objectName}: must be an object`);
    }
    
    const missing = requiredFields.filter(field => {
        const value = data[field];
        return value === undefined || value === null || 
               (typeof value === 'string' && value.trim() === '');
    });
    
    if (missing.length > 0) {
        throw new Error(`Required fields missing in ${objectName}: ${missing.join(', ')}`);
    }
    
    return true;
}

/**
 * Safely stringifies objects for storage
 */
function safeStringify(obj) {
    try {
        return typeof obj === 'string' ? obj : JSON.stringify(obj);
    } catch (error) {
        console.warn('Failed to stringify object:', error);
        return typeof obj === 'object' ? '[Object]' : String(obj);
    }
}

/**
 * Safely parses JSON strings
 */
function safeParse(str) {
    try {
        return typeof str === 'string' ? JSON.parse(str) : str;
    } catch (error) {
        return str; // Return original if parsing fails
    }
}

/**
 * Validates email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number format
 */
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// =====================================================================
// ANALYTICS & LOGGING FUNCTIONS
// =====================================================================

/**
 * Logs system events for monitoring and debugging
 */
export async function logSystemEvent(eventData) {
    try {
        validateRequiredFields(eventData, ['eventType'], 'event data');
        
        const logEntry = sanitizeForWix({
            eventId: generateUniqueId('evt'),
            eventType: eventData.eventType,
            level: eventData.level || 'info',
            message: eventData.message || '',
            details: safeStringify(eventData.details || {}),
            endpoint: eventData.endpoint || '',
            userId: eventData.userId || '',
            sessionId: eventData.sessionId || '',
            source: eventData.source || 'system',
            timestamp: new Date().toISOString(),
            environment: 'production'
        });
        
        const result = await wixData.insert(COLLECTIONS.analytics, logEntry);
        return successResponse({ eventId: result._id });
        
    } catch (error) {
        console.error('Failed to log system event:', error);
        return createErrorResponse(error, 'logSystemEvent');
    }
}

/**
 * Logs analytics events for business intelligence
 */
export async function logAnalyticsEvent(eventData) {
    try {
        validateRequiredFields(eventData, ['eventType'], 'analytics event');
        
        const analyticsEntry = sanitizeForWix({
            eventId: generateUniqueId('analytics'),
            eventType: eventData.eventType,
            action: eventData.action || '',
            source: eventData.source || 'website',
            mode: eventData.mode || 'desktop',
            value: eventData.value || 0,
            details: safeStringify(eventData.details || {}),
            sessionId: eventData.sessionId || '',
            userId: eventData.userId || '',
            qualityScore: eventData.qualityScore || 0,
            timestamp: new Date().toISOString()
        });
        
        const result = await wixData.insert(COLLECTIONS.analytics, analyticsEntry);
        return successResponse({ analyticsId: result._id });
        
    } catch (error) {
        console.error('Failed to log analytics event:', error);
        return createErrorResponse(error, 'logAnalyticsEvent');
    }
}

/**
 * Gets analytics data with filtering
 */
export async function getAnalytics(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.analytics);
        
        // Apply filters
        if (filters.eventType) {
            query = query.eq('eventType', filters.eventType);
        }
        
        if (filters.source) {
            query = query.eq('source', filters.source);
        }
        
        if (filters.startDate) {
            query = query.ge('timestamp', filters.startDate);
        }
        
        if (filters.endDate) {
            query = query.le('timestamp', filters.endDate);
        }
        
        if (filters.sessionId) {
            query = query.eq('sessionId', filters.sessionId);
        }
        
        // Sort by timestamp descending
        query = query.descending('timestamp');
        
        // Limit results
        const limit = Math.min(filters.limit || 100, 1000);
        query = query.limit(limit);
        
        const result = await query.find();
        
        // Parse details back to objects
        const events = result.items.map(item => ({
            ...item,
            details: safeParse(item.details)
        }));
        
        return successResponse({
            events,
            totalCount: result.totalCount || events.length
        });
        
    } catch (error) {
        return handleError(error, 'getAnalytics');
    }
}

// =====================================================================
// AI ANALYSIS FUNCTIONS
// =====================================================================

/**
 * Saves AI analysis results
 */
export async function saveAIAnalysisResult(resultData) {
    try {
        validateRequiredFields(resultData, ['sessionId'], 'AI analysis result');
        
        const analysisData = sanitizeForWix({
            analysisId: generateUniqueId('ai_analysis'),
            sessionId: resultData.sessionId,
            originalImage: resultData.originalImage || '',
            analysisResults: safeStringify(resultData.analysisResults || {}),
            detectedMeasurements: safeStringify(resultData.detectedMeasurements || {}),
            confidenceScore: parseFloat(resultData.confidenceScore || 0),
            aiRecommendations: safeStringify(resultData.aiRecommendations || {}),
            source: resultData.source || 'website',
            deviceType: resultData.deviceType || 'unknown',
            timestamp: new Date().toISOString(),
            status: 'completed'
        });
        
        const result = await wixData.insert(COLLECTIONS.aiWindowMeasureService, analysisData);
        
        return successResponse({
            analysisId: result._id,
            sessionId: resultData.sessionId
        });
        
    } catch (error) {
        return handleError(error, 'saveAIAnalysisResult', { sessionId: resultData?.sessionId });
    }
}

/**
 * Gets AI analysis results by filters
 */
export async function getAIAnalysisResults(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.aiWindowMeasureService);
        
        if (filters.sessionId) {
            query = query.eq('sessionId', filters.sessionId);
        }
        
        if (filters.source) {
            query = query.eq('source', filters.source);
        }
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        query = query.descending('timestamp');
        
        const limit = Math.min(filters.limit || 50, 500);
        query = query.limit(limit);
        
        const result = await query.find();
        
        // Parse complex fields back to objects
        const analyses = result.items.map(item => ({
            ...item,
            analysisResults: safeParse(item.analysisResults),
            detectedMeasurements: safeParse(item.detectedMeasurements),
            aiRecommendations: safeParse(item.aiRecommendations)
        }));
        
        return successResponse({
            analyses,
            totalCount: result.totalCount || analyses.length
        });
        
    } catch (error) {
        return handleError(error, 'getAIAnalysisResults');
    }
}

/**
 * Gets AI analysis by session
 */
export async function getAIAnalysisBySession(sessionId) {
    try {
        if (!sessionId) {
            throw new Error('Session ID is required');
        }
        
        const result = await wixData.query(COLLECTIONS.aiWindowMeasureService)
            .eq('sessionId', sessionId)
            .descending('timestamp')
            .limit(1)
            .find();
        
        if (result.items.length === 0) {
            return successResponse({ analysis: null });
        }
        
        const analysis = result.items[0];
        analysis.analysisResults = safeParse(analysis.analysisResults);
        analysis.detectedMeasurements = safeParse(analysis.detectedMeasurements);
        analysis.aiRecommendations = safeParse(analysis.aiRecommendations);
        
        return successResponse({ analysis });
        
    } catch (error) {
        return handleError(error, 'getAIAnalysisBySession', { sessionId });
    }
}

// =====================================================================
// CUSTOMER MANAGEMENT FUNCTIONS
// =====================================================================

/**
 * Creates or updates customer record
 */
export async function createOrUpdateCustomer(customerData) {
    try {
        validateRequiredFields(customerData, ['customerName', 'customerEmail'], 'customer data');
        
        if (!isValidEmail(customerData.customerEmail)) {
            throw new Error('Invalid email format');
        }
        
        if (customerData.customerPhone && !isValidPhone(customerData.customerPhone)) {
            throw new Error('Invalid phone number format');
        }
        
        // Check if customer already exists
        const existingCustomer = await wixData.query(COLLECTIONS.customers)
            .eq('customerEmail', customerData.customerEmail)
            .limit(1)
            .find();
        
        const customerRecord = sanitizeForWix({
            customerId: customerData.customerId || generateUniqueId('customer'),
            customerName: customerData.customerName,
            customerEmail: customerData.customerEmail,
            customerPhone: customerData.customerPhone || '',
            projectAddress: customerData.projectAddress || '',
            projectNotes: customerData.projectNotes || '',
            sessionId: customerData.sessionId || '',
            source: customerData.source || 'website',
            deviceType: customerData.deviceType || 'unknown',
            leadPriority: customerData.leadPriority || 'medium',
            leadStatus: customerData.leadStatus || 'new',
            estimatedValue: parseFloat(customerData.estimatedValue || 0),
            followUpDate: customerData.followUpDate || new Date().toISOString(),
            tags: safeStringify(customerData.tags || []),
            lastUpdated: new Date().toISOString()
        });
        
        let result;
        if (existingCustomer.items.length > 0) {
            // Update existing customer
            customerRecord._id = existingCustomer.items[0]._id;
            result = await wixData.update(COLLECTIONS.customers, customerRecord);
        } else {
            // Create new customer
            customerRecord.dateCreated = new Date().toISOString();
            result = await wixData.insert(COLLECTIONS.customers, customerRecord);
        }
        
        return successResponse({
            customerId: result._id,
            customer: result,
            action: existingCustomer.items.length > 0 ? 'updated' : 'created'
        });
        
    } catch (error) {
        return handleError(error, 'createOrUpdateCustomer', { email: customerData?.customerEmail });
    }
}

/**
 * Creates customer lead
 */
export async function createCustomerLead(customerData) {
    try {
        validateRequiredFields(customerData, ['customerName', 'customerEmail'], 'customer lead data');
        
        const leadData = {
            ...customerData,
            leadStatus: 'new',
            dateCreated: new Date().toISOString()
        };
        
        return await createOrUpdateCustomer(leadData);
        
    } catch (error) {
        return handleError(error, 'createCustomerLead');
    }
}

/**
 * Updates customer lead status
 */
export async function updateCustomerLeadStatus(leadId, newStatus) {
    try {
        if (!leadId || !newStatus) {
            throw new Error('Lead ID and new status are required');
        }
        
        const updateData = {
            leadStatus: newStatus,
            lastUpdated: new Date().toISOString()
        };
        
        if (newStatus === 'contacted') {
            updateData.lastContactDate = new Date().toISOString();
        }
        
        const result = await wixData.update(COLLECTIONS.customers, updateData, leadId);
        
        // Log status change
        await logSystemEvent({
            eventType: 'lead_status_updated',
            message: `Lead status updated to ${newStatus}`,
            details: {
                leadId,
                newStatus,
                oldStatus: result.leadStatus
            }
        });
        
        return successResponse({
            leadId,
            newStatus,
            customer: result
        });
        
    } catch (error) {
        return handleError(error, 'updateCustomerLeadStatus', { leadId, newStatus });
    }
}

/**
 * Gets customer details by ID
 */
export async function getCustomerDetails(customerId) {
    try {
        if (!customerId) {
            throw new Error('Customer ID is required');
        }
        
        const result = await wixData.get(COLLECTIONS.customers, customerId);
        
        if (!result) {
            return successResponse({ customer: null });
        }
        
        // Parse complex fields
        result.tags = safeParse(result.tags);
        
        return successResponse({ customer: result });
        
    } catch (error) {
        return handleError(error, 'getCustomerDetails', { customerId });
    }
}

/**
 * Gets customer by email
 */
export async function getCustomerByEmail(email) {
    try {
        if (!email || !isValidEmail(email)) {
            throw new Error('Valid email is required');
        }
        
        const result = await wixData.query(COLLECTIONS.customers)
            .eq('customerEmail', email)
            .limit(1)
            .find();
        
        if (result.items.length === 0) {
            return successResponse({ customer: null });
        }
        
        const customer = result.items[0];
        customer.tags = safeParse(customer.tags);
        
        return successResponse({ customer });
        
    } catch (error) {
        return handleError(error, 'getCustomerByEmail', { email });
    }
}

/**
 * Gets all customers with filtering
 */
export async function getCustomers(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.customers);
        
        if (filters.leadStatus) {
            query = query.eq('leadStatus', filters.leadStatus);
        }
        
        if (filters.leadPriority) {
            query = query.eq('leadPriority', filters.leadPriority);
        }
        
        if (filters.source) {
            query = query.eq('source', filters.source);
        }
        
        query = query.descending('lastUpdated');
        
        const limit = Math.min(filters.limit || 100, 1000);
        query = query.limit(limit);
        
        const result = await query.find();
        
        // Parse complex fields
        const customers = result.items.map(customer => ({
            ...customer,
            tags: safeParse(customer.tags)
        }));
        
        return successResponse({
            customers,
            totalCount: result.totalCount || customers.length
        });
        
    } catch (error) {
        return handleError(error, 'getCustomers');
    }
}

// =====================================================================
// QUOTE MANAGEMENT FUNCTIONS
// =====================================================================

/**
 * Creates quote item
 */
export async function createQuoteItem(quoteData) {
    try {
        validateRequiredFields(quoteData, ['sessionId'], 'quote data');
        
        const quoteItem = sanitizeForWix({
            quoteId: generateUniqueId('quote'),
            sessionId: quoteData.sessionId,
            customerId: quoteData.customerId || '',
            windowSpecifications: safeStringify(quoteData.windowSpecifications || {}),
            pricingDetails: safeStringify(quoteData.pricingDetails || {}),
            totalAmount: parseFloat(quoteData.totalAmount || 0),
            quoteStatus: quoteData.quoteStatus || 'generated',
            source: quoteData.source || 'website',
            deviceType: quoteData.deviceType || 'unknown',
            leadPriority: quoteData.leadPriority || 'medium',
            dateCreated: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            lastUpdated: new Date().toISOString()
        });
        
        const result = await wixData.insert(COLLECTIONS.quoteItems, quoteItem);
        
        // Log quote creation
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.QUOTE_GENERATED,
            message: 'Quote created successfully',
            details: {
                quoteId: result._id,
                totalAmount: quoteData.totalAmount,
                sessionId: quoteData.sessionId
            }
        });
        
        return successResponse({
            quoteId: result._id,
            quote: result
        });
        
    } catch (error) {
        return handleError(error, 'createQuoteItem', { sessionId: quoteData?.sessionId });
    }
}

/**
 * Updates quote item with explanation
 */
export async function updateQuoteItemWithExplanation(quoteId, explanationData) {
    try {
        if (!quoteId) {
            throw new Error('Quote ID is required');
        }
        
        const updateData = {
            quoteExplanation: explanationData.explanation || '',
            explanationGenerated: explanationData.explanationGenerated || new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        const result = await wixData.update(COLLECTIONS.quoteItems, updateData, quoteId);
        
        return successResponse({
            quoteId,
            updated: true,
            quote: result
        });
        
    } catch (error) {
        return handleError(error, 'updateQuoteItemWithExplanation', { quoteId });
    }
}

/**
 * Gets quote items with filtering
 */
export async function getQuoteItems(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.quoteItems);
        
        if (filters.sessionId) {
            query = query.eq('sessionId', filters.sessionId);
        }
        
        if (filters.customerId) {
            query = query.eq('customerId', filters.customerId);
        }
        
        if (filters.quoteStatus) {
            query = query.eq('quoteStatus', filters.quoteStatus);
        }
        
        if (filters.minAmount) {
            query = query.ge('totalAmount', parseFloat(filters.minAmount));
        }
        
        if (filters.maxAmount) {
            query = query.le('totalAmount', parseFloat(filters.maxAmount));
        }
        
        query = query.descending('dateCreated');
        
        const limit = Math.min(filters.limit || 100, 1000);
        query = query.limit(limit);
        
        const result = await query.find();
        
        // Parse complex fields
        const quotes = result.items.map(quote => ({
            ...quote,
            windowSpecifications: safeParse(quote.windowSpecifications),
            pricingDetails: safeParse(quote.pricingDetails)
        }));
        
        return successResponse({
            quotes,
            totalCount: result.totalCount || quotes.length
        });
        
    } catch (error) {
        return handleError(error, 'getQuoteItems');
    }
}

/**
 * Gets quote by ID
 */
export async function getQuoteById(quoteId) {
    try {
        if (!quoteId) {
            throw new Error('Quote ID is required');
        }
        
        const result = await wixData.get(COLLECTIONS.quoteItems, quoteId);
        
        if (!result) {
            return successResponse({ quote: null });
        }
        
        // Parse complex fields
        result.windowSpecifications = safeParse(result.windowSpecifications);
        result.pricingDetails = safeParse(result.pricingDetails);
        
        return successResponse({ quote: result });
        
    } catch (error) {
        return handleError(error, 'getQuoteById', { quoteId });
    }
}

// =====================================================================
// PROJECT MANAGEMENT FUNCTIONS
// =====================================================================

/**
 * Creates project
 */
export async function createProject(projectData) {
    try {
        validateRequiredFields(projectData, ['projectName', 'customerId'], 'project data');
        
        const project = sanitizeForWix({
            projectId: generateUniqueId('project'),
            projectName: projectData.projectName,
            customerId: projectData.customerId,
            projectDescription: projectData.projectDescription || '',
            projectAddress: projectData.projectAddress || '',
            projectStatus: projectData.projectStatus || 'planning',
            estimatedValue: parseFloat(projectData.estimatedValue || 0),
            startDate: projectData.startDate || new Date().toISOString(),
            expectedCompletion: projectData.expectedCompletion || '',
            windowSpecs: safeStringify(projectData.windowSpecs || {}),
            notes: projectData.notes || '',
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        const result = await wixData.insert(COLLECTIONS.projects, project);
        
        return successResponse({
            projectId: result._id,
            project: result
        });
        
    } catch (error) {
        return handleError(error, 'createProject');
    }
}

/**
 * Gets project details by ID
 */
export async function getProjectDetails(projectId) {
    try {
        if (!projectId) {
            throw new Error('Project ID is required');
        }
        
        const result = await wixData.get(COLLECTIONS.projects, projectId);
        
        if (!result) {
            return successResponse({ project: null });
        }
        
        // Parse complex fields
        result.windowSpecs = safeParse(result.windowSpecs);
        
        return successResponse({ project: result });
        
    } catch (error) {
        return handleError(error, 'getProjectDetails', { projectId });
    }
}

// =====================================================================
// APPOINTMENT MANAGEMENT FUNCTIONS
// =====================================================================

/**
 * Creates appointment
 */
export async function createAppointment(appointmentData) {
    try {
        validateRequiredFields(appointmentData, ['customerId', 'appointmentDate'], 'appointment data');
        
        const appointment = sanitizeForWix({
            appointmentId: generateUniqueId('appointment'),
            customerId: appointmentData.customerId,
            appointmentDate: appointmentData.appointmentDate,
            appointmentTime: appointmentData.appointmentTime || '',
            appointmentType: appointmentData.appointmentType || 'consultation',
            status: appointmentData.status || 'scheduled',
            notes: appointmentData.notes || '',
            estimatorName: appointmentData.estimatorName || '',
            contactMethod: appointmentData.contactMethod || 'phone',
            reminderSent: 'false',
            dateCreated: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        
        const result = await wixData.insert(COLLECTIONS.bookingsAppointments, appointment);
        
        // Log appointment creation
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.APPOINTMENT_SCHEDULED,
            message: 'Appointment scheduled successfully',
            details: {
                appointmentId: result._id,
                customerId: appointmentData.customerId,
                appointmentDate: appointmentData.appointmentDate
            }
        });
        
        return successResponse({
            appointmentId: result._id,
            appointment: result
        });
        
    } catch (error) {
        return handleError(error, 'createAppointment');
    }
}

/**
 * Gets appointments with filtering
 */
export async function getAppointments(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.bookingsAppointments);
        
        if (filters.customerId) {
            query = query.eq('customerId', filters.customerId);
        }
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        if (filters.appointmentType) {
            query = query.eq('appointmentType', filters.appointmentType);
        }
        
        if (filters.startDate) {
            query = query.ge('appointmentDate', filters.startDate);
        }
        
        if (filters.endDate) {
            query = query.le('appointmentDate', filters.endDate);
        }
        
        query = query.ascending('appointmentDate');
        
        const limit = Math.min(filters.limit || 100, 1000);
        query = query.limit(limit);
        
        const result = await query.find();
        
        return successResponse({
            appointments: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getAppointments');
    }
}

// =====================================================================
// PRODUCT DATA FUNCTIONS
// =====================================================================

/**
 * Gets window products
 */
export async function getWindowProducts(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.windowProductsMasterCatalog);
        
        if (filters.brand) {
            query = query.eq('brand', filters.brand);
        }
        
        if (filters.material) {
            query = query.eq('material', filters.material);
        }
        
        if (filters.windowType) {
            query = query.eq('windowType', filters.windowType);
        }
        
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active.toString());
        }
        
        query = query.ascending('productName');
        
        const limit = Math.min(filters.limit || 100, 1000);
        query = query.limit(limit);
        
        const result = await query.find();
        
        return successResponse({
            products: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getWindowProducts');
    }
}

/**
 * Gets window materials
 */
export async function getWindowMaterials(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.materials);
        
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active.toString());
        }
        
        query = query.ascending('materialName');
        
        const result = await query.find();
        
        return successResponse({
            materials: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getWindowMaterials');
    }
}

/**
 * Gets materials (alias for getWindowMaterials)
 */
export async function getMaterials(filters = {}) {
    return await getWindowMaterials(filters);
}

/**
 * Gets window types
 */
export async function getWindowTypes(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.windowTypes);
        
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active.toString());
        }
        
        query = query.ascending('typeName');
        
        const result = await query.find();
        
        return successResponse({
            windowTypes: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getWindowTypes');
    }
}

/**
 * Gets window brands
 */
export async function getWindowBrands(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.windowBrands);
        
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active.toString());
        }
        
        query = query.ascending('brandName');
        
        const result = await query.find();
        
        return successResponse({
            brands: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getWindowBrands');
    }
}

/**
 * Gets window options
 */
export async function getWindowOptions(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.windowOptions);
        
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        
        if (filters.active !== undefined) {
            query = query.eq('active', filters.active.toString());
        }
        
        query = query.ascending('optionName');
        
        const result = await query.find();
        
        return successResponse({
            options: result.items,
            totalCount: result.totalCount || result.items.length
        });
        
    } catch (error) {
        return handleError(error, 'getWindowOptions');
    }
}

/**
 * Gets pricing configuration
 */
export async function getPricingConfiguration() {
    try {
        const result = await wixData.query(COLLECTIONS.baseUICalculator)
            .eq('active', 'true')
            .limit(1)
            .find();
        
        if (result.items.length === 0) {
            // Return default configuration if none found
            return successResponse({
                config: CONSTANTS.DEFAULT_PRICING,
                usingDefaults: true
            });
        }
        
        const config = result.items[0];
        
        // Parse configuration fields
        const parsedConfig = {
            pricePerUI: parseFloat(config.pricePerUI || CONSTANTS.DEFAULT_PRICING.pricePerUI),
            salesMarkup: parseFloat(config.salesMarkup || CONSTANTS.DEFAULT_PRICING.salesMarkup),
            installationRate: parseFloat(config.installationRate || CONSTANTS.DEFAULT_PRICING.installationRate),
            taxRate: parseFloat(config.taxRate || CONSTANTS.DEFAULT_PRICING.taxRate),
            hiddenMarkup: parseFloat(config.hiddenMarkup || CONSTANTS.DEFAULT_PRICING.hiddenMarkup),
            minimumOrder: parseFloat(config.minimumOrder || CONSTANTS.DEFAULT_PRICING.minimumOrder)
        };
        
        return successResponse({
            config: parsedConfig,
            usingDefaults: false
        });
        
    } catch (error) {
        return handleError(error, 'getPricingConfiguration');
    }
}

// =====================================================================
// GENERIC CRUD FUNCTIONS
// =====================================================================

/**
 * Generic insert record function
 */
export async function insertRecord(collectionName, data) {
    try {
        if (!COLLECTIONS[collectionName] && !Object.values(COLLECTIONS).includes(collectionName)) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        const collection = COLLECTIONS[collectionName] || collectionName;
        const sanitizedData = sanitizeForWix(data);
        
        const result = await wixData.insert(collection, sanitizedData);
        
        return successResponse({
            recordId: result._id,
            record: result
        });
        
    } catch (error) {
        return handleError(error, 'insertRecord', { collection: collectionName });
    }
}

/**
 * Generic update record function
 */
export async function updateRecord(collectionName, data, recordId) {
    try {
        if (!COLLECTIONS[collectionName] && !Object.values(COLLECTIONS).includes(collectionName)) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        if (!recordId) {
            throw new Error('Record ID is required for update');
        }
        
        const collection = COLLECTIONS[collectionName] || collectionName;
        const sanitizedData = sanitizeForWix(data);
        sanitizedData.lastUpdated = new Date().toISOString();
        
        const result = await wixData.update(collection, sanitizedData, recordId);
        
        return successResponse({
            recordId,
            record: result
        });
        
    } catch (error) {
        return handleError(error, 'updateRecord', { collection: collectionName, recordId });
    }
}

/**
 * Generic get record function
 */
export async function getRecord(collectionName, recordId) {
    try {
        if (!COLLECTIONS[collectionName] && !Object.values(COLLECTIONS).includes(collectionName)) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        if (!recordId) {
            throw new Error('Record ID is required');
        }
        
        const collection = COLLECTIONS[collectionName] || collectionName;
        const result = await wixData.get(collection, recordId);
        
        return successResponse({
            record: result
        });
        
    } catch (error) {
        return handleError(error, 'getRecord', { collection: collectionName, recordId });
    }
}

/**
 * Generic delete record function
 */
export async function deleteRecord(collectionName, recordId) {
    try {
        if (!COLLECTIONS[collectionName] && !Object.values(COLLECTIONS).includes(collectionName)) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        if (!recordId) {
            throw new Error('Record ID is required');
        }
        
        const collection = COLLECTIONS[collectionName] || collectionName;
        await wixData.remove(collection, recordId);
        
        return successResponse({
            recordId,
            deleted: true
        });
        
    } catch (error) {
        return handleError(error, 'deleteRecord', { collection: collectionName, recordId });
    }
}

// =====================================================================
// BULK OPERATIONS
// =====================================================================

/**
 * Bulk insert records
 */
export async function bulkInsert(collectionName, items) {
    try {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Items must be a non-empty array');
        }
        
        if (!COLLECTIONS[collectionName] && !Object.values(COLLECTIONS).includes(collectionName)) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        const collection = COLLECTIONS[collectionName] || collectionName;
        const sanitizedItems = items.map(item => sanitizeForWix(item));
        
        const results = await wixData.bulkInsert(collection, sanitizedItems);
        
        return successResponse({
            inserted: results.inserted,
            errors: results.errors || [],
            totalProcessed: items.length
        });
        
    } catch (error) {
        return handleError(error, 'bulkInsert', { collection: collectionName, itemCount: items?.length });
    }
}

/**
 * Search across all collections
 */
export async function searchAllCollections(searchTerm, collectionKeys = [], options = {}) {
    try {
        if (!searchTerm || searchTerm.trim() === '') {
            throw new Error('Search term is required');
        }
        
        const collectionsToSearch = collectionKeys.length > 0 
            ? collectionKeys 
            : Object.keys(COLLECTIONS);
        
        const searchResults = {};
        const limit = Math.min(options.limitPerCollection || 10, 50);
        
        for (const collectionKey of collectionsToSearch) {
            try {
                const collection = COLLECTIONS[collectionKey];
                if (!collection) continue;
                
                // Simple text search (Wix doesn't support full-text search on all fields)
                const query = wixData.query(collection)
                    .limit(limit);
                
                const result = await query.find();
                
                // Filter results that contain the search term
                const filteredItems = result.items.filter(item => {
                    const searchableText = Object.values(item)
                        .filter(value => typeof value === 'string')
                        .join(' ')
                        .toLowerCase();
                    
                    return searchableText.includes(searchTerm.toLowerCase());
                });
                
                if (filteredItems.length > 0) {
                    searchResults[collectionKey] = filteredItems;
                }
                
            } catch (collectionError) {
                console.warn(`Search failed for collection ${collectionKey}:`, collectionError);
            }
        }
        
        return successResponse({
            searchTerm,
            results: searchResults,
            collectionsSearched: collectionsToSearch.length
        });
        
    } catch (error) {
        return handleError(error, 'searchAllCollections');
    }
}

// =====================================================================
// SYSTEM HEALTH & MONITORING
// =====================================================================

/**
 * Checks database health
 */
export async function checkDatabaseHealth() {
    try {
        const startTime = Date.now();
        
        // Test basic query on each critical collection
        const healthChecks = {};
        const criticalCollections = ['customers', 'analytics', 'quoteItems'];
        
        for (const collectionKey of criticalCollections) {
            try {
                const collection = COLLECTIONS[collectionKey];
                const testResult = await wixData.query(collection)
                    .limit(1)
                    .find();
                
                healthChecks[collectionKey] = {
                    status: 'healthy',
                    recordCount: testResult.totalCount || 0
                };
                
            } catch (error) {
                healthChecks[collectionKey] = {
                    status: 'unhealthy',
                    error: error.message
                };
            }
        }
        
        const responseTime = Date.now() - startTime;
        const overallStatus = Object.values(healthChecks).every(check => check.status === 'healthy') 
            ? 'healthy' 
            : 'unhealthy';
        
        return successResponse({
            status: overallStatus,
            responseTime,
            checks: healthChecks,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return handleError(error, 'checkDatabaseHealth');
    }
}

/**
 * Gets collection statistics
 */
export async function getCollectionStatistics() {
    try {
        const stats = {};
        
        for (const [key, collection] of Object.entries(COLLECTIONS)) {
            try {
                const result = await wixData.query(collection)
                    .limit(1)
                    .find();
                
                stats[key] = {
                    name: collection,
                    recordCount: result.totalCount || 0,
                    status: 'accessible'
                };
                
            } catch (error) {
                stats[key] = {
                    name: collection,
                    recordCount: 0,
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        return successResponse({
            collections: stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return handleError(error, 'getCollectionStatistics');
    }
}

/**
 * Comprehensive health check
 */
export async function healthCheck() {
    try {
        const dbHealth = await checkDatabaseHealth();
        const collectionStats = await getCollectionStatistics();
        
        const overallStatus = dbHealth.success && 
                             dbHealth.data.status === 'healthy' 
                             ? 'healthy' 
                             : 'unhealthy';
        
        return successResponse({
            status: overallStatus,
            database: dbHealth.data,
            collections: collectionStats.data,
            services: {
                'wix-data': {
                    status: dbHealth.data.status,
                    responseTime: dbHealth.data.responseTime
                }
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return handleError(error, 'healthCheck');
    }
}

// =====================================================================
// EXPORT ALL FUNCTIONS
// =====================================================================

export default {
    // Utility Functions
    generateSessionId,
    handleError,
    successResponse,
    
    // Analytics & Logging
    logSystemEvent,
    logAnalyticsEvent,
    getAnalytics,
    
    // AI Analysis
    saveAIAnalysisResult,
    getAIAnalysisResults,
    getAIAnalysisBySession,
    
    // Customer Management
    createOrUpdateCustomer,
    createCustomerLead,
    updateCustomerLeadStatus,
    getCustomerDetails,
    getCustomerByEmail,
    getCustomers,
    
    // Quote Management
    createQuoteItem,
    updateQuoteItemWithExplanation,
    getQuoteItems,
    getQuoteById,
    
    // Project Management
    createProject,
    getProjectDetails,
    
    // Appointment Management
    createAppointment,
    getAppointments,
    
    // Product Data
    getWindowProducts,
    getWindowMaterials,
    getMaterials,
    getWindowTypes,
    getWindowBrands,
    getWindowOptions,
    getPricingConfiguration,
    
    // Generic CRUD
    insertRecord,
    updateRecord,
    getRecord,
    deleteRecord,
    
    // Bulk Operations
    bulkInsert,
    searchAllCollections,
    
    // System Health
    checkDatabaseHealth,
    getCollectionStatistics,
    healthCheck
};