import { getSecret } from 'wix-secrets-backend';
import wixData from 'wix-data';
import { fetch } from 'wix-fetch';

// ==================== CONFIGURATION AND CONSTANTS ====================

const CLAUDE_CONFIG = {
    apiKey: null, // Will be loaded from secrets
    organizationId: 'd2de1af9-c8db-44d8-9ba9-7f15a6d7aae4',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1500
};

const GFE_BRANDING = {
    primaryNavy: '#1A365D',
    primaryNavyLight: '#2D3748',
    secondaryGold: '#D4AF37',
    secondaryGoldLight: '#F6E05E',
    accentSilver: '#C0C0C0',
    accentSilverLight: '#E2E8F0',
    white: '#FFFFFF',
    lightGray: '#F7FAFC',
    darkGray: '#4A5568',
    success: '#38A169',
    error: '#E53E3E',
    warning: '#D69E2E',
    info: '#3182CE'
};

const COLLECTIONS = {
    windowProducts: 'WindowProductsMasterCatalog',
    customers: 'Customers',
    quotes: 'Quotes',
    crmLeads: 'CRMLeads',
    analytics: 'Analytics',
    configuration: 'Configuration'
};

// ==================== INITIALIZATION AND SETUP ====================

$w.onReady(async function () {
    console.log('🚀 Good Faith Window Estimator - Initializing...');
    
    try {
        // Initialize Claude API credentials
        await initializeClaudeAPI();
        
        // Setup UI components and event handlers
        setupUIComponents();
        setupEventHandlers();
        setupIframeIntegration();
        
        // Load initial data
        await loadInitialData();
        
        // Update connection status
        updateConnectionStatus(true, 'Good Faith Window Advisor - AI-Powered Expert Consultation');
        
        console.log('✅ Good Faith Window Estimator - Initialization Complete');
        
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        updateConnectionStatus(false, 'System Initialization Failed');
        showMessage('System initialization failed. Please refresh the page.', 'error');
    }
});

// ==================== CLAUDE API INTEGRATION ====================

async function initializeClaudeAPI() {
    try {
        CLAUDE_CONFIG.apiKey = await getSecret('ANTHROPIC_API_KEY');
        if (!CLAUDE_CONFIG.apiKey) {
            throw new Error('Claude API key not found in secrets');
        }
        console.log('✅ Claude API credentials loaded successfully');
    } catch (error) {
        console.error('❌ Failed to load Claude API credentials:', error);
        throw error;
    }
}

async function callClaudeAPI(prompt, imageData = null, toolName = 'general_analysis') {
    try {
        updateConnectionStatus('processing', 'Good Faith Window Advisor - Processing...');
        
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
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        updateConnectionStatus(true, 'Good Faith Window Advisor - AI-Powered Expert Consultation');
        
        return result.content[0].text;
        
    } catch (error) {
        console.error('❌ Claude API Error:', error);
        updateConnectionStatus(false, 'AI Service Temporarily Unavailable');
        throw error;
    }
}

function getSystemPromptForTool(toolName) {
    const prompts = {
        window_measurement_analyzer: `You are an expert window replacement analyst for Good Faith Exteriors. Analyze the provided window image with precision and provide detailed measurements, specifications, and recommendations. Focus on: Precise measurements using visible reference objects, Window type identification (casement, double-hung, sliding, etc.), Frame material assessment (vinyl, wood, aluminum, fiberglass), Condition evaluation and replacement recommendations, Energy efficiency improvement opportunities. Provide confidence scores for all measurements and flag any areas requiring manual verification.`,
        
        quote_explanation_generator: `You are a professional sales consultant for Good Faith Exteriors, a premium window replacement company. Create detailed, customer-friendly explanations that build confidence and demonstrate value. Focus on: Clear cost breakdowns with justifications, Energy efficiency benefits and savings, Quality advantages and warranty value, Professional installation expertise, Long-term value proposition. Use a consultative, professional tone that addresses customer concerns and builds trust.`,
        
        measurement_validator: `You are a quality assurance specialist for Good Faith Exteriors window installations. Validate measurements against industry standards and identify potential issues. Validation Criteria: Industry standard compliance (AAMA, NFRC), Measurement accuracy within ±1/4 inch tolerance, Structural feasibility assessment, Installation complexity evaluation. Provide clear pass/fail determinations with detailed reasoning.`,
        
        customer_communication_generator: `You are a customer service specialist for Good Faith Exteriors. Create personalized, professional communications that strengthen customer relationships. Communication Guidelines: Maintain Good Faith Exteriors' professional brand voice, Address customer concerns proactively, Provide clear next steps and timelines, Include relevant contact information, Reinforce value proposition and quality commitment.`,
        
        competitive_analysis_tool: `You are a market analysis specialist for Good Faith Exteriors. Analyze competitor offerings and provide strategic recommendations for competitive positioning. Analysis Focus: Pricing comparison and value proposition, Quality differentiation opportunities, Service advantage identification, Customer objection handling strategies, Competitive response recommendations.`,
        
        energy_efficiency_calculator: `You are an energy efficiency specialist for Good Faith Exteriors. Calculate energy savings and environmental impact for window replacement projects. Calculation Parameters: Energy Star compliance verification, Annual heating/cooling cost savings, Payback period analysis, Environmental impact assessment, ROI calculations and projections.`,
        
        general_analysis: `You are the Good Faith Window Advisor, an AI-powered expert consultation system for Good Faith Exteriors. Provide professional, accurate, and helpful guidance for all window replacement inquiries. Maintain a consultative tone and focus on delivering value to customers while representing Good Faith Exteriors' commitment to quality and service excellence.`
    };
    
    return prompts[toolName] || prompts.general_analysis;
}

