/**
 * Good Faith Exteriors - Main Frontend Controller
 * Handles all user interface interactions and AI integration
 */

import { 
  analyzeWindowImage, 
  getWindowProducts, 
  calculateQuote, 
  submitCustomerData,
  generateGoogleOAuthUrl,
  exchangeOAuthCode,
  getAuthStatus,
  performHealthCheck
} from 'backend/velo-oauth-updated.jsw';

// Global state management
let currentUser = null;
let selectedProducts = [];
let currentQuote = null;
let authToken = null;
let systemHealthy = false;

/**
 * Page initialization
 */
$w.onReady(function () {
  console.log('🚀 Good Faith Exteriors AI Assistant - Initializing...');
  
  initializeSystem();
  setupEventHandlers();
  initializeAuthentication();
  loadWindowProducts();
  
  console.log('✅ System ready for operation');
});

/**
 * Initialize system with health check
 */
async function initializeSystem() {
  try {
    showLoading('Checking system status...');
    
    const healthCheck = await performHealthCheck();
    systemHealthy = healthCheck.allSystemsOperational;
    
    if (systemHealthy) {
      updateSystemStatus('✅ All Systems Operational', 'success');
    } else {
      updateSystemStatus('⚠️ Some Systems Offline', 'warning');
    }
    
    hideLoading();
  } catch (error) {
    console.error('System initialization failed:', error);
    updateSystemStatus('❌ System Error', 'error');
    hideLoading();
  }
}

/**
 * Setup event handlers
 */
function setupEventHandlers() {
  // Authentication
  if ($w('#loginButton')) {
    $w('#loginButton').onClick(initiateOAuth);
  }
  
  if ($w('#logoutButton')) {
    $w('#logoutButton').onClick(logout);
  }

  // Product interaction
  if ($w('#generateQuoteButton')) {
    $w('#generateQuoteButton').onClick(generateQuote);
  }

  // Lead capture
  if ($w('#submitQuoteButton')) {
    $w('#submitQuoteButton').onClick(submitQuote);
  }

  // Image upload
  if ($w('#imageUpload')) {
    $w('#imageUpload').onChange(handleImageUpload);
  }

  // Quick actions
  setupQuickActions();
}

/**
 * Setup quick actions
 */
function setupQuickActions() {
  const quickActions = [
    { id: '#getQuoteAction', message: 'I\'d like to get a quote for window replacement.' },
    { id: '#scheduleAction', message: 'I\'d like to schedule a consultation.' },
    { id: '#energyAction', message: 'Can you tell me about energy savings with new windows?' },
    { id: '#typesAction', message: 'What types of windows do you offer?' },
    { id: '#financingAction', message: 'What financing options are available?' },
    { id: '#warrantyAction', message: 'Can you tell me about your warranty?' }
  ];

  quickActions.forEach(action => {
    if ($w(action.id)) {
      $w(action.id).onClick(() => {
        handleQuickAction(action.message);
      });
    }
  });
}

/**
 * Handle quick action clicks
 */
function handleQuickAction(message) {
  if ($w('#chatInput')) {
    $w('#chatInput').value = message;
    // Trigger chat or lead capture based on message
    displayMessage('user', message);
    processUserMessage(message);
  }
}

/**
 * Initialize authentication
 */
async function initializeAuthentication() {
  try {
    const authStatus = await getAuthStatus();
    
    if (authStatus.success && authStatus.isAuthenticated) {
      currentUser = authStatus.member;
      updateAuthUI(true);
    } else {
      updateAuthUI(false);
    }
  } catch (error) {
    console.error('Authentication initialization failed:', error);
  }
}

/**
 * Initiate OAuth authentication
 */
