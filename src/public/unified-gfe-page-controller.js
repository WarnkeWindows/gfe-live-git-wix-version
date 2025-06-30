// unified-gfe-page-controller.js
// Good Faith Exteriors - Unified Frontend Page Controller for All Home Remodeling Services
// Orchestrates all user interactions and coordinates with backend services

import unifiedApiClient from './unified-gfe-api-client.js';

// ============================================================================
// PAGE CONTROLLER CONFIGURATION
// ============================================================================

const CONTROLLER_CONFIG = {
  // Service types and their configurations
  services: {
    windows: {
      name: 'Windows',
      icon: '🪟',
      analysisTypes: ['measurement', 'condition', 'comprehensive'],
      defaultQuality: 'better'
    },
    doors: {
      name: 'Doors',
      icon: '🚪',
      analysisTypes: ['measurement', 'condition', 'comprehensive'],
      defaultQuality: 'better'
    },
    roofing: {
      name: 'Roofing',
      icon: '🏠',
      analysisTypes: ['measurement', 'condition', 'damage_assessment'],
      defaultQuality: 'best'
    },
    siding: {
      name: 'Siding',
      icon: '🏘️',
      analysisTypes: ['measurement', 'condition', 'comprehensive'],
      defaultQuality: 'better'
    },
    gutters: {
      name: 'Gutters',
      icon: '🌧️',
      analysisTypes: ['measurement', 'condition', 'comprehensive'],
      defaultQuality: 'better'
    },
    storm_damage: {
      name: 'Storm Damage',
      icon: '⛈️',
      analysisTypes: ['damage_assessment', 'comprehensive'],
      defaultQuality: 'best',
      isEmergency: true
    }
  },

  // UI element IDs
  elements: {
    // Service selection
    serviceSelector: '#serviceSelector',
    serviceCards: '.service-card',
    
    // Customer information form
    customerForm: '#customerForm',
    customerName: '#customerName',
    customerEmail: '#customerEmail',
    customerPhone: '#customerPhone',
    customerAddress: '#customerAddress',
    projectNotes: '#projectNotes',
    
    // Image upload and analysis
    imageUpload: '#imageUpload',
    imagePreview: '#imagePreview',
    analyzeButton: '#analyzeButton',
    analysisResults: '#analysisResults',
    analysisStatus: '#analysisStatus',
    
    // Measurements and specifications
    measurementsForm: '#measurementsForm',
    widthInput: '#widthInput',
    heightInput: '#heightInput',
    quantityInput: '#quantityInput',
    materialSelector: '#materialSelector',
    qualitySelector: '#qualitySelector',
    
    // Quote and pricing
    quoteSection: '#quoteSection',
    quoteItems: '#quoteItems',
    quoteSummary: '#quoteSummary',
    quoteTotal: '#quoteTotal',
    generateQuoteButton: '#generateQuoteButton',
    
    // Project scope (multi-service)
    projectScopeSection: '#projectScopeSection',
    addServiceButton: '#addServiceButton',
    serviceList: '#serviceList',
    projectScopeButton: '#projectScopeButton',
    
    // Communication and actions
    sendQuoteButton: '#sendQuoteButton',
    scheduleConsultationButton: '#scheduleConsultationButton',
    contactUsButton: '#contactUsButton',
    
    // Messages and status
    loadingMessage: '#loadingMessage',
    successMessage: '#successMessage',
    errorMessage: '#errorMessage',
    statusIndicator: '#statusIndicator',
    
    // Storm damage specific
    stormDamageSection: '#stormDamageSection',
    stormTypeSelector: '#stormTypeSelector',
    urgencySelector: '#urgencySelector',
    insuranceInfo: '#insuranceInfo'
  },

  // Default values
  defaults: {
    analysisType: 'comprehensive',
    qualityLevel: 'better',
    projectType: 'windows',
    emergencyTimeout: 5000,
    normalTimeout: 30000
  }
};

