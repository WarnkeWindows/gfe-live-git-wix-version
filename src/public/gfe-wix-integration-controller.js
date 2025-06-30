/**
 * =====================================================================
 * GFE WIX HEADLESS OAUTH API INTEGRATION CONTROLLER
 * Handles all Wix HeadlessOAuth API tasks and event listeners
 * =====================================================================
 */

class GFEWixIntegrationController {
    constructor() {
        // Wix HeadlessOAuth API Configuration
        this.wixConfig = {
            clientId: 'f7efaf9a-0f01-4f8a-a1fa-7b1b3631e3f4', // GFE Headless ID
            apiKey: 'guOs2CyAJlBdSPP7q6HOdq2cG5vwD5Rq',
            baseUrl: 'https://www.wixapis.com',
            siteId: '10d52dd8-ec9b-4453-adbc-6293b99', // GFE_ID_WIX_API
            accountId: 'f7efaf9a-0f01-4f8a-a1fa-7b1b3631e3f4'
        };

        // Trusted Origins for Security
        this.trustedOrigins = [
            'https://goodfaithexteriors.com',
            'https://www.goodfaithexteriors.com',
            'https://gfe-ai-advisor.netlify.app',
            'https://gfe-staging.wixsite.com',
            'https://editor.wix.com',
            'https://preview.wix.com',
            'https://w5hni7cogw3e.manus.space' // Backend URL
        ];

        // Message Types for Communication
        this.messageTypes = {
            // Connection and Ready States
            GFE_CONNECTION_REQUEST: 'GFE_CONNECTION_REQUEST',
            GFE_CONNECTION_ESTABLISHED: 'GFE_CONNECTION_ESTABLISHED',
            GFE_COMPONENT_READY: 'GFE_COMPONENT_READY',
            
            // Data Operations
            GFE_SAVE_LEAD: 'GFE_SAVE_LEAD',
            GFE_SAVE_ESTIMATE: 'GFE_SAVE_ESTIMATE',
            GFE_SAVE_MEASUREMENT: 'GFE_SAVE_MEASUREMENT',
            GFE_GET_PRODUCTS: 'GFE_GET_PRODUCTS',
            
            // Navigation
            GFE_NAVIGATE_TO_ESTIMATOR: 'GFE_NAVIGATE_TO_ESTIMATOR',
            GFE_NAVIGATE_TO_MEASUREMENT: 'GFE_NAVIGATE_TO_MEASUREMENT',
            GFE_NAVIGATE_TO_HOME: 'GFE_NAVIGATE_TO_HOME',
            
            // AI Operations
            GFE_AI_ANALYSIS_REQUEST: 'GFE_AI_ANALYSIS_REQUEST',
            GFE_AI_ANALYSIS_COMPLETE: 'GFE_AI_ANALYSIS_COMPLETE',
            
            // Quote Operations
            GFE_QUOTE_REQUESTED: 'GFE_QUOTE_REQUESTED',
            GFE_QUOTE_GENERATED: 'GFE_QUOTE_GENERATED',
            
            // Error Handling
            GFE_ERROR: 'GFE_ERROR',
            GFE_WARNING: 'GFE_WARNING'
        };

        // UI Element IDs (consistent with FLF)
        this.uiElementIds = {
            // Lead Capture Form
            customerName: '#customerName',
            customerEmail: '#customerEmail',
            customerPhone: '#customerPhone',
            customerAddress: '#customerAddress',
            projectType: '#projectType',
            projectNotes: '#projectNotes',
            
            // Window Measurement
            uploadButton: '#uploadButton',
            widthInput: '#widthInput',
            heightInput: '#heightInput',
            windowType: '#windowType',
            
            // Estimate Results
            estimateResults: '#estimateResults',
            totalPrice: '#totalPrice',
            basePrice: '#basePrice',
            
            // Action Buttons
            calculateButton: '#calculateButton',
            saveButton: '#saveButton',
            quoteButton: '#quoteButton'
        };

        // Collection Field Mappings (FLF)
        this.collectionMappings = {
            CRMLeads: {
                collectionId: 'CRMLeads',
                fields: {
                    fullName: { fieldId: 'fullName', required: true },
                    email: { fieldId: 'email', required: true },
                    phone: { fieldId: 'phone', required: true },
                    projectType: { fieldId: 'projectType', required: true },
                    customerAddress: { fieldId: 'customerAddress', required: false },
                    notes: { fieldId: 'notes', required: false },
                    source: { fieldId: 'source', required: false, defaultValue: 'Website' },
                    status: { fieldId: 'status', required: false, defaultValue: 'New' },
                    leadScore: { fieldId: 'leadScore', required: false, defaultValue: 50 },
                    priority: { fieldId: 'priority', required: false, defaultValue: 3 }
                }
            },
            WindowProducts: {
                collectionId: 'WindowProducts',
                fields: {
                    productId: { fieldId: 'productId', required: true },
                    brand: { fieldId: 'brand', required: true },
                    series: { fieldId: 'series', required: true },
                    windowType: { fieldId: 'windowType', required: true },
                    basePrice: { fieldId: 'basePrice', required: true },
                    description: { fieldId: 'description', required: false }
                }
            },
            AIWindowMeasureService: {
                collectionId: 'AIWindowMeasureService',
                fields: {
                    sessionName: { fieldId: 'sessionName', required: true },
                    userEmail: { fieldId: 'userEmail', required: true },
                    windowImage: { fieldId: 'windowImage', required: true },
                    measuredWidth: { fieldId: 'measuredWidth', required: false },
                    measuredHeight: { fieldId: 'measuredHeight', required: false },
                    confidence: { fieldId: 'confidence', required: false },
                    detectedType: { fieldId: 'detectedType', required: false }
                }
            }
        };

        // OAuth Token Storage
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;

        this.init();
    }

