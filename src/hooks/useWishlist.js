// hooks/useWishlist.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { formatVariantTypeString } from '@/lib/variantHelpers';

const WISHLIST_STORAGE_KEY = 'ekhone_wishlist';
const WISHLIST_EVENTS = {
    UPDATED: 'wishlistUpdated',
};

export const useWishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    const getWishlistItemId = (productId, variantId = null) => {
        return variantId ? `${productId}-${variantId}` : String(productId);
    };

    const loadWishlist = useCallback(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            setWishlist(stored ? JSON.parse(stored) : []);
        } catch (_) {
            setWishlist([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadWishlist();
        const handleUpdate = () => loadWishlist();
        window.addEventListener('storage', handleUpdate);
        window.addEventListener(WISHLIST_EVENTS.UPDATED, handleUpdate);
        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener(WISHLIST_EVENTS.UPDATED, handleUpdate);
        };
    }, [loadWishlist]);

    const isInWishlist = useCallback((productId, variantId = null) => {
        if (!productId) return false;
        if (variantId) {
            const targetId = getWishlistItemId(productId, variantId);
            return wishlist.some(item => getWishlistItemId(item.id || item.productId, item.variantId) === targetId);
        }
        // If variantId not specified, return true if product or any of its variants is in wishlist
        return wishlist.some(item => String(item.id || item.productId) === String(productId));
    }, [wishlist]);

    const addToWishlist = useCallback((product) => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            const currentList = stored ? JSON.parse(stored) : [];
            const targetId = getWishlistItemId(product.id, product.variantId);

            if (currentList.some(item => getWishlistItemId(item.id || item.productId, item.variantId) === targetId)) {
                toast.success('Already in wishlist!');
                return false;
            }

            const rawOrigPrice = parseFloat(product.originalPrice || product.price || 0);
            let finalPrice = parseFloat(product.price || 0);
            const discValue = parseFloat(product.discountValue || product.campaignInfo?.discountValue || 0);

            if (product.discountPrice !== undefined && product.discountPrice !== null) {
                finalPrice = parseFloat(product.discountPrice);
            } else if (discValue > 0) {
                if (product.discountType === "Fixed" || product.campaignInfo?.discountType === "Fixed") {
                    finalPrice = Math.max(0, rawOrigPrice - discValue);
                } else {
                    const discAmt = (rawOrigPrice * discValue) / 100;
                    const maxDisc = product.campaignInfo?.maxDiscountAmount ? parseFloat(product.campaignInfo.maxDiscountAmount) : null;
                    finalPrice = Math.max(0, rawOrigPrice - (maxDisc && discAmt > maxDisc ? maxDisc : discAmt));
                }
            }

            const cleanVariantType = product.variantType 
                ? formatVariantTypeString(product.variantType)
                : (product.variantAttributes ? formatVariantTypeString(product.variantAttributes) : null);

            const item = {
                id: product.id,
                productId: product.id,
                wishlistId: targetId,
                slug: product.slug,
                sku: product.sku,
                productName: product.productName || product.name,
                price: finalPrice,
                originalPrice: rawOrigPrice,
                discountPrice: finalPrice,
                discountValue: discValue,
                discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
                quantity: product.quantity ?? product.stockQuantity ?? 1,
                images: Array.isArray(product.images) ? product.images : [product.images || product.image].filter(Boolean),
                image: product.image || (Array.isArray(product.images) ? product.images[0] : null),
                status: product.status !== false,
                variantId: product.variantId || null,
                variantAttributes: product.variantAttributes || null,
                variantType: cleanVariantType,
                productType: product.productType || (product.variantId ? 'variant' : 'simple'),
            };

            const updated = [item, ...currentList];
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
            setWishlist(updated);
            window.dispatchEvent(new CustomEvent(WISHLIST_EVENTS.UPDATED));
            toast.success('Added to wishlist!', { icon: '❤️' });
            return true;
        } catch (_) {
            toast.error('Failed to add to wishlist');
            return false;
        }
    }, []);

    const removeFromWishlist = useCallback((productId, variantId = null) => {
        try {
            const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
            const currentList = stored ? JSON.parse(stored) : [];
            const targetId = getWishlistItemId(productId, variantId);

            const filtered = currentList.filter(item => getWishlistItemId(item.id || item.productId, item.variantId) !== targetId);
            localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(filtered));
            setWishlist(filtered);
            window.dispatchEvent(new CustomEvent(WISHLIST_EVENTS.UPDATED));
            toast.success('Removed from wishlist');
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    const clearWishlist = useCallback(() => {
        try {
            localStorage.removeItem(WISHLIST_STORAGE_KEY);
            setWishlist([]);
            window.dispatchEvent(new CustomEvent(WISHLIST_EVENTS.UPDATED));
            toast.success('Wishlist cleared');
        } catch (_) {}
    }, []);

    const getWishlistCount = useCallback(() => {
        return wishlist.length;
    }, [wishlist]);

    return {
        wishlist,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        getWishlistCount,
        refreshWishlist: loadWishlist,
    };
};
