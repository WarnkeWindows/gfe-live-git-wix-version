/**
 * Enhanced Window Products Page - Claude Anthropic Integration
 * Good Faith Exteriors - Simplified User Interaction System
 * Version: 3.0.0 - Claude AI Integration
 */

// Import enhanced backend services with Claude integration
import { getWindowProducts, getWindowBrands, getMaterials, getWindowTypes, getPricingConfiguration } from 'backend/core/dataService.web.js';
import { calculateWindowQuote, calculateMultiWindowQuote } from 'backend/core/pricingCalculator.web.js';
import { createQuote, updateQuote } from 'backend/core/quoteService.web.js';
import { sendQuoteEmail, sendClaudeRecommendationEmail } from 'backend/integrations/emailService.web.js';
import { processEstimatorContact, scheduleConsultation, createClaudeInteractionLead } from 'backend/integrations/crmIntegration.web.js';
import { logAnalyticsEvent, logClaudeInteraction, logProductRecommendation } from 'backend/core/analyticsService.web.js';
import { analyzeWindowImage } from 'backend/ai/windowAnalyzer.web.js';

// Claude Anthropic Integration
import { callClaudeAPI, processClaudeRecommendations, generateProductInsights } from 'backend/ai/claudeIntegration.web.js';

// Configuration for enhanced Claude integration
const CONFIG = {
    elementId: '#windowProductsBrowser',
    componentName: 'Claude Window Products Browser',
    timeout: 20000,
    retries: 3,
    version: '3.0.0',
    claudeConfig: {
        apiKey: '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',
        organizationId: 'd2de1af9-c8db-44d8-9ba9-7f15a6d7aae4',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 1500
    }
};

// Enhanced state management for Claude integration
let connectionState = {
    isReady: false,
    attempts: 0,
    sessionId: generateSessionId(),
    productDataLoaded: false,
    claudeInitialized: false,
    activeConversation: null,
    userPreferences: {},
    recommendationHistory: []
};

// Claude conversation context
let claudeContext = {
    systemPrompt: '',
    conversationHistory: [],
    currentCustomerProfile: {},
    productKnowledge: {},
    lastRecommendations: []
};

/**
 * Page initialization with enhanced Claude integration
 */
$w.onReady(function () {
    console.log("🤖 Enhanced Window Products Page - Claude Integration v" + CONFIG.version);
    
    initializeClaudeIntegration();
    setupEnhancedCommunication();
    logPageView();
    
    // Set enhanced connection timeout
    setTimeout(checkEnhancedConnection, CONFIG.timeout);
});

/**
 * Initialize Claude AI integration system
 */
async function initializeClaudeIntegration() {
    try {
        console.log("🤖 Initializing Claude AI integration...");
        
        // Initialize Claude system prompt with comprehensive product knowledge
        claudeContext.systemPrompt = await buildClaudeSystemPrompt();
        
        // Load product knowledge base for Claude
        claudeContext.productKnowledge = await loadProductKnowledgeBase();
        
        // Initialize conversation tracking
        claudeContext.conversationHistory = [];
        
        connectionState.claudeInitialized = true;
        console.log("✅ Claude AI integration initialized successfully");
        
    } catch (error) {
        console.error("❌ Claude initialization failed:", error);
        connectionState.claudeInitialized = false;
    }
}

/**
 * Build comprehensive system prompt for Claude
 */
