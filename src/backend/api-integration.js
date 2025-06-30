// Good Faith Exteriors - Velo Backend API Integration
// File: backend/api-integration.js

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

// Configuration with corrected backend URL
const FLASK_BACKEND_URL = 'https://default-837326026335.us-central1.run.app';

// API Helper Functions
async function getApiHeaders() {
    try {
        const apiKey = await getSecret('FLASK_API_KEY');
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': apiKey || 'default-key'
        };
    } catch (error) {
        console.error('Error getting API key:', error);
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }
}

// AI Analysis Functions
export async function analyzeWindowImage(imageData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/ai-analysis`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                image_data: imageData,
                analysis_type: 'window_assessment',
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        const result = await response.json();
        console.log('AI Analysis completed:', result);
        return result;
    } catch (error) {
        console.error('Error in AI analysis:', error);
        throw error;
    }
}

export async function getWindowRecommendations(analysisData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/window-recommendations`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(analysisData)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting recommendations:', error);
        throw error;
    }
}

// Lead Processing Functions
export async function processLeadWithAI(leadData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/leads`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                ...leadData,
                source: 'wix_site',
                processed_date: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Lead processing failed: ${response.status}`);
        }
        const result = await response.json();
        console.log('Lead processed by AI:', result);
        return result;
    } catch (error) {
        console.error('Error processing lead:', error);
        throw error;
    }
}

export async function enrichLeadData(leadId, leadData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/leads/${leadId}/enrich`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(leadData)
        });
        if (!response.ok) {
            throw new Error(`Lead enrichment failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error enriching lead data:', error);
        throw error;
    }
}

// Quote Generation Functions
export async function generateQuotePDF(quoteData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/generate-pdf`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                quote_type: 'window_installation',
                customer_data: quoteData.customer,
                project_data: quoteData.project,
                window_selections: quoteData.windows,
                pricing_data: quoteData.pricing,
                generation_date: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`PDF generation failed: ${response.status}`);
        }
        const result = await response.json();
        console.log('PDF generated:', result);
        return result;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

export async function calculatePricing(projectData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/pricing-calculator`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(projectData)
        });
        if (!response.ok) {
            throw new Error(`Pricing calculation failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error calculating pricing:', error);
        throw error;
    }
}

// Customer Service Functions
export async function sendCustomerServiceMessage(messageData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/customer-service`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                message: messageData.message,
                customer_id: messageData.customerId,
                conversation_id: messageData.conversationId,
                message_type: messageData.type || 'customer_inquiry',
                timestamp: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Customer service request failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error in customer service:', error);
        throw error;
    }
}

export async function getCustomerServiceHistory(customerId) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/customer-service/history/${customerId}`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`History retrieval failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting service history:', error);
        throw error;
    }
}

// Window Products Functions
export async function syncWindowProducts() {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/window-products`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`Product sync failed: ${response.status}`);
        }
        const result = await response.json();
        console.log('Products synced:', result.length);
        return result;
    } catch (error) {
        console.error('Error syncing products:', error);
        throw error;
    }
}

export async function getMarketPricing(productFilters) {
    try {
        const headers = await getApiHeaders();
        const queryParams = new URLSearchParams(productFilters).toString();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/market-pricing?${queryParams}`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`Market pricing request failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error getting market pricing:', error);
        throw error;
    }
}

// Project Management Functions
export async function updateProjectStatus(projectId, statusData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/projects/${projectId}/status`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify({
                ...statusData,
                updated_date: new Date().toISOString()
            })
        });
        if (!response.ok) {
            throw new Error(`Project update failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

// Contractor Functions
export async function findAvailableContractors(projectData) {
    try {
        const headers = await getApiHeaders();
        const response = await fetch(`${FLASK_BACKEND_URL}/api/contractors/available`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(projectData)
        });
        if (!response.ok) {
            throw new Error(`Contractor search failed: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error finding contractors:', error);
        throw error;
    }
}

// Health Check Function
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${FLASK_BACKEND_URL}/health`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return {
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Backend health check failed:', error);
        return {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Utility Functions
export function formatApiResponse(response, operation) {
    return {
        success: true,
        operation: operation,
        data: response,
        timestamp: new Date().toISOString()
    };
}

export function formatApiError(error, operation) {
    return {
        success: false,
        operation: operation,
        error: error.message,
        timestamp: new Date().toISOString()
    };
}