/**
 * Core Configuration - Good Faith Exteriors
 * backend/config/collections.js
 * 
 * UNIFIED centralized configuration for all backend services
 * Ensures consistency across all files and proper Wix integration
 * SYNCHRONIZED with frontend iframe communication protocols
 */

// =====================================================================
// COLLECTION DEFINITIONS (Exact Wix Database Names)
// =====================================================================

export const COLLECTIONS = {
    // AI & Analysis Collections
    aiWindowMeasureService: 'AIWindowMeasureService',
    analytics: 'Analytics',
    
    // Product & Pricing Collections  
    baseUICalculator: 'BaseUICalculator',
    materials: 'Materials',
    windowTypes: 'WindowTypes',
    windowBrands: 'WindowBrands',
    windowOptions: 'WindowOptions',
    windowProductsMasterCatalog: 'WindowProductsMasterCatalog',
    productPricing: 'ProductPricing',
    
    // Customer & Business Collections
    customers: 'Customers',
    quoteItems: 'QuoteItems',
    projects: 'Projects',
    bookingsAppointments: 'BookingsAppointments',
    
    // Business Operations Collections
    competitorQuote: 'CompetitorQuote',
    emailSchedule: 'EmailSchedule',
    referrals: 'Referrals',
    scheduledAppointments: 'ScheduledAppointments',
    trainingCertificates: 'TrainingCertificates',
    trainingLog: 'TrainingLog',
    highPriorityLeads: 'HighPriorityLeads',
    salesNotifications: 'SalesNotifications',
    scheduledEmails: 'ScheduledEmails',
    windowEstimates: 'WindowEstimates',
    configuration: 'Configuration'
};

// =====================================================================
// SECRETS CONFIGURATION (From CSV Analysis)
// =====================================================================

export const SECRETS = {
    // AI Services
    CLAUDE_API_KEY: 'claude_api_key',
    ANTHROPIC_API_KEY: 'claude_api_key', // Alias for compatibility
    CLAUDE_ORG_ID: 'claude-organization-id',
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    OPENAI_ASSISTANT_ID: 'OPENAI_ASSISTANT_ID',
    GOOGLE_AI_STUDIO_API_KEY: 'google-ai-studio-api-key',
    GOOGLE_AI_STUDIO_PROJECT_ID: 'google-ai-studio-project-id',
    
    // Google Cloud Services
    GOOGLE_CLOUD_PROJECT_ID: 'google-cloud-project-id',
    GOOGLE_CLOUD_CLIENT_ID: 'google-cloud-client-id',
    CLOUD_VISION_CLIENT_ID: 'cloud_vision_api_client_id',
    CLOUD_VISION_CLIENT_SECRET: 'cloud_vision_client_secret',
    GOOGLE_CLOUD_ML_SERVICE_AGENT: 'google_cloud_ml_service_agent',
    DISCOVERY_ENGINE_SERVICE_ACCOUNT: 'discovery_engine_service_account',
    
    // Email & Communication
    SENDGRID_API_KEY: 'SENDGRID_API_KEY',
    GMAIL_CLIENT_ID: 'GMAIL_CLIENT_ID',
    GMAIL_CLIENT_SECRET: 'GMAIL_CLIENT_SECRET', 
    GMAIL_PRIVATE_KEY: 'GMAIL_PRIVATE_KEY',
    NOTIFICATION_EMAIL: 'notification-email',
    
    // Company Configuration
    COMPANY_NAME: 'company_name',
    COMPANY_EMAIL: 'company_email',
    COMPANY_PHONE: 'company_phone',
    COMPANY_ADDRESS: 'company_address',
    COMPANY_WEBSITE: 'company_website',
    COMPANY_LOGO_URL: 'company_logo_url',
    
    // Pricing & Business
    BASE_PRICE_MULTIPLIER: 'base_price_multiplier',
    MATERIAL_MULTIPLIER: 'material_multiplier',
    TYPE_MULTIPLIERS: 'type_multipliers',
    BRAND_MULTIPLIERS: 'brand_multipliers',
    OPTIONS_PRICING: 'options_pricing',
    INSTALL_OPTIONS: 'install_options',
    PAYMENT_TERMS: 'payment_terms',
    CONTRACT_TERMS: 'contract_terms',
    
    // Templates & Documents
    QUOTE_EMAIL_TEMPLATE: 'quote_email_template',
    QUOTE_ACCEPTED_TEMPLATE: 'quote_accepted_template',
    QUOTE_REJECTED_TEMPLATE: 'quote_rejected_template',
    QUOTE_EXPIRED_TEMPLATE: 'quote_expired_template',
    QUOTE_VIEWED_TEMPLATE: 'quote_viewed_template',
    DETAILED_QUOTE_TEMPLATE_ID: 'detailed-quote-template-id',
    PDF_TEMPLATE_NAME: 'pdf-template-name',
    PDF_QUICK_QUOTE_TEMPLATE_ID: 'pdf-quick-quote-template-id',
    
    // External Integrations
    ZAPIER_KEY: 'zapier_key',
    TRELLO_API_KEY: 'trello_api_Key',
    TRELLO_SECRET: 'Trello_secret',
    PDF_API_KEY: 'pdf_api_key',
    PDF_API_SECRET: 'pdf_api_secret',
    PDF_MINDEE_API: 'pdf-mindee-api',
    
    // Google Services
    GOOGLE_SHEET_ID: 'google-sheet-id',
    GOOGLE_SPREADSHEET_URL: 'google_spreadsheet_url',
    APP_SCRIPT_ID: 'app_script_id',
    CRM_APP_SCRIPT_URL: 'crm-app-script-url',
    CRM_APP_SCRIPT_ID: 'crm-app-script-id',
    WEB_APP_URL_SECRET: 'web_app_url_secret',
    
    // OAuth & Authentication
    GFE_OAUTH_APP_ID: 'good-faith-exteriors-oauth-app-id',
    GFE_OAUTH_APP_SECRET: 'good-faith-exteriors-oauth-app-secret',
    GFE_ADMIN_API_KEY: 'good-faith-exteriors-admin-api-key',
    GFE_API: 'GFE-API',
    GFE_ID_WIX_API: 'GFE_ID_WIX_API',
    API_KEY: 'API_KEY',
    
    // Other Services
    NOTEBOOK_LM_PROJECT_ID: 'notebook-lm-project-id',
    CONVO_AGENT_CODE: 'convo-agent-code',
    GFE_GPT: 'good-faith-exteriors-gpt',
    VERCEL_TOKEN: 'vercel_token'
};

