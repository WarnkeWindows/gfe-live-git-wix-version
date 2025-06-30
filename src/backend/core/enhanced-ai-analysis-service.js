// Enhanced AI Analysis Service with Multiple AI Providers
// Good Faith Exteriors - Backend Services v2.0
// File: backend/core/enhanced-ai-analysis-service.js

import { ImageAnnotatorClient } from '@google-cloud/vision';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getSecret } from 'wix-secrets-backend';
import sharp from 'sharp';
import _ from 'lodash';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

class EnhancedAIAnalysisService {
  constructor() {
    this.googleVisionClient = null;
    this.openaiClient = null;
    this.anthropicClient = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    try {
      const googleCredentials = await getSecret('GMAIL_PRIVATE_KEY');
      this.googleVisionClient = new ImageAnnotatorClient({
        credentials: JSON.parse(googleCredentials),
        projectId: await getSecret('google-cloud-project-id')
      });

      const openaiApiKey = await getSecret('OPENAI_API_KEY');
      this.openaiClient = new OpenAI({ apiKey: openaiApiKey });

      const claudeApiKey = await getSecret('claude_api_key');
      this.anthropicClient = new Anthropic({ apiKey: claudeApiKey });

      this.initialized = true;
      logger.info('Enhanced AI Analysis Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Analysis Service:', error);
      throw error;
    }
  }

  // Pre-processes images for optimal analysis
  async preprocessImage(imageBuffer, options = {}) {
    const { maxWidth = 1920, quality = 85 } = options;
    return sharp(imageBuffer)
      .resize(maxWidth, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  // Analyzes with Google Cloud Vision for object detection
  async analyzeWithGoogleVision(imageBuffer) {
    if (!this.initialized) await this.initialize();
    const [result] = await this.googleVisionClient.annotateImage({
        image: { content: imageBuffer },
        features: [ { type: 'OBJECT_LOCALIZATION' }, { type: 'LABEL_DETECTION' } ]
    });
    return { provider: 'google-vision', data: result };
  }

  // Analyzes with OpenAI (GPT-4o) for contextual understanding
  async analyzeWithOpenAI(imageBuffer, customPrompt) {
    if (!this.initialized) await this.initialize();
    const base64Image = imageBuffer.toString('base64');
    const prompt = customPrompt || 'Analyze this window for replacement estimation, providing type, material, and condition.';
    
    const response = await this.openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
            ]}
        ],
        max_tokens: 1024
    });
    return { provider: 'openai', data: JSON.parse(response.choices[0].message.content) };
  }

  // Analyzes with Anthropic Claude for detailed specifications
  async analyzeWithClaude(imageBuffer, customPrompt) {
    if (!this.initialized) await this.initialize();
    const base64Image = imageBuffer.toString('base64');
    const prompt = customPrompt || 'Provide detailed window specifications from this image as a JSON object.';

    const response = await this.anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1024,
        messages: [{ role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } }
        ]}]
    });
    return { provider: 'claude', data: JSON.parse(response.content[0].text) };
  }

  // Main function to run analysis across multiple providers
  async comprehensiveAnalysis(imageBuffer, options = {}) {
    const { providers = ['google-vision', 'openai', 'claude'], customPrompt = null } = options;
    const processedImage = await this.preprocessImage(imageBuffer);
    const analysisPromises = [];

    if (providers.includes('google-vision')) analysisPromises.push(this.analyzeWithGoogleVision(processedImage));
    if (providers.includes('openai')) analysisPromises.push(this.analyzeWithOpenAI(processedImage, customPrompt));
    if (providers.includes('claude')) analysisPromises.push(this.analyzeWithClaude(processedImage, customPrompt));
    
    const results = await Promise.allSettled(analysisPromises);
    const successfulAnalyses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
        
    return this.synthesizeAnalyses(successfulAnalyses);
  }

  // Combines results from different AIs into a single, more reliable output
  synthesizeAnalyses(analyses) {
    const synthesis = {
      confidence: 0,
      windowTypes: [],
      materials: [],
      recommendations: []
    };
    
    // Example synthesis logic:
    // 1. Trust Google Vision for initial object detection.
    // 2. Use OpenAI and Claude to interpret and add detail.
    // 3. Average confidence scores.
    logger.info('Synthesizing AI analysis results from multiple providers.');
    const allConfidences = analyses.map(a => a.data.confidence || 0.7);
    synthesis.confidence = _.mean(allConfidences);
    synthesis.details = analyses;

    return synthesis;
  }

  // Health check for the service
  async healthCheck() {
    // ... Health check logic ...
  }
}

const aiAnalysisService = new EnhancedAIAnalysisService();
export default aiAnalysisService;