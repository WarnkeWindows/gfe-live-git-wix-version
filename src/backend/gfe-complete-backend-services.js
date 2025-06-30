/**
 * Comprehensive Backend Services Integration for Good Faith Exteriors
 * Complete Wix Blocks Backend Architecture with Claude API Integration
 * 
 * File: gfe-complete-backend-services.js
 * Purpose: All backend services with proper Wix Blocks integration and communication validation
 */

// ==================== IMPORTS AND DEPENDENCIES ====================

import { getSecret } from 'wix-secrets-backend';
import wixData from 'wix-data';
import { fetch } from 'wix-fetch';
import { ok, badRequest, serverError, notFound } from 'wix-http-functions';

// ==================== CONFIGURATION AND CONSTANTS ====================

const CLAUDE_CONFIG = {
    apiKey: null, // Loaded from Wix Secrets Manager
    organizationId: 'd2de1af9-c8db-44d8-9ba9-7f15a6d7aae4',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1500,
    version: '2023-06-01'
};

const COLLECTIONS = {
    windowProducts: 'WindowProductsMasterCatalog',
    customers: 'Customers',
    quotes: 'Quotes',
    crmLeads: 'CRMLeads',
    analytics: 'Analytics',
    configuration: 'Configuration',
    windowTypes: 'WindowTypes',
    materials: 'Materials',
    windowBrands: 'WindowBrands',
    windowOptions: 'WindowOptions',
    bookingsAppointments: 'BookingsAppointments',
    competitorQuotes: 'CompetitorQuotes',
    trainingLog: 'TrainingLog'
};

const GFE_BRANDING = {
    primaryNavy: '#1A365D',
    secondaryGold: '#D4AF37',
    accentSilver: '#C0C0C0',
    white: '#FFFFFF',
    success: '#38A169',
    error: '#E53E3E',
    warning: '#D69E2E',
    info: '#3182CE'
};

// ==================== CLAUDE API SERVICE ====================

/**
 * Initialize Claude API credentials from Wix Secrets Manager
 */
async function initializeClaudeAPI() {
    try {
        if (!CLAUDE_CONFIG.apiKey) {
            CLAUDE_CONFIG.apiKey = await getSecret('ANTHROPIC_API_KEY');
            if (!CLAUDE_CONFIG.apiKey) {
                throw new Error('Claude API key not found in Wix Secrets Manager');
            }
        }
        return true;
    } catch (error) {
        console.error('Failed to initialize Claude API:', error);
        throw error;
    }
}

/**
 * Call Claude API with comprehensive error handling and retry logic
 */
