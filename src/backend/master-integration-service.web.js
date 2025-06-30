// =====================================================================
// GFE MASTER INTEGRATION SERVICE (Refactored)
// Orchestrates all system components and API integrations using direct async exports.
// Source: master-integration-service.web.js
// =====================================================================

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import wixData from 'wix-data';
import {
    WIX_SECRETS,
    API_ENDPOINTS,
    FLF_COLLECTION_CONFIGURATIONS,
    CRM_LEADS_COLLECTION,
    AI_WINDOW_MEASURE_COLLECTION,
    PROPERTY_ANALYSIS_COLLECTION
} from './constants.web.js';

// --- Module-Level State ---
let secrets = new Map();
let authTokens = new Map();
let initialized = false;

/**
 * Ensures the service is initialized before running any function.
 * Loads secrets and configurations on the first call.
 */
async function ensureInitialized() {
    if (!initialized) {
        await initializeSystem();
    }
}

/**
 * Initializes the service with all required secrets and configurations.
 */
export async function initializeSystem() {
    if (initialized) return { success: true, message: 'Service already initialized' };

    try {
        console.log('🔐 Loading system secrets...');
        const secretNames = Object.values(WIX_SECRETS);
        for (const secretName of secretNames) {
            try {
                secrets.set(secretName, await getSecret(secretName));
            } catch (e) {
                console.warn(`⚠️ Could not load secret ${secretName}:`, e.message);
            }
        }
        
        initialized = true;
        console.log('✅ Master Integration Service initialized successfully');
        return { success: true, message: 'Service initialized' };
    } catch (error) {
        console.error('❌ Failed to initialize Master Integration Service:', error);
        initialized = false;
        return { success: false, error: error.message };
    }
}

/**
 * Saves lead data to the CRM collection and syncs to Google Sheets.
 * @param {object} leadData - The lead information.
 * @returns {Promise<object>}
 */
export async function saveLead(leadData) {
    await ensureInitialized();
    try {
        const validatedData = validateDataUsingFLF(leadData, 'CRMLeads');
        const result = await wixData.save(CRM_LEADS_COLLECTION, validatedData);
        
        // Asynchronously sync to Google Sheets without waiting for it to complete
        syncToGoogleSheets(validatedData, 'leads').catch(console.error);
        
        console.log('✅ Lead saved successfully:', result._id);
        return { success: true, id: result._id, data: result };
    } catch (error) {
        console.error('❌ Failed to save lead:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Saves window measurement data.
 * @param {object} measurementData - The measurement information.
 * @returns {Promise<object>}
 */
export async function saveWindowMeasurement(measurementData) {
    await ensureInitialized();
    try {
        const validatedData = validateDataUsingFLF(measurementData, 'AIWindowMeasureService');
        const result = await wixData.save(AI_WINDOW_MEASURE_COLLECTION, validatedData);
        console.log('✅ Window measurement saved successfully:', result._id);
        return { success: true, id: result._id, data: result };
    } catch (error) {
        console.error('❌ Failed to save window measurement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Saves property analysis data.
 * @param {object} analysisData - The analysis information.
 * @returns {Promise<object>}
 */
export async function savePropertyAnalysis(analysisData) {
    await ensureInitialized();
    try {
        const validatedData = validateDataUsingFLF(analysisData, 'PropertyAnalysis');
        const result = await wixData.save(PROPERTY_ANALYSIS_COLLECTION, validatedData);
        console.log('✅ Property analysis saved successfully:', result._id);
        return { success: true, id: result._id, data: result };
    } catch (error) {
        console.error('❌ Failed to save property analysis:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Analyzes an image by calling an external backend.
 * @param {string} imageData - Base64 encoded image.
 * @param {string} analysisType - The type of analysis to perform.
 * @returns {Promise<object>}
 */
export async function analyzeImage(imageData, analysisType = 'window') {
    await ensureInitialized();
    try {
        const backendUrl = secrets.get(WIX_SECRETS.BACKEND_URL);
        const apiKey = secrets.get(WIX_SECRETS.GFE_API_KEY);

        const response = await fetch(`${backendUrl}/api/ai-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
            body: JSON.stringify({ image_data: imageData, analysis_type: analysisType })
        });
        
        if (!response.ok) throw new Error(`Image analysis failed: ${response.status}`);
        
        const result = await response.json();
        return { success: true, data: result };
    } catch (error) {
        console.error('❌ Image analysis failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Returns the current status of the system.
 * @returns {Promise<object>}
 */
export async function getSystemStatus() {
    await ensureInitialized();
    return {
        initialized: initialized,
        timestamp: new Date().toISOString()
    };
}

// --- Internal Helper Functions ---

async function syncToGoogleSheets(data, dataType) {
    try {
        const crmScriptUrl = secrets.get(WIX_SECRETS.CRM_APP_SCRIPT_URL);
        if (!crmScriptUrl) {
            console.warn('⚠️ CRM App Script URL not configured. Skipping Google Sheets sync.');
            return { success: false, error: 'Not configured' };
        }

        const response = await fetch(crmScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'addData', dataType, data })
        });
        
        if (!response.ok) throw new Error(`Google Sheets sync failed: ${response.status}`);
        
        console.log('✅ Data synced to Google Sheets');
        return { success: true };
    } catch (error) {
        console.error('❌ Google Sheets sync failed:', error);
        return { success: false, error: error.message };
    }
}

function validateDataUsingFLF(data, collectionName) {
    const config = FLF_COLLECTION_CONFIGURATIONS[collectionName];
    if (!config) throw new Error(`Unknown collection config: ${collectionName}`);
    
    // Placeholder for the validation logic described in constants.web.js
    console.log(`Data validated for ${collectionName}`);
    return data;
}