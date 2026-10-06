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
    if (process.env.NODE_ENV === 'development') {
      console.warn('[DataLayer Warning]', error);
    }
  }
};

/**
 * Normalize and format an item into standard GA4 ecommerce item structure.
 * Only includes fields that actually exist and are non-empty.
 * Never includes sensitive data.
 *
 * @param {Object} rawItem - Raw product / cart / order item
 * @param {number} [overrideQuantity] - Optional quantity override
 * @param {number} [index] - Optional item position in a list
 * @returns {Object} Standard GA4 Item
 */
export const formatEcommerceItem = (rawItem, overrideQuantity = null, index = null) => {
  if (!rawItem) return null;

  const id =
    rawItem.productId ||
    rawItem.product?.id ||
    rawItem.product?._id ||
    rawItem.id ||
    rawItem._id ||
    rawItem.sku ||
    '';

  const name =
    rawItem.productName ||
    rawItem.product?.productName ||
    rawItem.name ||
    rawItem.product?.name ||
    rawItem.title ||
    rawItem.product?.title ||
    rawItem.bundleName ||
    rawItem.bundle?.name ||
    '';

  // Extract brand if available
  const brand =
    rawItem.brand?.name ||
    rawItem.product?.brand?.name ||
    rawItem.brandName ||
    rawItem.product?.brandName ||
    (typeof rawItem.brand === 'string' ? rawItem.brand : undefined);

  // Extract category if available
  const category =
    rawItem.subCategory?.category?.name ||
    rawItem.product?.subCategory?.category?.name ||
    rawItem.category?.name ||
    rawItem.product?.category?.name ||
    (typeof rawItem.category === 'string' ? rawItem.category : undefined) ||
    rawItem.subCategory?.name ||
    rawItem.mainCategory?.name;

  // Extract variant if available
  let variant = rawItem.variantType || rawItem.variantTitle || rawItem.productVariant?.variantName;
  if (!variant && rawItem.variantAttributes && typeof rawItem.variantAttributes === 'object') {
    variant = Object.entries(rawItem.variantAttributes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
  }

  // Calculate clean numeric price
  const priceVal =
    rawItem.unitPrice !== undefined && rawItem.unitPrice !== null
      ? parseFloat(rawItem.unitPrice)
      : rawItem.price !== undefined && rawItem.price !== null
      ? parseFloat(rawItem.price)
      : rawItem.product?.price !== undefined && rawItem.product?.price !== null
      ? parseFloat(rawItem.product.price)
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
 * Triggered on initial page load and every client-side route navigation
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
 * 1. view_item_list
 * Triggered when a list of products is rendered (catalog, category, related products, etc.)
 */
export const trackViewItemList = (items = [], listName = 'Product List', listId = 'product_list') => {
  if (!items || !Array.isArray(items) || items.length === 0) return;

  const formattedItems = items
    .slice(0, 50)
    .map((item, idx) => {
      const formatted = formatEcommerceItem(item, null, idx + 1);
      if (formatted) {
        if (listName) formatted.item_list_name = listName;
        if (listId) formatted.item_list_id = listId;
      }
      return formatted;
    })
    .filter(Boolean);

  if (formattedItems.length === 0) return;

  pushToDataLayer(
    {
      event: 'view_item_list',
      ecommerce: {
        item_list_id: listId,
        item_list_name: listName,
        items: formattedItems,
      },
    },
    true
  );
};

/**
 * 2. select_item
 * Triggered when a user clicks on a product from a list/grid
 */
export const trackSelectItem = (item, listName = 'Product List', listId = 'product_list', index = 1) => {
  const formattedItem = formatEcommerceItem(item, 1, index);
  if (!formattedItem) return;

  if (listName) formattedItem.item_list_name = listName;
  if (listId) formattedItem.item_list_id = listId;

  pushToDataLayer(
    {
      event: 'select_item',
      ecommerce: {
        item_list_id: listId,
        item_list_name: listName,
        items: [formattedItem],
      },
    },
    true
  );
};

/**
 * 3. view_item
 * Triggered when a product details page loads
 */
export const trackViewItem = (item, currency = DEFAULT_CURRENCY) => {
  const formattedItem = formatEcommerceItem(item, 1);
  if (!formattedItem) return;

  const value = formattedItem.price || 0;

  pushToDataLayer(
    {
      event: 'view_item',
      ecommerce: {
        currency: currency || DEFAULT_CURRENCY,
        value: Number(value.toFixed(2)),
        items: [formattedItem],
      },
    },
    true
  );
};

/**
 * 4. add_to_cart
 * Triggered when an item is added to the cart
 */
export const trackAddToCart = (itemOrItems, quantity = 1, currency = DEFAULT_CURRENCY) => {
  const rawList = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
  const items = rawList
    .map((item) => formatEcommerceItem(item, Array.isArray(itemOrItems) ? null : quantity))
    .filter(Boolean);

  if (items.length === 0) return;

  const value = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  pushToDataLayer(
    {
      event: 'add_to_cart',
      ecommerce: {
        currency: currency || DEFAULT_CURRENCY,
        value: Number(value.toFixed(2)),
        items,
      },
    },
    true
  );
};

/**
 * 5. remove_from_cart
 * Triggered when an item is removed from the cart
 */
export const trackRemoveFromCart = (itemOrItems, quantity = null, currency = DEFAULT_CURRENCY) => {
  const rawList = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
  const items = rawList
    .map((item) => formatEcommerceItem(item, quantity))
    .filter(Boolean);

  if (items.length === 0) return;

  const value = items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  pushToDataLayer(
    {
      event: 'remove_from_cart',
      ecommerce: {
        currency: currency || DEFAULT_CURRENCY,
        value: Number(value.toFixed(2)),
        items,
      },
    },
    true
  );
};

/**
 * 6. view_cart
 * Triggered when the user views their cart page or opens the cart drawer
 */
export const trackViewCart = (cartItems = [], totalValue = null, currency = DEFAULT_CURRENCY) => {
  if (!Array.isArray(cartItems)) return;

  const items = cartItems.map((item) => formatEcommerceItem(item)).filter(Boolean);
  const calculatedValue =
    totalValue !== null && totalValue !== undefined
      ? parseFloat(totalValue)
      : items.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  pushToDataLayer(
    {
      event: 'view_cart',
      ecommerce: {
        currency: currency || DEFAULT_CURRENCY,
        value: Number(calculatedValue.toFixed(2)),
        items,
      },
    },
    true
  );
};

/**
 * 7. begin_checkout
 * Triggered when the user initiates the checkout process
 */
export const trackBeginCheckout = (items = [], totalValue = null, coupon = null, currency = DEFAULT_CURRENCY) => {
  const rawList = Array.isArray(items) ? items : [items];
  const formattedItems = rawList.map((item) => formatEcommerceItem(item)).filter(Boolean);

  if (formattedItems.length === 0) return;

  const calculatedValue =
    totalValue !== null && totalValue !== undefined
      ? parseFloat(totalValue)
      : formattedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  const ecommercePayload = {
    currency: currency || DEFAULT_CURRENCY,
    value: Number(calculatedValue.toFixed(2)),
    items: formattedItems,
  };

  if (coupon) {
    ecommercePayload.coupon = String(coupon);
  }

  pushToDataLayer(
    {
      event: 'begin_checkout',
      ecommerce: ecommercePayload,
    },
    true
  );
};

/**
 * 8. add_shipping_info
 * Triggered when the user selects or updates shipping information
 */
export const trackAddShippingInfo = (
  items = [],
  totalValue = null,
  shippingTier = 'Standard Delivery',
  coupon = null,
  currency = DEFAULT_CURRENCY
) => {
  const rawList = Array.isArray(items) ? items : [items];
  const formattedItems = rawList.map((item) => formatEcommerceItem(item)).filter(Boolean);

  const calculatedValue =
    totalValue !== null && totalValue !== undefined
      ? parseFloat(totalValue)
      : formattedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  const ecommercePayload = {
    currency: currency || DEFAULT_CURRENCY,
    value: Number(calculatedValue.toFixed(2)),
    shipping_tier: String(shippingTier || 'Standard Delivery'),
    items: formattedItems,
  };

  if (coupon) {
    ecommercePayload.coupon = String(coupon);
  }

  pushToDataLayer(
    {
      event: 'add_shipping_info',
      ecommerce: ecommercePayload,
    },
    true
  );
};

/**
 * 9. add_payment_info
 * Triggered when the user selects or confirms payment information
 */
export const trackAddPaymentInfo = (
  items = [],
  totalValue = null,
  paymentType = 'COD',
  coupon = null,
  currency = DEFAULT_CURRENCY
) => {
  const rawList = Array.isArray(items) ? items : [items];
  const formattedItems = rawList.map((item) => formatEcommerceItem(item)).filter(Boolean);

  const calculatedValue =
    totalValue !== null && totalValue !== undefined
      ? parseFloat(totalValue)
      : formattedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  const ecommercePayload = {
    currency: currency || DEFAULT_CURRENCY,
    value: Number(calculatedValue.toFixed(2)),
    payment_type: String(paymentType || 'COD'),
    items: formattedItems,
  };

  if (coupon) {
    ecommercePayload.coupon = String(coupon);
  }

  pushToDataLayer(
    {
      event: 'add_payment_info',
      ecommerce: ecommercePayload,
    },
    true
  );
};

/**
 * 10. purchase
 * Triggered strictly upon a real successful purchase/order creation.
 * Implements strict deduplication against order/transaction IDs.
 *
 * @param {Object} orderData - The real completed order returned from the server
 * @param {Array} [fallbackItems] - Fallback items list if orderData.items is not populated
 * @param {string} [currency] - Currency code (defaults to BDT)
 */
export const trackPurchase = (orderData, fallbackItems = [], currency = DEFAULT_CURRENCY) => {
  if (!orderData) return false;

  const transactionId = String(
    orderData.orderNumber || orderData.id || orderData.transactionId || orderData._id || ''
  ).trim();

  if (!transactionId) {
    console.warn('[DataLayer] Cannot track purchase: Missing transaction_id');
    return false;
  }

  // Deduplication check: in-memory Set & sessionStorage
  if (trackedPurchases.has(transactionId)) {
    return false;
  }

  if (typeof window !== 'undefined') {
    try {
      const storageKey = `dl_purchased_${transactionId}`;
      if (sessionStorage.getItem(storageKey)) {
        trackedPurchases.add(transactionId);
        return false;
      }
      sessionStorage.setItem(storageKey, 'true');
    } catch (e) {}
  }

  trackedPurchases.add(transactionId);

  // Extract items from orderData or fallbackItems, with fallback item merging for missing names
  let rawItems = [];
  const sourceItems = (orderData.orderItems && Array.isArray(orderData.orderItems) && orderData.orderItems.length > 0)
    ? orderData.orderItems
    : (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0)
    ? orderData.items
    : (fallbackItems && Array.isArray(fallbackItems) && fallbackItems.length > 0)
    ? fallbackItems
    : [];

  const fallbackMap = new Map();
  if (Array.isArray(fallbackItems)) {
    fallbackItems.forEach((fb) => {
      const fbId = String(fb.productId || fb.id || fb._id || '');
      if (fbId) fallbackMap.set(fbId, fb);
    });
  }

  rawItems = sourceItems.map((item) => {
    const itemId = String(item.productId || item.product?.id || item.id || item._id || '');
    const fallback = fallbackMap.get(itemId);
    if (fallback) {
      return {
        ...fallback,
        ...item,
        productName: item.productName || item.product?.productName || item.name || fallback.productName || fallback.name || fallback.title || '',
        name: item.productName || item.product?.productName || item.name || fallback.productName || fallback.name || fallback.title || '',
        price: item.unitPrice || item.price || fallback.price || fallback.unitPrice || 0,
        unitPrice: item.unitPrice || item.price || fallback.price || fallback.unitPrice || 0,
      };
    }
    return item;
  });

  // Also include bundle items if present
  if (orderData.bundleItems && Array.isArray(orderData.bundleItems)) {
    rawItems = [...rawItems, ...orderData.bundleItems];
  }

  const formattedItems = rawItems.map((item) => formatEcommerceItem(item)).filter(Boolean);

  const value =
    orderData.grandTotal !== undefined && orderData.grandTotal !== null
      ? parseFloat(orderData.grandTotal)
      : orderData.totalAmount !== undefined && orderData.totalAmount !== null
      ? parseFloat(orderData.totalAmount)
      : formattedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);

  const tax =
    orderData.tax !== undefined && orderData.tax !== null
      ? parseFloat(orderData.tax)
      : 0;

  const shipping =
    orderData.shippingCost !== undefined && orderData.shippingCost !== null
      ? parseFloat(orderData.shippingCost)
      : 0;

  const ecommercePayload = {
    transaction_id: transactionId,
    value: Number(value.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    shipping: Number(shipping.toFixed(2)),
    currency: currency || DEFAULT_CURRENCY,
    items: formattedItems,
  };

  if (orderData.couponCode || orderData.voucher_promo || orderData.coupon) {
    ecommercePayload.coupon = String(
      orderData.couponCode || orderData.coupon || (orderData.voucher_promo ? 'COUPON' : '')
    );
  }

  pushToDataLayer(
    {
      event: 'purchase',
      ecommerce: ecommercePayload,
    },
    true
  );

  return true;
};

/**
 * 11. search
 * Triggered when a user performs a search
 */
export const trackSearch = (searchTerm) => {
  const query = String(searchTerm || '').trim();
  if (!query) return;

  pushToDataLayer({
    event: 'search',
    search_term: query,
  });
};

/**
 * 12. login
 * Triggered on successful user authentication
 */
export const trackLogin = (method = 'email') => {
  pushToDataLayer({
    event: 'login',
    method: String(method || 'email'),
  });
};

/**
 * 13. sign_up
 * Triggered on successful new user account registration
 */
export const trackSignUp = (method = 'email') => {
  pushToDataLayer({
    event: 'sign_up',
    method: String(method || 'email'),
  });
};
