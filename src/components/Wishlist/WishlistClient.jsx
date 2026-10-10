'use client';

import Image from "next/image";
import Link from "next/link";
import { Trash2, Heart, Package, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import WishlistCartButton from "./WishlistCartButton";
import Container from "@/components/Shared/Container";
import { formatPrice, getColorName, isHexColor, formatVariantTypeString } from "@/lib/variantHelpers";

const EmptyWishlist = () => (
    <Container className="py-12 md:py-20 font-sans">
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
                    <Heart size={48} className="text-[#F45116]/40" />
                </div>
                <div className="absolute -top-1 -right-1 bg-[#F45116] rounded-full p-2 text-white shadow-md">
                    <Package size={16} />
                </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                Your Wishlist is Empty
            </h2>
            <p className="text-gray-500 mb-8 max-w-md text-xs sm:text-sm leading-relaxed">
                Save your favorite products here so you never lose track of what you love.
            </p>
            <Link
                href="/product"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
            >
                <ShoppingBag size={18} />
                <span>Start Shopping</span>
            </Link>
        </div>
    </Container>
);

export default function WishlistClient() {
    const { wishlist, loading, removeFromWishlist, clearWishlist } = useWishlist();

    if (loading) {
        return (
            <Container className="py-16 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#F45116] border-t-transparent" />
            </Container>
        );
    }

    if (wishlist.length === 0) {
        return <EmptyWishlist />;
    }

    return (
        <div className="bg-gray-50/50 py-6 md:py-10 min-h-screen">
            <Container>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div>
                        <h1 className="text-xl md:text-3xl font-extrabold text-gray-900">
                            My Wishlist
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                            {wishlist.length} {wishlist.length === 1 ? 'item saved' : 'items saved'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={clearWishlist}
                        className="text-xs md:text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer transition-colors"
                    >
                        Clear All
                    </button>
                </div>

                {/* Wishlist Items Table / Grid */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs divide-y divide-gray-100">
                    {wishlist.map((item) => {
                        // Comprehensive resolution for item image (handles item.image, item.images, variant images, etc.)
                        const rawImage = item.image || 
                            (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
                            (Array.isArray(item.productVariants) && item.productVariants.length > 0 ? item.productVariants.find(v => v.image)?.image || item.productVariants[0]?.image : null) ||
                            item.product?.image ||
                            (Array.isArray(item.product?.images) && item.product?.images.length > 0 ? item.product?.images[0] : null) ||
                            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

                        const image = (typeof rawImage === 'string' && rawImage.trim() !== '') 
                            ? rawImage 
                            : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

                        const origPrice = parseFloat(item.originalPrice || item.price || 0);
                        let finalPrice = parseFloat(item.discountPrice !== undefined ? item.discountPrice : (item.price || 0));
                        
                        // Fallback calculate if originalPrice is set and discountValue exists or discountPrice wasn't saved correctly
                        if (origPrice > 0 && finalPrice >= origPrice) {
                            const discVal = parseFloat(item.discountValue || item.campaignInfo?.discountValue || 0);
                            if (discVal > 0) {
                                if (item.discountType === "Fixed" || item.campaignInfo?.discountType === "Fixed") {
                                    finalPrice = Math.max(0, origPrice - discVal);
                                } else {
                                    const discAmt = (origPrice * discVal) / 100;
                                    finalPrice = Math.max(0, origPrice - discAmt);
                                }
                            }
                        }

                        const hasDiscount = origPrice > finalPrice;
                        const discountPct = hasDiscount 
                            ? Math.round(((origPrice - finalPrice) / origPrice) * 100) 
                            : 0;

                        return (
                            <div
                                key={item.wishlistId || item.id}
                                className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    {/* Product Thumbnail */}
                                    <Link
                                        href={`/product/${item.slug || item.id}`}
                                        className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl border border-gray-200 overflow-hidden shrink-0 bg-gray-100"
                                    >
                                        <Image
                                            src={image}
                                            alt={item.productName || 'Product'}
                                            fill
                                            sizes="96px"
                                            unoptimized={typeof image === 'string' && image.startsWith('http')}
                                            className="object-cover"
                                        />
                                    </Link>

                                    {/* Product Details */}
                                    <div className="min-w-0 flex-1">
                                        <Link
                                            href={`/product/${item.slug || item.id}`}
                                            className="text-sm md:text-base font-bold text-gray-900 hover:text-[#F45116] transition-colors line-clamp-1 block"
                                        >
                                            {item.productName}
                                        </Link>

                                        {/* Variant info */}
                                        {(item.variantType || item.variantAttributes) && (
                                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                <span className="text-[11px] font-medium text-gray-500">
                                                    Variant:
                                                </span>
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                                    {formatVariantTypeString(item.variantType || item.variantAttributes)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Price with Discount */}
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-base md:text-lg font-black text-[#F45116]">
                                                ৳{formatPrice(finalPrice)}
                                            </span>
                                            {hasDiscount && (
                                                <>
                                                    <span className="text-xs text-gray-400 line-through">
                                                        ৳{formatPrice(origPrice)}
                                                    </span>
                                                    <span className="bg-[#E11D48]/10 text-[#E11D48] text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                        -{discountPct}% OFF
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* In Stock Badge */}
                                        <div className="mt-1">
                                            {item.status ? (
                                                <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                    In Stock
                                                </span>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions: Move to Cart & Remove */}
                                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                                    <WishlistCartButton product={{
                                        ...item,
                                        image,
                                        price: finalPrice,
                                        originalPrice: origPrice,
                                        discountPrice: finalPrice,
                                        discountAmount: Math.max(0, origPrice - finalPrice),
                                    }} />
                                    
                                    <button
                                        type="button"
                                        onClick={() => removeFromWishlist(item.id, item.variantId)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                                        title="Remove from wishlist"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Container>
        </div>
    );
}
