"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

export default function LandingFloatingBottomBar({
    price = 0,
    onOrderClick
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const footerEl = document.getElementById("landing-footer");

        const checkVisibility = () => {
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;

            // Check if footer has reached the bottom of the viewport
            let footerReached = false;
            if (footerEl) {
                const footerRect = footerEl.getBoundingClientRect();
                // When top of footer enters the viewport (i.e. reaches near the bottom of screen)
                if (footerRect.top <= windowHeight) {
                    footerReached = true;
                }
            }

            // Show bottom bar always, ONLY hide when footer has arrived
            setIsVisible(!footerReached);
        };

        // Run check initially
        checkVisibility();

        // Add scroll & resize listeners with passive option for performance
        window.addEventListener("scroll", checkVisibility, { passive: true });
        window.addEventListener("resize", checkVisibility, { passive: true });

        // IntersectionObserver for reactive precision
        let observer;
        if ("IntersectionObserver" in window && footerEl) {
            observer = new IntersectionObserver(
                () => {
                    checkVisibility();
                },
                {
                    threshold: [0, 0.05, 0.1, 0.2, 0.5]
                }
            );

            observer.observe(footerEl);
        }

        return () => {
            window.removeEventListener("scroll", checkVisibility);
            window.removeEventListener("resize", checkVisibility);
            if (observer) {
                observer.disconnect();
            }
        };
    }, []);

    const formattedPrice = Number(price || 0).toLocaleString("en-BD");

    return (
        <aside
            aria-label="Floating order action"
            className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-6px_20px_rgba(0,0,0,0.12)] px-4 py-2.5 sm:py-3 transition-all duration-300 ease-in-out ${
                isVisible
                    ? "translate-y-0 opacity-100 pointer-events-auto"
                    : "translate-y-full opacity-0 pointer-events-none"
            }`}
        >
            <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
                {/* Left: Total Price info */}
                <div className="flex flex-col justify-center min-w-fit">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium font-hind leading-tight">
                        টোটাল প্রাইস:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-primary font-hind tracking-tight leading-none mt-0.5">
                        ৳ {formattedPrice}
                    </span>
                </div>

                {/* Right: Order Now Button */}
                <button
                    type="button"
                    onClick={onOrderClick}
                    className="flex-1 max-w-[280px] bg-primary hover:bg-primary-hover text-white font-bold text-sm sm:text-base py-2.5 sm:py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/30 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                    <ShoppingCart className="w-5 h-5 flex-shrink-0 animate-pulse" />
                    <span className="font-hind tracking-wide font-extrabold">অর্ডার করুন</span>
                </button>
            </div>
        </aside>
    );
}
