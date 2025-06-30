import wixData from 'wix-data';
import { CONSTANTS } from './constants.js';

const { COLLECTIONS } = CONSTANTS;

/**
 * Logs a system event to the Analytics collection.
 * @param {object} eventData - The event data to log.
 * @returns {Promise<object>} The result of the log operation.
 */
export async function logSystemEvent(eventData) {
    try {
        const eventRecord = {
            event: eventData.eventType || eventData.event,
            page: eventData.page || 'backend',
            timestamp: new Date().toISOString(),
            eventProperties: JSON.stringify(eventData.details || eventData.eventProperties || {}),
            sessionId: eventData.sessionId || generateSessionId(),
            userId: eventData.userId || 'system',
            userAgent: eventData.userAgent || 'GFE Backend Service',
            pageURL: eventData.pageURL || `goodfaithexteriors.com/${eventData.page || 'backend'}`,
            referrer: eventData.referrer || '',
            leadId: eventData.leadId || '',
            quoteId: eventData.quoteId || '',
            eventValue: eventData.eventValue || '',
            duration: eventData.duration || '',
            marketingData: JSON.stringify(eventData.marketingData || {}),
            deviceType: eventData.deviceType || 'Server',
            errorMessage: eventData.errorMessage || ''
        };
        
        const result = await wixData.insert(COLLECTIONS.ANALYTICS, eventRecord);
        return { success: true, eventId: result._id };
    } catch (error) {
        console.error('Error logging system event:', error);
        return { success: false, error: error.message };
    }
}

function generateSessionId() {
    return `gfe_sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}