// ==================== UI COMPONENT SETUP ====================

function setupUIComponents() {
    // Apply GFE branding to connection status
    const connectionStatus = $w('#connectionStatus');
    connectionStatus.style.backgroundColor = GFE_BRANDING.error;
    connectionStatus.style.color = GFE_BRANDING.white;
    connectionStatus.style.borderRadius = '25px';
    connectionStatus.style.padding = '10px 16px';
    connectionStatus.style.fontWeight = 'bold';
    connectionStatus.style.fontSize = '13px';
    
    // Style main buttons with GFE branding
    styleButton($w('#addWindowBtn'), 'primary');
    styleButton($w('#calculateBtn'), 'secondary');
    styleButton($w('#aiAnalyzeBtn'), 'ai');
    styleButton($w('#applyAIResults'), 'success');
    
    // Setup iframe container
    const iframeContainer = $w('#windowProductsIframe');
    if (iframeContainer) {
        iframeContainer.style.border = `2px solid ${GFE_BRANDING.secondaryGold}`;
        iframeContainer.style.borderRadius = '15px';
        iframeContainer.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
    }
}

function styleButton(button, type) {
    if (!button) return;
    
    const styles = {
        primary: {
            backgroundColor: GFE_BRANDING.primaryNavy,
            color: GFE_BRANDING.white
        },
        secondary: {
            backgroundColor: GFE_BRANDING.secondaryGold,
            color: GFE_BRANDING.primaryNavy
        },
        ai: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: GFE_BRANDING.white
        },
        success: {
            backgroundColor: GFE_BRANDING.success,
            color: GFE_BRANDING.white
        }
    };
    
    const style = styles[type] || styles.primary;
    button.style.backgroundColor = style.backgroundColor;
    button.style.background = style.background || style.backgroundColor;
    button.style.color = style.color;
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.padding = '12px 24px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.3s ease';
}

// ==================== EVENT HANDLERS ====================

function setupEventHandlers() {
    // Window management buttons
    $w('#addWindowBtn').onClick(() => addWindow());
    $w('#calculateBtn').onClick(() => calculateCurrentWindow());
    $w('#aiAnalyzeBtn').onClick(() => runAIAnalysis());
    $w('#applyAIResults').onClick(() => applyAIResults());
    
    // Image upload handling
    if ($w('#imageUpload')) {
        $w('#imageUpload').onChange((event) => handleImageUpload(event));
    }
    
    // Form field change handlers
    setupFormFieldHandlers();
}

function setupFormFieldHandlers() {
    // Window dimension handlers
    if ($w('#windowWidth')) {
        $w('#windowWidth').onChange(() => calculateCurrentWindow());
    }
    if ($w('#windowHeight')) {
        $w('#windowHeight').onChange(() => calculateCurrentWindow());
    }
    
    // Material selection handler
    if ($w('#materialSelect')) {
        $w('#materialSelect').onChange(() => {
            updateMaterialOptions();
            calculateCurrentWindow();
        });
    }
    
    // Window type handler
    if ($w('#windowTypeSelect')) {
        $w('#windowTypeSelect').onChange(() => {
            updateWindowTypeOptions();
            calculateCurrentWindow();
        });
    }
}

