{
  "secrets": {
    "claude_api_key": {
      "description": "Anthropic Claude API key for AI analysis",
      "required": true,
      "type": "api_key"
    },
    "claude-organization-id": {
      "description": "Claude organization ID",
      "required": false,
      "type": "string"
    },
    "google-cloud-project-id": {
      "description": "Google Cloud project ID: 837326026335",
      "required": true,
      "type": "string",
      "value": "837326026335"
    },
    "google-ai-studio-api-key": {
      "description": "Google AI Studio API key: AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY",
      "required": true,
      "type": "api_key",
      "value": "AIzaSyAhW8xfvCJdICXKYEMqYidCWP2IhUnSaVY"
    },
    "cloud_vision_api_client_id": {
      "description": "Google Cloud Vision API client ID",
      "required": true,
      "type": "string",
      "value": "837326026335-og5oga2u90sm079ht8450s5j4v4kmio0.apps.googleusercontent.com"
    },
    "cloud_vision_client_secret": {
      "description": "Google Cloud Vision API client secret",
      "required": true,
      "type": "string",
      "value": "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"
    },
    "good-faith-exteriors-oauth-app-id": {
      "description": "Good Faith Exteriors OAuth app ID",
      "required": true,
      "type": "string",
      "value": "477baa33-872c-4b41-8f1f-7d5e28a684f2"
    },
    "good-faith-exteriors-oauth-app-secret": {
      "description": "Good Faith Exteriors OAuth app secret",
      "required": true,
      "type": "string",
      "value": "c8b358bd-e1e1-437c-a8f5-a2f0fd6399a1"
    },
    "base_price_multiplier": {
      "description": "Base price multiplier for 30% markup",
      "required": true,
      "type": "number",
      "value": "1.30"
    },
    "brand_multipliers": {
      "description": "Brand-specific pricing multipliers (JSON)",
      "required": false,
      "type": "json",
      "value": "{\"Marvin\": 1.5, \"Andersen\": 1.35, \"Windsor\": 1.25, \"Pella\": 1.4, \"Provia\": 1.2}"
    },
    "material_multiplier": {
      "description": "Material-specific pricing multipliers (JSON)",
      "required": false,
      "type": "json",
      "value": "{\"Wood\": 2.2, \"Aluminum Clad\": 2.0, \"Fiberglass\": 1.5, \"Composite\": 1.6, \"Vinyl\": 1.0}"
    },
    "type_multipliers": {
      "description": "Window type pricing multipliers (JSON)",
      "required": false,
      "type": "json",
      "value": "{\"Double Hung\": 1.0, \"Casement\": 1.25, \"Awning\": 1.2, \"Picture\": 1.0, \"Sliding\": 0.95}"
    },
    "company_phone": {
      "description": "Company phone number",
      "required": false,
      "type": "string",
      "value": "1-800-GOODFAITH"
    },
    "company_website": {
      "description": "Company website URL",
      "required": false,
      "type": "string",
      "value": "https://goodfaithexteriors.com"
    },
    "company_logo_url": {
      "description": "Company logo URL",
      "required": false,
      "type": "string"
    },
    "crm-app-script-url": {
      "description": "CRM integration app script URL",
      "required": false,
      "type": "url"
    }
  },
  "setup_instructions": [
    "1. Go to your Wix site dashboard",
    "2. Navigate to Developer Tools > Secrets Manager",
    "3. Add each secret from the list above",
    "4. Verify all API keys are functional",
    "5. Test the OAuth integration"
  ]
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
