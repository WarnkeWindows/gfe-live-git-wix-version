// unified-gfe-api-client.js
// Good Faith Exteriors - Unified Frontend API Client for All Home Remodeling Services
// Handles all API communication between frontend and Wix backend for Windows, Roofing, Siding, Doors, Gutters, and Storm Damage

// ============================================================================
// API CLIENT CONFIGURATION
// ============================================================================

const API_CONFIG = {
  // Base API endpoints
  baseEndpoint: '/_functions',
  
  // Request timeouts (in milliseconds)
  timeouts: {
    default: 30000,    // 30 seconds
    analysis: 60000,   // 60 seconds for AI analysis
    upload: 120000     // 2 minutes for file uploads
  },
  
  // Retry configuration
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  },
  
  // Supported services
  services: [
    'windows', 'doors', 'roofing', 'siding', 'gutters', 'storm_damage'
  ]
};

// ============================================================================
// UNIFIED API CLIENT CLASS
// ============================================================================

class UnifiedGFEApiClient {
  constructor() {
    this.requestQueue = [];
    this.isOnline = navigator.onLine;
    this.requestCounter = 0;
    
    // Set up online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueuedRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // ============================================================================
  // CORE REQUEST METHODS
  // ============================================================================

  async makeRequest(endpoint, options = {}) {
    const requestId = this.generateRequestId();
    
    try {
      // Check if online for immediate requests
      if (!this.isOnline && !options.allowOffline) {
        throw new Error('No internet connection available');
      }

      const requestOptions = this.buildRequestOptions(options, requestId);
      const response = await this.executeRequest(endpoint, requestOptions);
      
      return this.handleResponse(response, requestId);

    } catch (error) {
      return this.handleRequestError(error, endpoint, options, requestId);
    }
  }

  buildRequestOptions(options, requestId) {
    const defaults = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Client-Version': '1.0.0'
      },
      timeout: options.timeout || API_CONFIG.timeouts.default
    };

    // Merge with provided options
    const requestOptions = { ...defaults, ...options };
    
    // Handle body serialization
    if (requestOptions.body && typeof requestOptions.body === 'object') {
      requestOptions.body = JSON.stringify(requestOptions.body);
    }