    async init() {
        console.log('🔗 Initializing GFE Wix Integration Controller...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize OAuth if needed
        await this.initializeOAuth();
        
        // Set up periodic token refresh
        this.setupTokenRefresh();
        
        console.log('✅ GFE Wix Integration Controller initialized successfully');
    }

    setupEventListeners() {
        // Listen for messages from iframes and parent
        window.addEventListener('message', (event) => this.handleMessage(event));
        
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Listen for beforeunload to save state
        window.addEventListener('beforeunload', () => this.saveState());
    }

    async handleMessage(event) {
        // Validate origin for security
        if (!this.isValidOrigin(event.origin)) {
            console.warn('🚫 Invalid origin:', event.origin);
            return;
        }

        const { type, source, data } = event.data;
        
        try {
            switch (type) {
                case this.messageTypes.GFE_CONNECTION_REQUEST:
                    await this.handleConnectionRequest(event, data);
                    break;
                    
                case this.messageTypes.GFE_COMPONENT_READY:
                    await this.handleComponentReady(event, data);
                    break;
                    
                case this.messageTypes.GFE_SAVE_LEAD:
                    await this.handleSaveLead(event, data);
                    break;
                    
                case this.messageTypes.GFE_SAVE_ESTIMATE:
                    await this.handleSaveEstimate(event, data);
                    break;
                    
                case this.messageTypes.GFE_SAVE_MEASUREMENT:
                    await this.handleSaveMeasurement(event, data);
                    break;
                    
                case this.messageTypes.GFE_GET_PRODUCTS:
                    await this.handleGetProducts(event, data);
                    break;
                    
                case this.messageTypes.GFE_NAVIGATE_TO_ESTIMATOR:
                    await this.handleNavigateToEstimator(event, data);
                    break;
                    
                case this.messageTypes.GFE_NAVIGATE_TO_MEASUREMENT:
                    await this.handleNavigateToMeasurement(event, data);
                    break;
                    
                case this.messageTypes.GFE_AI_ANALYSIS_REQUEST:
                    await this.handleAIAnalysisRequest(event, data);
                    break;
                    
                case this.messageTypes.GFE_QUOTE_REQUESTED:
                    await this.handleQuoteRequest(event, data);
                    break;
                    
                default:
                    console.log('📨 Unhandled message type:', type, 'from:', source);
            }
        } catch (error) {
            console.error('❌ Error handling message:', error);
            this.sendErrorMessage(event.source, error.message);
        }
    }

    async handleConnectionRequest(event, data) {
        console.log('🔗 Connection request from:', data.source);
        
        // Send connection established response
        this.sendMessage(event.source, {
            type: this.messageTypes.GFE_CONNECTION_ESTABLISHED,
            source: 'gfe-wix-controller',
            data: {
                status: 'connected',
                timestamp: new Date().toISOString(),
                capabilities: ['oauth', 'data-operations', 'navigation', 'ai-services']
            }
        });
    }

    async handleComponentReady(event, data) {
        console.log('✅ Component ready:', data.component);
        
        // Send initial configuration to component
        this.sendMessage(event.source, {
            type: 'GFE_CONFIGURATION',
            source: 'gfe-wix-controller',
            data: {
                wixSiteId: this.wixConfig.siteId,
                trustedOrigins: this.trustedOrigins,
                uiElementIds: this.uiElementIds
            }
        });
    }

    async handleSaveLead(event, data) {
        console.log('💾 Saving lead:', data);
        
        try {
            // Validate lead data
            const validatedData = this.validateData(data, this.collectionMappings.CRMLeads);
            
            // Calculate lead score
            validatedData.leadScore = this.calculateLeadScore(validatedData);
            
            // Save to Wix collection
            const result = await this.saveToWixCollection('CRMLeads', validatedData);
            
            // Send success response
            this.sendMessage(event.source, {
                type: 'GFE_LEAD_SAVED',
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    leadId: result._id,
                    leadScore: validatedData.leadScore
                }
            });
            
        } catch (error) {
            console.error('❌ Error saving lead:', error);
            this.sendErrorMessage(event.source, 'Failed to save lead: ' + error.message);
        }
    }

