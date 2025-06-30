// backend/ai/claude-core.js

import { getSecret } from 'wix-secrets-backend';
import { fetch } from 'wix-fetch';
import { logSystemEvent } from '../core/wix-data-service.web.js';
import { SECRETS, createSuccessResponse, createErrorResponse } from '../config/collections.js';

// Claude tool definitions
export const CLAUDE_TOOLS = {
  windowMeasurementAnalyzer: {
    name: 'window_measurement_analyzer',
    description: 'Analyzes uploaded window images to extract measurements',
    input_schema: {
      type: 'object',
      properties: {
        imageData: { type: 'string', description: 'Base64-encoded window image' },
        referenceObject: { type: 'string', description: 'Known scale object (e.g. Post-it)' }
      },
      required: ['imageData']
    }
  }
};

const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';

async function getAnthropicHeaders() {
  const apiKey = await getSecret(SECRETS.ANTHROPIC_API_KEY);
  const orgId = await getSecret(SECRETS.ANTHROPIC_ORG_ID);

  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    ...(orgId && { 'anthropic-organization': orgId })
  };
}

export async function analyzeWindowImage(imageData, context = {}) {
  try {
    const headers = await getAnthropicHeaders();

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageData
            }
          },
          {
            type: 'text',
            text: 'Analyze this window image and provide measurements, condition, and confidence level.'
          }
        ]
      }
    ];

    const body = JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      temperature: 0.5,
      system: 'You are a professional window replacement advisor in Minneapolis...',
      messages
    });

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      throw new Error(`Anthropic Error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();

    return createSuccessResponse({
      content: data?.content?.[0]?.text || 'No content returned',
      usage: data?.usage || {},
      timestamp: new Date().toISOString()
    }, 'Claude analysis successful');

  } catch (error) {
    console.error('Claude API error:', error);
    return createErrorResponse(error, 'analyzeWindowImage');
  }
}

export async function checkClaudeHealth() {
  try {
    const test = await analyzeWindowImage('dGVzdA=='); // base64 of "test"
    return createSuccessResponse({ healthy: test.success }, 'Claude Health Check');
  } catch (err) {
    return createErrorResponse(err, 'checkClaudeHealth');
  }
}

export function extractConfidenceScore(text) {
  const match = text.match(/confidence[:\\s]*(\\d+)%?/i);
  return match ? parseInt(match[1]) : 75;
}