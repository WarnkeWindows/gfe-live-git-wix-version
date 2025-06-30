/**
 * Anthropic AI Service - Good Faith Exteriors
 * backend/ai/anthropic-service.web.js
 * 
 * Handles all Claude AI interactions with proper Velo patterns
 * Updated for consistency with project standards
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { 
    logSystemEvent, 
    createSuccessResponse, 
    createErrorResponse,
    handleError,
    saveAIAnalysisResult
} from '../core/wix-data-service.web.js';
import { 
    generateUniqueId,
    safeExecute,
    retryWithBackoff
} from '../utils/utilities-service.web.js';

// =====================================================================
// ANTHROPIC CONFIGURATION
// =====================================================================

const ANTHROPIC_CONFIG = {
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022', // Latest stable version
    maxTokens: 4000,
    temperature: 0.1,
    version: '2023-06-01',
    maxRetries: 3,
    retryDelay: 1000,
    rateLimitPerMinute: 50,
    timeout: 30000
};

// Rate limiting storage (in-memory for Velo)
let rateLimitTracker = {
    calls: [],
    lastReset: Date.now()
};

// =====================================================================
// SYSTEM PROMPT CONFIGURATION
// =====================================================================

const SYSTEM_PROMPT = `You are the "Good Faith Window Advisor," an expert consultant for Good Faith Exteriors, a professional window replacement company. You specialize in:

- Analyzing window photographs to determine type, condition, and measurements
- Providing accurate window measurements from images
- Recommending appropriate window materials and styles
- Explaining window replacement benefits and energy efficiency
- Offering professional consultation on window projects

Key principles:
- Be professional and knowledgeable
- Provide specific, actionable recommendations
- Focus on quality and value for customers
- Explain technical details in accessible language
- Always prioritize customer satisfaction and proper installation

When analyzing images:
- Identify window type (double-hung, casement, sliding, etc.)
- Estimate dimensions when visible reference points exist
- Assess window condition and replacement urgency
- Note architectural style considerations
- Suggest appropriate materials (vinyl, wood, fiberglass, etc.)

Maintain Good Faith Exteriors' reputation for quality, reliability, and customer service.`;

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Initializes Anthropic service with API credentials
 */
async function initializeAnthropicService() {
    try {
        const apiKey = await getSecret('ANTHROPIC_API_KEY');
        const orgId = await getSecret('ANTHROPIC_ORG_ID');
        
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY not found in secrets manager');
        }
        
        return {
            apiKey: apiKey,
            orgId: orgId // Optional, may be null
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize Anthropic service:', error);
        throw new Error(`Anthropic initialization failed: ${error.message}`);
    }
}

/**
 * Checks and enforces rate limiting
 */
function enforceRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Reset tracking if more than a minute has passed
    if (now - rateLimitTracker.lastReset > 60000) {
        rateLimitTracker.calls = [];
        rateLimitTracker.lastReset = now;
    }
    
    // Remove calls older than 1 minute
    rateLimitTracker.calls = rateLimitTracker.calls.filter(timestamp => timestamp > oneMinuteAgo);
    
    // Check if we're at the limit
    if (rateLimitTracker.calls.length >= ANTHROPIC_CONFIG.rateLimitPerMinute) {
        const oldestCall = Math.min(...rateLimitTracker.calls);
        const waitTime = 60000 - (now - oldestCall);
        throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    
    // Add current call to tracker
    rateLimitTracker.calls.push(now);
}

/**
 * Makes API call to Anthropic Claude with retry logic
 */
