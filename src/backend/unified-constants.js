/**
 * Constants Configuration - Good Faith Exteriors
 * backend/config/constants.js
 * 
 * Centralized constants for the entire Wix application
 * Consistent with updated backend patterns
 */

// =====================================================================
// COLLECTION CONSTANTS
// =====================================================================

export const COLLECTIONS = {
    // Core Data Collections
    customers: 'Customers',
    quoteItems: 'QuoteItems',
    quotes: 'Quotes',
    projects: 'Projects',
    
    // Product Data Collections
    materials: 'Materials',
    windowTypes: 'WindowTypes',
    windowBrands: 'WindowBrands',
    windowOptions: 'WindowOptions',
    windowProducts: 'WindowProducts',
    windowProductsCatalog: 'WindowProductsCatalog',
    productPricing: 'ProductPricing',
    
    // AI and Analysis Collections
    aiWindowMeasureService: 'AIWindowMeasureService',
    aiAnalysisResults: 'AIAnalysisResults',
    
    // System Collections
    analytics: 'Analytics',
    systemEvents: 'SystemEvents',
    configuration: 'Configuration',
    
    // Calculator and UI Collections
    baseUICalculator: 'BaseUICalculator',
    
    // Booking and CRM Collections
    bookingsAppointments: 'BookingsAppointments',
    crmLeads: 'CRMLeads',
    windowEstimatorLeads: 'WindowEstimatorLeads',
    highPriorityLeads: 'HighPriorityLeads',
    salesNotifications: 'SalesNotifications',
    
    // Communication Collections
    emailSchedule: 'EmailSchedule',
    scheduledEmails: 'ScheduledEmails',
    scheduledAppointments: 'ScheduledAppointments',
    
    // Additional Collections
    referrals: 'Referrals',
    trainingCertificates: 'TrainingCertificates',
    competitorQuote: 'CompetitorQuote'
};

// =====================================================================
// FIELD MAPPING CONSTANTS
// =====================================================================

export const FIELD_MAPPINGS = {
    // Customer Fields
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    customerAddress: 'customerAddress',
    customerNotes: 'notes',
    leadSource: 'leadSource',
    leadStatus: 'leadStatus',
    dateCreated: 'dateCreated',
    
    // Window Measurement Fields
    width: 'width',
    height: 'height',
    quantity: 'quantity',
    windowType: 'windowType',
    material: 'material',
    brand: 'brand',
    
    // Pricing Fields
    unitPrice: 'unitPrice',
    totalPrice: 'totalPrice',
    laborCost: 'laborCost',
    materialMultiplier: 'materialMultiplier',
    typeMultiplier: 'typeMultiplier',
    priceMultiplier: 'priceMultiplier',
    
    // AI Analysis Fields
    measuredWidth: 'measuredWidth',
    measuredHeight: 'measuredHeight',
    confidencePercent: 'confidencePercent',
    detectedType: 'detectedType',
    aiAnalysisData: 'aiAnalysisData',
    windowImage: 'windowImage',
    sessionName: 'sessionName',
    userEmail: 'userEmail',
    userPhone: 'userPhone',
    processingMetadata: 'processingMetadata',
    
    // System Fields
    itemNumber: 'itemNumber',
    sessionId: 'sessionId',
    timestamp: 'timestamp',
    event: 'event',
    page: 'page',
    eventProperties: 'eventProperties',
    errorMessage: 'errorMessage',
    userId: 'userId'
};

// =====================================================================
// VALIDATION CONSTANTS
// =====================================================================

export const VALIDATION_RULES = {
    // String Length Limits
    MAX_NAME_LENGTH: 100,
    MAX_EMAIL_LENGTH: 255,
    MAX_PHONE_LENGTH: 20,
    MAX_ADDRESS_LENGTH: 500,
    MAX_NOTES_LENGTH: 2000,
    MAX_SESSION_NAME_LENGTH: 100,
    
    // Numeric Limits
    MIN_WINDOW_WIDTH: 12,
    MAX_WINDOW_WIDTH: 120,
    MIN_WINDOW_HEIGHT: 12,
    MAX_WINDOW_HEIGHT: 120,
    MIN_QUANTITY: 1,
    MAX_QUANTITY: 50,
    MIN_CONFIDENCE: 0,
    MAX_CONFIDENCE: 100,
    
    // Price Limits
    MIN_PRICE: 0,
    MAX_PRICE: 50000,
    
    // Email Regex
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // Phone Regex (US format)
    PHONE_REGEX: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
};

// =====================================================================
// BUSINESS LOGIC CONSTANTS
// =====================================================================