async function buildClaudeSystemPrompt() {
    const productData = await loadProductData();
    
    return `You are Claude, an expert window consultant for Good Faith Exteriors. You have comprehensive knowledge about our complete product catalog and industry expertise.

PRODUCT CATALOG KNOWLEDGE:
- Available Brands: ${productData.brands.join(', ')}
- Window Materials: ${productData.materials.join(', ')}
- Window Types: ${productData.windowTypes.join(', ')}
- Total Products: ${productData.products.length} premium window options

EXPERTISE AREAS:
1. Window Performance & Energy Efficiency
   - U-factor, SHGC, and VT ratings
   - Energy Star certification requirements
   - Climate-specific recommendations
   - Long-term energy savings calculations

2. Material Science & Durability
   - Vinyl vs. wood vs. fiberglass vs. aluminum properties
   - Maintenance requirements and lifecycle costs
   - Weather resistance and thermal performance
   - Aesthetic considerations for different home styles

3. Installation & Technical Considerations
   - Rough opening requirements and measurements
   - Structural considerations and load bearing
   - Weatherization and air sealing best practices
   - Code compliance and permit requirements

4. Customer Consultation Excellence
   - Budget optimization and value engineering
   - Aesthetic matching with architectural styles
   - Performance prioritization based on customer needs
   - Timeline and project planning guidance

YOUR ROLE:
- Provide expert-level consultation with personalized recommendations
- Explain complex technical concepts in accessible language
- Suggest specific products from our catalog with detailed justifications
- Help customers understand value propositions and long-term benefits
- Guide customers through the decision-making process with confidence

COMMUNICATION STYLE:
- Professional yet approachable and conversational
- Educational without being overwhelming
- Focused on customer needs and practical solutions
- Transparent about costs, benefits, and trade-offs

Always prioritize customer satisfaction and provide recommendations that genuinely serve their best interests while showcasing the quality and value of Good Faith Exteriors products.`;
}

/**
 * Load comprehensive product knowledge base for Claude
 */
async function loadProductKnowledgeBase() {
    try {
        const [
            productsResult,
            brandsResult,
            materialsResult,
            windowTypesResult,
            pricingResult
        ] = await Promise.all([
            getWindowProducts({ limit: 200, includeSpecs: true }),
            getWindowBrands({ includeDetails: true }),
            getMaterials({ includeProperties: true }),
            getWindowTypes({ includeFeatures: true }),
            getPricingConfiguration({ includeModifiers: true })
        ]);

        return {
            products: productsResult.products || [],
            brands: brandsResult.brands || [],
            materials: materialsResult.materials || [],
            windowTypes: windowTypesResult.windowTypes || [],
            pricing: pricingResult.configuration || {},
            lastUpdated: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Failed to load product knowledge base:", error);
        return {};
    }
}

/**
 * Setup enhanced communication with Claude-powered iframe
 */
async function setupEnhancedCommunication() {
    const iFrameElement = $w(CONFIG.elementId);

    if (!iFrameElement) {
        console.error(`❌ iFrame element '${CONFIG.elementId}' not found`);
        return;
    }

    try {
        // Load comprehensive initial data
        const initialData = await loadProductData();
        
        // Setup enhanced message listener with Claude routing
        setupEnhancedMessageListener(iFrameElement, initialData);
        
        console.log("✅ Enhanced communication setup complete");
        
        // Send enhanced ready signal with Claude capabilities
        setTimeout(() => {
            sendEnhancedResponse(iFrameElement, {
                type: 'gfe_claude_component_ready',
                productData: initialData,
                claudeCapabilities: {
                    naturalLanguageSearch: true,
                    productRecommendations: true,
                    conversationalConsultation: true,
                    technicalExplanations: true,
                    energyEfficiencyAnalysis: true,
                    competitiveComparisons: true
                },
                sessionId: connectionState.sessionId,
                timestamp: new Date().toISOString()
            });
        }, 1500);
        
    } catch (error) {
        console.error("❌ Enhanced setup failed:", error);
        sendEnhancedResponse(iFrameElement, {
            type: 'backend_error',
            error: 'Failed to initialize enhanced Claude integration'
        });
    }
}

/**
 * Enhanced message listener with comprehensive Claude routing
 */
function setupEnhancedMessageListener(iFrameElement, initialData) {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', async (event) => {
        // Enhanced security check
        if (!event.data?.type || event.data.source !== 'claude_window_browser') return;

        const { type, payload } = event.data;
        console.log(`📨 Received Claude message: ${type}`);

        try {
            const response = await routeClaudeMessage(type, payload);
            if (response) {
                sendEnhancedResponse(iFrameElement, response);
            }
            
        } catch (error) {
            console.error(`❌ Error handling Claude message ${type}:`, error);
            sendEnhancedResponse(iFrameElement, {
                type: 'claude_error',
                error: error.message,
                originalType: type,
                timestamp: new Date().toISOString()
            });
        }
    });
}

/**
 * Comprehensive Claude message routing system
 */