async function makeAnthropicAPICall(messages, tools = null, retryCount = 0) {
    try {
        // Check rate limiting
        enforceRateLimit();
        
        // Get credentials
        const credentials = await initializeAnthropicService();
        
        // Prepare headers
        const headers = {
            'Content-Type': 'application/json',
            'x-api-key': credentials.apiKey,
            'anthropic-version': ANTHROPIC_CONFIG.version
        };
        
        // Add organization header if available
        if (credentials.orgId) {
            headers['anthropic-organization'] = credentials.orgId;
        }
        
        // Prepare request body
        const requestBody = {
            model: ANTHROPIC_CONFIG.model,
            max_tokens: ANTHROPIC_CONFIG.maxTokens,
            temperature: ANTHROPIC_CONFIG.temperature,
            system: SYSTEM_PROMPT,
            messages: messages
        };
        
        // Add tools if provided
        if (tools && tools.length > 0) {
            requestBody.tools = tools;
        }
        
        console.log('🔄 Making Anthropic API call...', {
            model: requestBody.model,
            messageCount: messages.length,
            toolCount: tools ? tools.length : 0
        });
        
        // Make the API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_CONFIG.timeout);
        
        const response = await fetch(ANTHROPIC_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Anthropic API error (${response.status}): ${errorData.error?.message || errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Anthropic API call successful', {
            usage: data.usage,
            stopReason: data.stop_reason
        });
        
        return {
            success: true,
            data: data,
            usage: data.usage || {},
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ Anthropic API call failed:', error);
        
        // Retry logic for transient errors
        if (retryCount < ANTHROPIC_CONFIG.maxRetries && 
            (error.message.includes('timeout') || error.message.includes('503') || error.message.includes('502'))) {
            
            const delay = ANTHROPIC_CONFIG.retryDelay * Math.pow(2, retryCount);
            console.log(`🔄 Retrying in ${delay}ms (attempt ${retryCount + 1}/${ANTHROPIC_CONFIG.maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return makeAnthropicAPICall(messages, tools, retryCount + 1);
        }
        
        throw error;
    }
}

// =====================================================================
// AI ANALYSIS FUNCTIONS
// =====================================================================

/**
 * Analyzes window image with Claude AI
 */
export async function analyzeWindowImage(imageData, analysisOptions = {}) {
    try {
        console.log('🔍 Starting window image analysis...');
        
        if (!imageData) {
            throw new Error('Image data is required for analysis');
        }
        
        // Clean image data (remove data URL prefix if present)
        const cleanImageData = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
        
        // Prepare the message with image
        const messages = [{
            role: 'user',
            content: [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: cleanImageData
                    }
                },
                {
                    type: 'text',
                    text: `Please analyze this window image and provide:

1. Window Type: Identify the specific type (double-hung, casement, sliding, etc.)
2. Estimated Dimensions: Provide width and height estimates if reference points are visible
3. Material Assessment: Determine the frame material (vinyl, wood, aluminum, etc.)
4. Condition Evaluation: Assess the current condition and replacement urgency
5. Energy Efficiency: Comment on visible energy efficiency features
6. Recommendations: Suggest appropriate replacement options

Please be specific and professional in your analysis. If you cannot determine certain details from the image, clearly state what information is not visible or determinable.

Analysis Type: ${analysisOptions.analysisType || 'standard'}
Include Recommendations: ${analysisOptions.includeRecommendations !== false ? 'yes' : 'no'}
Customer Context: ${analysisOptions.customerContext || 'general consultation'}`
                }
            ]
        }];
        
        // Make API call with retry logic
        const apiResult = await retryWithBackoff(
            () => makeAnthropicAPICall(messages),
            ANTHROPIC_CONFIG.maxRetries,
            ANTHROPIC_CONFIG.retryDelay
        );
        
        if (!apiResult.success) {
            throw new Error('Failed to get response from Claude AI');
        }
        
        // Extract response text
        const responseText = apiResult.data.content[0]?.text || '';
        
        // Parse the analysis
        const analysis = parseWindowAnalysis(responseText);
        
        // Store analysis result
        const storageData = {
            sessionName: analysisOptions.sessionName || generateUniqueId('session'),
            userEmail: analysisOptions.userEmail || '',
            userPhone: analysisOptions.userPhone || '',
            windowImage: imageData,
            measuredWidth: analysis.estimatedWidth || 0,
            measuredHeight: analysis.estimatedHeight || 0,
            confidencePercent: analysis.confidence || 75,
            detectedType: analysis.windowType || 'unknown',
            aiAnalysisData: {
                fullResponse: responseText,
                parsedAnalysis: analysis,
                analysisOptions: analysisOptions
            },
            processingMetadata: {
                model: ANTHROPIC_CONFIG.model,
                usage: apiResult.usage,
                timestamp: apiResult.timestamp
            }
        };
        
        const saveResult = await saveAIAnalysisResult(storageData);
        
        await logSystemEvent({
            eventType: 'ai_analysis_completed',
            message: 'Window image analysis completed successfully',
            details: {
                windowType: analysis.windowType,
                confidence: analysis.confidence,
                sessionName: storageData.sessionName,
                saved: saveResult.success
            }
        });
        
        return createSuccessResponse({
            analysis: analysis,
            rawResponse: responseText,
            usage: apiResult.usage,
            sessionName: storageData.sessionName,
            timestamp: apiResult.timestamp
        }, 'Window analysis completed successfully');
        
    } catch (error) {
        console.error('❌ Window image analysis failed:', error);
        return handleError(error, 'analyzeWindowImage');
    }
}

/**
 * Parses Claude's window analysis response
 */
function parseWindowAnalysis(responseText) {
    const analysis = {
        windowType: 'unknown',
        estimatedWidth: 0,
        estimatedHeight: 0,
        material: 'unknown',
        condition: 'unknown',
        confidence: 75,
        recommendations: [],
        energyEfficiency: 'unknown',
        notes: responseText
    };
    
    try {
        // Basic parsing - could be enhanced with more sophisticated NLP
        const text = responseText.toLowerCase();
        
        // Extract window type
        const windowTypes = {
            'double-hung': ['double-hung', 'double hung'],
            'single-hung': ['single-hung', 'single hung'],
            'casement': ['casement'],
            'sliding': ['sliding'],
            'awning': ['awning'],
            'bay': ['bay'],
            'bow': ['bow'],
            'picture': ['picture']
        };
        
        for (const [type, keywords] of Object.entries(windowTypes)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                analysis.windowType = type;
                break;
            }
        }
        
        // Extract material
        const materials = {
            'vinyl': ['vinyl'],
            'wood': ['wood'],
            'aluminum': ['aluminum', 'aluminium'],
            'fiberglass': ['fiberglass'],
            'composite': ['composite']
        };
        
        for (const [material, keywords] of Object.entries(materials)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                analysis.material = material;
                break;
            }
        }
        
        // Extract dimensions (improved pattern matching)
        const dimensionPatterns = [
            /width[:\s]*(\d+(?:\.\d+)?)\s*(?:inches?|in|")/i,
            /(\d+(?:\.\d+)?)\s*(?:inches?|in|")\s*(?:wide|width)/i,
            /(\d+(?:\.\d+)?)\s*x\s*\d+(?:\.\d+)?\s*(?:inches?|in|")/i
        ];
        
        for (const pattern of dimensionPatterns) {
            const match = responseText.match(pattern);
            if (match) {
                analysis.estimatedWidth = parseFloat(match[1]);
                break;
            }
        }
        
        const heightPatterns = [
            /height[:\s]*(\d+(?:\.\d+)?)\s*(?:inches?|in|")/i,
            /(\d+(?:\.\d+)?)\s*(?:inches?|in|")\s*(?:tall|height)/i,
            /\d+(?:\.\d+)?\s*x\s*(\d+(?:\.\d+)?)\s*(?:inches?|in|")/i
        ];
        
        for (const pattern of heightPatterns) {
            const match = responseText.match(pattern);
            if (match) {
                analysis.estimatedHeight = parseFloat(match[1]);
                break;
            }
        }
        
        // Extract condition
        const conditions = {
            'excellent': ['excellent', 'new', 'pristine'],
            'good': ['good', 'decent'],
            'fair': ['fair', 'moderate', 'average'],
            'poor': ['poor', 'bad', 'deteriorated', 'damaged']
        };
        
        for (const [condition, keywords] of Object.entries(conditions)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                analysis.condition = condition;
                break;
            }
        }
        
        // Extract recommendations
        const recommendationSection = responseText.match(/recommendations?[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/is);
        if (recommendationSection) {
            const recText = recommendationSection[1];
            const recs = recText.split(/[•\-\*]\s*/).filter(r => r.trim().length > 10);
            analysis.recommendations = recs.map(r => r.trim()).slice(0, 5); // Limit to 5 recommendations
        }
        
        // Adjust confidence based on specificity of analysis
        let confidenceBonus = 0;
        if (analysis.windowType !== 'unknown') confidenceBonus += 10;
        if (analysis.material !== 'unknown') confidenceBonus += 10;
        if (analysis.estimatedWidth > 0 && analysis.estimatedHeight > 0) confidenceBonus += 15;
        if (analysis.condition !== 'unknown') confidenceBonus += 5;
        if (analysis.recommendations.length > 0) confidenceBonus += 5;
        
        analysis.confidence = Math.min(95, 75 + confidenceBonus);
        
    } catch (error) {
        console.error('❌ Failed to parse window analysis:', error);
        // Return basic analysis with full response text
    }
    
    return analysis;
}

/**
 * Validates window measurements using AI
 */
export async function validateMeasurements(measurements, windowType, context = {}) {
    try {
        console.log('🔍 Validating window measurements with AI...');
        
        const messages = [{
            role: 'user',
            content: `Please validate these window measurements for accuracy and reasonableness:

Window Type: ${windowType}
Width: ${measurements.width} inches
Height: ${measurements.height} inches
Quantity: ${measurements.quantity || 1}

Context: ${context.notes || 'Standard residential window replacement'}

Please assess:
1. Are these dimensions reasonable for the specified window type?
2. Do the proportions make sense (width-to-height ratio)?
3. Are there any red flags or concerns?
4. What is your confidence level in these measurements?
5. Any recommendations for verification?

Provide a clear validation result with specific feedback.`
        }];
        
        const apiResult = await retryWithBackoff(
            () => makeAnthropicAPICall(messages),
            ANTHROPIC_CONFIG.maxRetries,
            ANTHROPIC_CONFIG.retryDelay
        );
        
        if (!apiResult.success) {
            throw new Error('Failed to validate measurements with AI');
        }
        
        const responseText = apiResult.data.content[0]?.text || '';
        
        // Parse validation result
        const validation = parseValidationResponse(responseText, measurements);
        
        await logSystemEvent({
            eventType: 'measurement_validation_completed',
            message: 'Measurement validation completed',
            details: {
                windowType: windowType,
                isValid: validation.isValid,
                confidence: validation.confidence
            }
        });
        
        return createSuccessResponse({
            validation: validation,
            rawResponse: responseText,
            usage: apiResult.usage,
            timestamp: apiResult.timestamp
        }, 'Measurements validated successfully');
        
    } catch (error) {
        console.error('❌ Measurement validation failed:', error);
        return handleError(error, 'validateMeasurements');
    }
}

/**
 * Parses measurement validation response
 */
function parseValidationResponse(responseText, originalMeasurements) {
    const validation = {
        isValid: true,
        confidence: 75,
        concerns: [],
        recommendations: [],
        adjustedMeasurements: { ...originalMeasurements },
        notes: responseText
    };
    
    try {
        const text = responseText.toLowerCase();
        
        // Look for validation indicators
        if (text.includes('reasonable') || text.includes('appropriate') || text.includes('valid')) {
            validation.confidence += 10;
        }
        
        if (text.includes('concern') || text.includes('unusual') || text.includes('questionable')) {
            validation.confidence -= 15;
            validation.isValid = false;
        }
        
        if (text.includes('red flag') || text.includes('incorrect') || text.includes('impossible')) {
            validation.confidence -= 25;
            validation.isValid = false;
        }
        
        // Extract concerns
        const concernPatterns = [
            /concern[s]?[:\s]*(.*?)(?:\n|$)/gi,
            /red flag[s]?[:\s]*(.*?)(?:\n|$)/gi,
            /issue[s]?[:\s]*(.*?)(?:\n|$)/gi
        ];
        
        for (const pattern of concernPatterns) {
            const matches = responseText.matchAll(pattern);
            for (const match of matches) {
                if (match[1] && match[1].trim().length > 5) {
                    validation.concerns.push(match[1].trim());
                }
            }
        }
        
        // Extract recommendations
        const recPattern = /recommend[ations]*[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)/is;
        const recMatch = responseText.match(recPattern);
        if (recMatch) {
            const recs = recMatch[1].split(/[•\-\*]\s*/).filter(r => r.trim().length > 10);
            validation.recommendations = recs.map(r => r.trim()).slice(0, 3);
        }
        
        // Ensure confidence is within bounds
        validation.confidence = Math.max(0, Math.min(100, validation.confidence));
        
    } catch (error) {
        console.error('❌ Failed to parse validation response:', error);
    }
    
    return validation;
}

/**
 * Generates quote explanation using AI
 */
export async function generateQuoteExplanation(quoteData, customerProfile = {}) {
    try {
        console.log('🔍 Generating quote explanation with AI...');
        
        const messages = [{
            role: 'user',
            content: `Please generate a personalized explanation for this window replacement quote:

Quote Details:
- Total Windows: ${quoteData.totals?.windowCount || 0}
- Subtotal: $${quoteData.totals?.subtotal?.toFixed(2) || '0.00'}
- Installation: $${quoteData.totals?.installation?.toFixed(2) || '0.00'}
- Tax: $${quoteData.totals?.tax?.toFixed(2) || '0.00'}
- Total: $${quoteData.totals?.total?.toFixed(2) || '0.00'}

Customer Profile:
- Name: ${customerProfile.customerName || 'Valued Customer'}
- Budget Concerns: ${customerProfile.budgetConcerns || 'Standard'}
- Timeline: ${customerProfile.timeline || 'Flexible'}
- Priorities: ${customerProfile.priorities || 'Quality and value'}

Please provide:
1. A warm, professional greeting
2. Clear explanation of the quote breakdown
3. Value proposition highlighting benefits
4. Next steps for the customer
5. Reassurance about quality and service

Keep the tone professional but friendly, and focus on value and quality.`
        }];
        
        const apiResult = await retryWithBackoff(
            () => makeAnthropicAPICall(messages),
            ANTHROPIC_CONFIG.maxRetries,
            ANTHROPIC_CONFIG.retryDelay
        );
        
        if (!apiResult.success) {
            throw new Error('Failed to generate quote explanation');
        }
        
        const explanation = apiResult.data.content[0]?.text || '';
        
        await logSystemEvent({
            eventType: 'quote_explanation_generated',
            message: 'Quote explanation generated successfully',
            details: {
                customerName: customerProfile.customerName,
                quoteTotal: quoteData.totals?.total
            }
        });
        
        return createSuccessResponse({
            explanation: explanation,
            usage: apiResult.usage,
            timestamp: apiResult.timestamp
        }, 'Quote explanation generated successfully');
        
    } catch (error) {
        console.error('❌ Quote explanation generation failed:', error);
        return handleError(error, 'generateQuoteExplanation');
    }
}

/**
 * Generates customer communication messages
 */
export async function generateCustomerCommunication(customerInfo, messageType, contextData = {}) {
    try {
        console.log('🔍 Generating customer communication...', { messageType });
        
        const messageTemplates = {
            welcome: 'Generate a warm welcome message for a new customer',
            quote_delivery: 'Generate a professional message to accompany a quote delivery',
            appointment_confirmation: 'Generate a confirmation message for a scheduled appointment',
            follow_up: 'Generate a friendly follow-up message to check on customer interest',
            thank_you: 'Generate a thank you message after service completion'
        };
        
        const template = messageTemplates[messageType] || 'Generate a professional customer communication message';
        
        const messages = [{
            role: 'user',
            content: `${template} for Good Faith Exteriors.

Customer Information:
- Name: ${customerInfo.customerName || 'Valued Customer'}
- Email: ${customerInfo.customerEmail || ''}
- Phone: ${customerInfo.customerPhone || ''}

Context Data:
${JSON.stringify(contextData, null, 2)}

Requirements:
1. Professional but warm tone
2. Personalized to the customer
3. Include relevant details from context
4. Clear call-to-action if appropriate
5. Reflect Good Faith Exteriors' commitment to quality

Keep the message concise and engaging.`
        }];
        
        const apiResult = await retryWithBackoff(
            () => makeAnthropicAPICall(messages),
            ANTHROPIC_CONFIG.maxRetries,
            ANTHROPIC_CONFIG.retryDelay
        );
        
        if (!apiResult.success) {
            throw new Error('Failed to generate customer communication');
        }
        
        const message = apiResult.data.content[0]?.text || '';
        
        await logSystemEvent({
            eventType: 'customer_communication_generated',
            message: 'Customer communication generated successfully',
            details: {
                messageType: messageType,
                customerEmail: customerInfo.customerEmail
            }
        });
        
        return createSuccessResponse({
            message: message,
            messageType: messageType,
            usage: apiResult.usage,
            timestamp: apiResult.timestamp
        }, 'Customer communication generated successfully');
        
    } catch (error) {
        console.error('❌ Customer communication generation failed:', error);
        return handleError(error, 'generateCustomerCommunication');
    }
}

/**
 * Checks Anthropic service health
 */
export async function checkAnthropicHealth() {
    try {
        // Test credentials and basic connectivity
        await initializeAnthropicService();
        
        // Test with a simple API call
        const testMessages = [{
            role: 'user',
            content: 'Please respond with "Service is healthy" to confirm API connectivity.'
        }];
        
        const testResult = await makeAnthropicAPICall(testMessages);
        
        if (testResult.success) {
            return createSuccessResponse({
                status: 'healthy',
                service: 'anthropic',
                model: ANTHROPIC_CONFIG.model,
                rateLimitRemaining: ANTHROPIC_CONFIG.rateLimitPerMinute - rateLimitTracker.calls.length,
                timestamp: new Date().toISOString()
            }, 'Anthropic service is healthy');
        } else {
            throw new Error('API test call failed');
        }
        
    } catch (error) {
        console.error('❌ Anthropic health check failed:', error);
        return createErrorResponse(error, 'checkAnthropicHealth');
    }
}

// =====================================================================
// EXPORT SUMMARY
// =====================================================================

export {
    // Main AI functions
    analyzeWindowImage,
    validateMeasurements,
    generateQuoteExplanation,
    generateCustomerCommunication,
    
    // Health check
    checkAnthropicHealth,
    
    // Internal functions (for testing)
    parseWindowAnalysis,
    parseValidationResponse
};

