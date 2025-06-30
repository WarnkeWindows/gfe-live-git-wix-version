// Filename: public/js/gfe-page-controller.js (or linked directly as a page's code file in Velo)
// This file orchestrates frontend logic and interacts with the GFEFrontendApiClient for backend communication.

import { gfeApi, UI_ELEMENT_IDS, fileToBase64, validateFrontendInput, getCustomerInfoFromForm, getWindowDataFromForm } from 'public/js/gfe-api-client.js'; // Imports client for backend communication and utilities
import wixWindow from 'wix-window'; // For client-side window interactions
import wixLocation from 'wix-location'; // For URL manipulation and origin validation

// Define PAGE_CONFIG to map UI elements and iframe IDs for $w() selectors.
const PAGE_CONFIG = {
    // Iframe element IDs for communication
    WINDOW_PRODUCTS_IFRAME: '#windowProductsIframe',
    AI_ESTIMATOR_IFRAME: '#aiEstimatorIframe',

    // UI element IDs for general page interaction and feedback
    CONNECTION_STATUS: '#connectionStatus', // For displaying connection status to iframes
    LOADING_OVERLAY: '#loadingOverlay',     // Overlay for displaying loading messages
    ERROR_MESSAGE: '#errorMessage',         // Message display for errors
    SUCCESS_MESSAGE: '#successMessage',     // Message display for success notifications
    
    // Button element IDs
    ADD_WINDOW_BTN: '#addWindowBtn', // Button to add a window to the quote
    CALCULATE_BTN: '#calculatePrice', // Button to calculate price
    AI_ANALYZE_BTN: '#analyzeImage', // Button to trigger AI image analysis
    APPLY_AI_RESULTS: '#applyAIResults', // Button to apply AI recommendations
    SAVE_QUOTE_BTN: '#saveQuoteBtn', // Button to save the quote
    EMAIL_QUOTE_BTN: '#emailQuoteBtn', // Button to email the quote
    SCHEDULE_CONSULTATION_BTN: '#scheduleConsultationButton', // Button to schedule a consultation

    // Input element IDs for customer and project details
    CUSTOMER_NAME: '#customerName',
    CUSTOMER_EMAIL: '#customerEmail',
    CUSTOMER_PHONE: '#customerPhone',
    PROJECT_ADDRESS: '#projectAddress',
    PROJECT_NOTES: '#projectNotes', // Added for comprehensive customer context

    // Display element IDs for quote summary and results
    QUOTE_TOTAL: '#quoteTotal', // Displays the total quote amount
    WINDOW_COUNT: '#windowCount', // Displays the number of windows added
    ESTIMATE_SUMMARY: '#estimateSummary', // Summary text (e.g., "0 windows - Total: $0.00")
    WINDOWS_LIST_DISPLAY: '#yourWindowsList', // Repeater or text element to list added windows
    QUOTE_EXPLANATION_DISPLAY: '#quoteExplanation', // Displays generated quote explanation
};

// Global state management class to hold and persist application data.
class GFEPageControllerState {
    constructor() {
        this.currentQuote = {
            windows: [],       // Array to store details of each added window
            customer: {},      // Object to store customer information (name, email, phone, address, notes)
            totals: { subtotal: 0, installation: 0, options: 0, tax: 0, total: 0 }, // Calculated quote totals
            aiAnalysis: null,  // Stores the result of the last AI analysis
            quoteId: null,     // Unique ID for the current quote, if saved
            timestamp: null    // Timestamp of last update
        };
        this.iframeConnections = {
            windowProducts: false, // Connection status for the Window Products iframe
            aiEstimator: false     // Connection status for the AI Estimator iframe
        };
        this.isLoading = false;    // Boolean to control loading overlay visibility
        this.lastError = null;     // Stores the last error message for display
    }

    /**
     * Updates a part of the current quote state and saves it to session storage.
     * @param {object} data - Partial data object to merge into the current quote state.
     */
    updateQuote(data) {
        this.currentQuote = { ...this.currentQuote, ...data };
        this.saveToSession(); // Persist state to session storage after every update
    }

    /**
     * Adds a new window object to the `windows` array in the current quote.
     * Generates a unique ID for the new window item.
     * @param {object} windowData - The data for the window to be added.
     */
    addWindow(windowData) {
        this.currentQuote.windows.push({
            id: this.generateWindowId(), // Generate a unique ID for the window item
            ...windowData,
            timestamp: new Date().toISOString()
        });
        this.saveToSession(); // Persist state to session storage
    }

    /**
     * Removes a window from the current quote's `windows` array based on its ID.
     * @param {string} windowId - The ID of the window to remove.
     */
    removeWindow(windowId) {
        this.currentQuote.windows = this.currentQuote.windows.filter(w => w.id !== windowId);
        this.saveToSession(); // Persist state to session storage
    }

