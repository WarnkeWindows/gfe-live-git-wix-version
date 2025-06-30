// Unified API Endpoints and Validation for Good Faith Exteriors
// Comprehensive Anthropic-powered pricing and product intelligence API

import { ok, badRequest, serverError } from 'wix-http-functions';
import { gfePricingTool } from './anthropic-pricing-intelligence.js';
import { gfeProductIntegration } from './product-data-integration.js';
import { getSecret } from 'wix-secrets-backend';

// ===================================================================
// API ENDPOINT: COMPREHENSIVE PRICING ANALYSIS
// ===================================================================

export async function post_analyzePricing(request) {
  try {
    const { pricingData, analysisType = 'comprehensive' } = request.body;

    // Validate required data
    if (!pricingData || !pricingData.window_specifications) {
      return badRequest({
        error: 'Missing required pricing data or window specifications'
      });
    }

    // Perform comprehensive pricing analysis
    const analysis = await gfePricingTool.analyzePricingScenario(pricingData);

    if (!analysis.success) {
      return serverError({
        error: 'Failed to analyze pricing scenario',
        details: analysis.error
      });
    }

    return ok({
      success: true,
      analysis: analysis.analysis,
      analysisType: analysisType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analyzePricing endpoint:', error);
    return serverError({
      error: 'Internal server error during pricing analysis',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: QUOTE EXPLANATION GENERATION
// ===================================================================

export async function post_generateQuoteExplanation(request) {
  try {
    const { quoteData, customerProfile = {} } = request.body;

    // Validate required data
    if (!quoteData) {
      return badRequest({
        error: 'Missing required quote data'
      });
    }

    // Generate customer-friendly quote explanation
    const explanation = await gfePricingTool.generateQuoteExplanation(quoteData, customerProfile);

    if (!explanation.success) {
      return serverError({
        error: 'Failed to generate quote explanation',
        details: explanation.error
      });
    }

    return ok({
      success: true,
      explanation: explanation.explanation,
      customerProfile: customerProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in generateQuoteExplanation endpoint:', error);
    return serverError({
      error: 'Internal server error during quote explanation generation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: COMPETITIVE ANALYSIS
// ===================================================================

export async function post_performCompetitiveAnalysis(request) {
  try {
    const { ourQuote, competitorData, marketContext = {} } = request.body;

    // Validate required data
    if (!ourQuote || !competitorData) {
      return badRequest({
        error: 'Missing required quote data or competitor information'
      });
    }

    // Perform competitive analysis
    const analysis = await gfePricingTool.performCompetitiveAnalysis(ourQuote, competitorData, marketContext);

    if (!analysis.success) {
      return serverError({
        error: 'Failed to perform competitive analysis',
        details: analysis.error
      });
    }

    return ok({
      success: true,
      competitiveAnalysis: analysis.competitiveAnalysis,
      marketContext: marketContext,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in performCompetitiveAnalysis endpoint:', error);
    return serverError({
      error: 'Internal server error during competitive analysis',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: ENERGY EFFICIENCY CALCULATION
// ===================================================================

export async function post_calculateEnergyEfficiency(request) {
  try {
    const { windowSpecs, homeData, utilityRates = {} } = request.body;

    // Validate required data
    if (!windowSpecs || !homeData) {
      return badRequest({
        error: 'Missing required window specifications or home data'
      });
    }

    // Calculate energy efficiency and ROI
    const analysis = await gfePricingTool.calculateEnergyEfficiency(windowSpecs, homeData, utilityRates);

    if (!analysis.success) {
      return serverError({
        error: 'Failed to calculate energy efficiency',
        details: analysis.error
      });
    }

    return ok({
      success: true,
      energyAnalysis: analysis.energyAnalysis,
      homeData: homeData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in calculateEnergyEfficiency endpoint:', error);
    return serverError({
      error: 'Internal server error during energy efficiency calculation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: MEASUREMENT VALIDATION
// ===================================================================

export async function post_validateMeasurements(request) {
  try {
    const { measurementData, imageAnalysis = {} } = request.body;

    // Validate required data
    if (!measurementData) {
      return badRequest({
        error: 'Missing required measurement data'
      });
    }

    // Validate measurements using AI analysis
    const validation = await gfePricingTool.validateMeasurements(measurementData, imageAnalysis);

    if (!validation.success) {
      return serverError({
        error: 'Failed to validate measurements',
        details: validation.error
      });
    }

    return ok({
      success: true,
      validation: validation.validation,
      imageAnalysis: imageAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in validateMeasurements endpoint:', error);
    return serverError({
      error: 'Internal server error during measurement validation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: CUSTOMER COMMUNICATION GENERATION
// ===================================================================

export async function post_generateCustomerCommunication(request) {
  try {
    const { communicationType, context, customerData = {} } = request.body;

    // Validate required data
    if (!communicationType || !context) {
      return badRequest({
        error: 'Missing required communication type or context'
      });
    }

    // Generate personalized customer communication
    const communication = await gfePricingTool.generateCustomerCommunication(communicationType, context, customerData);

    if (!communication.success) {
      return serverError({
        error: 'Failed to generate customer communication',
        details: communication.error
      });
    }

    return ok({
      success: true,
      communication: communication.communication,
      communicationType: communicationType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in generateCustomerCommunication endpoint:', error);
    return serverError({
      error: 'Internal server error during customer communication generation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: PRODUCT COMPATIBILITY ANALYSIS
// ===================================================================

export async function post_analyzeProductCompatibility(request) {
  try {
    const { windowSpecs, customerRequirements = {} } = request.body;

    // Validate required data
    if (!windowSpecs) {
      return badRequest({
        error: 'Missing required window specifications'
      });
    }

    // Analyze product compatibility
    const compatibility = await gfeProductIntegration.analyzeProductCompatibility(windowSpecs, customerRequirements);

    if (!compatibility.success) {
      return serverError({
        error: 'Failed to analyze product compatibility',
        details: compatibility.error
      });
    }

    return ok({
      success: true,
      compatibility: compatibility.compatibility,
      customerRequirements: customerRequirements,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in analyzeProductCompatibility endpoint:', error);
    return serverError({
      error: 'Internal server error during product compatibility analysis',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: PRODUCT RECOMMENDATIONS
// ===================================================================

export async function post_generateProductRecommendations(request) {
  try {
    const { customerProfile, projectRequirements } = request.body;

    // Validate required data
    if (!customerProfile || !projectRequirements) {
      return badRequest({
        error: 'Missing required customer profile or project requirements'
      });
    }

    // Generate AI-powered product recommendations
    const recommendations = await gfeProductIntegration.generateProductRecommendations(customerProfile, projectRequirements);

    if (!recommendations.success) {
      return serverError({
        error: 'Failed to generate product recommendations',
        details: recommendations.error
      });
    }

    return ok({
      success: true,
      recommendations: recommendations.recommendations,
      customerProfile: customerProfile,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in generateProductRecommendations endpoint:', error);
    return serverError({
      error: 'Internal server error during product recommendation generation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: PRODUCT SPECIFICATION VALIDATION
// ===================================================================

export async function post_validateProductSpecifications(request) {
  try {
    const { productSpecs } = request.body;

    // Validate required data
    if (!productSpecs || !Array.isArray(productSpecs)) {
      return badRequest({
        error: 'Missing required product specifications array'
      });
    }

    // Validate product specifications
    const validation = await gfeProductIntegration.validateProductSpecifications(productSpecs);

    if (!validation.success) {
      return serverError({
        error: 'Failed to validate product specifications',
        details: validation.error
      });
    }

    return ok({
      success: true,
      validation: validation.validation,
      productCount: productSpecs.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in validateProductSpecifications endpoint:', error);
    return serverError({
      error: 'Internal server error during product specification validation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: TECHNICAL DOCUMENTATION GENERATION
// ===================================================================

export async function post_generateTechnicalDocumentation(request) {
  try {
    const { productSpecs, documentType = 'specification' } = request.body;

    // Validate required data
    if (!productSpecs) {
      return badRequest({
        error: 'Missing required product specifications'
      });
    }

    // Generate technical documentation
    const documentation = await gfeProductIntegration.generateTechnicalDocumentation(productSpecs, documentType);

    if (!documentation.success) {
      return serverError({
        error: 'Failed to generate technical documentation',
        details: documentation.error
      });
    }

    return ok({
      success: true,
      documentation: documentation.documentation,
      documentType: documentType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in generateTechnicalDocumentation endpoint:', error);
    return serverError({
      error: 'Internal server error during technical documentation generation',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: COMPREHENSIVE WINDOW ANALYSIS
// ===================================================================

export async function post_comprehensiveWindowAnalysis(request) {
  try {
    const { 
      windowSpecs, 
      customerProfile, 
      competitorData = [], 
      homeData = {},
      analysisType = 'full'
    } = request.body;

    // Validate required data
    if (!windowSpecs || !customerProfile) {
      return badRequest({
        error: 'Missing required window specifications or customer profile'
      });
    }

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      analysisType: analysisType
    };

    // Perform comprehensive analysis based on type
    if (analysisType === 'full' || analysisType === 'pricing') {
      const pricingAnalysis = await gfePricingTool.analyzePricingScenario({
        window_specifications: windowSpecs,
        customer_context: customerProfile
      });
      results.pricingAnalysis = pricingAnalysis.success ? pricingAnalysis.analysis : null;
    }

    if (analysisType === 'full' || analysisType === 'products') {
      const productRecommendations = await gfeProductIntegration.generateProductRecommendations(
        customerProfile, 
        { windowSpecs }
      );
      results.productRecommendations = productRecommendations.success ? productRecommendations.recommendations : null;
    }

    if (analysisType === 'full' || analysisType === 'competitive') {
      if (competitorData.length > 0) {
        const competitiveAnalysis = await gfePricingTool.performCompetitiveAnalysis(
          { windowSpecs, customerProfile }, 
          competitorData
        );
        results.competitiveAnalysis = competitiveAnalysis.success ? competitiveAnalysis.competitiveAnalysis : null;
      }
    }

    if (analysisType === 'full' || analysisType === 'energy') {
      if (Object.keys(homeData).length > 0) {
        const energyAnalysis = await gfePricingTool.calculateEnergyEfficiency(windowSpecs, homeData);
        results.energyAnalysis = energyAnalysis.success ? energyAnalysis.energyAnalysis : null;
      }
    }

    return ok(results);

  } catch (error) {
    console.error('Error in comprehensiveWindowAnalysis endpoint:', error);
    return serverError({
      error: 'Internal server error during comprehensive window analysis',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: SYSTEM STATUS AND HEALTH CHECK
// ===================================================================

export async function get_systemStatus(request) {
  try {
    const pricingToolStats = gfePricingTool.getCacheStats();
    const productIntegrationStats = gfeProductIntegration.getCacheStats();

    return ok({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      services: {
        pricingTool: {
          initialized: pricingToolStats.initialized,
          cacheSize: pricingToolStats.size,
          confidenceThreshold: pricingToolStats.confidenceThreshold
        },
        productIntegration: {
          initialized: productIntegrationStats.initialized,
          products: productIntegrationStats.products,
          brands: productIntegrationStats.brands,
          materials: productIntegrationStats.materials,
          types: productIntegrationStats.types
        }
      },
      version: '1.0.0',
      environment: 'production'
    });

  } catch (error) {
    console.error('Error in systemStatus endpoint:', error);
    return serverError({
      error: 'Failed to retrieve system status',
      details: error.message
    });
  }
}

// ===================================================================
// API ENDPOINT: CACHE MANAGEMENT
// ===================================================================

export async function post_clearCache(request) {
  try {
    const { cacheType = 'all' } = request.body;

    if (cacheType === 'all' || cacheType === 'pricing') {
      gfePricingTool.clearCache();
    }

    if (cacheType === 'all' || cacheType === 'products') {
      gfeProductIntegration.clearCache();
    }

    return ok({
      success: true,
      message: `Cache cleared: ${cacheType}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in clearCache endpoint:', error);
    return serverError({
      error: 'Failed to clear cache',
      details: error.message
    });
  }
}

// ===================================================================
// VALIDATION UTILITIES
// ===================================================================

function validateWindowSpecification(spec) {
  const errors = [];

  if (!spec.width || typeof spec.width !== 'number' || spec.width < 12 || spec.width > 120) {
    errors.push('Width must be a number between 12 and 120 inches');
  }

  if (!spec.height || typeof spec.height !== 'number' || spec.height < 12 || spec.height > 120) {
    errors.push('Height must be a number between 12 and 120 inches');
  }

  if (!spec.windowType || typeof spec.windowType !== 'string') {
    errors.push('Window type is required and must be a string');
  }

  if (!spec.material || typeof spec.material !== 'string') {
    errors.push('Material is required and must be a string');
  }

  if (!spec.brand || typeof spec.brand !== 'string') {
    errors.push('Brand is required and must be a string');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function validateCustomerProfile(profile) {
  const errors = [];

  if (!profile || typeof profile !== 'object') {
    errors.push('Customer profile is required and must be an object');
    return { isValid: false, errors };
  }

  // Optional validations for better analysis
  const warnings = [];

  if (!profile.budgetRange) {
    warnings.push('Budget range not specified - may affect recommendation accuracy');
  }

  if (!profile.homeStyle) {
    warnings.push('Home style not specified - may affect aesthetic recommendations');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

