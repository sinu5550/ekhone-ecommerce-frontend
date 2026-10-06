/**
 * Extract all unique variant options from product variants
 */
export function extractVariantOptions(product) {
    if (!product || !product.productVariants || product.productVariants.length === 0) {
        return [];
    }

    const optionsMap = new Map();

    product.productVariants.forEach(variant => {
        if (!variant.attributes || typeof variant.attributes !== 'object') return;
        Object.entries(variant.attributes).forEach(([key, value]) => {
            if (!optionsMap.has(key)) {
                optionsMap.set(key, new Set());
            }
            optionsMap.get(key).add(value);
        });
    });

    return Array.from(optionsMap.entries()).map(([attributeName, values]) => ({
        attributeName,
        values: Array.from(values).sort()
    }));
}

/**
 * Get the default variant or first available variant
 */
export function getDefaultVariant(product) {
    if (!product || !product.productVariants || product.productVariants.length === 0) {
        return null;
    }

    const defaultVariant = product.productVariants.find(v => v.isDefault);
    if (defaultVariant) return defaultVariant;

    return product.productVariants[0];
}

/**
 * Find variant matching selected attributes
 */
export function findMatchingVariant(product, selectedAttributes) {
    if (!product || !product.productVariants) return null;

    return product.productVariants.find(variant => {
        if (!variant.attributes) return false;
        return Object.entries(selectedAttributes).every(
            ([key, value]) => variant.attributes[key] === value
        );
    }) || null;
}

/**
 * Format price with commas
 */
export function formatPrice(price) {
    const num = typeof price === 'number' ? price : parseFloat(price);
    const ceilNum = isNaN(num) ? 0 : Math.ceil(num);
    return new Intl.NumberFormat('en-BD', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(ceilNum);
}
