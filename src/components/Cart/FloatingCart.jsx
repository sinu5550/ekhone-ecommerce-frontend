'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { formatPrice } from '@/lib/variantHelpers';

export default function FloatingCart() {
    const pathname = usePathname();
    const router = useRouter();
    const { getCartCount, getCartTotal } = useCart();
    const { openCartDrawer } = useCartDrawer();

    const cartCount = getCartCount();
    const cartTotal = getCartTotal();

    const [cartTop, setCartTop] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const cartWidgetRef = useRef(null);
    const dragInfoRef = useRef({
        isDown: false,
        startY: 0,
        startTop: 0,
        moved: false,
    });

    const isCartOrCheckout = pathname === '/cart' || pathname === '/checkout';

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const saved = localStorage.getItem('ekhone_floating_cart_y');
        const defaultTop = window.innerHeight * 0.45;
        if (saved && !isNaN(Number(saved))) {
            const parsed = Number(saved);
            const min = 65;
            const max = window.innerHeight - 160;
            setCartTop(Math.max(min, Math.min(max, parsed)));
        } else {
            setCartTop(defaultTop);
        }

        const handleResize = () => {
            setCartTop((prev) => {
                if (prev === null) return window.innerHeight * 0.45;
                const min = 65;
                const max = window.innerHeight - 160;
                return Math.max(min, Math.min(max, prev));
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const onDragStart = (e) => {
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        const rect = cartWidgetRef.current?.getBoundingClientRect();
        const currentTop = rect ? rect.top : (cartTop || window.innerHeight * 0.45);

        dragInfoRef.current = {
            isDown: true,
            startY: clientY,
            startTop: currentTop,
            moved: false,
        };

        const onDragMove = (moveEvent) => {
            if (!dragInfoRef.current.isDown) return;
            const moveY = moveEvent.type.startsWith('touch') ? moveEvent.touches[0].clientY : moveEvent.clientY;
            const deltaY = moveY - dragInfoRef.current.startY;

            if (Math.abs(deltaY) > 4) {
                dragInfoRef.current.moved = true;
                if (!isDragging) setIsDragging(true);

                const min = 60;
                const max = window.innerHeight - 160;
                const newTop = Math.max(min, Math.min(max, dragInfoRef.current.startTop + deltaY));
                setCartTop(newTop);
            }
        };

        const onDragEnd = () => {
            if (!dragInfoRef.current.isDown) return;
            dragInfoRef.current.isDown = false;
            setIsDragging(false);

            setCartTop((latest) => {
                if (latest !== null) {
                    try {
                        localStorage.setItem('ekhone_floating_cart_y', latest.toString());
                    } catch (_) {}
                }
                return latest;
            });

            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
            window.removeEventListener('touchcancel', onDragEnd);
        };

        window.addEventListener('mousemove', onDragMove, { passive: false });
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
        window.addEventListener('touchcancel', onDragEnd);
    };

    const handleCartClick = (e) => {
        if (dragInfoRef.current.moved || isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        openCartDrawer();
    };

    if (isCartOrCheckout) return null;

    return (
        <div
            ref={cartWidgetRef}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            style={{
                top: cartTop !== null ? `${cartTop}px` : '45%',
            }}
            className={`fixed right-0 z-40 touch-none select-none ${
                isDragging ? 'cursor-grabbing scale-105 shadow-2xl transition-none' : 'cursor-grab'
            }`}
            title="Drag to reposition cart or click to view bag"
        >
            <button
                type="button"
                draggable={false}
                onClick={handleCartClick}
                className="flex flex-col items-center bg-[#F45116] shadow-[0_4px_20px_rgba(244,81,22,0.35)] rounded-l-2xl overflow-hidden border border-[#F45116]/30 border-r-0 hover:translate-x-[-3px] transition-transform duration-300 group/sticky-cart cursor-grab active:cursor-grabbing text-left"
            >
                {/* Drag Handle Indicator */}
                <div className="w-full flex justify-center items-center pt-2 pb-0.5 opacity-60 group-hover/sticky-cart:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-white/90 rounded-full" />
                        <span className="w-1 h-1 bg-white/90 rounded-full" />
                        <span className="w-1 h-1 bg-white/90 rounded-full" />
                    </div>
                </div>

                {/* Main Cart Body */}
                <div className="bg-[#F45116] text-white p-2.5 pt-0.5 flex flex-col items-center justify-center w-16 md:w-20 min-h-[58px] md:min-h-[66px] group-hover/sticky-cart:bg-[#D9400B] transition-colors relative pointer-events-none">
                    <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    <span className="text-[10px] md:text-[11px] font-bold whitespace-nowrap mt-1">
                        {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                {/* Bottom Total Pill */}
                <div className="flex bg-white text-gray-900 py-1.5 md:py-2 px-2 md:px-3 items-center justify-center w-16 md:w-20 border-t border-gray-100 pointer-events-none">
                    <span className="text-[11px] md:text-[13px] font-black text-[#F45116] truncate">
                        ৳{formatPrice(cartTotal)}
                    </span>
                </div>
            </button>
        </div>
    );
}