    return requestOptions;
  }

  async executeRequest(endpoint, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = await fetch(`${API_CONFIG.baseEndpoint}${endpoint}`, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async handleResponse(response, requestId) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log successful requests for analytics
    this.logApiCall(requestId, 'success', response.status);
    
    return data;
  }

  async handleRequestError(error, endpoint, options, requestId) {
    this.logApiCall(requestId, 'error', null, error.message);

    // Implement retry logic for retryable errors
    if (this.isRetryableError(error) && options.retryCount < API_CONFIG.retryConfig.maxRetries) {
      const delay = this.calculateRetryDelay(options.retryCount || 0);
      
      await this.delay(delay);
      
      return this.makeRequest(endpoint, {
        ...options,
        retryCount: (options.retryCount || 0) + 1
      });
    }

    // Queue request for offline scenarios
    if (!this.isOnline && options.queueWhenOffline) {
      this.queueRequest(endpoint, options);
      return { success: false, queued: true, error: 'Request queued for when online' };
    }

    return { success: false, error: error.message };
  }

  // ============================================================================
  // EXTERIOR COMPONENT ANALYSIS API
  // ============================================================================

  async analyzeExteriorComponent(analysisData) {
    try {
      const response = await this.makeRequest('/analyzeExteriorComponent', {
        method: 'POST',
        body: analysisData,
        timeout: API_CONFIG.timeouts.analysis
      });

      if (response.success) {
        this.logAnalyticsEvent('exterior_analysis_completed', {
          componentType: analysisData.componentType,
          confidence: response.data.confidence,
          success: true
        });
      }

      return response;

    } catch (error) {
      this.logAnalyticsEvent('exterior_analysis_failed', {
        componentType: analysisData.componentType,
        error: error.message
      });
      
      throw error;
    }
  }

  async validateMeasurements(measurementData) {
    return this.makeRequest('/validateMeasurements', {
      method: 'POST',
      body: measurementData
    });
  }

  // ============================================================================
  // PROJECT SCOPE AND PLANNING API
  // ============================================================================

  async generateProjectScope(projectData) {
    try {
      const response = await this.makeRequest('/generateProjectScope', {
        method: 'POST',
        body: projectData,
        timeout: API_CONFIG.timeouts.analysis
      });

      if (response.success) {
        this.logAnalyticsEvent('project_scope_generated', {
          services: projectData.projectComponents.map(c => c.type).join(','),
          totalComponents: projectData.projectComponents.length,
          success: true
        });
      }

      return response;

    } catch (error) {
      this.logAnalyticsEvent('project_scope_failed', {
        error: error.message
      });
      
      throw error;
    }
  }

  async calculateEnergyEfficiency(efficiencyData) {
    return this.makeRequest('/calculateEnergyEfficiency', {
      method: 'POST',
      body: efficiencyData,
      timeout: API_CONFIG.timeouts.analysis
    });
  }

  // ============================================================================
  // UNIFIED QUOTE GENERATION API
  // ============================================================================

  async generateUnifiedQuote(quoteData) {
    try {
      const response = await this.makeRequest('/generateUnifiedQuote', {
        method: 'POST',
        body: quoteData,
        timeout: API_CONFIG.timeouts.analysis
      });

      if (response.success) {
        this.logAnalyticsEvent('unified_quote_generated', {
          services: quoteData.quoteItems.map(item => item.service).join(','),
          totalCost: response.data.quote.summary.totalCost,
          itemCount: quoteData.quoteItems.length,
          success: true
        });
      }

      return response;

    } catch (error) {
      this.logAnalyticsEvent('unified_quote_failed', {
        error: error.message
      });
      
      throw error;
    }
  }

  async calculatePricing(pricingData) {
    return this.makeRequest('/calculatePricing', {
      method: 'POST',
      body: pricingData
    });
  }

  // ============================================================================
  // CUSTOMER COMMUNICATION API
  // ============================================================================

  async generateCustomerCommunication(communicationData) {
    return this.makeRequest('/generateCustomerCommunication', {
      method: 'POST',
      body: communicationData
    });
  }

  async sendQuoteEmail(emailData) {
    return this.makeRequest('/sendQuoteEmail', {
      method: 'POST',
      body: emailData
    });
  }

  async sendAnalysisEmail(emailData) {
    return this.makeRequest('/sendAnalysisEmail', {
      method: 'POST',
      body: emailData
    });
  }

  // ============================================================================
  // STORM DAMAGE ASSESSMENT API
  // ============================================================================

  async assessStormDamage(damageData) {
    try {
      const response = await this.makeRequest('/assessStormDamage', {
        method: 'POST',
        body: damageData,
        timeout: API_CONFIG.timeouts.analysis
      });

      if (response.success) {
        this.logAnalyticsEvent('storm_damage_assessed', {
          stormType: damageData.stormDetails.stormType,
          componentCount: damageData.damageImages.length,
          severity: response.data.stormDamageAssessment.overallSeverity,
          success: true
        });
      }

      return response;

    } catch (error) {
      this.logAnalyticsEvent('storm_damage_assessment_failed', {
        error: error.message
      });
      
      throw error;
    }
  }

  // ============================================================================
  // CUSTOMER MANAGEMENT API
  // ============================================================================

  async createOrUpdateCustomer(customerData) {
    return this.makeRequest('/customer', {
      method: 'POST',
      body: customerData
    });
  }

  async getCustomer(email) {
    return this.makeRequest('/customer', {
      method: 'GET',
      body: { email: email }
    });
  }

  // ============================================================================
  // PRODUCT CATALOG API
  // ============================================================================

  async getProducts(filters = {}) {
    return this.makeRequest('/products', {
      method: 'GET',
      body: filters
    });
  }

  async getProductsByCategory(category, filters = {}) {
    return this.makeRequest(`/products/${category}`, {
      method: 'GET',
      body: filters
    });
  }

  async getProduct(productId) {
    return this.makeRequest(`/product/${productId}`, {
      method: 'GET'
    });
  }

  // ============================================================================
  // SYSTEM HEALTH AND MONITORING API
  // ============================================================================

  async checkSystemHealth() {
    return this.makeRequest('/systemHealth', {
      method: 'GET',
      timeout: 10000 // 10 seconds
    });
  }

  // ============================================================================
  // IMAGE UPLOAD AND PROCESSING
  // ============================================================================

  async uploadImage(imageFile, options = {}) {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const uploadData = {
        imageData: base64Image,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        mimeType: imageFile.type,
        ...options
      };

      const response = await this.makeRequest('/uploadImage', {
        method: 'POST',
        body: uploadData,
        timeout: API_CONFIG.timeouts.upload
      });

      this.logAnalyticsEvent('image_uploaded', {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        success: response.success
      });

      return response;

    } catch (error) {
      this.logAnalyticsEvent('image_upload_failed', {
        fileName: imageFile.name,
        error: error.message
      });
      
      throw error;
    }
  }

  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  generateRequestId() {
    return `req_${Date.now()}_${++this.requestCounter}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  isRetryableError(error) {
    const retryableErrors = [
      'Request timeout',
      'Network error',
      'Service temporarily unavailable'
    ];
    
    return retryableErrors.some(retryableError => 
      error.message.toLowerCase().includes(retryableError.toLowerCase())
    );
  }

  calculateRetryDelay(retryCount) {
    const baseDelay = API_CONFIG.retryConfig.baseDelay;
    const maxDelay = API_CONFIG.retryConfig.maxDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount);
    
    return Math.min(exponentialDelay, maxDelay);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  queueRequest(endpoint, options) {
    this.requestQueue.push({
      endpoint,
      options,
      timestamp: new Date()
    });
  }

  async processQueuedRequests() {
    if (this.requestQueue.length === 0) return;

    console.log(`Processing ${this.requestQueue.length} queued requests...`);

    const requests = [...this.requestQueue];
    this.requestQueue = [];

    for (const request of requests) {
      try {
        await this.makeRequest(request.endpoint, {
          ...request.options,
          retryCount: 0
        });
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  // ============================================================================
  // ANALYTICS AND LOGGING
  // ============================================================================

  logApiCall(requestId, status, httpStatus = null, error = null) {
    const logData = {
      requestId,
      status,
      httpStatus,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (error) {
      logData.error = error;
    }

    // Store in session storage for debugging
    try {
      const logs = JSON.parse(sessionStorage.getItem('gfe_api_logs') || '[]');
      logs.push(logData);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      sessionStorage.setItem('gfe_api_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  logAnalyticsEvent(event, properties = {}) {
    // This would typically send to your analytics service
    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    // Store locally for now
    try {
      const events = JSON.parse(sessionStorage.getItem('gfe_analytics_events') || '[]');
      events.push(eventData);
      
      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      sessionStorage.setItem('gfe_analytics_events', JSON.stringify(events));
    } catch (e) {
      // Ignore storage errors
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('gfe_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('gfe_session_id', sessionId);
    }
    return sessionId;
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  validateCustomerInfo(customerInfo) {
    const errors = [];
    
    if (!customerInfo.fullName || customerInfo.fullName.trim().length < 2) {
      errors.push('Full name is required (minimum 2 characters)');
    }
    
    if (!customerInfo.email || !this.isValidEmail(customerInfo.email)) {
      errors.push('Valid email address is required');
    }
    
    if (!customerInfo.phone || !this.isValidPhone(customerInfo.phone)) {
      errors.push('Valid phone number is required');
    }
    
    if (!customerInfo.projectType || !API_CONFIG.services.includes(customerInfo.projectType)) {
      errors.push('Valid project type is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateComponentData(componentData) {
    const errors = [];
    
    if (!componentData.type || !API_CONFIG.services.includes(componentData.type)) {
      errors.push('Valid component type is required');
    }
    
    if (!componentData.scope || !['repair', 'partial_replacement', 'full_replacement'].includes(componentData.scope)) {
      errors.push('Valid scope is required (repair, partial_replacement, or full_replacement)');
    }
    
    if (componentData.quantity && (componentData.quantity < 1 || componentData.quantity > 1000)) {
      errors.push('Quantity must be between 1 and 1000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  // ============================================================================
  // FORMATTING HELPERS
  // ============================================================================

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  formatDimensions(width, height, unit = 'inches') {
    if (!width || !height) return '';
    return `${width}" × ${height}"`;
  }

  formatArea(area, unit = 'sq ft') {
    if (!area) return '';
    return `${area.toFixed(1)} ${unit}`;
  }

  // ============================================================================
  // ERROR HANDLING AND USER FEEDBACK
  // ============================================================================

  getErrorMessage(error) {
    const errorMessages = {
      'Request timeout': 'The request took too long to complete. Please try again.',
      'Network error': 'Unable to connect to our servers. Please check your internet connection.',
      'Service temporarily unavailable': 'Our service is temporarily unavailable. Please try again in a few minutes.',
      'No internet connection available': 'You appear to be offline. Please check your internet connection.',
      'Invalid request': 'There was a problem with your request. Please check your information and try again.',
      'Authentication failed': 'Authentication failed. Please refresh the page and try again.',
      'Rate limit exceeded': 'Too many requests. Please wait a moment before trying again.'
    };

    return errorMessages[error.message] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  getUserFriendlyErrorMessage(error) {
    return this.getErrorMessage(error);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

// Create and export singleton instance
const unifiedApiClient = new UnifiedGFEApiClient();

// Export the instance and class
export { unifiedApiClient as default, UnifiedGFEApiClient, API_CONFIG };