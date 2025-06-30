class GFEVeloCommunicationController {
    constructor(componentName, options = {}) {
        this.componentName = componentName;
        this.options = {
            enableLogging: options.enableLogging !== false,
            autoInit: options.autoInit !== false,
            trustedOrigins: options.trustedOrigins || [
                'https://goodfaithexteriors.com',
                'https://www.goodfaithexteriors.com',
                'https://gfe-ai-advisor.netlify.app',
                'https://editor.wix.com',
                'https://www.wix.com',
                'https://static.wixstatic.com',
                'https://default-837326026335.us-central1.run.app'
            ],
            ...options
        };

        this.messageHandlers = new Map();
        this.connectionStatus = 'disconnected';
        this.parentOrigin = null;

        if (this.options.autoInit) {
            this.initialize();
        }
    }

    initialize() {
        this.log('Initializing Velo Communication Controller for:', this.componentName);
        window.addEventListener('message', this.handleIncomingMessage.bind(this));
        this.registerDefaultHandlers();
        this.requestConnection();
        this.startHeartbeat();
        this.log('Velo Communication Controller initialized');
    }

    registerDefaultHandlers() {
        this.registerHandler('GFE_CONNECTION_ACK', (data, origin) => {
            this.connectionStatus = 'connected';
            this.parentOrigin = origin;
            this.log('Connection established with parent:', origin);
            this.onConnectionEstablished(data);
        });

        this.registerHandler('GFE_HEARTBEAT_RESPONSE', () => {
            this.log('Heartbeat acknowledged');
        });

        this.registerHandler('GFE_CONFIG_UPDATE', (data) => {
            this.log('Configuration update received:', data);
            this.onConfigUpdate(data);
        });

        this.registerHandler('GFE_DATA_REQUEST', (data) => {
            this.log('Data request received:', data);
            this.onDataRequest(data);
        });

        this.registerHandler('GFE_LEAD_CAPTURE_REQUEST', (data) => {
            this.log('Lead capture request received:', data);
            this.onLeadCaptureRequest(data);
        });

        this.registerHandler('GFE_ERROR_NOTIFICATION', (data) => {
            this.log('Error notification received:', data);
            this.onErrorNotification(data);
        });
    }

    handleIncomingMessage(event) {
        if (!this.isOriginTrusted(event.origin)) {
            this.log('Message rejected from untrusted origin:', event.origin);
            return;
        }

        if (!this.isValidMessage(event.data)) {
            this.log('Invalid message structure:', event.data