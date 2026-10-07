'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus, Tag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/variantHelpers';

export default function CartSliderDrawer({ isOpen, onClose }) {
    const router = useRouter();
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearBuyNowItem } = useCart();

    const total = getCartTotal();
    const count = getCartCount();

    // Calculate total original price & total discount savings
    const totalOriginal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const orig = parseFloat(item.originalPrice || item.price || 0);
            const qty = item.quantity || 1;
            return sum + orig * qty;
        }, 0);
    }, [cart]);

    const totalSavings = Math.max(0, totalOriginal - total);

    // Lock background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleCheckout = () => {
        // Clear any previous single "Buy Now" product so checkout always loads all cart items
        try {
            clearBuyNowItem();
        } catch (_) {}
        onClose();
        router.push('/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex justify-end">
                    {/* Smooth Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
                    />

                    {/* Smooth Spring & Ease Slide-out Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 28,
                            stiffness: 260,
                            mass: 0.85,
                        }}
                        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-100"
                    >
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#F45116]">
                                    <ShoppingBag size={19} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                                        Shopping Cart
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {count} {count === 1 ? 'item' : 'items'} in your bag
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                                title="Close cart"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Total Savings Banner if any discount */}
                        {totalSavings > 0 && cart.length > 0 && (
                            <div className="bg-emerald-50 border-b border-emerald-100/80 px-4 py-2 flex items-center gap-2 text-emerald-800 text-xs font-semibold shrink-0">
                                <Tag size={14} className="text-emerald-600 shrink-0" />
                                <span>You are saving ৳{formatPrice(totalSavings)} on this order!</span>
                            </div>
                        )}

                        {/* Body: Items or Empty State */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-gray-100">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                        <ShoppingBag size={36} className="text-gray-300" />
                                    </div>
                                    <h4 className="font-bold text-lg text-gray-800 mb-1">
                                        Your cart is empty
                                    </h4>
                                    <p className="text-xs text-gray-500 max-w-xs mb-6">
                                        Looks like you haven't added anything to your cart yet.
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            router.push('/product');
                                        }}
                                        className="px-6 py-3 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                cart.map((item, index) => {
                                    const image =
                                        item.image ||
                                        (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null) ||
                                        '/placeholder.png';
                                    const price = parseFloat(item.price || 0);
                                    const originalPrice = parseFloat(item.originalPrice || price);
                                    const hasDiscount = originalPrice > price;
                                    const discountPct = hasDiscount
                                        ? Math.round(((originalPrice - price) / originalPrice) * 100)
                                        : 0;
                                    const quantity = item.quantity || 1;

                                    return (
                                        <div
                                            key={`${item.id}-${item.variantId || 'base'}-${index}`}
                                            className="pt-3.5 first:pt-0 flex gap-3.5 items-start group"
                                        >
                                            {/* Product image */}
                                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
                                                <Image
                                                    src={image}
                                                    alt={item.productName || 'Product'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Item details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h5 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                                                        {item.productName}
                                                    </h5>
                                                    <button
                                                        onClick={() => removeFromCart(index)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1 cursor-pointer shrink-0"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>

                                                {/* Variant Attributes */}
                                                {item.variantType && (
                                                    <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                        {item.variantType}
                                                    </p>
                                                )}

                                                {/* Price with Original Price & Discount Tag */}
                                                <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                                                    <span className="font-extrabold text-sm sm:text-base text-[#F45116]">
                                                        ৳{formatPrice(price * quantity)}
                                                    </span>

                                                    {hasDiscount && (
                                                        <>
                                                            <span className="text-xs text-gray-400 line-through font-medium">
                                                                ৳{formatPrice(originalPrice * quantity)}
                                                            </span>
                                                            <span className="bg-[#E11D48]/10 text-[#E11D48] text-[10px] font-bold px-1.5 py-0.2 rounded">
                                                                -{discountPct}% OFF
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Quantity Pill Controls */}
                                                <div className="flex items-center justify-between mt-2.5">
                                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                                                        <button
                                                            onClick={() => updateQuantity(index, quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-gray-900">
                                                            {quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(index, quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>

                                                    <span className="text-[11px] text-gray-400">
                                                        ৳{formatPrice(price)} each
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer with Subtotal, Discount Savings & Checkout Button */}
                        {cart.length > 0 && (
                            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/60 space-y-3 shrink-0">
                                {totalSavings > 0 && (
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Regular Price</span>
                                        <span className="line-through">৳{formatPrice(totalOriginal)}</span>
                                    </div>
                                )}

                                {totalSavings > 0 && (
                                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                                        <span>Discount Savings</span>
                                        <span>-৳{formatPrice(totalSavings)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200/60">
                                    <span className="text-gray-700 font-bold">Subtotal</span>
                                    <span className="text-lg font-black text-gray-900">৳{formatPrice(total)}</span>
                                </div>

                                <p className="text-[11px] text-gray-500">
                                    Shipping charge will be calculated at checkout based on delivery address.
                                </p>

                                <div className="pt-1">
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-3.5 px-4 rounded-xl bg-[#F45116] hover:bg-[#D9400B] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-[#F45116]/25 active:scale-98 cursor-pointer"
                                    >
                                        <span>Proceed to Checkout</span>
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
