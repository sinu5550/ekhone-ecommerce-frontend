"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { 
    ShoppingBag, 
    Star, 
    Check, 
    Flame, 
    Sparkles, 
    ArrowDown, 
    CheckCircle2, 
    Play, 
    Video, 
    Timer, 
    Clock 
} from "lucide-react";
import { getVariantColorInfo, getVariantDisplayLabel } from "@/lib/variantHelpers";

export default function LandingHero({ 
    landingPage, 
    allImages = [], 
    selectedImg, 
    onSelectImage, 
    selectedVariant, 
    onSelectVariant, 
    variants = [], 
    variantDiscounts = {},
    onOrderClick 
}) {
    const product = landingPage?.product || {};

    // Per-variant discount amount (৳) set by admin; falls back to 0
    const variantDiscountAmt = selectedVariant
        ? parseFloat(variantDiscounts[selectedVariant.id] || variantDiscounts[String(selectedVariant.id)] || 0)
        : 0;

    // Determine current price: if variant selected, variant.price overrides base price
    const regularPrice = parseFloat(selectedVariant?.costPrice && selectedVariant.costPrice > selectedVariant.price ? selectedVariant.costPrice : (product.price || 0));
    
    // Effective selling price after applying variant-specific discount:
    const rawVariantPrice = selectedVariant?.price 
        ? parseFloat(selectedVariant.price)
        : parseFloat(landingPage.offerPrice || product.salePrice || product.price || 0);
    const activePrice = Math.max(0, rawVariantPrice - variantDiscountAmt);

    const baseRegularPrice = parseFloat(product.price || 0);
    // For variants with a discount, show the raw variant price as the "crossed out" price
    const displayRegularPrice = variantDiscountAmt > 0
        ? rawVariantPrice
        : (regularPrice > activePrice ? regularPrice : (baseRegularPrice > activePrice ? baseRegularPrice : null));
    
    const hasDiscount = displayRegularPrice && displayRegularPrice > activePrice;
    const discountPercent = hasDiscount 
        ? Math.round(((displayRegularPrice - activePrice) / displayRegularPrice) * 100) 
        : 0;

    // Helper to format attribute label
    const getVariantLabel = (v) => getVariantDisplayLabel(v);

    // Bengali digits converter helper
    const toBengaliNumber = (num) => {
        const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
        return String(num).padStart(2, "0").replace(/[0-9]/g, (digit) => bengaliDigits[digit]);
    };

    // Live Persistent Countdown Timer (Cached in localStorage per landing page slug)
    const [timeLeft, setTimeLeft] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const storageKey = `landing_timer_end_${landingPage?.slug || landingPage?.id || 'default'}`;
        const DURATION_MS = (5 * 60 * 60 + 43 * 60 + 20) * 1000; // 5 hours 43 minutes 20 seconds campaign

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

        // If no cached valid future time exists, initialize one from now and persist
        if (!targetEndTime) {
            targetEndTime = Date.now() + DURATION_MS;
            try {
                localStorage.setItem(storageKey, String(targetEndTime));
            } catch (e) {}
        }

        const calculateRemaining = () => {
            const now = Date.now();
            let diff = Math.max(0, Math.floor((targetEndTime - now) / 1000));

            // If timer finished, reset a new realistic duration
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

    // Video existence check
    const hasVideo = Boolean(landingPage.videoUrl && (landingPage.videoUrl.includes("youtube") || landingPage.videoUrl.includes("youtu.be")));
    
    // Media display mode: 'video' | 'image' (if video exists, starts as 'video' by default)
    const [activeMediaType, setActiveMediaType] = useState(() => (hasVideo ? "video" : "image"));

    // Convert youtube URL to embed format safely
    const getEmbedUrl = (url) => {
        if (!url) return "";
        if (url.includes("youtu.be/")) {
            const id = url.split("youtu.be/")[1]?.split("?")[0];
            return `https://www.youtube.com/embed/${id}?autoplay=0`;
        }
        if (url.includes("watch?v=")) {
            const id = url.split("watch?v=")[1]?.split("&")[0];
            return `https://www.youtube.com/embed/${id}?autoplay=0`;
        }
        if (url.includes("embed/")) {
            return url;
        }
        return url;
    };

    return (
        <section className="relative overflow-hidden bg-slate-50/60 py-8  border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main 2-Column Grid: Left (Media & Thumbnails), Right (Title, Price, Features & CTA) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                    {/* LEFT COLUMN: Media / Gallery (Span 5 or 6) */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="relative aspect-[4/5] sm:aspect-square w-full rounded-lg overflow-hidden bg-white border border-slate-200/90 shadow-xs p-3 sm:p-4 flex items-center justify-center">
                            {hasDiscount && (
                                <div className="absolute top-3 left-3 z-20 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                                    <Flame size={13} />
                                    <span>{discountPercent}% ছাড়</span>
                                </div>
                            )}

                            {/* Active Media Display: Video vs Image */}
                            {activeMediaType === "video" && hasVideo ? (
                                <div className="w-full h-full rounded-lg overflow-hidden relative bg-black">
                                    <iframe
                                        src={getEmbedUrl(landingPage.videoUrl)}
                                        title={landingPage.pageTitle}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={selectedImg || "/placeholder.png"}
                                        alt={landingPage.pageTitle || "Product"}
                                        width={0}
                                        height={0}
                                        sizes="(max-width: 1024px) 100vw, 40vw"
                                        priority
                                        className="w-auto h-auto max-w-full max-h-full rounded-lg object-contain hover:scale-105 transition-transform duration-300"
                                        unoptimized={typeof selectedImg === 'string' && selectedImg.startsWith("http")}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Thumbnails Row: Video Button First (if video exists), followed by product images */}
                        {(hasVideo || allImages.length > 0) && (
                            <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-thin px-1">
                                
                                {/* 1. Video Player Option Button (Shown First if video given) */}
                                {hasVideo && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveMediaType("video")}
                                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 relative ${
                                            activeMediaType === "video"
                                                ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs scale-105"
                                                : "border-slate-200 bg-slate-900/90 text-white hover:border-slate-400 opacity-90 hover:opacity-100"
                                        }`}
                                        title="Watch Product Video"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-xs">
                                            <Play size={14} className="fill-white translate-x-0.5" />
                                        </div>
                                        <span className={`text-[10px] font-bold font-hind mt-1 leading-tight ${activeMediaType === 'video' ? 'text-primary' : 'text-slate-200'}`}>
                                            ভিডিও
                                        </span>
                                        {activeMediaType === "video" && (
                                            <div className="absolute top-0.5 right-0.5 bg-primary text-white rounded-full p-0.5">
                                                <Check size={8} />
                                            </div>
                                        )}
                                    </button>
                                )}

                                {/* 2. All Product Images */}
                                {allImages.map((img, i) => {
                                    const isSelected = activeMediaType === "image" && selectedImg === img;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                setActiveMediaType("image");
                                                onSelectImage(img);
                                            }}
                                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden bg-white p-1 transition-all cursor-pointer shrink-0 relative ${
                                                isSelected 
                                                    ? "border-primary ring-2 ring-primary/30 shadow-xs scale-105" 
                                                    : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                                            }`}
                                        >
                                            <div className="relative w-full h-full rounded-lg overflow-hidden">
                                                <Image 
                                                    src={img} 
                                                    alt={`Thumbnail ${i + 1}`} 
                                                    fill 
                                                    className="object-contain rounded-lg" 
                                                    unoptimized={typeof img === 'string' && img.startsWith("http")} 
                                                />
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-0.5 right-0.5 bg-primary text-white rounded-full p-0.5">
                                                    <Check size={8} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Rating, Title, Subtitle, Offer Box, Variants, Bullets & CTA (Span 7) */}
                    <div className="lg:col-span-7 space-y-3">
                        {/* Rating Row */}
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                            <div className="flex items-center text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={15} fill="currentColor" />
                                ))}
                            </div>
                            <span className="font-bold text-slate-800">
                                (৪.৯/৫ রেটিং | ১৮৫০+ ভেরিফাইড রিভিউ)
                            </span>
                        </div>

                        {/* Main Product Title */}
                        <h1 className="text-xl sm:text-3xl font-extrabold text-secound tracking-tight leading-snug sm:leading-snug">
                            {landingPage.pageTitle}
                        </h1>

                        {/* Subtitle / Description */}
                        {landingPage.subTitle && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                {landingPage.subTitle}
                            </p>
                        )}

                        {/* Offer Price Box with Dashed Border and Savings Badge */}
                        <div className="p-4 sm:p-5 bg-white rounded-lg border-2 border-dashed border-primary/30 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-baseline gap-3">
                                    <div>
                                        <span className="text-[11px] font-bold text-slate-500 block">অফার প্রাইস:</span>
                                        <span className="text-2xl sm:text-3xl font-extrabold text-primary font-hind">
                                            ৳ {activePrice.toLocaleString()}
                                        </span>
                                    </div>

                                    {displayRegularPrice && displayRegularPrice > activePrice && (
                                        <div className="pl-3 border-l border-slate-200">
                                            <span className="text-[11px] font-medium text-slate-400 block">পূর্বের মূল্য:</span>
                                            <span className="text-base sm:text-lg text-slate-400 line-through font-hind">
                                                ৳ {displayRegularPrice.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {hasDiscount && (
                                    <div className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs">
                                        <span>৳ {(displayRegularPrice - activePrice).toLocaleString()} টাকা সাশ্রয় ({discountPercent}% ছাড়)</span>
                                    </div>
                                )}
                            </div>

                            {/* Live Urgency Countdown Timer */}
                            <div className="p-2.5 sm:p-3 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 rounded-lg border border-rose-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Timer size={16} className="animate-spin text-primary" style={{ animationDuration: '6s' }} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                            {landingPage.urgencyText || "অফারটি সীমিত সময়ের জন্য! এখনই অর্ডার করুন"}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            বিশেষ ডিসকাউন্ট শেষ হতে বাকি:
                                        </p>
                                    </div>
                                </div>

                                {/* Digital Countdown Digits (Hours : Mins : Secs) */}
                                <div className="flex items-center gap-1.5 shrink-0 font-hind">
                                    <div className="flex flex-col items-center bg-slate-900 text-white px-2 py-1 rounded-md min-w-[36px] shadow-xs">
                                        <span className="text-xs sm:text-sm font-black text-amber-300 leading-none">
                                            {toBengaliNumber(timeLeft.hours)}
                                        </span>
                                        <span className="text-[8px] text-slate-300 mt-0.5">ঘণ্টা</span>
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">:</span>
                                    <div className="flex flex-col items-center bg-slate-900 text-white px-2 py-1 rounded-md min-w-[36px] shadow-xs">
                                        <span className="text-xs sm:text-sm font-black text-amber-300 leading-none">
                                            {toBengaliNumber(timeLeft.minutes)}
                                        </span>
                                        <span className="text-[8px] text-slate-300 mt-0.5">মিনিট</span>
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">:</span>
                                    <div className="flex flex-col items-center bg-primary text-white px-2 py-1 rounded-md min-w-[36px] shadow-xs animate-pulse">
                                        <span className="text-xs sm:text-sm font-black text-white leading-none">
                                            {toBengaliNumber(timeLeft.seconds)}
                                        </span>
                                        <span className="text-[8px] text-rose-100 mt-0.5">সেকেন্ড</span>
                                    </div>
                                </div>
                            </div>

                            {/* Limited Stock Bar */}
                            <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                                    <span className="flex items-center gap-1 text-primary font-bold">
                                        <Flame size={14} /> স্টক সীমিত! আর মাত্র ১৭টি অবশিষ্ট আছে
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-hind">৮৩% বিক্রি সম্পন্ন</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full w-[83%]" />
                                </div>
                            </div>
                        </div>

                        {/* Variant Selection Swatches (if available) */}
                        {variants.length > 0 && (
                            <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                        <Sparkles size={13} className="text-primary" />
                                        <span>ভ্যারিয়েন্ট বেছে নিন:</span>
                                    </label>
                                    <span className="text-[11px] text-slate-500">
                                        {variants.length}টি ভ্যারিয়েন্ট
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {variants.map((v) => {
                                        const isSel = selectedVariant?.id === v.id;
                                        const label = getVariantDisplayLabel(v);
                                        const colorInfo = getVariantColorInfo(v);
                                        const vRawPrice = parseFloat(v.price || 0);
                                        const vDiscount = parseFloat(variantDiscounts[v.id] || variantDiscounts[String(v.id)] || 0);
                                        const vEffectivePrice = Math.max(0, vRawPrice - vDiscount);

                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => {
                                                    if (v.image) setActiveMediaType("image");
                                                    onSelectVariant(v);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                                                    isSel
                                                        ? "border-primary bg-primary text-white shadow-xs scale-105 ring-2 ring-primary/20"
                                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                {/* 1. Variant Thumbnail Image */}
                                                {v.image ? (
                                                    <div className="w-4 h-4 rounded-full overflow-hidden relative shrink-0 border border-white/50">
                                                        <Image src={v.image} alt={label} fill className="object-cover" unoptimized={v.image.startsWith("http")} />
                                                    </div>
                                                ) : colorInfo.hasColor ? (
                                                    /* 2. Visual Color Circle Swatch */
                                                    <span
                                                        className={`w-4 h-4 rounded-full shrink-0 border shadow-inner ${
                                                            isSel ? "border-white ring-1 ring-white/60" : "border-slate-300"
                                                        }`}
                                                        style={{ backgroundColor: colorInfo.colorValue }}
                                                        title={colorInfo.colorName || colorInfo.colorValue}
                                                    />
                                                ) : null}

                                                {/* If it has an image AND a color, also show color circle preview */}
                                                {v.image && colorInfo.hasColor && (
                                                    <span
                                                        className={`w-3 h-3 rounded-full shrink-0 border shadow-inner -ml-1 ${
                                                            isSel ? "border-white ring-1 ring-white/60" : "border-slate-300"
                                                        }`}
                                                        style={{ backgroundColor: colorInfo.colorValue }}
                                                        title={colorInfo.colorName}
                                                    />
                                                )}

                                                <span>{label}</span>
                                                <span className={`text-[10px] font-hind px-1 py-0.2 rounded ${
                                                    isSel ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                                                }`}>
                                                    ৳{vEffectivePrice.toLocaleString()}
                                                    {vDiscount > 0 && (
                                                        <span className="line-through ml-1 opacity-60">৳{vRawPrice.toLocaleString()}</span>
                                                    )}
                                                </span>
                                                {isSel && <CheckCircle2 size={12} className="text-white shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Key Product Feature Checklist */}
                        {(() => {
                            const defaultTrustPoints = [
                                { title: "১০০% অরিজিনাল ও ইনট্যাক্ট বক্স", desc: "অথেনটিক ব্র্যান্ডেড প্রিমিয়াম গ্যাজেট নিশ্চয়তা" },
                                { title: "অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি", desc: "দ্রুত রিপ্লেসমেন্ট ও টেকনিক্যাল সার্ভিসিং সুবিধা" },
                                { title: "হাতে পেয়ে চেক করে পেমেন্ট", desc: "ডেলিভারি ম্যানের সামনে অনবক্স ও চেক করার সুবিধা" },
                                { title: "সারা বাংলাদেশে ফাস্ট ক্যাশ অন ডেলিভারি", desc: "কোন অগ্রিম টাকা ছাড়াই নিশ্চিন্তে অর্ডার করুন" }
                            ];
                            const trustList = Array.isArray(landingPage?.trustPoints) && landingPage.trustPoints.length > 0
                                ? landingPage.trustPoints
                                : defaultTrustPoints;

                            return (
                                <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                                    {trustList.map((pt, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                <Check size={13} />
                                            </div>
                                            <span>
                                                {pt.title && <strong>{pt.title}: </strong>}
                                                {pt.desc || (typeof pt === "string" ? pt : "")}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* CTA Order Button */}
                        <div className="pt-2 space-y-2">
                            <button
                                type="button"
                                onClick={onOrderClick}
                                className="btn-shine w-full py-4 px-6 rounded-lg bg-primary hover:bg-primary-hover text-white text-base sm:text-lg font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group active:scale-[0.99]"
                            >
                                <ShoppingBag size={22} className="group-hover:scale-110 transition-transform" />
                                <span>অর্ডার করুন (ক্যাশ অন ডেলিভারি)</span>
                                <ArrowDown size={20} className="animate-bounce" />
                            </button>
                            <p className="text-center text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                                <Check size={14} className="text-emerald-600" />
                                <span>পণ্য হাতে পেয়ে দেখে টাকা পরিশোধ করার সুবিধা</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