async function initiateOAuth() {
  try {
    const redirectUri = window.location.origin + window.location.pathname;
    const state = 'gfe_window_catalog';
    
    const result = await generateGoogleOAuthUrl(redirectUri, state);
    
    if (result.success) {
      window.location.href = result.authUrl;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('OAuth initiation failed:', error);
    showNotification('Failed to start authentication: ' + error.message, 'error');
  }
}

/**
 * Load window products
 */
async function loadWindowProducts(filters = {}) {
  try {
    showLoading('Loading window products...');
    
    const result = await getWindowProducts(filters);
    
    if (result.success) {
      displayProducts(result.products);
      updateProductCount(result.totalCount);
    } else {
      throw new Error(result.error);
    }
    
    hideLoading();
  } catch (error) {
    console.error('Failed to load products:', error);
    showNotification('Failed to load window products: ' + error.message, 'error');
    hideLoading();
  }
}

/**
 * Display products in repeater
 */
function displayProducts(products) {
  if ($w('#productRepeater')) {
    $w('#productRepeater').data = products.map(product => ({
      _id: product._id,
      productId: product.productId,
      windowBrand: product.windowBrand,
      series: product.series,
      interiorMaterial: product.interiorMaterial,
      exteriorMaterial: product.exteriorMaterial,
      basePrice: product.basePrice,
      pricePerUI: product.pricePerUI,
      description: product.description,
      calculatedPrice: `$${product.calculatedPrice.toFixed(2)}`,
      markupApplied: `${product.markupPercentage}% markup applied`,
      isSelected: selectedProducts.some(p => p.productId === product.productId)
    }));
    
    $w('#productRepeater').onItemReady(($item, itemData) => {
      $item('#selectProductButton').onClick(() => {
        toggleProductSelection(itemData);
      });
      
      $item('#viewDetailsButton').onClick(() => {
        showProductDetails(itemData);
      });
      
      updateSelectionUI($item, itemData.isSelected);
    });
  }
}

/**
 * Toggle product selection
 */
function toggleProductSelection(product) {
  const existingIndex = selectedProducts.findIndex(p => p.productId === product.productId);
  
  if (existingIndex >= 0) {
    selectedProducts.splice(existingIndex, 1);
  } else {
    selectedProducts.push({
      ...product,
      quantity: 1,
      customUI: product.baseUI
    });
  }
  
  updateSelectionDisplay();
  loadWindowProducts(); // Refresh to update selection state
}

/**
 * Generate quote for selected products
 */
async function generateQuote() {
  if (selectedProducts.length === 0) {
    showNotification('Please select at least one product', 'error');
    return;
  }
  
  try {
    showLoading('Generating quote...');
    
    const customerInfo = {
      name: $w('#customerName')?.value || 'Guest User',
      email: $w('#customerEmail')?.value || '',
      phone: $w('#customerPhone')?.value || '',
      address: $w('#customerAddress')?.value || ''
    };
    
    const projectDetails = {
      projectType: $w('#projectType')?.value || 'residential',
      installationType: $w('#installationType')?.value || 'replacement',
      notes: $w('#projectNotes')?.value || ''
    };
    
    const result = await calculateQuote(selectedProducts, customerInfo, projectDetails);
    
    if (result.success) {
      currentQuote = result.quote;
      displayQuote(result.quote);
      showNotification('Quote generated successfully!', 'success');
    } else {
      throw new Error(result.error);
    }
    
    hideLoading();
  } catch (error) {
    console.error('Quote generation failed:', error);
    showNotification('Failed to generate quote: ' + error.message, 'error');
    hideLoading();
  }
}

/**
 * Submit quote and customer data
 */
async function submitQuote() {
  if (!currentQuote) {
    showNotification('Please generate a quote first', 'error');
    return;
  }
  
  try {
    showLoading('Submitting quote...');
    
    const customerData = {
      firstName: $w('#firstName')?.value,
      lastName: $w('#lastName')?.value,
      email: $w('#email')?.value,
      phone: $w('#phone')?.value,
      address: $w('#address')?.value,
      projectType: $w('#projectType')?.value,
      projectDescription: $w('#projectDescription')?.value,
      budget: $w('#budget')?.value,
      timeline: $w('#timeline')?.value,
      preferredContact: $w('#preferredContact')?.value,
      source: 'ai-assistant'
    };
    
    // Validate required fields
    if (!customerData.firstName || !customerData.lastName || !customerData.email || !customerData.phone) {
      throw new Error('Please fill in all required fields (Name, Email, Phone)');
    }
    
    const result = await submitCustomerData(customerData, currentQuote.quoteId);
    
    if (result.success) {
      showNotification('Quote submitted successfully! We will contact you soon.', 'success');
      resetForm();
    } else {
      throw new Error(result.error);
    }
    
    hideLoading();
  } catch (error) {
    console.error('Quote submission failed:', error);
    showNotification('Failed to submit quote: ' + error.message, 'error');
    hideLoading();
  }
}

/**
 * Handle image upload and analysis
 */
async function handleImageUpload() {
  const files = $w('#imageUpload')?.value;
  if (!files || files.length === 0) return;
  
  try {
    showLoading('Analyzing image with AI...');
    
    const file = files[0];
    const base64Data = await fileToBase64(file);
    
    const analysisResult = await analyzeWindowImage(base64Data, {
      analysisType: 'comprehensive',
      customerNotes: 'Image uploaded via AI Assistant'
    });
    
    if (analysisResult.success) {
      displayAnalysisResults(analysisResult);
      showNotification('Image analysis completed successfully!', 'success');
    } else {
      throw new Error(analysisResult.error);
    }
    
    hideLoading();
  } catch (error) {
    console.error('Image analysis failed:', error);
    showNotification('Image analysis failed: ' + error.message, 'error');
    hideLoading();
  }
}

/**
 * Display analysis results
 */
function displayAnalysisResults(analysisData) {
  if ($w('#analysisResults')) {
    const resultsHtml = `
      <div class="analysis-results">
        <h3>AI Analysis Results</h3>
        <div class="analysis-content">
          <p><strong>Analysis completed successfully!</strong></p>
          <p>Confidence: ${Math.round((analysisData.confidence || 0.85) * 100)}%</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `;
    
    $w('#analysisResults').html = resultsHtml;
    $w('#analysisResults').show();
  }
}

/**
 * Process user message (for chat functionality)
 */
function processUserMessage(message) {
  // Add AI response logic here
  setTimeout(() => {
    const responses = [
      "I'd be happy to help you with window replacement! Let me connect you with our AI analysis system.",
      "Great question! Our energy-efficient windows can save you 15-30% on energy costs.",
      "We offer a wide range of window types including double-hung, casement, sliding, and specialty windows.",
      "We have flexible financing options available. Let me gather some information to provide you with the best options."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    displayMessage('assistant', randomResponse);
  }, 1000);
}

/**
 * Display message in chat
 */
function displayMessage(role, content) {
  if (!$w('#chatMessages')) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const avatar = role === 'user' ? 'U' : 'AI';
  const messageClass = role === 'user' ? 'user' : 'assistant';
  
  const messageHtml = `
    <div class="message ${messageClass}">
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        ${content}
        <div class="message-time">${timestamp}</div>
      </div>
    </div>
  `;
  
  $w('#chatMessages').html += messageHtml;
  
  // Scroll to bottom
  if ($w('#chatMessages').scrollTo) {
    $w('#chatMessages').scrollTo();
  }
}

/**
 * Utility Functions
 */
function updateAuthUI(isAuthenticated) {
  if (isAuthenticated) {
    if ($w('#loginButton')) $w('#loginButton').hide();
    if ($w('#logoutButton')) $w('#logoutButton').show();
    if ($w('#userInfo')) $w('#userInfo').show();
    if ($w('#authStatus')) $w('#authStatus').text = 'Authenticated';
  } else {
    if ($w('#loginButton')) $w('#loginButton').show();
    if ($w('#logoutButton')) $w('#logoutButton').hide();
    if ($w('#userInfo')) $w('#userInfo').hide();
    if ($w('#authStatus')) $w('#authStatus').text = 'Not authenticated';
  }
}

function updateSelectionDisplay() {
  const count = selectedProducts.length;
  if ($w('#selectionCount')) {
    $w('#selectionCount').text = `${count} product${count !== 1 ? 's' : ''} selected`;
  }
  
  if ($w('#generateQuoteButton')) {
    if (count > 0) {
      $w('#generateQuoteButton').enable();
    } else {
      $w('#generateQuoteButton').disable();
    }
  }
}

function displayQuote(quote) {
  if ($w('#quoteDisplay')) {
    $w('#quoteDisplay').show();
    if ($w('#quoteId')) $w('#quoteId').text = quote.quoteId;
    if ($w('#quoteTotal')) $w('#quoteTotal').text = `$${quote.totalPrice.toFixed(2)}`;
    if ($w('#quoteValidUntil')) $w('#quoteValidUntil').text = quote.validUntil.toLocaleDateString();
  }
}

function updateProductCount(count) {
  if ($w('#productCount')) {
    $w('#productCount').text = `${count} products found`;
  }
}

function updateSystemStatus(message, type) {
  if ($w('#systemStatus')) {
    $w('#systemStatus').text = message;
    $w('#systemStatus').style.color = 
      type === 'success' ? '#38A169' : 
      type === 'warning' ? '#ED8936' : '#E53E3E';
  }
}

function showLoading(message) {
  if ($w('#loadingMessage')) {
    $w('#loadingMessage').text = message;
    $w('#loadingMessage').show();
  }
}

function hideLoading() {
  if ($w('#loadingMessage')) {
    $w('#loadingMessage').hide();
  }
}

function showNotification(message, type = 'info') {
  if ($w('#notification')) {
    $w('#notification').text = message;
    $w('#notification').show();
    
    setTimeout(() => {
      $w('#notification').hide();
    }, 5000);
  }
  
  console.log(`${type.toUpperCase()}: ${message}`);
}

function resetForm() {
  const fields = ['#firstName', '#lastName', '#email', '#phone', '#address', '#projectDescription'];
  fields.forEach(field => {
    if ($w(field)) $w(field).value = '';
  });
}

function logout() {
  currentUser = null;
  authToken = null;
  selectedProducts = [];
  currentQuote = null;
  
  updateAuthUI(false);
  showNotification('Logged out successfully', 'success');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

function updateSelectionUI($item, isSelected) {
  if (isSelected) {
    $item('#selectProductButton').label = 'Remove';
    if ($item('#productCard')) {
      $item('#productCard').style.backgroundColor = '#e8f5e8';
    }
  } else {
    $item('#selectProductButton').label = 'Select';
    if ($item('#productCard')) {
      $item('#productCard').style.backgroundColor = '#ffffff';
    }
  }
}

function showProductDetails(product) {
  if ($w('#productDetailsModal')) {
    $w('#productDetailsModal').show();
    if ($w('#modalProductName')) {
      $w('#modalProductName').text = `${product.windowBrand} ${product.series}`;
    }
    if ($w('#modalProductDescription')) {
      $w('#modalProductDescription').text = product.description;
    }
    if ($w('#modalProductPrice')) {
      $w('#modalProductPrice').text = product.calculatedPrice;
    }
  }
}

// Export key functions for testing
export { 
  currentUser, 
  selectedProducts, 
  currentQuote, 
  systemHealthy,
  loadWindowProducts,
  generateQuote,
  submitQuote
};