// ==================== IFRAME INTEGRATION ====================

function setupIframeIntegration() {
    // Setup postMessage listener for iframe communication
    if (typeof window !== 'undefined') {
        window.addEventListener('message', handleIframeMessage, false);
    }
    
    // Initialize iframe if present
    const iframe = $w('#windowProductsIframe');
    if (iframe) {
        iframe.onMessage((event) => handleIframeMessage(event));
    }
}

function handleIframeMessage(event) {
    try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        switch (data.type) {
            case 'PRODUCT_SELECTED':
                handleProductSelection(data.payload);
                break;
            case 'AI_ANALYSIS_REQUEST':
                handleAIAnalysisRequest(data.payload);
                break;
            case 'QUOTE_REQUEST':
                handleQuoteRequest(data.payload);
                break;
            case 'CUSTOMER_COMMUNICATION':
                handleCustomerCommunication(data.payload);
                break;
            case 'IFRAME_READY':
                handleIframeReady();
                break;
            default:
                console.log('Unknown iframe message type:', data.type);
        }
    } catch (error) {
        console.error('Error handling iframe message:', error);
    }
}

function sendMessageToIframe(type, payload) {
    const iframe = $w('#windowProductsIframe');
    if (iframe) {
        const message = {
            type: type,
            payload: payload,
            timestamp: new Date().toISOString(),
            source: 'velo-page'
        };
        iframe.postMessage(message);
    }
}

function handleIframeReady() {
    console.log('✅ Iframe ready - establishing communication');
    
    // Send initial configuration to iframe
    sendMessageToIframe('CONFIGURATION', {
        branding: GFE_BRANDING,
        apiEndpoints: {
            analyzeWindow: '/api/ai/analyze-window',
            generateQuote: '/api/pricing/generate-quote',
            validateMeasurements: '/api/ai/validate-measurements'
        },
        features: {
            aiAnalysis: true,
            realTimePricing: true,
            customerCommunication: true
        }
    });
}

// ==================== CORE FUNCTIONALITY ====================

async function addWindow() {
    try {
        showMessage('Adding window to quote...', 'info');
        
        const windowData = collectWindowData();
        
        if (!validateWindowData(windowData)) {
            showMessage('Please complete all required fields', 'warning');
            return;
        }
        
        // Calculate pricing
        const pricing = await calculateWindowPricing(windowData);
        
        // Add to quote collection
        const quoteItem = {
            ...windowData,
            pricing: pricing,
            addedAt: new Date(),
            status: 'active'
        };
        
        await wixData.save(COLLECTIONS.quotes, quoteItem);
        
        // Update UI
        updateQuoteDisplay();
        clearWindowForm();
        
        // Notify iframe
        sendMessageToIframe('WINDOW_ADDED', quoteItem);
        
        showMessage('Window added to quote successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding window:', error);
        showMessage('Failed to add window. Please try again.', 'error');
    }
}

async function calculateCurrentWindow() {
    try {
        const windowData = collectWindowData();
        
        if (!windowData.width || !windowData.height) {
            return; // Don't calculate without dimensions
        }
        
        const pricing = await calculateWindowPricing(windowData);
        
        // Update price display
        if ($w('#currentPrice')) {
            $w('#currentPrice').text = `$${pricing.total.toLocaleString()}`;
        }
        
        // Update breakdown if available
        updatePricingBreakdown(pricing);
        
        // Notify iframe
        sendMessageToIframe('PRICING_UPDATED', { windowData, pricing });
        
    } catch (error) {
        console.error('Error calculating price:', error);
        showMessage('Error calculating price', 'error');
    }
}

async function runAIAnalysis() {
    try {
        showMessage('Good Faith Window Advisor analyzing...', 'info');
        updateConnectionStatus('processing', 'Good Faith Window Advisor - Analyzing...');
        
        const imageData = await getUploadedImageData();
        const analysisType = getSelectedAnalysisType();
        const customerPreferences = getCustomerPreferences();
        
        if (!imageData) {
            showMessage('Please upload a window image first', 'warning');
            return;
        }
        
        const prompt = createAnalysisPrompt(analysisType, customerPreferences);
        const analysisResult = await callClaudeAPI(prompt, imageData, 'window_measurement_analyzer');
        
        // Parse and store results
        const parsedResults = parseAnalysisResults(analysisResult);
        await storeAnalysisResults(parsedResults);
        
        // Update UI with results
        displayAnalysisResults(parsedResults);
        
        // Notify iframe
        sendMessageToIframe('AI_ANALYSIS_COMPLETE', parsedResults);
        
        showMessage('AI analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error running AI analysis:', error);
        showMessage('AI analysis failed. Please try again.', 'error');
        updateConnectionStatus(false, 'AI Analysis Failed');
    }
}

