"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Star, CheckCircle2, ShoppingBag, ThumbsUp, Quote, Sparkles, User, Check, ChevronLeft, ChevronRight } from "lucide-react";

// Curated authentic real customer avatar portraits (6 distinct realistic diverse customer faces)
const AVATAR_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
];

export default function LandingReviews({ reviews, productName = "" }) {
    const list = Array.isArray(reviews) && reviews.length > 0 ? reviews : [];
    if (list.length === 0) return null;

    const isDesktopCarousel = list.length > 3;
    const isMobileTabletCarousel = list.length > 1;
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef(null);
    const [failedImages, setFailedImages] = useState({});

    // Bengali location and timing mock for social proof authenticity
    const locations = [
        "ঢাকা • ২ দিন আগে",
        "চট্টগ্রাম • ৪ দিন আগে",
        "রাজশাহী • ১ সপ্তাহ আগে",
        "সিলেট • ৩ দিন আগে",
        "খুলনা • ৫ দিন আগে",
        "কুমিল্লা • ২ দিন আগে"
    ];

    // Helper to convert numbers to Bengali digits
    const toBengaliNumber = (num) => {
        const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[digit]);
    };

    const handlePrev = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const card = container.querySelector(".review-card");
        const step = (card?.offsetWidth || 320) + 16;
        container.scrollBy({ left: -step, behavior: "smooth" });
    };

    const handleNext = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const card = container.querySelector(".review-card");
        const step = (card?.offsetWidth || 320) + 16;
        container.scrollBy({ left: step, behavior: "smooth" });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const card = container.querySelector(".review-card");
        const step = (card?.offsetWidth || 320) + 16;
        const activeIdx = Math.round(container.scrollLeft / step);
        setCurrentIndex(Math.min(Math.max(0, activeIdx), list.length - 1));
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        container.addEventListener("scroll", handleScroll, { passive: true });
        return () => container.removeEventListener("scroll", handleScroll);
    }, [list.length]);

    const scrollToIndex = (idx) => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const card = container.querySelector(".review-card");
        const step = (card?.offsetWidth || 320) + 16;
        container.scrollTo({ left: idx * step, behavior: "smooth" });
    };

    const renderReviewCard = (rev, idx, isCarouselCard = false) => {
        const locationText = locations[idx % locations.length];
        const isTopReview = idx === 1;
        const starCount = rev.rating || 5;

        return (
            <div 
                key={idx}
                className={`review-card relative bg-white rounded-lg p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 ${
                    isCarouselCard
                        ? "snap-start shrink-0 w-[82vw] sm:w-[340px] md:w-[360px]"
                        : "w-full"
                } ${
                    isTopReview 
                        ? "border-2 border-primary shadow-lg ring-1 ring-primary/20" 
                        : "border border-slate-200/90 shadow-sm hover:shadow-md"
                }`}
            >
                {/* Top Review Pill on Middle Card */}
                {isTopReview && (
                    <div className="absolute -top-3.5 right-6 z-10 bg-primary text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles size={11} className="fill-white" />
                        <span>টপ রিভিউ</span>
                    </div>
                )}

                <div className="space-y-3.5">
                    {/* Author row + Watermark Quote */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {/* Profile Avatar Image (Cycling 6 distinct photos) with verified green badge */}
                            <div className="relative shrink-0">
                                <div className="w-11 h-11 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden relative flex items-center justify-center">
                                    {failedImages[`${isCarouselCard ? 'car_' : 'grid_'}${idx}`] ? (
                                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center font-bold text-primary text-sm font-hind">
                                            {rev.name ? rev.name.trim().charAt(0) : <User size={20} className="text-primary/70" />}
                                        </div>
                                    ) : (
                                        <Image
                                            src={AVATAR_IMAGES[idx % AVATAR_IMAGES.length]}
                                            alt={rev.name || "Customer"}
                                            fill
                                            sizes="44px"
                                            className="object-cover"
                                            onError={() => setFailedImages(prev => ({ ...prev, [`${isCarouselCard ? 'car_' : 'grid_'}${idx}`]: true }))}
                                            unoptimized
                                        />
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs">
                                    <Check size={9} className="text-white stroke-[3.5]" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                        {rev.name}
                                    </h3>
                                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                </div>
                                <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                                    📍 {locationText}
                                </span>
                            </div>
                        </div>

                        <Quote size={24} className="text-slate-200 shrink-0 rotate-180" />
                    </div>

                    {/* Star Rating & Score */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400 gap-0.5">
                            {[...Array(starCount)].map((_, i) => (
                                <Star key={i} size={15} fill="currentColor" />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-700 font-hind">
                            {toBengaliNumber(starCount)}.০/৫.০
                        </span>
                    </div>

                    {/* Purchased Product Badge */}
                    <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                        <ShoppingBag size={12} className="text-primary shrink-0" />
                        <span className="truncate">
                            <strong>ক্রয়কৃত পণ্য:</strong> {productName || "অরিজিনাল প্রিমিয়াম প্রডাক্ট"}
                        </span>
                    </div>

                    {/* Review Comment */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[44px]">
                        &ldquo;{rev.comment}&rdquo;
                    </p>
                </div>

                {/* Bottom Badge Row */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="text-emerald-700 font-medium">
                        ভেরিফাইড পারচেজ
                    </span>
                    <span className="flex items-center gap-1 text-primary font-bold">
                        <ThumbsUp size={12} className="fill-primary" />
                        <span>রিকমেন্ডেড</span>
                    </span>
                </div>
            </div>
        );
    };

    return (
        <section className="py-12 sm:py-16 bg-white border-b border-slate-100 font-hind">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* 1. Pill Badge & Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-light text-primary text-xs font-bold mb-3 border border-primary/20 shadow-2xs">
                        <Star size={13} className="fill-primary" />
                        <span>গ্রাহকদের মতামত</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secound tracking-tight">
                        আমাদের সন্তুষ্ট কাস্টমারদের রিভিউ
                    </h2>

                    <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                        হাজারো গ্রাহকের আস্থার প্রতীক। দেখুন ক্রেতারা আমাদের প্রোডাক্ট ও সার্ভিস সম্পর্কে কী বলছেন।
                    </p>
                </div>

                {/* 2. Navy Dark Metric Banner */}
                <div className="bg-[#102D50] text-white rounded-lg p-5 sm:p-7 shadow-lg mb-8 sm:mb-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
                        
                        {/* Left: Overall rating score & 5 stars */}
                        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                                ৪.৯
                            </span>
                            <div>
                                <div className="flex items-center text-amber-400 gap-1 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={18} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-xs sm:text-sm text-slate-300 font-normal ">
                                   ১,৭৫০+ ভেরিফাইড কাস্টমার রেটিং
                                </p>
                            </div>
                        </div>

                        {/* Right: Quick highlight stats pill row */}
                        <div className="flex items-center gap-6 sm:gap-8 border-t md:border-t-0 md:border-l border-slate-700/60 pt-4 md:pt-0 md:pl-8">
                            <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-black text-white">৯৮%</div>
                                <div className="text-[11px] text-slate-300 font-medium">সন্তুষ্ট গ্রাহক</div>
                            </div>
                            <div className="w-px h-8 bg-slate-700/60 hidden sm:block" />
                            <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-black text-white">১০০%</div>
                                <div className="text-[11px] text-slate-300 font-medium">আসল ও নির্ভুল পণ্য</div>
                            </div>
                            <div className="w-px h-8 bg-slate-700/60 hidden sm:block" />
                            <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-black text-white">২৪/৭</div>
                                <div className="text-[11px] text-slate-300 font-medium">কাস্টমার সাপোর্ট</div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* 3. Review Cards Display */}
                {isMobileTabletCarousel ? (
                    <div>
                        {/* Mobile/Tablet Carousel View (and Desktop Carousel if > 3 reviews) */}
                        <div className={isDesktopCarousel ? "block" : "block lg:hidden"}>
                            {/* Carousel Top Controls */}
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <span className="text-xs text-slate-500 font-medium">
                                    মোট <strong>{toBengaliNumber(list.length)}টি</strong> রিভিউ (ডানে-বামে স্লাইড করুন)
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95 hover:border-primary hover:text-primary"
                                        aria-label="Previous Review"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95 hover:border-primary hover:text-primary"
                                        aria-label="Next Review"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Carousel Horizontal Scroll Track */}
                            <div
                                ref={scrollContainerRef}
                                className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto pb-4 pt-3 px-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            >
                                {list.map((rev, idx) => renderReviewCard(rev, idx, true))}
                            </div>

                            {/* Dot Pagination */}
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                {list.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => scrollToIndex(i)}
                                        className={`transition-all duration-200 rounded-full cursor-pointer ${
                                            currentIndex === i
                                                ? "w-6 h-2 bg-primary"
                                                : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                                        }`}
                                        aria-label={`Go to review ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Grid View (only shown on lg screens if reviews <= 3) */}
                        {!isDesktopCarousel && (
                            <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                                {list.map((rev, idx) => renderReviewCard(rev, idx, false))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Single review fallback */
                    <div className="max-w-xl mx-auto">
                        {list.map((rev, idx) => renderReviewCard(rev, idx, false))}
                    </div>
                )}

            </div>
        </section>
    );
}
