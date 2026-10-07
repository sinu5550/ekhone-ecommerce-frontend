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

    const isHidden = 
        pathname === '/cart' || 
        pathname === '/checkout' || 
        pathname?.startsWith('/landing');

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
        if (e.button !== undefined && e.button !== 0) return;
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? 0;
        const rect = cartWidgetRef.current?.getBoundingClientRect();
        const currentTop = rect ? rect.top : (cartTop ?? window.innerHeight * 0.45);

        dragInfoRef.current = {
            isDown: true,
            startY: clientY,
            startTop: currentTop,
            moved: false,
        };

        const onDragMove = (moveEvent) => {
            if (!dragInfoRef.current.isDown) return;
            const currentClientY = moveEvent.clientY ?? (moveEvent.touches && moveEvent.touches[0]?.clientY) ?? 0;
            const deltaY = currentClientY - dragInfoRef.current.startY;

            if (!dragInfoRef.current.moved && Math.abs(deltaY) > 4) {
                dragInfoRef.current.moved = true;
                setIsDragging(true);
            }

            if (dragInfoRef.current.moved) {
                if (moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }
                const height = cartWidgetRef.current?.offsetHeight || 110;
                const min = 65;
                const max = window.innerHeight - height - 65;
                const newTop = Math.max(min, Math.min(max, dragInfoRef.current.startTop + deltaY));
                setCartTop(newTop);
            }
        };

        const onDragEnd = () => {
            if (dragInfoRef.current.isDown) {
                if (dragInfoRef.current.moved) {
                    setCartTop((latest) => {
                        if (latest !== null) {
                            try {
                                localStorage.setItem('ekhone_floating_cart_y', latest.toString());
                            } catch (_) {}
                        }
                        return latest;
                    });
                    setTimeout(() => {
                        dragInfoRef.current.moved = false;
                        setIsDragging(false);
                    }, 100);
                } else {
                    setIsDragging(false);
                }
                dragInfoRef.current.isDown = false;
            }

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

    if (isHidden) return null;

    return (
        <div
            ref={cartWidgetRef}
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            onDragStart={(e) => e.preventDefault()}
            style={{
                top: cartTop !== null ? `${cartTop}px` : '45%',
            }}
            className={`fixed right-0 z-40 touch-none select-none ${
                isDragging ? 'cursor-grabbing shadow-2xl transition-none' : 'cursor-grab'
            }`}
            title="Drag to reposition cart or click to view bag"
        >
            <button
                type="button"
                draggable={false}
                onClick={handleCartClick}
                className="flex flex-col items-center w-16 md:w-20 rounded-l-2xl overflow-hidden border border-[#F45116]/40 border-r-0 shadow-[0_4px_20px_rgba(244,81,22,0.35)] hover:translate-x-[-3px] transition-transform duration-300 group/sticky-cart cursor-grab active:cursor-grabbing text-left bg-white p-0"
            >
                {/* Top Section: Orange Background (Header + Counter) */}
                <div className="w-full bg-[#F45116] group-hover/sticky-cart:bg-[#D9400B] text-white transition-colors flex flex-col items-center pt-2 pb-2.5 px-1.5 pointer-events-none">
                    {/* Drag Handle Indicator */}
                    <div className="flex gap-1 mb-1 opacity-70 group-hover/sticky-cart:opacity-100 transition-opacity">
                        <span className="w-1 h-1 bg-white rounded-full" />
                        <span className="w-1 h-1 bg-white rounded-full" />
                        <span className="w-1 h-1 bg-white rounded-full" />
                    </div>

                    <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-white my-0.5" />
                    <span className="text-[10px] md:text-[11px] font-bold whitespace-nowrap leading-tight">
                        {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
                    </span>
                </div>

                {/* Bottom Section: Pure White (Price only, seamlessly clipped by parent button's rounded-l-2xl) */}
                <div className="w-full bg-white text-gray-900 py-1.5 md:py-2 px-1 flex items-center justify-center pointer-events-none border-t border-orange-100/80">
                    <span className="text-[11px] md:text-[13px] font-black text-[#F45116] truncate text-center">
                        ৳{formatPrice(cartTotal)}
                    </span>
                </div>
            </button>
        </div>
    );
}