async function callClaudeAPI(prompt, imageData = null, toolName = 'general_analysis', retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
    
    try {
        await initializeClaudeAPI();
        
        const messages = [];
        
        if (imageData) {
            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: imageData
                        }
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            });
        } else {
            messages.push({
                role: 'user',
                content: prompt
            });
        }

        const systemPrompt = getSystemPromptForTool(toolName);
        
        const requestBody = {
            model: CLAUDE_CONFIG.model,
            max_tokens: CLAUDE_CONFIG.maxTokens,
            system: systemPrompt,
            messages: messages
        };

        const response = await fetch(CLAUDE_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_CONFIG.apiKey,
                'anthropic-version': CLAUDE_CONFIG.version
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Claude API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        // Log successful API call for analytics
        await logAnalyticsEvent('claude_api_call', {
            toolName: toolName,
            success: true,
            responseLength: result.content[0].text.length,
            timestamp: new Date()
        });
        
        return result.content[0].text;
        
    } catch (error) {
        console.error(`Claude API Error (attempt ${retryCount + 1}):`, error);
        
        // Log failed API call
        await logAnalyticsEvent('claude_api_call', {
            toolName: toolName,
            success: false,
            error: error.message,
            attempt: retryCount + 1,
            timestamp: new Date()
        });
        
        // Retry logic
        if (retryCount < maxRetries && (error.message.includes('rate limit') || error.message.includes('timeout'))) {
            console.log(`Retrying Claude API call in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return callClaudeAPI(prompt, imageData, toolName, retryCount + 1);
        }
        
        throw error;
    }
}

/**
 * Get system prompt for specific Claude Workbench tools
 */
function getSystemPromptForTool(toolName) {
    const prompts = {
        window_measurement_analyzer: `You are an expert window replacement analyst for Good Faith Exteriors. Analyze the provided window image with precision and provide detailed measurements, specifications, and recommendations. Focus on: Precise measurements using visible reference objects, Window type identification (casement, double-hung, sliding, etc.), Frame material assessment (vinyl, wood, aluminum, fiberglass), Condition evaluation and replacement recommendations, Energy efficiency improvement opportunities. Provide confidence scores for all measurements and flag any areas requiring manual verification. Always respond in JSON format with structured data.`,
        
        quote_explanation_generator: `You are a professional sales consultant for Good Faith Exteriors, a premium window replacement company. Create detailed, customer-friendly explanations that build confidence and demonstrate value. Focus on: Clear cost breakdowns with justifications, Energy efficiency benefits and savings, Quality advantages and warranty value, Professional installation expertise, Long-term value proposition. Use a consultative, professional tone that addresses customer concerns and builds trust.`,
        
        measurement_validator: `You are a quality assurance specialist for Good Faith Exteriors window installations. Validate measurements against industry standards and identify potential issues. Validation Criteria: Industry standard compliance (AAMA, NFRC), Measurement accuracy within ±1/4 inch tolerance, Structural feasibility assessment, Installation complexity evaluation. Provide clear pass/fail determinations with detailed reasoning.`,
        
        customer_communication_generator: `You are a customer service specialist for Good Faith Exteriors. Create personalized, professional communications that strengthen customer relationships. Communication Guidelines: Maintain Good Faith Exteriors' professional brand voice, Address customer concerns proactively, Provide clear next steps and timelines, Include relevant contact information, Reinforce value proposition and quality commitment.`,
        
        competitive_analysis_tool: `You are a market analysis specialist for Good Faith Exteriors. Analyze competitor offerings and provide strategic recommendations for competitive positioning. Analysis Focus: Pricing comparison and value proposition, Quality differentiation opportunities, Service advantage identification, Customer objection handling strategies, Competitive response recommendations.`,
        
        energy_efficiency_calculator: `You are an energy efficiency specialist for Good Faith Exteriors. Calculate energy savings and environmental impact for window replacement projects. Calculation Parameters: Energy Star compliance verification, Annual heating/cooling cost savings, Payback period analysis, Environmental impact assessment, ROI calculations and projections.`,
        
        general_analysis: `You are the Good Faith Window Advisor, an AI-powered expert consultation system for Good Faith Exteriors. Provide professional, accurate, and helpful guidance for all window replacement inquiries. Maintain a consultative tone and focus on delivering value to customers while representing Good Faith Exteriors' commitment to quality and service excellence.`
    };
    
    return prompts[toolName] || prompts.general_analysis;
}

// ==================== WIX DATA SERVICE ====================

/**
 * Enhanced Wix Data Service with comprehensive error handling and validation
 */
class WixDataService {
    
    /**
     * Get items from a collection with advanced filtering and pagination
     */
    static async getItems(collectionName, options = {}) {
        try {
            let query = wixData.query(collectionName);
            
            // Apply filters
            if (options.filters) {
                for (const [field, value] of Object.entries(options.filters)) {
                    if (Array.isArray(value)) {
                        query = query.hasSome(field, value);
                    } else if (typeof value === 'object' && value.operator) {
                        switch (value.operator) {
                            case 'gt':
                                query = query.gt(field, value.value);
                                break;
                            case 'lt':
                                query = query.lt(field, value.value);
                                break;
                            case 'contains':
                                query = query.contains(field, value.value);
                                break;
                            default:
                                query = query.eq(field, value.value);
                        }
                    } else {
                        query = query.eq(field, value);
                    }
                }
            }
            
            // Apply sorting
            if (options.sort) {
                if (options.sort.direction === 'desc') {
                    query = query.descending(options.sort.field);
                } else {
                    query = query.ascending(options.sort.field);
                }
            }
            
            // Apply pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            if (options.skip) {
                query = query.skip(options.skip);
            }
            
            const result = await query.find();
            
            // Log successful data retrieval
            await logAnalyticsEvent('data_retrieval', {
                collection: collectionName,
                itemCount: result.items.length,
                totalCount: result.totalCount,
                success: true,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error(`Error retrieving items from ${collectionName}:`, error);
            
            // Log failed data retrieval
            await logAnalyticsEvent('data_retrieval', {
                collection: collectionName,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
    
    /**
     * Save item to collection with validation
     */
    static async saveItem(collectionName, item, options = {}) {
        try {
            // Validate item data
            const validatedItem = await this.validateItemData(collectionName, item);
            
            // Add metadata
            validatedItem._createdDate = validatedItem._createdDate || new Date();
            validatedItem._updatedDate = new Date();
            
            const result = await wixData.save(collectionName, validatedItem, options);
            
            // Log successful save
            await logAnalyticsEvent('data_save', {
                collection: collectionName,
                itemId: result._id,
                success: true,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error(`Error saving item to ${collectionName}:`, error);
            
            // Log failed save
            await logAnalyticsEvent('data_save', {
                collection: collectionName,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
    
    /**
     * Update item in collection
     */
    static async updateItem(collectionName, itemId, updates, options = {}) {
        try {
            // Get existing item
            const existingItem = await wixData.get(collectionName, itemId);
            if (!existingItem) {
                throw new Error(`Item with ID ${itemId} not found in ${collectionName}`);
            }
            
            // Merge updates
            const updatedItem = {
                ...existingItem,
                ...updates,
                _updatedDate: new Date()
            };
            
            // Validate updated item
            const validatedItem = await this.validateItemData(collectionName, updatedItem);
            
            const result = await wixData.update(collectionName, validatedItem, options);
            
            // Log successful update
            await logAnalyticsEvent('data_update', {
                collection: collectionName,
                itemId: itemId,
                success: true,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error(`Error updating item in ${collectionName}:`, error);
            
            // Log failed update
            await logAnalyticsEvent('data_update', {
                collection: collectionName,
                itemId: itemId,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
    
    /**
     * Delete item from collection
     */
    static async deleteItem(collectionName, itemId, options = {}) {
        try {
            const result = await wixData.remove(collectionName, itemId, options);
            
            // Log successful deletion
            await logAnalyticsEvent('data_delete', {
                collection: collectionName,
                itemId: itemId,
                success: true,
                timestamp: new Date()
            });
            
            return result;
            
        } catch (error) {
            console.error(`Error deleting item from ${collectionName}:`, error);
            
            // Log failed deletion
            await logAnalyticsEvent('data_delete', {
                collection: collectionName,
                itemId: itemId,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
    
    /**
     * Validate item data based on collection schema
     */
    static async validateItemData(collectionName, item) {
        // Basic validation rules for each collection
        const validationRules = {
            [COLLECTIONS.windowProducts]: {
                required: ['brand', 'series', 'name', 'material', 'windowType', 'basePrice'],
                types: {
                    basePrice: 'number',
                    pricePerSqFt: 'number'
                }
            },
            [COLLECTIONS.customers]: {
                required: ['firstName', 'lastName', 'email'],
                types: {
                    email: 'email'
                }
            },
            [COLLECTIONS.quotes]: {
                required: ['customerId', 'windowData', 'pricing'],
                types: {
                    pricing: 'object'
                }
            },
            [COLLECTIONS.crmLeads]: {
                required: ['firstName', 'lastName', 'source'],
                types: {
                    email: 'email',
                    phone: 'phone'
                }
            }
        };
        
        const rules = validationRules[collectionName];
        if (!rules) {
            return item; // No validation rules defined
        }
        
        // Check required fields
        if (rules.required) {
            for (const field of rules.required) {
                if (!item[field]) {
                    throw new Error(`Required field '${field}' is missing for ${collectionName}`);
                }
            }
        }
        
        // Check field types
        if (rules.types) {
            for (const [field, type] of Object.entries(rules.types)) {
                if (item[field] !== undefined) {
                    if (!this.validateFieldType(item[field], type)) {
                        throw new Error(`Field '${field}' must be of type '${type}' for ${collectionName}`);
                    }
                }
            }
        }
        
        return item;
    }
    
    /**
     * Validate field type
     */
    static validateFieldType(value, type) {
        switch (type) {
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'string':
                return typeof value === 'string';
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null;
            case 'array':
                return Array.isArray(value);
            case 'email':
                return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            case 'phone':
                return typeof value === 'string' && /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''));
            default:
                return true;
        }
    }
}

// ==================== PRICING CALCULATOR SERVICE ====================

/**
 * Advanced pricing calculator with dynamic pricing algorithms
 */
class PricingCalculatorService {
    
    /**
     * Calculate comprehensive window pricing
     */
    static async calculateWindowPricing(windowData, options = {}) {
        try {
            // Get base product pricing
            const product = await this.getProductPricing(windowData.windowType, windowData.material, windowData.brand);
            
            if (!product) {
                throw new Error('Product not found for pricing calculation');
            }
            
            // Calculate area-based pricing
            const area = (windowData.width * windowData.height) / 144; // Convert to sq ft
            const basePrice = product.basePrice || 0;
            const areaPrice = area * (product.pricePerSqFt || 50);
            
            // Apply material multiplier
            const materialMultiplier = this.getMaterialMultiplier(windowData.material);
            const materialAdjustment = areaPrice * (materialMultiplier - 1);
            
            // Calculate options pricing
            const optionsPrice = await this.calculateOptionsPrice(windowData.customOptions || []);
            
            // Apply quantity discounts
            const quantityDiscount = this.calculateQuantityDiscount(windowData.quantity || 1);
            
            // Calculate labor and installation
            const laborPrice = await this.calculateLaborPrice(windowData);
            
            // Calculate subtotal
            const subtotal = basePrice + areaPrice + materialAdjustment + optionsPrice + laborPrice;
            const discountAmount = subtotal * quantityDiscount;
            const discountedSubtotal = subtotal - discountAmount;
            
            // Calculate tax
            const taxRate = await this.getTaxRate(windowData.location);
            const tax = discountedSubtotal * taxRate;
            
            // Calculate total
            const total = discountedSubtotal + tax;
            
            const pricingResult = {
                basePrice,
                areaPrice,
                materialAdjustment,
                optionsPrice,
                laborPrice,
                subtotal,
                quantityDiscount,
                discountAmount,
                discountedSubtotal,
                tax,
                taxRate,
                total,
                breakdown: {
                    area: area.toFixed(2),
                    materialMultiplier,
                    quantity: windowData.quantity || 1,
                    location: windowData.location || 'Default'
                },
                product: {
                    id: product._id,
                    name: product.name,
                    brand: product.brand,
                    series: product.series
                }
            };
            
            // Log pricing calculation
            await logAnalyticsEvent('pricing_calculation', {
                windowData: windowData,
                pricingResult: pricingResult,
                success: true,
                timestamp: new Date()
            });
            
            return pricingResult;
            
        } catch (error) {
            console.error('Error calculating window pricing:', error);
            
            // Log failed pricing calculation
            await logAnalyticsEvent('pricing_calculation', {
                windowData: windowData,
                success: false,
                error: error.message,
                timestamp: new Date()
            });
            
            throw error;
        }
    }
    
    /**
     * Get product pricing from database
     */
    static async getProductPricing(windowType, material, brand) {
        try {
            const filters = {
                windowType: windowType,
                material: material
            };
            
            if (brand) {
                filters.brand = brand;
            }
            
            const result = await WixDataService.getItems(COLLECTIONS.windowProducts, {
                filters: filters,
                limit: 1
            });
            
            return result.items.length > 0 ? result.items[0] : null;
            
        } catch (error) {
            console.error('Error getting product pricing:', error);
            throw error;
        }
    }
    
    /**
     * Get material multiplier for pricing adjustments
     */
    static getMaterialMultiplier(material) {
        const multipliers = {
            'Vinyl': 1.0,
            'Wood': 1.5,
            'Aluminum': 1.2,
            'Fiberglass': 1.8,
            'Composite': 1.6
        };
        return multipliers[material] || 1.0;
    }
    
    /**
     * Calculate options pricing
     */
    static async calculateOptionsPrice(options) {
        if (!options || options.length === 0) return 0;
        
        try {
            const optionPrices = await this.getOptionPrices();
            
            return options.reduce((total, option) => {
                return total + (optionPrices[option] || 0);
            }, 0);
            
        } catch (error) {
            console.error('Error calculating options price:', error);
            return 0;
        }
    }
    
    /**
     * Get option prices from database
     */
    static async getOptionPrices() {
        try {
            const result = await WixDataService.getItems(COLLECTIONS.windowOptions);
            
            const optionPrices = {};
            result.items.forEach(option => {
                optionPrices[option.name] = option.price || 0;
            });
            
            return optionPrices;
            
        } catch (error) {
            console.error('Error getting option prices:', error);
            
            // Fallback to default prices
            return {
                'Low-E Glass': 150,
                'Argon Fill': 75,
                'Triple Pane': 300,
                'Custom Color': 200,
                'Security Glass': 250,
                'Grilles': 100,
                'Tinted Glass': 125,
                'Impact Resistant': 400
            };
        }
    }
    
    /**
     * Calculate quantity discount
     */
    static calculateQuantityDiscount(quantity) {
        if (quantity >= 20) return 0.15; // 15% discount for 20+ windows
        if (quantity >= 10) return 0.10; // 10% discount for 10+ windows
        if (quantity >= 5) return 0.05;  // 5% discount for 5+ windows
        return 0; // No discount for less than 5 windows
    }
    
    /**
     * Calculate labor and installation pricing
     */
    static async calculateLaborPrice(windowData) {
        try {
            const baseLabor = 150; // Base installation cost per window
            const complexityMultiplier = this.getInstallationComplexityMultiplier(windowData.windowType);
            const sizeMultiplier = this.getSizeMultiplier(windowData.width, windowData.height);
            
            return baseLabor * complexityMultiplier * sizeMultiplier;
            
        } catch (error) {
            console.error('Error calculating labor price:', error);
            return 150; // Default labor cost
        }
    }
    
    /**
     * Get installation complexity multiplier
     */
    static getInstallationComplexityMultiplier(windowType) {
        const multipliers = {
            'Picture': 0.8,
            'Sliding': 1.0,
            'Double-Hung': 1.2,
            'Casement': 1.3,
            'Awning': 1.3,
            'Bay': 2.5,
            'Bow': 3.0
        };
        return multipliers[windowType] || 1.0;
    }
    
    /**
     * Get size multiplier for installation
     */
    static getSizeMultiplier(width, height) {
        const area = (width * height) / 144; // sq ft
        
        if (area > 20) return 1.5; // Large windows
        if (area > 12) return 1.2; // Medium-large windows
        if (area > 8) return 1.0;  // Standard windows
        return 0.9; // Small windows
    }
    
    /**
     * Get tax rate based on location
     */
    static async getTaxRate(location) {
        try {
            if (!location) return 0.08; // Default 8% tax rate
            
            // Get tax rate from configuration
            const config = await WixDataService.getItems(COLLECTIONS.configuration, {
                filters: { type: 'tax_rates' }
            });
            
            if (config.items.length > 0) {
                const taxRates = config.items[0].data || {};
                return taxRates[location] || 0.08;
            }
            
            return 0.08; // Default tax rate
            
        } catch (error) {
            console.error('Error getting tax rate:', error);
            return 0.08; // Default tax rate
        }
    }
}

// ==================== AI ANALYSIS SERVICE ====================

/**
 * AI Analysis Service with Claude integration
 */
class AIAnalysisService {
    
    /**
     * Analyze window image with Claude AI
     */
    static async analyzeWindowImage(imageData, analysisOptions = {}) {
        try {
            const prompt = this.createWindowAnalysisPrompt(analysisOptions);
            const analysisResult = await callClaudeAPI(prompt, imageData, 'window_measurement_analyzer');
            
            // Parse and validate results
            const parsedResults = this.parseAnalysisResults(analysisResult);
            
            // Store analysis results
            const analysisRecord = await this.storeAnalysisResults(parsedResults, analysisOptions);
            
            return {
                success: true,
                analysisId: analysisRecord._id,
                results: parsedResults,
                confidence: parsedResults.confidence || 0,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error analyzing window image:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Generate quote explanation using Claude AI
     */
    static async generateQuoteExplanation(quoteData, customerContext = {}) {
        try {
            const prompt = this.createQuoteExplanationPrompt(quoteData, customerContext);
            const explanation = await callClaudeAPI(prompt, null, 'quote_explanation_generator');
            
            // Store explanation
            await this.storeQuoteExplanation(quoteData, explanation, customerContext);
            
            return {
                success: true,
                explanation: explanation,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error generating quote explanation:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Validate measurements using Claude AI
     */
    static async validateMeasurements(measurementData, validationCriteria = {}) {
        try {
            const prompt = this.createMeasurementValidationPrompt(measurementData, validationCriteria);
            const validationResult = await callClaudeAPI(prompt, null, 'measurement_validator');
            
            const parsedValidation = this.parseValidationResults(validationResult);
            
            // Store validation results
            await this.storeValidationResults(measurementData, parsedValidation);
            
            return {
                success: true,
                validation: parsedValidation,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error validating measurements:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Generate customer communication using Claude AI
     */
    static async generateCustomerCommunication(communicationType, context = {}) {
        try {
            const prompt = this.createCustomerCommunicationPrompt(communicationType, context);
            const communication = await callClaudeAPI(prompt, null, 'customer_communication_generator');
            
            // Store communication
            await this.storeCommunication(communicationType, communication, context);
            
            return {
                success: true,
                communication: communication,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error generating customer communication:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Perform competitive analysis using Claude AI
     */
    static async performCompetitiveAnalysis(competitorData, projectContext = {}) {
        try {
            const prompt = this.createCompetitiveAnalysisPrompt(competitorData, projectContext);
            const analysis = await callClaudeAPI(prompt, null, 'competitive_analysis_tool');
            
            // Store analysis
            await this.storeCompetitiveAnalysis(competitorData, analysis, projectContext);
            
            return {
                success: true,
                analysis: analysis,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error performing competitive analysis:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Calculate energy efficiency using Claude AI
     */
    static async calculateEnergyEfficiency(windowSpecs, homeContext = {}) {
        try {
            const prompt = this.createEnergyEfficiencyPrompt(windowSpecs, homeContext);
            const calculation = await callClaudeAPI(prompt, null, 'energy_efficiency_calculator');
            
            const parsedCalculation = this.parseEnergyCalculation(calculation);
            
            // Store calculation
            await this.storeEnergyCalculation(windowSpecs, parsedCalculation, homeContext);
            
            return {
                success: true,
                calculation: parsedCalculation,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Error calculating energy efficiency:', error);
            
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    // ==================== PROMPT CREATION METHODS ====================
    
    static createWindowAnalysisPrompt(options) {
        return `Please analyze this window image for Good Faith Exteriors:

Analysis Type: ${options.analysisType || 'comprehensive'}
Reference Objects Present: ${options.referenceObjects?.join(', ') || 'Auto-detect'}
Customer Budget Range: ${options.budgetRange || 'Not specified'}
Energy Efficiency Priority: ${options.energyEfficiencyPriority ? 'High' : 'Standard'}
Special Requirements: ${options.specialRequirements || 'None'}

Provide detailed analysis with measurements, specifications, and professional recommendations.

Please structure your response as JSON with the following format:
{
    "measurements": {
        "width": number,
        "height": number,
        "confidence": number
    },
    "windowType": "string",
    "material": "string",
    "condition": "string",
    "recommendations": ["array of strings"],
    "energyEfficiency": {
        "currentRating": "string",
        "recommendedRating": "string",
        "potentialSavings": number
    },
    "confidence": number,
    "notes": "string"
}`;
    }
    
    static createQuoteExplanationPrompt(quoteData, customerContext) {
        return `Create a comprehensive quote explanation for this Good Faith Exteriors project:

Window Specifications: ${JSON.stringify(quoteData.windowSpecs, null, 2)}
Pricing Breakdown: ${JSON.stringify(quoteData.pricing, null, 2)}
Customer Name: ${customerContext.name || 'Valued Customer'}
Communication Style: ${customerContext.style || 'Professional'}
Special Considerations: ${customerContext.notes || 'None'}

Generate a detailed explanation that justifies the investment and highlights Good Faith Exteriors' value proposition.`;
    }
    
    static createMeasurementValidationPrompt(measurementData, criteria) {
        return `Validate these window measurements for Good Faith Exteriors:

Measurements: ${JSON.stringify(measurementData, null, 2)}
Tolerance Requirements: ${criteria.tolerance || '±1/4 inch'}
Confidence Threshold: ${criteria.confidenceThreshold || '85%'}
Special Requirements: ${criteria.specialRequirements || 'Standard'}

Provide comprehensive validation results with recommendations for any issues identified.`;
    }
    
    static createCustomerCommunicationPrompt(communicationType, context) {
        return `Generate ${communicationType} communication for Good Faith Exteriors:

Customer Information: ${JSON.stringify(context.customer, null, 2)}
Project Details: ${JSON.stringify(context.project, null, 2)}
Communication Stage: ${context.stage || 'General'}
Tone Preference: ${context.tone || 'Professional'}
Special Notes: ${context.notes || 'None'}

Create appropriate communication that maintains Good Faith Exteriors' high service standards.`;
    }
    
    static createCompetitiveAnalysisPrompt(competitorData, projectContext) {
        return `Analyze competitor information for Good Faith Exteriors positioning:

Competitor Data: ${JSON.stringify(competitorData, null, 2)}
Project Context: ${JSON.stringify(projectContext, null, 2)}
Customer Budget: ${projectContext.budget || 'Not specified'}
Customer Priorities: ${JSON.stringify(projectContext.priorities, null, 2)}

Provide strategic analysis and recommendations for competitive positioning.`;
    }
    
    static createEnergyEfficiencyPrompt(windowSpecs, homeContext) {
        return `Calculate energy efficiency improvements for Good Faith Exteriors project:

Current Windows: ${JSON.stringify(windowSpecs.current, null, 2)}
Proposed Windows: ${JSON.stringify(windowSpecs.proposed, null, 2)}
Home Details: ${JSON.stringify(homeContext, null, 2)}
Climate Zone: ${homeContext.climateZone || 'Not specified'}
Energy Costs: ${homeContext.energyCosts || 'Average regional rates'}

Provide comprehensive energy efficiency analysis with savings projections.`;
    }
    
    // ==================== RESULT PARSING METHODS ====================
    
    static parseAnalysisResults(analysisText) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback: parse text response
            return this.parseTextAnalysis(analysisText);
            
        } catch (error) {
            console.error('Error parsing analysis results:', error);
            return {
                error: 'Failed to parse analysis results',
                rawText: analysisText,
                confidence: 0
            };
        }
    }
    
    static parseValidationResults(validationText) {
        try {
            // Extract validation information from text
            const isValid = validationText.toLowerCase().includes('pass') || 
                           validationText.toLowerCase().includes('valid');
            
            const confidence = this.extractConfidenceScore(validationText);
            const issues = this.extractIssues(validationText);
            const recommendations = this.extractRecommendations(validationText);
            
            return {
                isValid: isValid,
                confidence: confidence,
                issues: issues,
                recommendations: recommendations,
                fullText: validationText
            };
            
        } catch (error) {
            console.error('Error parsing validation results:', error);
            return {
                isValid: false,
                confidence: 0,
                issues: ['Failed to parse validation results'],
                recommendations: ['Manual review required'],
                fullText: validationText
            };
        }
    }
    
    static parseEnergyCalculation(calculationText) {
        try {
            // Extract energy efficiency data from text
            const annualSavings = this.extractNumber(calculationText, /annual.*savings.*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
            const paybackPeriod = this.extractNumber(calculationText, /payback.*period.*(\d+(?:\.\d+)?)/i);
            const energyRating = this.extractText(calculationText, /energy.*rating.*:?\s*([A-Z][A-Za-z\s]+)/i);
            
            return {
                annualSavings: annualSavings || 0,
                paybackPeriod: paybackPeriod || 0,
                energyRating: energyRating || 'Not specified',
                fullCalculation: calculationText
            };
            
        } catch (error) {
            console.error('Error parsing energy calculation:', error);
            return {
                annualSavings: 0,
                paybackPeriod: 0,
                energyRating: 'Error in calculation',
                fullCalculation: calculationText
            };
        }
    }
    
    // ==================== STORAGE METHODS ====================
    
    static async storeAnalysisResults(results, options) {
        try {
            const analysisRecord = {
                type: 'window_analysis',
                results: results,
                options: options,
                timestamp: new Date(),
                confidence: results.confidence || 0,
                status: 'completed'
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, analysisRecord);
            
        } catch (error) {
            console.error('Error storing analysis results:', error);
            throw error;
        }
    }
    
    static async storeQuoteExplanation(quoteData, explanation, customerContext) {
        try {
            const explanationRecord = {
                type: 'quote_explanation',
                quoteData: quoteData,
                explanation: explanation,
                customerContext: customerContext,
                timestamp: new Date()
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, explanationRecord);
            
        } catch (error) {
            console.error('Error storing quote explanation:', error);
            throw error;
        }
    }
    
    static async storeValidationResults(measurementData, validation) {
        try {
            const validationRecord = {
                type: 'measurement_validation',
                measurementData: measurementData,
                validation: validation,
                timestamp: new Date()
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, validationRecord);
            
        } catch (error) {
            console.error('Error storing validation results:', error);
            throw error;
        }
    }
    
    static async storeCommunication(communicationType, communication, context) {
        try {
            const communicationRecord = {
                type: 'customer_communication',
                communicationType: communicationType,
                communication: communication,
                context: context,
                timestamp: new Date()
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, communicationRecord);
            
        } catch (error) {
            console.error('Error storing communication:', error);
            throw error;
        }
    }
    
    static async storeCompetitiveAnalysis(competitorData, analysis, projectContext) {
        try {
            const analysisRecord = {
                type: 'competitive_analysis',
                competitorData: competitorData,
                analysis: analysis,
                projectContext: projectContext,
                timestamp: new Date()
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, analysisRecord);
            
        } catch (error) {
            console.error('Error storing competitive analysis:', error);
            throw error;
        }
    }
    
    static async storeEnergyCalculation(windowSpecs, calculation, homeContext) {
        try {
            const calculationRecord = {
                type: 'energy_efficiency_calculation',
                windowSpecs: windowSpecs,
                calculation: calculation,
                homeContext: homeContext,
                timestamp: new Date()
            };
            
            return await WixDataService.saveItem(COLLECTIONS.analytics, calculationRecord);
            
        } catch (error) {
            console.error('Error storing energy calculation:', error);
            throw error;
        }
    }
    
    // ==================== UTILITY METHODS ====================
    
    static parseTextAnalysis(text) {
        // Fallback parser for non-JSON responses
        const result = {
            measurements: {},
            windowType: '',
            material: '',
            condition: '',
            recommendations: [],
            confidence: 0,
            notes: text
        };
        
        // Try to extract basic information from text
        const widthMatch = text.match(/width[:\s]+(\d+(?:\.\d+)?)/i);
        const heightMatch = text.match(/height[:\s]+(\d+(?:\.\d+)?)/i);
        const typeMatch = text.match(/window\s+type[:\s]+([a-z\-\s]+)/i);
        const materialMatch = text.match(/material[:\s]+([a-z\s]+)/i);
        
        if (widthMatch) result.measurements.width = parseFloat(widthMatch[1]);
        if (heightMatch) result.measurements.height = parseFloat(heightMatch[1]);
        if (typeMatch) result.windowType = typeMatch[1].trim();
        if (materialMatch) result.material = materialMatch[1].trim();
        
        // Extract confidence score
        result.confidence = this.extractConfidenceScore(text);
        
        return result;
    }
    
    static extractConfidenceScore(text) {
        const confidenceMatch = text.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
        if (confidenceMatch) {
            const score = parseFloat(confidenceMatch[1]);
            return score > 1 ? score / 100 : score; // Convert percentage to decimal if needed
        }
        return 0.5; // Default confidence
    }
    
    static extractIssues(text) {
        const issues = [];
        const issuePatterns = [
            /issue[:\s]+([^.]+)/gi,
            /problem[:\s]+([^.]+)/gi,
            /concern[:\s]+([^.]+)/gi
        ];
        
        issuePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                issues.push(match[1].trim());
            }
        });
        
        return issues;
    }
    
    static extractRecommendations(text) {
        const recommendations = [];
        const recPatterns = [
            /recommend[:\s]+([^.]+)/gi,
            /suggest[:\s]+([^.]+)/gi,
            /advise[:\s]+([^.]+)/gi
        ];
        
        recPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                recommendations.push(match[1].trim());
            }
        });
        
        return recommendations;
    }
    
    static extractNumber(text, pattern) {
        const match = text.match(pattern);
        if (match) {
            return parseFloat(match[1].replace(/,/g, ''));
        }
        return null;
    }
    
    static extractText(text, pattern) {
        const match = text.match(pattern);
        return match ? match[1].trim() : null;
    }
}

// ==================== ANALYTICS AND LOGGING ====================

/**
 * Log analytics events for monitoring and optimization
 */
async function logAnalyticsEvent(eventType, eventData) {
    try {
        const analyticsRecord = {
            eventType: eventType,
            eventData: eventData,
            timestamp: new Date(),
            sessionId: eventData.sessionId || 'unknown'
        };
        
        await WixDataService.saveItem(COLLECTIONS.analytics, analyticsRecord);
        
    } catch (error) {
        console.error('Error logging analytics event:', error);
        // Don't throw error to avoid breaking main functionality
    }
}

// ==================== API ENDPOINTS ====================

/**
 * Analyze window endpoint
 */
export async function post_analyzeWindow(request) {
    try {
        const { imageData, analysisOptions } = await request.body.json();
        
        if (!imageData) {
            return badRequest({ error: 'Image data is required' });
        }
        
        const result = await AIAnalysisService.analyzeWindowImage(imageData, analysisOptions);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in analyzeWindow endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Generate quote explanation endpoint
 */
export async function post_generateQuoteExplanation(request) {
    try {
        const { quoteData, customerContext } = await request.body.json();
        
        if (!quoteData) {
            return badRequest({ error: 'Quote data is required' });
        }
        
        const result = await AIAnalysisService.generateQuoteExplanation(quoteData, customerContext);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in generateQuoteExplanation endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Validate measurements endpoint
 */
export async function post_validateMeasurements(request) {
    try {
        const { measurementData, validationCriteria } = await request.body.json();
        
        if (!measurementData) {
            return badRequest({ error: 'Measurement data is required' });
        }
        
        const result = await AIAnalysisService.validateMeasurements(measurementData, validationCriteria);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in validateMeasurements endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Generate customer communication endpoint
 */
export async function post_generateCustomerCommunication(request) {
    try {
        const { communicationType, context } = await request.body.json();
        
        if (!communicationType) {
            return badRequest({ error: 'Communication type is required' });
        }
        
        const result = await AIAnalysisService.generateCustomerCommunication(communicationType, context);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in generateCustomerCommunication endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Competitive analysis endpoint
 */
export async function post_competitiveAnalysis(request) {
    try {
        const { competitorData, projectContext } = await request.body.json();
        
        if (!competitorData) {
            return badRequest({ error: 'Competitor data is required' });
        }
        
        const result = await AIAnalysisService.performCompetitiveAnalysis(competitorData, projectContext);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in competitiveAnalysis endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Calculate energy efficiency endpoint
 */
export async function post_calculateEnergyEfficiency(request) {
    try {
        const { windowSpecs, homeContext } = await request.body.json();
        
        if (!windowSpecs) {
            return badRequest({ error: 'Window specifications are required' });
        }
        
        const result = await AIAnalysisService.calculateEnergyEfficiency(windowSpecs, homeContext);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in calculateEnergyEfficiency endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Calculate pricing endpoint
 */
export async function post_calculatePricing(request) {
    try {
        const { windowData, options } = await request.body.json();
        
        if (!windowData) {
            return badRequest({ error: 'Window data is required' });
        }
        
        const result = await PricingCalculatorService.calculateWindowPricing(windowData, options);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in calculatePricing endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Get products endpoint
 */
export async function get_products(request) {
    try {
        const { filters, sort, limit, skip } = request.query;
        
        const options = {};
        
        if (filters) {
            options.filters = JSON.parse(filters);
        }
        
        if (sort) {
            options.sort = JSON.parse(sort);
        }
        
        if (limit) {
            options.limit = parseInt(limit);
        }
        
        if (skip) {
            options.skip = parseInt(skip);
        }
        
        const result = await WixDataService.getItems(COLLECTIONS.windowProducts, options);
        
        return ok(result);
        
    } catch (error) {
        console.error('Error in getProducts endpoint:', error);
        return serverError({ error: 'Internal server error' });
    }
}

/**
 * Health check endpoint
 */
export async function get_health(request) {
    try {
        // Test Claude API connection
        const claudeHealthy = await testClaudeConnection();
        
        // Test database connection
        const dbHealthy = await testDatabaseConnection();
        
        const health = {
            status: claudeHealthy && dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date(),
            services: {
                claude: claudeHealthy ? 'healthy' : 'unhealthy',
                database: dbHealthy ? 'healthy' : 'unhealthy'
            }
        };
        
        return ok(health);
        
    } catch (error) {
        console.error('Error in health check:', error);
        return serverError({ 
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date()
        });
    }
}

// ==================== HEALTH CHECK FUNCTIONS ====================

async function testClaudeConnection() {
    try {
        await initializeClaudeAPI();
        
        // Test with a simple prompt
        const testResult = await callClaudeAPI('Test connection', null, 'general_analysis');
        
        return testResult && testResult.length > 0;
        
    } catch (error) {
        console.error('Claude connection test failed:', error);
        return false;
    }
}

async function testDatabaseConnection() {
    try {
        // Test database connection with a simple query
        const testResult = await WixDataService.getItems(COLLECTIONS.configuration, { limit: 1 });
        
        return testResult !== null;
        
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// ==================== EXPORT SERVICES ====================

export {
    WixDataService,
    PricingCalculatorService,
    AIAnalysisService,
    initializeClaudeAPI,
    callClaudeAPI,
    logAnalyticsEvent
};

console.log('✅ Good Faith Exteriors Complete Backend Services - Loaded Successfully');

