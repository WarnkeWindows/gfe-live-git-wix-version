/**
 * Enhanced Pricing Calculator with Hidden Markup
 * Good Faith Exteriors - Advanced Pricing Engine
 * backend/core/pricingCalculator.web.js
 */

import { getMaterials, getWindowTypes, getWindowBrands, getPricingConfiguration } from './dataService.web.js';

// Default pricing configuration with hidden markup
const DEFAULT_PRICING = {
    pricePerUI: 5.58,
    salesMarkup: 1.10,      // 10% sales markup
    installationRate: 0.18,  // 18% of window cost
    taxRate: 0.055,         // 5.5% tax rate
    hiddenMarkup: 1.30,     // 30% HIDDEN MARKUP
    claudeAnalysisBonus: 1.05, // 5% bonus for AI analysis
    minimumOrderValue: 500,
    rushOrderMultiplier: 1.15,
    seasonalAdjustments: {
        spring: 1.0,
        summer: 1.05,
        fall: 0.95,
        winter: 0.90
    }
};

// Option pricing (these are added on top, no markup applied)
const OPTION_PRICING = {
    'Low-E Coating': 50,
    'Enhanced Security Features': 75,
    'Custom Grids': 60,
    'Custom Colors': 80,
    'Argon Gas Fill': 45,
    'Triple-Pane Glass': 200,
    'Grids-Between-Glass': 125,
    'Energy Star Rating': 35,
    'Noise Reduction Package': 90,
    'Hurricane Impact Rating': 150,
    'Custom Hardware': 100,
    'Extended Warranty': 85
};

/**
 * Calculate quote for single window configuration
 * @param {object} windowConfig - The configuration of the window.
 * @param {object} options - Calculation options.
 * @returns {Promise<object>} - The calculated quote result.
 */
export async function calculateWindowQuote(windowConfig, options = {}) {
    try {
        const { 
            claudeAnalysis = null, 
            seasonalAdjustment = false,
            rushOrder = false,
            validateInputs = true 
        } = options;
        
        if (validateInputs) {
            const validation = validateWindowConfig(windowConfig);
            if (!validation.valid) {
                return { success: false, error: validation.error, validationErrors: validation.errors };
            }
        }
        
        console.log('💰 Calculating enhanced quote with hidden markup...');
        
        const [pricingResult, productData] = await Promise.all([
            getPricingConfiguration(),
            loadPricingProductData()
        ]);
        
        if (!pricingResult.success || !productData.success) {
            throw new Error('Failed to load pricing configuration or product data');
        }
        
        const pricing = { ...DEFAULT_PRICING, ...pricingResult.config };
        
        const materialData = findMaterialData(windowConfig.material, productData.materials);
        const typeData = findTypeData(windowConfig.type, productData.types);
        const brandData = findBrandData(windowConfig.brand, productData.brands);
        
        if (!materialData || !typeData || !brandData) {
            return { success: false, error: 'Invalid product selection - could not find matching product data' };
        }
        
        const quote = calculateEnhancedPricing({
            windowConfig, materialData, typeData, brandData, pricing,
            claudeAnalysis, seasonalAdjustment, rushOrder
        });
        
        return { success: true, quote };
        
    } catch (error) {
        console.error('❌ Quote calculation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Calculate quote for multiple windows
 * @param {object[]} windowConfigs - An array of window configurations.
 * @param {object} options - Calculation options.
 * @returns {Promise<object>} - The calculated quote for all windows.
 */
export async function calculateMultiWindowQuote(windowConfigs, options = {}) {
    // ... function implementation as provided in the source file ...
}


/**
 * Core pricing calculation engine with hidden markup strategy
 */
function calculateEnhancedPricing({ windowConfig, materialData, typeData, brandData, pricing, claudeAnalysis, seasonalAdjustment, rushOrder }) {
    const { width, height, quantity = 1, options = [] } = windowConfig;
    
    // Step 1: Base price on Universal Inches (UI)
    const universalInches = parseFloat(width) + parseFloat(height);
    const basePrice = universalInches * pricing.pricePerUI;
    
    // Step 2: Apply product multipliers
    const materialMultiplier = materialData.multiplier || 1.0;
    const typeMultiplier = typeData.multiplier || 1.0;
    const brandMultiplier = brandData.priceMultiplier || 1.0;
    const multipliedPrice = basePrice * materialMultiplier * typeMultiplier * brandMultiplier;
    
    // Step 3: Apply sales markup
    const salesPrice = multipliedPrice * pricing.salesMarkup;
    
    // Step 4: Apply HIDDEN 30% MARKUP
    const hiddenMarkupPrice = salesPrice * pricing.hiddenMarkup;
    const unitPrice = Math.round(hiddenMarkupPrice * 100) / 100;
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    
    // Step 5: Add costs for options (no markup applied)
    let optionsCost = options.reduce((acc, optionName) => acc + (OPTION_PRICING[optionName] || 0), 0) * quantity;
    
    // Step 6: Calculate installation cost (also with hidden markup)
    const installationCost = Math.round((subtotal * pricing.installationRate) * pricing.hiddenMarkup * 100) / 100;
    
    // Step 7: Calculate final totals
    const preTaxTotal = subtotal + optionsCost + installationCost;
    const tax = Math.round(preTaxTotal * pricing.taxRate * 100) / 100;
    const totalPrice = Math.round((preTaxTotal + tax) * 100) / 100;
    
    return {
        unitPrice,
        quantity: parseInt(quantity),
        subtotal,
        optionsCost,
        installationCost,
        tax,
        totalPrice,
        breakdown: { /* ... detailed breakdown ... */ }
    };
}

// ... Other helper functions like validateWindowConfig, loadPricingProductData, etc. ...