async function routeClaudeMessage(type, payload) {
    switch (type) {
        case 'claude_chat_message':
            return await handleClaudeChatMessage(payload);
            
        case 'claude_product_recommendation':
            return await handleClaudeProductRecommendation(payload);
            
        case 'claude_natural_language_search':
            return await handleClaudeNaturalLanguageSearch(payload);
            
        case 'claude_product_analysis':
            return await handleClaudeProductAnalysis(payload);
            
        case 'claude_energy_efficiency_analysis':
            return await handleClaudeEnergyAnalysis(payload);
            
        case 'claude_competitive_comparison':
            return await handleClaudeCompetitiveComparison(payload);
            
        case 'claude_technical_explanation':
            return await handleClaudeTechnicalExplanation(payload);
            
        case 'claude_interaction':
            return await handleClaudeInteractionLogging(payload);
            
        case 'request_product_catalog':
            return await handleProductDataRequest(payload);
            
        case 'add_to_quote':
            return await handleAddToQuote(payload);
            
        case 'view_product_details':
            return await handleViewProductDetails(payload);
            
        case 'schedule_claude_consultation':
            return await handleScheduleClaudeConsultation(payload);
            
        default:
            console.warn(`⚠️ Unhandled Claude message type: ${type}`);
            return null;
    }
}

/**
 * Handle Claude chat message with advanced AI processing
 */
async function handleClaudeChatMessage(payload) {
    try {
        const { message, conversationContext, customerProfile } = payload;
        
        if (!message || !message.trim()) {
            throw new Error('Message content is required');
        }
        
        console.log("🤖 Processing Claude chat message:", message);
        
        // Update customer profile if provided
        if (customerProfile) {
            claudeContext.currentCustomerProfile = { ...claudeContext.currentCustomerProfile, ...customerProfile };
        }
        
        // Build enhanced context for Claude
        const enhancedContext = await buildEnhancedClaudeContext(message, conversationContext);
        
        // Call Claude API with comprehensive context
        const claudeResponse = await callClaudeAPI({
            model: CONFIG.claudeConfig.model,
            maxTokens: CONFIG.claudeConfig.maxTokens,
            system: claudeContext.systemPrompt,
            messages: [
                ...claudeContext.conversationHistory.slice(-8), // Keep recent context
                {
                    role: 'user',
                    content: enhancedContext
                }
            ]
        });
        
        // Process Claude's response for actionable insights
        const processedResponse = await processClaudeResponse(claudeResponse, message);
        
        // Update conversation history
        claudeContext.conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: claudeResponse }
        );
        
        // Log interaction for analytics and improvement
        await logClaudeInteraction({
            sessionId: payload.sessionId,
            userMessage: message,
            claudeResponse: claudeResponse,
            recommendations: processedResponse.recommendations,
            customerProfile: claudeContext.currentCustomerProfile,
            timestamp: new Date().toISOString()
        });
        
        return {
            type: 'claude_chat_response',
            response: claudeResponse,
            recommendations: processedResponse.recommendations,
            suggestedActions: processedResponse.suggestedActions,
            productSuggestions: processedResponse.productSuggestions,
            conversationId: connectionState.sessionId,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Claude chat processing failed:", error);
        throw new Error('Claude chat processing failed: ' + error.message);
    }
}

/**
 * Build enhanced context for Claude with comprehensive product and customer data
 */
async function buildEnhancedClaudeContext(message, conversationContext) {
    const productContext = claudeContext.productKnowledge;
    const customerContext = claudeContext.currentCustomerProfile;
    
    return `Customer Message: "${message}"

CURRENT CUSTOMER PROFILE:
${Object.keys(customerContext).length > 0 ? JSON.stringify(customerContext, null, 2) : 'No specific profile data available'}

CONVERSATION CONTEXT:
${conversationContext || 'New conversation'}

CURRENT PRODUCT CATALOG STATUS:
- Total Available Products: ${productContext.products?.length || 0}
- Available Brands: ${productContext.brands?.map(b => b.name).join(', ') || 'Loading...'}
- Material Options: ${productContext.materials?.map(m => m.name).join(', ') || 'Loading...'}
- Window Types: ${productContext.windowTypes?.map(t => t.name).join(', ') || 'Loading...'}

RECENT RECOMMENDATIONS:
${claudeContext.lastRecommendations.length > 0 ? 
    claudeContext.lastRecommendations.slice(-3).map(r => `- ${r.summary}`).join('\n') : 
    'No recent recommendations'}

Please provide a helpful, expert response that:
1. Addresses the customer's specific question or need
2. Provides relevant product recommendations from our catalog when appropriate
3. Explains technical concepts in accessible terms
4. Suggests next steps or follow-up questions
5. Maintains a consultative, professional tone

If recommending specific products, please include:
- Product names and key features
- Why they're suitable for the customer's needs
- Approximate pricing guidance
- Energy efficiency benefits
- Installation considerations`;
}

