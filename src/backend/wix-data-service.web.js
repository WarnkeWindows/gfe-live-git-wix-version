// unified-wix-data-service.web.js
// Good Faith Exteriors - Comprehensive Wix Data Service for All Exterior Home Remodeling Services
// Handles all CRUD operations, logging, and database interactions

import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';

// ============================================================================
// COLLECTION CONSTANTS AND MAPPINGS
// ============================================================================

const COLLECTIONS = {
  // Customer and Lead Management
  CRM_LEADS: 'CRMLeads',
  
  // AI Analysis and Measurements
  AI_MEASUREMENT_SERVICE: 'AIMeasurementService',
  
  // Product and Pricing
  UNIFIED_PRODUCTS_CATALOG: 'UnifiedProductsCatalog',
  UNIFIED_QUOTE_ITEMS: 'UnifiedQuoteItems',
  
  // Project Management
  PROJECTS: 'Projects',
  
  // System Logging and Analytics
  ANALYTICS: 'Analytics',
  SYSTEM_LOGS: 'SystemLogs',
  
  // Configuration
  CONFIGURATION: 'Configuration',
  
  // Materials and Options
  MATERIALS: 'Materials',
  BRANDS: 'Brands',
  WINDOW_TYPES: 'WindowTypes',
  DOOR_TYPES: 'DoorTypes',
  ROOFING_TYPES: 'RoofingTypes',
  SIDING_TYPES: 'SidingTypes',
  GUTTER_TYPES: 'GutterTypes'
};

// Default field mappings for data validation
const FIELD_MAPPINGS = {
  [COLLECTIONS.CRM_LEADS]: {
    required: ['fullName', 'email', 'phone', 'projectType'],
    optional: ['streetAddress', 'city', 'state', 'zipCode', 'servicesInterested', 'estimatedBudget']
  },
  [COLLECTIONS.AI_MEASUREMENT_SERVICE]: {
    required: ['sessionId', 'userEmail', 'componentType', 'analysisType'],
    optional: ['aiAnalysisData', 'measuredWidth', 'measuredHeight', 'confidencePercent']
  },
  [COLLECTIONS.UNIFIED_QUOTE_ITEMS]: {
    required: ['quoteItemId', 'sessionId', 'customerEmail', 'service', 'productName', 'quantity', 'unitPrice', 'totalItemCost'],
    optional: ['productId', 'material', 'color', 'style', 'width', 'height']
  }
};

// ============================================================================
// CORE DATA SERVICE FUNCTIONS
// ============================================================================

// Generic function to save data to any collection
export async function saveToCollection(collectionName, data, options = {}) {
  try {
    // Validate collection exists
    if (!Object.values(COLLECTIONS).includes(collectionName)) {
      throw new Error(`Invalid collection name: ${collectionName}`);
    }

    // Sanitize and validate data
    const sanitizedData = sanitizeData(data, collectionName);
    
    // Add system fields
    sanitizedData._createdDate = new Date();
    sanitizedData.lastModified = new Date();
    
    if (options.generateId && !sanitizedData._id) {
      sanitizedData._id = generateUniqueId(collectionName);
    }

    // Save to Wix Data
    const result = await wixData.save(collectionName, sanitizedData);
    
    await logSystemEvent('data_saved', {
      collection: collectionName,
      recordId: result._id,
      success: true
    });

    return createSuccessResponse(result);

  } catch (error) {
    await logSystemEvent('data_save_error', {
      collection: collectionName,
      error: error.message,
      data: JSON.stringify(data).substring(0, 200)
    });
    
    throw new Error(`Failed to save to ${collectionName}: ${error.message}`);
  }
}

