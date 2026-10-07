"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const CART_STORAGE_KEY = "ekhone_cart";
const BUY_NOW_KEY = "ekhone_buy_now_item";

export const useCart = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCart = useCallback(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            setCart(stored ? JSON.parse(stored) : []);
        } catch (_) {
            setCart([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
        const handleUpdate = () => loadCart();
        window.addEventListener("storage", handleUpdate);
        window.addEventListener("cartUpdated", handleUpdate);
        return () => {
            window.removeEventListener("storage", handleUpdate);
            window.removeEventListener("cartUpdated", handleUpdate);
        };
    }, [loadCart]);

    const addToCart = useCallback((product, quantity = 1, variantId = null) => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            const localCart = stored ? JSON.parse(stored) : [];

            const targetVariantId = variantId || product.variantId || null;
            const existingIndex = localCart.findIndex(item => {
                if (targetVariantId && item.variantId) {
                    return item.productId === product.id && item.variantId === targetVariantId;
                }
                return item.productId === product.id && !item.variantId;
            });

            const finalPrice = parseFloat(product.price || 0);
            const origPrice = parseFloat(product.originalPrice || product.price || 0);
            const discountAmt = product.discountAmount !== undefined ? parseFloat(product.discountAmount) : Math.max(0, origPrice - finalPrice);

            const cartItem = {
                id: product.id,
                productId: product.id,
                slug: product.slug,
                productName: product.productName || product.name,
                price: finalPrice,
                originalPrice: origPrice,
                discountAmount: discountAmt,
                discountValue: parseFloat(product.discountValue || 0),
                discountType: product.discountType || "Percentage",
                campaignName: product.campaignName || null,
                campaignId: product.campaignId || null,
                images: Array.isArray(product.images) ? product.images : [product.images || product.image].filter(Boolean),
                quantity: quantity,
                status: product.status,
                sku: product.sku,
                stockQuantity: product.stockQuantity ?? product.quantity ?? null,
                insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ?? null,
                outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ?? null,
                ...(targetVariantId && {
                    variantId: targetVariantId,
                    variantAttributes: product.variantAttributes,
                    variantType: product.variantType,
                    productType: "variant",
                }),
                productVariants: product.productVariants || [],
            };

            if (existingIndex > -1) {
                localCart[existingIndex].quantity += quantity;
            } else {
                localCart.push(cartItem);
            }

            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart));
            setCart(localCart);
            window.dispatchEvent(new CustomEvent("cartUpdated"));
            toast.success("Added to cart!");
            return true;
        } catch (err) {
            toast.error("Failed to add to cart");
            return false;
        }
    }, []);

    const setBuyNowItem = useCallback((product, quantity = 1, variantId = null) => {
        try {
            const targetVariantId = variantId || product.variantId || null;
            const finalPrice = parseFloat(product.price || 0);
            const origPrice = parseFloat(product.originalPrice || product.price || 0);
            const discountAmt = product.discountAmount !== undefined ? parseFloat(product.discountAmount) : Math.max(0, origPrice - finalPrice);

            const buyNowItem = {
                id: product.id,
                productId: product.id,
                slug: product.slug,
                productName: product.productName || product.name,
                price: finalPrice,
                originalPrice: origPrice,
                discountAmount: discountAmt,
                discountValue: parseFloat(product.discountValue || 0),
                discountType: product.discountType || "Percentage",
                campaignName: product.campaignName || null,
                campaignId: product.campaignId || null,
                images: Array.isArray(product.images) ? product.images : [product.images || product.image].filter(Boolean),
                quantity: quantity,
                status: product.status,
                sku: product.sku,
                stockQuantity: product.stockQuantity ?? product.quantity ?? null,
                insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ?? null,
                outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ?? null,
                ...(targetVariantId && {
                    variantId: targetVariantId,
                    variantAttributes: product.variantAttributes,
                    variantType: product.variantType,
                    productType: "variant",
                }),
                productVariants: product.productVariants || [],
            };
            localStorage.setItem(BUY_NOW_KEY, JSON.stringify(buyNowItem));
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    const getBuyNowItem = useCallback(() => {
        try {
            const stored = localStorage.getItem(BUY_NOW_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (_) {
            return null;
        }
    }, []);

    const clearBuyNowItem = useCallback(() => {
        try {
            localStorage.removeItem(BUY_NOW_KEY);
        } catch (_) {}
    }, []);

    const updateQuantity = useCallback((index, newQuantity) => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            const localCart = stored ? JSON.parse(stored) : [];
            if (index >= 0 && index < localCart.length) {
                if (newQuantity <= 0) {
                    localCart.splice(index, 1);
                } else {
                    localCart[index].quantity = newQuantity;
                }
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart));
                setCart(localCart);
                window.dispatchEvent(new CustomEvent("cartUpdated"));
            }
        } catch (_) {}
    }, []);

    const removeFromCart = useCallback((index) => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            const localCart = stored ? JSON.parse(stored) : [];
            if (index >= 0 && index < localCart.length) {
                localCart.splice(index, 1);
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart));
                setCart(localCart);
                window.dispatchEvent(new CustomEvent("cartUpdated"));
                toast.success("Removed from cart");
            }
        } catch (_) {}
    }, []);

    const clearCart = useCallback(() => {
        try {
            localStorage.removeItem(CART_STORAGE_KEY);
            setCart([]);
            window.dispatchEvent(new CustomEvent("cartUpdated"));
        } catch (_) {}
    }, []);

    const getCartCount = useCallback(() => {
        return cart.reduce((total, item) => total + (item.quantity || 1), 0);
    }, [cart]);

    const getCartTotal = useCallback(() => {
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price || 0);
            const qty = item.quantity || 1;
            return total + price * qty;
        }, 0);
    }, [cart]);

    const isInCart = useCallback((productId, variantId = null) => {
        return cart.some(item => {
            if (variantId && item.variantId) {
                return (item.productId === productId || item.id === productId) && item.variantId === variantId;
            }
            return (item.productId === productId || item.id === productId);
        });
    }, [cart]);

    return {
        cart,
        loading,
        addToCart,
        setBuyNowItem,
        getBuyNowItem,
        clearBuyNowItem,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartCount,
        getCartTotal,
        isInCart,
        refreshCart: loadCart,
    };
};
