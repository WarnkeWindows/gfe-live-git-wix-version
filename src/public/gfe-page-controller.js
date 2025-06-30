/**
 * Page Controller - Good Faith Exteriors
 * public/js/gfe-page-controller.js
 * 
 * Updated for consistency with backend API patterns
 * Orchestrates frontend logic and iframe communication
 */

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// =====================================================================
// PAGE CONFIGURATION
// =====================================================================

const PAGE_CONFIG = {
    // Iframe element IDs for communication
    WINDOW_PRODUCTS_IFRAME: '#windowProductsIframe',
    AI_ESTIMATOR_IFRAME: '#aiEstimatorIframe',
    
    // UI element IDs for general page interaction and feedback
    CONNECTION_STATUS: '#connectionStatus',
    LOADING_OVERLAY: '#loadingOverlay',
    ERROR_MESSAGE: '#errorMessage',
    SUCCESS_MESSAGE: '#successMessage',
    STATUS_MESSAGE: '#statusMessage',
    
    // Button element IDs
    ADD_WINDOW_BTN: '#addWindowBtn',
    CALCULATE_BTN: '#calculatePrice',
    AI_ANALYZE_BTN: '#analyzeImage',
    APPLY_AI_RESULTS: '#applyAIResults',
    SAVE_QUOTE_BTN: '#saveQuoteBtn',
    EMAIL_QUOTE_BTN: '#emailQuoteBtn',
    SCHEDULE_CONSULTATION_BTN: '#scheduleConsultationButton',
    CLEAR_QUOTE_BTN: '#clearQuoteBtn',
    
    // Input element IDs for customer and project details
    CUSTOMER_NAME: '#customerName',
    CUSTOMER_EMAIL: '#customerEmail',
    CUSTOMER_PHONE: '#customerPhone',
    PROJECT_ADDRESS: '#projectAddress',
    PROJECT_NOTES: '#projectNotes',
    
    // Display element IDs for quote summary and results
    QUOTE_TOTAL: '#quoteTotal',
    WINDOW_COUNT: '#windowCount',
    ESTIMATE_SUMMARY: '#estimateSummary',
    WINDOWS_LIST_DISPLAY: '#yourWindowsList',
    QUOTE_EXPLANATION_DISPLAY: '#quoteExplanation',
    AI_ANALYSIS_DISPLAY: '#aiAnalysisResult',
    
    // Image upload elements
    IMAGE_UPLOAD_INPUT: '#imageUpload',
    UPLOADED_IMAGE_DISPLAY: '#uploadedImage',
    RETAKE_PHOTO_BTN: '#retakePhoto'
};

// =====================================================================
// STATE MANAGEMENT CLASS
// =====================================================================

class GFEPageControllerState {
    constructor() {
        this.currentQuote = {
            windows: [],
            customer: {},
            totals: { 
                subtotal: 0, 
                installation: 0, 
                tax: 0, 
                total: 0,
                windowCount: 0
            },
            aiAnalysis: null,
            quoteId: null,
            sessionId: this.generateSessionId(),
            timestamp: new Date().toISOString()
        };
        
        this.iframeConnections = {
            windowProducts: false,
            aiEstimator: false
        };
        
        this.isLoading = false;
        this.lastError = null;
        this.currentImageData = null;
        
        // Load saved state from session storage
        this.loadFromSession();
    }

