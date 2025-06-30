/**
 * Frontend API Client - Good Faith Exteriors
 * public/js/gfe-api-client.js
 * 
 * Updated for consistency with backend API endpoints
 * Handles all frontend-backend communication with proper error handling
 */

// =====================================================================
// UI ELEMENT CONSTANTS
// =====================================================================

const UI_ELEMENT_IDS = {
    // Image upload and analysis
    imageInput: '#uploadButton',
    uploadedImageDisplay: '#uploadedImage',
    analyzeImageButton: '#analyzeImage',
    retakePhotoButton: '#retakePhoto',
    
    // Window measurements
    widthInput: '#width',
    heightInput: '#height',
    quantityInput: '#quantity',
    windowTypeDropdown: '#windowType',
    materialDropdown: '#material',
    brandDropdown: '#brand',
    
    // Calculation and results
    calculatePriceButton: '#calculatePrice',
    estimateResults: '#estimateResults',
    
    // AI analysis status
    aiAnalysisStatus: '#aiAnalysisStatus',
    aiAnalysisResult: '#aiAnalysisResult',
    windowAdvisorText: '#windowAdvisorText',
    
    // Customer information
    customerName: '#customerName',
    customerEmail: '#customerEmail',
    customerPhone: '#customerPhone',
    customerAddress: '#customerAddress',
    
    // Quote and communication
    quoteExplanation: '#quoteExplanation',
    sendQuoteButton: '#sendQuote',
    scheduleConsultationButton: '#scheduleConsultation',
    
    // Status and messaging
    statusMessage: '#statusMessage',
    errorMessage: '#errorMessage',
    loadingSpinner: '#loadingSpinner'
};

// =====================================================================
// API CLIENT CLASS
// =====================================================================

class GFEFrontendApiClient {
    constructor() {
        this.baseUrl = '/_functions'; // Velo HTTP Functions are exposed under /_functions
        this.sessionId = this.generateSessionId();
        this.requestTimeout = 30000; // 30 seconds
    }

    /**
     * Generates a unique session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generic request helper for API calls with timeout and error handling
     */
    async makeRequest(method, path, data = null, options = {}) {
        const fullPath = `${this.baseUrl}${path}`;
        const requestOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            body: data ? JSON.stringify(data) : undefined,
        };

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
        requestOptions.signal = controller.signal;

