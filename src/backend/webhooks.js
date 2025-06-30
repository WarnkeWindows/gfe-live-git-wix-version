// Good Faith Exteriors - Velo Backend Webhooks
// File: backend/webhooks.js

import { ok, badRequest, serverError } from 'wix-http-functions';
import { createLead, updateLead, createQuote } from './data-operations.js';
import { processLeadWithAI, generateQuotePDF, updateProjectStatus, sendCustomerServiceMessage } from './api-integration.js';

// Webhook: Lead Created
export async function post_leadCreated(request) {
    try {
        const leadData = await request.body.json();
        console.log('Lead webhook received:', leadData);

        // Validate required fields
        if (!leadData.fullName || !leadData.email) {
            return badRequest({
                error: 'Missing required fields: fullName and email'
            });
        }

        // Process lead with AI
        const aiProcessingResult = await processLeadWithAI(leadData);
        
        // Create lead in Wix Data
        const leadRecord = await createLead({
            ...leadData,
            aiProcessingResult: aiProcessingResult,
            webhookProcessed: true,
            webhookTimestamp: new Date().toISOString()
        });

        // Send response
        return ok({
            success: true,
            leadId: leadRecord._id,
            message: 'Lead processed successfully',
            aiInsights: aiProcessingResult
        });

    } catch (error) {
        console.error('Lead webhook error:', error);
        return serverError({
            error: 'Failed to process lead webhook',
            details: error.message
        });
    }
}

// Webhook: Quote Requested
export async function post_quoteRequested(request) {
    try {
        const quoteData = await request.body.json();
        console.log('Quote webhook received:', quoteData);

        // Validate required fields
        if (!quoteData.leadId || !quoteData.customerEmail) {
            return badRequest({
                error: 'Missing required fields: leadId and customerEmail'
            });
        }

        // Generate PDF quote via external service
        const pdfResult = await generateQuotePDF(quoteData);
        
        // Create quote record in Wix Data
        const quoteRecord = await createQuote({
            ...quoteData,
            pdfUrl: pdfResult.pdf_url,
            pdfGenerated: true,
            webhookProcessed: true,
            webhookTimestamp: new Date().toISOString()
        });

        // Update the related lead in Wix Data
        await updateLead(quoteData.leadId, {
            status: 'quoted',
            quoteId: quoteRecord._id,
            lastActivity: new Date()
        });

        return ok({
            success: true,
            quoteId: quoteRecord._id,
            pdfUrl: pdfResult.pdf_url,
            message: 'Quote generated successfully'
        });

    } catch (error) {
        console.error('Quote webhook error:', error);
        return serverError({
            error: 'Failed to process quote webhook',
            details: error.message
        });
    }
}

// Webhook: Project Updated
export async function post_projectUpdated(request) {
    try {
        const projectData = await request.body.json();
        console.log('Project update webhook received:', projectData);

        // Validate required fields
        if (!projectData.projectId || !projectData.status) {
            return badRequest({
                error: 'Missing required fields: projectId and status'
            });
        }

        // Call the integration layer to update project status in the backend system
        const updateResult = await updateProjectStatus(projectData.projectId, {
            status: projectData.status,
            notes: projectData.notes,
            updatedBy: projectData.updatedBy,
            webhookProcessed: true
        });

        return ok({
            success: true,
            projectId: projectData.projectId,
            message: 'Project updated successfully',
            updateResult: updateResult
        });

    } catch (error) {
        console.error('Project webhook error:', error);
        return serverError({
            error: 'Failed to process project webhook',
            details: error.message
        });
    }
}

// Webhook: Customer Service Message
export async function post_customerServiceMessage(request) {
    try {
        const messageData = await request.body.json();
        console.log('Customer service webhook received:', messageData);

        // Process message with AI customer service
        const serviceResponse = await sendCustomerServiceMessage(messageData);

        return ok({
            success: true,
            conversationId: serviceResponse.conversation_id,
            response: serviceResponse.response,
            message: 'Customer service message processed'
        });

    } catch (error) {
        console.error('Customer service webhook error:', error);
        return serverError({
            error: 'Failed to process customer service webhook',
            details: error.message
        });
    }
}

// Webhook: Window Analysis Complete
export async function post_windowAnalysisComplete(request) {
    try {
        const analysisData = await request.body.json();
        console.log('Window analysis webhook received:', analysisData);

        // This webhook receives the completed analysis and updates the corresponding lead
        if (analysisData.leadId) {
            await updateLead(analysisData.leadId, {
                windowAnalysis: analysisData,
                analysisCompleted: true,
                lastActivity: new Date()
            });
        }

        return ok({
            success: true,
            analysisId: analysisData.analysisId,
            message: 'Window analysis processed successfully'
        });

    } catch (error) {
        console.error('Window analysis webhook error:', error);
        return serverError({
            error: 'Failed to process window analysis webhook',
            details: error.message
        });
    }
}

// Webhook for testing purposes
export async function post_testWebhook(request) {
    try {
        const testData = await request.body.json();
        console.log('Test webhook received:', testData);

        return ok({
            success: true,
            received: testData,
            timestamp: new Date().toISOString(),
            message: 'Test webhook processed successfully'
        });

    } catch (error) {
        console.error('Test webhook error:', error);
        return serverError({
            error: 'Failed to process test webhook',
            details: error.message
        });
    }
}

// Health check endpoint to verify webhook service is running
export async function get_webhookHealth(request) {
    return ok({
        status: 'healthy',
        service: 'Good Faith Exteriors Webhooks',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/leadCreated',
            '/quoteRequested', 
            '/projectUpdated',
            '/customerServiceMessage',
            '/windowAnalysisComplete',
            '/contractorAssignment',
            '/testWebhook'
        ]
    });
}