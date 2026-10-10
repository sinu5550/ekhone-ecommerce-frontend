"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Eye, ShoppingBag } from "lucide-react";
import { toast } from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

export default function ProductCard({ product, onOpenQuickView }) {
    const router = useRouter();
    const { addToCart, setBuyNowItem } = useCart();
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

    if (!product) return null;

    const isWishlisted = isInWishlist(product.id);

    const isVariantProduct = product.productType === "variant" && Array.isArray(product.productVariants) && product.productVariants.length > 0;

    // Image logic
    const displayImage = product.images?.[0] || 
        product.productVariants?.[0]?.image || 
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

    const hoverImage = product.images?.[1] || product.productVariants?.[1]?.image || null;

    // Price calculation
    const originalPrice = parseFloat(product.price) || 0;
    const discountValue = parseFloat(product.discountValue) || 
        parseFloat(product.campaignInfo?.discountValue) || 0;

    const calcDiscount = (basePrice) => {
        if (discountValue <= 0) return basePrice;
        if (product.discountType === "Fixed" || product.campaignInfo?.discountType === "Fixed") {
            return Math.max(0, basePrice - discountValue);
        }
        const discountAmt = (basePrice * discountValue) / 100;
        const maxDiscount = product.campaignInfo?.maxDiscountAmount ? parseFloat(product.campaignInfo.maxDiscountAmount) : null;
        return Math.max(0, basePrice - (maxDiscount && discountAmt > maxDiscount ? maxDiscount : discountAmt));
    };

    let discountedPrice = calcDiscount(originalPrice);

    // If it's a variant product, calculate price range across all variants
    const variantPrices = isVariantProduct
        ? (product.productVariants || []).map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0)
        : [];

    const minBasePrice = variantPrices.length > 0 ? Math.min(...variantPrices) : originalPrice;
    const maxBasePrice = variantPrices.length > 0 ? Math.max(...variantPrices) : originalPrice;

    const minDiscountedPrice = calcDiscount(minBasePrice);
    const maxDiscountedPrice = calcDiscount(maxBasePrice);

    const hasPriceRange = isVariantProduct && variantPrices.length > 1 && minDiscountedPrice !== maxDiscountedPrice;

    const discountPercentage = discountValue > 0 
        ? (product.discountType === "Fixed" 
            ? Math.round((discountValue / (isVariantProduct ? minBasePrice : originalPrice)) * 100) 
            : Math.round(discountValue))
        : (originalPrice > discountedPrice ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0);

    const isNew = product.isNew || product.newArrival || (() => {
        if (!product.createdAt) return false;
        const diffDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 45;
    })();

    const toggleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isWishlisted) {
            removeFromWishlist(product.id);
        } else {
            const targetVariant = isVariantProduct
                ? (product.productVariants?.find(v => v.isDefault) || product.productVariants?.[0] || null)
                : null;

            const finalImg = targetVariant?.image || displayImage || product.image;

            addToWishlist({
                ...product,
                image: finalImg,
                images: [finalImg, ...(product.images || [])].filter(Boolean),
                price: discountedPrice,
                originalPrice: originalPrice,
                discountPrice: discountedPrice,
                discountAmount: Math.max(0, originalPrice - discountedPrice),
                discountValue: discountValue,
                discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
                ...(targetVariant && {
                    variantId: targetVariant.id,
                    variantAttributes: targetVariant.attributes,
                    variantType: targetVariant.attributes ? Object.entries(targetVariant.attributes).map(([k, v]) => `${k}: ${v}`).join(", ") : null,
                    productType: "variant",
                }),
            });
        }
    };

    // Add to cart handler
    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isVariantProduct) {
            onOpenQuickView && onOpenQuickView(product);
            return;
        }
        const item = {
            ...product,
            price: discountedPrice,
            originalPrice: originalPrice,
            discountAmount: Math.max(0, originalPrice - discountedPrice),
            discountValue: discountValue,
            discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
            campaignName: product.campaignInfo?.campaignName || null,
            campaignId: product.campaignInfo?.id || product.campaignId || null,
        };
        addToCart(item, 1);
    };

    // Quick View handler
    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onOpenQuickView && onOpenQuickView(product);
    };

    // Buy Now handler
    const handleBuyNow = (e) => {
        e.preventDefault();
        e.stopPropagation();

        let targetVariant = null;
        if (isVariantProduct) {
            targetVariant = product.productVariants?.find(v => v.isDefault) || product.productVariants?.[0] || null;
        }

        const baseVariantPrice = targetVariant?.price ? parseFloat(targetVariant.price) : originalPrice;
        const vFinalPrice = calcDiscount(baseVariantPrice);
        const vDiscAmt = Math.max(0, baseVariantPrice - vFinalPrice);

        const item = {
            ...product,
            price: vFinalPrice,
            originalPrice: baseVariantPrice,
            discountAmount: vDiscAmt,
            discountValue: discountValue,
            discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
            campaignName: product.campaignInfo?.campaignName || null,
            campaignId: product.campaignInfo?.id || product.campaignId || null,
            ...(targetVariant && {
                variantId: targetVariant.id,
                variantAttributes: targetVariant.attributes || targetVariant.variantAttributes || null,
                variantType: targetVariant.title || targetVariant.name || null,
                sku: targetVariant.sku || product.sku,
                image: targetVariant.image || displayImage,
                images: targetVariant.image ? [targetVariant.image] : (product.images || [displayImage]),
                stockQuantity: targetVariant.stockQuantity ?? targetVariant.quantity ?? product.stockQuantity ?? null,
                productVariants: product.productVariants || [],
                productType: "variant",
            }),
        };
        setBuyNowItem(item, 1, targetVariant?.id || null);
        toast.success("Proceeding to checkout...");
        router.push("/checkout?buyNow=true");
    };

    return (
        <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden relative">
            {/* 1. Top Image Container (NO PADDING as requested) */}
            <div className="relative w-full aspect-square bg-[#F8F9FA] overflow-hidden">
                <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full relative">
                    <Image
                        src={displayImage}
                        alt={product.productName || "Product"}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${hoverImage ? "group-hover:opacity-0" : ""}`}
                    />
                    {hoverImage && (
                        <Image
                            src={hoverImage}
                            alt={product.productName || "Product"}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                        />
                    )}
                </Link>

                {/* Badges: Discount percentage top-left */}
                {discountPercentage > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-[#E11D48] text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-xs pointer-events-none z-10">
                        -{discountPercentage}%
                    </div>
                )}

                {/* Wishlist Heart button top-right */}
                <button
                    type="button"
                    onClick={toggleWishlist}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-xs border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#E11D48] transition-all cursor-pointer z-10"
                    title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart size={14} className={isWishlisted ? "fill-[#E11D48] text-[#E11D48]" : ""} />
                </button>

                {/* Hover Action Bar inside image area: [ 🛒 Add to Cart ] + [ 👁 ] matching screenshot */}
                <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#0F172A]/95 hover:bg-black text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
                    >
                        <ShoppingCart size={14} />
                        <span>Add to Cart</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleQuickView}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-black shadow-md flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
                        title="Quick View"
                    >
                        <Eye size={14} />
                    </button>
                </div>
            </div>

            {/* 2. Product Information Section */}
            <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                <div className="space-y-1.5">
                    {/* Product Name (Strict max 2 lines with ellipsis truncation) */}
                    <Link href={`/product/${product.slug || product.id}`} className="block group-hover:text-primary transition-colors">
                        <h3 
                            className="text-sm  font-medium text-slate-800 line-clamp-2 leading-[1.35] min-h-[2.7em] max-h-[2.7em] overflow-hidden" 
                            title={product.productName}
                        >
                            {product.productName}
                        </h3>
                    </Link>

                    {/* Pricing */}
                    <div className="flex flex-wrap items-baseline gap-1.5 pt-0.5">
                        {hasPriceRange ? (
                            <span className="text-md font-bold text-slate-900 flex items-center gap-1">
                                <span><span className="font-black">৳</span>{minDiscountedPrice.toLocaleString()}</span>
                                <span className="text-xs font-semibold text-slate-400">-</span>
                                <span><span className="font-black">৳</span>{maxDiscountedPrice.toLocaleString()}</span>
                            </span>
                        ) : (
                            <span className="text-md text-slate-900">
                                <span className="font-black">৳</span>
                                <span className="font-bold">{discountedPrice.toLocaleString()}</span>
                            </span>
                        )}

                        {discountValue > 0 && (
                            <>
                                {hasPriceRange ? (
                                    (minBasePrice > minDiscountedPrice || maxBasePrice > maxDiscountedPrice) && (
                                        <span className="text-[11.5px] text-slate-400 line-through">
                                            ৳{minBasePrice.toLocaleString()} - ৳{maxBasePrice.toLocaleString()}
                                        </span>
                                    )
                                ) : (
                                    originalPrice > discountedPrice && (
                                        <span className="text-[11.5px] text-slate-400 line-through">
                                            ৳{originalPrice.toLocaleString()}
                                        </span>
                                    )
                                )}
                                <span className="text-[10px] font-bold text-[#cf1b42] bg-rose-50 px-1 py-0.5 rounded">
                                    -{discountPercentage}%
                                </span>
                            </>
                        )}
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center justify-between text-[11px]">
                        {isNew ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full ">
                                New
                            </span>
                        ) : <span />}

                        {product.totalSold || product._totalSold ? (
                            <span className="text-[10px] text-slate-400">
                                {product.totalSold || product._totalSold} sold
                            </span>
                        ) : null}
                    </div>
                </div>

                {/* 3. Bottom Action Bar (Cart Icon button on left + Buy Now button on right) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="h-8 w-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0 shadow-2xs"
                            title="Add to Cart"
                        >
                            <ShoppingCart size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={handleBuyNow}
                            className="flex-1 h-8 px-3 rounded-lg bg-primary hover:bg-primary-hover active:scale-95 text-white font-semibold text-xs sm:text-[12.5px] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs btn-shine relative overflow-hidden"
                        >
                            <ShoppingBag size={13} className="relative z-10" />
                            <span className="relative z-10">Buy Now</span>
                        </button>
                    </div>

                    {/* Cash on Delivery row */}
                    <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1 text-emerald-600 font-medium">
                            <span className="text-xs">💵</span>
                            <span>Cash on Delivery</span>
                        </div>
                        <span className="text-slate-400">In 2-3 days</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
