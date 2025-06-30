/**
 * Email Service - Good Faith Exteriors
 * backend/services/email-service.web.js
 * 
 * Handles all email communications including quotes, appointments, and notifications
 * Integrates with SendGrid for reliable email delivery
 * Updated for consistency with project standards
 */

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { 
    logSystemEvent, 
    createSuccessResponse, 
    createErrorResponse,
    handleError
} from '../core/wix-data-service.web.js';
import { 
    generateUniqueId,
    formatCurrency,
    formatPhoneNumber,
    isValidEmail
} from '../utils/utilities-service.web.js';
import { generateCustomerCommunication } from '../ai/anthropic-service.web.js';

// =====================================================================
// EMAIL CONFIGURATION
// =====================================================================

const EMAIL_CONFIG = {
    sendGridEndpoint: 'https://api.sendgrid.com/v3/mail/send',
    fromEmail: 'estimates@goodfaithexteriors.com',
    fromName: 'Good Faith Exteriors',
    replyToEmail: 'info@goodfaithexteriors.com',
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000
};

// =====================================================================
// UTILITY FUNCTIONS
// =====================================================================

/**
 * Initializes SendGrid service with API key
 */
async function initializeSendGridService() {
    try {
        const apiKey = await getSecret('SENDGRID_API_KEY');
        
        if (!apiKey) {
            throw new Error('SENDGRID_API_KEY not found in secrets manager');
        }
        
        return { apiKey };
        
    } catch (error) {
        console.error('❌ Failed to initialize SendGrid service:', error);
        throw new Error(`SendGrid initialization failed: ${error.message}`);
    }
}

/**
 * Sends email via SendGrid API with retry logic
 */