async function applyAIResults() {
    try {
        const analysisResults = getStoredAnalysisResults();
        
        if (!analysisResults) {
            showMessage('No AI analysis results to apply', 'warning');
            return;
        }
        
        // Apply measurements
        if (analysisResults.measurements) {
            if ($w('#windowWidth')) {
                $w('#windowWidth').value = analysisResults.measurements.width;
            }
            if ($w('#windowHeight')) {
                $w('#windowHeight').value = analysisResults.measurements.height;
            }
        }
        
        // Apply window type
        if (analysisResults.windowType && $w('#windowTypeSelect')) {
            $w('#windowTypeSelect').value = analysisResults.windowType;
        }
        
        // Apply material
        if (analysisResults.material && $w('#materialSelect')) {
            $w('#materialSelect').value = analysisResults.material;
        }
        
        // Recalculate pricing
        await calculateCurrentWindow();
        
        // Notify iframe
        sendMessageToIframe('AI_RESULTS_APPLIED', analysisResults);
        
        showMessage('AI results applied successfully!', 'success');
        
    } catch (error) {
        console.error('Error applying AI results:', error);
        showMessage('Failed to apply AI results', 'error');
    }
}

// ==================== DATA MANAGEMENT ====================

async function loadInitialData() {
    try {
        // Load window products
        const products = await wixData.query(COLLECTIONS.windowProducts)
            .limit(1000)
            .find();
        
        // Populate dropdowns
        populateWindowTypeDropdown(products.items);
        populateMaterialDropdown(products.items);
        
        // Load existing quote if available
        await loadExistingQuote();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        showMessage('Failed to load product data', 'warning');
    }
}

function collectWindowData() {
    return {
        width: parseFloat($w('#windowWidth')?.value || 0),
        height: parseFloat($w('#windowHeight')?.value || 0),
        windowType: $w('#windowTypeSelect')?.value || '',
        material: $w('#materialSelect')?.value || '',
        quantity: parseInt($w('#quantity')?.value || 1),
        customOptions: getSelectedCustomOptions(),
        location: $w('#location')?.value || '',
        notes: $w('#notes')?.value || ''
    };
}

function validateWindowData(data) {
    return data.width > 0 && 
           data.height > 0 && 
           data.windowType && 
           data.material;
}

async function calculateWindowPricing(windowData) {
    try {
        // Get base pricing from products collection
        const product = await wixData.query(COLLECTIONS.windowProducts)
            .eq('windowType', windowData.windowType)
            .eq('material', windowData.material)
            .find();
        
        if (product.items.length === 0) {
            throw new Error('Product not found');
        }
        
        const baseProduct = product.items[0];
        const basePrice = baseProduct.basePrice || 0;
        
        // Calculate area-based pricing
        const area = windowData.width * windowData.height / 144; // Convert to sq ft
        const areaPrice = area * (baseProduct.pricePerSqFt || 50);
        
        // Apply material multiplier
        const materialMultiplier = getMaterialMultiplier(windowData.material);
        const materialPrice = areaPrice * materialMultiplier;
        
        // Add custom options
        const optionsPrice = calculateOptionsPrice(windowData.customOptions);
        
        // Calculate totals
        const subtotal = materialPrice + optionsPrice;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + tax;
        
        return {
            basePrice,
            areaPrice,
            materialPrice,
            optionsPrice,
            subtotal,
            tax,
            total,
            breakdown: {
                area: area.toFixed(2),
                materialMultiplier,
                taxRate: 0.08
            }
        };
        
    } catch (error) {
        console.error('Error calculating pricing:', error);
        throw error;
    }
}

// ==================== AI ANALYSIS HELPERS ====================

