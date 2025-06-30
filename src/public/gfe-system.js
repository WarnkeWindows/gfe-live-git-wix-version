/**
 * UNIFIED GOOD FAITH EXTERIORS SYSTEM
 * Complete Frontend-Ready Module for Iframe Widget
 * 
 * Combines all collection schemas, validation, constants, and utilities
 * Ready for direct import into iframe frontend system
 * 
 * Phase 4: Complete system unification with all backend compatibility
 * ✅ All collection field mappings from Wix
 * ✅ All validation functions and utilities  
 * ✅ All constants and configuration
 * ✅ Frontend-ready exports
 */

// =====================================================================
// COMPLETE WIX COLLECTION SCHEMAS (from PDF analysis)
// =====================================================================

export const COLLECTION_SCHEMAS = {
    WindowBrands: {
        collectionName: 'WindowBrands',
        fields: {
            windowBrand: { type: 'Text', label: 'Window Brand', required: true },
            description: { type: 'Text/RichText', label: 'Description' },
            priceMultiplier: { type: 'Number', label: 'Price Multiplier', required: true },
            logoUrl: { type: 'Image/URL', label: 'Logo URL' },
            orderRank: { type: 'Number', label: 'Order Rank' },
            qualityRating: { type: 'Number', label: 'Quality Rating' },
            warrantyYears: { type: 'Number', label: 'Warranty Years' },
            specialtyFeatures: { type: 'Array/Text', label: 'Specialty Features' },
            manufacturerContact: { type: 'Text', label: 'Manufacturer Contact' },
            certifications: { type: 'Array/Text', label: 'Certifications' },
            brandDocuments: { type: 'File', label: 'Brand Documents' },
            WindowTypes_compatibleBrands: { type: 'Reference', label: 'Compatible Types', multiRef: true }
        }
    },

    WindowTypes: {
        collectionName: 'WindowTypes',
        fields: {
            windowType: { type: 'Text', label: 'Window Type', required: true },
            description: { type: 'Text', label: 'Description' },
            typeMultiplier: { type: 'Number', label: 'Type Multiplier', required: true },
            orderRank: { type: 'Number', label: 'Order Rank' },
            typeImage: { type: 'Image/URL', label: 'Type Image' },
            installationComplexity: { type: 'Number/Text', label: 'Installation Complexity' },
            energyEfficiencyRating: { type: 'Number', label: 'Energy Efficiency Rating' },
            compatibleMaterials: { type: 'Reference', label: 'Compatible Materials', multiRef: true },
            compatibleBrands: { type: 'Reference', label: 'Compatible Brands', multiRef: true }
        }
    },

    WindowProductsCatalog: {
        collectionName: 'WindowProductsCatalog',
        fields: {
            productId: { type: 'Text', label: 'Product ID', required: true },
            windowBrand: { type: 'Text', label: 'Window Brand' },
            brandId: { type: 'Reference', label: 'Brand Reference' },
            windowSeries: { type: 'Text', label: 'Window Series' },
            interiorMaterial: { type: 'Text', label: 'Interior Material' },
            exteriorMaterial: { type: 'Text', label: 'Exterior Material' },
            materialCombination: { type: 'Text', label: 'Material Combination' },
            baseWidth: { type: 'Number', label: 'Base Width' },
            baseHeight: { type: 'Number', label: 'Base Height' },
            baseUi: { type: 'Number', label: 'Base UI' },
            pricePerUi: { type: 'Number', label: 'Price Per UI', required: true },
            description: { type: 'Text', label: 'Description' },
            isActive: { type: 'Boolean', label: 'Is Active' },
            windowType: { type: 'Text', label: 'Window Type' },
            materialCategory: { type: 'Text', label: 'Material Category' },
            energyRating: { type: 'Number', label: 'Energy Rating' },
            warrantyYears: { type: 'Number', label: 'Warranty Years' },
            mediagallery: { type: 'Media Gallery', label: 'Media Gallery' },
            technicalSpecs: { type: 'Object/Text', label: 'Technical Specs' },
            brandMultiplier: { type: 'Number', label: 'Brand Multiplier' },
            materialMultiplier: { type: 'Number', label: 'Material Multiplier' },
            typeMultiplier: { type: 'Number', label: 'Type Multiplier' },
            orderRank: { type: 'Number', label: 'Order Rank' },
            priceRange: { type: 'Text', label: 'Price Range' }
        }
    },

    WindowOptions: {
        collectionName: 'WindowOptions',
        fields: {
            title: { type: 'Text', label: 'Title', required: true },
            optionName: { type: 'Text', label: 'Option Name', required: true },
            description: { type: 'Text', label: 'Description' },
            optionCost: { type: 'Number', label: 'Option Cost' },
            typeMultiplier: { type: 'Number', label: 'Type Multiplier' },
            orderRank: { type: 'Number', label: 'Order Rank' },
            typeImage: { type: 'Image/URL', label: 'Type Image' },
            energyImpact: { type: 'Number', label: 'Energy Impact' },
            compatibilityMatrix: { type: 'Object', label: 'Compatibility Matrix' },
            optionCategory: { type: 'Text', label: 'Option Category' },
            QuoteItems_glassOptions: { type: 'Reference', label: 'Quote Items', multiRef: true }
        }
    },

    QuoteItems: {
        collectionName: 'QuoteItems',
        fields: {
            title: { type: 'Text', label: 'Title' },
            quoteId: { type: 'Reference', label: 'Quote ID' },
            itemNumber: { type: 'Number', label: 'Item Number' },
            locationName: { type: 'Text', label: 'Location Name' },
            windowType: { type: 'Text', label: 'Window Type', required: true },
            brand: { type: 'Text', label: 'Brand' },
            material: { type: 'Text', label: 'Material' },
            width: { type: 'Number', label: 'Width', required: true },
            height: { type: 'Number', label: 'Height', required: true },
            universalInches: { type: 'Number', label: 'Universal Inches', calculated: true },
            quantity: { type: 'Number', label: 'Quantity', required: true },
            unitPrice: { type: 'Number', label: 'Unit Price ($)' },
            totalPrice: { type: 'Number', label: 'Total Price ($)' },
            laborCost: { type: 'Number', label: 'Labor Cost ($)' },
            glassOptions: { type: 'Reference', label: 'Glass Options', multiRef: true },
            itemNotes: { type: 'Text', label: 'Item Notes' },
            uploadedImage: { type: 'Image/File', label: 'Uploaded Image' },
            aiMeasurements: { type: 'Object', label: 'AI Measurements' },
            technicalDiagram: { type: 'Image/File', label: 'Technical Diagram' }
        }
    },

    Materials: {
        collectionName: 'Materials',
        fields: {
            materialType: { type: 'Text', label: 'Material Type', required: true },
            materialMultiplier: { type: 'Number', label: 'Material Multiplier', required: true },
            uiBaseAverage: { type: 'Number', label: 'UI Base Average' },
            orderRank: { type: 'Number', label: 'Order Rank' },
            durabilityRating: { type: 'Number', label: 'Durability Rating' },
            maintenanceRequirements: { type: 'Text', label: 'Maintenance Requirements' },
            warrantyInformation: { type: 'Text', label: 'Warranty Information' },
            thermalPerformance: { type: 'Text', label: 'Thermal Performance' },
            colorOptions: { type: 'Array/Text', label: 'Color Options' },
            materialSamples: { type: 'Array/Text', label: 'Material Samples' },
            WindowTypes_compatibleMaterials: { type: 'Reference', label: 'Compatible Types', multiRef: true }
        }
    },

    Configuration: {
        collectionName: 'Configuration',
        fields: {
            configKey: { type: 'Text', label: 'Config Key', required: true },
            configValue: { type: 'Object/Text', label: 'Config Value', required: true },
            configCategory: { type: 'Text', label: 'Config Category' },
            configDescription: { type: 'Text', label: 'Config Description' },
            isActive: { type: 'Boolean', label: 'Is Active' },
            environmentSpecific: { type: 'Boolean', label: 'Environment Specific' },
            userRolePermissions: { type: 'Object', label: 'User Role Permissions' }
        }
    },

    CRMLeads: {
        collectionName: 'CRMLeads',
        fields: {
            title: { type: 'Text', label: 'Title' },
            fullName: { type: 'Text', label: 'Full Name', required: true },
            email: { type: 'Text', label: 'Email', required: true },
            phone: { type: 'Text', label: 'Phone' },
            source: { type: 'Text/Array', label: 'Source' },
            leadType: { type: 'Text', label: 'Lead Type' },
            projectId: { type: 'Reference', label: 'Project ID' },
            notes: { type: 'Text', label: 'Notes' },
            status: { type: 'Text/Array', label: 'Status' },
            createdAt: { type: 'DateTime', label: 'Created At' },
            quoteTotal: { type: 'Number', label: 'Quote Total' },
            assignedTo: { type: 'Reference', label: 'Assigned To' },
            projectImage: { type: 'Image/File', label: 'Project Image' },
            actions: { type: 'Array', label: 'Actions' },
            projectType: { type: 'Text', label: 'Project Type' },
            leadScore: { type: 'Number', label: 'Lead Score' },
            priority: { type: 'Number', label: 'Priority' },
            contactPreference: { type: 'Text', label: 'Contact Preference' },
            customerAddress: { type: 'Text', label: 'Customer Address' }
        }
    },

    AIWindowMeasureService: {
        collectionName: 'AIWindowMeasureService',
        fields: {
            sessionName: { type: 'Text', label: 'Session Name', required: true },
            userEmail: { type: 'Text', label: 'User Email' },
            userPhone: { type: 'Text', label: 'User Phone' },
            projectType: { type: 'Text', label: 'Project Type' },
            sessionNotes: { type: 'Text', label: 'Session Notes' },
            windowImage: { type: 'Image/File', label: 'Window Image' },
            measuredWidth: { type: 'Number', label: 'Measured Width', required: true },
            measuredHeight: { type: 'Number', label: 'Measured Height', required: true },
            confidence: { type: 'Number', label: 'Confidence %' },
            detectedType: { type: 'Text', label: 'Detected Type' },
            aiAnalysisData: { type: 'Object', label: 'AI Analysis Data' },
            processingMetadata: { type: 'Object', label: 'Processing Metadata' }
        }
    },

    Analytics: {
        collectionName: 'Analytics',
        fields: {
            event: { type: 'Text', label: 'Event', required: true },
            page: { type: 'Text', label: 'Page' },
            timestamp: { type: 'DateTime', label: 'Timestamp', required: true },
            eventProperties: { type: 'Object', label: 'Event Properties' },
            sessionId: { type: 'Text', label: 'Session ID' },
            userId: { type: 'Text', label: 'User ID' },
            userAgent: { type: 'Text', label: 'User Agent' },
            pageUrl: { type: 'Text', label: 'Page URL' },
            referrer: { type: 'Text', label: 'Referrer' },
            leadId: { type: 'Reference', label: 'Lead ID' },
            quoteId: { type: 'Reference', label: 'Quote ID' },
            eventValue: { type: 'Number/Text', label: 'Event Value' },
            duration: { type: 'Number', label: 'Duration' },
            marketingData: { type: 'Object', label: 'Marketing Data' },
            deviceType: { type: 'Text', label: 'Device Type' },
            errorMessage: { type: 'Text', label: 'Error Message' }
        }
    }
};