/**
 * Process Claude's response for actionable insights and recommendations
 */
async function processClaudeResponse(claudeResponse, originalMessage) {
    try {
        // Extract product recommendations using pattern matching and AI analysis
        const recommendations = await extractProductRecommendations(claudeResponse);
        
        // Generate suggested actions based on response content
        const suggestedActions = generateSuggestedActions(claudeResponse, originalMessage);
        
        // Extract specific product suggestions
        const productSuggestions = await extractProductSuggestions(claudeResponse);
        
        // Update recommendation history
        if (recommendations.length > 0) {
            claudeContext.lastRecommendations.push({
                timestamp: new Date().toISOString(),
                summary: `Recommended ${recommendations.length} products based on: ${originalMessage.substring(0, 100)}...`,
                recommendations: recommendations
            });
            
            // Keep only last 10 recommendations
            if (claudeContext.lastRecommendations.length > 10) {
                claudeContext.lastRecommendations = claudeContext.lastRecommendations.slice(-10);
            }
        }
        
        return {
            recommendations,
            suggestedActions,
            productSuggestions
        };
        
    } catch (error) {
        console.error("❌ Claude response processing failed:", error);
        return {
            recommendations: [],
            suggestedActions: [],
            productSuggestions: []
        };
    }
}

/**
 * Extract product recommendations from Claude's response
 */
async function extractProductRecommendations(claudeResponse) {
    const recommendations = [];
    
    // Enhanced pattern matching for product recommendations
    const productPatterns = {
        brands: /\b(Andersen|Pella|Marvin|Milgard|Simonton|ProVia)\b/gi,
        materials: /\b(vinyl|wood|fiberglass|aluminum|composite)\b/gi,
        types: /\b(double-hung|casement|sliding|awning|picture|bay|bow)\b/gi,
        efficiency: /\b(energy star|energy efficient|high efficiency|low-e|triple pane)\b/gi,
        features: /\b(low maintenance|weather resistant|noise reduction|security)\b/gi
    };
    
    // Extract matches and create recommendation objects
    Object.entries(productPatterns).forEach(([category, pattern]) => {
        const matches = claudeResponse.match(pattern);
        if (matches) {
            matches.forEach(match => {
                recommendations.push({
                    category: category,
                    value: match.toLowerCase(),
                    confidence: 0.8,
                    source: 'claude_analysis'
                });
            });
        }
    });
    
    // Remove duplicates and sort by confidence
    const uniqueRecommendations = recommendations.filter((rec, index, self) => 
        index === self.findIndex(r => r.category === rec.category && r.value === rec.value)
    ).sort((a, b) => b.confidence - a.confidence);
    
    return uniqueRecommendations;
}

/**
 * Generate suggested actions based on Claude's response
 */
function generateSuggestedActions(claudeResponse, originalMessage) {
    const actions = [];
    
    // Analyze response content for action suggestions
    if (claudeResponse.toLowerCase().includes('schedule') || claudeResponse.toLowerCase().includes('consultation')) {
        actions.push({
            type: 'schedule_consultation',
            label: 'Schedule Consultation',
            description: 'Book a personalized consultation with our experts'
        });
    }
    
    if (claudeResponse.toLowerCase().includes('quote') || claudeResponse.toLowerCase().includes('estimate')) {
        actions.push({
            type: 'get_quote',
            label: 'Get Detailed Quote',
            description: 'Receive a comprehensive quote for your project'
        });
    }
    
    if (claudeResponse.toLowerCase().includes('compare') || claudeResponse.toLowerCase().includes('comparison')) {
        actions.push({
            type: 'compare_products',
            label: 'Compare Products',
            description: 'See detailed comparisons of recommended products'
        });
    }
    
    if (claudeResponse.toLowerCase().includes('energy') || claudeResponse.toLowerCase().includes('efficiency')) {
        actions.push({
            type: 'energy_analysis',
            label: 'Energy Savings Analysis',
            description: 'Calculate potential energy savings and ROI'
        });
    }
    
    return actions;
}

