/**
 * Centralized Reusable E-Commerce Data Layer Utility
 * Supports Google Analytics 4 (GA4) / Google Tag Manager (GTM) / Meta Pixel & Custom Analytics
 * Default Currency: BDT
 */

const DEFAULT_CURRENCY = 'BDT';

// In-memory set to prevent duplicate purchases within the same session/page lifecycle
const trackedPurchases = new Set();

/**
 * Safely push an event to window.dataLayer with try/catch protection.
 * Analytics failures will never throw or disrupt application functionality.
 *
 * @param {Object} payload - The event payload to push
 * @param {boolean} isEcommerce - Whether this is a GA4 ecommerce event requiring ecommerce reset
 */
export const pushToDataLayer = (payload, isEcommerce = false) => {
  if (typeof window === 'undefined') return;

  try {
    window.dataLayer = window.dataLayer || [];

    if (isEcommerce) {
      // Clear previous ecommerce object to prevent parameter bleeding across events (GA4 best practice)
      window.dataLayer.push({ ecommerce: null });
    }

    window.dataLayer.push(payload);

    if (process.env.NODE_ENV === 'development') {
      console.log('[DataLayer Event]', payload.event, payload);
    }
  } catch (error) {
    // Silently handle errors so user flow is never interrupted
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DataLayer Warning]', error);
    }
  }
};

/**
 * Normalize and format an item into standard GA4 ecommerce item structure.
 */
export const formatEcommerceItem = (rawItem, overrideQuantity = null, index = null) => {
  if (!rawItem) return null;

  const id = rawItem.productId || rawItem.id || rawItem._id || rawItem.sku || '';
  const name = rawItem.productName || rawItem.name || rawItem.title || '';

  // Extract brand if available
  const brand =
    rawItem.brand?.name ||
    rawItem.brandName ||
    (typeof rawItem.brand === 'string' ? rawItem.brand : undefined);

  // Extract category if available
  const category =
    rawItem.subCategory?.category?.name ||
    rawItem.category?.name ||
    (typeof rawItem.category === 'string' ? rawItem.category : undefined) ||
    rawItem.subCategory?.name ||
    rawItem.mainCategory?.name;

  // Extract variant if available
  let variant = rawItem.variantType || rawItem.variantTitle;
  if (!variant && rawItem.variantAttributes && typeof rawItem.variantAttributes === 'object') {
    variant = Object.entries(rawItem.variantAttributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  // Calculate clean numeric price
  const priceVal =
    rawItem.price !== undefined && rawItem.price !== null
      ? parseFloat(rawItem.price)
      : rawItem.discountedPrice !== undefined && rawItem.discountedPrice !== null
      ? parseFloat(rawItem.discountedPrice)
      : rawItem.discountPrice !== undefined && rawItem.discountPrice !== null
      ? parseFloat(rawItem.discountPrice)
      : rawItem.originalPrice !== undefined && rawItem.originalPrice !== null
      ? parseFloat(rawItem.originalPrice)
      : 0;

  const quantityVal =
    overrideQuantity !== null && overrideQuantity !== undefined
      ? parseInt(overrideQuantity, 10)
      : rawItem.quantity !== undefined && rawItem.quantity !== null
      ? parseInt(rawItem.quantity, 10)
      : 1;

  const formattedItem = {
    item_id: String(id),
    item_name: String(name),
    price: isNaN(priceVal) ? 0 : Number(priceVal.toFixed(2)),
    quantity: isNaN(quantityVal) || quantityVal < 1 ? 1 : quantityVal,
  };

  if (brand && String(brand).trim() !== '') {
    formattedItem.item_brand = String(brand).trim();
  }

  if (category && String(category).trim() !== '') {
    formattedItem.item_category = String(category).trim();
  }

  if (variant && String(variant).trim() !== '') {
    formattedItem.item_variant = String(variant).trim();
  }

  if (rawItem.couponCode || rawItem.coupon) {
    formattedItem.coupon = String(rawItem.couponCode || rawItem.coupon);
  }

  if (rawItem.discountAmount || rawItem.discount) {
    const discountVal = parseFloat(rawItem.discountAmount || rawItem.discount || 0);
    if (!isNaN(discountVal) && discountVal > 0) {
      formattedItem.discount = Number(discountVal.toFixed(2));
    }
  }

  if (index !== null && index !== undefined) {
    formattedItem.index = index;
  }

  return formattedItem;
};

/**
 * 0. page_view
 */
export const trackPageView = (url = null, title = null, customParams = {}) => {
  if (typeof window === 'undefined') return;

  const pageLocation = url || window.location.href;
  const pagePath = window.location.pathname + window.location.search;
  const pageTitle = title || document.title || 'Ekhone';

  pushToDataLayer({
    event: 'page_view',
    page_location: pageLocation,
    page_path: pagePath,
    page_title: pageTitle,
    ...customParams,
  });
};

/**
 * 1. login
 */
export const trackLogin = (method = 'email') => {
  pushToDataLayer({
    event: 'login',
    method: String(method || 'email'),
  });
};

/**
 * 2. sign_up
 */
export const trackSignUp = (method = 'email') => {
  pushToDataLayer({
    event: 'sign_up',
    method: String(method || 'email'),
  });
};