    /**
     * Generates a unique session ID
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generates a unique window ID
     */
    generateWindowId() {
        return 'win_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Updates quote data and persists to session storage
     */
    updateQuote(data) {
        this.currentQuote = { 
            ...this.currentQuote, 
            ...data,
            timestamp: new Date().toISOString()
        };
        this.saveToSession();
        this.updateUI();
    }

    /**
     * Adds a window to the current quote
     */
    addWindow(windowData) {
        const window = {
            id: this.generateWindowId(),
            ...windowData,
            timestamp: new Date().toISOString()
        };
        
        this.currentQuote.windows.push(window);
        this.currentQuote.totals.windowCount = this.currentQuote.windows.length;
        this.saveToSession();
        this.updateUI();
        
        console.log('✅ Window added to quote:', window);
        return window;
    }

    /**
     * Removes a window from the current quote
     */
    removeWindow(windowId) {
        const initialCount = this.currentQuote.windows.length;
        this.currentQuote.windows = this.currentQuote.windows.filter(w => w.id !== windowId);
        this.currentQuote.totals.windowCount = this.currentQuote.windows.length;
        
        if (this.currentQuote.windows.length < initialCount) {
            this.saveToSession();
            this.updateUI();
            console.log('✅ Window removed from quote:', windowId);
            return true;
        }
        
        return false;
    }

    /**
     * Updates customer information
     */
    updateCustomer(customerData) {
        this.currentQuote.customer = {
            ...this.currentQuote.customer,
            ...customerData
        };
        this.saveToSession();
        console.log('✅ Customer information updated');
    }

    /**
     * Clears the current quote
     */
    clearQuote() {
        this.currentQuote = {
            windows: [],
            customer: {},
            totals: { 
                subtotal: 0, 
                installation: 0, 
                tax: 0, 
                total: 0,
                windowCount: 0
            },
            aiAnalysis: null,
            quoteId: null,
            sessionId: this.generateSessionId(),
            timestamp: new Date().toISOString()
        };
        this.saveToSession();
        this.updateUI();
        console.log('✅ Quote cleared');
    }

    /**
     * Saves state to session storage
     */
    saveToSession() {
        try {
            const stateData = {
                currentQuote: this.currentQuote,
                timestamp: new Date().toISOString()
            };
            sessionStorage.setItem('gfe_quote_state', JSON.stringify(stateData));
        } catch (error) {
            console.error('❌ Failed to save state to session storage:', error);
        }
    }

    /**
     * Loads state from session storage
     */
    loadFromSession() {
        try {
            const savedState = sessionStorage.getItem('gfe_quote_state');
            if (savedState) {
                const stateData = JSON.parse(savedState);
                
                // Check if state is recent (within 24 hours)
                const stateAge = Date.now() - new Date(stateData.timestamp).getTime();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (stateAge < maxAge && stateData.currentQuote) {
                    this.currentQuote = {
                        ...this.currentQuote,
                        ...stateData.currentQuote
                    };
                    console.log('✅ State loaded from session storage');
                } else {
                    console.log('⚠️ Saved state is too old, using fresh state');
                }
            }
        } catch (error) {
            console.error('❌ Failed to load state from session storage:', error);
        }
    }

    /**
     * Updates the UI to reflect current state
     */
    updateUI() {
        this.updateQuoteSummary();
        this.updateWindowsList();
        this.updateCustomerForm();
    }

    /**
     * Updates quote summary display
     */
    updateQuoteSummary() {
        const totals = this.currentQuote.totals;
        
        // Update individual elements
        this.setElementText(PAGE_CONFIG.WINDOW_COUNT, totals.windowCount.toString());
        this.setElementText(PAGE_CONFIG.QUOTE_TOTAL, this.formatCurrency(totals.total));
        
        // Update summary text
        const summaryText = `${totals.windowCount} windows - Total: ${this.formatCurrency(totals.total)}`;
        this.setElementText(PAGE_CONFIG.ESTIMATE_SUMMARY, summaryText);
    }

    /**
     * Updates windows list display
     */
    updateWindowsList() {
        const windowsListElement = document.querySelector(PAGE_CONFIG.WINDOWS_LIST_DISPLAY);
        if (!windowsListElement) return;
        
        if (this.currentQuote.windows.length === 0) {
            windowsListElement.innerHTML = '<p class="no-windows">No windows added yet</p>';
            return;
        }
        
        const windowsHtml = this.currentQuote.windows.map((window, index) => `
            <div class="window-item" data-window-id="${window.id}">
                <div class="window-header">
                    <h4>Window ${index + 1}</h4>
                    <button class="remove-window-btn" onclick="pageController.removeWindow('${window.id}')">×</button>
                </div>
                <div class="window-details">
                    <span><strong>Type:</strong> ${window.windowType || 'Not specified'}</span>
                    <span><strong>Material:</strong> ${window.material || 'Not specified'}</span>
                    <span><strong>Dimensions:</strong> ${window.width || 0}" × ${window.height || 0}"</span>
                    <span><strong>Quantity:</strong> ${window.quantity || 1}</span>
                    ${window.totalPrice ? `<span><strong>Price:</strong> ${this.formatCurrency(window.totalPrice)}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        windowsListElement.innerHTML = windowsHtml;
    }

    /**
     * Updates customer form with saved data
     */
    updateCustomerForm() {
        const customer = this.currentQuote.customer;
        
        this.setInputValue(PAGE_CONFIG.CUSTOMER_NAME, customer.customerName || '');
        this.setInputValue(PAGE_CONFIG.CUSTOMER_EMAIL, customer.customerEmail || '');
        this.setInputValue(PAGE_CONFIG.CUSTOMER_PHONE, customer.customerPhone || '');
        this.setInputValue(PAGE_CONFIG.PROJECT_ADDRESS, customer.customerAddress || '');
        this.setInputValue(PAGE_CONFIG.PROJECT_NOTES, customer.notes || '');
    }

    /**
     * Helper method to set element text
     */
    setElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Helper method to set input value
     */
    setInputValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
        }
    }