// ============================================================================
// UNIFIED PAGE CONTROLLER STATE
// ============================================================================

class UnifiedPageControllerState {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentService = 'windows';
    this.customerInfo = {};
    this.uploadedImages = [];
    this.analysisResults = [];
    this.measurements = {};
    this.selectedProducts = [];
    this.quoteItems = [];
    this.projectScope = null;
    this.sessionId = unifiedApiClient.generateSessionId();
    this.isMultiService = false;
    this.selectedServices = [];
  }

  updateCustomerInfo(info) {
    this.customerInfo = { ...this.customerInfo, ...info };
  }

  addAnalysisResult(result) {
    this.analysisResults.push({
      ...result,
      timestamp: new Date(),
      service: this.currentService
    });
  }

  addQuoteItem(item) {
    this.quoteItems.push({
      ...item,
      sessionId: this.sessionId,
      timestamp: new Date()
    });
  }

  getState() {
    return {
      currentService: this.currentService,
      customerInfo: this.customerInfo,
      uploadedImages: this.uploadedImages,
      analysisResults: this.analysisResults,
      measurements: this.measurements,
      selectedProducts: this.selectedProducts,
      quoteItems: this.quoteItems,
      projectScope: this.projectScope,
      sessionId: this.sessionId,
      isMultiService: this.isMultiService,
      selectedServices: this.selectedServices
    };
  }
}

// ============================================================================
// UNIFIED PAGE CONTROLLER CLASS
// ============================================================================

class UnifiedGFEPageController {
  constructor() {
    this.state = new UnifiedPageControllerState();
    this.apiClient = unifiedApiClient;
    this.isInitialized = false;
    this.currentUploadedImage = null;
  }

  // ============================================================================
  // INITIALIZATION AND SETUP
  // ============================================================================

  async initialize() {
    try {
      this.setupEventListeners();
      this.initializeServiceSelector();
      this.initializeFormValidation();
      this.restoreSessionState();
      
      // Check system health
      await this.checkSystemHealth();
      
      this.isInitialized = true;
      this.showMessage('System initialized successfully', 'success');
      
      console.log('Unified GFE Page Controller initialized');

    } catch (error) {
      console.error('Failed to initialize page controller:', error);
      this.showMessage('Failed to initialize system. Please refresh the page.', 'error');
    }
  }

  setupEventListeners() {
    // Service selection
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.serviceSelector, 'change', this.handleServiceChange.bind(this));
    
