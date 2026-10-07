'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Trash2, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/variantHelpers';

export default function CartSliderDrawer({ isOpen, onClose }) {
    const router = useRouter();
    const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, clearCart } = useCart();

    const total = getCartTotal();
    const count = getCartCount();

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

    if (!isOpen) return null;

    const handleCheckout = () => {
        onClose();
        router.push('/checkout');
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
            />

            {/* Slide-out Drawer Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#F45116]">
                            <ShoppingBag size={18} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-base md:text-lg text-gray-900 leading-tight">
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

                {/* Body: Items or Empty State */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3.5 divide-y divide-gray-100">
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

                            return (
                                <div
                                    key={`${item.id}-${item.variantId || 'base'}-${index}`}
                                    className="pt-3.5 first:pt-0 flex gap-3.5 items-start group"
                                >
                                    {/* Product image */}
                                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl border border-gray-100 overflow-hidden shrink-0 bg-gray-50">
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
                                            <h5 className="text-xs md:text-sm font-bold text-gray-900 line-clamp-1">
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

                                        {/* Price and Quantity Controls */}
                                        <div className="flex items-center justify-between mt-2.5">
                                            <span className="font-extrabold text-sm md:text-base text-[#F45116]">
                                                ৳{formatPrice(price * (item.quantity || 1))}
                                            </span>

                                            {/* Quantity Pill */}
                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50/50">
                                                <button
                                                    onClick={() => updateQuantity(index, (item.quantity || 1) - 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold text-gray-900">
                                                    {item.quantity || 1}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(index, (item.quantity || 1) + 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer with Subtotal & Checkout Button */}
                {cart.length > 0 && (
                    <div className="p-4 md:p-5 border-t border-gray-100 bg-gray-50/50 space-y-3 shrink-0">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Subtotal</span>
                            <span className="text-lg font-black text-gray-900">৳{formatPrice(total)}</span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Shipping and discounts will be calculated at checkout.
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <button
                                onClick={() => {
                                    onClose();
                                    router.push('/cart');
                                }}
                                className="py-3 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold transition-all text-center cursor-pointer"
                            >
                                View Cart
                            </button>

                            <button
                                onClick={handleCheckout}
                                className="py-3 px-3 rounded-xl bg-[#F45116] hover:bg-[#D9400B] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#F45116]/20 active:scale-98 cursor-pointer"
                            >
                                <span>Checkout</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
