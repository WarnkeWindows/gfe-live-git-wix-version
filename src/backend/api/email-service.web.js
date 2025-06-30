// File: backend/api/email-service.jsw

import { ok, serverError } from 'wix-http-functions';
import { sendEmail } from 'backend/services/email-service.js';
import { getSecret } from 'backend/data/secrets-manager.js';
import {
  getEmailSubject,
  generateEmailHtml,
  getEmailTemplateId
} from 'backend/utils/utilities.js';


/**
 * Secure endpoint to send a quote or estimate via email.
 * Triggered by gfeApi.generateCustomerCommunication in gfe-page-controller.js.
 */
export async function post_generate_customer_communication(request) {
    try {
        const { customerInfo, messageType, context } = await request.body.json();

        if (!customerInfo?.email || !messageType || !context) {
            throw new Error('Missing required fields: customerInfo.email, messageType, or context');
        }

        // Select email template based on message type
        const templateId = await getEmailTemplateId(messageType);
        const fromEmail = await getSecret('gfe_support_email'); // e.g., "support@goodfaithexteriors.com"

        // Compose email content
        const emailOptions = {
            to: customerInfo.email,
            from: fromEmail,
            subject: getEmailSubject(messageType, customerInfo),
            html: generateEmailHtml(templateId, context),
            customArgs: {
                sessionId: context?.sessionId || '',
                customerName: customerInfo.name || '',
                quoteId: context?.quote?.quoteId || '',
                messageType
            }
        };

        // Send via SendGrid or your configured transport
        const result = await sendEmail(emailOptions);

        return ok({ success: true, result });
    } catch (error) {
        console.error('Email service failed:', error);
        return serverError({ success: false, error: error.message });
    }
}
/************
.web.js file
************

Backend '.web.js' files contain functions that run on the server side and can be called from page code.

Learn more at https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/web-modules/calling-backend-code-from-the-frontend

****/

/**** Call the sample multiply function below by pasting the following into your page code:

import { multiply } from 'backend/new-module.web';

$w.onReady(async function () {
   console.log(await multiply(4,5));
});

****/

import { Permissions, webMethod } from "wix-web-module";

export const multiply = webMethod(
  Permissions.Anyone, 
  (factor1, factor2) => { 
    return factor1 * factor2 
  }
);
