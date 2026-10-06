// src/lib/deliveryCharge.js

/**
 * Default fallback delivery charges in BDT:
 * - Inside Dhaka: ৳80
 * - Outside Dhaka: ৳150
 */
export const DEFAULT_DELIVERY_CHARGES = {
  insideDhaka: 80,
  outsideDhaka: 150,
};

/**
 * Calculates delivery charges synchronously by picking the HIGHEST delivery charge
 * among all products/bundles present in the cart.
 *
 * @param {Array} items - Array of cart or checkout item objects
 * @returns {{ insideDhaka: number, outsideDhaka: number }}
 */
export function calculateDeliveryCharges(items = []) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { ...DEFAULT_DELIVERY_CHARGES };
  }

  const insideCharges = [];
  const outsideCharges = [];

  items.forEach((item) => {
    if (!item) return;

    // Handle bundle items
    if (item.isBundle && Array.isArray(item.bundleItems) && item.bundleItems.length > 0) {
      item.bundleItems.forEach((bItem) => {
        const bProd = bItem.product || bItem;
        const rawInside =
          bProd.insideDhakaDeliveryCharge !== undefined &&
          bProd.insideDhakaDeliveryCharge !== null &&
          bProd.insideDhakaDeliveryCharge !== ""
            ? bProd.insideDhakaDeliveryCharge
            : null;
        const rawOutside =
          bProd.outsideDhakaDeliveryCharge !== undefined &&
          bProd.outsideDhakaDeliveryCharge !== null &&
          bProd.outsideDhakaDeliveryCharge !== ""
            ? bProd.outsideDhakaDeliveryCharge
            : null;

        if (rawInside !== null && !isNaN(parseFloat(rawInside))) {
          insideCharges.push(parseFloat(rawInside));
        }
        if (rawOutside !== null && !isNaN(parseFloat(rawOutside))) {
          outsideCharges.push(parseFloat(rawOutside));
        }
      });
      return;
    }

    // Check direct properties or nested product properties
    const rawInside =
      item.insideDhakaDeliveryCharge !== undefined &&
      item.insideDhakaDeliveryCharge !== null &&
      item.insideDhakaDeliveryCharge !== ""
        ? item.insideDhakaDeliveryCharge
        : (item.product?.insideDhakaDeliveryCharge !== undefined &&
           item.product?.insideDhakaDeliveryCharge !== null &&
           item.product?.insideDhakaDeliveryCharge !== ""
            ? item.product.insideDhakaDeliveryCharge
            : null);

    const rawOutside =
      item.outsideDhakaDeliveryCharge !== undefined &&
      item.outsideDhakaDeliveryCharge !== null &&
      item.outsideDhakaDeliveryCharge !== ""
        ? item.outsideDhakaDeliveryCharge
        : (item.product?.outsideDhakaDeliveryCharge !== undefined &&
           item.product?.outsideDhakaDeliveryCharge !== null &&
           item.product?.outsideDhakaDeliveryCharge !== ""
            ? item.product.outsideDhakaDeliveryCharge
            : null);

    if (rawInside !== null && !isNaN(parseFloat(rawInside))) {
      insideCharges.push(parseFloat(rawInside));
    }
    if (rawOutside !== null && !isNaN(parseFloat(rawOutside))) {
      outsideCharges.push(parseFloat(rawOutside));
    }
  });

  const insideDhaka =
    insideCharges.length > 0
      ? Math.max(...insideCharges)
      : DEFAULT_DELIVERY_CHARGES.insideDhaka;

  const outsideDhaka =
    outsideCharges.length > 0
      ? Math.max(...outsideCharges)
      : DEFAULT_DELIVERY_CHARGES.outsideDhaka;

  return {
    insideDhaka: Math.max(0, insideDhaka),
    outsideDhaka: Math.max(0, outsideDhaka),
  };
}

/**
 * Returns shipping cost based on selected shipping method ('dhaka-city' or 'outside')
 *
 * @param {Array} items - Checkout items
 * @param {string} shippingMethod - 'dhaka-city' | 'outside'
 * @returns {number}
 */
export function getShippingCost(items = [], shippingMethod = "dhaka-city") {
  const charges = calculateDeliveryCharges(items);
  return shippingMethod === "outside" ? charges.outsideDhaka : charges.insideDhaka;
}
