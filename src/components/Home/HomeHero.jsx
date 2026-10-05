"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
    ChevronLeft, 
    ChevronRight, 
    ArrowRight, 
    CheckCircle2, 
    Truck, 
    Banknote
} from "lucide-react";

export default function HomeHero({ heroSliders = [], featuredProducts = [] }) {
    // Dynamic default slides fallback
    const defaultSlides = [
        {
            id: 1,
            badge: "BANGLADESH'S PREMIUM STORE",
            title: "Online Shopping in Bangladesh, All in One Place",
            description: "Buy authentic products — pay Cash on Delivery at your doorstep.",
            buttonText: "Shop now",
            buttonLink: "/product",
            categoryText: "Browse categories",
            categoryLink: "/product",
            productTitle: "Tri tex printed cotton unstitched salwar kameez",
            productPrice: "৳1,350",
            productOriginalPrice: "৳1,850",
            productImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
            shopBadge: "Original Guarantee"
        },
        {
            id: 2,
            badge: "EXCLUSIVE ELECTRONICS & GADGETS",
            title: "Next-Gen Smartphones & Smart Accessories",
            description: "100% Genuine warranty products with fast nationwide shipping.",
            buttonText: "Shop now",
            buttonLink: "/product",
            categoryText: "View Gadgets",
            categoryLink: "/product",
            productTitle: "Samsung Galaxy S24 Ultra Flagship 5G",
            productPrice: "৳120,000",
            productOriginalPrice: "৳135,000",
            productImage: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80",
            shopBadge: "Official Warranty"
        },
        {
            id: 3,
            badge: "PREMIUM LIFESTYLE & BEAUTY",
            title: "Trending Fashion & Authentic Beauty Essentials",
            description: "Curated collections with hassle-free 7-day easy exchange.",
            buttonText: "Shop now",
            buttonLink: "/product",
            categoryText: "Explore Fashion",
            categoryLink: "/product",
            productTitle: "Designer Silk Embroidered Festive Saree",
            productPrice: "৳3,450",
            productOriginalPrice: "৳4,990",
            productImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
            shopBadge: "Handpicked Quality"
        }
    ];

    // Priority 1: Backend HeroSliders configured in Admin
    // Priority 2: Featured Products
    // Priority 3: Default curated slides
    let slides = defaultSlides;

    // Helper to resolve product image from images, variants, or string
    const resolveProductImage = (prod, fallbackImg) => {
        if (!prod) return fallbackImg;

        // 1. Direct array of images
        if (Array.isArray(prod.images) && prod.images.length > 0) {
            const first = prod.images[0];
            if (typeof first === "string" && first.trim()) return first.trim();
            if (first?.url) return first.url.trim();
        }

        // 2. Product Variants Image
        if (Array.isArray(prod.productVariants) && prod.productVariants.length > 0) {
            const variantWithImg = prod.productVariants.find(
                (v) => v?.image && typeof v.image === "string" && v.image.trim()
            );
            if (variantWithImg?.image) return variantWithImg.image.trim();
        }

        // 3. String representation (JSON or raw URL)
        if (typeof prod.images === "string" && prod.images.trim()) {
            try {
                const parsed = JSON.parse(prod.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    if (typeof first === "string" && first.trim()) return first.trim();
                    if (first?.url) return first.url.trim();
                }
            } catch (_) {
                if (prod.images.startsWith("http") || prod.images.startsWith("/")) {
                    return prod.images.trim();
                }
            }
        }

        // 4. Fallback prod.image
        if (prod.image && typeof prod.image === "string" && prod.image.trim()) {
            return prod.image.trim();
        }

        return fallbackImg;
    };

    if (Array.isArray(heroSliders) && heroSliders.length > 0) {
        slides = heroSliders.map((slider, idx) => {
            const prod = slider.product || null;
            const fallback = defaultSlides[idx % defaultSlides.length].productImage;
            const prodImg = slider.image || resolveProductImage(prod, fallback);
            const price = prod?.price ? `৳${parseFloat(prod.price).toLocaleString()}` : "৳1,450";
            const productSlug = prod?.slug || prod?.id || "";
            
            return {
                id: slider.id || idx,
                badge: slider.badge || "BANGLADESH'S PREMIUM STORE",
                title: slider.title || defaultSlides[0].title,
                description: slider.sub_title || defaultSlides[0].description,
                buttonText: "Shop now",
                buttonLink: slider.link || (productSlug ? `/product/${productSlug}` : "/product"),
                categoryText: "Browse categories",
                categoryLink: slider.categoryLink || "/product",
                productTitle: prod?.productName || slider.title,
                productPrice: price,
                productOriginalPrice: null,
                productImage: prodImg,
                shopBadge: "Verified Original"
            };
        });
    } else if (Array.isArray(featuredProducts) && featuredProducts.length > 0) {
        slides = featuredProducts.map((p, idx) => {
            const fallback = defaultSlides[idx % defaultSlides.length].productImage;
            const img = resolveProductImage(p, fallback);
            const productSlug = p.slug || p.id;
            return {
                id: p.id || idx,
                badge: defaultSlides[idx % defaultSlides.length].badge,
                title: defaultSlides[idx % defaultSlides.length].title,
                description: defaultSlides[idx % defaultSlides.length].description,
                buttonText: "Shop now",
                buttonLink: `/product/${productSlug}`,
                categoryText: "Browse categories",
                categoryLink: "/product",
                productTitle: p.productName || defaultSlides[idx % defaultSlides.length].productTitle,
                productPrice: `৳${parseFloat(p.price || 1200).toLocaleString()}`,
                productOriginalPrice: p.regularPrice ? `৳${parseFloat(p.regularPrice).toLocaleString()}` : null,
                productImage: img,
                shopBadge: "Verified Original"
            };
        });
    }

    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto rotate slides every 6 seconds
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const slide = slides[currentSlide] || slides[0] || defaultSlides[0];

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section className="w-full py-4 sm:py-6 bg-slate-50/70 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Hero Grid: Left Large Dark Hero Card (8 cols) + Right 2 Promo Cards (4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
                    
                    {/* ================= LEFT MAIN DARK HERO SLIDER (Span 8) ================= */}
                    <div className="lg:col-span-9 bg-gradient-to-br from-[#121c2d] via-[#0f172a] to-[#1e1329] text-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[440px] sm:min-h-[480px]">
                        {/* Background Ambient Glows */}
                        <div className="absolute -top-24 -left-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

                        {/* Top Badge */}
                        <div className="relative z-10 mb-6 sm:mb-8">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] sm:text-xs font-bold tracking-wider uppercase">
                                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                <span>{slide.badge}</span>
                            </div>
                        </div>

                        {/* Middle Content Row: Left Title & CTAs, Right Floating Product Showcase Card */}
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            
                            {/* Left Text & Stats (Span 7) */}
                            <div className="md:col-span-7 space-y-4 sm:space-y-6">
                                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
                                    {slide.title}
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-300 max-w-md font-normal leading-relaxed">
                                    {slide.description}
                                </p>

                                {/* Trust Metrics Row */}
                                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-left">
                                    <div>
                                        <div className="text-xs sm:text-sm font-black text-white">COD</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Pay on Delivery</div>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-black text-white">100% Original</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Verified Quality</div>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm font-black text-white">7-Day</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Easy Returns</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <Link
                                        href={slide.buttonLink}
                                        className="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2.5 transition shadow-md hover:scale-105 active:scale-95 group cursor-pointer"
                                    >
                                        <span>{slide.buttonText}</span>
                                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                                            <ArrowRight size={11} strokeWidth={3} />
                                        </div>
                                    </Link>

                                    <Link
                                        href={slide.categoryLink}
                                        className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white rounded-full text-xs sm:text-sm font-semibold border border-white/15 transition cursor-pointer"
                                    >
                                        {slide.categoryText}
                                    </Link>
                                </div>
                            </div>

                            {/* Right Floating Product Showcase Card (Span 5) */}
                            <div className="md:col-span-5 flex justify-center md:justify-end">
                                <div className="w-full max-w-[260px] sm:max-w-[280px] bg-white rounded-2xl p-3 shadow-2xl relative transition-transform duration-300 hover:-translate-y-1">
                                    {/* Store / Verified Pill Header */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 mb-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-700">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        <span className="truncate">{slide.shopBadge}</span>
                                    </div>

                                    {/* Product Image Frame with Slide Arrows */}
                                    <div className="relative w-full h-44 sm:h-48 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center group">
                                        <Image
                                            src={slide.productImage}
                                            alt={slide.productTitle}
                                            fill
                                            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                                            unoptimized
                                        />

                                        {/* Prev/Next arrows on product image */}
                                        {slides.length > 1 && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        prevSlide();
                                                    }}
                                                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-md text-slate-700 hover:text-primary flex items-center justify-center transition cursor-pointer opacity-80 hover:opacity-100"
                                                    aria-label="Previous slide"
                                                >
                                                    <ChevronLeft size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        nextSlide();
                                                    }}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-md text-slate-700 hover:text-primary flex items-center justify-center transition cursor-pointer opacity-80 hover:opacity-100"
                                                    aria-label="Next slide"
                                                >
                                                    <ChevronRight size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {/* Dots Indicator under Product image */}
                                    {slides.length > 1 && (
                                        <div className="flex items-center justify-center gap-1.5 py-2">
                                            {slides.map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setCurrentSlide(i)}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                                        currentSlide === i ? "w-5 bg-primary" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                                                    }`}
                                                    aria-label={`Slide ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Product Details Row & Red Circle Arrow Button */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-800 truncate" title={slide.productTitle}>
                                                {slide.productTitle}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-xs sm:text-sm font-black text-slate-900">
                                                    {slide.productPrice}
                                                </span>
                                                {slide.productOriginalPrice && (
                                                    <span className="text-[10px] text-slate-400 line-through">
                                                        {slide.productOriginalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Link
                                            href={slide.buttonLink}
                                            className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shrink-0 shadow-md hover:scale-110 active:scale-95 transition cursor-pointer"
                                            title="View Product"
                                        >
                                            <ArrowRight size={14} strokeWidth={2.6} />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ================= RIGHT 2 PROMO CARDS (Span 4) ================= */}
                    <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                        
                        {/* 1. Top Warm Orange Card: 100% Cash on Delivery */}
                        <div className="bg-gradient-to-br from-[#FFF5F0] via-[#FFE8DE] to-[#FFD7C5] rounded-2xl sm:rounded-3xl p-2 sm:p-4 flex items-center justify-between relative overflow-hidden border border-orange-200/70 shadow-md group hover:shadow-lg transition">
                            <div className="space-y-2 max-w-[65%] z-10">
                                <div className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Trusted Service
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    100% Cash on Delivery
                                </h3>
                                <p className="text-xs text-slate-600 font-normal">
                                    Pay in cash when your order arrives.
                                </p>
                                <Link
                                    href="/product"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition pt-2 group-hover:translate-x-1 cursor-pointer"
                                >
                                    <span>Shop now</span>
                                    <ArrowRight size={12} strokeWidth={2.4} />
                                </Link>
                            </div>

                            {/* Glowing Orange Cash Icon Box */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#F45116] to-[#D9400B] text-white flex items-center justify-center shadow-lg relative z-10 group-hover:scale-105 transition-transform">
                                    <Banknote size={26} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Bottom Navy Card: Nationwide Delivery */}
                        <div className="bg-gradient-to-br from-[#F0F4F8] via-[#E2EAF2] to-[#D0DEEC] rounded-2xl sm:rounded-3xl p-2 sm:p-4 flex items-center justify-between relative overflow-hidden border border-slate-200/80 shadow-md group hover:shadow-lg transition">
                            <div className="space-y-2 max-w-[65%] z-10">
                                <div className="inline-block px-2.5 py-0.5 bg-secound/10 text-secound rounded-full text-[10px] font-bold uppercase tracking-wider">
                                    Express Shipping
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                                    Nationwide Delivery
                                </h3>
                                <p className="text-xs text-slate-600 font-normal">
                                    Fast & safe  delivery across Bangladesh.
                                </p>
                                <Link
                                    href="/product"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-secound hover:text-primary transition pt-2 group-hover:translate-x-1 cursor-pointer"
                                >
                                    <span>Shop now</span>
                                    <ArrowRight size={12} strokeWidth={2.4} />
                                </Link>
                            </div>

                            {/* Glowing Navy Truck Icon Box */}
                            <div className="relative shrink-0">
                                <div className="absolute inset-0 bg-secound rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity" />
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#102D50] to-[#0A1C33] text-white flex items-center justify-center shadow-lg relative z-10 group-hover:scale-105 transition-transform">
                                    <Truck size={26} strokeWidth={2} />
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </section>
    );
}