        try {
            console.log(`🔄 Making ${method} request to ${fullPath}`, data ? { dataKeys: Object.keys(data) } : {});
            
            const response = await fetch(fullPath, requestOptions);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || result.message || 'API request failed');
            }
            
            console.log(`✅ ${method} request to ${fullPath} successful`);
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`❌ Frontend API call to ${fullPath} failed:`, error);
            
            if (error.name === 'AbortError') {
                this.displayError('Request timed out. Please try again.');
            } else {
                this.displayError(`Request failed: ${error.message}`);
            }
            
            throw error;
        }
    }

    /**
     * POST request helper
     */
    async post(path, data) {
        return this.makeRequest('POST', path, data);
    }

    /**
     * GET request helper
     */
    async get(path, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullPath = queryString ? `${path}?${queryString}` : path;
        return this.makeRequest('GET', fullPath);
    }

    // =====================================================================
    // AI ANALYSIS METHODS
    // =====================================================================

    /**
     * Analyze window image using Claude AI
     */
    async analyzeWindow(imageData, options = {}) {
        this.showLoading('Analyzing image with AI...');
        
        try {
            const requestData = {
                imageData: imageData,
                analysisType: options.analysisType || 'detailed',
                includeRecommendations: options.includeRecommendations !== false,
                customerContext: options.customerContext || '',
                sessionName: options.sessionName || this.sessionId,
                userEmail: options.userEmail || '',
                userPhone: options.userPhone || '',
                userName: options.userName || '',
                sendEmail: options.sendEmail !== false
            };
            
            const result = await this.post('/analyze-window', requestData);
            
            this.hideLoading();
            this.displaySuccess('Image analysis completed successfully!');
            
            // Update UI with analysis results
            if (result.data && result.data.analysis) {
                this.updateAnalysisResults(result.data.analysis);
                
                // Auto-fill measurements if detected
                if (result.data.analysis.estimatedWidth > 0) {
                    this.setInputValue(UI_ELEMENT_IDS.widthInput, result.data.analysis.estimatedWidth);
                }
                if (result.data.analysis.estimatedHeight > 0) {
                    this.setInputValue(UI_ELEMENT_IDS.heightInput, result.data.analysis.estimatedHeight);
                }
                if (result.data.analysis.windowType && result.data.analysis.windowType !== 'unknown') {
                    this.setSelectValue(UI_ELEMENT_IDS.windowTypeDropdown, result.data.analysis.windowType);
                }
                if (result.data.analysis.material && result.data.analysis.material !== 'unknown') {
                    this.setSelectValue(UI_ELEMENT_IDS.materialDropdown, result.data.analysis.material);
                }
            }
            
            return result;
            
        } catch (error) {
            this.hideLoading();
            this.displayError('Image analysis failed. Please try again.');
            throw error;
        }
    }

    /**
     * Validate measurements using AI
     */
    async validateMeasurements(measurements, windowType, context = {}) {
        this.showLoading('Validating measurements...');
        
        try {
            const result = await this.post('/validate-measurements', {
                measurements: measurements,
                windowType: windowType,
                context: {
                    ...context,
                    sessionId: this.sessionId
                }
            });
            
            this.hideLoading();
            
            if (result.data && result.data.validation) {
                const validation = result.data.validation;
                
                if (validation.isValid) {
                    this.displaySuccess(`Measurements validated (${validation.confidence}% confidence)`);
                } else {
                    this.displayWarning(`Measurement concerns detected: ${validation.concerns.join(', ')}`);
                }
                
                // Display recommendations if any
                if (validation.recommendations && validation.recommendations.length > 0) {
                    this.displayRecommendations(validation.recommendations);
                }
            }
            
            return result;
            
        } catch (error) {
            this.hideLoading();
            this.displayError('Measurement validation failed. Please try again.');
            throw error;
        }
    }

    /**
     * Generate quote explanation using AI
     */
    async generateQuoteExplanation(quoteData, customerProfile = {}) {
        try {
            const result = await this.post('/generate-quote-explanation', {
                quoteData: quoteData,
                customerProfile: customerProfile
            });
            
            if (result.data && result.data.explanation) {
                this.displayQuoteExplanation(result.data.explanation);
            }
            
            return result;
            
        } catch (error) {
            console.error('Quote explanation generation failed:', error);
            throw error;
        }
    }

    // =====================================================================
    // PRICING AND QUOTE METHODS
    // =====================================================================

    /**
     * Calculate window replacement quote
     */
    async calculateQuote(windows, customerInfo = {}, options = {}) {
        this.showLoading('Calculating quote...');
        
        try {
            // Validate windows data
            if (!Array.isArray(windows) || windows.length === 0) {
                throw new Error('At least one window is required for quote calculation');
            }
            
            // Validate each window
            for (let i = 0; i < windows.length; i++) {
                const window = windows[i];
                if (!window.width || !window.height || !window.windowType) {
                    throw new Error(`Window ${i + 1} is missing required information (width, height, or type)`);
                }
            }
            
            const requestData = {
                windows: windows,
                customerInfo: customerInfo,
                sessionId: this.sessionId,
                sendEmail: options.sendEmail !== false,
                customConfig: options.customConfig || null
            };
            
            const result = await this.post('/calculate-quote', requestData);
            
            this.hideLoading();
            this.displaySuccess('Quote calculated successfully!');
            
            // Update UI with quote results
            if (result.data) {
                this.updateQuoteResults(result.data);
                
                // Generate and display explanation if customer info provided
                if (customerInfo.customerEmail) {
                    await this.generateQuoteExplanation(result.data, customerInfo);
                }
            }
            
            return result;
            
        } catch (error) {
            this.hideLoading();
            this.displayError(`Quote calculation failed: ${error.message}`);
            throw error;
        }
    }

    // =====================================================================
    // PRODUCT DATA METHODS
    // =====================================================================

    /**
     * Get window materials
     */
    async getWindowMaterials() {
        try {
            const result = await this.get('/materials');
            return result.data || [];
        } catch (error) {
            console.error('Failed to get window materials:', error);
            return [];
        }
    }

    /**
     * Get window types
     */
    async getWindowTypes() {
        try {
            const result = await this.get('/window-types');
            return result.data || [];
        } catch (error) {
            console.error('Failed to get window types:', error);
            return [];
        }
    }

    /**
     * Get window brands
     */
    async getWindowBrands() {
        try {
            const result = await this.get('/window-brands');
            return result.data || [];
        } catch (error) {
            console.error('Failed to get window brands:', error);
            return [];
        }
    }

    /**
     * Get window options
     */
    async getWindowOptions() {
        try {
            const result = await this.get('/window-options');
            return result.data || [];
        } catch (error) {
            console.error('Failed to get window options:', error);
            return [];
        }
    }

    /**
     * Get window products with optional filtering
     */
    async getWindowProducts(filters = {}) {
        try {
            const result = await this.get('/window-products', filters);
            return result.data || [];
        } catch (error) {
            console.error('Failed to get window products:', error);
            return [];
        }
    }

    // =====================================================================
    // CUSTOMER MANAGEMENT METHODS
    // =====================================================================

    /**
     * Create or update customer
     */
    async saveCustomer(customerData) {
        try {
            // Validate required fields
            if (!customerData.customerEmail) {
                throw new Error('Customer email is required');
            }
            
            const result = await this.post('/customer', customerData);
            
            if (result.success) {
                this.displaySuccess('Customer information saved successfully');
            }
            
            return result;
            
        } catch (error) {
            this.displayError(`Failed to save customer: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get customer by email
     */
    async getCustomer(email) {
        try {
            const result = await this.get('/customer', { email: email });
            return result.data;
        } catch (error) {
            console.error('Failed to get customer:', error);
            return null;
        }
    }

    // =====================================================================
    // SYSTEM HEALTH METHODS
    // =====================================================================

    /**
     * Check system health
     */
    async checkSystemHealth() {
        try {
            const result = await this.get('/system-health');
            return result.data;
        } catch (error) {
            console.error('System health check failed:', error);
            return { overall: 'error', timestamp: new Date().toISOString() };
        }
    }

    // =====================================================================
    // UI HELPER METHODS
    // =====================================================================

    /**
     * Display loading state
     */
    showLoading(message = 'Loading...') {
        this.setElementText(UI_ELEMENT_IDS.statusMessage, message);
        this.showElement(UI_ELEMENT_IDS.loadingSpinner);
        this.hideElement(UI_ELEMENT_IDS.errorMessage);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.hideElement(UI_ELEMENT_IDS.loadingSpinner);
        this.setElementText(UI_ELEMENT_IDS.statusMessage, '');
    }

    /**
     * Display success message
     */
    displaySuccess(message) {
        this.setElementText(UI_ELEMENT_IDS.statusMessage, message);
        this.setElementClass(UI_ELEMENT_IDS.statusMessage, 'success-message');
        this.hideElement(UI_ELEMENT_IDS.errorMessage);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.setElementText(UI_ELEMENT_IDS.statusMessage, '');
            this.removeElementClass(UI_ELEMENT_IDS.statusMessage, 'success-message');
        }, 5000);
    }

    /**
     * Display error message
     */
    displayError(message) {
        this.setElementText(UI_ELEMENT_IDS.errorMessage, message);
        this.showElement(UI_ELEMENT_IDS.errorMessage);
        this.setElementClass(UI_ELEMENT_IDS.errorMessage, 'error-message');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideElement(UI_ELEMENT_IDS.errorMessage);
        }, 10000);
    }

    /**
     * Display warning message
     */
    displayWarning(message) {
        this.setElementText(UI_ELEMENT_IDS.statusMessage, message);
        this.setElementClass(UI_ELEMENT_IDS.statusMessage, 'warning-message');
        
        // Auto-hide after 7 seconds
        setTimeout(() => {
            this.setElementText(UI_ELEMENT_IDS.statusMessage, '');
            this.removeElementClass(UI_ELEMENT_IDS.statusMessage, 'warning-message');
        }, 7000);
    }

    /**
     * Update analysis results in UI
     */
    updateAnalysisResults(analysis) {
        if (!analysis) return;
        
        const resultHtml = `
            <div class="analysis-results">
                <h3>AI Analysis Results</h3>
                <div class="analysis-item">
                    <strong>Window Type:</strong> ${analysis.windowType || 'Not determined'}
                </div>
                <div class="analysis-item">
                    <strong>Material:</strong> ${analysis.material || 'Not determined'}
                </div>
                <div class="analysis-item">
                    <strong>Estimated Dimensions:</strong> ${analysis.estimatedWidth || 0}" × ${analysis.estimatedHeight || 0}"
                </div>
                <div class="analysis-item">
                    <strong>Condition:</strong> ${analysis.condition || 'Not assessed'}
                </div>
                <div class="analysis-item">
                    <strong>Confidence:</strong> ${analysis.confidence || 0}%
                </div>
                ${analysis.recommendations && analysis.recommendations.length > 0 ? 
                    `<div class="analysis-item">
                        <strong>Recommendations:</strong>
                        <ul>${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
                    </div>` : 
                    ''
                }
            </div>
        `;
        
        this.setElementHtml(UI_ELEMENT_IDS.aiAnalysisResult, resultHtml);
        this.showElement(UI_ELEMENT_IDS.aiAnalysisResult);
    }

    /**
     * Update quote results in UI
     */
    updateQuoteResults(quoteData) {
        if (!quoteData || !quoteData.totals) return;
        
        const resultHtml = `
            <div class="quote-results">
                <h3>Quote Summary</h3>
                <div class="quote-item">
                    <strong>Total Windows:</strong> ${quoteData.totals.windowCount || 0}
                </div>
                <div class="quote-item">
                    <strong>Subtotal:</strong> ${this.formatCurrency(quoteData.totals.subtotal || 0)}
                </div>
                <div class="quote-item">
                    <strong>Installation:</strong> ${this.formatCurrency(quoteData.totals.installation || 0)}
                </div>
                <div class="quote-item">
                    <strong>Tax:</strong> ${this.formatCurrency(quoteData.totals.tax || 0)}
                </div>
                <div class="quote-item total">
                    <strong>Total:</strong> ${this.formatCurrency(quoteData.totals.total || 0)}
                </div>
            </div>
        `;
        
        this.setElementHtml(UI_ELEMENT_IDS.estimateResults, resultHtml);
        this.showElement(UI_ELEMENT_IDS.estimateResults);
    }

    /**
     * Display quote explanation
     */
    displayQuoteExplanation(explanation) {
        this.setElementText(UI_ELEMENT_IDS.quoteExplanation, explanation);
        this.showElement(UI_ELEMENT_IDS.quoteExplanation);
    }

    /**
     * Display recommendations
     */
    displayRecommendations(recommendations) {
        if (!recommendations || recommendations.length === 0) return;
        
        const recHtml = `
            <div class="recommendations">
                <h4>Recommendations:</h4>
                <ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>
            </div>
        `;
        
        // Append to analysis result or create new section
        const existingContent = this.getElementHtml(UI_ELEMENT_IDS.aiAnalysisResult) || '';
        this.setElementHtml(UI_ELEMENT_IDS.aiAnalysisResult, existingContent + recHtml);
    }

    // =====================================================================
    // DOM HELPER METHODS
    // =====================================================================

    /**
     * Set element text content
     */
    setElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Set element HTML content
     */
    setElementHtml(selector, html) {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = html;
        }
    }

    /**
     * Get element HTML content
     */
    getElementHtml(selector) {
        const element = document.querySelector(selector);
        return element ? element.innerHTML : '';
    }

    /**
     * Set input value
     */
    setInputValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
            // Trigger change event
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Set select value
     */
    setSelectValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
            // Trigger change event
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    /**
     * Show element
     */
    showElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    }

    /**
     * Hide element
     */
    hideElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    /**
     * Add CSS class to element
     */
    setElementClass(selector, className) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from element
     */
    removeElementClass(selector, className) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Format currency values
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return '$0.00';
        }
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim().toLowerCase());
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phone) {
        if (!phone || typeof phone !== 'string') {
            return false;
        }
        
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        // Must be exactly 10 digits
        return digits.length === 10;
    }
}

// =====================================================================
// GLOBAL INITIALIZATION
// =====================================================================

// Initialize the API client when the script loads
window.gfeApi = new GFEFrontendApiClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GFEFrontendApiClient;
}

console.log('✅ GFE Frontend API Client initialized successfully');