export const BUSINESS_CONSTANTS = {
    // Default Values
    DEFAULT_MATERIAL: 'vinyl',
    DEFAULT_WINDOW_TYPE: 'double-hung',
    DEFAULT_QUANTITY: 1,
    DEFAULT_LEAD_STATUS: 'new',
    DEFAULT_CONFIDENCE: 75,
    
    // Pricing Configuration
    BASE_LABOR_RATE: 150,
    TAX_RATE: 0.08,
    MARKUP_PERCENTAGE: 0.30,
    
    // Material Multipliers
    MATERIAL_MULTIPLIERS: {
        vinyl: 1.0,
        wood: 1.5,
        aluminum: 1.2,
        fiberglass: 1.4,
        composite: 1.3
    },
    
    // Window Type Multipliers
    WINDOW_TYPE_MULTIPLIERS: {
        'double-hung': 1.0,
        'single-hung': 0.9,
        casement: 1.2,
        sliding: 1.1,
        awning: 1.3,
        bay: 2.0,
        bow: 2.2,
        picture: 0.8
    },
    
    // AI Analysis Thresholds
    MIN_AI_CONFIDENCE: 60,
    HIGH_CONFIDENCE_THRESHOLD: 85,
    
    // Session Management
    SESSION_TIMEOUT_HOURS: 24,
    MAX_SESSIONS_PER_USER: 10
};

// =====================================================================
// API ENDPOINT CONSTANTS
// =====================================================================

export const API_ENDPOINTS = {
    // AI Analysis Endpoints
    ANALYZE_WINDOW: '/analyze-window',
    VALIDATE_MEASUREMENTS: '/validate-measurements',
    GENERATE_QUOTE_EXPLANATION: '/generate-quote-explanation',
    GENERATE_CUSTOMER_COMMUNICATION: '/generate-customer-communication',
    
    // Pricing Endpoints
    CALCULATE_QUOTE: '/calculate-quote',
    GET_CONFIGURATION: '/configuration',
    
    // Product Data Endpoints
    GET_MATERIALS: '/materials',
    GET_WINDOW_TYPES: '/window-types',
    GET_WINDOW_BRANDS: '/window-brands',
    GET_WINDOW_OPTIONS: '/window-options',
    GET_WINDOW_PRODUCTS: '/window-products',
    
    // Customer Management Endpoints
    CREATE_CUSTOMER: '/customer',
    GET_CUSTOMER: '/customer',
    UPDATE_CUSTOMER: '/customer',
    
    // System Health Endpoints
    SYSTEM_HEALTH: '/system-health',
    AI_HEALTH: '/ai-health',
    EMAIL_HEALTH: '/email-health'
};

// =====================================================================
// ERROR CONSTANTS
// =====================================================================

export const ERROR_CODES = {
    // Validation Errors
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_EMAIL: 'INVALID_EMAIL',
    INVALID_PHONE: 'INVALID_PHONE',
    INVALID_DIMENSIONS: 'INVALID_DIMENSIONS',
    
    // System Errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    API_ERROR: 'API_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    
    // AI Service Errors
    AI_SERVICE_UNAVAILABLE: 'AI_SERVICE_UNAVAILABLE',
    IMAGE_PROCESSING_ERROR: 'IMAGE_PROCESSING_ERROR',
    ANALYSIS_FAILED: 'ANALYSIS_FAILED',
    
    // Email Service Errors
    EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',
    TEMPLATE_ERROR: 'TEMPLATE_ERROR',
    DELIVERY_FAILED: 'DELIVERY_FAILED'
};

// =====================================================================
// STATUS CONSTANTS
// =====================================================================

export const STATUS_TYPES = {
    // Lead Statuses
    LEAD_NEW: 'new',
    LEAD_CONTACTED: 'contacted',
    LEAD_QUALIFIED: 'qualified',
    LEAD_QUOTED: 'quoted',
    LEAD_CONVERTED: 'converted',
    LEAD_LOST: 'lost',
    
    // Quote Statuses
    QUOTE_DRAFT: 'draft',
    QUOTE_SENT: 'sent',
    QUOTE_VIEWED: 'viewed',
    QUOTE_ACCEPTED: 'accepted',
    QUOTE_REJECTED: 'rejected',
    QUOTE_EXPIRED: 'expired',
    
    // Project Statuses
    PROJECT_PENDING: 'pending',
    PROJECT_SCHEDULED: 'scheduled',
    PROJECT_IN_PROGRESS: 'in_progress',
    PROJECT_COMPLETED: 'completed',
    PROJECT_CANCELLED: 'cancelled',
    
    // System Health Statuses
    HEALTH_HEALTHY: 'healthy',
    HEALTH_DEGRADED: 'degraded',
    HEALTH_UNHEALTHY: 'unhealthy',
    HEALTH_ERROR: 'error'
};