    /**
     * Generates a unique string ID, typically for window items or session tracking.
     * @returns {string} A unique ID with a 'win_' prefix.
     */
    generateWindowId() {
        return 'win_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Saves the entire `currentQuote` state object to browser storage.
     * Uses localStorage since Wix Velo doesn't have direct sessionStorage access.
     */
    saveToSession() {
        try {
            // Use browser's localStorage instead of wixWindow.sessionStorage
            if (typeof Storage !== 'undefined' && localStorage) {
                localStorage.setItem('gfe_quote_state', JSON.stringify(this.currentQuote));
            } else {
                // Fallback to in-memory storage for this session
                this._memoryStorage = this.currentQuote;
            }
        } catch (error) {
            console.error('Failed to save quote state to storage:', error);
            // Fallback to in-memory storage
            this._memoryStorage = this.currentQuote;
        }
    }

    /**
     * Loads the `currentQuote` state object from browser storage.
     * Initializes `windows` array if it's found null/undefined after loading.
     */
    loadFromSession() {
        try {
            let saved = null;
            
            // Try localStorage first
            if (typeof Storage !== 'undefined' && localStorage) {
                saved = localStorage.getItem('gfe_quote_state');
            } else if (this._memoryStorage) {
                // Fallback to in-memory storage
                saved = JSON.stringify(this._memoryStorage);
            }
            
            if (saved) {
                this.currentQuote = { ...this.currentQuote, ...JSON.parse(saved) };
                if (!this.currentQuote.windows) { // Ensure windows array is always initialized
                    this.currentQuote.windows = [];
                }
            }
        } catch (error) {
            console.error('Failed to load quote state from storage:', error);
            // Reset to default state on error
            this.currentQuote.windows = [];
        }
    }
}

// Initialize the global state instance for the page.
const gfePageControllerState = new GFEPageControllerState();

/**
 * Executes when the Velo page is ready. Performs initial setup tasks.
 * This is the entry point for the page's JavaScript logic.
 */
export function initializeGFEPageController() {
  console.log('🚀 Good Faith Exteriors - Page Controller Initializing...');

  updateConnectionStatus('initializing', '🔴 Initializing system...');
  gfePageControllerState.loadFromSession();
  bindEventListeners();
  initializeIframeCommunication();
  loadInitialData();
  setupConnectionMonitoring();
  updateQuoteTotals();
  updateWindowCount();
  renderWindowsList();

  console.log('✅ Good Faith Exteriors - Page Controller Ready');
}
    updateConnectionStatus('initializing', '🔴 Initializing system...'); // Initial status display

    gfePageControllerState.loadFromSession(); // Load any previously saved quote state

    bindEventListeners(); // Attach event handlers to UI elements

    initializeIframeCommunication(); // Set up message listeners and send initial messages to iframes

    loadInitialData(); // Fetch and load product/pricing data for the product browser

    setupConnectionMonitoring(); // Periodically check and report on iframe connection status

    updateQuoteTotals(); // Update quote summary display based on loaded state
    updateWindowCount(); // Update the displayed count of window
    renderWindowsList(); // Populate the list/repeater with any windows loaded from session storage

