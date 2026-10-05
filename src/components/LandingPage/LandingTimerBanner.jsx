"use client";

import { useState, useEffect } from "react";
import { Timer, Flame, ShoppingBag, ArrowDown, Sparkles } from "lucide-react";

export default function LandingTimerBanner({ 
    landingPage, 
    onOrderClick 
}) {
    // Bengali digits converter helper
    const toBengaliNumber = (num) => {
        const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        return String(num).padStart(2, "0").replace(/[0-9]/g, (digit) => bengaliDigits[digit]);
    };

    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        // Shared persistent key matching LandingHero
        const storageKey = `landing_timer_end_${landingPage?.slug || landingPage?.id || 'default'}`;
        const DURATION_MS = (5 * 60 * 60 + 43 * 60 + 20) * 1000;

        let targetEndTime = null;
        try {
            const cached = localStorage.getItem(storageKey);
            if (cached) {
                const parsed = parseInt(cached, 10);
                if (!isNaN(parsed) && parsed > Date.now()) {
                    targetEndTime = parsed;
                }
            }
        } catch (e) {
            console.warn("Storage access error", e);
        }

        if (!targetEndTime) {
            targetEndTime = Date.now() + DURATION_MS;
            try {
                localStorage.setItem(storageKey, String(targetEndTime));
            } catch (e) {}
        }

        const calculateRemaining = () => {
            const now = Date.now();
            let diff = Math.max(0, Math.floor((targetEndTime - now) / 1000));

            if (diff <= 0) {
                targetEndTime = Date.now() + (3 * 60 * 60 + 15 * 60) * 1000;
                try {
                    localStorage.setItem(storageKey, String(targetEndTime));
                } catch (e) {}
                diff = Math.floor((targetEndTime - Date.now()) / 1000);
            }

            const hours = Math.floor(diff / 3600);
            const minutes = Math.floor((diff % 3600) / 60);
            const seconds = diff % 60;

            setTimeLeft({ hours, minutes, seconds });
        };

        calculateRemaining();
        const intervalId = setInterval(calculateRemaining, 1000);

        return () => clearInterval(intervalId);
    }, [landingPage?.slug, landingPage?.id]);

    return (
        <section className="w-full bg-gradient-to-r from-[#0d223c] via-[#102d50] to-[#0d223c] text-white py-6 sm:py-8 px-4 border-y-2 border-amber-400/40 relative overflow-hidden shadow-md font-hind">
            {/* Background Glow effects */}
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
                {/* Left: Urgency Headline & Subtitle */}
                <div className="text-center lg:text-left space-y-1 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/25 border border-primary/40 text-amber-300 text-xs font-bold mb-1 shadow-xs">
                        <Flame size={14} className="text-primary animate-pulse fill-primary" />
                        <span>ধামাকা মেগা অফার ক্যাম্পেইন</span>
                        <Sparkles size={12} className="text-amber-300" />
                    </div>
                    <h3 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
                        {landingPage?.urgencyText || "অফারটি সীমিত সময়ের জন্য! বিশেষ ছাড়ে এখনই অর্ডার করুন"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                        স্টক ফুরিয়ে যাওয়ার আগেই আপনার পছন্দের পণ্যটি দ্রুত সংগ্রহ করুন
                    </p>
                </div>

                {/* Right Group: Big Timer Blocks + Order Now CTA */}
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full lg:w-auto justify-center">
                    {/* Big Digital Countdown Clock */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* Hours */}
                        <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border border-white/15 rounded-xl w-14 h-14 sm:w-16 sm:h-16 shadow-inner">
                            <span className="text-xl sm:text-2xl font-black text-amber-300 leading-none">
                                {toBengaliNumber(timeLeft.hours)}
                            </span>
                            <span className="text-[10px] text-slate-300 mt-1 font-semibold">ঘণ্টা</span>
                        </div>

                        <span className="text-xl font-bold text-amber-400 animate-pulse">:</span>

                        {/* Minutes */}
                        <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border border-white/15 rounded-xl w-14 h-14 sm:w-16 sm:h-16 shadow-inner">
                            <span className="text-xl sm:text-2xl font-black text-amber-300 leading-none">
                                {toBengaliNumber(timeLeft.minutes)}
                            </span>
                            <span className="text-[10px] text-slate-300 mt-1 font-semibold">মিনিট</span>
                        </div>

                        <span className="text-xl font-bold text-amber-400 animate-pulse">:</span>

                        {/* Seconds */}
                        <div className="flex flex-col items-center justify-center bg-primary text-white border border-primary/60 rounded-xl w-14 h-14 sm:w-16 sm:h-16 shadow-lg shadow-primary/30">
                            <span className="text-xl sm:text-2xl font-black text-white leading-none">
                                {toBengaliNumber(timeLeft.seconds)}
                            </span>
                            <span className="text-[10px] text-rose-100 mt-1 font-semibold">সেকেন্ড</span>
                        </div>
                    </div>

                    {/* Big Order CTA Button */}
                    <button
                        type="button"
                        onClick={onOrderClick}
                        className="btn-shine w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-base font-extrabold shadow-lg shadow-primary/40 hover:shadow-primary/60 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer group shrink-0 active:scale-95"
                    >
                        <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                        <span>এখনই অর্ডার করুন</span>
                        <ArrowDown size={18} className="animate-bounce" />
                    </button>
                </div>
            </div>
        </section>
    );
}