// Generic function to query data from any collection
export async function queryCollection(collectionName, queryOptions = {}) {
  try {
    let query = wixData.query(collectionName);
    
    // Apply filters
    if (queryOptions.filters) {
      queryOptions.filters.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.contains(filter.field, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.field, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.field, filter.value);
            break;
          case 'between':
            query = query.between(filter.field, filter.value.min, filter.value.max);
            break;
          default:
            query = query.eq(filter.field, filter.value);
        }
      });
    }
    
    // Apply sorting
    if (queryOptions.sort) {
      if (queryOptions.sort.descending) {
        query = query.descending(queryOptions.sort.field);
      } else {
        query = query.ascending(queryOptions.sort.field);
      }
    }
    
    // Apply pagination
    if (queryOptions.limit) {
      query = query.limit(queryOptions.limit);
    }
    
    if (queryOptions.skip) {
      query = query.skip(queryOptions.skip);
    }

    const results = await query.find();
    
    await logAnalyticsEvent('data_queried', {
      collection: collectionName,
      resultCount: results.items.length,
      totalCount: results.totalCount
    });

    return createSuccessResponse({
      items: results.items,
      totalCount: results.totalCount,
      currentPage: results.currentPage,
      hasNext: results.hasNext(),
      hasPrev: results.hasPrev()
    });

  } catch (error) {
    await logSystemEvent('data_query_error', {
      collection: collectionName,
      error: error.message,
      queryOptions: JSON.stringify(queryOptions)
    });
    
    throw new Error(`Failed to query ${collectionName}: ${error.message}`);
  }
}

// Update existing record
export async function updateRecord(collectionName, recordId, updateData) {
  try {
    const sanitizedData = sanitizeData(updateData, collectionName);
    sanitizedData._id = recordId;
    sanitizedData.lastModified = new Date();

    const result = await wixData.update(collectionName, sanitizedData);
    
    await logSystemEvent('data_updated', {
      collection: collectionName,
      recordId: recordId,
      success: true
    });

    return createSuccessResponse(result);

  } catch (error) {
    await logSystemEvent('data_update_error', {
      collection: collectionName,
      recordId: recordId,
      error: error.message
    });
    
    throw new Error(`Failed to update record in ${collectionName}: ${error.message}`);
  }
}

// Delete record
export async function deleteRecord(collectionName, recordId) {
  try {
    await wixData.remove(collectionName, recordId);
    
    await logSystemEvent('data_deleted', {
      collection: collectionName,
      recordId: recordId,
      success: true
    });

    return createSuccessResponse({ deleted: true, recordId: recordId });

  } catch (error) {
    await logSystemEvent('data_delete_error', {
      collection: collectionName,
      recordId: recordId,
      error: error.message
    });
    
    throw new Error(`Failed to delete record from ${collectionName}: ${error.message}`);
  }
}

// ============================================================================
// CUSTOMER MANAGEMENT FUNCTIONS
// ============================================================================

export async function createOrUpdateCustomer(customerInfo) {
  try {
    // Check if customer exists by email
    const existingCustomer = await queryCollection(COLLECTIONS.CRM_LEADS, {
      filters: [{ field: 'email', operator: 'eq', value: customerInfo.email }],
      limit: 1
    });

    let customer;
    if (existingCustomer.data.items.length > 0) {
      // Update existing customer
      const existingRecord = existingCustomer.data.items[0];
      const updateData = {
        ...customerInfo,
        lastContactDate: new Date(),
        leadStatus: customerInfo.leadStatus || existingRecord.leadStatus || 'Contacted'
      };
      
      customer = await updateRecord(COLLECTIONS.CRM_LEADS, existingRecord._id, updateData);
    } else {
      // Create new customer
      const newCustomerData = {
        ...customerInfo,
        leadId: generateUniqueId('lead'),
        leadStatus: customerInfo.leadStatus || 'New',
        leadSource: customerInfo.leadSource || 'Website',
        priority: customerInfo.priority || 'Medium',
        createdDate: new Date(),
        lastContactDate: new Date()
      };
      
      customer = await saveToCollection(COLLECTIONS.CRM_LEADS, newCustomerData, { generateId: true });
    }

    await logAnalyticsEvent('customer_created_or_updated', {
      customerEmail: customerInfo.email,
      isNew: existingCustomer.data.items.length === 0,
      projectType: customerInfo.projectType
    });

    return customer;

  } catch (error) {
    await logSystemEvent('customer_management_error', {
      email: customerInfo.email,
      error: error.message
    });
    
    throw error;
  }
}

