// Color map for converting hex to friendly names
const COLOR_NAMES_MAP = {
    "#000000": "Black",
    "#FFFFFF": "White",
    "#FF0000": "Red",
    "#00FF00": "Green",
    "#0000FF": "Blue",
    "#FFFF00": "Yellow",
    "#FFA500": "Orange",
    "#800080": "Purple",
    "#FFC0CB": "Pink",
    "#808080": "Gray",
    "#A52A2A": "Brown",
    "#FFD700": "Gold",
    "#C0C0C0": "Silver",
    "#000080": "Navy",
    "#008080": "Teal",
    "#4B0082": "Indigo",
    "#800000": "Maroon",
    "#00FFFF": "Cyan",
    "#FF00FF": "Magenta",
    "#F5F5DC": "Beige",
    "#F0E68C": "Khaki",
    "#E6E6FA": "Lavender",
    "#FA8072": "Salmon",
    "#1A1A1A": "Dark Gray",
    "#333333": "Charcoal",
    "#2C3E50": "Midnight Blue",
    "#1877F2": "Royal Blue",
    "#10B981": "Emerald",
    "#F43F5E": "Rose",
    "#6366F1": "Violet",
    "#D97706": "Amber",
};

/**
 * Check if string is a valid Hex Color code
 */
export function isHexColor(str) {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    return /^#([0-9A-F]{3}){1,2}$/i.test(trimmed);
}

/**
 * Get readable color name from hex or name
 */
export function getColorName(hexOrName) {
    if (!hexOrName || typeof hexOrName !== 'string') return '';
    const upper = hexOrName.trim().toUpperCase();
    if (COLOR_NAMES_MAP[upper]) return COLOR_NAMES_MAP[upper];
    
    if (/^#[0-9A-F]{3}$/i.test(upper)) {
        const full = '#' + upper[1] + upper[1] + upper[2] + upper[2] + upper[3] + upper[3];
        if (COLOR_NAMES_MAP[full]) return COLOR_NAMES_MAP[full];
    }
    
    return hexOrName;
}

/**
 * Extract color information from a variant object
 */
export function getVariantColorInfo(variant) {
    if (!variant) return { hasColor: false, colorValue: null, colorName: '' };
    
    if (variant.attributes && typeof variant.attributes === 'object') {
        for (const [key, val] of Object.entries(variant.attributes)) {
            if (!val) continue;
            const keyLower = key.toLowerCase();
            const isColorKey = keyLower.includes('color') || keyLower.includes('colour') || keyLower.includes('কালার') || keyLower.includes('রং');
            const isHex = isHexColor(val);
            
            if (isHex || isColorKey) {
                return {
                    hasColor: true,
                    colorValue: isHex ? val : val,
                    colorName: getColorName(val),
                    attributeName: key
                };
            }
        }
    }
    
    if (variant.color) {
        return {
            hasColor: true,
            colorValue: variant.color,
            colorName: getColorName(variant.color),
            attributeName: 'Color'
        };
    }
    
    return { hasColor: false, colorValue: null, colorName: '' };
}

/**
 * Format variant attributes to a clean human-readable label
 */
export function getVariantDisplayLabel(v) {
    if (!v) return "";
    if (v.attributes && typeof v.attributes === "object") {
        const parts = Object.entries(v.attributes).map(([key, val]) => {
            if (isHexColor(val)) {
                return getColorName(val);
            }
            return val;
        }).filter(Boolean);
        if (parts.length > 0) return parts.join(" - ");
    }
    
    const parts = [
        v.color ? (isHexColor(v.color) ? getColorName(v.color) : v.color) : null,
        v.size
    ].filter(Boolean);
    
    return parts.join(" - ") || `ভ্যারিয়েন্ট #${v.id}`;
}

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