// =====================================================================
// COLLECTION MAPPINGS & CONSTANTS
// =====================================================================

export const COLLECTIONS = {
    // Core Collections
    windowBrands: 'WindowBrands',
    windowTypes: 'WindowTypes', 
    windowProductsCatalog: 'WindowProductsCatalog',
    windowOptions: 'WindowOptions',
    quoteItems: 'QuoteItems',
    materials: 'Materials',
    configuration: 'Configuration',
    crmLeads: 'CRMLeads',
    aiWindowMeasureService: 'AIWindowMeasureService',
    analytics: 'Analytics',
    
    // Legacy Support
    windowProducts: 'WindowProducts',
    customers: 'Customers',
    quotes: 'Quotes',
    projects: 'Projects',
    bookingsAppointments: 'BookingsAppointments',
    baseUICalculator: 'BaseUICalculator',
    emailLog: 'EmailLog',
    emailSchedule: 'EmailSchedule',
    referrals: 'Referrals',
    scheduledAppointments: 'ScheduledAppointments',
    trainingCertificates: 'TrainingCertificates',
    trainingLog: 'TrainingLog',
    competitorQuote: 'CompetitorQuote'
};

// =====================================================================
// SECRETS & API KEYS
// =====================================================================

export const SECRETS = {
    // AI Services
    CLAUDE_API_KEY: 'claude_api_key',
    CLAUDE_ORG_ID: 'claude-organization-id',
    OPENAI_API_KEY: 'open_ai_assistant_api_key',
    OPENAI_ASSISTANT_ID: 'good-faith-exteriors-gpt',
    
    // Google Cloud Services
    GOOGLE_VISION_CLIENT_ID: 'cloud_vision_api_client_id',
    GOOGLE_VISION_CLIENT_SECRET: 'cloud_vision_client_secret',
    GOOGLE_AI_STUDIO_API: 'google-ai-studio-api-key',
    GOOGLE_AI_STUDIO_PROJECT: 'google-ai-studio-project-id',
    
    // Email & Communication
    GMAIL_CLIENT_ID: 'GMAIL_CLIENT_ID',
    GMAIL_CLIENT_SECRET: 'GMAIL_CLIENT_SECRET',
    GMAIL_PRIVATE_KEY: 'GMAIL_PRIVATE_KEY',
    
    // PDF Generation
    PDF_API_KEY: 'pdf_api_key',
    PDF_API_SECRET: 'pdf_api_secret',
    QUICK_QUOTE_TEMPLATE_ID: 'pdf-quick-quote-template-id',
    DETAILED_QUOTE_TEMPLATE_ID: 'detailed-quote-template-id',
    
    // External Integrations
    ZAPIER_KEY: 'zapier_key',
    TRELLO_API_KEY: 'trello_api_Key',
    TRELLO_SECRET: 'Trello_secret',
    
    // System Configuration
    WEB_APP_URL_SECRET: 'web_app_url_secret',
    API_KEY: 'API_KEY',
    CRM_APP_SCRIPT_ID: 'crm-app-script-id'
};

