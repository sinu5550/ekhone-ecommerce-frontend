'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/Shared/ProductCard';
import QuickViewModal from '@/components/Shared/QuickViewModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function RelatedProductsSlider({ relatedProducts = [] }) {
    const visibleRelatedProducts = (relatedProducts || []).filter(p => p && p.status !== false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(4);
    const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) {
            nextSlide();
        } else if (distance < -minSwipeDistance) {
            prevSlide();
        }
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setItemsPerPage(4);
            } else if (window.innerWidth >= 768) {
                setItemsPerPage(3);
            } else {
                setItemsPerPage(2);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, visibleRelatedProducts.length - itemsPerPage);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    };

    if (visibleRelatedProducts.length === 0) return null;

    return (
        <div className="mt-14 mb-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                        Related Products
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Customers also viewed these authentic items
                    </p>
                </div>

                {visibleRelatedProducts.length > itemsPerPage && (
                    <div className="flex gap-2">
                        <button
                            onClick={prevSlide}
                            aria-label="Previous"
                            className="p-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={nextSlide}
                            aria-label="Next"
                            className="p-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative group">
                <div
                    className="overflow-hidden"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                        }}
                    >
                        {visibleRelatedProducts.map((relatedProduct) => (
                            <div
                                key={relatedProduct.id}
                                className="shrink-0 pr-3 md:pr-4"
                                style={{ width: `${100 / itemsPerPage}%` }}
                            >
                                <ProductCard
                                    product={relatedProduct}
                                    onOpenQuickView={(prod) => {
                                        setSelectedQuickViewProduct(prod);
                                        setIsQuickViewOpen(true);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedQuickViewProduct && (
                <QuickViewModal
                    isOpen={isQuickViewOpen}
                    onClose={() => {
                        setIsQuickViewOpen(false);
                        setSelectedQuickViewProduct(null);
                    }}
                    product={selectedQuickViewProduct}
                />
            )}
        </div>
    );
}