    /**
     * Helper method to format currency
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
}

// =====================================================================
// PAGE CONTROLLER CLASS
// =====================================================================

class GFEPageController {
    constructor() {
        this.state = new GFEPageControllerState();
        this.api = window.gfeApi; // Reference to the global API client
        this.messageHandlers = new Map();
        
        this.initializeEventListeners();
        this.initializeIframeListeners();
        this.initializeFormValidation();
        
        console.log('✅ GFE Page Controller initialized');
    }

    /**
     * Initializes event listeners for page elements
     */
    initializeEventListeners() {
        // Button event listeners
        this.addClickListener(PAGE_CONFIG.ADD_WINDOW_BTN, () => this.handleAddWindow());
        this.addClickListener(PAGE_CONFIG.CALCULATE_BTN, () => this.handleCalculateQuote());
        this.addClickListener(PAGE_CONFIG.AI_ANALYZE_BTN, () => this.handleAIAnalysis());
        this.addClickListener(PAGE_CONFIG.APPLY_AI_RESULTS, () => this.handleApplyAIResults());
        this.addClickListener(PAGE_CONFIG.SAVE_QUOTE_BTN, () => this.handleSaveQuote());
        this.addClickListener(PAGE_CONFIG.EMAIL_QUOTE_BTN, () => this.handleEmailQuote());
        this.addClickListener(PAGE_CONFIG.SCHEDULE_CONSULTATION_BTN, () => this.handleScheduleConsultation());
        this.addClickListener(PAGE_CONFIG.CLEAR_QUOTE_BTN, () => this.handleClearQuote());
        this.addClickListener(PAGE_CONFIG.RETAKE_PHOTO_BTN, () => this.handleRetakePhoto());
        
        // Image upload listener
        this.addChangeListener(PAGE_CONFIG.IMAGE_UPLOAD_INPUT, (event) => this.handleImageUpload(event));
        
        // Customer form listeners
        this.addChangeListener(PAGE_CONFIG.CUSTOMER_NAME, () => this.handleCustomerInfoChange());
        this.addChangeListener(PAGE_CONFIG.CUSTOMER_EMAIL, () => this.handleCustomerInfoChange());
        this.addChangeListener(PAGE_CONFIG.CUSTOMER_PHONE, () => this.handleCustomerInfoChange());
        this.addChangeListener(PAGE_CONFIG.PROJECT_ADDRESS, () => this.handleCustomerInfoChange());
        this.addChangeListener(PAGE_CONFIG.PROJECT_NOTES, () => this.handleCustomerInfoChange());
    }