// =====================================================================
// COMPANY INFORMATION
// =====================================================================

export const COMPANY = {
    NAME: 'Good Faith Exteriors',
    WEBSITE: 'goodfaithexteriors.com',
    PHONE: '651-416-8669',
    EMAIL: 'info@goodfaithexteriors.com',
    ADDRESS: '5090 210th St N, Forest Lake, MN',
    LOGO_URL: 'https://static.wixstatic.com/media/10d52d_a5ae576e3b2c44e8b03f257c6986a853~mv2.png',
    
    OWNERS: {
        NICK: { name: 'Nick Warnke', email: 'nick@goodfaithexteriors.com' },
        RICH: { name: 'Rich Farchione', email: 'rich@goodfaithexteriors.com' }
    },
    
    SERVICE_AREA: 'Minneapolis, Minnesota',
    NOTIFICATION_EMAIL: 'quotes@goodfaithexteriors.com'
};

// =====================================================================
// AI CONFIGURATION
// =====================================================================

export const AI_CONFIG = {
    CLAUDE: {
        MODEL: 'claude-3-5-sonnet-20241022',
        MAX_TOKENS: 4000,
        TEMPERATURE: 0.7,
        VERSION: '2023-06-01',
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        TIMEOUT: 30000,
        MAX_RETRIES: 3,
        RATE_LIMIT_PER_MINUTE: 50
    },
    
    SYSTEM_PROMPT: `You are the Good Faith Window Advisor, an expert consultant for Good Faith Exteriors, a family-owned business specializing in energy-efficient window replacements in Minneapolis, Minnesota.

Your expertise includes:
- Window types, materials, and installation requirements for Minnesota climate
- Energy efficiency ratings and performance characteristics  
- Cost estimation using Universal Inches methodology
- Image analysis for window condition assessment
- Personalized recommendations for Minneapolis area homes

Company Information:
- Good Faith Exteriors serves Minneapolis, Minnesota
- Owners: Nick Warnke (nick@goodfaithexteriors.com) and Rich Farchione (rich@goodfaithexteriors.com)
- Website: goodfaithexteriors.com
- Phone: 651-416-8669
- Focus on honest pricing and quality installations

Always provide professional, helpful advice with confidence scores where applicable.`,

    CONFIDENCE_THRESHOLDS: {
        HIGH: 85,
        MEDIUM: 70,
        LOW: 50
    }
};

