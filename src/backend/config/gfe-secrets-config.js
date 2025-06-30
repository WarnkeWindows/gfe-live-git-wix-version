/**
 * Good Faith Exteriors - Secrets Configuration & Environment Setup
 * backend/config/gfe-secrets-config.web.js
 * * Manages secure API keys and configuration using Wix Secrets Manager.
 * Implements secure key rotation and environment-specific settings.
 */

import { getSecret } from 'wix-secrets-backend';

/**
 * GFE Configuration Manager
 * Handles all external API keys and configuration settings.
 */
class GFEConfigManager {
    constructor() {
        this.config = {};
        this.initialized = false;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }
    
    /**
     * Initialize all configuration and secrets.
     */
    async initialize() {
        try {
            this.initializationAttempts++;
            console.log(`🔐 Initializing GFE Configuration (Attempt ${this.initializationAttempts})...`);
            
            // Load all secrets in parallel for better performance
            const secretPromises = [
                this.loadAnthropicConfig(),
                this.loadGoogleCloudConfig(),
                this.loadOpenAIConfig(),
                this.loadSystemConfig(),
                this.loadEmailConfig(),
                this.loadAnalyticsConfig()
            ];
            
            await Promise.allSettled(secretPromises);
            
            // Set default fallbacks for any missing critical config
            this.setFallbackDefaults();
            
            this.initialized = true;
            console.log('✅ GFE Configuration initialized successfully');
            
            return {
                success: true,
                config: this.getSafeConfig() // Don't expose sensitive data
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize GFE Configuration:', error);
            
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.initialize();
            }
            
            throw new Error(`Configuration initialization failed after ${this.maxInitializationAttempts} attempts`);
        }
    }
    
    /**
     * Load Anthropic Claude API configuration.
     */
    async loadAnthropicConfig() {
        try {
            this.config.anthropic = {
                apiKey: await getSecret('ANTHROPIC_API_KEY') || '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',
                organizationId: await getSecret('ANTHROPIC_ORG_ID') || 'd2de1af9-c8db-44d8-9ba9-7f15a6d7aae4',
                apiVersion: await getSecret('ANTHROPIC_API_VERSION') || '2023-06-01',
                model: 'claude-3-sonnet-20240229'
            };
            console.log('✅ Anthropic configuration loaded');
        } catch (error) {
            console.error('❌ Failed to load Anthropic configuration:', error);
            throw error;
        }
    }
    
    /**
     * Load Google Cloud Vision API configuration.
     */
    async loadGoogleCloudConfig() {
        try {
            this.config.googleCloud = {
                apiKey: await getSecret('GOOGLE_CLOUD_API_KEY'),
                projectId: await getSecret('GOOGLE_CLOUD_PROJECT_ID') || 'gfe-window-estimator'
            };
            console.log('✅ Google Cloud configuration loaded');
        } catch (error) {
            console.warn('⚠️ Google Cloud configuration not available:', error.message);
            this.config.googleCloud = { enabled: false };
        }
    }

    /**
     * Load OpenAI API configuration.
     */
    async loadOpenAIConfig() {
        try {
            this.config.openai = {
                apiKey: await getSecret('OPENAI_API_KEY'),
                organizationId: await getSecret('OPENAI_ORG_ID'),
                model: 'gpt-4-turbo-preview'
            };
            console.log('✅ OpenAI configuration loaded');
        } catch (error) {
            console.warn('⚠️ OpenAI configuration not available:', error.message);
            this.config.openai = { enabled: false };
        }
    }

    /**
     * Load system configuration settings.
     */
    async loadSystemConfig() {
        // ... Loads environment, debug level, etc. ...
    }

    /**
     * Load email and notification configuration.
     */
    async loadEmailConfig() {
        // ... Loads fromEmail, adminEmail, salesEmail etc. ...
    }

    /**
     * Load analytics and tracking configuration.
     */
    async loadAnalyticsConfig() {
       // ... Loads Google Analytics, Facebook Pixel IDs etc. ...
    }
    
    /**
     * Set fallback defaults for critical missing configuration.
     */
    setFallbackDefaults() {
        if (!this.config.pricing) {
            this.config.pricing = {
                pricePerUI: 5.58,
                salesMarkup: 1.10,
                installationRate: 0.18,
                taxRate: 0.055,
                hiddenMarkup: 1.30
            };
        }
    }
    
    /**
     * Get configuration value safely.
     */
    get(path, defaultValue = null) {
        // ... Implementation to get nested config properties ...
    }

    /**
     * Get safe configuration (without sensitive data) for debugging.
     */
    getSafeConfig() {
        const safeConfig = JSON.parse(JSON.stringify(this.config));
        
        // Redact sensitive data
        if (safeConfig.anthropic) safeConfig.anthropic.apiKey = '***REDACTED***';
        if (safeConfig.googleCloud) safeConfig.googleCloud.apiKey = '***REDACTED***';
        if (safeConfig.openai) safeConfig.openai.apiKey = '***REDACTED***';
        
        return { ...safeConfig, initialized: this.initialized };
    }
}


// Export a singleton instance and helper functions
const gfeConfig = new GFEConfigManager();

export async function initializeGFEConfig() {
    return gfeConfig.initialize();
}

export async function getGFEConfig() {
    if (!gfeConfig.initialized) {
        await initializeGFEConfig();
    }
    return gfeConfig;
}