    // Customer form
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.customerForm, 'submit', this.handleCustomerFormSubmit.bind(this));
    
    // Image upload and analysis
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.imageUpload, 'change', this.handleImageUpload.bind(this));
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.analyzeButton, 'click', this.handleAnalyzeImage.bind(this));
    
    // Measurements and specifications
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.measurementsForm, 'submit', this.handleMeasurementsSubmit.bind(this));
    
    // Quote generation
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.generateQuoteButton, 'click', this.handleGenerateQuote.bind(this));
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.sendQuoteButton, 'click', this.handleSendQuote.bind(this));
    
    // Multi-service project scope
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.addServiceButton, 'click', this.handleAddService.bind(this));
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.projectScopeButton, 'click', this.handleGenerateProjectScope.bind(this));
    
    // Consultation and contact
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.scheduleConsultationButton, 'click', this.handleScheduleConsultation.bind(this));
    this.addEventListenerSafely(CONTROLLER_CONFIG.elements.contactUsButton, 'click', this.handleContactUs.bind(this));
  }

  addEventListenerSafely(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
    } else {
      console.warn(`Element not found: ${selector}`);
    }
  }

  initializeServiceSelector() {
    const serviceSelector = document.querySelector(CONTROLLER_CONFIG.elements.serviceSelector);
    if (serviceSelector) {
      // Populate service options
      Object.entries(CONTROLLER_CONFIG.services).forEach(([key, service]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${service.icon} ${service.name}`;
        serviceSelector.appendChild(option);
      });
    }

    // Initialize service cards if they exist
    this.initializeServiceCards();
  }

  initializeServiceCards() {
    const serviceCards = document.querySelectorAll(CONTROLLER_CONFIG.elements.serviceCards);
    serviceCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const serviceType = card.dataset.service;
        if (serviceType) {
          this.selectService(serviceType);
          // Update visual selection
          serviceCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        }
      });
    });
  }

  initializeFormValidation() {
    // Add real-time validation to customer form fields
    const fields = [
      { selector: CONTROLLER_CONFIG.elements.customerName, validator: this.validateName },
      { selector: CONTROLLER_CONFIG.elements.customerEmail, validator: this.validateEmail },
      { selector: CONTROLLER_CONFIG.elements.customerPhone, validator: this.validatePhone }
    ];

    fields.forEach(({ selector, validator }) => {
      const element = document.querySelector(selector);
      if (element) {
        element.addEventListener('blur', (e) => {
          const isValid = validator(e.target.value);
          this.updateFieldValidation(e.target, isValid);
        });
      }
    });
  }

  // ============================================================================
  // SERVICE SELECTION AND MANAGEMENT
  // ============================================================================

  selectService(serviceType) {
    if (!CONTROLLER_CONFIG.services[serviceType]) {
      this.showMessage(`Invalid service type: ${serviceType}`, 'error');
      return;
    }

    this.state.currentService = serviceType;
    this.updateServiceUI(serviceType);
    
    // Reset service-specific state
    this.state.measurements = {};
    this.currentUploadedImage = null;
    
    this.logAnalyticsEvent('service_selected', {
      serviceType: serviceType,
      serviceName: CONTROLLER_CONFIG.services[serviceType].name
    });
  }

  updateServiceUI(serviceType) {
    const service = CONTROLLER_CONFIG.services[serviceType];
    
    // Update page title and descriptions
    const serviceName = document.querySelector('#currentServiceName');
    if (serviceName) {
      serviceName.textContent = service.name;
    }

    // Show/hide service-specific sections
    this.toggleServiceSections(serviceType);
    
    // Update analysis type options
    this.updateAnalysisTypeOptions(service.analysisTypes);
    
    // Update quality selector default
    const qualitySelector = document.querySelector(CONTROLLER_CONFIG.elements.qualitySelector);
    if (qualitySelector) {
      qualitySelector.value = service.defaultQuality;
    }
  }

  toggleServiceSections(serviceType) {
    // Show storm damage specific sections
    const stormSection = document.querySelector(CONTROLLER_CONFIG.elements.stormDamageSection);
    if (stormSection) {
      stormSection.style.display = serviceType === 'storm_damage' ? 'block' : 'none';
    }

    // Show multi-service project scope section
    const projectSection = document.querySelector(CONTROLLER_CONFIG.elements.projectScopeSection);
    if (projectSection) {
      projectSection.style.display = this.state.isMultiService ? 'block' : 'none';
    }
  }

  updateAnalysisTypeOptions(analysisTypes) {
    const analysisTypeSelector = document.querySelector('#analysisTypeSelector');
    if (analysisTypeSelector) {
      analysisTypeSelector.innerHTML = '';
      analysisTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        analysisTypeSelector.appendChild(option);
      });
    }
  }

  // ============================================================================
  // IMAGE UPLOAD AND ANALYSIS
  // ============================================================================

  async handleImageUpload(event) {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file
      if (!this.validateImageFile(file)) {
        this.showMessage('Please select a valid image file (JPG, PNG, WebP) under 10MB', 'error');
        return;
      }

      this.showLoading('Uploading image...');

      // Show image preview
      this.showImagePreview(file);

      // Store file for analysis
      this.currentUploadedImage = file;
      
      // Enable analysis button
      const analyzeButton = document.querySelector(CONTROLLER_CONFIG.elements.analyzeButton);
      if (analyzeButton) {
        analyzeButton.disabled = false;
        analyzeButton.textContent = `Analyze ${CONTROLLER_CONFIG.services[this.state.currentService].name}`;
      }

      this.hideLoading();
      this.showMessage('Image uploaded successfully. Click "Analyze" to proceed.', 'success');

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Upload failed: ${error.message}`, 'error');
    }
  }

  showImagePreview(file) {
    const preview = document.querySelector(CONTROLLER_CONFIG.elements.imagePreview);
    if (preview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Uploaded image" style="max-width: 100%; max-height: 300px; border-radius: 8px;">
          <p style="margin-top: 10px; font-size: 14px; color: #666;">
            ${file.name} (${this.formatFileSize(file.size)})
          </p>
        `;
      };
      reader.readAsDataURL(file);
    }
  }

  async handleAnalyzeImage() {
    if (!this.currentUploadedImage) {
      this.showMessage('Please upload an image first', 'error');
      return;
    }

    if (!this.validateCustomerInfoForAnalysis()) {
      this.showMessage('Please fill in your contact information before analysis', 'error');
      return;
    }

    try {
      this.showLoading('Analyzing image with AI...');

      // Convert image to base64
      const base64Image = await this.apiClient.fileToBase64(this.currentUploadedImage);

      // Prepare analysis data
      const analysisData = {
        imageData: base64Image,
        componentType: this.state.currentService,
        analysisType: this.getSelectedAnalysisType(),
        customerInfo: this.state.customerInfo,
        projectContext: {
          notes: this.getProjectNotes()
        },
        propertyDetails: this.getPropertyDetails()
      };

      // Call AI analysis API
      const response = await this.apiClient.analyzeExteriorComponent(analysisData);

      if (response.success) {
        this.handleAnalysisSuccess(response.data);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Analysis failed: ${this.apiClient.getUserFriendlyErrorMessage(error)}`, 'error');
    }
  }

  handleAnalysisSuccess(analysisData) {
    this.hideLoading();
    
    // Store analysis results
    this.state.addAnalysisResult(analysisData);

    // Display results
    this.displayAnalysisResults(analysisData);

    // Auto-fill form fields if measurements detected
    if (analysisData.analysis && analysisData.analysis.measurements) {
      this.autoFillMeasurements(analysisData.analysis.measurements);
    }

    // Show next steps
    this.showNextSteps();

    this.showMessage('Analysis completed successfully!', 'success');
    
    this.logAnalyticsEvent('image_analysis_completed', {
      componentType: this.state.currentService,
      confidence: analysisData.confidence,
      hasRecommendations: !!(analysisData.recommendations && analysisData.recommendations.length > 0)
    });
  }

  displayAnalysisResults(analysisData) {
    const resultsContainer = document.querySelector(CONTROLLER_CONFIG.elements.analysisResults);
    if (!resultsContainer) return;

    const { analysis, confidence, recommendations } = analysisData;

    resultsContainer.innerHTML = `
      <div class="analysis-results-card">
        <h3>🤖 AI Analysis Results</h3>
        
        <div class="confidence-score">
          <strong>Confidence Score:</strong> 
          <span class="confidence-badge ${this.getConfidenceClass(confidence)}">${confidence}%</span>
        </div>

        ${analysis.measurements ? `
          <div class="measurements-section">
            <h4>📏 Detected Measurements</h4>
            <p>${analysis.measurements}</p>
          </div>
        ` : ''}

        ${analysis.type ? `
          <div class="detection-section">
            <h4>🔍 Detected Information</h4>
            <ul>
              ${analysis.type ? `<li><strong>Type:</strong> ${analysis.type}</li>` : ''}
              ${analysis.material ? `<li><strong>Material:</strong> ${analysis.material}</li>` : ''}
              ${analysis.condition ? `<li><strong>Condition:</strong> ${analysis.condition}</li>` : ''}
              ${analysis.color ? `<li><strong>Color:</strong> ${analysis.color}</li>` : ''}
            </ul>
          </div>
        ` : ''}

        ${recommendations && recommendations.length > 0 ? `
          <div class="recommendations-section">
            <h4>💡 Our Recommendations</h4>
            <ul>
              ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    resultsContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // ============================================================================
  // MEASUREMENTS AND SPECIFICATIONS
  // ============================================================================

  async handleMeasurementsSubmit(event) {
    event.preventDefault();

    try {
      const measurements = this.collectMeasurements();
      
      if (!this.validateMeasurements(measurements)) {
        this.showMessage('Please check your measurements and try again', 'error');
        return;
      }

      this.showLoading('Validating measurements...');

      // Validate measurements with AI if we have analysis results
      if (this.state.analysisResults.length > 0) {
        const validationResponse = await this.apiClient.validateMeasurements({
          userMeasurements: measurements,
          aiAnalysis: this.state.analysisResults[this.state.analysisResults.length - 1],
          componentType: this.state.currentService
        });

        if (validationResponse.success) {
          this.handleMeasurementValidation(validationResponse.data);
        }
      }

      // Store measurements
      this.state.measurements = measurements;
      
      // Update UI to show quote section
      this.showQuoteSection();
      
      this.hideLoading();
      this.showMessage('Measurements saved successfully!', 'success');

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Validation failed: ${error.message}`, 'error');
    }
  }

  collectMeasurements() {
    return {
      width: this.getElementValue(CONTROLLER_CONFIG.elements.widthInput),
      height: this.getElementValue(CONTROLLER_CONFIG.elements.heightInput),
      quantity: this.getElementValue(CONTROLLER_CONFIG.elements.quantityInput) || 1,
      material: this.getElementValue(CONTROLLER_CONFIG.elements.materialSelector),
      quality: this.getElementValue(CONTROLLER_CONFIG.elements.qualitySelector),
      serviceType: this.state.currentService
    };
  }

  autoFillMeasurements(measurementText) {
    // Parse AI-detected measurements and auto-fill form
    const widthMatch = measurementText.match(/(\d+\.?\d*)\s*["\']?\s*(?:w|wide|width)/i);
    const heightMatch = measurementText.match(/(\d+\.?\d*)\s*["\']?\s*(?:h|high|height|tall)/i);

    if (widthMatch) {
      this.setElementValue(CONTROLLER_CONFIG.elements.widthInput, widthMatch[1]);
    }

    if (heightMatch) {
      this.setElementValue(CONTROLLER_CONFIG.elements.heightInput, heightMatch[1]);
    }

    // Show auto-fill notification
    this.showMessage('Measurements auto-filled from AI analysis. Please verify and adjust if needed.', 'info');
  }

  // ============================================================================
  // QUOTE GENERATION AND MANAGEMENT
  // ============================================================================

  async handleGenerateQuote() {
    try {
      if (!this.validateQuoteRequirements()) {
        return;
      }

      this.showLoading('Generating your quote...');

      const quoteData = this.prepareQuoteData();
      const response = await this.apiClient.generateUnifiedQuote(quoteData);

      if (response.success) {
        this.handleQuoteSuccess(response.data);
      } else {
        throw new Error(response.error || 'Quote generation failed');
      }

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Quote generation failed: ${this.apiClient.getUserFriendlyErrorMessage(error)}`, 'error');
    }
  }

  prepareQuoteData() {
    const measurements = this.state.measurements;
    
    return {
      quoteItems: [{
        service: this.state.currentService,
        productName: `${CONTROLLER_CONFIG.services[this.state.currentService].name} Replacement`,
        quantity: measurements.quantity || 1,
        dimensions: {
          width: measurements.width,
          height: measurements.height
        },
        material: measurements.material,
        qualityLevel: measurements.quality,
        specifications: this.getSpecifications()
      }],
      customerInfo: this.state.customerInfo,
      customerPreferences: this.getCustomerPreferences(),
      includeLaborCosts: true,
      includeFinancing: true
    };
  }

  handleQuoteSuccess(quoteData) {
    this.hideLoading();
    
    // Store quote data
    this.state.currentQuote = quoteData;

    // Display quote
    this.displayQuote(quoteData);

    // Show quote actions
    this.showQuoteActions();

    this.showMessage('Quote generated successfully!', 'success');
    
    this.logAnalyticsEvent('quote_generated', {
      service: this.state.currentService,
      totalCost: quoteData.quote.summary.totalCost,
      itemCount: quoteData.quote.items.length
    });
  }

  displayQuote(quoteData) {
    const quoteContainer = document.querySelector(CONTROLLER_CONFIG.elements.quoteSummary);
    if (!quoteContainer) return;

    const { quote, explanation } = quoteData;

    quoteContainer.innerHTML = `
      <div class="quote-summary-card">
        <h3>📋 Your Quote Summary</h3>
        
        <div class="quote-items">
          ${quote.items.map(item => `
            <div class="quote-item">
              <h4>${item.productName}</h4>
              <div class="item-details">
                <span>Quantity: ${item.quantity}</span>
                <span>Material: ${item.material || 'Standard'}</span>
                <span>Quality: ${item.qualityLevel || 'Better'}</span>
              </div>
              <div class="item-cost">
                <span class="cost-label">Item Total:</span>
                <span class="cost-value">${this.apiClient.formatCurrency(item.totalItemCost)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="quote-breakdown">
          <div class="breakdown-row">
            <span>Materials:</span>
            <span>${this.apiClient.formatCurrency(quote.summary.subtotal - (quote.summary.laborCost || 0))}</span>
          </div>
          ${quote.summary.laborCost ? `
            <div class="breakdown-row">
              <span>Labor:</span>
              <span>${this.apiClient.formatCurrency(quote.summary.laborCost)}</span>
            </div>
          ` : ''}
          <div class="breakdown-row">
            <span>Subtotal:</span>
            <span>${this.apiClient.formatCurrency(quote.summary.subtotal)}</span>
          </div>
          ${quote.summary.savings > 0 ? `
            <div class="breakdown-row savings">
              <span>Savings:</span>
              <span>-${this.apiClient.formatCurrency(quote.summary.savings)}</span>
            </div>
          ` : ''}
          <div class="breakdown-row">
            <span>Tax:</span>
            <span>${this.apiClient.formatCurrency(quote.summary.taxAmount)}</span>
          </div>
          <div class="breakdown-row total">
            <span><strong>Total:</strong></span>
            <span><strong>${this.apiClient.formatCurrency(quote.summary.totalCost)}</strong></span>
          </div>
        </div>

        ${explanation ? `
          <div class="quote-explanation">
            <h4>💬 About Your Quote</h4>
            <div class="explanation-content">
              ${explanation.text ? `<p>${explanation.text}</p>` : ''}
              ${explanation.keyPoints && explanation.keyPoints.length > 0 ? `
                <ul>
                  ${explanation.keyPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${quote.financing ? `
          <div class="financing-options">
            <h4>💳 Financing Available</h4>
            <p>Flexible payment options starting at ${this.apiClient.formatCurrency(quote.financing.options[0].monthlyPayment)}/month</p>
          </div>
        ` : ''}
      </div>
    `;

    quoteContainer.scrollIntoView({ behavior: 'smooth' });
  }

  // ============================================================================
  // MULTI-SERVICE PROJECT SCOPE
  // ============================================================================

  async handleGenerateProjectScope() {
    try {
      if (this.state.selectedServices.length < 2) {
        this.showMessage('Please select at least 2 services for project scope generation', 'error');
        return;
      }

      this.showLoading('Generating comprehensive project scope...');

      const projectData = {
        projectComponents: this.state.selectedServices.map(service => ({
          type: service.type,
          scope: service.scope || 'full_replacement',
          priority: service.priority || 'medium',
          quantity: service.quantity || 1
        })),
        customerPreferences: this.getCustomerPreferences(),
        propertyConstraints: this.getPropertyConstraints()
      };

      const response = await this.apiClient.generateProjectScope(projectData);

      if (response.success) {
        this.handleProjectScopeSuccess(response.data);
      } else {
        throw new Error(response.error || 'Project scope generation failed');
      }

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Project scope generation failed: ${error.message}`, 'error');
    }
  }

  handleProjectScopeSuccess(scopeData) {
    this.hideLoading();
    
    // Store project scope
    this.state.projectScope = scopeData;

    // Display project scope
    this.displayProjectScope(scopeData);

    this.showMessage('Project scope generated successfully!', 'success');
  }

  // ============================================================================
  // CUSTOMER COMMUNICATION
  // ============================================================================

  async handleSendQuote() {
    try {
      if (!this.state.currentQuote) {
        this.showMessage('Please generate a quote first', 'error');
        return;
      }

      this.showLoading('Sending quote via email...');

      const emailData = {
        customerEmail: this.state.customerInfo.email,
        customerName: this.state.customerInfo.fullName,
        quoteData: this.state.currentQuote.quote,
        explanationText: this.state.currentQuote.explanation?.text
      };

      const response = await this.apiClient.sendQuoteEmail(emailData);

      if (response.success) {
        this.hideLoading();
        this.showMessage('Quote sent successfully! Check your email.', 'success');
      } else {
        throw new Error(response.error || 'Failed to send quote');
      }

    } catch (error) {
      this.hideLoading();
      this.showMessage(`Failed to send quote: ${error.message}`, 'error');
    }
  }

  async handleScheduleConsultation() {
    // This would typically open a scheduling widget or redirect to scheduling page
    window.open('https://goodfaithexteriors.com/schedule', '_blank');
    
    this.logAnalyticsEvent('consultation_scheduled', {
      service: this.state.currentService,
      hasQuote: !!this.state.currentQuote
    });
  }

  async handleContactUs() {
    // This would typically open contact form or start chat
    window.open('https://goodfaithexteriors.com/contact', '_blank');
    
    this.logAnalyticsEvent('contact_us_clicked', {
      service: this.state.currentService,
      source: 'quote_page'
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  showLoading(message = 'Loading...') {
    this.updateStatusIndicator(message, 'loading');
    this.setElementValue(CONTROLLER_CONFIG.elements.loadingMessage, message);
    this.showElement(CONTROLLER_CONFIG.elements.loadingMessage);
  }

  hideLoading() {
    this.hideElement(CONTROLLER_CONFIG.elements.loadingMessage);
    this.updateStatusIndicator('Ready', 'ready');
  }

  showMessage(message, type = 'info') {
    const messageElement = document.querySelector(
      type === 'error' ? CONTROLLER_CONFIG.elements.errorMessage :
      type === 'success' ? CONTROLLER_CONFIG.elements.successMessage :
      CONTROLLER_CONFIG.elements.loadingMessage
    );

    if (messageElement) {
      messageElement.textContent = message;
      messageElement.style.display = 'block';
      
      // Auto-hide after 5 seconds for non-error messages
      if (type !== 'error') {
        setTimeout(() => {
          messageElement.style.display = 'none';
        }, 5000);
      }
    }

    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  updateStatusIndicator(status, type = 'info') {
    const indicator = document.querySelector(CONTROLLER_CONFIG.elements.statusIndicator);
    if (indicator) {
      indicator.textContent = status;
      indicator.className = `status-indicator status-${type}`;
    }
  }

  // Element manipulation helpers
  getElementValue(selector) {
    const element = document.querySelector(selector);
    return element ? element.value : '';
  }

  setElementValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
      element.value = value;
    }
  }

  showElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = 'block';
    }
  }

  hideElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = 'none';
    }
  }

  // Validation helpers
  validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  validateCustomerInfoForAnalysis() {
    return this.state.customerInfo.email && 
           this.state.customerInfo.fullName && 
           this.state.customerInfo.phone;
  }

  validateMeasurements(measurements) {
    return measurements.width > 0 && 
           measurements.height > 0 && 
           measurements.quantity > 0;
  }

  validateQuoteRequirements() {
    if (!this.validateCustomerInfoForAnalysis()) {
      this.showMessage('Please complete customer information first', 'error');
      return false;
    }

    if (!this.state.measurements.width || !this.state.measurements.height) {
      this.showMessage('Please provide measurements first', 'error');
      return false;
    }

    return true;
  }

  // Data collection helpers
  getSelectedAnalysisType() {
    return this.getElementValue('#analysisTypeSelector') || CONTROLLER_CONFIG.defaults.analysisType;
  }

  getProjectNotes() {
    return this.getElementValue(CONTROLLER_CONFIG.elements.projectNotes);
  }

  getPropertyDetails() {
    return {
      address: this.getElementValue(CONTROLLER_CONFIG.elements.customerAddress),
      homeAge: this.getElementValue('#homeAge'),
      homeStyle: this.getElementValue('#homeStyle')
    };
  }

  getCustomerPreferences() {
    return {
      budgetRange: this.getElementValue('#budgetRange'),
      timeline: this.getElementValue('#timeline'),
      qualityPreference: this.getElementValue(CONTROLLER_CONFIG.elements.qualitySelector)
    };
  }

  getSpecifications() {
    return {
      energyEfficiency: this.getElementValue('#energyEfficiency'),
      colorPreference: this.getElementValue('#colorPreference'),
      specialRequirements: this.getElementValue('#specialRequirements')
    };
  }

  // Analytics and logging
  logAnalyticsEvent(event, properties = {}) {
    this.apiClient.logAnalyticsEvent(event, {
      ...properties,
      currentService: this.state.currentService,
      sessionId: this.state.sessionId,
      hasQuote: !!this.state.currentQuote,
      isMultiService: this.state.isMultiService
    });
  }

  // Formatting helpers
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getConfidenceClass(confidence) {
    if (confidence >= 90) return 'high';
    if (confidence >= 70) return 'medium';
    return 'low';
  }

  // Session management
  saveSessionState() {
    try {
      sessionStorage.setItem('gfe_session_state', JSON.stringify(this.state.getState()));
    } catch (e) {
      console.warn('Failed to save session state:', e);
    }
  }

  restoreSessionState() {
    try {
      const saved = sessionStorage.getItem('gfe_session_state');
      if (saved) {
        const state = JSON.parse(saved);
        Object.assign(this.state, state);
        this.updateUIFromState();
      }
    } catch (e) {
      console.warn('Failed to restore session state:', e);
    }
  }

  updateUIFromState() {
    // Restore form values and UI state from saved session
    if (this.state.customerInfo.fullName) {
      this.setElementValue(CONTROLLER_CONFIG.elements.customerName, this.state.customerInfo.fullName);
    }
    if (this.state.customerInfo.email) {
      this.setElementValue(CONTROLLER_CONFIG.elements.customerEmail, this.state.customerInfo.email);
    }
    if (this.state.customerInfo.phone) {
      this.setElementValue(CONTROLLER_CONFIG.elements.customerPhone, this.state.customerInfo.phone);
    }
  }

  // System health check
  async checkSystemHealth() {
    try {
      const health = await this.apiClient.checkSystemHealth();
      if (health.success && health.data.overall === 'healthy') {
        this.updateStatusIndicator('System Online', 'healthy');
      } else {
        this.updateStatusIndicator('System Issues Detected', 'warning');
      }
    } catch (error) {
      this.updateStatusIndicator('System Offline', 'error');
    }
  }
}

// ============================================================================
// INITIALIZE AND EXPORT
// ============================================================================

// Create controller instance
const unifiedPageController = new UnifiedGFEPageController();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unifiedPageController.initialize();
  });
} else {
  unifiedPageController.initialize();
}

// Export for external use
export { unifiedPageController as default, UnifiedGFEPageController, CONTROLLER_CONFIG };