    console.log('✅ Good Faith Exteriors - Page Controller Ready');


/**
 * Binds click and change event listeners to all relevant UI elements on the page.
 * This ensures user interactions trigger the appropriate functions.
 */
function bindEventListeners() {
    // Buttons for window management and AI interactions
    $w(PAGE_CONFIG.ADD_WINDOW_BTN).onClick(addWindowToQuote);
    $w(PAGE_CONFIG.CALCULATE_BTN).onClick(calculateCurrentWindowPrice);
    $w(PAGE_CONFIG.AI_ANALYZE_BTN).onClick(runAIAnalysis);
    $w(PAGE_CONFIG.APPLY_AI_RESULTS).onClick(applyAIResultsToForm);

    // Buttons for quote management
    $w(PAGE_CONFIG.SAVE_QUOTE_BTN).onClick(saveQuote);
    $w(PAGE_CONFIG.EMAIL_QUOTE_BTN).onClick(emailQuote);
    $w(PAGE_CONFIG.SCHEDULE_CONSULTATION_BTN).onClick(scheduleConsultation);

    // Input fields for customer information - updates state on change
    $w(PAGE_CONFIG.CUSTOMER_NAME).onChange((event) => {
        gfePageControllerState.updateQuote({ customer: { ...gfePageControllerState.currentQuote.customer, name: event.target.value } });
    });
    $w(PAGE_CONFIG.CUSTOMER_EMAIL).onChange((event) => {
        gfePageControllerState.updateQuote({ customer: { ...gfePageControllerState.currentQuote.customer, email: event.target.value } });
    });
    $w(PAGE_CONFIG.CUSTOMER_PHONE).onChange((event) => {
        gfePageControllerState.updateQuote({ customer: { ...gfePageControllerState.currentQuote.customer, phone: event.target.value } });
    });
    $w(PAGE_CONFIG.PROJECT_ADDRESS).onChange((event) => {
        gfePageControllerState.updateQuote({ customer: { ...gfePageControllerState.currentQuote.customer, address: event.target.value } });
    });
    $w(PAGE_CONFIG.PROJECT_NOTES).onChange((event) => {
        gfePageControllerState.updateQuote({ customer: { ...gfePageControllerState.currentQuote.customer, notes: event.target.value } });
    });

    // Event listener for the image upload button
    if ($w(UI_ELEMENT_IDS.imageInput)) {
        $w(UI_ELEMENT_IDS.imageInput).onChange(async (event) => {
            if (event.target.files && event.target.files.length > 0) {
                const file = event.target.files[0];
                showLoading('Uploading image for analysis...');
                try {
                    const base64Image = await fileToBase64(file);
                    // Store the base64 image data in the page state
                    gfePageControllerState.updateQuote({
                        imageData: {
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            base64: base64Image
                        }
                    });
                    // Display a preview of the uploaded image on the page
                    if ($w(UI_ELEMENT_IDS.uploadedImageDisplay)) {
                        $w(UI_ELEMENT_IDS.uploadedImageDisplay).src = base64Image;
                        $w(UI_ELEMENT_IDS.uploadedImageDisplay).show();
                    }
                    showSuccess(`Image "${file.name}" uploaded and ready for AI analysis.`);
                } catch (error) {
                    showError('Failed to process image for upload: ' + error.message);
                } finally {
                    hideLoading();
                }
            }
        });
    }
}

/**
 * Establishes bidirectional communication channels with the embedded iframes.
 * It sets up a global message listener and sends initial messages to the iframes.
 */
function initializeIframeCommunication() {
    // Add event listener for messages from any origin to this window (Velo page)
    if (typeof window !== 'undefined') {
        window.addEventListener('message', handleIframeMessage);
    }

    // Send initialization messages to iframes after a short delay to ensure they are loaded
    setTimeout(() => {
        sendToIframe('windowProducts', 'initialize', {
            customerData: gfePageControllerState.currentQuote.customer
        });
        sendToIframe('aiEstimator', 'initialize', {
            quoteData: gfePageControllerState.currentQuote
        });
    }, 1000);
}

/**
 * Handles incoming messages received from the iframes.
 * Validates the message origin for security and dispatches to specific handlers.
 * @param {MessageEvent} event - The message event object containing data and origin.
 */
function handleIframeMessage(event) {
    // Validate the message's origin to prevent cross-site scripting (XSS)
    if (!isValidOrigin(event.origin)) {
        console.warn('Invalid message origin:', event.origin);
        return;
    }

    const { type, data, source } = event.data;
    console.log(`📨 Received message from ${source}:`, type, data);

    // Route the message to the appropriate handler based on its source
    switch (source) {
        case 'gfe-window-products':
            handleWindowProductsMessage(type, data);
            break;
        case 'gfe-ai-estimator':
            handleAIEstimatorMessage(type, data);
            break;
        default:
            console.log('Unknown message source:', source);
    }
}

/**
 * Processes messages specifically from the Window Products Browser iframe.
 * @param {string} type - The type of message received (e.g., 'iframe_ready', 'product_selected').
 * @param {object} data - The data payload associated with the message.
 */
function handleWindowProductsMessage(type, data) {
    switch (type) {
        case 'iframe_ready':
            gfePageControllerState.iframeConnections.windowProducts = true;
            updateConnectionStatus('connected', '🟢 Window Products Connected');
            break;
        case 'product_selected':
            handleProductSelection(data);
            break;
        case 'filter_changed':
            console.log('Product filters changed in iframe:', data);
            break;
        case 'product_details_requested':
            console.log('Product details requested for:', data);
            break;
        default:
            console.log('Unknown message type from Window Products iframe:', type);
    }
}

/**
 * Processes messages specifically from the AI Estimator iframe.
 * @param {string} type - The type of message received (e.g., 'iframe_ready', 'image_uploaded', 'price_calculated').
 * @param {object} data - The data payload associated with the message.
 */
function handleAIEstimatorMessage(type, data) {
    switch (type) {
        case 'iframe_ready':
            gfePageControllerState.iframeConnections.aiEstimator = true;
            updateConnectionStatus('connected', '🟢 AI Estimator Connected');
            break;
        case 'image_uploaded':
            gfePageControllerState.updateQuote({ imageData: data });
            showSuccess(`Image uploaded from AI Estimator: ${data.fileName}`);
            break;
        case 'price_calculated':
            handlePriceCalculation(data);
            break;
        case 'ai_analysis_complete':
            handleAIAnalysisComplete(data);
            break;
        case 'chat_message':
            gfePageControllerState.updateQuote({ chatHistory: [...(gfePageControllerState.currentQuote.chatHistory || []), data] });
            console.log('Chat message from AI Estimator:', data.message);
            break;
        case 'estimate_data':
            // This type of message is a direct response to `get_estimate_data` request
            break;
        default:
            console.log('Unknown message type from AI Estimator iframe:', type);
    }
}

/**
 * Adds the currently configured window (from AI Estimator inputs) to the quote.
 * This involves fetching data from the AI Estimator iframe, updating the page state,
 * updating UI elements, and optionally saving the window item to the backend.
 */
async function addWindowToQuote() {
    try {
        showLoading('Adding window to quote...');
        
        // Retrieve the current window data and measurements from the AI Estimator iframe
        const windowDataFromEstimator = await getWindowDataFromEstimator();

        if (!windowDataFromEstimator || !windowDataFromEstimator.measurements || !windowDataFromEstimator.pricing) {
            showError('Please ensure window measurements and pricing are available in the AI Estimator before adding.');
            return;
        }

        // Combine data from main page form and iframe for a complete window item
        const currentWindowDetails = {
            ...getWindowDataFromForm(),
            measurements: windowDataFromEstimator.measurements,
            pricing: windowDataFromEstimator.pricing,
            aiAnalysis: gfePageControllerState.currentQuote.aiAnalysis || windowDataFromEstimator.aiAnalysis,
            imageData: gfePageControllerState.currentQuote.imageData
        };

        gfePageControllerState.addWindow(currentWindowDetails);

        updateWindowCount();
        updateQuoteTotals();
        renderWindowsList();

        // Optionally, save each individual window item to the backend via API client
        const customerInfo = getCustomerInfoFromForm();
        await gfeApi.createOrUpdateCustomer(customerInfo);
        await gfeApi.createQuoteItem({
            ...currentWindowDetails,
            customerEmail: customerInfo.email,
            sessionId: gfeApi.sessionId,
            itemNumber: gfePageControllerState.currentQuote.windows.length.toString()
        });

        showSuccess('Window added to quote successfully!');

        // Optionally, reset the AI Estimator iframe's form and clear uploaded image display
        sendToIframe('aiEstimator', 'reset_form', {});
        if ($w(UI_ELEMENT_IDS.uploadedImageDisplay)) {
            $w(UI_ELEMENT_IDS.uploadedImageDisplay).hide();
            $w(UI_ELEMENT_IDS.uploadedImageDisplay).src = '';
        }
        if ($w(UI_ELEMENT_IDS.aiAnalysisResult)) {
            $w(UI_ELEMENT_IDS.aiAnalysisResult).text = '';
        }

    } catch (error) {
        console.error('Failed to add window to quote:', error);
        showError('Failed to add window to quote. Please ensure all required data is provided: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Triggers a price calculation for the current window within the AI Estimator iframe.
 * The result is communicated back via the `price_calculated` message.
 */
async function calculateCurrentWindowPrice() {
    try {
        showLoading('Calculating window price...');
        sendToIframe('aiEstimator', 'calculate_price', getWindowDataFromForm());
    } catch (error) {
        console.error('Failed to trigger price calculation in AI Estimator:', error);
        showError('Failed to calculate price. Please check inputs.');
        hideLoading();
    }
}

/**
 * Initiates an AI analysis request for the uploaded window image via the backend service.
 * The analysis results are then stored in state and sent to the AI Estimator iframe for display.
 */
async function runAIAnalysis() {
    try {
        showLoading('Running AI analysis...');
        const imageData = gfePageControllerState.currentQuote.imageData?.base64;
        if (!imageData) {
            showError('Please upload a window image first for AI analysis.');
            return;
        }

        const customerInfo = getCustomerInfoFromForm();

        // Call the backend AI analysis service using the gfeApi client
        const analysisResult = await gfeApi.analyzeWindow(imageData, customerInfo, 'detailed');
        
        if (analysisResult.success && analysisResult.analysis) {
            gfePageControllerState.updateQuote({ aiAnalysis: analysisResult.analysis });
            sendToIframe('aiEstimator', 'display_analysis', analysisResult.analysis);
            showSuccess('AI analysis completed successfully!');
        } else {
            throw new Error(analysisResult.error || 'Unknown error during AI analysis.');
        }

    } catch (error) {
        console.error('AI analysis failed:', error);
        showError('AI analysis failed. Please ensure the image is clear or try again. ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Applies the AI recommendations (e.g., estimated measurements, material, notes) to the frontend form fields.
 */
async function applyAIResultsToForm() {
    try {
        if (!gfePageControllerState.currentQuote.aiAnalysis) {
            showError('No AI analysis results available to apply. Please run AI analysis first.');
            return;
        }

        showLoading('Applying AI recommendations...');
        const aiResults = gfePageControllerState.currentQuote.aiAnalysis;

        // Update form inputs with AI-estimated values
        if (aiResults.estimatedWidth && $w(UI_ELEMENT_IDS.widthInput)) {
            $w(UI_ELEMENT_IDS.widthInput).value = aiResults.estimatedWidth;
        }
        if (aiResults.estimatedHeight && $w(UI_ELEMENT_IDS.heightInput)) {
            $w(UI_ELEMENT_IDS.heightInput).value = aiResults.estimatedHeight;
        }
        if (aiResults.windowType && $w(UI_ELEMENT_IDS.windowTypeDropdown)) {
            $w(UI_ELEMENT_IDS.windowTypeDropdown).value = aiResults.windowType;
        }
        if (aiResults.material && $w(UI_ELEMENT_IDS.materialDropdown)) {
            $w(UI_ELEMENT_IDS.materialDropdown).value = aiResults.material;
        }
        
        // Update project notes with AI insights if a notes input element exists
        if (aiResults.notes && $w(PAGE_CONFIG.PROJECT_NOTES)) {
            $w(PAGE_CONFIG.PROJECT_NOTES).value = aiResults.notes;
            gfePageControllerState.updateQuote({
                customer: { ...gfePageControllerState.currentQuote.customer, notes: aiResults.notes }
            });
        }

        // Display AI's professional recommendations to the user
        if (aiResults.recommendations && aiResults.recommendations.length > 0) {
            const recommendationsText = aiResults.recommendations.join('\n• ');
            if ($w(UI_ELEMENT_IDS.windowAdvisorText)) {
                $w(UI_ELEMENT_IDS.windowAdvisorText).text = `AI Recommendations:\n• ${recommendationsText}`;
            }
        }
        
        showSuccess('AI recommendations applied to the form!');

    } catch (error) {
        console.error('Failed to apply AI results:', error);
        showError('Failed to apply AI recommendations: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Saves the current comprehensive quote, including customer information and added windows, to the backend.
 * This function also ensures the customer lead is created or updated in the CRM.
 */
async function saveQuote() {
    try {
        // Basic validation: ensure windows are added and customer info is provided
        if (gfePageControllerState.currentQuote.windows.length === 0) {
            showError('Please add at least one window to the quote before saving.');
            return;
        }
        const customerInfo = getCustomerInfoFromForm();
        if (!validateFrontendInput(customerInfo.name, 'Customer Name') || !validateFrontendInput(customerInfo.email, 'Customer Email')) {
            return; // showError is called by validateFrontendInput
        }

        showLoading('Saving quote and customer details...');

        // Step 1: Create or update customer lead in the backend CRM
        const customerSaveResult = await gfeApi.createOrUpdateCustomer(customerInfo);
        if (!customerSaveResult.success) {
            throw new Error(customerSaveResult.error || 'Failed to save customer details.');
        }
        const customerId = customerSaveResult.customer._id;

        // Step 2: Ensure an overall quote ID exists for the current session
        if (!gfePageControllerState.currentQuote.quoteId) {
            gfePageControllerState.updateQuote({ quoteId: gfeApi.generateSessionId() });
        }

        showSuccess(`Quote saved successfully! Quote ID: ${gfePageControllerState.currentQuote.quoteId}`);

    } catch (error) {
        console.error('Failed to save quote:', error);
        showError('Failed to save quote: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Emails the current quote, along with a generated explanation, to the customer.
 * This function also ensures the quote is saved before emailing.
 */
async function emailQuote() {
    try {
        const customerEmail = gfePageControllerState.currentQuote.customer.email;
        if (!customerEmail) {
            showError('Please enter the customer\'s email address to send the quote.');
            return;
        }

        showLoading('Generating and sending quote via email...');

        // Ensure the quote is saved and has a quote ID before attempting to email it
        let quoteId = gfePageControllerState.currentQuote.quoteId;
        if (!quoteId) {
            await saveQuote();
            quoteId = gfePageControllerState.currentQuote.quoteId;
            if (!quoteId) {
                throw new Error('Could not obtain a quote ID to email. Please try saving first.');
            }
        }

        const customerInfo = getCustomerInfoFromForm();
        const quoteData = gfePageControllerState.currentQuote;

        // Generate a personalized quote explanation using AI via the backend
        const explanationResult = await gfeApi.generateQuoteExplanation(quoteData, customerInfo);
        if (!explanationResult.success) {
            throw new Error(explanationResult.error || 'Failed to generate quote explanation.');
        }

        // Call the backend service to send customer communication (the quote email)
        const emailResult = await gfeApi.generateCustomerCommunication(
            customerInfo,
            'estimate_ready_notification',
            { quote: quoteData, explanation: explanationResult.explanation }
        );

        if (emailResult.success) {
            showSuccess(`Quote successfully emailed to ${customerEmail}!`);
        } else {
            throw new Error(emailResult.error || 'Failed to send email.');
        }

    } catch (error) {
        console.error('Failed to email quote:', error);
        showError('Failed to email quote: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Schedules a consultation appointment for the customer via a backend service.
 */
async function scheduleConsultation() {
    try {
        const customerInfo = getCustomerInfoFromForm();
        if (!validateFrontendInput(customerInfo.name, 'Customer Name') || !validateFrontendInput(customerInfo.email, 'Customer Email')) {
            return;
        }

        showLoading('Scheduling consultation appointment...');
        
        // Prepare appointment data
        const appointmentData = {
            customerName: customerInfo.name,
            email: customerInfo.email,
            phoneNumber: customerInfo.phone,
            selectedService: 'Window Consultation',
            preferredDate: new Date().toISOString(),
            preferredTime: 'Any',
            internalNotes: 'Scheduled from AI Window Estimator',
            sessionId: gfeApi.sessionId
        };

        // Call the backend API to create an appointment
        const createAppointmentResult = await gfeApi.post('/api/create-appointment', appointmentData);

        if (createAppointmentResult.success) {
            showSuccess('Consultation scheduled successfully! Good Faith Exteriors will contact you shortly.');
        } else {
            throw new Error(createAppointmentResult.error || 'Failed to schedule consultation.');
        }

    } catch (error) {
        console.error('Failed to schedule consultation:', error);
        showError('Failed to schedule consultation: ' + error.message);
    } finally {
        hideLoading();
    }
}

/**
 * Loads initial product and pricing data from the backend.
 * This data is then sent to the Window Products Browser iframe to populate its catalog.
 */
async function loadInitialData() {
    try {
        showLoading('Loading window products data...');

        // Fetch window products from the backend via gfeApi
        const windowProducts = await gfeApi.getWindowProducts({});

        // Fetch pricing configuration from the backend via gfeApi
        const pricingConfig = await gfeApi.getConfiguration();

        if (!windowProducts || !pricingConfig) {
            throw new Error('Failed to retrieve essential product or pricing data from backend.');
        }

        // Send the fetched data to the Window Products Browser iframe for it to display
        sendToIframe('windowProducts', 'load_data', {
            products: windowProducts,
            pricing: pricingConfig
        });

        console.log(`✅ Loaded ${windowProducts.length} products and pricing configuration.`);

    } catch (error) {
        console.error('Failed to load initial data for products browser iframe:', error);
        showError('Failed to load product data. Some features may not work properly. Please refresh the page.');
    } finally {
        hideLoading();
    }
}

/**
 * Renders or updates the list of added windows on the Velo page, typically within a repeater or a text area.
 * It also sets up event listeners for dynamically created elements like delete buttons.
 */
function renderWindowsList() {
    const windows = gfePageControllerState.currentQuote.windows;
    const windowsListElement = $w(PAGE_CONFIG.WINDOWS_LIST_DISPLAY);

    if (windowsListElement && windows.length > 0) {
        // If the element is a repeater, set its data and define how each item is rendered
        if (windowsListElement.type === '$w.Repeater') {
            windowsListElement.data = windows.map((win, index) => ({
                _id: win.id,
                itemNumber: index + 1,
                windowType: win.windowType || 'N/A',
                dimensions: `${win.measurements?.estimatedWidth || win.width || 'N/A'}x${win.measurements?.estimatedHeight || win.height || 'N/A'}`,
                material: win.material || 'N/A',
                brand: win.brand || 'N/A',
                totalPrice: formatCurrency(parseFloat(win.pricing?.totalPrice) || parseFloat(win.totalPrice) || 0),
            }));

            windowsListElement.onItemReady(($item, itemData, index) => {
                $item('#windowItemType').text = itemData.windowType;
                $item('#windowItemDimensions').text = itemData.dimensions;
                $item('#windowItemMaterial').text = itemData.material;
                $item('#windowItemBrand').text = itemData.brand;
                $item('#windowItemPrice').text = itemData.totalPrice;
                
                $item('#deleteWindowBtn').onClick(() => {
                    gfePageControllerState.removeWindow(itemData._id);
                    updateWindowCount();
                    updateQuoteTotals();
                    renderWindowsList();
                    showSuccess(`Window ${itemData.itemNumber} removed from quote.`);
                });
            });
            windowsListElement.show();
        } else {
            windowsListElement.text = 'Your Windows:\n' + windows.map((win, index) =>
                `${index + 1}. ${win.windowType} (${win.measurements?.estimatedWidth || win.width}x${win.measurements?.estimatedHeight || win.height}) - ${formatCurrency(parseFloat(win.pricing?.totalPrice) || parseFloat(win.totalPrice) || 0)}`
            ).join('\n');
            windowsListElement.show();
        }
    } else if (windowsListElement) {
        windowsListElement.hide();
        windowsListElement.text = 'No windows added yet.';
    }
}

/**
 * Updates the UI element that displays the system's connection status (e.g., to iframes).
 * @param {string} status - The status type ('initializing', 'connected', 'error').
 * @param {string} message - The message string to display.
 */
function updateConnectionStatus(status, message) {
    const statusElement = $w(PAGE_CONFIG.CONNECTION_STATUS);
    if (statusElement) {
        statusElement.text = message;
        switch (status) {
            case 'connected':
                statusElement.style.backgroundColor = 'var(--success, #4CAF50)';
                break;
            case 'error':
                statusElement.style.backgroundColor = 'var(--error, #F44336)';
                break;
            case 'initializing':
            default:
                statusElement.style.backgroundColor = 'var(--warning, #FFC107)';
                break;
        }
    }
}

/**
 * Updates the UI element that displays the current number of windows added to the quote.
 */
function updateWindowCount() {
    const count = gfePageControllerState.currentQuote.windows.length;
    const windowCountElement = $w(PAGE_CONFIG.WINDOW_COUNT);
    if (windowCountElement) {
        windowCountElement.text = `${count}`;
    }
}

/**
 * Calculates the sum of prices for all windows in the current quote and updates the UI.
 * This includes subtotal, installation, options, tax, and grand total.
 */
function updateQuoteTotals() {
    const windows = gfePageControllerState.currentQuote.windows;
    
    const subtotal = windows.reduce((sum, window) => sum + (parseFloat(window.pricing?.subtotal) || 0), 0);
    const totalLabor = windows.reduce((sum, window) => sum + (parseFloat(window.pricing?.laborCost) || 0), 0);
    const totalOptions = windows.reduce((sum, window) => sum + (parseFloat(window.pricing?.optionsCost || '0')), 0);

    const totalBeforeTax = subtotal + totalLabor + totalOptions;
    const taxRate = 0.07; // Tax rate (7%)
    const taxAmount = totalBeforeTax * taxRate;
    const grandTotal = totalBeforeTax + taxAmount;

    const totals = {
        subtotal: subtotal,
        installation: totalLabor,
        options: totalOptions,
        tax: taxAmount,
        total: grandTotal,
        windowCount: windows.length
    };
    gfePageControllerState.updateQuote({ totals });

    // Update specific UI elements to display totals
    if ($w(PAGE_CONFIG.QUOTE_TOTAL)) {
        $w(PAGE_CONFIG.QUOTE_TOTAL).text = formatCurrency(totals.total);
    }
    if ($w('#quoteSubtotal')) { $w('#quoteSubtotal').text = formatCurrency(totals.subtotal); }
    if ($w('#quoteInstallation')) { $w('#quoteInstallation').text = formatCurrency(totals.installation); }
    if ($w('#quoteOptions')) { $w('#quoteOptions').text = formatCurrency(totals.options); }
    if ($w('#quoteTax')) { $w('#quoteTax').text = formatCurrency(totals.tax); }

    const summaryElement = $w(PAGE_CONFIG.ESTIMATE_SUMMARY);
    if (summaryElement) {
        summaryElement.text = `${windows.length} windows - Total: ${formatCurrency(totals.total)}`;
    }
}

/**
 * Handles product selection messages from the Window Products iframe.
 * @param {object} productData - The data of the selected product.
 */
function handleProductSelection(productData) {
    console.log('Product selected in iframe:', productData);
    sendToIframe('aiEstimator', 'product_selected', productData);
}

/**
 * Handles price calculation results received from the AI Estimator iframe.
 * @param {object} data - The pricing calculation results.
 */
function handlePriceCalculation(data) {
    console.log('Price calculated in AI Estimator iframe:', data);
    const calculatedWindow = {
        ...data,
        id: gfePageControllerState.generateWindowId(),
        timestamp: new Date().toISOString()
    };
    gfePageControllerState.updateQuote({ currentWindow: calculatedWindow });
    updateQuoteTotals();
    showSuccess('Price calculated for current window!');
    hideLoading();
}

/**
 * Handles AI analysis completion results received from the AI Estimator iframe.
 * @param {object} data - The AI analysis results.
 */
function handleAIAnalysisComplete(data) {
    console.log('AI analysis completed in AI Estimator iframe:', data);
    gfePageControllerState.updateQuote({
        aiAnalysis: {
            ...data,
            timestamp: new Date().toISOString()
        }
    });
    showSuccess('AI analysis results received.');
    hideLoading();
}

/**
 * Utility function to send messages to an embedded iframe.
 * @param {string} iframeName - The logical name of the target iframe ('windowProducts' or 'aiEstimator').
 * @param {string} messageType - The type of message being sent.
 * @param {object} data - The data payload to send with the message.
 */
function sendToIframe(iframeName, messageType, data) {
    try {
        const iframeElement = $w(
            iframeName === 'windowProducts'
                ? PAGE_CONFIG.WINDOW_PRODUCTS_IFRAME
                : PAGE_CONFIG.AI_ESTIMATOR_IFRAME
        );

        const message = {
            type: messageType,
            data: data,
            source: 'velo-page',
            timestamp: new Date().toISOString()
        };

        if (iframeElement && iframeElement.contentWindow) {
            iframeElement.contentWindow.postMessage(message, '*');
        }
        console.log(`📤 Sent message of type '${messageType}' to ${iframeName}:`, data);
    } catch (error) {
        console.error(`Failed to send message to ${iframeName}:`, error);
    }
}

/**
 * Requests and retrieves the current window estimation data from the AI Estimator iframe.
 * @returns {Promise<object>} A promise that resolves with the window estimation data.
 */
function getWindowDataFromEstimator() {
    return new Promise((resolve, reject) => {
        sendToIframe('aiEstimator', 'get_estimate_data', {});

        const messageHandler = (event) => {
            if (event.data.type === 'estimate_data' && event.data.source === 'gfe-ai-estimator') {
                window.removeEventListener('message', messageHandler);
                resolve(event.data.data);
            }
        };
        window.addEventListener('message', messageHandler);

        setTimeout(() => {
            window.removeEventListener('message', messageHandler);
            reject(new Error('Timeout waiting for estimate data from AI Estimator iframe.'));
        }, 5000);
    });
}

/**
 * Validates the origin of an incoming message for security purposes.
 * @param {string} origin - The origin URL of the message sender.
 * @returns {boolean} True if the origin is valid, false otherwise.
 */
function isValidOrigin(origin) {
    const validOrigins = [
        wixLocation.baseUrl,
        'https://goodfaithexteriors.com',
        'https://www.goodfaithexteriors.com',
    ];
    return validOrigins.some(validOrigin => origin.startsWith(validOrigin));
}

/**
 * Formats a numeric amount into a currency string (USD, no decimal places).
 * @param {number} amount - The numeric value to format.
 * @returns {string} The formatted currency string, e.g., "$1,234".
 */
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '$0';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Displays a loading overlay on the page with a customizable message.
 * @param {string} message - The message to display while loading.
 */
function showLoading(message = 'Loading...') {
    gfePageControllerState.isLoading = true;
    const loadingOverlay = $w(PAGE_CONFIG.LOADING_OVERLAY);
    const loadingText = $w('#loadingText');
    if (loadingOverlay) {
        loadingOverlay.show();
    }
    if (loadingText) {
        loadingText.text = message;
    }
}

/**
 * Hides the loading overlay from the page.
 */
function hideLoading() {
    gfePageControllerState.isLoading = false;
    const loadingOverlay = $w(PAGE_CONFIG.LOADING_OVERLAY);
    if (loadingOverlay) {
        loadingOverlay.hide();
    }
}

/**
 * Displays an error message on the page for a short duration.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    gfePageControllerState.lastError = message;
    const errorMessageElement = $w(PAGE_CONFIG.ERROR_MESSAGE);
    if (errorMessageElement) {
        errorMessageElement.text = message;
        errorMessageElement.show();
        setTimeout(() => errorMessageElement.hide(), 5000);
    }
}

/**
 * Displays a success message on the page for a short duration.
 * @param {string} message - The success message to display.
 */
function showSuccess(message) {
    const successMessageElement = $w(PAGE_CONFIG.SUCCESS_MESSAGE);
    if (successMessageElement) {
        successMessageElement.text = message;
        successMessageElement.show();
        setTimeout(() => successMessageElement.hide(), 3000);
    }
}

/**
 * Sets up a periodic check to monitor the connection status of the iframes.
 */
function setupConnectionMonitoring() {
    setInterval(() => {
        if (!gfePageControllerState.iframeConnections.windowProducts || !gfePageControllerState.iframeConnections.aiEstimator) {
            updateConnectionStatus('error', '🔴 Connection issues detected with iframes. Attempting to reconnect...');
            setTimeout(() => {
                initializeIframeCommunication();
            }, 2000);
        }
    }, 30000);
}

// Export key functions for modularity
export {
    addWindowToQuote,
    calculateCurrentWindowPrice,
    runAIAnalysis,
    applyAIResultsToForm,
    saveQuote,
    emailQuote,
    scheduleConsultation,
    gfePageControllerState
};