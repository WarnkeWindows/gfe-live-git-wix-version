// File: backend/services/quoteService.js

import wixData from 'wix-data';
import wixSecretsBackend from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ImageAnnotatorClient } from '@google-cloud/vision';

const COLLECTIONS = {
    WINDOW_PRODUCTS: 'WindowProductsMasterCatalog',
    CUSTOMER_QUOTES: 'CustomerQuotes',
    WINDOW_ESTIMATES: 'WindowEstimates',
    CUSTOMER_LEADS: 'CustomerLeads',
    PRODUCT_PRICING: 'ProductPricing',
    AI_ANALYSIS_RESULTS: 'AIAnalysisResults',
    CONFIGURATION: 'Configuration',
    PROJECTS: 'Projects',
    MATERIALS: 'Materials',
    WINDOW_OPTIONS: 'WindowOptions',
};

async function getAnthropicClient() {
    try {
        const apiKey = await wixSecretsBackend.getSecret('claude_api_key');
        if (!apiKey) {
            throw new Error('Claude API key not found in Secrets Manager.');
        }
        return new Anthropic({ apiKey });
    } catch (error) {
        console.error('Failed to initialize Anthropic client:', error);
        throw new Error('AI service unavailable. Please contact support.');
    }
}

async function getOpenAIClient() {
    try {
        const apiKey = await wixSecretsBackend.getSecret('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('OpenAI API key not found in Secrets Manager.');
        }
        return new OpenAI({ apiKey });
    } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        throw new Error('OpenAI service unavailable. Please contact support.');
    }
}

async function getGoogleVisionClient() {
    try {
        const clientId = await wixSecretsBackend.getSecret('cloud_vision_api_client_id');
        const clientSecret = await wixSecretsBackend.getSecret('cloud_vision_client_secret');
        console.log('Initializing Google Cloud Vision client.');
        return new ImageAnnotatorClient();
    } catch (error) {
        console.error('Failed to initialize Google Vision client:', error);
        throw new Error('Image analysis service unavailable. Please contact support.');
    }
}

let siteConfig = null;

async function loadConfiguration() {
    try {
        const results = await wixData.query(COLLECTIONS.CONFIGURATION).find();
        const config = {};
        results.items.forEach(item => {
            config[item.configKey] = item.configValue;
        });
        console.log('Site configuration loaded successfully.');
        return config;
    } catch (error) {
        console.error('Failed to load configuration from collection:', error);
        // Return a default configuration object in case of failure
        return {
            matrix: {
                windows: {
                    baseRates: { vinyl: 250, fiberglass: 375, woodClad: 500 },
                    windowTypes: { "double-hung": 1.1, "casement": 1.25, "picture": 1.0, "bay": 1.5 }
                }
            },
            name: "Good Faith Exteriors",
            website: "www.goodfaithexteriors.com",
            logo: "https://static.wixstatic.com/media/10d52d_a5ae576e3b2c44e8b03f257c6986a853~mv2.png",
            enableClaude: true,
            model: "claude-3-5-sonnet-latest",
            phone: "651-426-8669",
            pricePerUI: 5.58,
            salesMarkup: 1.10,
            installationRate: 0.18,
            taxRate: 0.055,
            hiddenMarkup: 1.30,
            company_email: "info@goodfaithexteriors.com"
        };
    }
}

async function ensureConfigLoaded() {
    if (!siteConfig) {
        siteConfig = await loadConfiguration();
    }
    return siteConfig;
}

export async function getSiteConfigPreview() {
    const config = await ensureConfigLoaded();
    return { status: 'OK', config };
}

export {
    getAnthropicClient,
    getOpenAIClient,
    getGoogleVisionClient,
    ensureConfigLoaded,
    COLLECTIONS
};