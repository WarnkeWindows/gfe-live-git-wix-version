import { ok, serverError } from 'wix-http-functions';
import {
    createCustomerLead,
    updateCustomerLeadStatus,
    getCustomerDetails,
    getProjectDetails,
    getQuoteItems,
    getAppointments,
    logSystemEvent,
    successResponse,
    handleError
} from 'backend/data/wix-data-service.jsw';

function validateRequestBody(body, requiredFields) {
    for (const field of requiredFields) {
        if (!body || body[field] === undefined || body[field] === null || (typeof body[field] === 'string' && body[field].trim() === '')) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
}

export async function post_lead(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['customerName', 'customerEmail']);

        const result = await createCustomerLead(body);

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            leadId: result.customerId,
            projectId: result.projectId,
            isNew: result.isNewCustomer,
            customer: result.customer,
            message: result.message
        });
    } catch (error) {
        return handleError(error, 'post_lead');
    }
}

export async function post_lead_status(request) {
    try {
        const body = await request.body.json();
        validateRequestBody(body, ['customerId', 'leadStatus']);

        const { customerId, leadStatus, notes, updatedBy, sessionId } = body;

        const result = await updateCustomerLeadStatus(customerId, { leadStatus, notes, updatedBy, sessionId });

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            customerId: result.customerId,
            newStatus: result.leadStatus,
            message: result.message
        });
    } catch (error) {
        return handleError(error, 'post_lead_status');
    }
}

export async function get_customer(request) {
    try {
        const { customerId, email } = request.query;

        if (!customerId && !email) {
            throw new Error('Either customerId or email parameter is required.');
        }

        let result;
        if (customerId) {
            result = await getCustomerDetails(customerId);
        } else {
            result = await getCustomerDetails(email); // Replaced getCustomerByEmail with getCustomerDetails
        }

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            customer: result.customer,
            exists: result.exists || !!result.customer,
            projects: result.projects || [],
            quotes: result.quotes || [],
            appointments: result.appointments || [],
            summary: result.summary || {}
        });
    } catch (error) {
        return handleError(error, 'get_customer');
    }
}

export async function get_customer_projects(request) {
    try {
        const { customerId } = request.query;
        validateRequestBody(request.query, ['customerId']);

        const result = await getProjectDetails(customerId);

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            project: result.project,
            customer: result.customer,
            quotes: result.quotes,
            summary: result.summary
        });
    } catch (error) {
        return handleError(error, 'get_customer_projects');
    }
}

export async function get_customer_quotes(request) {
    try {
        const { customerId, email, sessionId, projectId, hasExplanation, limit } = request.query;

        const filters = {
            customerId,
            customerEmail: email,
            sessionId,
            projectId,
            hasExplanation: hasExplanation === 'true'
        };

        const result = await getQuoteItems(filters);

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            quoteItems: result.quoteItems,
            totalCount: result.totalCount,
            summary: result.summary
        });
    } catch (error) {
        return handleError(error, 'get_customer_quotes');
    }
}

export async function get_customer_bookings(request) {
    try {
        const { email, bookingStatus, selectedService, dateFrom, dateTo, limit, skip } = request.query;

        const filters = {
            email,
            bookingStatus,
            selectedService,
            dateFrom,
            dateTo,
            limit: parseInt(limit) || undefined,
            skip: parseInt(skip) || undefined
        };

        const result = await getAppointments(filters);

        if (!result.success) {
            throw new Error(result.error);
        }

        return successResponse({
            bookings: result.bookings,
            totalCount: result.totalCount,
            summary: result.summary
        });
    } catch (error) {
        return handleError(error, 'get_customer_bookings');
    }
}

export async function get_health(request) {
    try {
        const customerHealthCheck = await getCustomerDetails('some_non_existent_id').catch(e => e);

        await logSystemEvent({
            eventType: 'crm_health_check',
            message: 'CRM API health check performed',
            details: {
                customerServiceStatus: customerHealthCheck.success || (customerHealthCheck.error && customerHealthCheck.error.includes('not found')) ? 'operational' : 'error'
            }
        });

        return ok({
            body: {
                success: true,
                message: 'CRM services are operational'
            }
        });
    } catch (error) {
        return serverError({
            body: {
                success: false,
                error: error.message
            }
        });
    }
}/************
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
