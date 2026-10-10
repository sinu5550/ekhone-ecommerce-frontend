// Comprehensive color map for converting hex to friendly names
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
    "#8B4513": "Saddle Brown",
    "#D2B48C": "Tan",
    "#F5DEB3": "Wheat",
    "#FFF8DC": "Cornsilk",
    "#FFE4E1": "Misty Rose",
    "#FFB6C1": "Light Pink",
    "#FF69B4": "Hot Pink",
    "#C71585": "Medium Violet Red",
    "#7B1FA2": "Deep Purple",
    "#4A148C": "Dark Violet",
    "#3F51B5": "Indigo",
    "#2196F3": "Sky Blue",
    "#03A9F4": "Light Blue",
    "#00BCD4": "Cyan",
    "#009688": "Teal",
    "#4CAF50": "Green",
    "#8BC34A": "Light Green",
    "#CDDC39": "Lime",
    "#FFEB3B": "Yellow",
    "#FFC107": "Amber",
    "#FF9800": "Orange",
    "#FF5722": "Deep Orange",
    "#795548": "Brown",
    "#9E9E9E": "Gray",
    "#607D8B": "Blue Gray",
    "#050505": "Black",
    "#111827": "Dark Slate",
    "#1F2937": "Charcoal",
    "#374151": "Slate Gray",
    "#6B7280": "Cool Gray",
    "#9CA3AF": "Light Slate",
    "#E5E7EB": "Light Gray",
    "#F3F4F6": "Off White",
    "#F9FAFB": "White Smoke",
    "#FEF2F2": "Soft Red",
    "#FFF1F2": "Soft Rose",
    "#EC4899": "Pink",
    "#DB2777": "Deep Pink",
    "#BE185D": "Dark Pink",
    "#E11D48": "Crimson",
    "#DC2626": "Red",
    "#B91C1C": "Dark Red",
    "#EA580C": "Orange",
    "#C2410C": "Rust Orange",
    "#D97706": "Amber",
    "#B45309": "Deep Amber",
    "#CA8A04": "Mustard",
    "#16A34A": "Green",
    "#15803D": "Forest Green",
    "#0D9488": "Teal",
    "#0F766E": "Deep Teal",
    "#0284C7": "Ocean Blue",
    "#0369A1": "Deep Sky Blue",
    "#2563EB": "Royal Blue",
    "#1D4ED8": "Cobalt Blue",
    "#4F46E5": "Indigo",
    "#4338CA": "Dark Indigo",
    "#7C3AED": "Purple",
    "#6D28D9": "Deep Purple",
    "#9333EA": "Violet",
    "#7E22CE": "Dark Violet",
    "#C026D3": "Fuchsia",
    "#A21CAF": "Deep Fuchsia",
    "#475569": "Slate",
    "#334155": "Dark Slate",
    "#64748B": "Slate Gray",
    "#94A3B8": "Silver Slate",
    "#78716C": "Stone Gray",
    "#57534E": "Dark Stone",
    "#A8A29E": "Warm Gray",
    "#D6D3D1": "Light Stone",
    "#E7E5E4": "Warm White",
};