    /**
     * Initializes iframe message listeners
     */
    initializeIframeListeners() {
        window.addEventListener('message', (event) => {
            this.handleIframeMessage(event);
        });
        
        // Register message handlers
        this.messageHandlers.set('iframe_ready', this.handleIframeReady.bind(this));
        this.messageHandlers.set('product_selected', this.handleProductSelected.bind(this));
        this.messageHandlers.set('filter_changed', this.handleFilterChanged.bind(this));
        this.messageHandlers.set('image_uploaded', this.handleImageUploaded.bind(this));
        this.messageHandlers.set('ai_analysis_complete', this.handleAIAnalysisComplete.bind(this));
        this.messageHandlers.set('price_calculated', this.handlePriceCalculated.bind(this));
        this.messageHandlers.set('quote_generated', this.handleQuoteGenerated.bind(this));
        this.messageHandlers.set('customer_info_updated', this.handleCustomerInfoUpdated.bind(this));
        this.messageHandlers.set('user_engaged', this.handleUserEngaged.bind(this));
        this.messageHandlers.set('error_occurred', this.handleErrorOccurred.bind(this));
    }

    /**
     * Initializes form validation
     */
    initializeFormValidation() {
        // Email validation
        this.addBlurListener(PAGE_CONFIG.CUSTOMER_EMAIL, (event) => {
            const email = event.target.value.trim();
            if (email && !this.api.isValidEmail(email)) {
                this.showError('Please enter a valid email address');
                event.target.classList.add('error');
            } else {
                event.target.classList.remove('error');
            }
        });
        
        // Phone validation
        this.addBlurListener(PAGE_CONFIG.CUSTOMER_PHONE, (event) => {
            const phone = event.target.value.trim();
            if (phone && !this.api.isValidPhoneNumber(phone)) {
                this.showError('Please enter a valid 10-digit phone number');
                event.target.classList.add('error');
            } else {
                event.target.classList.remove('error');
            }
        });
    }

    // =====================================================================
    // EVENT HANDLER METHODS
    // =====================================================================

    /**
     * Handles adding a window to the quote
     */
    async handleAddWindow() {
        try {
            // Get window data from form or iframe
            const windowData = await this.getWindowDataFromCurrentForm();
            
            if (!this.validateWindowData(windowData)) {
                return;
            }
            
            // Add window to state
            const addedWindow = this.state.addWindow(windowData);
            
            this.showSuccess(`Window ${this.state.currentQuote.windows.length} added to quote`);
            
            // Send message to iframes
            this.sendMessageToIframes('window_added', { window: addedWindow });
            
        } catch (error) {
            console.error('❌ Failed to add window:', error);
            this.showError('Failed to add window to quote');
        }
    }

    /**
     * Handles quote calculation
     */
    async handleCalculateQuote() {
        try {
            if (this.state.currentQuote.windows.length === 0) {
                this.showError('Please add at least one window to calculate a quote');
                return;
            }
            
            // Get customer info
            const customerInfo = this.getCustomerInfoFromForm();
            
            // Calculate quote using API
            const result = await this.api.calculateQuote(
                this.state.currentQuote.windows,
                customerInfo,
                { sendEmail: false } // Don't auto-send email from calculation
            );
            
            if (result.success && result.data) {
                // Update state with calculated totals
                this.state.updateQuote({
                    totals: result.data.totals,
                    customer: customerInfo,
                    timestamp: new Date().toISOString()
                });
                
                this.showSuccess('Quote calculated successfully!');
                
                // Generate explanation if customer info provided
                if (customerInfo.customerEmail) {
                    await this.generateQuoteExplanation(result.data, customerInfo);
                }
            }
            
        } catch (error) {
            console.error('❌ Quote calculation failed:', error);
            this.showError('Failed to calculate quote. Please try again.');
        }
    }