export async function getCustomerByEmail(email) {
  try {
    const result = await queryCollection(COLLECTIONS.CRM_LEADS, {
      filters: [{ field: 'email', operator: 'eq', value: email }],
      limit: 1
    });

    if (result.data.items.length > 0) {
      return createSuccessResponse(result.data.items[0]);
    } else {
      return createErrorResponse('Customer not found');
    }

  } catch (error) {
    await logSystemEvent('get_customer_error', {
      email: email,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// AI ANALYSIS RESULT FUNCTIONS
// ============================================================================

export async function saveAIAnalysisResult(analysisData) {
  try {
    const analysisRecord = {
      sessionId: analysisData.sessionId || generateUniqueId('session'),
      userEmail: analysisData.userEmail,
      componentType: analysisData.componentType,
      analysisType: analysisData.analysisType || 'comprehensive',
      aiAnalysisData: JSON.stringify(analysisData.analysisData || {}),
      measuredWidth: analysisData.measuredWidth || null,
      measuredHeight: analysisData.measuredHeight || null,
      measuredArea: analysisData.measuredArea || null,
      confidencePercent: analysisData.confidencePercent || 0,
      detectedType: analysisData.detectedType || '',
      detectedMaterial: analysisData.detectedMaterial || '',
      detectedCondition: analysisData.detectedCondition || '',
      aiRecommendations: analysisData.aiRecommendations || '',
      processingMetadata: JSON.stringify(analysisData.processingMetadata || {}),
      imageProcessed: true,
      createdDate: new Date()
    };

    const result = await saveToCollection(COLLECTIONS.AI_MEASUREMENT_SERVICE, analysisRecord, { generateId: true });

    await logAnalyticsEvent('ai_analysis_saved', {
      componentType: analysisData.componentType,
      confidence: analysisData.confidencePercent,
      userEmail: analysisData.userEmail
    });

    return result;

  } catch (error) {
    await logSystemEvent('ai_analysis_save_error', {
      componentType: analysisData.componentType,
      userEmail: analysisData.userEmail,
      error: error.message
    });
    
    throw error;
  }
}

export async function getAIAnalysisBySession(sessionId) {
  try {
    const result = await queryCollection(COLLECTIONS.AI_MEASUREMENT_SERVICE, {
      filters: [{ field: 'sessionId', operator: 'eq', value: sessionId }],
      sort: { field: '_createdDate', descending: true },
      limit: 10
    });

    return result;

  } catch (error) {
    await logSystemEvent('get_ai_analysis_error', {
      sessionId: sessionId,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// QUOTE MANAGEMENT FUNCTIONS
// ============================================================================

export async function createQuoteItem(quoteItemData) {
  try {
    const quoteItem = {
      quoteItemId: generateUniqueId('quote'),
      sessionId: quoteItemData.sessionId || generateUniqueId('session'),
      customerEmail: quoteItemData.customerEmail,
      service: quoteItemData.service,
      productId: quoteItemData.productId || '',
      productName: quoteItemData.productName,
      manufacturer: quoteItemData.manufacturer || '',
      productType: quoteItemData.productType || '',
      material: quoteItemData.material || '',
      color: quoteItemData.color || '',
      style: quoteItemData.style || '',
      width: quoteItemData.width || null,
      height: quoteItemData.height || null,
      area: quoteItemData.area || null,
      quantity: quoteItemData.quantity || 1,
      unitPrice: quoteItemData.unitPrice || 0,
      materialCost: quoteItemData.materialCost || 0,
      laborCost: quoteItemData.laborCost || 0,
      totalItemCost: quoteItemData.totalItemCost || 0,
      qualityLevel: quoteItemData.qualityLevel || 'better',
      aiGenerated: quoteItemData.aiGenerated || false,
      aiAnalysisId: quoteItemData.aiAnalysisId || '',
      customerNotes: quoteItemData.customerNotes || '',
      approvalStatus: 'Pending',
      itemStatus: 'Quoted',
      createdDate: new Date()
    };

    const result = await saveToCollection(COLLECTIONS.UNIFIED_QUOTE_ITEMS, quoteItem, { generateId: true });

    await logAnalyticsEvent('quote_item_created', {
      service: quoteItemData.service,
      customerEmail: quoteItemData.customerEmail,
      totalCost: quoteItemData.totalItemCost
    });

    return result;

  } catch (error) {
    await logSystemEvent('quote_item_creation_error', {
      customerEmail: quoteItemData.customerEmail,
      service: quoteItemData.service,
      error: error.message
    });
    
    throw error;
  }
}

export async function getQuoteItemsBySession(sessionId) {
  try {
    const result = await queryCollection(COLLECTIONS.UNIFIED_QUOTE_ITEMS, {
      filters: [{ field: 'sessionId', operator: 'eq', value: sessionId }],
      sort: { field: '_createdDate', descending: false }
    });

    return result;

  } catch (error) {
    await logSystemEvent('get_quote_items_error', {
      sessionId: sessionId,
      error: error.message
    });
    
    throw error;
  }
}

export async function getQuoteItemsByCustomer(customerEmail) {
  try {
    const result = await queryCollection(COLLECTIONS.UNIFIED_QUOTE_ITEMS, {
      filters: [{ field: 'customerEmail', operator: 'eq', value: customerEmail }],
      sort: { field: '_createdDate', descending: true },
      limit: 50
    });

    return result;

  } catch (error) {
    await logSystemEvent('get_customer_quotes_error', {
      customerEmail: customerEmail,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// PRODUCT CATALOG FUNCTIONS
// ============================================================================

export async function getProductsByCategory(category, filters = {}) {
  try {
    const queryOptions = {
      filters: [
        { field: 'category', operator: 'eq', value: category },
        { field: 'isActive', operator: 'eq', value: true }
      ],
      sort: { field: 'popularityScore', descending: true },
      limit: filters.limit || 50
    };

    // Add additional filters
    if (filters.material) {
      queryOptions.filters.push({ field: 'material', operator: 'eq', value: filters.material });
    }
    
    if (filters.priceRange) {
      queryOptions.filters.push({ 
        field: 'basePrice', 
        operator: 'between', 
        value: { min: filters.priceRange.min, max: filters.priceRange.max }
      });
    }

    const result = await queryCollection(COLLECTIONS.UNIFIED_PRODUCTS_CATALOG, queryOptions);
    
    return result;

  } catch (error) {
    await logSystemEvent('get_products_error', {
      category: category,
      error: error.message
    });
    
    throw error;
  }
}

export async function getProductById(productId) {
  try {
    const result = await queryCollection(COLLECTIONS.UNIFIED_PRODUCTS_CATALOG, {
      filters: [{ field: 'productId', operator: 'eq', value: productId }],
      limit: 1
    });

    if (result.data.items.length > 0) {
      return createSuccessResponse(result.data.items[0]);
    } else {
      return createErrorResponse('Product not found');
    }

  } catch (error) {
    await logSystemEvent('get_product_error', {
      productId: productId,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// PROJECT MANAGEMENT FUNCTIONS
// ============================================================================

export async function createProject(projectData) {
  try {
    const project = {
      projectId: generateUniqueId('project'),
      projectName: projectData.projectName || `Project for ${projectData.customerEmail}`,
      customerEmail: projectData.customerEmail,
      services: projectData.services || [],
      projectType: projectData.projectType || 'Replacement',
      projectScope: projectData.projectScope || 'Single Service',
      projectStatus: 'Planning',
      overallProgress: 0,
      totalProjectValue: projectData.totalProjectValue || 0,
      estimatedStartDate: projectData.estimatedStartDate || null,
      estimatedCompletionDate: projectData.estimatedCompletionDate || null,
      createdDate: new Date()
    };

    const result = await saveToCollection(COLLECTIONS.PROJECTS, project, { generateId: true });

    await logAnalyticsEvent('project_created', {
      customerEmail: projectData.customerEmail,
      services: projectData.services,
      projectValue: projectData.totalProjectValue
    });

    return result;

  } catch (error) {
    await logSystemEvent('project_creation_error', {
      customerEmail: projectData.customerEmail,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// LOGGING AND ANALYTICS FUNCTIONS
// ============================================================================

export async function logSystemEvent(event, eventData = {}) {
  try {
    const logEntry = {
      event: event,
      eventData: JSON.stringify(eventData),
      timestamp: new Date(),
      severity: eventData.severity || 'info',
      source: 'unified-data-service',
      sessionId: eventData.sessionId || '',
      userEmail: eventData.userEmail || '',
      requestId: eventData.requestId || generateUniqueId('req')
    };

    // Don't await this to avoid blocking the main operation
    wixData.save(COLLECTIONS.SYSTEM_LOGS, logEntry).catch(error => {
      console.error('Failed to save system log:', error);
    });

    return true;

  } catch (error) {
    console.error('Failed to log system event:', error);
    return false;
  }
}

export async function logAnalyticsEvent(event, eventProperties = {}) {
  try {
    const analyticsEntry = {
      event: event,
      eventProperties: eventProperties,
      timestamp: new Date(),
      sessionId: eventProperties.sessionId || '',
      userId: eventProperties.userId || '',
      userAgent: eventProperties.userAgent || '',
      pageURL: eventProperties.pageURL || '',
      referrer: eventProperties.referrer || '',
      deviceType: eventProperties.deviceType || 'desktop',
      eventValue: eventProperties.eventValue || 0
    };

    // Don't await this to avoid blocking the main operation
    wixData.save(COLLECTIONS.ANALYTICS, analyticsEntry).catch(error => {
      console.error('Failed to save analytics event:', error);
    });

    return true;

  } catch (error) {
    console.error('Failed to log analytics event:', error);
    return false;
  }
}

// ============================================================================
// SYSTEM HEALTH AND MONITORING
// ============================================================================

export async function checkDatabaseHealth() {
  try {
    const healthChecks = [];

    // Test basic connectivity to each collection
    for (const collection of Object.values(COLLECTIONS)) {
      try {
        const testQuery = await wixData.query(collection).limit(1).find();
        healthChecks.push({
          collection: collection,
          status: 'healthy',
          recordCount: testQuery.totalCount
        });
      } catch (error) {
        healthChecks.push({
          collection: collection,
          status: 'unhealthy',
          error: error.message
        });
      }
    }

    const healthyCollections = healthChecks.filter(check => check.status === 'healthy').length;
    const totalCollections = healthChecks.length;

    return {
      overall: healthyCollections === totalCollections ? 'healthy' : 'degraded',
      healthyCollections: healthyCollections,
      totalCollections: totalCollections,
      details: healthChecks,
      timestamp: new Date()
    };

  } catch (error) {
    return {
      overall: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function sanitizeData(data, collectionName) {
  const sanitized = { ...data };
  
  // Remove null and undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  // Convert numbers to strings for Wix compatibility where needed
  if (collectionName === COLLECTIONS.CRM_LEADS) {
    if (sanitized.phone) sanitized.phone = String(sanitized.phone);
    if (sanitized.zipCode) sanitized.zipCode = String(sanitized.zipCode);
  }

  // Validate required fields
  const fieldMapping = FIELD_MAPPINGS[collectionName];
  if (fieldMapping) {
    for (const requiredField of fieldMapping.required) {
      if (!sanitized[requiredField]) {
        throw new Error(`Required field missing: ${requiredField}`);
      }
    }
  }

  return sanitized;
}

function generateUniqueId(prefix = 'gfe') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

export function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    data: data,
    message: message,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(message, errorCode = 'GENERAL_ERROR', details = null) {
  return {
    success: false,
    error: message,
    errorCode: errorCode,
    details: details,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

export async function getConfiguration(configKey) {
  try {
    const result = await queryCollection(COLLECTIONS.CONFIGURATION, {
      filters: [{ field: 'configKey', operator: 'eq', value: configKey }],
      limit: 1
    });

    if (result.data.items.length > 0) {
      return createSuccessResponse(result.data.items[0].configValue);
    } else {
      return createErrorResponse('Configuration not found');
    }

  } catch (error) {
    await logSystemEvent('get_configuration_error', {
      configKey: configKey,
      error: error.message
    });
    
    throw error;
  }
}

export async function setConfiguration(configKey, configValue, description = '') {
  try {
    const configData = {
      configKey: configKey,
      configValue: configValue,
      configDescription: description,
      isActive: true,
      lastModified: new Date()
    };

    // Check if config exists
    const existing = await getConfiguration(configKey);
    
    let result;
    if (existing.success) {
      // Update existing
      result = await updateRecord(COLLECTIONS.CONFIGURATION, existing.data._id, configData);
    } else {
      // Create new
      result = await saveToCollection(COLLECTIONS.CONFIGURATION, configData, { generateId: true });
    }

    return result;

  } catch (error) {
    await logSystemEvent('set_configuration_error', {
      configKey: configKey,
      error: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  COLLECTIONS,
  FIELD_MAPPINGS,
  generateUniqueId
};