// =====================================================================
// IFRAME COMMUNICATION EVENTS
// =====================================================================

export const IFRAME_EVENTS = {
    // Initialization
    IFRAME_READY: 'iframe_ready',
    WIDGET_EXPAND_REQUEST: 'widget_expand_request',
    
    // Product Browser Events
    PRODUCT_SELECTED: 'product_selected',
    FILTER_CHANGED: 'filter_changed',
    PRODUCT_DETAILS_REQUESTED: 'product_details_requested',
    
    // AI Estimator Events
    IMAGE_UPLOADED: 'image_uploaded',
    AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
    PRICE_CALCULATED: 'price_calculated',
    CHAT_MESSAGE: 'chat_message',
    ESTIMATE_DATA: 'estimate_data',
    
    // Quote & Customer Events
    QUOTE_GENERATED: 'quote_generated',
    CUSTOMER_INFO_UPDATED: 'customer_info_updated',
    QUICK_QUOTE_GENERATED: 'quick_quote_generated',
    POPUP_QUOTE_GENERATED: 'popup_quote_generated',
    
    // User Interaction Events
    USER_ENGAGED: 'user_engaged',
    POPUP_ENGAGEMENT: 'popup_engagement',
    
    // Mobile Events
    MOBILE_CAMERA_REQUEST: 'mobile_camera_request',
    MOBILE_ORIENTATION_CHANGE: 'mobile_orientation_change',
    
    // Error Handling
    ERROR_OCCURRED: 'error_occurred'
};

// =====================================================================
// UI/UX CONFIGURATION
// =====================================================================

export const UI_CONFIG = {
    COLORS: {
        PRIMARY: '#1e3a8a',        // Navy Blue
        SECONDARY: '#fbbf24',      // Gold
        ACCENT: '#c0c0c0',         // Silver
        SUCCESS: '#10b981',        // Green
        WARNING: '#f59e0b',        // Amber
        ERROR: '#ef4444',          // Red
        TEXT_PRIMARY: '#1f2937',   // Dark Gray
        TEXT_SECONDARY: '#6b7280', // Medium Gray
        BACKGROUND: '#f8fafc',     // Light Gray
        WHITE: '#ffffff'
    },
    
    ELEMENTS: {
        UPLOAD_BUTTON: '#uploadButton',
        ANALYZE_IMAGE: '#analyzeImage',
        WIDTH: '#width',
        HEIGHT: '#height',
        QUANTITY: '#quantity',
        WINDOW_TYPE: '#windowType',
        MATERIAL: '#material',
        BRAND: '#brand',
        CALCULATE_PRICE: '#calculatePrice',
        ESTIMATE_RESULTS: '#estimateResults',
        CUSTOMER_NAME: '#customerName',
        CUSTOMER_EMAIL: '#customerEmail',
        CUSTOMER_PHONE: '#customerPhone',
        CHAT_CONTAINER: '#chatContainer',
        PRODUCT_GRID: '#productGrid',
        FILTER_PANEL: '#filterPanel'
    },
    
    BREAKPOINTS: {
        MOBILE: '768px',
        TABLET: '1024px', 
        DESKTOP: '1280px'
    }
};