    /**
     * Handles AI image analysis
     */
    async handleAIAnalysis() {
        try {
            if (!this.state.currentImageData) {
                this.showError('Please upload an image first');
                return;
            }
            
            const customerInfo = this.getCustomerInfoFromForm();
            
            const result = await this.api.analyzeWindow(this.state.currentImageData, {
                analysisType: 'detailed',
                includeRecommendations: true,
                userEmail: customerInfo.customerEmail,
                userName: customerInfo.customerName,
                userPhone: customerInfo.customerPhone,
                sendEmail: customerInfo.customerEmail ? true : false
            });
            
            if (result.success && result.data) {
                this.state.updateQuote({
                    aiAnalysis: result.data.analysis
                });
                
                this.displayAIAnalysisResults(result.data.analysis);
                this.showSuccess('AI analysis completed successfully!');
            }
            
        } catch (error) {
            console.error('❌ AI analysis failed:', error);
            this.showError('AI analysis failed. Please try again.');
        }
    }

    /**
     * Handles applying AI results to form
     */
    handleApplyAIResults() {
        const analysis = this.state.currentQuote.aiAnalysis;
        if (!analysis) {
            this.showError('No AI analysis results to apply');
            return;
        }
        
        // Apply AI results to form fields
        if (analysis.windowType && analysis.windowType !== 'unknown') {
            this.setSelectValue('#windowType', analysis.windowType);
        }
        
        if (analysis.material && analysis.material !== 'unknown') {
            this.setSelectValue('#material', analysis.material);
        }
        
        if (analysis.estimatedWidth > 0) {
            this.setInputValue('#width', analysis.estimatedWidth.toString());
        }
        
        if (analysis.estimatedHeight > 0) {
            this.setInputValue('#height', analysis.estimatedHeight.toString());
        }
        
        this.showSuccess('AI analysis results applied to form');
    }

    /**
     * Handles saving quote
     */
    async handleSaveQuote() {
        try {
            const customerInfo = this.getCustomerInfoFromForm();
            
            if (!customerInfo.customerEmail) {
                this.showError('Please provide customer email to save quote');
                return;
            }
            
            // Save customer information
            await this.api.saveCustomer(customerInfo);
            
            this.state.updateQuote({
                customer: customerInfo,
                quoteId: this.state.generateSessionId()
            });
            
            this.showSuccess('Quote saved successfully!');
            
        } catch (error) {
            console.error('❌ Failed to save quote:', error);
            this.showError('Failed to save quote. Please try again.');
        }
    }

    /**
     * Handles emailing quote
     */
    async handleEmailQuote() {
        try {
            const customerInfo = this.getCustomerInfoFromForm();
            
            if (!customerInfo.customerEmail) {
                this.showError('Please provide customer email to send quote');
                return;
            }
            
            if (this.state.currentQuote.windows.length === 0) {
                this.showError('Please add windows and calculate quote before sending');
                return;
            }
            
            // Calculate quote with email sending enabled
            const result = await this.api.calculateQuote(
                this.state.currentQuote.windows,
                customerInfo,
                { sendEmail: true }
            );
            
            if (result.success) {
                this.showSuccess('Quote emailed successfully!');
            }
            
        } catch (error) {
            console.error('❌ Failed to email quote:', error);
            this.showError('Failed to email quote. Please try again.');
        }
    }

    /**
     * Handles scheduling consultation
     */
    handleScheduleConsultation() {
        // This would typically open a scheduling widget or redirect to booking page
        this.showSuccess('Consultation scheduling feature coming soon!');
    }

    /**
     * Handles clearing quote
     */
    handleClearQuote() {
        if (confirm('Are you sure you want to clear the current quote? This action cannot be undone.')) {
            this.state.clearQuote();
            this.clearForm();
            this.showSuccess('Quote cleared successfully');
        }
    }

