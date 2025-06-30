/**
 * Pricing Service
 * Good Faith Exteriors - Window Estimator Backend
 * backend/core/pricing-service.web.js
 * 
 * Handles all pricing calculations with proper business logic
 * Integrates with materials, types, and brands data
 */

import {
    getMaterialByType,
    getWindowTypeByName,
    getWindowBrandByName,
    logSystemEvent
} from './wix-data-service.web.js';

// Default pricing configuration
const DEFAULT_PRICING = {
    pricePerUI: 5.58,
    salesMarkup: 1.10,
    installationRate: 0.18,
    taxRate: 0.055,
    hiddenMarkup: 1.30,
    laborBaseRate: 150.00,
    minimumOrderValue: 500.00
};

// =====================================================================
// PRICING CALCULATION FUNCTIONS
// =====================================================================

/**
 * Calculate Universal Inches (UI) for a window
 */
function calculateUniversalInches(width, height) {
    const widthNum = parseFloat(width) || 36;
    const heightNum = parseFloat(height) || 48;
    
    // UI = (Width + Height) / 2
    return (widthNum + heightNum) / 2;
}

/**
 * Get material multiplier
 */
async function getMaterialMultiplier(materialType) {
    try {
        if (!materialType) return 1.0;
        
        const materialResult = await getMaterialByType(materialType);
        
        if (materialResult.success && materialResult.material) {
            return parseFloat(materialResult.material.materialMultiplier) || 1.0;
        }
        
        // Default multipliers if not found in database
        const defaultMultipliers = {
            'Vinyl': 1.0,
            'Wood': 1.8,
            'Fiberglass': 1.5,
            'Aluminum Clad': 1.6,
            'Cellular PVC': 1.3,
            'Composite': 1.4
        };
        
        return defaultMultipliers[materialType] || 1.0;
        
    } catch (error) {
        console.error('Error getting material multiplier:', error);
        return 1.0;
    }
}

/**
 * Get window type multiplier
 */
async function getWindowTypeMultiplier(windowType) {
    try {
        if (!windowType) return 1.0;
        
        const typeResult = await getWindowTypeByName(windowType);
        
        if (typeResult.success && typeResult.windowType) {
            return parseFloat(typeResult.windowType.typeMultiplier) || 1.0;
        }
        
        // Default multipliers if not found in database
        const defaultMultipliers = {
            'Single Hung': 1.0,
            'Double Hung': 1.1,
            'Casement': 1.2,
            'Awning': 1.15,
            'Sliding': 0.95,
            'Picture': 0.9,
            'Bay': 2.5,
            'Bow': 3.0,
            'Garden': 1.8
        };
        
        return defaultMultipliers[windowType] || 1.0;
        
    } catch (error) {
        console.error('Error getting window type multiplier:', error);
        return 1.0;
    }
}

/**
 * Get brand multiplier
 */
async function getBrandMultiplier(brandName) {
    try {
        if (!brandName) return 1.0;
        
        const brandResult = await getWindowBrandByName(brandName);
        
        if (brandResult.success && brandResult.brand) {
            return parseFloat(brandResult.brand.priceMultiplier) || 1.0;
        }
        
        // Default multipliers if not found in database
        const defaultMultipliers = {
            'Andersen': 1.4,
            'Pella': 1.3,
            'Marvin': 1.5,
            'Windsor': 1.2,
            'ProVia': 1.25,
            'Thermo-Tech': 1.1,
            'Milgard': 1.15,
            'Simonton': 1.0
        };
        
        return defaultMultipliers[brandName] || 1.0;
        
    } catch (error) {
        console.error('Error getting brand multiplier:', error);
        return 1.0;
    }
}

/**
 * Calculate labor cost for a window
 */
function calculateLaborCost(windowData, config) {
    const ui = calculateUniversalInches(windowData.width, windowData.height);
    const quantity = parseInt(windowData.quantity) || 1;
    
    // Base labor rate per UI
    const laborPerUI = config.laborBaseRate / 100; // $1.50 per UI by default
    
    // Labor complexity multiplier based on window type
    const complexityMultipliers = {
        'Single Hung': 1.0,
        'Double Hung': 1.1,
        'Casement': 1.2,
        'Awning': 1.15,
        'Sliding': 0.9,
        'Picture': 0.8,
        'Bay': 2.0,
        'Bow': 2.5,
        'Garden': 1.5
    };
    
    const complexityMultiplier = complexityMultipliers[windowData.windowType] || 1.0;
    
    return ui * laborPerUI * complexityMultiplier * quantity;
}

/**
 * Calculate single window price
 */
