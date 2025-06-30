import wixData from 'wix-data';

// Data Collections
const PRODUCTS_COLLECTION = "GFE_WindowProducts";
const QUOTES_COLLECTION = "GFE_Quotes";

/**
 * Fetches all active window products (for selectors, calculators, etc).
 * @returns {Promise<Array>}
 */
export async function getWindowProducts() {
  try {
    const results = await wixData.query(PRODUCTS_COLLECTION)
      .eq("status", "active")
      .ascending("brand")
      .ascending("series")
      .find();
    return { success: true, products: results.items };
  } catch (error) {
    console.error("getWindowProducts error:", error);
    return { success: false, error: "Failed to fetch products." };
  }
}

/**
 * Calculates a detailed quote for a window project.
 * Expects: { windowType, width, height, material, quantity, brand, series }
 * Returns quote breakdown and total.
 */
export async function calculateWindowQuote(windowData) {
  try {
    // ---- 1. Lookup base price by brand/series/windowType ----
    let basePrice = 500;
    if (windowData.brand && windowData.series) {
      const product = await wixData.query(PRODUCTS_COLLECTION)
        .eq("brand", windowData.brand)
        .eq("series", windowData.series)
        .eq("windowType", windowData.windowType)
        .find();
      if (product.items.length > 0) {
        basePrice = product.items[0].basePrice || basePrice;
      }
    }

    // ---- 2. Size Multiplier (Area-based) ----
    const width = Number(windowData.width);
    const height = Number(windowData.height);
    const areaSqFt = (width * height) / 144; // inches to ft²

    let sizeMultiplier = 1.0;
    if (areaSqFt <= 6) sizeMultiplier = 1.0;
    else if (areaSqFt <= 10) sizeMultiplier = 1.2;
    else if (areaSqFt <= 15) sizeMultiplier = 1.4;
    else if (areaSqFt <= 20) sizeMultiplier = 1.6;
    else sizeMultiplier = 1.8;

    // ---- 3. Material Upcharge ----
    let materialUpcharge = 0;
    const mat = (windowData.material || '').toLowerCase();
    if (mat === "wood") materialUpcharge = 0.3;
    if (mat === "fiberglass") materialUpcharge = 0.18;
    if (mat === "aluminum clad") materialUpcharge = 0.12;
    if (mat === "cellular pvc") materialUpcharge = 0.15;
    // vinyl = 0

    // ---- 4. Quantity Discount ----
    const qty = Number(windowData.quantity) || 1;
    let quantityDiscount = 0;
    if (qty >= 20) quantityDiscount = 0.15;
    else if (qty >= 10) quantityDiscount = 0.10;
    else if (qty >= 5) quantityDiscount = 0.05;

    // ---- 5. Labor Cost Estimation ----
    const laborCost = 175 * qty;

    // ---- 6. Calculate totals ----
    const subtotal = basePrice * sizeMultiplier * qty;
    const upcharge = subtotal * materialUpcharge;
    const discount = subtotal * quantityDiscount;

    const total = subtotal + upcharge + laborCost - discount;

    // ---- 7. Compose breakdown ----
    const quote = {
      basePrice,
      windowType: windowData.windowType,
      brand: windowData.brand,
      series: windowData.series,
      size: { width, height, areaSqFt },
      material: windowData.material,
      quantity: qty,
      subtotal,
      upcharge,
      laborCost,
      discount,
      total: Math.round(total * 100) / 100,
      breakdown: {
        perWindow: Math.round((basePrice * sizeMultiplier + upcharge / qty + 175 - discount / qty) * 100) / 100,
        quantity: qty,
        sizeMultiplier,
        materialUpcharge,
        quantityDiscount
      }
    };
    return { success: true, quote };
  } catch (error) {
    console.error("calculateWindowQuote error:", error);
    return { success: false, error: "Failed to calculate quote." };
  }
}

/**
 * Saves a new window quote record to Wix Data
 * @param {Object} quoteData - includes customer info, project, and quote
 */
export async function saveWindowQuote(quoteData) {
  try {
    const saved = await wixData.insert(QUOTES_COLLECTION, {
      ...quoteData,
      status: 'pending',
      createdAt: new Date()
    });
    return { success: true, quoteId: saved._id };
  } catch (error) {
    console.error("saveWindowQuote error:", error);
    return { success: false, error: "Failed to save quote." };
  }
}