// Color anchors for finding the nearest human-readable color name
const COLOR_ANCHORS = [
    { name: "Black", r: 0, g: 0, b: 0 },
    { name: "White", r: 255, g: 255, b: 255 },
    { name: "Red", r: 239, g: 68, b: 68 },
    { name: "Crimson", r: 185, g: 28, b: 28 },
    { name: "Maroon", r: 128, g: 0, b: 0 },
    { name: "Rose", r: 244, g: 63, b: 94 },
    { name: "Pink", r: 236, g: 72, b: 153 },
    { name: "Light Pink", r: 255, g: 192, b: 203 },
    { name: "Purple", r: 168, g: 85, b: 247 },
    { name: "Deep Purple", r: 109, g: 40, b: 217 },
    { name: "Violet", r: 139, g: 92, b: 246 },
    { name: "Indigo", r: 99, g: 102, b: 241 },
    { name: "Blue", r: 59, g: 130, b: 246 },
    { name: "Royal Blue", r: 29, g: 78, b: 216 },
    { name: "Navy Blue", r: 30, g: 58, b: 138 },
    { name: "Sky Blue", r: 56, g: 189, b: 248 },
    { name: "Cyan", r: 6, g: 182, b: 212 },
    { name: "Teal", r: 20, g: 184, b: 166 },
    { name: "Green", r: 34, g: 197, b: 94 },
    { name: "Forest Green", r: 21, g: 128, b: 61 },
    { name: "Emerald", r: 16, g: 185, b: 129 },
    { name: "Lime", r: 132, g: 204, b: 22 },
    { name: "Olive", r: 128, g: 128, b: 0 },
    { name: "Yellow", r: 234, g: 179, b: 8 },
    { name: "Gold", r: 255, g: 215, b: 0 },
    { name: "Amber", r: 245, g: 158, b: 11 },
    { name: "Orange", r: 249, g: 115, b: 22 },
    { name: "Deep Orange", r: 234, g: 88, b: 12 },
    { name: "Brown", r: 161, g: 98, b: 7 },
    { name: "Coffee Brown", r: 120, g: 53, b: 15 },
    { name: "Beige", r: 245, g: 245, b: 220 },
    { name: "Khaki", r: 240, g: 230, b: 140 },
    { name: "Gray", r: 156, g: 163, b: 175 },
    { name: "Dark Gray", r: 75, g: 85, b: 99 },
    { name: "Light Gray", r: 229, g: 231, b: 235 },
    { name: "Silver", r: 192, g: 192, b: 192 },
    { name: "Charcoal", r: 51, g: 51, b: 51 },
];

/**
 * Check if string is a valid Hex Color code
 */
export function isHexColor(str) {
    if (typeof str !== 'string') return false;
    const trimmed = str.trim();
    return /^#([0-9A-F]{3}){1,2}$/i.test(trimmed);
}

/**
 * Helper to convert hex to RGB
 */
function hexToRgb(hex) {
    let cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return null;
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

/**
 * Find closest color name using Euclidean distance in RGB space
 */
function findClosestColorName(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    let minDistance = Infinity;
    let closestName = hex;

    for (const anchor of COLOR_ANCHORS) {
        const dr = rgb.r - anchor.r;
        const dg = rgb.g - anchor.g;
        const db = rgb.b - anchor.b;
        // Weighted Euclidean distance (human eye is more sensitive to green, then red, then blue)
        const distance = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
        if (distance < minDistance) {
            minDistance = distance;
            closestName = anchor.name;
        }
    }

    return closestName;
}

/**
 * Get readable color name from hex or name
 */
export function getColorName(hexOrName) {
    if (!hexOrName || typeof hexOrName !== 'string') return '';
    const trimmed = hexOrName.trim();
    const upper = trimmed.toUpperCase();

    if (COLOR_NAMES_MAP[upper]) return COLOR_NAMES_MAP[upper];
    
    if (/^#[0-9A-F]{3}$/i.test(upper)) {
        const full = '#' + upper[1] + upper[1] + upper[2] + upper[2] + upper[3] + upper[3];
        if (COLOR_NAMES_MAP[full]) return COLOR_NAMES_MAP[full];
    }
    
    if (isHexColor(trimmed)) {
        return findClosestColorName(trimmed);
    }
    
    return hexOrName;
}

/**
 * Convert any raw variantType or attributes map into a clean human readable string
 * e.g. "Color: #000000, Size: XL" -> "Color: Black, Size: XL"
 */
export function formatVariantTypeString(variantTypeOrAttrs) {
    if (!variantTypeOrAttrs) return '';

    if (typeof variantTypeOrAttrs === 'object') {
        return Object.entries(variantTypeOrAttrs)
            .map(([k, v]) => {
                const cleanVal = isHexColor(v) ? getColorName(v) : v;
                return `${k}: ${cleanVal}`;
            })
            .join(', ');
    }

    if (typeof variantTypeOrAttrs === 'string') {
        // Regex replace any hex codes inside the string like "#000000" or "#fff"
        return variantTypeOrAttrs.replace(/#([0-9A-Fa-f]{3}){1,2}\b/g, (match) => {
            return getColorName(match);
        });
    }

    return String(variantTypeOrAttrs);
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