    /**
     * Handles retaking photo
     */
    handleRetakePhoto() {
        this.state.currentImageData = null;
        this.hideElement(PAGE_CONFIG.UPLOADED_IMAGE_DISPLAY);
        this.showElement(PAGE_CONFIG.IMAGE_UPLOAD_INPUT);
        this.hideElement(PAGE_CONFIG.RETAKE_PHOTO_BTN);
    }

    /**
     * Handles image upload
     */
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            this.state.currentImageData = base64Data;
            
            // Display uploaded image
            this.displayUploadedImage(base64Data);
            
            this.showSuccess('Image uploaded successfully');
            
        } catch (error) {
            console.error('❌ Image upload failed:', error);
            this.showError('Failed to upload image. Please try again.');
        }
    }

    /**
     * Handles customer info changes
     */
    handleCustomerInfoChange() {
        const customerInfo = this.getCustomerInfoFromForm();
        this.state.updateCustomer(customerInfo);
    }

    // =====================================================================
    // IFRAME MESSAGE HANDLERS
    // =====================================================================

    /**
     * Handles iframe messages
     */
    handleIframeMessage(event) {
        try {
            // Validate origin for security
            if (!this.isValidOrigin(event.origin)) {
                console.warn('⚠️ Message from invalid origin:', event.origin);
                return;
            }
            
            const { type, data, source } = event.data;
            
            console.log('📨 Received iframe message:', { type, source });
            
            // Get handler for message type
            const handler = this.messageHandlers.get(type);
            if (handler) {
                handler(data, source);
            } else {
                console.warn('⚠️ No handler for message type:', type);
            }
            
        } catch (error) {
            console.error('❌ Error handling iframe message:', error);
        }
    }

    /**
     * Handles iframe ready message
     */
    handleIframeReady(data, source) {
        if (source === 'gfe-window-products') {
            this.state.iframeConnections.windowProducts = true;
        } else if (source === 'gfe-ai-estimator') {
            this.state.iframeConnections.aiEstimator = true;
        }
        
        this.updateConnectionStatus();
        console.log(`✅ ${source} iframe ready`);
    }

    /**
     * Handles product selection from iframe
     */
    handleProductSelected(data, source) {
        console.log('🏠 Product selected:', data);
        
        // Auto-fill form with product data
        if (data.windowType) {
            this.setSelectValue('#windowType', data.windowType);
        }
        if (data.material) {
            this.setSelectValue('#material', data.material);
        }
        if (data.brand) {
            this.setSelectValue('#brand', data.brand);
        }
        
        this.showSuccess(`${data.productName || 'Product'} selected`);
    }

    /**
     * Handles AI analysis completion from iframe
     */
    handleAIAnalysisComplete(data, source) {
        console.log('🤖 AI analysis complete:', data);
        
        this.state.updateQuote({
            aiAnalysis: data.analysis
        });
        
        this.displayAIAnalysisResults(data.analysis);
        this.showSuccess('AI analysis completed!');
    }

    /**
     * Handles quote generation from iframe
     */
    handleQuoteGenerated(data, source) {
        console.log('💰 Quote generated:', data);
        
        this.state.updateQuote({
            totals: data.totals
        });
        
        this.showSuccess('Quote generated successfully!');
    }

    /**
     * Handles error messages from iframe
     */
    handleErrorOccurred(data, source) {
        console.error('❌ Error from iframe:', data);
        this.showError(data.message || 'An error occurred in the iframe');
    }

    // =====================================================================
    // UTILITY METHODS
    // =====================================================================

    /**
     * Gets window data from current form
     */
    async getWindowDataFromCurrentForm() {
        return {
            windowType: this.getSelectValue('#windowType') || 'double-hung',
            material: this.getSelectValue('#material') || 'vinyl',
            brand: this.getSelectValue('#brand') || 'standard',
            width: parseFloat(this.getInputValue('#width')) || 36,
            height: parseFloat(this.getInputValue('#height')) || 48,
            quantity: parseInt(this.getInputValue('#quantity')) || 1,
            glassOptions: this.getSelectValue('#glassOptions') || '',
            notes: this.getInputValue('#windowNotes') || ''
        };
    }

    /**
     * Gets customer info from form
     */
    getCustomerInfoFromForm() {
        return {
            customerName: this.getInputValue(PAGE_CONFIG.CUSTOMER_NAME),
            customerEmail: this.getInputValue(PAGE_CONFIG.CUSTOMER_EMAIL),
            customerPhone: this.getInputValue(PAGE_CONFIG.CUSTOMER_PHONE),
            customerAddress: this.getInputValue(PAGE_CONFIG.PROJECT_ADDRESS),
            notes: this.getInputValue(PAGE_CONFIG.PROJECT_NOTES)
        };
    }

    /**
     * Validates window data
     */
    validateWindowData(windowData) {
        if (!windowData.width || windowData.width <= 0) {
            this.showError('Please enter a valid window width');
            return false;
        }
        
        if (!windowData.height || windowData.height <= 0) {
            this.showError('Please enter a valid window height');
            return false;
        }
        
        if (!windowData.quantity || windowData.quantity <= 0) {
            this.showError('Please enter a valid quantity');
            return false;
        }
        
        return true;
    }

    /**
     * Generates quote explanation
     */
    async generateQuoteExplanation(quoteData, customerInfo) {
        try {
            const result = await this.api.generateQuoteExplanation(quoteData, customerInfo);
            
            if (result.success && result.data) {
                this.setElementText(PAGE_CONFIG.QUOTE_EXPLANATION_DISPLAY, result.data.explanation);
                this.showElement(PAGE_CONFIG.QUOTE_EXPLANATION_DISPLAY);
            }
            
        } catch (error) {
            console.error('❌ Failed to generate quote explanation:', error);
        }
    }

    /**
     * Displays AI analysis results
     */
    displayAIAnalysisResults(analysis) {
        if (!analysis) return;
        
        const resultHtml = `
            <div class="ai-analysis-results">
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
        
        this.setElementHtml(PAGE_CONFIG.AI_ANALYSIS_DISPLAY, resultHtml);
        this.showElement(PAGE_CONFIG.AI_ANALYSIS_DISPLAY);
        this.showElement(PAGE_CONFIG.APPLY_AI_RESULTS);
    }

    /**
     * Displays uploaded image
     */
    displayUploadedImage(base64Data) {
        const imgElement = document.querySelector(PAGE_CONFIG.UPLOADED_IMAGE_DISPLAY);
        if (imgElement) {
            imgElement.src = base64Data;
            this.showElement(PAGE_CONFIG.UPLOADED_IMAGE_DISPLAY);
        }
        
        this.hideElement(PAGE_CONFIG.IMAGE_UPLOAD_INPUT);
        this.showElement(PAGE_CONFIG.RETAKE_PHOTO_BTN);
    }

    /**
     * Converts file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Clears form fields
     */
    clearForm() {
        // Clear customer form
        this.setInputValue(PAGE_CONFIG.CUSTOMER_NAME, '');
        this.setInputValue(PAGE_CONFIG.CUSTOMER_EMAIL, '');
        this.setInputValue(PAGE_CONFIG.CUSTOMER_PHONE, '');
        this.setInputValue(PAGE_CONFIG.PROJECT_ADDRESS, '');
        this.setInputValue(PAGE_CONFIG.PROJECT_NOTES, '');
        
        // Clear window form
        this.setInputValue('#width', '');
        this.setInputValue('#height', '');
        this.setInputValue('#quantity', '1');
        this.setSelectValue('#windowType', '');
        this.setSelectValue('#material', '');
        this.setSelectValue('#brand', '');
        
        // Clear displays
        this.hideElement(PAGE_CONFIG.QUOTE_EXPLANATION_DISPLAY);
        this.hideElement(PAGE_CONFIG.AI_ANALYSIS_DISPLAY);
        this.hideElement(PAGE_CONFIG.UPLOADED_IMAGE_DISPLAY);
        this.hideElement(PAGE_CONFIG.APPLY_AI_RESULTS);
        
        // Reset image upload
        this.state.currentImageData = null;
        this.showElement(PAGE_CONFIG.IMAGE_UPLOAD_INPUT);
        this.hideElement(PAGE_CONFIG.RETAKE_PHOTO_BTN);
    }

    /**
     * Updates connection status display
     */
    updateConnectionStatus() {
        const status = this.state.iframeConnections;
        const statusText = `Window Products: ${status.windowProducts ? '✅' : '❌'} | AI Estimator: ${status.aiEstimator ? '✅' : '❌'}`;
        this.setElementText(PAGE_CONFIG.CONNECTION_STATUS, statusText);
    }

    /**
     * Sends message to all connected iframes
     */
    sendMessageToIframes(type, data) {
        const message = {
            type: type,
            data: data,
            source: 'gfe-page-controller',
            timestamp: new Date().toISOString()
        };
        
        // Send to window products iframe
        const windowProductsIframe = document.querySelector(PAGE_CONFIG.WINDOW_PRODUCTS_IFRAME);
        if (windowProductsIframe && windowProductsIframe.contentWindow) {
            windowProductsIframe.contentWindow.postMessage(message, '*');
        }
        
        // Send to AI estimator iframe
        const aiEstimatorIframe = document.querySelector(PAGE_CONFIG.AI_ESTIMATOR_IFRAME);
        if (aiEstimatorIframe && aiEstimatorIframe.contentWindow) {
            aiEstimatorIframe.contentWindow.postMessage(message, '*');
        }
    }

    /**
     * Validates message origin
     */
    isValidOrigin(origin) {
        // Add your valid origins here
        const validOrigins = [
            'https://goodfaithexteriors.com',
            'https://www.goodfaithexteriors.com',
            'https://gfe-estimator.netlify.app',
            'http://localhost:3000',
            'http://localhost:8080'
        ];
        
        return validOrigins.includes(origin) || origin === window.location.origin;
    }

    // =====================================================================
    // DOM HELPER METHODS
    // =====================================================================

    addClickListener(selector, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    addChangeListener(selector, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('change', handler);
        }
    }

    addBlurListener(selector, handler) {
        const element = document.querySelector(selector);
        if (element) {
            element.addEventListener('blur', handler);
        }
    }

    getInputValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.value.trim() : '';
    }

    setInputValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
        }
    }

    getSelectValue(selector) {
        const element = document.querySelector(selector);
        return element ? element.value : '';
    }

    setSelectValue(selector, value) {
        const element = document.querySelector(selector);
        if (element) {
            element.value = value;
        }
    }

    setElementText(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    setElementHtml(selector, html) {
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = html;
        }
    }

    showElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = '';
            element.classList.remove('hidden');
        }
    }

    hideElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
            element.classList.add('hidden');
        }
    }

    showSuccess(message) {
        this.setElementText(PAGE_CONFIG.SUCCESS_MESSAGE, message);
        this.showElement(PAGE_CONFIG.SUCCESS_MESSAGE);
        this.hideElement(PAGE_CONFIG.ERROR_MESSAGE);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideElement(PAGE_CONFIG.SUCCESS_MESSAGE);
        }, 5000);
    }

    showError(message) {
        this.setElementText(PAGE_CONFIG.ERROR_MESSAGE, message);
        this.showElement(PAGE_CONFIG.ERROR_MESSAGE);
        this.hideElement(PAGE_CONFIG.SUCCESS_MESSAGE);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideElement(PAGE_CONFIG.ERROR_MESSAGE);
        }, 10000);
    }
}

// =====================================================================
// GLOBAL INITIALIZATION
// =====================================================================

// Initialize page controller when DOM is ready
let pageController;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        pageController = new GFEPageController();
        window.pageController = pageController; // Make globally accessible
    });
} else {
    pageController = new GFEPageController();
    window.pageController = pageController; // Make globally accessible
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GFEPageController;
}

console.log('✅ GFE Page Controller script loaded successfully');