function createAnalysisPrompt(analysisType, customerPreferences) {
    const basePrompt = `Please analyze this window image for Good Faith Exteriors:

Analysis Type: ${analysisType}
Customer Budget Range: ${customerPreferences.budgetRange || 'Not specified'}
Energy Efficiency Priority: ${customerPreferences.energyEfficiencyPriority ? 'High' : 'Standard'}
Special Requirements: ${customerPreferences.specialRequirements || 'None'}

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

    return basePrompt;
}

function parseAnalysisResults(analysisText) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback: parse text response
        return parseTextAnalysis(analysisText);
        
    } catch (error) {
        console.error('Error parsing analysis results:', error);
        return {
            error: 'Failed to parse analysis results',
            rawText: analysisText
        };
    }
}

async function storeAnalysisResults(results) {
    try {
        const analysisRecord = {
            results: results,
            timestamp: new Date(),
            sessionId: getSessionId(),
            status: 'completed'
        };
        
        await wixData.save(COLLECTIONS.analytics, analysisRecord);
        
        // Store in session storage for immediate access
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('latestAnalysis', JSON.stringify(results));
        }
        
    } catch (error) {
        console.error('Error storing analysis results:', error);
    }
}

function getStoredAnalysisResults() {
    try {
        if (typeof sessionStorage !== 'undefined') {
            const stored = sessionStorage.getItem('latestAnalysis');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    } catch (error) {
        console.error('Error retrieving stored analysis:', error);
        return null;
    }
}

// ==================== UI UPDATE FUNCTIONS ====================

function updateConnectionStatus(connected, message) {
    const connectionStatus = $w('#connectionStatus');
    if (!connectionStatus) return;
    
    if (connected === 'processing') {
        connectionStatus.text = '🟡 ' + message;
        connectionStatus.style.backgroundColor = GFE_BRANDING.warning;
    } else if (connected) {
        connectionStatus.text = '🟢 ' + message;
        connectionStatus.style.backgroundColor = GFE_BRANDING.success;
    } else {
        connectionStatus.text = '🔴 ' + message;
        connectionStatus.style.backgroundColor = GFE_BRANDING.error;
    }
}

function showMessage(text, type = 'info') {
    const messageElement = $w('#messageDisplay');
    if (!messageElement) {
        console.log(`${type.toUpperCase()}: ${text}`);
        return;
    }
    
    const colors = {
        success: GFE_BRANDING.success,
        error: GFE_BRANDING.error,
        warning: GFE_BRANDING.warning,
        info: GFE_BRANDING.info
    };
    
    messageElement.text = text;
    messageElement.style.backgroundColor = colors[type] || colors.info;
    messageElement.style.color = GFE_BRANDING.white;
    messageElement.style.padding = '12px 16px';
    messageElement.style.borderRadius = '8px';
    messageElement.style.marginBottom = '15px';
    messageElement.show();
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.hide();
    }, 5000);
}

function displayAnalysisResults(results) {
    const resultsContainer = $w('#aiResults');
    if (!resultsContainer) return;
    
    let resultsHTML = '<div class="ai-results-container">';
    
    if (results.measurements) {
        resultsHTML += `
            <div class="measurement-results">
                <h4>📏 Measurements</h4>
                <p>Width: ${results.measurements.width}" (Confidence: ${results.measurements.confidence}%)</p>
                <p>Height: ${results.measurements.height}" (Confidence: ${results.measurements.confidence}%)</p>
            </div>
        `;
    }
    
    if (results.windowType) {
        resultsHTML += `
            <div class="window-type-results">
                <h4>🪟 Window Type</h4>
                <p>${results.windowType}</p>
            </div>
        `;
    }
    
    if (results.material) {
        resultsHTML += `
            <div class="material-results">
                <h4>🔧 Material</h4>
                <p>${results.material}</p>
            </div>
        `;
    }
    
    if (results.recommendations && results.recommendations.length > 0) {
        resultsHTML += `
            <div class="recommendations-results">
                <h4>💡 Recommendations</h4>
                <ul>
                    ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    resultsHTML += '</div>';
    
    resultsContainer.html = resultsHTML;
    resultsContainer.show();
}

// ==================== UTILITY FUNCTIONS ====================

function getSessionId() {
    if (typeof sessionStorage !== 'undefined') {
        let sessionId = sessionStorage.getItem('gfe-session-id');
        if (!sessionId) {
            sessionId = 'gfe-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('gfe-session-id', sessionId);
        }
        return sessionId;
    }
    return 'gfe-' + Date.now();
}

