/**
 * Wix Database Schema for Good Faith Exteriors
 * Complete collection definitions for the Grid-Flow Engine
 */

// WindowProducts Collection Schema
export const WindowProductsSchema = {
  collectionName: 'WindowProducts',
  fields: {
    _id: { type: 'text', required: true },
    productId: { type: 'text', required: true },
    windowBrand: { type: 'text', required: true },
    series: { type: 'text', required: true },
    interiorMaterial: { type: 'text', required: true },
    exteriorMaterial: { type: 'text', required: true },
    basePrice: { type: 'number', required: true },
    baseWidth: { type: 'number', required: true },
    baseHeight: { type: 'number', required: true },
    baseUI: { type: 'number', required: true },
    pricePerUI: { type: 'number', required: true },
    description: { type: 'text', required: true },
    isActive: { type: 'boolean', required: true },
    createdDate: { type: 'date', required: true },
    updatedDate: { type: 'date', required: true },
    windowType: { type: 'text' },
    energyRating: { type: 'text' },
    warranty: { type: 'text' },
    installationComplexity: { type: 'text' },
    leadTime: { type: 'number' },
    images: { type: 'mediaGallery' },
    specifications: { type: 'richText' }
  },
  permissions: {
    insert: 'Admin',
    update: 'Admin',
    remove: 'Admin',
    read: 'Anyone'
  }
};

// Quotes Collection Schema
export const QuotesSchema = {
  collectionName: 'Quotes',
  fields: {
    _id: { type: 'text', required: true },
    quoteId: { type: 'text', required: true },
    customerId: { type: 'text' },
    customerInfo: { type: 'object', required: true },
    projectDetails: { type: 'object', required: true },
    products: { type: 'object', required: true },
    subtotal: { type: 'number', required: true },
    markupPercentage: { type: 'number', required: true },
    totalPrice: { type: 'number', required: true },
    status: { type: 'text', required: true },
    validUntil: { type: 'date', required: true },
    createdAt: { type: 'date', required: true },
    updatedAt: { type: 'date' },
    notes: { type: 'richText' },
    internalNotes: { type: 'richText' },
    salesRep: { type: 'text' },
    source: { type: 'text' }
  },
  permissions: {
    insert: 'Admin',
    update: 'Admin',
    remove: 'Admin',
    read: 'Admin'
  }
};

// Leads Collection Schema
export const LeadsSchema = {
  collectionName: 'Leads',
  fields: {
    _id: { type: 'text', required: true },
    leadId: { type: 'text', required: true },
    firstName: { type: 'text', required: true },
    lastName: { type: 'text', required: true },
    email: { type: 'text', required: true },
    phone: { type: 'text', required: true },
    address: { type: 'text' },
    city: { type: 'text' },
    state: { type: 'text' },
    zipCode: { type: 'text' },
    projectType: { type: 'text' },
    projectDescription: { type: 'text' },
    budget: { type: 'text' },
    timeline: { type: 'text' },
    preferredContact: { type: 'text' },
    source: { type: 'text', required: true },
    status: { type: 'text', required: true },
    dateCreated: { type: 'date', required: true },
    notes: { type: 'richText' },
    assignedSalesRep: { type: 'text' },
    lastContactDate: { type: 'date' },
    estimatedValue: { type: 'number' }
  },
  permissions: {
    insert: 'Admin',
    update: 'Admin',
    remove: 'Admin',
    read: 'Admin'
  }
};

// UserSessions Collection Schema
export const UserSessionsSchema = {
  collectionName: 'UserSessions',
  fields: {
    _id: { type: 'text', required: true },
    userId: { type: 'text', required: true },
    sessionToken: { type: 'text', required: true },
    accessToken: { type: 'text' },
    refreshToken: { type: 'text' },
    provider: { type: 'text', required: true },
    userInfo: { type: 'object' },
    expiresAt: { type: 'date', required: true },
    createdAt: { type: 'date', required: true },
    lastUsed: { type: 'date' },
    isActive: { type: 'boolean', required: true }
  },
  permissions: {
    insert: 'Admin',
    update: 'Admin',
    remove: 'Admin',
    read: 'Admin'
  }
};

// Export all schemas
export const DatabaseSchemas = {
  WindowProducts: WindowProductsSchema,
  Quotes: QuotesSchema,
  Leads: LeadsSchema,
  UserSessions: UserSessionsSchema
};

// Setup instructions
export const SetupInstructions = {
  steps: [
    "1. Go to your Wix site's dashboard",
    "2. Navigate to Database > Collections",
    "3. Create each collection using the schemas above",
    "4. Set the appropriate permissions for each collection",
    "5. Import the window products data from the CSV file",
    "6. Configure the pricing rules with 30% markup",
    "7. Test the OAuth integration"
  ]
};