// =====================================================================
// SYSTEM CONSTANTS - UNIFIED FOR ALL COMPONENTS
// =====================================================================

export const CONSTANTS = {
    // Default Pricing Configuration
    DEFAULT_PRICING: {
        pricePerUI: 2.50,
        salesMarkup: 1.4,
        installationRate: 150,
        taxRate: 0.08,
        hiddenMarkup: 1.15,
        minimumOrder: 500
    },
    
    // AI Configuration
    AI: {
        CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
        CLAUDE_VERSION: '2023-06-01',
        MAX_TOKENS: 4000,
        TEMPERATURE: 0.3,
        MAX_IMAGE_SIZE: 10485760, // 10MB
        SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
    },
    
    // API Configuration
    API: {
        MAX_RETRIES: 3,
        TIMEOUT: 30000,
        RATE_LIMIT_PER_MINUTE: 50,
        MAX_REQUEST_SIZE: 10485760 // 10MB
    },
    
    // UNIFIED UI Element IDs (Synchronized with frontend)
    UI_ELEMENT_IDS: {
        // Iframe Elements
        WINDOW_PRODUCTS_IFRAME: '#windowProductsIframe',
        AI_ESTIMATOR_IFRAME: '#aiEstimatorIframe',
        
        // Window Estimator Elements
        uploadButton: '#uploadButton',
        analyzeImage: '#analyzeImage',
        uploadedImage: '#uploadedImage',
        retakePhoto: '#retakePhoto',
        width: '#width',
        height: '#height',
        quantity: '#quantity',
        windowType: '#windowType',
        material: '#material',
        brand: '#brand',
        calculatePrice: '#calculatePrice',
        estimateResults: '#estimateResults',
        
        // AI Analysis Elements
        aiAnalysisStatus: '#aiAnalysisStatus',
        aiAnalysisResult: '#aiAnalysisResult',
        windowAdvisorText: '#windowAdvisorText',
        
        // Customer Information
        customerName: '#customerName',
        customerEmail: '#customerEmail',
        customerPhone: '#customerPhone',
        projectAddress: '#projectAddress',
        customerAddress: '#customerAddress', // Alias
        projectNotes: '#projectNotes',
        
        // Quote Display
        quoteTotal: '#quoteTotal',
        windowCount: '#windowCount',
        estimateSummary: '#estimateSummary',
        windowsList: '#yourWindowsList',
        quoteExplanation: '#quoteExplanation',
        
        // Action Buttons
        addWindowBtn: '#addWindowBtn',
        saveQuoteBtn: '#saveQuoteBtn',
        emailQuoteBtn: '#emailQuoteBtn',
        sendQuote: '#sendQuote', // Alias
        scheduleConsultationBtn: '#scheduleConsultationButton',
        scheduleConsultation: '#scheduleConsultation', // Alias
        applyAIResults: '#applyAIResults',
        
        // Status Elements
        connectionStatus: '#connectionStatus',
        loadingOverlay: '#loadingOverlay',
        errorMessage: '#errorMessage',
        successMessage: '#successMessage'
    },
    
    // UNIFIED Iframe Communication Events (Synchronized)
    IFRAME_EVENTS: {
        // Initialization Events
        IFRAME_READY: 'iframe_ready',
        DATA_LOADED: 'data_loaded',
        INITIALIZE: 'initialize',
        
        // Product Selection Events
        PRODUCT_SELECTED: 'product_selected',
        FILTER_CHANGED: 'filter_changed',
        PRODUCT_DETAILS_REQUESTED: 'product_details_requested',
        
        // AI Analysis Events
        IMAGE_UPLOADED: 'image_uploaded',
        AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
        ANALYZE_WINDOW: 'analyze_window',
        AI_ANALYSIS_RESULT: 'ai_analysis_result',
        
        // Pricing & Quote Events
        PRICE_CALCULATED: 'price_calculated',
        CALCULATE_QUOTE: 'calculate_quote',
        CALCULATE_PRICE: 'calculate_price',
        QUOTE_CALCULATION_RESULT: 'quote_calculation_result',
        QUOTE_GENERATED: 'quote_generated',
        QUICK_QUOTE_GENERATED: 'quick_quote_generated',
        
        // Customer Management Events
        CUSTOMER_INFO_UPDATED: 'customer_info_updated',
        SAVE_CUSTOMER: 'save_customer',
        CUSTOMER_SAVED: 'customer_saved',
        
        // Communication Events
        CHAT_MESSAGE: 'chat_message',
        EMAIL_QUOTE: 'email_quote',
        EMAIL_SENT: 'email_sent',
        SCHEDULE_CONSULTATION: 'schedule_consultation',
        CONSULTATION_SCHEDULED: 'consultation_scheduled',
        
        // Quote Explanation Events
        GENERATE_QUOTE_EXPLANATION: 'generate_quote_explanation',
        QUOTE_EXPLANATION_RESULT: 'quote_explanation_result',
        
        // Widget Management Events
        WIDGET_EXPAND_REQUEST: 'widget_expand_request',
        ESTIMATE_DATA: 'estimate_data',
        GET_ESTIMATE_DATA: 'get_estimate_data',
        RESET_FORM: 'reset_form',
        
        // Mobile Events
        MOBILE_CAMERA_REQUEST: 'mobile_camera_request',
        MOBILE_ORIENTATION_CHANGE: 'mobile_orientation_change',
        
        // Popup Events
        POPUP_QUOTE_GENERATED: 'popup_quote_generated',
        POPUP_ENGAGEMENT: 'popup_engagement',
        
        // Engagement Tracking Events
        USER_ENGAGED: 'user_engaged',
        USER_ENGAGEMENT: 'user_engagement',
        
        // Data Request Events
        LOAD_INITIAL_DATA: 'load_initial_data',
        
        // Error Handling Events
        ERROR: 'error',
        ERROR_OCCURRED: 'error_occurred'
    },
    
    // UNIFIED Source Names (Synchronized with frontend)
    IFRAME_SOURCES: {
        WINDOW_PRODUCTS: 'gfe-window-products',
        AI_ESTIMATOR: 'gfe-ai-estimator',
        VELO_PAGE: 'velo-page',
        WEBSITE: 'website',
        MOBILE: 'mobile',
        POPUP: 'popup',
        WIDGET: 'widget'
    },
    
    // System Event Types
    EVENTS: {
        WINDOW_ANALYZED: 'window_analyzed',
        QUOTE_GENERATED: 'quote_generated',
        CUSTOMER_CREATED: 'customer_created',
        APPOINTMENT_SCHEDULED: 'appointment_scheduled',
        EMAIL_SENT: 'email_sent',
        ERROR_OCCURRED: 'error_occurred',
        SYSTEM_HEALTH_CHECK: 'system_health_check',
        CONFIGURATION_UPDATED: 'configuration_updated',
        API_CALL_MADE: 'api_call_made',
        USER_ENGAGEMENT: 'user_engagement',
        CONVERSION_TRACKED: 'conversion_tracked',
        PRICING_CALCULATED: 'pricing_calculated',
        AI_ANALYSIS_COMPLETED: 'ai_analysis_completed'
    },
    
    // Company Information
    COMPANY: {
        name: 'Good Faith Exteriors',
        location: 'Minneapolis, Minnesota',
        website: 'goodfaithexteriors.com',
        owners: ['Nick Warnke', 'Rich Farchione'],
        ownerEmails: ['Nick@goodfaithexteriors.com', 'Rich@goodfaithexteriors.com']
    },
    
    // Cache Configuration
    CACHE: {
        CUSTOMER_TTL: 3600000, // 1 hour
        PRICING_TTL: 1800000,  // 30 minutes
        PRODUCTS_TTL: 3600000, // 1 hour
        CONFIG_TTL: 1800000    // 30 minutes
    },
    
    // Validation Origins (Synchronized)
    VALID_ORIGINS: [
        'https://goodfaithexteriors.com',
        'https://www.goodfaithexteriors.com',
        'https://goodfaithexteriors.wixsite.com',
        'https://preview.wixsite.com',
        'https://editor.wixsite.com',
        'http://localhost:3000', // Development
        'http://localhost:8080'  // Development
    ],
    
    // Error Messages
    ERRORS: {
        VALIDATION: {
            REQUIRED_FIELD: 'Required field is missing',
            INVALID_EMAIL: 'Invalid email format',
            INVALID_PHONE: 'Invalid phone number format',
            INVALID_DATA: 'Invalid data provided',
            INVALID_ORIGIN: 'Invalid message origin'
        },
        SYSTEM: {
            DATABASE_ERROR: 'Database operation failed',
            API_ERROR: 'External API call failed',
            AUTHENTICATION_ERROR: 'Authentication failed',
            AUTHORIZATION_ERROR: 'Insufficient permissions',
            RATE_LIMIT_ERROR: 'Rate limit exceeded',
            TIMEOUT_ERROR: 'Operation timed out'
        },
        AI: {
            ANALYSIS_FAILED: 'AI analysis failed',
            IMAGE_TOO_LARGE: 'Image file too large',
            UNSUPPORTED_FORMAT: 'Unsupported image format',
            NO_WINDOWS_DETECTED: 'No windows detected in image'
        },
        IFRAME: {
            CONNECTION_FAILED: 'Iframe connection failed',
            MESSAGE_VALIDATION_FAILED: 'Message validation failed',
            UNSUPPORTED_ACTION: 'Unsupported iframe action'
        }
    },
    
    // Success Messages
    SUCCESS: {
        ANALYSIS_COMPLETE: 'AI analysis completed successfully',
        QUOTE_CREATED: 'Quote created successfully',
        CUSTOMER_SAVED: 'Customer information saved successfully',
        EMAIL_SENT: 'Email sent successfully',
        APPOINTMENT_SCHEDULED: 'Appointment scheduled successfully',
        IFRAME_CONNECTED: 'Iframe connected successfully',
        MESSAGE_PROCESSED: 'Message processed successfully'
    }
};

