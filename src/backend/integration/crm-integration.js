/**
 * CRM Integration Service - Good Faith Exteriors
 * backend/integrations/crm-integration.js
 * 
 * CRM integration for lead management and customer tracking
 * Consistent with updated backend patterns
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { 
    COLLECTIONS,
    STATUS_TYPES,
    ERROR_CODES,
    BUSINESS_CONSTANTS 
} from '../config/constants.js';
import { 
    validateCustomerInfo,
    generateUniqueId,
    sanitizeForWix
} from '../utils/validation.js';
import logger from '../utils/logger.js';
import { 
    createSuccessResponse, 
    createErrorResponse, 
    handleError,
    logSystemEvent,
    createOrUpdateCustomer
} from '../services/wix-data-service.jsw';

// =====================================================================
// CRM CONFIGURATION
// =====================================================================

const CRM_CONFIG = {
    PIPEDRIVE: {
        baseUrl: 'https://api.pipedrive.com/v1',
        endpoints: {
            persons: '/persons',
            deals: '/deals',
            activities: '/activities',
            notes: '/notes'
        }
    },
    HUBSPOT: {
        baseUrl: 'https://api.hubapi.com',
        endpoints: {
            contacts: '/crm/v3/objects/contacts',
            deals: '/crm/v3/objects/deals',
            companies: '/crm/v3/objects/companies'
        }
    },
    SALESFORCE: {
        baseUrl: 'https://your-instance.salesforce.com/services/data/v58.0',
        endpoints: {
            leads: '/sobjects/Lead',
            contacts: '/sobjects/Contact',
            opportunities: '/sobjects/Opportunity'
        }
    }
};

// =====================================================================
// CRM INTEGRATION CLASS
// =====================================================================

class CRMIntegration {
    constructor(crmType = 'PIPEDRIVE') {
        this.crmType = crmType;
        this.config = CRM_CONFIG[crmType];
        this.apiKey = null;
        this.accessToken = null;
    }

    /**
     * Initializes CRM connection
     */
    async initialize() {
        try {
            switch (this.crmType) {
                case 'PIPEDRIVE':
                    this.apiKey = await getSecret('PIPEDRIVE_API_KEY');
                    break;
                case 'HUBSPOT':
                    this.accessToken = await getSecret('HUBSPOT_ACCESS_TOKEN');
                    break;
                case 'SALESFORCE':
                    this.accessToken = await getSecret('SALESFORCE_ACCESS_TOKEN');
                    break;
                default:
                    throw new Error(`Unsupported CRM type: ${this.crmType}`);
            }

            if (!this.apiKey && !this.accessToken) {
                throw new Error(`${this.crmType} credentials not found`);
            }

            return true;

        } catch (error) {
            await logger.error(`Failed to initialize ${this.crmType} CRM`, { crmType: this.crmType }, error);
            throw error;
        }
    }

    /**
     * Makes authenticated request to CRM API
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        await this.initialize();

        const url = `${this.config.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add authentication headers based on CRM type
        switch (this.crmType) {
            case 'PIPEDRIVE':
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                break;
            case 'HUBSPOT':
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                break;
            case 'SALESFORCE':
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                break;
        }

        const requestOptions = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            requestOptions.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${this.crmType} API error: ${response.status} - ${errorText}`);
            }

            return await response.json();

        } catch (error) {
            await logger.error(`${this.crmType} API request failed`, {
                endpoint: endpoint,
                method: method,
                crmType: this.crmType
            }, error);
            throw error;
        }
    }

    /**
     * Creates a lead in CRM
     */
    async createLead(leadData) {
        try {
            const crmLead = this.transformToLeadFormat(leadData);
            
            let result;
            switch (this.crmType) {
                case 'PIPEDRIVE':
                    result = await this.createPipedriveLead(crmLead);
                    break;
                case 'HUBSPOT':
                    result = await this.createHubSpotLead(crmLead);
                    break;
                case 'SALESFORCE':
                    result = await this.createSalesforceLead(crmLead);
                    break;
                default:
                    throw new Error(`Lead creation not implemented for ${this.crmType}`);
            }

            await logger.info(`Lead created in ${this.crmType}`, {
                crmType: this.crmType,
                leadId: result.id,
                customerEmail: leadData.customerEmail
            });

            return result;

        } catch (error) {
            await logger.error(`Failed to create lead in ${this.crmType}`, {
                crmType: this.crmType,
                leadData: leadData
            }, error);
            throw error;
        }
    }

    /**
     * Updates a lead in CRM
     */
    async updateLead(leadId, updateData) {
        try {
            const crmUpdate = this.transformToLeadFormat(updateData);
            
            let result;
            switch (this.crmType) {
                case 'PIPEDRIVE':
                    result = await this.updatePipedriveLead(leadId, crmUpdate);
                    break;
                case 'HUBSPOT':
                    result = await this.updateHubSpotLead(leadId, crmUpdate);
                    break;
                case 'SALESFORCE':
                    result = await this.updateSalesforceLead(leadId, crmUpdate);
                    break;
                default:
                    throw new Error(`Lead update not implemented for ${this.crmType}`);
            }

            await logger.info(`Lead updated in ${this.crmType}`, {
                crmType: this.crmType,
                leadId: leadId
            });

            return result;

        } catch (error) {
            await logger.error(`Failed to update lead in ${this.crmType}`, {
                crmType: this.crmType,
                leadId: leadId
            }, error);
            throw error;
        }
    }

    /**
     * Transforms lead data to CRM-specific format
     */
    transformToLeadFormat(leadData) {
        const baseData = {
            name: leadData.customerName || 'Unknown',
            email: leadData.customerEmail,
            phone: leadData.customerPhone,
            address: leadData.customerAddress,
            notes: leadData.notes || '',
            source: leadData.leadSource || 'website',
            status: leadData.leadStatus || STATUS_TYPES.LEAD_NEW,
            value: leadData.estimatedValue || 0,
            customFields: {
                windowType: leadData.windowType,
                material: leadData.material,
                quantity: leadData.quantity,
                sessionId: leadData.sessionId
            }
        };

        return baseData;
    }

    // =====================================================================
    // PIPEDRIVE SPECIFIC METHODS
    // =====================================================================

    async createPipedriveLead(leadData) {
        const pipedriveData = {
            name: leadData.name,
            email: [{ value: leadData.email, primary: true }],
            phone: leadData.phone ? [{ value: leadData.phone, primary: true }] : [],
            org_name: leadData.company || '',
            notes: leadData.notes
        };

        const person = await this.makeRequest(this.config.endpoints.persons, 'POST', pipedriveData);

        // Create deal for the person
        const dealData = {
            title: `Window Replacement - ${leadData.name}`,
            person_id: person.data.id,
            value: leadData.value,
            currency: 'USD',
            status: 'open',
            stage_id: 1, // Adjust based on your pipeline
            notes: `Lead Source: ${leadData.source}\nWindow Details: ${JSON.stringify(leadData.customFields)}`
        };

        const deal = await this.makeRequest(this.config.endpoints.deals, 'POST', dealData);

        return {
            id: deal.data.id,
            personId: person.data.id,
            crmType: 'PIPEDRIVE',
            externalId: deal.data.id
        };
    }

    async updatePipedriveLead(leadId, updateData) {
        const updatePayload = {
            name: updateData.name,
            notes: updateData.notes,
            value: updateData.value
        };

        const result = await this.makeRequest(`${this.config.endpoints.deals}/${leadId}`, 'PUT', updatePayload);
        
        return {
            id: leadId,
            updated: true,
            crmType: 'PIPEDRIVE'
        };
    }

    // =====================================================================
    // HUBSPOT SPECIFIC METHODS
    // =====================================================================

    async createHubSpotLead(leadData) {
        const hubspotData = {
            properties: {
                firstname: leadData.name.split(' ')[0] || '',
                lastname: leadData.name.split(' ').slice(1).join(' ') || '',
                email: leadData.email,
                phone: leadData.phone || '',
                address: leadData.address || '',
                notes_last_contacted: leadData.notes,
                lead_source: leadData.source,
                lifecyclestage: 'lead',
                window_type: leadData.customFields.windowType,
                window_material: leadData.customFields.material,
                window_quantity: leadData.customFields.quantity
            }
        };

        const contact = await this.makeRequest(this.config.endpoints.contacts, 'POST', hubspotData);

        // Create deal
        const dealData = {
            properties: {
                dealname: `Window Replacement - ${leadData.name}`,
                amount: leadData.value,
                dealstage: 'appointmentscheduled', // Adjust based on your pipeline
                pipeline: 'default',
                closedate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            },
            associations: [
                {
                    to: { id: contact.id },
                    types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Contact to Deal
                }
            ]
        };

        const deal = await this.makeRequest(this.config.endpoints.deals, 'POST', dealData);

        return {
            id: deal.id,
            contactId: contact.id,
            crmType: 'HUBSPOT',
            externalId: deal.id
        };
    }

    async updateHubSpotLead(leadId, updateData) {
        const updatePayload = {
            properties: {
                dealname: updateData.name,
                amount: updateData.value,
                notes_last_contacted: updateData.notes
            }
        };

        const result = await this.makeRequest(`${this.config.endpoints.deals}/${leadId}`, 'PATCH', updatePayload);
        
        return {
            id: leadId,
            updated: true,
            crmType: 'HUBSPOT'
        };
    }

    // =====================================================================
    // SALESFORCE SPECIFIC METHODS
    // =====================================================================

    async createSalesforceLead(leadData) {
        const salesforceData = {
            FirstName: leadData.name.split(' ')[0] || '',
            LastName: leadData.name.split(' ').slice(1).join(' ') || 'Unknown',
            Email: leadData.email,
            Phone: leadData.phone || '',
            Street: leadData.address || '',
            Company: 'Good Faith Exteriors Lead',
            LeadSource: leadData.source,
            Status: 'Open - Not Contacted',
            Description: leadData.notes,
            Window_Type__c: leadData.customFields.windowType,
            Window_Material__c: leadData.customFields.material,
            Window_Quantity__c: leadData.customFields.quantity
        };

        const lead = await this.makeRequest(this.config.endpoints.leads, 'POST', salesforceData);

        return {
            id: lead.id,
            crmType: 'SALESFORCE',
            externalId: lead.id
        };
    }

    async updateSalesforceLead(leadId, updateData) {
        const updatePayload = {
            Description: updateData.notes,
            Status: this.mapStatusToSalesforce(updateData.status)
        };

        const result = await this.makeRequest(`${this.config.endpoints.leads}/${leadId}`, 'PATCH', updatePayload);
        
        return {
            id: leadId,
            updated: true,
            crmType: 'SALESFORCE'
        };
    }

    /**
     * Maps internal status to Salesforce status
     */
    mapStatusToSalesforce(status) {
        const statusMap = {
            [STATUS_TYPES.LEAD_NEW]: 'Open - Not Contacted',
            [STATUS_TYPES.LEAD_CONTACTED]: 'Working - Contacted',
            [STATUS_TYPES.LEAD_QUALIFIED]: 'Qualified',
            [STATUS_TYPES.LEAD_QUOTED]: 'Qualified',
            [STATUS_TYPES.LEAD_CONVERTED]: 'Closed - Converted',
            [STATUS_TYPES.LEAD_LOST]: 'Closed - Not Converted'
        };

        return statusMap[status] || 'Open - Not Contacted';
    }

    /**
     * Syncs lead data between Wix and CRM
     */
    async syncLead(customerData, quoteData = null) {
        try {
            // Prepare lead data
            const leadData = {
                customerName: customerData.customerName,
                customerEmail: customerData.customerEmail,
                customerPhone: customerData.customerPhone,
                customerAddress: customerData.customerAddress,
                notes: customerData.notes,
                leadSource: customerData.leadSource || 'website',
                leadStatus: customerData.leadStatus || STATUS_TYPES.LEAD_NEW,
                estimatedValue: quoteData?.totalPrice || 0,
                windowType: quoteData?.windowType,
                material: quoteData?.material,
                quantity: quoteData?.quantity,
                sessionId: quoteData?.sessionId
            };

            // Create lead in CRM
            const crmResult = await this.createLead(leadData);

            // Update customer record with CRM ID
            const customerUpdate = {
                ...customerData,
                crmId: crmResult.externalId,
                crmType: this.crmType,
                lastSyncDate: new Date()
            };

            await createOrUpdateCustomer(customerUpdate);

            await logSystemEvent({
                eventType: 'crm_lead_synced',
                message: `Lead synced to ${this.crmType}`,
                details: {
                    customerEmail: customerData.customerEmail,
                    crmType: this.crmType,
                    crmId: crmResult.externalId
                }
            });

            return createSuccessResponse({
                crmResult: crmResult,
                customerUpdated: true
            }, `Lead synced to ${this.crmType} successfully`);

        } catch (error) {
            return handleError(error, 'syncLead');
        }
    }

    /**
     * Checks CRM service health
     */
    async healthCheck() {
        try {
            // Test API connectivity with a simple request
            let testEndpoint;
            switch (this.crmType) {
                case 'PIPEDRIVE':
                    testEndpoint = '/users/me';
                    break;
                case 'HUBSPOT':
                    testEndpoint = '/crm/v3/objects/contacts?limit=1';
                    break;
                case 'SALESFORCE':
                    testEndpoint = '/limits';
                    break;
                default:
                    throw new Error(`Health check not implemented for ${this.crmType}`);
            }

            const startTime = Date.now();
            await this.makeRequest(testEndpoint);
            const responseTime = Date.now() - startTime;

            return {
                healthy: true,
                crmType: this.crmType,
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                healthy: false,
                crmType: this.crmType,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// =====================================================================
// CRM MANAGER CLASS
// =====================================================================

class CRMManager {
    constructor() {
        this.integrations = new Map();
        this.defaultCRM = 'PIPEDRIVE';
    }

    /**
     * Gets CRM integration instance
     */
    getCRM(crmType = this.defaultCRM) {
        if (!this.integrations.has(crmType)) {
            this.integrations.set(crmType, new CRMIntegration(crmType));
        }
        return this.integrations.get(crmType);
    }

    /**
     * Syncs lead to multiple CRMs
     */
    async syncToMultipleCRMs(customerData, quoteData = null, crmTypes = [this.defaultCRM]) {
        const results = [];

        for (const crmType of crmTypes) {
            try {
                const crm = this.getCRM(crmType);
                const result = await crm.syncLead(customerData, quoteData);
                results.push({
                    crmType: crmType,
                    success: result.success,
                    data: result.data,
                    error: result.error
                });
            } catch (error) {
                results.push({
                    crmType: crmType,
                    success: false,
                    error: error.message
                });
            }
        }

        return createSuccessResponse(results, 'Multi-CRM sync completed');
    }

    /**
     * Checks health of all configured CRMs
     */
    async healthCheckAll() {
        const results = {};

        for (const [crmType, integration] of this.integrations) {
            results[crmType] = await integration.healthCheck();
        }

        return results;
    }
}

// =====================================================================
// SINGLETON INSTANCES
// =====================================================================

const crmManager = new CRMManager();

// =====================================================================
// EXPORT FUNCTIONS
// =====================================================================

/**
 * Syncs customer lead to CRM
 */
export async function syncCustomerToCRM(customerData, quoteData = null, crmType = 'PIPEDRIVE') {
    try {
        const crm = crmManager.getCRM(crmType);
        return await crm.syncLead(customerData, quoteData);
    } catch (error) {
        return handleError(error, 'syncCustomerToCRM');
    }
}

/**
 * Updates lead status in CRM
 */
export async function updateLeadStatus(crmId, status, crmType = 'PIPEDRIVE') {
    try {
        const crm = crmManager.getCRM(crmType);
        return await crm.updateLead(crmId, { status: status });
    } catch (error) {
        return handleError(error, 'updateLeadStatus');
    }
}

/**
 * Checks CRM integration health
 */
export async function checkCRMHealth(crmType = 'PIPEDRIVE') {
    try {
        const crm = crmManager.getCRM(crmType);
        const health = await crm.healthCheck();
        return createSuccessResponse(health, 'CRM health check completed');
    } catch (error) {
        return handleError(error, 'checkCRMHealth');
    }
}

/**
 * Gets all CRM health statuses
 */
export async function getAllCRMHealth() {
    try {
        const health = await crmManager.healthCheckAll();
        return createSuccessResponse(health, 'All CRM health checks completed');
    } catch (error) {
        return handleError(error, 'getAllCRMHealth');
    }
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
    CRMIntegration,
    CRMManager,
    crmManager,
    syncCustomerToCRM,
    updateLeadStatus,
    checkCRMHealth,
    getAllCRMHealth
};

export default crmManager;

