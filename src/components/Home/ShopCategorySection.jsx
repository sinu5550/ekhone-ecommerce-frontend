"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Container from "@/components/Shared/Container";

export default function ShopCategorySection({ categories = [] }) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const activeCategories = (categories || []).filter(c => c.status !== false);

    const checkScrollButtons = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    };

    useEffect(() => {
        checkScrollButtons();
        window.addEventListener("resize", checkScrollButtons);
        return () => window.removeEventListener("resize", checkScrollButtons);
    }, [activeCategories]);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const scrollAmount = direction === "left" ? -280 : 280;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    };

    if (!activeCategories || activeCategories.length === 0) return null;

    return (
        <section className="py-6 sm:py-8 bg-white border-b border-slate-100">
            <Container>
                {/* Header with Title on Left and Carousel Arrow Controls on Right (No 'View all categories' link) */}
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <div>
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                            EXPLORE BY CATEGORY
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            Shop by Category
                        </h2>
                    </div>

                    {/* Navigation Carousel Arrows */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            aria-label="Previous categories"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                            aria-label="Next categories"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Smooth Carousel Container */}
                <div
                    ref={scrollRef}
                    onScroll={checkScrollButtons}
                    className="flex items-center gap-3 sm:gap-4 overflow-x-auto scroll-smooth hide-scrollbar py-1"
                >
                    {activeCategories.map((category) => {
                        const fallbackImg = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80";
                        const imageUrl = category.image || fallbackImg;

                        return (
                            <Link
                                key={category.id}
                                href={`/product?category=${encodeURIComponent(category.name)}`}
                                className="group w-[120px] sm:w-[135px] md:w-[145px] shrink-0 bg-[#F8F9FA] hover:bg-white p-3 rounded-2xl border border-slate-100 hover:border-primary/40 hover:shadow-md transition-all duration-300 flex flex-col items-center text-center text-slate-800"
                            >
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-2 bg-white flex items-center justify-center shadow-2xs">
                                    <Image
                                        src={imageUrl}
                                        alt={category.name}
                                        fill
                                        sizes="100px"
                                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                                    />
                                </div>
                                <h3 className="text-xs font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-1 w-full">
                                    {category.name}
                                </h3>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                    {category.subCategories?.length || 0} sub-items
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </Container>
        </section>
    );
}
