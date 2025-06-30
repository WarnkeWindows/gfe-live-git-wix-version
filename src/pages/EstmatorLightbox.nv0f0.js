// Velo code for the 'EstimatorLightbox'

import wixWindow from 'wix-window';
import wixLocation from 'wix-location';

// Import the necessary functions from your backend service files
import { saveLead } from 'backend/master-integration-service.web.js';
import { createQuote } from 'backend/quoteService.js'; // Assuming quote creation logic is here

$w.onReady(function () {
    // 1. Construct the full URL to your unified widget HTML file in the public folder
    const widgetUrl = wixLocation.baseUrl + "/public/gfe-iframes/gfe-window-estimator-full.html";
    
    // 2. Set the .src property of the iframe element to load your widget
    $w('#unifiedWidgetIframe').src = widgetUrl;

    // 3. Listen for messages sent from the iframe application
    $w('#unifiedWidgetIframe').onMessage(async (event) => {
        
        // Ensure the message from the iframe is valid
        if (!event.data || !event.data.type) {
            console.error("Received an invalid message from the iframe.");
            return;
        }

        console.log(`Lightbox received message of type: ${event.data.type}`);
        
        try {
            // 4. Handle different message types sent from the iframe
            switch (event.data.type) {
                
                case 'IFRAME_READY':
                    console.log('Unified widget has reported it is ready.');
                    // You could send an initial configuration message back to the iframe if needed
                    // $w('#unifiedWidgetIframe').postMessage({ type: 'WIX_READY', data: { ... } });
                    break;
                    
                case 'GFE_SAVE_ESTIMATE':
                    console.log('Saving estimate data received from iframe:', event.data.data);
                    
                    // Call the backend service to save the quote data
                    const quoteResult = await createQuote(event.data.data);
                    
                    if (quoteResult.success) {
                        console.log('Successfully saved quote with ID:', quoteResult.quote._id);
                        wixWindow.lightbox.close({ quoteSaved: true, quoteId: quoteResult.quote._id });
                    } else {
                        throw new Error(quoteResult.error);
                    }
                    break;

                case 'GFE_SAVE_LEAD':
                    console.log('Saving lead data received from iframe:', event.data.data);

                    // Call the backend service to save the lead data
                    const leadResult = await saveLead(event.data.data);

                    if (leadResult.success) {
                        console.log('Successfully saved lead with ID:', leadResult.id);
                        // Close the lightbox and pass a success message
                        wixWindow.lightbox.close({ leadSaved: true, leadId: leadResult.id });
                    } else {
                        throw new Error(leadResult.error);
                    }
                    break;

                default:
                    console.log(`Unknown message type received: ${event.data.type}`);
            }
        } catch (error) {
            console.error('Error processing message from iframe:', error);
            // Optionally, send an error message back to the iframe
            $w('#unifiedWidgetIframe').postMessage({ type: 'BACKEND_ERROR', error: error.message });
        }
    });
});