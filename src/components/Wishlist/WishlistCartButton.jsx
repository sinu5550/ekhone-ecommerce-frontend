// components/Wishlist/WishlistCartButton.jsx
'use client';

import { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

export default function WishlistCartButton({ product, onMoveComplete }) {
    const { addToCart, isInCart } = useCart();
    const { removeFromWishlist } = useWishlist();
    const [loading, setLoading] = useState(false);
    const [moved, setMoved] = useState(false);

    const isAlreadyInCart = isInCart(product.id, product.variantId);

    const handleMoveToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading || moved || isAlreadyInCart) return;

        setLoading(true);
        try {
            const origPrice = parseFloat(product.originalPrice || product.price || 0);
            let finalPrice = parseFloat(product.discountPrice !== undefined && product.discountPrice !== null ? product.discountPrice : (product.price || 0));

            // Fallback calculate if finalPrice equals origPrice but discount is present
            if (origPrice > 0 && finalPrice >= origPrice) {
                const discVal = parseFloat(product.discountValue || product.campaignInfo?.discountValue || 0);
                if (discVal > 0) {
                    if (product.discountType === "Fixed" || product.campaignInfo?.discountType === "Fixed") {
                        finalPrice = Math.max(0, origPrice - discVal);
                    } else {
                        const discAmt = (origPrice * discVal) / 100;
                        finalPrice = Math.max(0, origPrice - discAmt);
                    }
                }
            }

            const discountAmt = Math.max(0, origPrice - finalPrice);

            const cartProduct = {
                id: product.id,
                productId: product.productId || product.id,
                slug: product.slug,
                productName: product.productName,
                price: finalPrice,
                originalPrice: origPrice,
                discountAmount: discountAmt,
                discountPrice: finalPrice,
                discountValue: product.discountValue || product.campaignInfo?.discountValue || 0,
                discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
                campaignName: product.campaignName || product.campaignInfo?.campaignName || null,
                campaignId: product.campaignId || product.campaignInfo?.id || null,
                images: product.images || [product.image].filter(Boolean),
                image: product.image,
                quantity: 1,
                sku: product.sku,
                status: product.status,
                variantId: product.variantId || null,
                variantAttributes: product.variantAttributes || null,
                variantType: product.variantType || null,
                productType: product.variantId ? 'variant' : 'simple',
            };

            addToCart(cartProduct, 1, product.variantId || null);
            removeFromWishlist(product.id, product.variantId || null);
            setMoved(true);
            if (onMoveComplete) onMoveComplete();
        } catch (_) {
        } finally {
            setLoading(false);
        }
    };

    if (isAlreadyInCart || moved) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold border border-green-200">
                <Check size={14} /> In Cart
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={handleMoveToCart}
            disabled={loading || product.status === false}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                product.status === false
                    ? 'bg-gray-300 cursor-not-allowed opacity-60'
                    : 'bg-[#F45116] hover:bg-[#D9400B] active:scale-95'
            }`}
        >
            <ShoppingCart size={14} />
            <span>{loading ? 'Adding...' : 'Move to Cart'}</span>
        </button>
    );
}