async function sendEmailViaSendGrid(emailData, retryCount = 0) {
    try {
        const credentials = await initializeSendGridService();
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${credentials.apiKey}`
        };
        
        console.log('📧 Sending email via SendGrid...', {
            to: emailData.personalizations[0]?.to[0]?.email,
            subject: emailData.personalizations[0]?.subject,
            from: emailData.from?.email
        });
        
        const response = await fetch(EMAIL_CONFIG.sendGridEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`SendGrid API error (${response.status}): ${JSON.stringify(errorData)}`);
        }
        
        console.log('✅ Email sent successfully via SendGrid');
        
        return {
            success: true,
            messageId: response.headers.get('x-message-id') || generateUniqueId('email'),
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ SendGrid email send failed:', error);
        
        // Retry logic for transient errors
        if (retryCount < EMAIL_CONFIG.maxRetries && 
            (error.message.includes('timeout') || error.message.includes('503') || error.message.includes('502'))) {
            
            const delay = EMAIL_CONFIG.retryDelay * Math.pow(2, retryCount);
            console.log(`🔄 Retrying email send in ${delay}ms (attempt ${retryCount + 1}/${EMAIL_CONFIG.maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return sendEmailViaSendGrid(emailData, retryCount + 1);
        }
        
        throw error;
    }
}

/**
 * Creates standardized email data structure for SendGrid
 */
function createEmailData(to, subject, htmlContent, textContent = null, templateData = {}) {
    // Validate email address
    if (!isValidEmail(to)) {
        throw new Error(`Invalid email address: ${to}`);
    }
    
    const emailData = {
        personalizations: [{
            to: [{ email: to.toLowerCase().trim() }],
            subject: subject
        }],
        from: {
            email: EMAIL_CONFIG.fromEmail,
            name: EMAIL_CONFIG.fromName
        },
        reply_to: {
            email: EMAIL_CONFIG.replyToEmail,
            name: EMAIL_CONFIG.fromName
        },
        content: [
            {
                type: 'text/html',
                value: htmlContent
            }
        ]
    };
    
    // Add plain text version if provided
    if (textContent) {
        emailData.content.unshift({
            type: 'text/plain',
            value: textContent
        });
    }
    
    // Add template data if provided
    if (Object.keys(templateData).length > 0) {
        emailData.personalizations[0].dynamic_template_data = templateData;
    }
    
    return emailData;
}

// =====================================================================
// EMAIL TEMPLATE FUNCTIONS
// =====================================================================

/**
 * Gets email subject based on type and context
 */
export function getEmailSubject(emailType, customerName = '', contextData = {}) {
    const subjects = {
        welcome: `Welcome to Good Faith Exteriors${customerName ? `, ${customerName}` : ''}!`,
        estimate_ready: `Your Window Estimate is Ready${customerName ? `, ${customerName}` : ''}`,
        quote_delivery: `Your Custom Window Quote${customerName ? ` - ${customerName}` : ''}`,
        appointment_confirmation: `Appointment Confirmed${customerName ? ` - ${customerName}` : ''}`,
        appointment_reminder: `Reminder: Your Window Consultation Tomorrow${customerName ? `, ${customerName}` : ''}`,
        follow_up: `Following Up on Your Window Project${customerName ? `, ${customerName}` : ''}`,
        thank_you: `Thank You${customerName ? `, ${customerName}` : ''} - Good Faith Exteriors`,
        ai_analysis_complete: `Your Window Analysis is Complete${customerName ? `, ${customerName}` : ''}`,
        measurement_validation: `Window Measurement Validation${customerName ? ` - ${customerName}` : ''}`
    };
    
    return subjects[emailType] || `Good Faith Exteriors${customerName ? ` - ${customerName}` : ''}`;
}

/**
 * Generates email HTML template with consistent branding
 */
export function generateEmailHtml(content, customerName = '', emailType = 'general') {
    const customerGreeting = customerName ? `Dear ${customerName}` : 'Dear Valued Customer';
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Good Faith Exteriors</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #1e3a8a;
        }
        .logo {
            color: #1e3a8a;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .tagline {
            color: #666;
            font-size: 14px;
        }
        .content {
            margin-bottom: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #1e3a8a;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .contact-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .cta-button {
            display: inline-block;
            background-color: #1e3a8a;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .quote-summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1e3a8a;
        }
        .analysis-results {
            background-color: #e8f4fd;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #1e3a8a;
        }
        .measurement-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        .measurement-table th,
        .measurement-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .measurement-table th {
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">Good Faith Exteriors</div>
            <div class="tagline">Quality Windows, Trusted Service</div>
        </div>
        
        <div class="content">
            <div class="greeting">${customerGreeting},</div>
            ${content}
        </div>
        
        <div class="contact-info">
            <strong>Contact Information:</strong><br>
            📧 Email: info@goodfaithexteriors.com<br>
            📞 Phone: (XXX) XXX-XXXX<br>
            🌐 Website: goodfaithexteriors.com
        </div>
        
        <div class="footer">
            <p>Thank you for choosing Good Faith Exteriors!</p>
            <p>This email was sent to you because you requested information about our window replacement services.</p>
            <p>&copy; ${new Date().getFullYear()} Good Faith Exteriors. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Generates plain text version of email
 */
export function generateEmailText(content, customerName = '') {
    const customerGreeting = customerName ? `Dear ${customerName}` : 'Dear Valued Customer';
    
    // Strip HTML tags for plain text version
    const plainContent = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    return `
${customerGreeting},

${plainContent}

Contact Information:
Email: info@goodfaithexteriors.com
Phone: (XXX) XXX-XXXX
Website: goodfaithexteriors.com

Thank you for choosing Good Faith Exteriors!

This email was sent to you because you requested information about our window replacement services.

© ${new Date().getFullYear()} Good Faith Exteriors. All rights reserved.
`;
}

// =====================================================================
// EMAIL SENDING FUNCTIONS
// =====================================================================

/**
 * Sends quote email to customer
 */
export async function sendQuoteEmail(customerInfo, quoteData, additionalNotes = '') {
    try {
        console.log('📧 Preparing quote email...', { 
            email: customerInfo.customerEmail,
            total: quoteData.totals?.total
        });
        
        if (!customerInfo.customerEmail) {
            throw new Error('Customer email is required');
        }
        
        if (!isValidEmail(customerInfo.customerEmail)) {
            throw new Error('Invalid customer email address');
        }
        
        // Generate AI-powered quote explanation if not provided
        let quoteExplanation = additionalNotes;
        if (!quoteExplanation) {
            try {
                const explanationResult = await generateCustomerCommunication(
                    customerInfo,
                    'quote_delivery',
                    { quoteData: quoteData }
                );
                
                if (explanationResult.success) {
                    quoteExplanation = explanationResult.data.message;
                }
            } catch (aiError) {
                console.warn('⚠️ Failed to generate AI explanation, using default:', aiError);
                quoteExplanation = 'Please find your custom window replacement quote below.';
            }
        }
        
        // Create quote summary HTML
        const quoteSummaryHtml = `
            <div class="quote-summary">
                <h3>Quote Summary</h3>
                <p><strong>Total Windows:</strong> ${quoteData.totals?.windowCount || 0}</p>
                <p><strong>Subtotal:</strong> ${formatCurrency(quoteData.totals?.subtotal || 0)}</p>
                <p><strong>Installation:</strong> ${formatCurrency(quoteData.totals?.installation || 0)}</p>
                <p><strong>Tax:</strong> ${formatCurrency(quoteData.totals?.tax || 0)}</p>
                <p><strong>Total:</strong> ${formatCurrency(quoteData.totals?.total || 0)}</p>
            </div>
        `;
        
        const htmlContent = `
            <p>${quoteExplanation}</p>
            ${quoteSummaryHtml}
            <p>This estimate is valid for 30 days. We're here to answer any questions you may have about your window replacement project.</p>
            <p>Ready to move forward? <a href="tel:(XXX)XXX-XXXX" class="cta-button">Call us today!</a></p>
        `;
        
        const subject = getEmailSubject('quote_delivery', customerInfo.customerName, { total: quoteData.totals?.total });
        const emailHtml = generateEmailHtml(htmlContent, customerInfo.customerName, 'quote_delivery');
        const emailText = generateEmailText(htmlContent, customerInfo.customerName);
        
        const emailData = createEmailData(
            customerInfo.customerEmail,
            subject,
            emailHtml,
            emailText,
            {
                customerName: customerInfo.customerName || '',
                quoteTotal: quoteData.totals?.total || 0,
                windowCount: quoteData.totals?.windowCount || 0
            }
        );
        
        const sendResult = await sendEmailViaSendGrid(emailData);
        
        await logSystemEvent({
            eventType: 'email_sent',
            message: 'Quote email sent successfully',
            details: {
                emailType: 'quote_delivery',
                customerEmail: customerInfo.customerEmail,
                messageId: sendResult.messageId,
                quoteTotal: quoteData.totals?.total
            }
        });
        
        return createSuccessResponse({
            messageId: sendResult.messageId,
            timestamp: sendResult.timestamp,
            emailType: 'quote_delivery'
        }, 'Quote email sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send quote email:', error);
        return handleError(error, 'sendQuoteEmail');
    }
}

/**
 * Sends AI analysis results email
 */
export async function sendAIAnalysisEmail(customerInfo, analysisData) {
    try {
        console.log('📧 Sending AI analysis email...', {
            email: customerInfo.customerEmail,
            windowType: analysisData.analysis?.windowType
        });
        
        if (!customerInfo.customerEmail) {
            throw new Error('Customer email is required');
        }
        
        if (!isValidEmail(customerInfo.customerEmail)) {
            throw new Error('Invalid customer email address');
        }
        
        // Create analysis results HTML
        const analysisResultsHtml = `
            <div class="analysis-results">
                <h3>AI Window Analysis Results</h3>
                <p><strong>Window Type:</strong> ${analysisData.analysis?.windowType || 'Not determined'}</p>
                <p><strong>Material:</strong> ${analysisData.analysis?.material || 'Not determined'}</p>
                <p><strong>Estimated Dimensions:</strong> ${analysisData.analysis?.estimatedWidth || 0}" × ${analysisData.analysis?.estimatedHeight || 0}"</p>
                <p><strong>Condition:</strong> ${analysisData.analysis?.condition || 'Not assessed'}</p>
                <p><strong>Confidence Level:</strong> ${analysisData.analysis?.confidence || 0}%</p>
                ${analysisData.analysis?.recommendations?.length > 0 ? 
                    `<p><strong>Recommendations:</strong></p><ul>${analysisData.analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>` : 
                    ''
                }
            </div>
        `;
        
        const htmlContent = `
            <p>Your window analysis has been completed using our advanced AI technology. Here are the results:</p>
            ${analysisResultsHtml}
            <p>These results provide a preliminary assessment of your windows. For a detailed quote and professional consultation, please contact us.</p>
            <p><a href="tel:(XXX)XXX-XXXX" class="cta-button">Schedule a Consultation</a></p>
        `;
        
        const subject = getEmailSubject('ai_analysis_complete', customerInfo.customerName);
        const emailHtml = generateEmailHtml(htmlContent, customerInfo.customerName, 'ai_analysis_complete');
        const emailText = generateEmailText(htmlContent, customerInfo.customerName);
        
        const emailData = createEmailData(
            customerInfo.customerEmail,
            subject,
            emailHtml,
            emailText,
            {
                customerName: customerInfo.customerName || '',
                windowType: analysisData.analysis?.windowType || '',
                confidence: analysisData.analysis?.confidence || 0
            }
        );
        
        const sendResult = await sendEmailViaSendGrid(emailData);
        
        await logSystemEvent({
            eventType: 'email_sent',
            message: 'AI analysis email sent successfully',
            details: {
                emailType: 'ai_analysis_complete',
                customerEmail: customerInfo.customerEmail,
                messageId: sendResult.messageId,
                windowType: analysisData.analysis?.windowType
            }
        });
        
        return createSuccessResponse({
            messageId: sendResult.messageId,
            timestamp: sendResult.timestamp,
            emailType: 'ai_analysis_complete'
        }, 'AI analysis email sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send AI analysis email:', error);
        return handleError(error, 'sendAIAnalysisEmail');
    }
}

/**
 * Sends appointment confirmation email
 */
export async function sendAppointmentConfirmationEmail(customerInfo, appointmentData) {
    try {
        console.log('📧 Sending appointment confirmation email...', {
            email: customerInfo.customerEmail,
            date: appointmentData.appointmentDate
        });
        
        if (!customerInfo.customerEmail) {
            throw new Error('Customer email is required');
        }
        
        if (!isValidEmail(customerInfo.customerEmail)) {
            throw new Error('Invalid customer email address');
        }
        
        // Generate AI-powered confirmation message
        let confirmationMessage = '';
        try {
            const messageResult = await generateCustomerCommunication(
                customerInfo,
                'appointment_confirmation',
                { appointmentData: appointmentData }
            );
            
            if (messageResult.success) {
                confirmationMessage = messageResult.data.message;
            }
        } catch (aiError) {
            console.warn('⚠️ Failed to generate AI confirmation, using default:', aiError);
            confirmationMessage = 'Your appointment has been confirmed. We look forward to meeting with you!';
        }
        
        const appointmentDetailsHtml = `
            <div class="quote-summary">
                <h3>Appointment Details</h3>
                <p><strong>Date:</strong> ${appointmentData.appointmentDate || 'TBD'}</p>
                <p><strong>Time:</strong> ${appointmentData.appointmentTime || 'TBD'}</p>
                <p><strong>Service:</strong> ${appointmentData.selectedService || 'Window Consultation'}</p>
                <p><strong>Address:</strong> ${customerInfo.customerAddress || 'Address on file'}</p>
                ${appointmentData.notes ? `<p><strong>Notes:</strong> ${appointmentData.notes}</p>` : ''}
            </div>
        `;
        
        const htmlContent = `
            <p>${confirmationMessage}</p>
            ${appointmentDetailsHtml}
            <p>Please ensure someone 18 or older will be available during the appointment time. If you need to reschedule, please contact us at least 24 hours in advance.</p>
            <p>Questions? <a href="tel:(XXX)XXX-XXXX" class="cta-button">Call us</a></p>
        `;
        
        const subject = getEmailSubject('appointment_confirmation', customerInfo.customerName);
        const emailHtml = generateEmailHtml(htmlContent, customerInfo.customerName, 'appointment_confirmation');
        const emailText = generateEmailText(htmlContent, customerInfo.customerName);
        
        const emailData = createEmailData(
            customerInfo.customerEmail,
            subject,
            emailHtml,
            emailText,
            {
                customerName: customerInfo.customerName || '',
                appointmentDate: appointmentData.appointmentDate || '',
                appointmentTime: appointmentData.appointmentTime || '',
                service: appointmentData.selectedService || 'Window Consultation'
            }
        );
        
        const sendResult = await sendEmailViaSendGrid(emailData);
        
        await logSystemEvent({
            eventType: 'email_sent',
            message: 'Appointment confirmation email sent successfully',
            details: {
                emailType: 'appointment_confirmation',
                customerEmail: customerInfo.customerEmail,
                messageId: sendResult.messageId,
                appointmentDate: appointmentData.appointmentDate
            }
        });
        
        return createSuccessResponse({
            messageId: sendResult.messageId,
            timestamp: sendResult.timestamp,
            emailType: 'appointment_confirmation'
        }, 'Appointment confirmation email sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send appointment confirmation email:', error);
        return handleError(error, 'sendAppointmentConfirmationEmail');
    }
}

/**
 * Sends follow-up email
 */
export async function sendFollowUpEmail(customerInfo, followUpData = {}) {
    try {
        console.log('📧 Sending follow-up email...', {
            email: customerInfo.customerEmail,
            type: followUpData.followUpType
        });
        
        if (!customerInfo.customerEmail) {
            throw new Error('Customer email is required');
        }
        
        if (!isValidEmail(customerInfo.customerEmail)) {
            throw new Error('Invalid customer email address');
        }
        
        // Generate AI-powered follow-up message
        let followUpMessage = '';
        try {
            const messageResult = await generateCustomerCommunication(
                customerInfo,
                'follow_up',
                followUpData
            );
            
            if (messageResult.success) {
                followUpMessage = messageResult.data.message;
            }
        } catch (aiError) {
            console.warn('⚠️ Failed to generate AI follow-up, using default:', aiError);
            followUpMessage = 'We wanted to follow up on your window replacement project. How can we help you move forward?';
        }
        
        const htmlContent = `
            <p>${followUpMessage}</p>
            <p>We're here to answer any questions you may have about your window replacement project. Our team is ready to help you get started.</p>
            <p><a href="tel:(XXX)XXX-XXXX" class="cta-button">Call us today</a> or reply to this email with any questions.</p>
        `;
        
        const subject = getEmailSubject('follow_up', customerInfo.customerName);
        const emailHtml = generateEmailHtml(htmlContent, customerInfo.customerName, 'follow_up');
        const emailText = generateEmailText(htmlContent, customerInfo.customerName);
        
        const emailData = createEmailData(
            customerInfo.customerEmail,
            subject,
            emailHtml,
            emailText,
            {
                customerName: customerInfo.customerName || '',
                followUpType: followUpData.followUpType || 'general'
            }
        );
        
        const sendResult = await sendEmailViaSendGrid(emailData);
        
        await logSystemEvent({
            eventType: 'email_sent',
            message: 'Follow-up email sent successfully',
            details: {
                emailType: 'follow_up',
                customerEmail: customerInfo.customerEmail,
                messageId: sendResult.messageId,
                followUpType: followUpData.followUpType
            }
        });
        
        return createSuccessResponse({
            messageId: sendResult.messageId,
            timestamp: sendResult.timestamp,
            emailType: 'follow_up'
        }, 'Follow-up email sent successfully');
        
    } catch (error) {
        console.error('❌ Failed to send follow-up email:', error);
        return handleError(error, 'sendFollowUpEmail');
    }
}

/**
 * Checks email service health
 */
export async function emailServiceHealthCheck() {
    try {
        // Test SendGrid credentials
        await initializeSendGridService();
        
        return createSuccessResponse({
            status: 'healthy',
            service: 'email',
            provider: 'sendgrid',
            timestamp: new Date().toISOString()
        }, 'Email service is healthy');
        
    } catch (error) {
        console.error('❌ Email service health check failed:', error);
        return createErrorResponse(error, 'emailServiceHealthCheck');
    }
}

// =====================================================================
// HTTP ENDPOINT FUNCTIONS
// =====================================================================

/**
 * POST endpoint for sending quote emails
 */
export async function post_sendQuoteEmail(request) {
    try {
        const body = await request.body.json();
        
        if (!body.customerInfo || !body.quoteData) {
            throw new Error('Customer info and quote data are required');
        }
        
        const result = await sendQuoteEmail(body.customerInfo, body.quoteData, body.additionalNotes);
        return result;
        
    } catch (error) {
        return handleError(error, 'post_sendQuoteEmail');
    }
}

/**
 * POST endpoint for sending appointment reminders
 */
export async function post_sendAppointmentReminder(request) {
    try {
        const body = await request.body.json();
        
        if (!body.customerInfo || !body.appointmentData) {
            throw new Error('Customer info and appointment data are required');
        }
        
        const result = await sendAppointmentConfirmationEmail(body.customerInfo, body.appointmentData);
        return result;
        
    } catch (error) {
        return handleError(error, 'post_sendAppointmentReminder');
    }
}

/**
 * POST endpoint for sending follow-up emails
 */
export async function post_sendFollowupEmail(request) {
    try {
        const body = await request.body.json();
        
        if (!body.customerInfo) {
            throw new Error('Customer info is required');
        }
        
        const result = await sendFollowUpEmail(body.customerInfo, body.followUpData);
        return result;
        
    } catch (error) {
        return handleError(error, 'post_sendFollowupEmail');
    }
}

// =====================================================================
// EXPORT SUMMARY
// =====================================================================

export {
    // Email sending functions
    sendQuoteEmail,
    sendAIAnalysisEmail,
    sendAppointmentConfirmationEmail,
    sendFollowUpEmail,
    
    // Template functions
    getEmailSubject,
    generateEmailHtml,
    generateEmailText,
    
    // Health check
    emailServiceHealthCheck,
    
    // HTTP endpoints
    post_sendQuoteEmail,
    post_sendAppointmentReminder,
    post_sendFollowupEmail
};