    async handleSaveEstimate(event, data) {
        console.log('💰 Saving estimate:', data);
        
        try {
            // Save estimate data
            const result = await this.saveToWixCollection('Estimates', data);
            
            // Send success response
            this.sendMessage(event.source, {
                type: 'GFE_ESTIMATE_SAVED',
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    estimateId: result._id
                }
            });
            
        } catch (error) {
            console.error('❌ Error saving estimate:', error);
            this.sendErrorMessage(event.source, 'Failed to save estimate: ' + error.message);
        }
    }

    async handleSaveMeasurement(event, data) {
        console.log('📐 Saving measurement:', data);
        
        try {
            // Validate measurement data
            const validatedData = this.validateData(data, this.collectionMappings.AIWindowMeasureService);
            
            // Save to Wix collection
            const result = await this.saveToWixCollection('AIWindowMeasureService', validatedData);
            
            // Send success response
            this.sendMessage(event.source, {
                type: 'GFE_MEASUREMENT_SAVED',
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    measurementId: result._id
                }
            });
            
        } catch (error) {
            console.error('❌ Error saving measurement:', error);
            this.sendErrorMessage(event.source, 'Failed to save measurement: ' + error.message);
        }
    }

    async handleGetProducts(event, data) {
        console.log('🪟 Getting products:', data);
        
        try {
            // Get products from Wix collection
            const products = await this.getFromWixCollection('WindowProducts', data.filters);
            
            // Send products response
            this.sendMessage(event.source, {
                type: 'GFE_PRODUCTS_RETRIEVED',
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    products: products,
                    count: products.length
                }
            });
            
        } catch (error) {
            console.error('❌ Error getting products:', error);
            this.sendErrorMessage(event.source, 'Failed to get products: ' + error.message);
        }
    }

    async handleNavigateToEstimator(event, data) {
        console.log('🧭 Navigate to estimator:', data);
        
        // Store navigation data for prefill
        sessionStorage.setItem('gfe_estimator_prefill', JSON.stringify(data));
        
        // Send navigation response
        this.sendMessage(event.source, {
            type: 'GFE_NAVIGATION_CONFIRMED',
            source: 'gfe-wix-controller',
            data: {
                destination: 'estimator',
                prefillData: data
            }
        });
    }

    async handleNavigateToMeasurement(event, data) {
        console.log('📐 Navigate to measurement:', data);
        
        // Store navigation data for prefill
        sessionStorage.setItem('gfe_measurement_prefill', JSON.stringify(data));
        
        // Send navigation response
        this.sendMessage(event.source, {
            type: 'GFE_NAVIGATION_CONFIRMED',
            source: 'gfe-wix-controller',
            data: {
                destination: 'measurement',
                prefillData: data
            }
        });
    }

    async handleAIAnalysisRequest(event, data) {
        console.log('🤖 AI analysis request:', data);
        
        try {
            // Call AI analysis service
            const analysisResult = await this.callAIAnalysisService(data);
            
            // Send analysis complete response
            this.sendMessage(event.source, {
                type: this.messageTypes.GFE_AI_ANALYSIS_COMPLETE,
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    analysis: analysisResult
                }
            });
            
        } catch (error) {
            console.error('❌ Error in AI analysis:', error);
            this.sendErrorMessage(event.source, 'AI analysis failed: ' + error.message);
        }
    }

    async handleQuoteRequest(event, data) {
        console.log('📄 Quote request:', data);
        
        try {
            // Generate quote
            const quote = await this.generateQuote(data);
            
            // Send quote generated response
            this.sendMessage(event.source, {
                type: this.messageTypes.GFE_QUOTE_GENERATED,
                source: 'gfe-wix-controller',
                data: {
                    success: true,
                    quote: quote
                }
            });
            
        } catch (error) {
            console.error('❌ Error generating quote:', error);
            this.sendErrorMessage(event.source, 'Quote generation failed: ' + error.message);
        }
    }

    // Wix API Methods
    async initializeOAuth() {
        try {
            // Check for stored tokens
            const storedToken = localStorage.getItem('gfe_wix_access_token');
            const storedExpiry = localStorage.getItem('gfe_wix_token_expiry');
            
            if (storedToken && storedExpiry && new Date(storedExpiry) > new Date()) {
                this.accessToken = storedToken;
                this.tokenExpiry = new Date(storedExpiry);
                console.log('✅ Using stored OAuth token');
                return;
            }
            
            // Initialize new OAuth flow if needed
            await this.requestNewAccessToken();
            
        } catch (error) {
            console.error('❌ OAuth initialization failed:', error);
        }
    }

    async requestNewAccessToken() {
        try {
            const response = await fetch(`${this.wixConfig.baseUrl}/oauth/access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'client_credentials',
                    client_id: this.wixConfig.clientId,
                    client_secret: this.wixConfig.apiKey
                })
            });
            
            if (response.ok) {
                const tokenData = await response.json();
                this.accessToken = tokenData.access_token;
                this.refreshToken = tokenData.refresh_token;
                this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000));
                
                // Store tokens
                localStorage.setItem('gfe_wix_access_token', this.accessToken);
                localStorage.setItem('gfe_wix_token_expiry', this.tokenExpiry.toISOString());
                
                console.log('✅ New OAuth token obtained');
            } else {
                throw new Error('Failed to obtain access token');
            }
            
        } catch (error) {
            console.error('❌ Error requesting access token:', error);
            throw error;
        }
    }

    async saveToWixCollection(collectionId, data) {
        await this.ensureValidToken();
        
        const response = await fetch(`${this.wixConfig.baseUrl}/wix-data/v1/items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'wix-site-id': this.wixConfig.siteId
            },
            body: JSON.stringify({
                dataCollectionId: collectionId,
                dataItem: data
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save to collection ${collectionId}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async getFromWixCollection(collectionId, filters = {}) {
        await this.ensureValidToken();
        
        const queryParams = new URLSearchParams();
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.skip) queryParams.append('skip', filters.skip);
        
        const response = await fetch(`${this.wixConfig.baseUrl}/wix-data/v1/items?dataCollectionId=${collectionId}&${queryParams}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'wix-site-id': this.wixConfig.siteId
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get from collection ${collectionId}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.dataItems || [];
    }

    async ensureValidToken() {
        if (!this.accessToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
            await this.requestNewAccessToken();
        }
    }

    setupTokenRefresh() {
        // Refresh token 5 minutes before expiry
        setInterval(() => {
            if (this.tokenExpiry && new Date() >= new Date(this.tokenExpiry.getTime() - 5 * 60 * 1000)) {
                this.requestNewAccessToken().catch(error => {
                    console.error('❌ Token refresh failed:', error);
                });
            }
        }, 60000); // Check every minute
    }

    // Utility Methods
    validateData(data, mapping) {
        const validatedData = {};
        
        for (const [key, config] of Object.entries(mapping.fields)) {
            const value = data[key];
            
            if (config.required && (!value || value === '')) {
                throw new Error(`Required field ${key} is missing`);
            }
            
            if (value !== undefined && value !== null && value !== '') {
                validatedData[config.fieldId] = value;
            } else if (config.defaultValue !== undefined) {
                validatedData[config.fieldId] = config.defaultValue;
            }
        }
        
        return validatedData;
    }

    calculateLeadScore(data) {
        let score = 50; // Base score
        
        if (data.email) score += 20;
        if (data.phone) score += 20;
        if (data.projectType) score += 10;
        if (data.customerAddress) score += 5;
        if (data.notes && data.notes.length > 10) score += 5;
        
        return Math.min(score, 100);
    }

    async callAIAnalysisService(data) {
        // Mock AI analysis - in real implementation, call actual AI service
        return {
            analysisId: 'ai-' + Date.now(),
            confidence: 85,
            results: {
                windowType: 'Double-Hung',
                dimensions: { width: 36, height: 48 },
                condition: 'Good',
                recommendations: 'Suitable for replacement'
            },
            timestamp: new Date().toISOString()
        };
    }

    async generateQuote(data) {
        // Mock quote generation - in real implementation, call quote service
        return {
            quoteId: 'quote-' + Date.now(),
            totalPrice: data.totalPrice || 0,
            items: data.items || [],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            timestamp: new Date().toISOString()
        };
    }

    sendMessage(target, message) {
        if (target && target.postMessage) {
            target.postMessage(message, '*');
        } else {
            // Broadcast to all trusted origins
            this.trustedOrigins.forEach(origin => {
                try {
                    window.parent.postMessage(message, origin);
                } catch (error) {
                    // Ignore errors for invalid targets
                }
            });
        }
    }

    sendErrorMessage(target, errorMessage) {
        this.sendMessage(target, {
            type: this.messageTypes.GFE_ERROR,
            source: 'gfe-wix-controller',
            data: {
                error: errorMessage,
                timestamp: new Date().toISOString()
            }
        });
    }

    isValidOrigin(origin) {
        return this.trustedOrigins.includes(origin) || 
               origin.includes('wix.com') || 
               origin.includes('localhost') ||
               origin.includes('127.0.0.1') ||
               origin.includes('manus.space');
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.saveState();
        } else {
            this.restoreState();
        }
    }

    saveState() {
        const state = {
            accessToken: this.accessToken,
            tokenExpiry: this.tokenExpiry?.toISOString(),
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('gfe_wix_state', JSON.stringify(state));
    }

    restoreState() {
        try {
            const savedState = sessionStorage.getItem('gfe_wix_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state.accessToken && state.tokenExpiry) {
                    this.accessToken = state.accessToken;
                    this.tokenExpiry = new Date(state.tokenExpiry);
                }
            }
        } catch (error) {
            console.error('❌ Error restoring state:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GFEWixIntegrationController;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
    window.GFEWixIntegrationController = GFEWixIntegrationController;
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.gfeWixController = new GFEWixIntegrationController();
        });
    } else {
        window.gfeWixController = new GFEWixIntegrationController();
    }
}