// =====================================================================
// EMAIL TEMPLATE CONSTANTS
// =====================================================================

export const EMAIL_TEMPLATES = {
    // Template Names
    QUOTE_EMAIL: 'quote_email',
    AI_ANALYSIS_EMAIL: 'ai_analysis_email',
    APPOINTMENT_CONFIRMATION: 'appointment_confirmation',
    FOLLOW_UP_EMAIL: 'follow_up_email',
    WELCOME_EMAIL: 'welcome_email',
    
    // Template Subjects
    SUBJECTS: {
        QUOTE: 'Your Window Replacement Quote from Good Faith Exteriors',
        AI_ANALYSIS: 'Your Window Analysis Results from Good Faith Exteriors',
        APPOINTMENT: 'Appointment Confirmation - Good Faith Exteriors',
        FOLLOW_UP: 'Following Up on Your Window Project',
        WELCOME: 'Welcome to Good Faith Exteriors'
    }
};

// =====================================================================
// SYSTEM CONFIGURATION CONSTANTS
// =====================================================================

export const SYSTEM_CONFIG = {
    // Rate Limiting
    API_RATE_LIMIT_PER_MINUTE: 60,
    AI_RATE_LIMIT_PER_MINUTE: 10,
    EMAIL_RATE_LIMIT_PER_HOUR: 100,
    
    // Timeouts
    API_TIMEOUT_MS: 30000,
    AI_TIMEOUT_MS: 60000,
    EMAIL_TIMEOUT_MS: 15000,
    
    // Retry Configuration
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    RETRY_BACKOFF_MULTIPLIER: 2,
    
    // File Upload Limits
    MAX_IMAGE_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    
    // Session Configuration
    SESSION_COOKIE_NAME: 'gfe_session',
    SESSION_DURATION_HOURS: 24,
    
    // Logging Configuration
    LOG_LEVEL: 'info',
    LOG_RETENTION_DAYS: 30,
    
    // Cache Configuration
    CACHE_TTL_SECONDS: 3600,
    CACHE_MAX_SIZE: 1000
};

// =====================================================================
// ANTHROPIC AI CONSTANTS
// =====================================================================

export const ANTHROPIC_CONFIG = {
    MODEL: 'claude-3-5-sonnet-20241022',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.1,
    API_VERSION: '2023-06-01',
    
    // Rate Limiting
    RATE_LIMIT_PER_MINUTE: 50,
    
    // Analysis Types
    ANALYSIS_TYPES: {
        BASIC: 'basic',
        DETAILED: 'detailed',
        COMPREHENSIVE: 'comprehensive'
    },
    
    // Confidence Thresholds
    MIN_CONFIDENCE: 60,
    HIGH_CONFIDENCE: 85,
    EXCELLENT_CONFIDENCE: 95
};

// =====================================================================
// UTILITY CONSTANTS
// =====================================================================

export const UTILITY_CONSTANTS = {
    // ID Generation
    ID_PREFIX_SESSION: 'sess',
    ID_PREFIX_WINDOW: 'win',
    ID_PREFIX_QUOTE: 'quote',
    ID_PREFIX_CUSTOMER: 'cust',
    ID_PREFIX_PROJECT: 'proj',
    
    // Date Formats
    DATE_FORMAT_ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
    DATE_FORMAT_DISPLAY: 'MM/DD/YYYY',
    DATE_FORMAT_TIME: 'HH:mm:ss',
    
    // Currency
    CURRENCY_CODE: 'USD',
    CURRENCY_SYMBOL: '$',
    
    // Measurement Units
    MEASUREMENT_UNIT: 'inches',
    AREA_UNIT: 'square_inches',
    
    // Default Messages
    DEFAULT_SUCCESS_MESSAGE: 'Operation completed successfully',
    DEFAULT_ERROR_MESSAGE: 'An error occurred. Please try again.',
    
    // Pagination
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200
};

// =====================================================================
// EXPORT ALL CONSTANTS
// =====================================================================

export default {
    COLLECTIONS,
    FIELD_MAPPINGS,
    VALIDATION_RULES,
    BUSINESS_CONSTANTS,
    API_ENDPOINTS,
    ERROR_CODES,
    STATUS_TYPES,
    EMAIL_TEMPLATES,
    SYSTEM_CONFIG,
    ANTHROPIC_CONFIG,
    UTILITY_CONSTANTS
};