// =====================================================================
// PRICING CONFIGURATION
// =====================================================================

export const PRICING_CONFIG = {
    DEFAULT: {
        PRICE_PER_UI: 2.50,
        SALES_MARKUP: 1.4,
        INSTALLATION_RATE: 150,
        TAX_RATE: 0.08,
        HIDDEN_MARKUP: 1.15
    },
    
    MATERIALS: {
        vinyl: 1.0,
        wood: 1.8,
        aluminum: 1.2,
        composite: 1.6,
        fiberglass: 1.7
    },
    
    TYPES: {
        'double-hung': 1.0,
        'casement': 1.2,
        'sliding': 0.9,
        'picture': 0.8,
        'bay': 2.2,
        'bow': 2.5,
        'awning': 1.1,
        'hopper': 1.1
    },
    
    BRANDS: {
        'pella': 1.4,
        'andersen': 1.5,
        'marvin': 1.8,
        'milgard': 1.2,
        'simonton': 1.0,
        'jeld-wen': 1.1
    }
};

// =====================================================================
// FIELD MAPPINGS
// =====================================================================

export const FIELD_MAPPINGS = {
    customer: {
        name: 'fullName',
        email: 'email',
        phone: 'phone',
        address: 'customerAddress',
        source: 'source',
        status: 'status',
        created: 'createdAt',
        notes: 'notes'
    },
    
    window: {
        width: 'width',
        height: 'height',
        quantity: 'quantity',
        type: 'windowType',
        material: 'material',
        brand: 'brand',
        unitPrice: 'unitPrice',
        totalPrice: 'totalPrice',
        laborCost: 'laborCost',
        universalInches: 'universalInches'
    },
    
    aiAnalysis: {
        sessionName: 'sessionName',
        userEmail: 'userEmail',
        userPhone: 'userPhone',
        projectType: 'projectType',
        sessionNotes: 'sessionNotes',
        windowImage: 'windowImage',
        measuredWidth: 'measuredWidth',
        measuredHeight: 'measuredHeight',
        confidence: 'confidence',
        detectedType: 'detectedType',
        aiAnalysisData: 'aiAnalysisData'
    }
};

// =====================================================================
// VALIDATION SCHEMAS
// =====================================================================

export const VALIDATION_SCHEMAS = {
    customer: {
        required: ['fullName', 'email'],
        optional: ['phone', 'customerAddress', 'source', 'notes'],
        defaults: {
            source: 'website',
            status: 'new'
        }
    },
    
    windowMeasurement: {
        required: ['width', 'height', 'quantity'],
        optional: ['windowType', 'material', 'brand'],
        defaults: {
            quantity: 1,
            windowType: 'double-hung',
            material: 'vinyl'
        },
        ranges: {
            width: [6, 120],
            height: [6, 144],
            quantity: [1, 50]
        }
    },
    
    aiAnalysis: {
        required: ['sessionName', 'measuredWidth', 'measuredHeight'],
        optional: ['userEmail', 'userPhone', 'sessionNotes', 'windowImage'],
        defaults: {
            confidence: 0,
            detectedType: 'unknown'
        }
    },
    
    quote: {
        required: ['customerId', 'windowData', 'totalPrice'],
        optional: ['notes', 'validUntil', 'discountApplied'],
        defaults: {
            status: 'draft',
            validDays: 30
        }
    }
};

// =====================================================================
// VALIDATION FUNCTIONS
// =====================================================================

export function validateString(value, fieldName, minLength = 1, maxLength = 255) {
    if (typeof value !== 'string') {
        throw new Error(`${fieldName} must be a string`);
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length < minLength) {
        throw new Error(`${fieldName} must be at least ${minLength} characters`);
    }
    
    if (trimmed.length > maxLength) {
        throw new Error(`${fieldName} must be no more than ${maxLength} characters`);
    }
    
    return trimmed;
}

export function validateNumber(value, fieldName, minValue = null, maxValue = null) {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
        throw new Error(`${fieldName} must be a valid number`);
    }
    
    if (minValue !== null && num < minValue) {
        throw new Error(`${fieldName} must be at least ${minValue}`);
    }
    
    if (maxValue !== null && num > maxValue) {
        throw new Error(`${fieldName} must be no more than ${maxValue}`);
    }
    
    return num;
}

export function validateBoolean(value, fieldName) {
    if (typeof value === 'boolean') {
        return value;
    }
    
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        if (lower === 'true' || lower === '1' || lower === 'yes') return true;
        if (lower === 'false' || lower === '0' || lower === 'no') return false;
    }
    
    throw new Error(`${fieldName} must be a boolean value`);
}

