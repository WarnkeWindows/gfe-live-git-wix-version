/**
 * Anthropic AI Service - Good Faith Exteriors
 * backend/ai/anthropic-service.web.js
 * 
 * UNIFIED AI service using Claude for window analysis and consultation
 * SYNCHRONIZED with iframe communication and constants
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { 
    SECRETS, 
    CONSTANTS, 
    createSuccessResponse, 
    createErrorResponse,
    createIframeResponse
} from '../config/collections.js';
import { logSystemEvent } from '../core/wix-data-service.web.js';

// =====================================================================
// UNIFIED ANTHROPIC CONFIGURATION
// =====================================================================

const ANTHROPIC_CONFIG = {
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    model: CONSTANTS.AI.CLAUDE_MODEL,
    maxTokens: CONSTANTS.AI.MAX_TOKENS,
    temperature: CONSTANTS.AI.TEMPERATURE,
    version: CONSTANTS.AI.CLAUDE_VERSION,
    maxRetries: CONSTANTS.API.MAX_RETRIES,
    rateLimitPerMinute: CONSTANTS.API.RATE_LIMIT_PER_MINUTE,
    timeoutMs: CONSTANTS.API.TIMEOUT
};

const UNIFIED_SYSTEM_PROMPT = `You are the Good Faith Window Advisor, an expert window replacement consultant for Good Faith Exteriors in Minneapolis, Minnesota. 

You have deep expertise in:
- Window types, materials, and installation requirements for Minnesota climate
- Energy efficiency ratings and performance characteristics  
- Local building codes and seasonal considerations
- Cost estimation and value-based recommendations
- Image analysis for window condition assessment
- Universal Inches pricing methodology

Company Information:
- Good Faith Exteriors serves Minneapolis, Minnesota
- Owners: Nick Warnke (Nick@goodfaithexteriors.com) and Rich Farchione (Rich@goodfaithexteriors.com)
- Website: goodfaithexteriors.com
- Focus on honest pricing and quality installations

Communication Context:
- You communicate through an iframe-based system with unified protocols
- Your responses are processed by the unified backend integration
- Maintain consistency with the established UI element structure
- Support both desktop and mobile interaction modes

Analysis Standards:
- Always provide confidence scores (0-100) for assessments
- Use structured data format for iframe communication compatibility
- Acknowledge measurement limitations from photos
- Focus on practical solutions for Minnesota climate conditions
- Provide clear recommendations with actionable next steps

Your responses should be professional, informative, and tailored to Minnesota's climate conditions including harsh winters and energy efficiency requirements.`;

// Rate limiting state (in-memory for Velo compatibility)
let requestCounts = new Map();
let lastResetTime = Date.now();

// API credentials cache
let anthropicApiKey = null;
let anthropicOrgId = null;

// =====================================================================
// UNIFIED INITIALIZATION AND AUTHENTICATION
// =====================================================================

/**
 * Initializes Anthropic service with unified credential management
 */
async function initializeAnthropicService() {
    try {
        if (!anthropicApiKey) {
            // Try multiple secret names for compatibility
            anthropicApiKey = await getSecret(SECRETS.CLAUDE_API_KEY) || 
                            await getSecret(SECRETS.ANTHROPIC_API_KEY);
            
            if (!anthropicApiKey) {
                throw new Error('Claude API key not found in secrets manager');
            }
            
            // Optional: Get organization ID
            try {
                anthropicOrgId = await getSecret(SECRETS.CLAUDE_ORG_ID);
            } catch (error) {
                console.warn('Claude organization ID not found, continuing without it');
            }
            
            console.log('✅ Anthropic service initialized with unified configuration');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Anthropic service:', error);
        throw new Error(`Anthropic service initialization failed: ${error.message}`);
    }
}

/**
 * Gets unified Anthropic API headers
 */
function getAnthropicHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': ANTHROPIC_CONFIG.version
    };
    
    if (anthropicOrgId) {
        headers['anthropic-organization'] = anthropicOrgId;
    }
    
    return headers;
}

// =====================================================================
// UNIFIED RATE LIMITING
// =====================================================================