function getMaterialMultiplier(material) {
    const multipliers = {
        'Vinyl': 1.0,
        'Wood': 1.5,
        'Aluminum': 1.2,
        'Fiberglass': 1.8,
        'Composite': 1.6
    };
    return multipliers[material] || 1.0;
}

function calculateOptionsPrice(options) {
    if (!options || options.length === 0) return 0;
    
    const optionPrices = {
        'Low-E Glass': 150,
        'Argon Fill': 75,
        'Triple Pane': 300,
        'Custom Color': 200,
        'Security Glass': 250
    };
    
    return options.reduce((total, option) => {
        return total + (optionPrices[option] || 0);
    }, 0);
}

async function getUploadedImageData() {
    const imageUpload = $w('#imageUpload');
    if (!imageUpload || !imageUpload.value || imageUpload.value.length === 0) {
        return null;
    }
    
    try {
        const file = imageUpload.value[0];
        const arrayBuffer = await file.getContent();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        return base64;
    } catch (error) {
        console.error('Error processing uploaded image:', error);
        return null;
    }
}

function getSelectedAnalysisType() {
    const analysisSelect = $w('#analysisType');
    return analysisSelect ? analysisSelect.value : 'comprehensive';
}

function getCustomerPreferences() {
    return {
        budgetRange: $w('#budgetRange')?.value || '',
        energyEfficiencyPriority: $w('#energyPriority')?.checked || false,
        specialRequirements: $w('#specialRequirements')?.value || ''
    };
}

function getSelectedCustomOptions() {
    const options = [];
    const checkboxes = ['#lowEGlass', '#argonFill', '#triplePane', '#customColor', '#securityGlass'];
    
    checkboxes.forEach(selector => {
        const checkbox = $w(selector);
        if (checkbox && checkbox.checked) {
            options.push(checkbox.label);
        }
    });
    
    return options;
}

// ==================== IFRAME MESSAGE HANDLERS ====================

function handleProductSelection(payload) {
    console.log('Product selected from iframe:', payload);
    
    // Update form fields with selected product
    if (payload.windowType && $w('#windowTypeSelect')) {
        $w('#windowTypeSelect').value = payload.windowType;
    }
    
    if (payload.material && $w('#materialSelect')) {
        $w('#materialSelect').value = payload.material;
    }
    
    // Trigger calculation
    calculateCurrentWindow();
    
    showMessage(`Selected: ${payload.productName || 'Product'}`, 'success');
}

async function handleAIAnalysisRequest(payload) {
    console.log('AI analysis requested from iframe:', payload);
    
    try {
        const prompt = payload.prompt || 'Analyze this window for replacement recommendations.';
        const toolName = payload.toolName || 'general_analysis';
        
        const result = await callClaudeAPI(prompt, payload.imageData, toolName);
        
        // Send results back to iframe
        sendMessageToIframe('AI_ANALYSIS_RESULT', {
            requestId: payload.requestId,
            result: result,
            success: true
        });
        
    } catch (error) {
        console.error('Error processing AI analysis request:', error);
        
        // Send error back to iframe
        sendMessageToIframe('AI_ANALYSIS_RESULT', {
            requestId: payload.requestId,
            error: error.message,
            success: false
        });
    }
}

async function handleQuoteRequest(payload) {
    console.log('Quote requested from iframe:', payload);
    
    try {
        const windowData = payload.windowData || collectWindowData();
        const pricing = await calculateWindowPricing(windowData);
        
        // Generate quote explanation using Claude
        const quotePrompt = `Create a comprehensive quote explanation for this Good Faith Exteriors project:
        
Window Specifications: ${JSON.stringify(windowData, null, 2)}
Pricing Breakdown: ${JSON.stringify(pricing, null, 2)}
Customer Name: ${payload.customerName || 'Valued Customer'}

Generate a detailed explanation that justifies the investment and highlights Good Faith Exteriors' value proposition.`;

        const explanation = await callClaudeAPI(quotePrompt, null, 'quote_explanation_generator');
        
        // Send quote back to iframe
        sendMessageToIframe('QUOTE_RESULT', {
            requestId: payload.requestId,
            windowData: windowData,
            pricing: pricing,
            explanation: explanation,
            success: true
        });
        
    } catch (error) {
        console.error('Error processing quote request:', error);
        
        sendMessageToIframe('QUOTE_RESULT', {
            requestId: payload.requestId,
            error: error.message,
            success: false
        });
    }
}

