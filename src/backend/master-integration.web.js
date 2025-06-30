// =====================================================================
// GFE MASTER INTEGRATION SERVICE
// Orchestrates all system components and API integrations
// =====================================================================

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import wixData from 'wix-data';
import { 
    COMPANY_INFO, 
    WIX_SECRETS, 
    GOOGLE_CLOUD_CONFIG, 
    OAUTH_CONFIG,
    MESSAGE_TYPES,
    API_ENDPOINTS,
    ERROR_CODES,
    ERROR_MESSAGES,
    FLF_COLLECTION_CONFIGURATIONS,
    CRM_LEADS_COLLECTION,
    AI_WINDOW_MEASURE_COLLECTION,
    PROPERTY_ANALYSIS_COLLECTION
} from './constants.web.js';

/**
 * Master Integration Service Class
 * Handles all system integrations and orchestrates component communication
 */
export class GFEMasterIntegrationService {
    constructor() {
        this.secrets = new Map();
        this.authTokens = new Map();
        this.initialized = false;
        
        console.log('🚀 Initializing GFE Master Integration Service...');
    }
    
    /**
     * Initialize the service with all required secrets and configurations
     */
    async initialize() {
        try {
            console.log('🔐 Loading system secrets...');
            await this.loadSecrets();
            
            console.log('🔑 Initializing OAuth tokens...');
            await this.initializeOAuth();
            
            console.log('☁️ Connecting to Google Cloud services...');
            await this.initializeGoogleCloud();
            
            console.log('🗄️ Verifying Wix Data collections...');
            await this.verifyWixCollections();
            
            this.initialized = true;
            console.log('✅ Master Integration Service initialized successfully');
            
            return { success: true, message: 'Service initialized' };
        } catch (error) {
            console.error('❌ Failed to initialize Master Integration Service:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Load all required secrets from Wix Secrets Manager
     */
    async loadSecrets() {
        const secretNames = Object.values(WIX_SECRETS);
        
        for (const secretName of secretNames) {
            try {
                const secretValue = await getSecret(secretName);
                this.secrets.set(secretName, secretValue);
                console.log(`✅ Loaded secret: ${secretName}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load secret ${secretName}:`, error.message);
            }
        }
    }
    
    /**
     * Initialize OAuth tokens for all services
     */
    async initializeOAuth() {
        // Initialize Wix OAuth
        await this.initializeWixOAuth();
        
        // Initialize Google OAuth
        await this.initializeGoogleOAuth();
        
        // Initialize Grid-Flow OAuth
        await this.initializeGridFlowOAuth();
    }
    
    /**
     * Initialize Wix OAuth authentication
     */
    async initializeWixOAuth() {
        try {
            const wixApiKey = this.secrets.get(WIX_SECRETS.GFE_ID_WIX_API);
            if (!wixApiKey) {
                throw new Error('Wix API key not found');
            }
            
            // Store Wix authentication
            this.authTokens.set('wix', {
                apiKey: wixApiKey,
                clientId: OAUTH_CONFIG.wix.clientId,
                siteId: OAUTH_CONFIG.wix.siteId,
                baseUrl: OAUTH_CONFIG.wix.baseUrl
            });
            
            console.log('✅ Wix OAuth initialized');
        } catch (error) {
            console.error('❌ Wix OAuth initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Google Cloud OAuth authentication
     */
    async initializeGoogleOAuth() {
        try {
            const googleApiKey = this.secrets.get(WIX_SECRETS.GOOGLE_ADMIN_API_KEY);
            const visionClientId = this.secrets.get(WIX_SECRETS.CLOUD_VISION_CLIENT_ID);
            const visionClientSecret = this.secrets.get(WIX_SECRETS.CLOUD_VISION_CLIENT_SECRET);
            
            this.authTokens.set('google', {
                apiKey: googleApiKey,
                clientId: visionClientId,
                clientSecret: visionClientSecret,
                projectId: GOOGLE_CLOUD_CONFIG.projectId,
                projectNumber: GOOGLE_CLOUD_CONFIG.projectNumber
            });
            
            console.log('✅ Google OAuth initialized');
        } catch (error) {
            console.error('❌ Google OAuth initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Grid-Flow Engine OAuth authentication
     */
    async initializeGridFlowOAuth() {
        try {
            const gridFlowToken = this.secrets.get(WIX_SECRETS.GRID_FLOW_ENGINE);
            
            this.authTokens.set('gridflow', {
                token: gridFlowToken,
                clientId: OAUTH_CONFIG.gridFlow.clientId,
                appId: OAUTH_CONFIG.gridFlow.appId
            });
            
            console.log('✅ Grid-Flow OAuth initialized');
        } catch (error) {
            console.error('❌ Grid-Flow OAuth initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Google Cloud services
     */
    async initializeGoogleCloud() {
        try {
            const googleAuth = this.authTokens.get('google');
            if (!googleAuth) {
                throw new Error('Google authentication not initialized');
            }
            
            // Test Google Cloud Functions connectivity
            const functionsBaseUrl = API_ENDPOINTS.googleCloud.base;
            
            // Verify each function is accessible
            const functions = Object.values(GOOGLE_CLOUD_CONFIG.functions);
            for (const functionName of functions) {
                try {
                    const response = await fetch(`${functionsBaseUrl}/${functionName}/health`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${googleAuth.apiKey}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        console.log(`✅ Google Cloud Function ${functionName} is accessible`);
                    } else {
                        console.warn(`⚠️ Google Cloud Function ${functionName} returned ${response.status}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Could not verify Google Cloud Function ${functionName}:`, error.message);
                }
            }
            
            console.log('✅ Google Cloud services initialized');
        } catch (error) {
            console.error('❌ Google Cloud initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Verify all required Wix Data collections exist
     */
    async verifyWixCollections() {
        const collections = Object.keys(FLF_COLLECTION_CONFIGURATIONS);
        
        for (const collectionName of collections) {
            try {
                // Try to query the collection to verify it exists
                const result = await wixData.query(collectionName)
                    .limit(1)
                    .find();
                
                console.log(`✅ Collection ${collectionName} verified (${result.totalCount} items)`);
            } catch (error) {
                console.error(`❌ Collection ${collectionName} verification failed:`, error.message);
                // Don't throw here - collections might not exist yet but can be created
            }
        }
    }
    
    /**
     * Save lead data to CRM
     */
    async saveLead(leadData) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            // Validate lead data using FLF mapping
            const validatedData = this.validateDataUsingFLF(leadData, 'CRMLeads');
            
            // Save to Wix Data
            const result = await wixData.save(CRM_LEADS_COLLECTION, validatedData);
            
            // Sync to Google Sheets CRM
            await this.syncToGoogleSheets(validatedData, 'leads');
            
            console.log('✅ Lead saved successfully:', result._id);
            return { success: true, id: result._id, data: result };
            
        } catch (error) {
            console.error('❌ Failed to save lead:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Save window measurement data
     */
    async saveWindowMeasurement(measurementData) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            // Validate measurement data using FLF mapping
            const validatedData = this.validateDataUsingFLF(measurementData, 'AIWindowMeasureService');
            
            // Save to Wix Data
            const result = await wixData.save(AI_WINDOW_MEASURE_COLLECTION, validatedData);
            
            console.log('✅ Window measurement saved successfully:', result._id);
            return { success: true, id: result._id, data: result };
            
        } catch (error) {
            console.error('❌ Failed to save window measurement:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Save property analysis data
     */
    async savePropertyAnalysis(analysisData) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            // Validate analysis data using FLF mapping
            const validatedData = this.validateDataUsingFLF(analysisData, 'PropertyAnalysis');
            
            // Save to Wix Data
            const result = await wixData.save(PROPERTY_ANALYSIS_COLLECTION, validatedData);
            
            console.log('✅ Property analysis saved successfully:', result._id);
            return { success: true, id: result._id, data: result };
            
        } catch (error) {
            console.error('❌ Failed to save property analysis:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Analyze image using Google Cloud Vision and Anthropic AI
     */
    async analyzeImage(imageData, analysisType = 'window') {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            const googleAuth = this.authTokens.get('google');
            const anthropicKey = this.secrets.get(WIX_SECRETS.GFE_ANTHROPIC_API_KEY);
            
            // Call Google Cloud Function for image analysis
            const response = await fetch(`${API_ENDPOINTS.googleCloud.base}/analyze-property-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAuth.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageData: imageData,
                    analysisType: analysisType,
                    anthropicKey: anthropicKey
                })
            });
            
            if (!response.ok) {
                throw new Error(`Image analysis failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Image analysis completed');
            return { success: true, data: result };
            
        } catch (error) {
            console.error('❌ Image analysis failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get property data from external APIs
     */
    async getPropertyData(address) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }
            
            const googleAuth = this.authTokens.get('google');
            
            // Call Google Cloud Function for property data
            const response = await fetch(`${API_ENDPOINTS.googleCloud.base}/get-property-data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAuth.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    address: address,
                    includeMarketData: true,
                    includeImagery: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Property data retrieval failed: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Property data retrieved');
            return { success: true, data: result };
            
        } catch (error) {
            console.error('❌ Property data retrieval failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Sync data to Google Sheets CRM
     */
    async syncToGoogleSheets(data, dataType) {
        try {
            const crmScriptUrl = this.secrets.get(WIX_SECRETS.CRM_APP_SCRIPT_URL);
            
            const response = await fetch(crmScriptUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'addData',
                    dataType: dataType,
                    data: data
                })
            });
            
            if (!response.ok) {
                throw new Error(`Google Sheets sync failed: ${response.status}`);
            }
            
            console.log('✅ Data synced to Google Sheets');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Google Sheets sync failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Validate data using Field Label Functioning (FLF) mappings
     */
    validateDataUsingFLF(data, collectionName) {
        const config = FLF_COLLECTION_CONFIGURATIONS[collectionName];
        if (!config) {
            throw new Error(`Unknown collection: ${collectionName}`);
        }
        
        const validatedData = {};
        const errors = [];
        
        // Validate each field according to FLF mapping
        for (const [fieldName, fieldConfig] of Object.entries(config.fields)) {
            const value = data[fieldConfig.jsProperty] || data[fieldConfig.fieldId];
            
            // Check required fields
            if (fieldConfig.required && (!value || value.toString().trim() === '')) {
                errors.push(`${fieldName} is required`);
                continue;
            }
            
            // Apply validation rules
            if (value && fieldConfig.validation) {
                const validation = fieldConfig.validation;
                
                switch (validation.type) {
                    case 'email':
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            errors.push(validation.message);
                        }
                        break;
                    case 'phone':
                        if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value)) {
                            errors.push(validation.message);
                        }
                        break;
                    case 'minLength':
                        if (value.length < validation.value) {
                            errors.push(validation.message);
                        }
                        break;
                }
            }
            
            // Set validated value or default
            validatedData[fieldConfig.fieldId] = value || fieldConfig.defaultValue;
        }
        
        if (errors.length > 0) {
            throw new Error(`Validation errors: ${errors.join(', ')}`);
        }
        
        // Apply business rules
        if (config.businessRules) {
            for (const rule of config.businessRules) {
                if (rule.condition(validatedData)) {
                    Object.assign(validatedData, rule.action(validatedData));
                }
            }
        }
        
        return validatedData;
    }
    
    /**
     * Get authentication token for a service
     */
    getAuthToken(service) {
        return this.authTokens.get(service);
    }
    
    /**
     * Get secret value
     */
    getSecret(secretName) {
        return this.secrets.get(secretName);
    }
    
    /**
     * Check if service is initialized
     */
    isInitialized() {
        return this.initialized;
    }
}

// Create singleton instance
const masterIntegrationService = new GFEMasterIntegrationService();

// Export HTTP functions for Wix Velo
export async function initializeSystem() {
    return await masterIntegrationService.initialize();
}

export async function saveLead(leadData) {
    return await masterIntegrationService.saveLead(leadData);
}

export async function saveWindowMeasurement(measurementData) {
    return await masterIntegrationService.saveWindowMeasurement(measurementData);
}

export async function savePropertyAnalysis(analysisData) {
    return await masterIntegrationService.savePropertyAnalysis(analysisData);
}

export async function analyzeImage(imageData, analysisType) {
    return await masterIntegrationService.analyzeImage(imageData, analysisType);
}

export async function getPropertyData(address) {
    return await masterIntegrationService.getPropertyData(address);
}

export async function getSystemStatus() {
    return {
        initialized: masterIntegrationService.isInitialized(),
        timestamp: new Date().toISOString(),
        services: {
            wix: !!masterIntegrationService.getAuthToken('wix'),
            google: !!masterIntegrationService.getAuthToken('google'),
            gridflow: !!masterIntegrationService.getAuthToken('gridflow')
        }
    };
}

// Export the service instance for internal use
export default masterIntegrationService;

/************
.web.js file
************

Backend '.web.js' files contain functions that run on the server side and can be called from page code.

Learn more at https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/web-modules/calling-backend-code-from-the-frontend

****/

/**** Call the sample multiply function below by pasting the following into your page code:

import { multiply } from 'backend/new-module.web';

$w.onReady(async function () {
   console.log(await multiply(4,5));
});

****/

import { Permissions, webMethod } from "wix-web-module";

export const multiply = webMethod(
  Permissions.Anyone, 
  (factor1, factor2) => { 
    return factor1 * factor2 
  }
);
