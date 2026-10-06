"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/Shared/Container";
import ProductCard from "@/components/Shared/ProductCard";
import QuickViewModal from "@/components/Shared/QuickViewModal";

export default function AllProductsSection({ products = [] }) {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!products || products.length === 0) return null;

    const handleOpenQuickView = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Max 10 products for desktop, 8 for mobile
    const displayProducts = products.slice(0, 10);

    return (
        <section className="py-8 bg-white">
            <Container>
                {/* Header with THE FULL CATALOGUE tag and View all products link */}
                <div className="flex items-end justify-between gap-3 mb-5">
                    <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-[#E11D48] uppercase tracking-wider block">
                            THE FULL CATALOGUE
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                            All products
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
                            A quick look at everything on Ekhone — tap &ldquo;View all&rdquo; to browse and filter the full range.
                        </p>
                    </div>

                    <Link
                        href="/product"
                        className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-primary flex items-center gap-1 group transition whitespace-nowrap shrink-0 pb-0.5"
                    >
                        <span>View all products</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </Link>
                </div>

                {/* 5 Column Grid: 10 on desktop (5 cols), 8 on mobile (2 cols) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {displayProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            className={idx >= 8 ? "hidden lg:block" : ""}
                        >
                            <ProductCard
                                product={product}
                                onOpenQuickView={handleOpenQuickView}
                            />
                        </div>
                    ))}
                </div>
            </Container>

            {/* Quick View Variant Modal */}
            <QuickViewModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedProduct(null);
                }}
            />
        </section>
    );
}