/**
 * Extract specific product suggestions from Claude's response
 */
async function extractProductSuggestions(claudeResponse) {
    const suggestions = [];
    const products = claudeContext.productKnowledge.products || [];
    
    // Match product names and brands mentioned in response
    products.forEach(product => {
        const productName = product.name.toLowerCase();
        const brandName = product.brand.toLowerCase();
        const responseText = claudeResponse.toLowerCase();
        
        if (responseText.includes(productName) || responseText.includes(brandName)) {
            suggestions.push({
                productId: product.id,
                name: product.name,
                brand: product.brand,
                matchReason: 'mentioned_by_claude',
                confidence: 0.9
            });
        }
    });
    
    return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

/**
 * Handle Claude product recommendation requests
 */
async function handleClaudeProductRecommendation(payload) {
    try {
        const { criteria, customerProfile, budget } = payload;
        
        console.log("🎯 Generating Claude product recommendations:", criteria);
        
        // Build recommendation prompt
        const recommendationPrompt = `Please recommend the best window products for a customer with these requirements:

CUSTOMER CRITERIA:
${JSON.stringify(criteria, null, 2)}

CUSTOMER PROFILE:
${JSON.stringify(customerProfile || {}, null, 2)}

BUDGET CONSIDERATIONS:
${budget ? `Budget range: $${budget.min} - $${budget.max}` : 'Budget not specified'}

Please provide:
1. Top 3-5 specific product recommendations from our catalog
2. Detailed explanation of why each product fits their needs
3. Pros and cons of each option
4. Energy efficiency and long-term value analysis
5. Installation considerations and timeline

Focus on products that genuinely meet their needs and provide the best value for their investment.`;

        const claudeResponse = await callClaudeAPI({
            model: CONFIG.claudeConfig.model,
            maxTokens: CONFIG.claudeConfig.maxTokens,
            system: claudeContext.systemPrompt,
            messages: [
                { role: 'user', content: recommendationPrompt }
            ]
        });
        
        // Process recommendations
        const processedRecommendations = await processClaudeRecommendations(claudeResponse, criteria);
        
        // Log recommendation event
        await logProductRecommendation({
            sessionId: payload.sessionId,
            criteria: criteria,
            recommendations: processedRecommendations,
            claudeResponse: claudeResponse,
            timestamp: new Date().toISOString()
        });
        
        return {
            type: 'claude_recommendations_generated',
            recommendations: processedRecommendations,
            explanation: claudeResponse,
            criteria: criteria,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Claude product recommendation failed:", error);
        throw new Error('Product recommendation failed: ' + error.message);
    }
}

/**
 * Handle natural language search with Claude processing
 */
async function handleClaudeNaturalLanguageSearch(payload) {
    try {
        const { searchQuery, context } = payload;
        
        console.log("🔍 Processing natural language search:", searchQuery);
        
        const searchPrompt = `A customer is searching for: "${searchQuery}"

Please analyze this search query and provide:
1. What type of windows they're likely looking for
2. Key features or specifications they might need
3. Recommended filter settings to show the most relevant products
4. Specific product suggestions if applicable

Search context: ${context || 'General product search'}

Provide a structured response that helps narrow down their search to the most relevant products in our catalog.`;

        const claudeResponse = await callClaudeAPI({
            model: CONFIG.claudeConfig.model,
            maxTokens: 800,
            system: claudeContext.systemPrompt,
            messages: [
                { role: 'user', content: searchPrompt }
            ]
        });
        
        // Extract search filters from Claude's response
        const searchFilters = await extractSearchFilters(claudeResponse);
        
        // Get matching products based on filters
        const matchingProducts = await getFilteredProducts(searchFilters);
        
        return {
            type: 'claude_search_results',
            searchQuery: searchQuery,
            claudeAnalysis: claudeResponse,
            suggestedFilters: searchFilters,
            matchingProducts: matchingProducts.slice(0, 20), // Limit results
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Claude natural language search failed:", error);
        throw new Error('Natural language search failed: ' + error.message);
    }
}

/**
 * Extract search filters from Claude's analysis
 */
async function extractSearchFilters(claudeResponse) {
    const filters = {};
    
    // Pattern matching for filter extraction
    const filterPatterns = {
        brand: /brand[:\s]*(andersen|pella|marvin|milgard|simonton|provia)/gi,
        material: /material[:\s]*(vinyl|wood|fiberglass|aluminum|composite)/gi,
        type: /type[:\s]*(double-hung|casement|sliding|awning|picture|bay|bow)/gi,
        efficiency: /efficiency[:\s]*(energy star|high efficiency|standard)/gi,
        priceRange: /budget[:\s]*(budget|mid-range|premium)/gi
    };
    
    Object.entries(filterPatterns).forEach(([filterType, pattern]) => {
        const matches = claudeResponse.match(pattern);
        if (matches && matches.length > 0) {
            filters[filterType] = matches[0].split(/[:\s]+/).pop().toLowerCase();
        }
    });
    
    return filters;
}

/**
 * Get filtered products based on Claude's analysis
 */
async function getFilteredProducts(filters) {
    try {
        const queryParams = {
            limit: 50,
            ...filters
        };
        
        const result = await getWindowProducts(queryParams);
        return result.success ? result.products : [];
        
    } catch (error) {
        console.error("❌ Failed to get filtered products:", error);
        return [];
    }
}

/**
 * Handle Claude interaction logging for analytics
 */
async function handleClaudeInteractionLogging(payload) {
    try {
        const { sessionId, userMessage, claudeResponse, recommendations } = payload;
        
        // Log comprehensive interaction data
        await logClaudeInteraction({
            sessionId: sessionId,
            userMessage: userMessage,
            claudeResponse: claudeResponse,
            recommendations: recommendations || [],
            customerProfile: claudeContext.currentCustomerProfile,
            conversationLength: claudeContext.conversationHistory.length,
            timestamp: new Date().toISOString()
        });
        
        // Update analytics for business intelligence
        await logAnalyticsEvent('claude_interaction', 'window_products', {
            sessionId: sessionId,
            messageLength: userMessage?.length || 0,
            responseLength: claudeResponse?.length || 0,
            recommendationCount: recommendations?.length || 0,
            hasCustomerProfile: Object.keys(claudeContext.currentCustomerProfile).length > 0
        });
        
        return null; // No response needed for logging
        
    } catch (error) {
        console.error("❌ Claude interaction logging failed:", error);
        return null; // Don't throw error for logging failures
    }
}

/**
 * Handle scheduling Claude-powered consultations
 */
async function handleScheduleClaudeConsultation(payload) {
    try {
        const { customerInfo, consultationType, preferredTime, claudeContext } = payload;
        
        console.log("📅 Scheduling Claude consultation:", consultationType);
        
        // Create enhanced consultation request with Claude context
        const consultationData = {
            customer: customerInfo,
            serviceType: consultationType || 'claude_window_consultation',
            preferredDateTime: preferredTime,
            claudeConversationSummary: claudeContext?.conversationSummary,
            productInterests: claudeContext?.productInterests || [],
            specialRequirements: claudeContext?.specialRequirements,
            source: 'claude_integration'
        };
        
        const result = await scheduleConsultation(consultationData);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Create CRM lead with Claude context
        await createClaudeInteractionLead({
            customer: customerInfo,
            consultationId: result.consultationId,
            claudeInteractionData: claudeContext,
            sessionId: payload.sessionId
        });
        
        return {
            type: 'claude_consultation_scheduled',
            consultationId: result.consultationId,
            appointmentDetails: result.appointmentDetails,
            confirmationSent: true,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error("❌ Claude consultation scheduling failed:", error);
        throw new Error('Consultation scheduling failed: ' + error.message);
    }
}

/**
 * Enhanced product data loading with Claude optimization
 */
async function loadProductData() {
    try {
        console.log("📦 Loading enhanced product data for Claude integration...");
        
        const [
            productsResult,
            brandsResult,
            materialsResult,
            windowTypesResult,
            pricingResult
        ] = await Promise.all([
            getWindowProducts({ 
                limit: 200, 
                includeSpecs: true, 
                includeEnergyRatings: true,
                includeClaudeOptimization: true 
            }),
            getWindowBrands({ 
                includeDetails: true,
                includePerformanceData: true 
            }),
            getMaterials({ 
                includeProperties: true,
                includeMaintenanceInfo: true 
            }),
            getWindowTypes({ 
                includeFeatures: true,
                includeApplications: true 
            }),
            getPricingConfiguration({ 
                includeModifiers: true,
                includeClaudeIntegration: true 
            })
        ]);
        
        // Validate all results
        if (!productsResult.success) throw new Error('Failed to load products');
        if (!brandsResult.success) throw new Error('Failed to load brands');
        if (!materialsResult.success) throw new Error('Failed to load materials');
        if (!windowTypesResult.success) throw new Error('Failed to load window types');
        if (!pricingResult.success) throw new Error('Failed to load pricing config');
        
        const enhancedProductData = {
            products: productsResult.products || [],
            brands: brandsResult.brands || [],
            materials: materialsResult.materials || [],
            windowTypes: windowTypesResult.windowTypes || [],
            pricing: pricingResult.configuration || {},
            claudeOptimizations: {
                productDescriptions: true,
                energyEfficiencyData: true,
                competitiveAnalysis: true,
                installationGuidance: true
            },
            lastUpdated: new Date().toISOString(),
            totalProducts: productsResult.products?.length || 0
        };
        
        // Update Claude's product knowledge
        claudeContext.productKnowledge = enhancedProductData;
        
        console.log(`✅ Loaded ${enhancedProductData.totalProducts} products for Claude integration`);
        return enhancedProductData;
        
    } catch (error) {
        console.error("❌ Enhanced product data loading failed:", error);
        throw new Error('Failed to load product data: ' + error.message);
    }
}

/**
 * Enhanced response sending with Claude context
 */
function sendEnhancedResponse(iFrameElement, response) {
    try {
        const enhancedResponse = {
            ...response,
            claudeEnabled: connectionState.claudeInitialized,
            sessionId: connectionState.sessionId,
            timestamp: new Date().toISOString()
        };
        
        iFrameElement.postMessage(enhancedResponse);
        console.log(`📤 Sent enhanced response: ${response.type}`);
        
    } catch (error) {
        console.error("❌ Failed to send enhanced response:", error);
    }
}

/**
 * Enhanced connection checking
 */
function checkEnhancedConnection() {
    if (!connectionState.isReady) {
        console.warn("⚠️ Enhanced Claude connection not established within timeout");
        
        // Attempt to reinitialize
        setupEnhancedCommunication();
    } else {
        console.log("✅ Enhanced Claude connection verified");
    }
}

/**
 * Utility functions
 */
function generateSessionId() {
    return 'claude_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function logPageView() {
    logAnalyticsEvent('page_view', 'claude_window_products', {
        sessionId: connectionState.sessionId,
        claudeEnabled: connectionState.claudeInitialized,
        timestamp: new Date().toISOString()
    });
}

/**
 * Error handling and recovery
 */
function handleClaudeError(error, context) {
    console.error(`❌ Claude error in ${context}:`, error);
    
    // Log error for monitoring
    logAnalyticsEvent('claude_error', 'window_products', {
        error: error.message,
        context: context,
        sessionId: connectionState.sessionId,
        timestamp: new Date().toISOString()
    });
    
    // Attempt recovery if possible
    if (error.message.includes('API') && connectionState.attempts < CONFIG.retries) {
        connectionState.attempts++;
        console.log(`🔄 Attempting Claude recovery (${connectionState.attempts}/${CONFIG.retries})`);
        
        setTimeout(() => {
            initializeClaudeIntegration();
        }, 2000 * connectionState.attempts);
    }
}

// Export for testing and debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        connectionState,
        claudeContext,
        initializeClaudeIntegration,
        handleClaudeChatMessage,
        handleClaudeProductRecommendation,
        loadProductData
    };
}