async function handleCustomerCommunication(payload) {
    console.log('Customer communication requested from iframe:', payload);
    
    try {
        const communicationPrompt = `Generate ${payload.communicationType || 'follow-up'} communication for Good Faith Exteriors:
        
Customer Information: ${JSON.stringify(payload.customerInfo || {}, null, 2)}
Project Details: ${JSON.stringify(payload.projectDetails || {}, null, 2)}
Communication Stage: ${payload.stage || 'General'}
Tone Preference: ${payload.tone || 'Professional'}

Create appropriate communication that maintains Good Faith Exteriors' high service standards.`;

        const communication = await callClaudeAPI(communicationPrompt, null, 'customer_communication_generator');
        
        // Send communication back to iframe
        sendMessageToIframe('CUSTOMER_COMMUNICATION_RESULT', {
            requestId: payload.requestId,
            communication: communication,
            success: true
        });
        
    } catch (error) {
        console.error('Error generating customer communication:', error);
        
        sendMessageToIframe('CUSTOMER_COMMUNICATION_RESULT', {
            requestId: payload.requestId,
            error: error.message,
            success: false
        });
    }
}

// ==================== ADDITIONAL HELPER FUNCTIONS ====================

function populateWindowTypeDropdown(products) {
    const dropdown = $w('#windowTypeSelect');
    if (!dropdown) return;
    
    const windowTypes = [...new Set(products.map(p => p.windowType))].filter(Boolean);
    
    dropdown.options = windowTypes.map(type => ({
        label: type,
        value: type
    }));
}

function populateMaterialDropdown(products) {
    const dropdown = $w('#materialSelect');
    if (!dropdown) return;
    
    const materials = [...new Set(products.map(p => p.material))].filter(Boolean);
    
    dropdown.options = materials.map(material => ({
        label: material,
        value: material
    }));
}

function updateMaterialOptions() {
    // Update available options based on selected material
    calculateCurrentWindow();
}

function updateWindowTypeOptions() {
    // Update available options based on selected window type
    calculateCurrentWindow();
}

function updatePricingBreakdown(pricing) {
    const breakdownContainer = $w('#pricingBreakdown');
    if (!breakdownContainer) return;
    
    const breakdownHTML = `
        <div class="pricing-breakdown">
            <div class="breakdown-item">
                <span>Base Price:</span>
                <span>$${pricing.basePrice.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Area (${pricing.breakdown.area} sq ft):</span>
                <span>$${pricing.areaPrice.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Material Adjustment:</span>
                <span>$${pricing.materialPrice.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Options:</span>
                <span>$${pricing.optionsPrice.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Tax:</span>
                <span>$${pricing.tax.toLocaleString()}</span>
            </div>
            <div class="breakdown-item total">
                <span><strong>Total:</strong></span>
                <span><strong>$${pricing.total.toLocaleString()}</strong></span>
            </div>
        </div>
    `;
    
    breakdownContainer.html = breakdownHTML;
}

function updateQuoteDisplay() {
    // Update the quote display with current items
    // This would typically refresh a repeater or list
    console.log('Updating quote display...');
}

function clearWindowForm() {
    // Clear form fields after adding a window
    const fields = ['#windowWidth', '#windowHeight', '#quantity', '#notes'];
    fields.forEach(selector => {
        const field = $w(selector);
        if (field) {
            field.value = '';
        }
    });
}

async function loadExistingQuote() {
    // Load any existing quote for the current session
    try {
        const sessionId = getSessionId();
        const existingQuote = await wixData.query(COLLECTIONS.quotes)
            .eq('sessionId', sessionId)
            .eq('status', 'active')
            .find();
        
        if (existingQuote.items.length > 0) {
            console.log('Loaded existing quote with', existingQuote.items.length, 'items');
            updateQuoteDisplay();
        }
    } catch (error) {
        console.error('Error loading existing quote:', error);
    }
}

function parseTextAnalysis(text) {
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
    
    if (widthMatch) result.measurements.width = parseFloat(widthMatch[1]);
    if (heightMatch) result.measurements.height = parseFloat(heightMatch[1]);
    
    return result;
}

// ==================== EXPORT FOR TESTING ====================

// Export functions for testing (if in development environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeClaudeAPI,
        callClaudeAPI,
        calculateWindowPricing,
        parseAnalysisResults,
        handleIframeMessage,
        sendMessageToIframe
    };
}

console.log('✅ Good Faith Exteriors Velo Page - Loaded Successfully');