/**
 * Enforces unified rate limiting for API calls
 */
function enforceRateLimit() {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    // Reset counter every minute
    if (now - lastResetTime > oneMinute) {
        requestCounts.clear();
        lastResetTime = now;
    }
    
    const currentCount = requestCounts.get('api_calls') || 0;
    
    if (currentCount >= ANTHROPIC_CONFIG.rateLimitPerMinute) {
        throw new Error(`${CONSTANTS.ERRORS.SYSTEM.RATE_LIMIT_ERROR}: ${ANTHROPIC_CONFIG.rateLimitPerMinute} requests per minute`);
    }
    
    requestCounts.set('api_calls', currentCount + 1);
    return true;
}

// =====================================================================
// UNIFIED CORE API COMMUNICATION
// =====================================================================

/**
 * Makes unified API call to Anthropic with enhanced retry logic
 */
async function makeAnthropicAPICall(messages, tools = null, retryCount = 0) {
    try {
        // Initialize service if needed
        await initializeAnthropicService();
        
        // Enforce rate limiting
        enforceRateLimit();
        
        const requestBody = {
            model: ANTHROPIC_CONFIG.model,
            max_tokens: ANTHROPIC_CONFIG.maxTokens,
            temperature: ANTHROPIC_CONFIG.temperature,
            system: UNIFIED_SYSTEM_PROMPT,
            messages: messages
        };
        
        if (tools && tools.length > 0) {
            requestBody.tools = tools;
        }
        
        console.log(`🤖 Making Anthropic API call (attempt ${retryCount + 1})`);
        
        const response = await fetch(ANTHROPIC_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: getAnthropicHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        // Log successful API call with unified format
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.API_CALL_MADE,
            level: 'info',
            message: 'Anthropic API call successful',
            details: {
                model: ANTHROPIC_CONFIG.model,
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0,
                retryCount,
                timestamp: new Date().toISOString()
            }
        });
        
        return {
            success: true,
            data,
            usage: data.usage
        };
        
    } catch (error) {
        console.error(`❌ Anthropic API call failed (attempt ${retryCount + 1}):`, error);
        
        // Enhanced retry logic for transient errors
        if (retryCount < ANTHROPIC_CONFIG.maxRetries) {
            const isRetryableError = error.message.includes('timeout') || 
                                   error.message.includes('429') ||
                                   error.message.includes('500') ||
                                   error.message.includes('502') ||
                                   error.message.includes('503') ||
                                   error.message.includes('504');
            
            if (isRetryableError) {
                const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay}ms...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return await makeAnthropicAPICall(messages, tools, retryCount + 1);
            }
        }
        
        // Log failed API call with unified format
        await logSystemEvent({
            eventType: CONSTANTS.EVENTS.ERROR_OCCURRED,
            level: 'error',
            message: 'Anthropic API call failed',
            details: {
                error: error.message,
                retryCount,
                model: ANTHROPIC_CONFIG.model,
                timestamp: new Date().toISOString()
            }
        });
        
        throw error;
    }
}

// =====================================================================
// UNIFIED IMAGE ANALYSIS FUNCTIONS
// =====================================================================

/**
 * Analyzes window image using Claude Vision with unified response format
 */
