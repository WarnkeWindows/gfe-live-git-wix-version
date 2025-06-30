// Good Faith Exteriors - Velo Backend Data Operations
// File: backend/data-operations.js

import wixData from 'wix-data';
import { getSecret } from 'wix-secrets-backend';

// Configuration
const COLLECTIONS = {
    LEADS: 'GFE_Leads',
    PRODUCTS: 'GFE_WindowProducts',
    CUSTOMERS: 'GFE_Customers',
    PROJECTS: 'GFE_Projects',
    QUOTES: 'GFE_Quotes',
    CONTRACTORS: 'GFE_Contractors',
    MARKET_PRICES: 'GFE_MarketPrices',
    PRICE_HISTORY: 'GFE_PriceHistory'
};

// Lead Management Functions
export async function createLead(leadData) {
    try {
        const leadRecord = {
            leadId: generateLeadId(),
            fullName: leadData.fullName,
            email: leadData.email,
            phone: leadData.phone,
            projectType: leadData.projectType,
            customerAddress: leadData.customerAddress,
            notes: leadData.notes,
            source: leadData.source || 'website',
            userType: leadData.userType || 'customer',
            status: 'new',
            priority: calculateLeadPriority(leadData),
            leadScore: calculateLeadScore(leadData),
            estimatedProjectValue: estimateProjectValue(leadData),
            followUpDate: calculateFollowUpDate(),
            assignedTo: await assignLead(leadData),
            assignedToTitle: "Project Manager - CEO", // NEW
            assignedToEmail: "nick@goodfaithexteriors.com", // NEW
            assignedToPhone: "651-416-8667", // NEW
            createdDate: new Date(),
            lastModified: new Date()
        };

        const result = await wixData.save(COLLECTIONS.LEADS, leadRecord);
        console.log('Lead created:', result._id);
        return result;
    } catch (error) {
        console.error('Error creating lead:', error);
        throw error;
    }
}

export async function updateLead(leadId, updateData) {
    try {
        const existingLead = await wixData.get(COLLECTIONS.LEADS, leadId);
        const updatedLead = {
            ...existingLead,
            ...updateData,
            lastModified: new Date()
        };

        const result = await wixData.update(COLLECTIONS.LEADS, updatedLead);
        console.log('Lead updated:', result._id);
        return result;
    } catch (error) {
        console.error('Error updating lead:', error);
        throw error;
    }
}

export async function getLeads(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.LEADS);
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        if (filters.priority) {
            query = query.eq('priority', filters.priority);
        }
        
        if (filters.assignedTo) {
            query = query.eq('assignedTo', filters.assignedTo);
        }

        const results = await query
            .descending('createdDate')
            .limit(50)
            .find();
            
        return results;
    } catch (error) {
        console.error('Error getting leads:', error);
        throw error;
    }
}

// Quote Management Functions
export async function createQuote(quoteData) {
    try {
        const quoteRecord = {
            quoteId: generateQuoteId(),
            leadId: quoteData.leadId,
            customerName: quoteData.customerName,
            customerEmail: quoteData.customerEmail,
            projectDetails: quoteData.projectDetails,
            windowSelections: quoteData.windowSelections,
            pricingBreakdown: quoteData.pricingBreakdown,
            totalAmount: quoteData.totalAmount,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            status: 'pending',
            createdDate: new Date(),
            lastModified: new Date()
        };

        const result = await wixData.save(COLLECTIONS.QUOTES, quoteRecord);
        console.log('Quote created:', result._id);
        return result;
    } catch (error) {
        console.error('Error creating quote:', error);
        throw error;
    }
}

// Window Products Management
export async function getWindowProducts(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.PRODUCTS);
        
        if (filters.brand) {
            query = query.eq('brand', filters.brand);
        }
        
        if (filters.windowType) {
            query = query.eq('windowType', filters.windowType);
        }
        
        if (filters.material) {
            query = query.eq('material', filters.material);
        }
        
        if (filters.isActive !== undefined) {
            query = query.eq('isActive', filters.isActive);
        }

        const results = await query
            .ascending('brand')
            .limit(100)
            .find();
            
        return results;
    } catch (error) {
        console.error('Error getting window products:', error);
        throw error;
    }
}

export async function updateWindowProduct(productId, productData) {
    try {
        const existingProduct = await wixData.get(COLLECTIONS.PRODUCTS, productId);
        const updatedProduct = {
            ...existingProduct,
            ...productData,
            lastModified: new Date()
        };

        const result = await wixData.update(COLLECTIONS.PRODUCTS, updatedProduct);
        console.log('Product updated:', result._id);
        return result;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
}

// Customer Management Functions
export async function createCustomer(customerData) {
    try {
        const customerRecord = {
            fullName: customerData.fullName,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address,
            userType: customerData.userType || 'customer',
            lastContact: new Date(),
            totalLeads: 1,
            leadHistory: [customerData.leadId],
            createdDate: new Date()
        };

        const result = await wixData.save(COLLECTIONS.CUSTOMERS, customerRecord);
        console.log('Customer created:', result._id);
        return result;
    } catch (error) {
        console.error('Error creating customer:', error);
        throw error;
    }
}

// Project Management Functions
export async function createProject(projectData) {
    try {
        const projectRecord = {
            leadId: projectData.leadId,
            leadRecordId: projectData.leadRecordId,
            customerName: projectData.customerName,
            customerEmail: projectData.customerEmail,
            projectType: projectData.projectType,
            projectAddress: projectData.projectAddress,
            status: 'planning',
            estimatedValue: projectData.estimatedValue,
            notes: projectData.notes,
            assignedTo: projectData.assignedTo,
            createdDate: new Date()
        };

        const result = await wixData.save(COLLECTIONS.PROJECTS, projectRecord);
        console.log('Project created:', result._id);
        return result;
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

// Contractor Management Functions
export async function getContractors(filters = {}) {
    try {
        let query = wixData.query(COLLECTIONS.CONTRACTORS);
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        if (filters.serviceAreas) {
            query = query.hasSome('serviceAreas', filters.serviceAreas);
        }

        const results = await query
            .ascending('businessName')
            .limit(50)
            .find();
            
        return results;
    } catch (error) {
        console.error('Error getting contractors:', error);
        throw error;
    }
}

// Utility Functions
function generateLeadId() {
    return 'GFE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function generateQuoteId() {
    return 'QTE-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function calculateLeadPriority(leadData) {
    if (leadData.projectType === 'full-home-replacement') return 'high';
    if (leadData.projectType === 'multiple-windows') return 'medium';
    return 'normal';
}

function calculateLeadScore(leadData) {
    let score = 50; // Base score
    
    if (leadData.phone) score += 20;
    if (leadData.customerAddress) score += 15;
    if (leadData.projectType === 'full-home-replacement') score += 25;
    if (leadData.notes && leadData.notes.length > 50) score += 10;
    
    return Math.min(score, 100);
}

function estimateProjectValue(leadData) {
    const baseValues = {
        'single-window': 800,
        'multiple-windows': 3500,
        'full-home-replacement': 15000,
        'commercial': 25000
    };

    const markup = 1.30; // Represents a 30% markup
    const baseValue = baseValues[leadData.projectType] || 1500;
    
    return baseValue * markup;
}

function calculateFollowUpDate() {
    const followUpDays = 3; // Follow up in 3 days
    return new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000);
}

async function assignLead(leadData) {
    // All new leads are assigned to Nick Warnke per system requirements.
    return "Nick Warnke";
}