// =====================================================================
// FIELD MAPPINGS FOR COLLECTIONS
// =====================================================================

export const FIELD_MAPPINGS = {
    customers: {
        name: 'customerName',
        email: 'customerEmail', 
        phone: 'customerPhone',
        address: 'projectAddress',
        notes: 'projectNotes',
        sessionId: 'sessionId',
        source: 'leadSource',
        priority: 'leadPriority',
        status: 'leadStatus'
    },
    
    quoteItems: {
        sessionId: 'sessionId',
        customerId: 'customerId',
        windowData: 'windowSpecifications',
        pricing: 'pricingDetails',
        total: 'totalAmount',
        status: 'quoteStatus',
        explanation: 'quoteExplanation'
    },
    
    aiWindowMeasureService: {
        sessionId: 'sessionId',
        imageData: 'originalImage',
        analysis: 'analysisResults',
        measurements: 'detectedMeasurements',
        confidence: 'confidenceScore',
        recommendations: 'aiRecommendations'
    }
};

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const VALIDATION_SCHEMAS = {
    customer: {
        required: ['customerName', 'customerEmail'],
        optional: ['customerPhone', 'projectAddress', 'projectNotes']
    },
    
    quoteItem: {
        required: ['sessionId', 'windowSpecifications', 'pricingDetails'],
        optional: ['customerId', 'quoteExplanation']
    },
    
    aiAnalysis: {
        required: ['sessionId', 'originalImage'],
        optional: ['analysisResults', 'detectedMeasurements', 'confidenceScore']
    },
    
    iframeMessage: {
        required: ['source', 'action'],
        optional: ['data', 'sessionId', 'mode', 'timestamp']
    }
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Generates unique ID with prefix
 */
export function generateUniqueId(prefix = 'gfe') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * Validates data against schema
 */
export function validateData(collectionType, data) {
    const schema = VALIDATION_SCHEMAS[collectionType];
    if (!schema) {
        throw new Error(`Unknown collection type: ${collectionType}`);
    }
    
    // Check required fields
    for (const field of schema.required) {
        if (!data[field] || data[field] === '') {
            throw new Error(`Required field missing: ${field}`);
        }
    }
    
    return true;
}

/**
 * Validates iframe message structure
 */
export function validateIframeMessage(message) {
    try {
        validateData('iframeMessage', message);
        
        // Validate source
        if (!Object.values(CONSTANTS.IFRAME_SOURCES).includes(message.source)) {
            console.warn(`Unknown iframe source: ${message.source}`);
        }
        
        // Validate action
        if (!Object.values(CONSTANTS.IFRAME_EVENTS).includes(message.action)) {
            throw new Error(`Unsupported iframe action: ${message.action}`);
        }
        
        return true;
        
    } catch (error) {
        throw new Error(`Iframe message validation failed: ${error.message}`);
    }
}

/**
 * Validates origin for iframe communication
 */
export function isValidOrigin(origin) {
    if (!origin || typeof origin !== 'string') {
        return false;
    }
    
    return CONSTANTS.VALID_ORIGINS.some(trusted => origin.startsWith(trusted));
}

/**
 * Sanitizes data for Wix collections
 */
export function sanitizeForWix(data) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
            continue;
        }
        
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = JSON.stringify(value);
        } else if (typeof value === 'number') {
            sanitized[key] = value.toString();
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Calculates Universal Inches for pricing
 */
export function calculateUniversalInches(width, height, quantity = 1) {
    const w = parseFloat(width) || 0;
    const h = parseFloat(height) || 0;
    const q = parseInt(quantity, 10) || 1;
    
    if (w <= 0 || h <= 0 || q <= 0) {
        throw new Error('Width, height, and quantity must be positive numbers');
    }
    
    return (w * h) * q;
}

/**
 * Creates unified success response
 */
export function createSuccessResponse(data, message = 'Operation successful', extra = {}) {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        ...extra
    };
}

/**
 * Creates unified error response
 */
export function createErrorResponse(error, context = '') {
    return {
        success: false,
        error: error.message || error,
        context,
        timestamp: new Date().toISOString()
    };
}

/**
 * Creates iframe response with consistent format
 */
export function createIframeResponse(success, data = null, message = '', action = '') {
    return {
        success,
        data,
        message,
        action,
        timestamp: new Date().toISOString(),
        source: 'backend'
    };
}

// Export default object for compatibility
export default {
    COLLECTIONS,
    SECRETS,
    CONSTANTS,
    FIELD_MAPPINGS,
    VALIDATION_SCHEMAS,
    generateUniqueId,
    validateData,
    validateIframeMessage,
    isValidOrigin,
    sanitizeForWix,
    calculateUniversalInches,
    createSuccessResponse,
    createErrorResponse,
    createIframeResponse
};