export async function analyzeWindowImage(imageData, analysisOptions = {}) {
    try {
        console.log('🖼️ Starting unified window image analysis...');
        
        // Validate image data
        if (!imageData) {
            throw new Error(CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD + ': imageData');
        }
        
        // Remove data URL prefix if present
        const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Validate image size
        const imageSizeBytes = (base64Image.length * 3) / 4;
        if (imageSizeBytes > CONSTANTS.AI.MAX_IMAGE_SIZE) {
            throw new Error(`${CONSTANTS.ERRORS.AI.IMAGE_TOO_LARGE}: ${Math.round(imageSizeBytes / 1024 / 1024)}MB (max: ${Math.round(CONSTANTS.AI.MAX_IMAGE_SIZE / 1024 / 1024)}MB)`);
        }
        
        // Enhanced analysis prompt with unified structure
        const messages = [
            {
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        type: 'text',
                        text: `Please analyze this window image for Good Faith Exteriors with unified response format for iframe communication:

**Analysis Requirements:**
1. **Window Count**: How many windows are visible?
2. **Window Types**: Identify type(s) - casement, double-hung, sliding, etc.
3. **Materials**: Frame material(s) - vinyl, wood, aluminum, composite
4. **Condition Assessment**: Overall condition, visible issues, age estimate
5. **Measurements**: Estimated dimensions if possible (note limitations)
6. **Recommendations**: Replacement recommendations for Minnesota climate
7. **Energy Efficiency**: Current efficiency estimate and improvement potential

**Context:**
- Location: Minneapolis, Minnesota (harsh winters, energy efficiency critical)
- Device: ${analysisOptions.deviceType || 'desktop'}
- Source: ${analysisOptions.source || 'website'} 
- Session: ${analysisOptions.sessionId || 'unknown'}

**Response Format Requirements:**
- Provide confidence scores (0-100) for each assessment
- Use structured format compatible with iframe communication
- Acknowledge measurement limitations from photos
- Focus on practical, actionable recommendations
- Include specific details for pricing system integration

**Quality Standards:**
- Be thorough but acknowledge analysis limitations
- Provide specific recommendations for Minnesota climate
- Include energy efficiency considerations
- Suggest next steps for accurate measurements`
                    }
                ]
            }
        ];
        
        const result = await makeAnthropicAPICall(messages);
        
        if (!result.success) {
            throw new Error(CONSTANTS.ERRORS.AI.ANALYSIS_FAILED);
        }
        
        const responseText = result.data.content[0].text;
        
        // Parse response with enhanced structure
        const analysis = parseUnifiedAnalysisResponse(responseText, analysisOptions);
        
        // Add unified metadata
        analysis.sessionId = analysisOptions.sessionId;
        analysis.source = analysisOptions.source || CONSTANTS.IFRAME_SOURCES.WEBSITE;
        analysis.mode = analysisOptions.mode || 'desktop';
        analysis.deviceType = analysisOptions.deviceType || 'desktop';
        analysis.analysisDate = new Date().toISOString();
        analysis.modelUsed = ANTHROPIC_CONFIG.model;
        analysis.apiVersion = ANTHROPIC_CONFIG.version;
        
        console.log('✅ Unified window image analysis completed successfully');
        
        return createSuccessResponse({
            analysis: analysis.structured,
            measurements: analysis.measurements,
            recommendations: analysis.recommendations,
            confidence: analysis.overallConfidence,
            fullResponse: responseText,
            usage: result.usage,
            metadata: {
                sessionId: analysis.sessionId,
                source: analysis.source,
                deviceType: analysis.deviceType,
                qualityScore: calculateAnalysisQualityScore(analysis)
            }
        }, CONSTANTS.SUCCESS.ANALYSIS_COMPLETE);
        
    } catch (error) {
        console.error('❌ Unified window image analysis failed:', error);
        return createErrorResponse(error, 'analyzeWindowImage');
    }
}

/**
 * Parses Claude's analysis response with unified structure
 */