async function calculateSingleWindowPrice(windowData, config) {
    try {
        const {
            width = '36',
            height = '48',
            quantity = '1',
            windowType = 'Single Hung',
            material = 'Vinyl',
            brand = 'Standard'
        } = windowData;
        
        // Calculate Universal Inches
        const ui = calculateUniversalInches(width, height);
        const qty = parseInt(quantity) || 1;
        
        // Get multipliers
        const [materialMultiplier, typeMultiplier, brandMultiplier] = await Promise.all([
            getMaterialMultiplier(material),
            getWindowTypeMultiplier(windowType),
            getBrandMultiplier(brand)
        ]);
        
        // Base price calculation
        const basePrice = ui * config.pricePerUI;
        
        // Apply multipliers
        const materialPrice = basePrice * materialMultiplier;
        const typePrice = materialPrice * typeMultiplier;
        const brandPrice = typePrice * brandMultiplier;
        
        // Apply sales markup
        const markedUpPrice = brandPrice * config.salesMarkup;
        
        // Calculate per unit price
        const unitPrice = markedUpPrice;
        
        // Calculate total for quantity
        const subtotal = unitPrice * qty;
        
        // Calculate labor
        const laborCost = calculateLaborCost(windowData, config);
        
        // Calculate total before tax
        const totalBeforeTax = subtotal + laborCost;
        
        // Calculate tax
        const taxAmount = totalBeforeTax * config.taxRate;
        
        // Final total
        const totalPrice = totalBeforeTax + taxAmount;
        
        return {
            success: true,
            window: {
                ...windowData,
                ui: ui.toFixed(2),
                unitPrice: unitPrice.toFixed(2),
                subtotal: subtotal.toFixed(2),
                laborCost: laborCost.toFixed(2),
                taxAmount: taxAmount.toFixed(2),
                totalPrice: totalPrice.toFixed(2),
                multipliers: {
                    material: materialMultiplier,
                    type: typeMultiplier,
                    brand: brandMultiplier
                }
            },
            calculation: {
                basePrice: basePrice.toFixed(2),
                materialPrice: materialPrice.toFixed(2),
                typePrice: typePrice.toFixed(2),
                brandPrice: brandPrice.toFixed(2),
                markedUpPrice: markedUpPrice.toFixed(2)
            }
        };
        
    } catch (error) {
        console.error('Error calculating single window price:', error);
        return {
            success: false,
            error: error.message,
            window: null
        };
    }
}

/**
 * Calculate quote for multiple windows
 */
export async function calculateWindowQuote(windows, customConfig = {}) {
    try {
        if (!Array.isArray(windows) || windows.length === 0) {
            throw new Error('Windows array is required and must not be empty');
        }
        
        // Merge with default pricing configuration
        const config = { ...DEFAULT_PRICING, ...customConfig };
        
        // Calculate each window
        const windowCalculations = await Promise.all(
            windows.map(window => calculateSingleWindowPrice(window, config))
        );
        
        // Check for calculation errors
        const failedCalculations = windowCalculations.filter(calc => !calc.success);
        if (failedCalculations.length > 0) {
            throw new Error(`Failed to calculate ${failedCalculations.length} windows`);
        }
        
        // Extract successful calculations
        const calculatedWindows = windowCalculations.map(calc => calc.window);
        
        // Calculate totals
        const subtotal = calculatedWindows.reduce((sum, window) => 
            sum + parseFloat(window.subtotal), 0
        );
        
        const totalLabor = calculatedWindows.reduce((sum, window) => 
            sum + parseFloat(window.laborCost), 0
        );
        
        const totalTax = calculatedWindows.reduce((sum, window) => 
            sum + parseFloat(window.taxAmount), 0
        );
        
        const grandTotal = calculatedWindows.reduce((sum, window) => 
            sum + parseFloat(window.totalPrice), 0
        );
        
        // Apply minimum order value
        const finalTotal = Math.max(grandTotal, config.minimumOrderValue);
        const minimumApplied = finalTotal > grandTotal;
        
        // Calculate savings estimates (placeholder)
        const estimatedAnnualSavings = grandTotal * 0.15; // 15% energy savings estimate
        const paybackPeriod = grandTotal / estimatedAnnualSavings;
        
        const quote = {
            windows: calculatedWindows,
            summary: {
                windowCount: calculatedWindows.length,
                totalQuantity: calculatedWindows.reduce((sum, window) => 
                    sum + parseInt(window.quantity), 0
                ),
                subtotal: subtotal.toFixed(2),
                totalLabor: totalLabor.toFixed(2),
                totalTax: totalTax.toFixed(2),
                grandTotal: grandTotal.toFixed(2),
                finalTotal: finalTotal.toFixed(2),
                minimumApplied,
                minimumOrderValue: config.minimumOrderValue.toFixed(2)
            },
            energySavings: {
                estimatedAnnualSavings: estimatedAnnualSavings.toFixed(2),
                paybackPeriod: paybackPeriod.toFixed(1),
                lifetimeSavings: (estimatedAnnualSavings * 20).toFixed(2) // 20-year estimate
            },
            configuration: config,
            timestamp: new Date().toISOString()
        };
        
        // Log successful quote calculation
        await logSystemEvent({
            eventType: 'quote_calculated',
            message: 'Window quote calculated successfully',
            details: {
                windowCount: calculatedWindows.length,
                totalValue: finalTotal,
                timestamp: quote.timestamp
            }
        });
        
        return {
            success: true,
            quote,
            calculation: windowCalculations.map(calc => calc.calculation)
        };
        
    } catch (error) {
        console.error('Error calculating window quote:', error);
        
        // Log error
        await logSystemEvent({
            eventType: 'quote_calculation_error',
            level: 'error',
            message: 'Window quote calculation failed',
            details: {
                error: error.message,
                windowCount: windows?.length || 0
            }
        });
        
        return {
            success: false,
            error: error.message,
            quote: null
        };
    }
}

/**
 * Get pricing breakdown for a single window (for display purposes)
 */
export async function getPricingBreakdown(windowData, customConfig = {}) {
    try {
        const config = { ...DEFAULT_PRICING, ...customConfig };
        const result = await calculateSingleWindowPrice(windowData, config);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return {
            success: true,
            breakdown: {
                window: result.window,
                calculation: result.calculation,
                config
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message,
            breakdown: null
        };
    }
}