export function validateArray(value, fieldName, minLength = 0, maxLength = null) {
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array`);
    }
    
    if (value.length < minLength) {
        throw new Error(`${fieldName} must have at least ${minLength} items`);
    }
    
    if (maxLength !== null && value.length > maxLength) {
        throw new Error(`${fieldName} must have no more than ${maxLength} items`);
    }
    
    return value;
}

export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

export function isValidPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
}

export function isValidISOString(isoString, fieldName) {
    if (!isoString || typeof isoString !== 'string') {
        throw new Error(`${fieldName} must be a valid ISO date string`);
    }
    
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`${fieldName} must be a valid ISO date string`);
    }
    
    return date;
}

export function validateRequiredFields(obj, requiredFields, objectName = 'Object') {
    const missing = [];
    
    for (const field of requiredFields) {
        if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        throw new Error(`${objectName} missing required fields: ${missing.join(', ')}`);
    }
    
    return true;
}

// =====================================================================
// DOMAIN-SPECIFIC VALIDATION
// =====================================================================

export function validateCustomerData(customerData) {
    try {
        const schema = VALIDATION_SCHEMAS.customer;
        validateRequiredFields(customerData, schema.required, 'Customer data');
        
        const validated = {};
        
        validated.fullName = validateString(customerData.fullName || customerData.customerName, 'Full name', 2, 100);
        validated.email = validateString(customerData.email || customerData.customerEmail, 'Email', 5, 100);
        
        if (!isValidEmail(validated.email)) {
            throw new Error('Email must be a valid email address');
        }
        
        if (customerData.phone || customerData.customerPhone) {
            validated.phone = validateString(customerData.phone || customerData.customerPhone, 'Phone', 10, 20);
            if (!isValidPhoneNumber(validated.phone)) {
                throw new Error('Phone must be a valid US phone number');
            }
        }
        
        if (customerData.customerAddress) {
            validated.customerAddress = validateString(customerData.customerAddress, 'Address', 10, 200);
        }
        
        validated.source = customerData.source || schema.defaults.source;
        validated.status = customerData.status || schema.defaults.status;
        validated.createdAt = customerData.createdAt || new Date().toISOString();
        
        return {
            isValid: true,
            data: validated,
            message: 'Customer data validated successfully'
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            data: null
        };
    }
}

export function validateQuoteItemData(quoteItemData) {
    try {
        const schema = VALIDATION_SCHEMAS.windowMeasurement;
        validateRequiredFields(quoteItemData, schema.required, 'Quote item data');
        
        const validated = {};
        
        validated.width = validateNumber(quoteItemData.width, 'Width', schema.ranges.width[0], schema.ranges.width[1]);
        validated.height = validateNumber(quoteItemData.height, 'Height', schema.ranges.height[0], schema.ranges.height[1]);
        validated.quantity = validateNumber(quoteItemData.quantity, 'Quantity', schema.ranges.quantity[0], schema.ranges.quantity[1]);
        
        validated.universalInches = calculateUniversalInches(validated.width, validated.height, validated.quantity);
        
        validated.windowType = quoteItemData.windowType || schema.defaults.windowType;
        validated.material = quoteItemData.material || schema.defaults.material;
        validated.brand = quoteItemData.brand || 'standard';
        
        if (validated.windowType && !PRICING_CONFIG.TYPES[validated.windowType]) {
            throw new Error(`Invalid window type: ${validated.windowType}`);
        }
        
        if (validated.material && !PRICING_CONFIG.MATERIALS[validated.material]) {
            throw new Error(`Invalid material: ${validated.material}`);
        }
        
        return {
            isValid: true,
            data: validated,
            message: 'Window measurements validated successfully'
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            data: null
        };
    }
}

export function validateAIMeasurementData(measurementData) {
    try {
        const schema = VALIDATION_SCHEMAS.aiAnalysis;
        validateRequiredFields(measurementData, schema.required, 'AI measurement data');
        
        const validated = {};
        
        validated.sessionName = validateString(measurementData.sessionName, 'Session Name', 10, 50);
        validated.measuredWidth = validateNumber(measurementData.measuredWidth, 'Measured Width', 6, 120);
        validated.measuredHeight = validateNumber(measurementData.measuredHeight, 'Measured Height', 6, 144);
        
        if (measurementData.confidence !== undefined) {
            validated.confidence = validateNumber(measurementData.confidence, 'Confidence', 0, 100);
        } else {
            validated.confidence = schema.defaults.confidence;
        }
        
        validated.detectedType = measurementData.detectedType || schema.defaults.detectedType;
        
        if (measurementData.userEmail) {
            validated.userEmail = validateString(measurementData.userEmail, 'User email');
            if (!isValidEmail(validated.userEmail)) {
                throw new Error('User email must be valid');
            }
        }
        
        if (measurementData.userPhone) {
            validated.userPhone = validateString(measurementData.userPhone, 'User phone');
            if (!isValidPhoneNumber(validated.userPhone)) {
                throw new Error('User phone must be valid US number');
            }
        }
        
        if (measurementData.aiAnalysisData && typeof measurementData.aiAnalysisData === 'object') {
            validated.aiAnalysisData = measurementData.aiAnalysisData;
        }
        
        return {
            isValid: true,
            data: validated,
            message: 'AI analysis data validated successfully'
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            data: null
        };
    }
}

export function validateQuoteData(quoteData) {
    try {
        const schema = VALIDATION_SCHEMAS.quote;
        validateRequiredFields(quoteData, schema.required, 'Quote data');
        
        const validated = {};
        
        validated.customerId = validateString(quoteData.customerId, 'Customer ID', 5, 50);
        validated.windowData = validateArray(quoteData.windowData, 'Window data', 1, 20);
        
        validated.windowData = validated.windowData.map((window, index) => {
            const windowValidation = validateQuoteItemData(window);
            if (!windowValidation.isValid) {
                throw new Error(`Window ${index + 1}: ${windowValidation.error}`);
            }
            return windowValidation.data;
        });
        
        validated.totalPrice = validateNumber(quoteData.totalPrice, 'Total price', 0);
        
        validated.notes = quoteData.notes ? validateString(quoteData.notes, 'Notes', 0, 1000) : '';
        validated.status = quoteData.status || schema.defaults.status;
        validated.validDays = quoteData.validDays || schema.defaults.validDays;
        
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + validated.validDays);
        validated.validUntil = validUntil.toISOString();
        
        return {
            isValid: true,
            data: validated,
            message: 'Quote data validated successfully'
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            data: null
        };
    }
}

export function validateAnalyticsEvent(eventData) {
    try {
        const required = ['event', 'timestamp'];
        validateRequiredFields(eventData, required, 'Analytics event');
        
        const validated = {};
        
        validated.event = validateString(eventData.event, 'Event type', 3, 50);
        validated.timestamp = isValidISOString(eventData.timestamp, 'Timestamp');
        
        if (eventData.sessionId) {
            validated.sessionId = validateString(eventData.sessionId, 'Session ID');
        }
        
        if (eventData.userId) {
            validated.userId = validateString(eventData.userId, 'User ID');
        }
        
        if (eventData.eventProperties && typeof eventData.eventProperties === 'object') {
            validated.eventProperties = eventData.eventProperties;
        }
        
        return {
            isValid: true,
            data: validated,
            message: 'Analytics event validated'
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            data: null
        };
    }
}

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

export function calculateUniversalInches(width, height, quantity = 1) {
    const w = typeof width === 'string' ? parseFloat(width) : Number(width) || 0;
    const h = typeof height === 'string' ? parseFloat(height) : Number(height) || 0;
    const q = typeof quantity === 'string' ? parseInt(quantity, 10) : Number(quantity) || 1;
    
    if (w <= 0 || h <= 0 || q <= 0) {
        throw new Error('Width, height, and quantity must be positive numbers');
    }
    
    return (w * h) * q;
}

export function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

export function generateUniqueId(prefix = 'gfe') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

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

export function createSuccessResponse(data, message = 'Operation successful') {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString()
    };
}

export function createErrorResponse(error, context = '') {
    return {
        success: false,
        error: error.message || error,
        context,
        timestamp: new Date().toISOString()
    };
}

export function mapFields(data, mappingKey) {
    const mapping = FIELD_MAPPINGS[mappingKey];
    if (!mapping) {
        return data;
    }
    
    const mapped = {};
    for (const [key, value] of Object.entries(data)) {
        const mappedKey = mapping[key] || key;
        mapped[mappedKey] = value;
    }
    
    return mapped;
}

export function getCollectionName(collectionKey) {
    return COLLECTIONS[collectionKey] || collectionKey;
}

export function isValidOrigin(origin) {
    const allowedOrigins = [
        'https://goodfaithexteriors.com',
        'https://www.goodfaithexteriors.com', 
        'https://goodfaithexteriors.wixsite.com',
        'https://editor.wix.com',
        'https://preview.wix.com'
    ];
    
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return true;
    }
    
    return allowedOrigins.includes(origin);
}

export function safeExecute(func) {
    return async function(...args) {
        try {
            const result = await func.apply(this, args);
            return {
                success: true,
                data: result,
                error: null
            };
        } catch (error) {
            console.error('Safe execution error:', error);
            return {
                success: false,
                data: null,
                error: error.message || 'Unknown error occurred'
            };
        }
    };
}

// =====================================================================
// PRICING FUNCTIONS
// =====================================================================

export function calculateBasePrice(universalInches, pricePerUI = PRICING_CONFIG.DEFAULT.PRICE_PER_UI) {
    return universalInches * pricePerUI;
}

export function getMaterialMultiplier(materialType) {
    return PRICING_CONFIG.MATERIALS[materialType.toLowerCase()] || 1.0;
}

export function getTypeMultiplier(windowType) {
    return PRICING_CONFIG.TYPES[windowType.toLowerCase()] || 1.0;
}

export function getBrandMultiplier(brandName) {
    return PRICING_CONFIG.BRANDS[brandName.toLowerCase()] || 1.0;
}

export function calculateWindowPrice(windowData, config = PRICING_CONFIG.DEFAULT) {
    try {
        // Validate input
        const validation = validateQuoteItemData(windowData);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        
        const data = validation.data;
        
        // Calculate base price
        const basePrice = calculateBasePrice(data.universalInches, config.PRICE_PER_UI);
        
        // Apply multipliers
        const materialMultiplier = getMaterialMultiplier(data.material);
        const typeMultiplier = getTypeMultiplier(data.windowType);
        const brandMultiplier = getBrandMultiplier(data.brand);
        
        // Calculate final price
        const adjustedPrice = basePrice * materialMultiplier * typeMultiplier * brandMultiplier;
        const withMarkup = adjustedPrice * config.SALES_MARKUP;
        const withHiddenMarkup = withMarkup * config.HIDDEN_MARKUP;
        
        // Calculate labor
        const laborCost = config.INSTALLATION_RATE * data.quantity;
        
        // Calculate total
        const subtotal = withHiddenMarkup + laborCost;
        const tax = subtotal * config.TAX_RATE;
        const total = subtotal + tax;
        
        return {
            success: true,
            pricing: {
                basePrice: Math.round(basePrice * 100) / 100,
                materialMultiplier,
                typeMultiplier,
                brandMultiplier,
                adjustedPrice: Math.round(adjustedPrice * 100) / 100,
                laborCost: Math.round(laborCost * 100) / 100,
                subtotal: Math.round(subtotal * 100) / 100,
                tax: Math.round(tax * 100) / 100,
                total: Math.round(total * 100) / 100
            },
            windowData: data
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            pricing: null
        };
    }
}

// =====================================================================
// ERROR CONSTANTS
// =====================================================================

export const ERRORS = {
    VALIDATION_FAILED: 'Validation failed',
    MISSING_REQUIRED_FIELD: 'Missing required field',
    INVALID_MEASUREMENT: 'Invalid measurement values',
    API_CALL_FAILED: 'API call failed',
    IMAGE_TOO_LARGE: 'Image file too large',
    UNSUPPORTED_FORMAT: 'Unsupported file format',
    NETWORK_ERROR: 'Network connection error',
    AUTHENTICATION_FAILED: 'Authentication failed',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INVALID_ORIGIN: 'Invalid origin domain'
};

export const SUCCESS = {
    ANALYSIS_COMPLETE: 'Window analysis completed successfully',
    QUOTE_GENERATED: 'Quote generated successfully',
    CUSTOMER_SAVED: 'Customer information saved',
    EMAIL_SENT: 'Email sent successfully',
    DATA_VALIDATED: 'Data validation passed',
    CALCULATION_COMPLETE: 'Price calculation completed',
    IMAGE_ANALYZED: 'Image analysis completed',
    MEASUREMENTS_VALIDATED: 'Measurements validated successfully'
};

// =====================================================================
// CACHE CONFIGURATION
// =====================================================================

export const CACHE = {
    TTL: {
        PRODUCTS: 3600,
        MATERIALS: 7200,
        PRICING: 1800,
        AI_ANALYSIS: 86400,
        CUSTOMER_DATA: 3600
    },
    
    KEYS: {
        PRODUCTS: 'gfe_products',
        MATERIALS: 'gfe_materials',
        WINDOW_TYPES: 'gfe_window_types',
        BRANDS: 'gfe_brands',
        PRICING_CONFIG: 'gfe_pricing'
    }
};

// =====================================================================
// MAIN EXPORT OBJECT - FRONTEND READY
// =====================================================================

export default {
    // Core Data Structures
    COLLECTION_SCHEMAS,
    COLLECTIONS,
    SECRETS,
    COMPANY,
    
    // Configuration
    AI_CONFIG,
    UI_CONFIG,
    PRICING_CONFIG,
    CACHE,
    
    // Communication
    IFRAME_EVENTS,
    FIELD_MAPPINGS,
    
    // Validation
    VALIDATION_SCHEMAS,
    validateString,
    validateNumber,
    validateBoolean,
    validateArray,
    isValidEmail,
    isValidPhoneNumber,
    isValidISOString,
    validateRequiredFields,
    validateCustomerData,
    validateQuoteItemData,
    validateAIMeasurementData,
    validateQuoteData,
    validateAnalyticsEvent,
    
    // Utilities
    calculateUniversalInches,
    generateSessionId,
    generateUniqueId,
    sanitizeForWix,
    createSuccessResponse,
    createErrorResponse,
    mapFields,
    getCollectionName,
    isValidOrigin,
    safeExecute,
    
    // Pricing
    calculateBasePrice,
    getMaterialMultiplier,
    getTypeMultiplier,
    getBrandMultiplier,
    calculateWindowPrice,
    
    // Messages
    ERRORS,
    SUCCESS
};