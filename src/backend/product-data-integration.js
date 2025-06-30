// Product Data Integration System for Good Faith Exteriors
// Comprehensive product intelligence with Anthropic Claude integration

import { gfePricingTool } from './anthropic-pricing-intelligence.js';
import { wixData } from 'wix-data';
import { getSecret } from 'wix-secrets-backend';

class GFEProductDataIntegration {
  constructor() {
    this.productCache = new Map();
    this.brandMapping = new Map();
    this.materialMapping = new Map();
    this.typeMapping = new Map();
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize product mappings
      await this.loadProductMappings();
      await this.loadBrandData();
      await this.loadMaterialData();
      await this.loadWindowTypes();
      
      this.initialized = true;
      console.log('GFE Product Data Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Product Data Integration:', error);
      throw error;
    }
  }

  // ===================================================================
  // PRODUCT DATA LOADING AND MAPPING
  // ===================================================================

  async loadProductMappings() {
    try {
      // Load Window Products Master Catalog
      const products = await wixData.query('WindowProductsMasterCatalog')
        .limit(1000)
        .find();

      products.items.forEach(product => {
        const key = `${product.brand}_${product.series}_${product.type}_${product.material}`;
        this.productCache.set(key, product);
      });

      console.log(`Loaded ${products.items.length} products into cache`);
    } catch (error) {
      console.error('Error loading product mappings:', error);
      throw error;
    }
  }

  async loadBrandData() {
    try {
      const brands = await wixData.query('WindowBrands')
        .ascending('orderRank')
        .find();

      brands.items.forEach(brand => {
        this.brandMapping.set(brand.name.toLowerCase(), {
          ...brand,
          normalizedName: this.normalizeBrandName(brand.name)
        });
      });

      console.log(`Loaded ${brands.items.length} brands into mapping`);
    } catch (error) {
      console.error('Error loading brand data:', error);
      throw error;
    }
  }

  async loadMaterialData() {
    try {
      const materials = await wixData.query('Materials')
        .find();

      materials.items.forEach(material => {
        this.materialMapping.set(material.name.toLowerCase(), {
          ...material,
          normalizedName: this.normalizeMaterialName(material.name)
        });
      });

      console.log(`Loaded ${materials.items.length} materials into mapping`);
    } catch (error) {
      console.error('Error loading material data:', error);
      throw error;
    }
  }

  async loadWindowTypes() {
    try {
      const types = await wixData.query('WindowTypes')
        .find();

      types.items.forEach(type => {
        this.typeMapping.set(type.name.toLowerCase(), {
          ...type,
          normalizedName: this.normalizeTypeName(type.name)
        });
      });

      console.log(`Loaded ${types.items.length} window types into mapping`);
    } catch (error) {
      console.error('Error loading window types:', error);
      throw error;
    }
  }

  // ===================================================================
  // PRODUCT INTELLIGENCE AND RECOMMENDATIONS
  // ===================================================================

  async analyzeProductCompatibility(windowSpecs, customerRequirements = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const compatibilityAnalysis = await gfePricingTool.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.1,
        system: `You are a product compatibility specialist for Good Faith Exteriors. Your expertise includes analyzing window specifications, customer requirements, and product catalogs to ensure optimal product selection and compatibility.

COMPATIBILITY ANALYSIS FRAMEWORK:
- Technical specification verification
- Performance requirement matching
- Installation feasibility assessment
- Code compliance verification
- Energy efficiency optimization
- Cost-benefit analysis

PRODUCT KNOWLEDGE:
- Andersen A-Series: Entry-level, vinyl, good value
- Andersen E-Series: Premium, wood/composite, high performance
- Andersen 400 Series: Mid-range, wood, traditional styling
- Andersen 100 Series: Budget, vinyl, basic performance
- ProVia: Premium, various materials, custom options

ANALYSIS OBJECTIVES:
1. Verify technical compatibility
2. Identify potential issues or conflicts
3. Recommend optimal product selections
4. Suggest alternative options if needed
5. Highlight performance benefits
6. Assess installation requirements`,

        messages: [{
          role: 'user',
          content: `Analyze product compatibility for this window specification:

WINDOW SPECIFICATIONS:
${JSON.stringify(windowSpecs, null, 2)}

CUSTOMER REQUIREMENTS:
${JSON.stringify(customerRequirements, null, 2)}

AVAILABLE PRODUCTS:
${JSON.stringify(Array.from(this.productCache.values()).slice(0, 20), null, 2)}

Provide comprehensive compatibility analysis including:
1. Technical compatibility verification
2. Performance requirement matching
3. Installation feasibility assessment
4. Alternative product recommendations
5. Potential issues or limitations
6. Optimization suggestions

Format as detailed compatibility report with clear recommendations.`
        }]
      });

      const analysis = compatibilityAnalysis.content[0].text;

      return {
        success: true,
        compatibility: {
          content: analysis,
          confidence: this.calculateCompatibilityConfidence(windowSpecs),
          timestamp: new Date().toISOString(),
          productCount: this.productCache.size
        }
      };

    } catch (error) {
      console.error('Error analyzing product compatibility:', error);
      return {
        success: false,
        error: 'Failed to analyze product compatibility: ' + error.message
      };
    }
  }

  async generateProductRecommendations(customerProfile, projectRequirements) {
    if (!this.initialized) await this.initialize();

    try {
      const recommendations = await gfePricingTool.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.2,
        system: `You are a product recommendation specialist for Good Faith Exteriors. Your role is to analyze customer profiles and project requirements to recommend the optimal window products that balance performance, aesthetics, budget, and long-term value.

RECOMMENDATION FRAMEWORK:
- Customer budget and value priorities
- Performance and energy efficiency needs
- Aesthetic preferences and home style
- Long-term durability and maintenance
- Installation complexity and timeline
- ROI and energy savings potential

PRODUCT PORTFOLIO KNOWLEDGE:
- Andersen A-Series: Best value, vinyl, 20-year warranty
- Andersen E-Series: Premium performance, Fibrex composite, lifetime warranty
- Andersen 400 Series: Traditional wood, classic styling, 20-year warranty
- Andersen 100 Series: Budget-friendly, vinyl, 10-year warranty
- ProVia: Custom options, premium materials, comprehensive warranty

RECOMMENDATION CRITERIA:
1. Budget alignment and value optimization
2. Performance requirement satisfaction
3. Aesthetic compatibility with home style
4. Energy efficiency and savings potential
5. Maintenance and durability considerations
6. Installation complexity and timeline impact`,

        messages: [{
          role: 'user',
          content: `Generate product recommendations for this customer:

CUSTOMER PROFILE:
${JSON.stringify(customerProfile, null, 2)}

PROJECT REQUIREMENTS:
${JSON.stringify(projectRequirements, null, 2)}

AVAILABLE PRODUCT DATA:
${JSON.stringify({
          brands: Array.from(this.brandMapping.values()),
          materials: Array.from(this.materialMapping.values()),
          types: Array.from(this.typeMapping.values())
        }, null, 2)}

Provide comprehensive product recommendations including:
1. Primary product recommendation with detailed rationale
2. Alternative options with pros/cons comparison
3. Budget optimization strategies
4. Performance and energy efficiency analysis
5. Long-term value and ROI projections
6. Installation considerations and timeline

Format as professional recommendation report suitable for customer presentation.`
        }]
      });

      const recommendationContent = recommendations.content[0].text;

      return {
        success: true,
        recommendations: {
          content: recommendationContent,
          confidence: this.calculateRecommendationConfidence(customerProfile),
          timestamp: new Date().toISOString(),
          customerType: customerProfile.budgetRange || 'standard'
        }
      };

    } catch (error) {
      console.error('Error generating product recommendations:', error);
      return {
        success: false,
        error: 'Failed to generate product recommendations: ' + error.message
      };
    }
  }

  async validateProductSpecifications(productSpecs) {
    if (!this.initialized) await this.initialize();

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      // Validate each product specification
      for (const spec of productSpecs) {
        const validation = await this.validateSingleProduct(spec);
        
        if (!validation.isValid) {
          validationResults.isValid = false;
          validationResults.errors.push(...validation.errors);
        }
        
        validationResults.warnings.push(...validation.warnings);
        validationResults.suggestions.push(...validation.suggestions);
      }

      // Use Claude for advanced validation analysis
      const claudeValidation = await gfePricingTool.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.1,
        system: `You are a product specification validation expert for Good Faith Exteriors. Your role is to verify product specifications against industry standards, building codes, and manufacturer requirements.

VALIDATION CRITERIA:
- Dimensional constraints and limitations
- Material compatibility and performance
- Building code compliance requirements
- Manufacturer specification adherence
- Installation feasibility assessment
- Performance optimization opportunities

VALIDATION PROCESS:
1. Technical specification verification
2. Code compliance assessment
3. Performance requirement validation
4. Installation feasibility review
5. Quality assurance protocols
6. Optimization recommendations`,

        messages: [{
          role: 'user',
          content: `Validate these product specifications:

PRODUCT SPECIFICATIONS:
${JSON.stringify(productSpecs, null, 2)}

INITIAL VALIDATION RESULTS:
${JSON.stringify(validationResults, null, 2)}

Provide additional validation analysis including:
1. Technical specification verification
2. Code compliance assessment
3. Performance optimization suggestions
4. Installation considerations
5. Quality assurance recommendations
6. Risk assessment and mitigation

Format as detailed validation report with clear pass/fail status.`
        }]
      });

      const claudeAnalysis = claudeValidation.content[0].text;

      return {
        success: true,
        validation: {
          ...validationResults,
          claudeAnalysis: claudeAnalysis,
          confidence: this.calculateValidationConfidence(validationResults),
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error validating product specifications:', error);
      return {
        success: false,
        error: 'Failed to validate product specifications: ' + error.message
      };
    }
  }

  async generateTechnicalDocumentation(productSpecs, documentType = 'specification') {
    if (!this.initialized) await this.initialize();

    try {
      const documentation = await gfePricingTool.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        system: `You are a technical documentation specialist for Good Faith Exteriors. Your expertise includes creating comprehensive, accurate, and professional documentation for window products and installations.

DOCUMENTATION TYPES:
- Product specifications and technical data sheets
- Installation guides and procedures
- Performance reports and certifications
- Warranty information and coverage details
- Maintenance schedules and procedures
- Energy efficiency reports and calculations

DOCUMENTATION STANDARDS:
- Industry-standard formatting and terminology
- Comprehensive technical accuracy
- Clear, professional presentation
- Compliance with building codes and standards
- Manufacturer specification adherence
- Customer-friendly explanations where appropriate

GOOD FAITH EXTERIORS STANDARDS:
- Professional branding and presentation
- Comprehensive warranty coverage
- Quality assurance protocols
- Customer service excellence
- Technical expertise and reliability`,

        messages: [{
          role: 'user',
          content: `Generate technical documentation:

DOCUMENT TYPE: ${documentType}

PRODUCT SPECIFICATIONS:
${JSON.stringify(productSpecs, null, 2)}

PRODUCT DATA:
${JSON.stringify(Array.from(this.productCache.values()).slice(0, 10), null, 2)}

Create comprehensive ${documentType} documentation including:
1. Complete technical specifications
2. Performance characteristics and ratings
3. Installation requirements and procedures
4. Warranty coverage and terms
5. Maintenance recommendations
6. Energy efficiency data and certifications

Format as professional technical document suitable for customer delivery and contractor reference.`
        }]
      });

      const documentContent = documentation.content[0].text;

      return {
        success: true,
        documentation: {
          content: documentContent,
          type: documentType,
          confidence: 0.9,
          timestamp: new Date().toISOString(),
          productCount: productSpecs.length
        }
      };

    } catch (error) {
      console.error('Error generating technical documentation:', error);
      return {
        success: false,
        error: 'Failed to generate technical documentation: ' + error.message
      };
    }
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  async validateSingleProduct(spec) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Validate dimensions
    if (!spec.width || spec.width < 12 || spec.width > 120) {
      validation.isValid = false;
      validation.errors.push(`Invalid width: ${spec.width}. Must be between 12 and 120 inches.`);
    }

    if (!spec.height || spec.height < 12 || spec.height > 120) {
      validation.isValid = false;
      validation.errors.push(`Invalid height: ${spec.height}. Must be between 12 and 120 inches.`);
    }

    // Validate brand
    if (!this.brandMapping.has(spec.brand?.toLowerCase())) {
      validation.warnings.push(`Brand '${spec.brand}' not found in catalog. Please verify.`);
    }

    // Validate material
    if (!this.materialMapping.has(spec.material?.toLowerCase())) {
      validation.warnings.push(`Material '${spec.material}' not found in catalog. Please verify.`);
    }

    // Validate window type
    if (!this.typeMapping.has(spec.windowType?.toLowerCase())) {
      validation.warnings.push(`Window type '${spec.windowType}' not found in catalog. Please verify.`);
    }

    // Check for optimal sizing
    const universalInches = spec.width + spec.height;
    if (universalInches < 48) {
      validation.suggestions.push('Consider larger window size for better energy efficiency and aesthetics.');
    }

    return validation;
  }

  normalizeBrandName(brandName) {
    return brandName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  normalizeMaterialName(materialName) {
    const materialMap = {
      'fibrex_composite': 'composite',
      'wood_clad': 'wood',
      'vinyl': 'vinyl',
      'aluminum': 'aluminum'
    };
    
    const normalized = materialName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return materialMap[normalized] || normalized;
  }

  normalizeTypeName(typeName) {
    return typeName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  calculateCompatibilityConfidence(specs) {
    let confidence = 0.7; // Base confidence
    
    if (specs.brand && this.brandMapping.has(specs.brand.toLowerCase())) confidence += 0.1;
    if (specs.material && this.materialMapping.has(specs.material.toLowerCase())) confidence += 0.1;
    if (specs.windowType && this.typeMapping.has(specs.windowType.toLowerCase())) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  calculateRecommendationConfidence(customerProfile) {
    let confidence = 0.6; // Base confidence
    
    if (customerProfile.budgetRange) confidence += 0.1;
    if (customerProfile.homeStyle) confidence += 0.1;
    if (customerProfile.energyEfficiencyPriority) confidence += 0.1;
    if (customerProfile.timeline) confidence += 0.1;
    
    return Math.min(confidence, 0.9);
  }

  calculateValidationConfidence(validationResults) {
    if (!validationResults.isValid) return 0.3;
    if (validationResults.warnings.length > 0) return 0.7;
    return 0.9;
  }

  getProductByKey(brand, series, type, material) {
    const key = `${brand}_${series}_${type}_${material}`;
    return this.productCache.get(key);
  }

  clearCache() {
    this.productCache.clear();
    this.brandMapping.clear();
    this.materialMapping.clear();
    this.typeMapping.clear();
    console.log('Product data cache cleared');
  }

  getCacheStats() {
    return {
      products: this.productCache.size,
      brands: this.brandMapping.size,
      materials: this.materialMapping.size,
      types: this.typeMapping.size,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const gfeProductIntegration = new GFEProductDataIntegration();