function parseUnifiedAnalysisResponse(responseText, options = {}) {
    try {
        const analysis = {
            structured: {},
            measurements: {},
            recommendations: [],
            overallConfidence: 0
        };
        
        // Extract window count with validation
        const windowCountMatch = responseText.match(/window[s]?\s*count[:\s]*(\d+)/i);
        if (windowCountMatch) {
            analysis.structured.windowsDetected = parseInt(windowCountMatch[1]);
        } else {
            analysis.structured.windowsDetected = 1; // Default assumption
        }
        
        // Extract window types with enhanced patterns
        const typePatterns = [
            { pattern: /double[- ]hung/i, type: 'double-hung' },
            { pattern: /casement/i, type: 'casement' },
            { pattern: /sliding/i, type: 'sliding' },
            { pattern: /picture/i, type: 'picture' },
            { pattern: /bay/i, type: 'bay' },
            { pattern: /bow/i, type: 'bow' },
            { pattern: /awning/i, type: 'awning' },
            { pattern: /hopper/i, type: 'hopper' },
            { pattern: /garden/i, type: 'garden' }
        ];
        
        const detectedTypes = [];
        typePatterns.forEach(({ pattern, type }) => {
            if (pattern.test(responseText)) {
                detectedTypes.push(type);
            }
        });
        
        analysis.structured.windowType = detectedTypes[0] || 'unknown';
        analysis.structured.allDetectedTypes = detectedTypes;
        
        // Extract materials with enhanced patterns
        const materialPatterns = [
            { pattern: /vinyl/i, material: 'vinyl' },
            { pattern: /wood/i, material: 'wood' },
            { pattern: /aluminum/i, material: 'aluminum' },
            { pattern: /composite/i, material: 'composite' },
            { pattern: /fiberglass/i, material: 'fiberglass' }
        ];
        
        const detectedMaterials = [];
        materialPatterns.forEach(({ pattern, material }) => {
            if (pattern.test(responseText)) {
                detectedMaterials.push(material);
            }
        });
        
        analysis.structured.material = detectedMaterials[0] || 'unknown';
        analysis.structured.allDetectedMaterials = detectedMaterials;
        
        // Extract condition with standardized values
        const conditionPatterns = [
            { pattern: /excellent/i, condition: 'excellent' },
            { pattern: /good/i, condition: 'good' },
            { pattern: /fair/i, condition: 'fair' },
            { pattern: /poor/i, condition: 'poor' }
        ];
        
        let detectedCondition = 'unknown';
        for (const { pattern, condition } of conditionPatterns) {
            if (pattern.test(responseText)) {
                detectedCondition = condition;
                break;
            }
        }
        analysis.structured.condition = detectedCondition;
        
        // Extract confidence scores with enhanced parsing
        const confidenceMatches = responseText.match(/confidence[:\s]*(\d+)%?/gi);
        if (confidenceMatches && confidenceMatches.length > 0) {
            const confidenceScores = confidenceMatches.map(match => {
                const num = match.match(/(\d+)/);
                return num ? parseInt(num[1]) : 0;
            });
            analysis.overallConfidence = Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length);
        } else {
            // Calculate confidence based on detection quality
            let confidence = 40; // Base confidence
            if (analysis.structured.windowsDetected > 0) confidence += 20;
            if (analysis.structured.windowType !== 'unknown') confidence += 15;
            if (analysis.structured.material !== 'unknown') confidence += 15;
            if (analysis.structured.condition !== 'unknown') confidence += 10;
            analysis.overallConfidence = Math.min(confidence, 95);
        }
        
        // Extract measurements with enhanced validation
        const measurementPatterns = [
            /(\d+\.?\d*)\s*['"]\s*[x×]\s*(\d+\.?\d*)\s*['"]?/,
            /(\d+\.?\d*)\s*['"x×]\s*(\d+\.?\d*)/,
            /width[:\s]*(\d+\.?\d*)\s*.*height[:\s]*(\d+\.?\d*)/i,
            /(\d+\.?\d*)\s*by\s*(\d+\.?\d*)/i
        ];
        
        for (const pattern of measurementPatterns) {
            const measurementMatch = responseText.match(pattern);
            if (measurementMatch) {
                const width = parseFloat(measurementMatch[1]);
                const height = parseFloat(measurementMatch[2]);
                
                // Validate measurements are reasonable
                if (width >= 6 && width <= 120 && height >= 6 && height <= 144) {
                    analysis.measurements = {
                        width,
                        height,
                        unit: 'inches',
                        note: 'Estimated from image - physical measurement required for accuracy',
                        confidence: Math.min(analysis.overallConfidence, 70) // Lower confidence for measurements
                    };
                    break;
                }
            }
        }
        
        // Extract recommendations with categorization
        const recommendationSections = responseText.match(/recommendation[s]?[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);
        if (recommendationSections) {
            const recText = recommendationSections[1];
            const rawRecommendations = recText.split(/[.\n]/)
                .filter(rec => rec.trim().length > 10)
                .map(rec => rec.trim());
            
            // Categorize recommendations
            analysis.recommendations = rawRecommendations.map(rec => ({
                text: rec,
                category: categorizeRecommendation(rec),
                priority: calculateRecommendationPriority(rec)
            }));
        }
        
        // Ensure minimum data structure
        if (!analysis.recommendations || analysis.recommendations.length === 0) {
            analysis.recommendations = [{
                text: 'Schedule professional measurement consultation for accurate assessment',
                category: 'measurement',
                priority: 'high'
            }];
        }
        
        return analysis;
        
    } catch (error) {
        console.error('Failed to parse unified analysis response:', error);
        return {
            structured: {
                windowsDetected: 1,
                windowType: 'unknown',
                material: 'unknown',
                condition: 'unknown'
            },
            measurements: {},
            recommendations: [{
                text: 'Manual inspection recommended for accurate assessment',
                category: 'measurement',
                priority: 'high'
            }],
            overallConfidence: 30
        };
    }
}

/**
 * Categorizes recommendations for better organization
 */
function categorizeRecommendation(recommendation) {
    const recLower = recommendation.toLowerCase();
    
    if (recLower.includes('measurement') || recLower.includes('measure')) return 'measurement';
    if (recLower.includes('energy') || recLower.includes('efficiency')) return 'energy';
    if (recLower.includes('material') || recLower.includes('frame')) return 'material';
    if (recLower.includes('installation') || recLower.includes('install')) return 'installation';
    if (recLower.includes('maintenance') || recLower.includes('repair')) return 'maintenance';
    
    return 'general';
}

/**
 * Calculates recommendation priority
 */
function calculateRecommendationPriority(recommendation) {
    const recLower = recommendation.toLowerCase();
    
    if (recLower.includes('urgent') || recLower.includes('immediate')) return 'high';
    if (recLower.includes('soon') || recLower.includes('important')) return 'medium';
    
    return 'low';
}

/**
 * Calculates analysis quality score for unified tracking
 */
function calculateAnalysisQualityScore(analysis) {
    let score = 0;
    const weights = {
        windowsDetected: 0.2,
        windowType: 0.2,
        material: 0.2,
        condition: 0.1,
        measurements: 0.2,
        confidence: 0.1
    };
    
    if (analysis.structured.windowsDetected > 0) score += weights.windowsDetected;
    if (analysis.structured.windowType !== 'unknown') score += weights.windowType;
    if (analysis.structured.material !== 'unknown') score += weights.material;
    if (analysis.structured.condition !== 'unknown') score += weights.condition;
    if (analysis.measurements && analysis.measurements.width) score += weights.measurements;
    if (analysis.overallConfidence > 70) score += weights.confidence;
    
    return Math.round(score * 100);
}

// =====================================================================
// UNIFIED QUOTE EXPLANATION FUNCTIONS
// =====================================================================

/**
 * Generates personalized quote explanation with unified format
 */
export async function generateQuoteExplanation(quoteData, customerProfile = {}) {
    try {
        console.log('📝 Generating unified quote explanation...');
        
        if (!quoteData) {
            throw new Error(CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD + ': quoteData');
        }
        
        // Enhanced prompt with unified context
        const messages = [
            {
                role: 'user',
                content: `Generate a personalized quote explanation for Good Faith Exteriors with unified formatting:

**Quote Details:**
${JSON.stringify(quoteData, null, 2)}

**Customer Profile:**
${JSON.stringify(customerProfile, null, 2)}

**Unified Requirements:**
1. Use professional but friendly tone consistent with iframe communication
2. Highlight value propositions specific to Minnesota climate
3. Address energy efficiency benefits with specific details
4. Explain pricing methodology including Universal Inches calculation
5. Include next steps that align with our unified customer journey
6. Mention owners Nick Warnke and Rich Farchione's commitment to quality
7. Format for both desktop and mobile display compatibility

**Company Context:**
- Good Faith Exteriors serves Minneapolis, Minnesota
- Family-owned business focused on honest pricing and quality
- Owners: Nick Warnke (Nick@goodfaithexteriors.com) and Rich Farchione (Rich@goodfaithexteriors.com)
- Website: goodfaithexteriors.com
- Specializes in energy-efficient windows for Minnesota winters
- Uses Universal Inches pricing methodology for transparency

**Communication Context:**
- Source: ${customerProfile.source || CONSTANTS.IFRAME_SOURCES.WEBSITE}
- Device: ${customerProfile.deviceType || 'desktop'}
- Mode: ${customerProfile.mode || 'desktop'}

Format as a warm, personal communication that integrates with our unified customer experience. Include specific quote details to demonstrate understanding of their needs.`
            }
        ];
        
        const result = await makeAnthropicAPICall(messages);
        
        if (!result.success) {
            throw new Error(CONSTANTS.ERRORS.AI.ANALYSIS_FAILED + ': Quote explanation generation failed');
        }
        
        const explanation = result.data.content[0].text;
        
        console.log('✅ Unified quote explanation generated successfully');
        
        return createSuccessResponse({
            explanation,
            generatedAt: new Date().toISOString(),
            model: ANTHROPIC_CONFIG.model,
            usage: result.usage,
            metadata: {
                source: customerProfile.source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
                deviceType: customerProfile.deviceType || 'desktop',
                quoteValue: quoteData.total || 0
            }
        }, CONSTANTS.SUCCESS.QUOTE_CREATED);
        
    } catch (error) {
        console.error('❌ Unified quote explanation generation failed:', error);
        return createErrorResponse(error, 'generateQuoteExplanation');
    }
}

// =====================================================================
// UNIFIED MEASUREMENT VALIDATION FUNCTIONS
// =====================================================================

/**
 * Validates measurements using AI analysis with unified response
 */
export async function validateMeasurements(measurements, windowType, context = {}) {
    try {
        console.log('📏 Validating measurements with unified AI analysis...');
        
        if (!measurements || !windowType) {
            throw new Error(CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD + ': measurements and windowType');
        }
        
        const messages = [
            {
                role: 'user',
                content: `As a Good Faith Exteriors window expert, validate these measurements with unified response format:

**Measurements:**
- Width: ${measurements.width} inches
- Height: ${measurements.height} inches
- Window Type: ${windowType}

**Context:**
${JSON.stringify(context, null, 2)}

**Unified Validation Requirements:**
1. Check if dimensions are realistic for this window type
2. Identify any potential measurement errors or anomalies
3. Suggest corrections if needed with specific recommendations
4. Consider standard window sizes and Minnesota building practices
5. Flag any safety or installation concerns
6. Provide confidence score (0-100) with reasoning
7. Format response for iframe communication compatibility

**Standard Window Ranges (Minnesota):**
- Typical width: 24-72 inches
- Typical height: 24-96 inches  
- Common sizes: 24x24, 36x48, 48x72, 60x48, etc.
- Consider egress requirements for bedrooms

**Device Context:** ${context.deviceType || 'desktop'}
**Source:** ${context.source || CONSTANTS.IFRAME_SOURCES.WEBSITE}

Respond with structured validation results that integrate with our unified customer experience.`
            }
        ];
        
        const result = await makeAnthropicAPICall(messages);
        
        if (!result.success) {
            throw new Error(CONSTANTS.ERRORS.AI.ANALYSIS_FAILED + ': Measurement validation failed');
        }
        
        const validationText = result.data.content[0].text;
        const validation = parseUnifiedMeasurementValidation(validationText, measurements);
        
        console.log('✅ Unified measurement validation completed');
        
        return createSuccessResponse({
            validation,
            originalMeasurements: measurements,
            windowType,
            usage: result.usage,
            metadata: {
                source: context.source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
                deviceType: context.deviceType || 'desktop'
            }
        });
        
    } catch (error) {
        console.error('❌ Unified measurement validation failed:', error);
        return createErrorResponse(error, 'validateMeasurements');
    }
}

/**
 * Parses measurement validation with unified structure
 */
function parseUnifiedMeasurementValidation(validationText, originalMeasurements) {
    try {
        const validation = {
            isValid: true,
            confidence: 85,
            issues: [],
            recommendations: [],
            suggestedMeasurements: null,
            qualityScore: 0
        };
        
        // Check for validation issues
        const issueKeywords = ['error', 'incorrect', 'invalid', 'unusual', 'suspicious', 'concern'];
        issueKeywords.forEach(keyword => {
            if (validationText.toLowerCase().includes(keyword)) {
                validation.issues.push(`Potential ${keyword} detected in measurements`);
                validation.isValid = false;
            }
        });
        
        // Extract confidence score
        const confidenceMatch = validationText.match(/confidence[:\s]*(\d+)%?/i);
        if (confidenceMatch) {
            validation.confidence = parseInt(confidenceMatch[1]);
        }
        
        // Validate measurements against standards
        const width = parseFloat(originalMeasurements.width);
        const height = parseFloat(originalMeasurements.height);
        
        // Width validation
        if (width < 12 || width > 120) {
            validation.issues.push('Width outside typical range (12-120 inches)');
            validation.isValid = false;
        }
        
        // Height validation
        if (height < 12 || height > 144) {
            validation.issues.push('Height outside typical range (12-144 inches)');
            validation.isValid = false;
        }
        
        // Aspect ratio validation
        if (width > height * 3) {
            validation.issues.push('Window appears unusually wide for height');
            validation.confidence = Math.min(validation.confidence, 60);
        }
        
        if (height > width * 4) {
            validation.issues.push('Window appears unusually tall for width');
            validation.confidence = Math.min(validation.confidence, 60);
        }
        
        // Generate recommendations based on issues
        if (!validation.isValid) {
            validation.recommendations.push('Physical measurement verification strongly recommended');
            validation.recommendations.push('Consider scheduling professional measurement consultation');
        }
        
        if (validation.confidence < 70) {
            validation.recommendations.push('Schedule in-person measurement for accurate quote');
        }
        
        // Calculate quality score
        validation.qualityScore = calculateMeasurementQualityScore(validation, width, height);
        
        return validation;
        
    } catch (error) {
        console.error('Failed to parse unified measurement validation:', error);
        return {
            isValid: false,
            confidence: 50,
            issues: ['Validation parsing failed'],
            recommendations: ['Manual verification required'],
            suggestedMeasurements: null,
            qualityScore: 25
        };
    }
}

/**
 * Calculates measurement quality score
 */
function calculateMeasurementQualityScore(validation, width, height) {
    let score = 100;
    
    // Deduct for issues
    score -= validation.issues.length * 20;
    
    // Deduct for low confidence
    if (validation.confidence < 80) score -= 20;
    if (validation.confidence < 60) score -= 20;
    
    // Deduct for unusual dimensions
    if (width < 18 || width > 96) score -= 10;
    if (height < 18 || height > 96) score -= 10;
    
    return Math.max(score, 0);
}

// =====================================================================
// UNIFIED CUSTOMER COMMUNICATION FUNCTIONS
// =====================================================================

/**
 * Generates customer communication content with unified formatting
 */
export async function generateCustomerCommunication(customerInfo, messageType, contextData = {}) {
    try {
        console.log(`💬 Generating unified ${messageType} communication...`);
        
        if (!customerInfo || !messageType) {
            throw new Error(CONSTANTS.ERRORS.VALIDATION.REQUIRED_FIELD + ': customerInfo and messageType');
        }
        
        const prompts = {
            welcome: `Create a warm welcome message for a new Good Faith Exteriors customer who just requested a quote through our unified system.`,
            follow_up: `Create a professional follow-up message for a customer who received a quote but hasn't responded, with unified tone.`,
            appointment_confirmation: `Create an appointment confirmation message with all relevant details in our unified format.`,
            thank_you: `Create a thank you message after project completion with unified branding.`,
            consultation_reminder: `Create a friendly reminder for an upcoming consultation appointment.`
        };
        
        const prompt = prompts[messageType];
        if (!prompt) {
            throw new Error(`${CONSTANTS.ERRORS.VALIDATION.INVALID_DATA}: Unsupported message type: ${messageType}`);
        }
        
        const messages = [
            {
                role: 'user',
                content: `${prompt}

**Customer Information:**
${JSON.stringify(customerInfo, null, 2)}

**Context Data:**
${JSON.stringify(contextData, null, 2)}

**Unified Requirements:**
1. Use customer's name if available
2. Reference specific details from their inquiry or interaction
3. Maintain Good Faith Exteriors' professional but friendly tone
4. Include relevant contact information in unified format
5. Be helpful and informative with clear next steps
6. Keep appropriate length for ${messageType}
7. Format for multiple device types (desktop/mobile compatibility)
8. Integrate with our unified customer journey

**Company Information:**
- Good Faith Exteriors
- Minneapolis, Minnesota
- Owners: Nick Warnke (Nick@goodfaithexteriors.com) and Rich Farchione (Rich@goodfaithexteriors.com)
- Website: goodfaithexteriors.com
- Phone: Available in company configuration

**Communication Context:**
- Source: ${contextData.source || CONSTANTS.IFRAME_SOURCES.WEBSITE}
- Device: ${contextData.deviceType || 'desktop'}
- Mode: ${contextData.mode || 'desktop'}

Generate the message content in our unified communication style, ready for multi-channel delivery.`
            }
        ];
        
        const result = await makeAnthropicAPICall(messages);
        
        if (!result.success) {
            throw new Error(CONSTANTS.ERRORS.AI.ANALYSIS_FAILED + ': Customer communication generation failed');
        }
        
        const content = result.data.content[0].text;
        
        console.log(`✅ Unified ${messageType} communication generated successfully`);
        
        return createSuccessResponse({
            content,
            messageType,
            generatedAt: new Date().toISOString(),
            usage: result.usage,
            metadata: {
                source: contextData.source || CONSTANTS.IFRAME_SOURCES.WEBSITE,
                deviceType: contextData.deviceType || 'desktop',
                customerName: customerInfo.customerName || 'Unknown'
            }
        });
        
    } catch (error) {
        console.error(`❌ Unified ${messageType} communication generation failed:`, error);
        return createErrorResponse(error, 'generateCustomerCommunication');
    }
}

// =====================================================================
// UNIFIED HEALTH CHECK FUNCTION
// =====================================================================

/**
 * Checks Anthropic service health with unified reporting
 */
export async function checkAnthropicHealth() {
    try {
        console.log('🔍 Checking unified Anthropic service health...');
        
        // Test basic API connectivity
        const testMessages = [
            {
                role: 'user',
                content: 'Respond with "HEALTHY" to confirm unified service is working properly.'
            }
        ];
        
        const startTime = Date.now();
        const result = await makeAnthropicAPICall(testMessages);
        const responseTime = Date.now() - startTime;
        
        if (!result.success) {
            throw new Error('Health check API call failed');
        }
        
        const responseText = result.data.content[0].text.toLowerCase();
        const isHealthy = responseText.includes('healthy');
        
        const healthData = {
            status: isHealthy ? 'healthy' : 'degraded',
            responseTime,
            model: ANTHROPIC_CONFIG.model,
            version: ANTHROPIC_CONFIG.version,
            rateLimitRemaining: ANTHROPIC_CONFIG.rateLimitPerMinute - (requestCounts.get('api_calls') || 0),
            lastChecked: new Date().toISOString(),
            usage: result.usage,
            configuration: {
                maxTokens: ANTHROPIC_CONFIG.maxTokens,
                temperature: ANTHROPIC_CONFIG.temperature,
                maxRetries: ANTHROPIC_CONFIG.maxRetries
            }
        };
        
        return createSuccessResponse(healthData);
        
    } catch (error) {
        console.error('❌ Unified Anthropic health check failed:', error);
        return createErrorResponse(error, 'checkAnthropicHealth');
    }
}

// =====================================================================
// EXPORT ALL UNIFIED FUNCTIONS
// =====================================================================

export default {
    // Core functions
    analyzeWindowImage,
    generateQuoteExplanation,
    validateMeasurements,
    generateCustomerCommunication,
    checkAnthropicHealth,
    
    // Internal functions (for testing)
    initializeAnthropicService,
    enforceRateLimit,
    makeAnthropicAPICall,
    parseUnifiedAnalysisResponse,
    parseUnifiedMeasurementValidation,
    calculateAnalysisQualityScore,
    calculateMeasurementQualityScore
};