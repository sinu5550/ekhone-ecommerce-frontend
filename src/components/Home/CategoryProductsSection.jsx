"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Container from "@/components/Shared/Container";
import ProductCard from "@/components/Shared/ProductCard";
import QuickViewModal from "@/components/Shared/QuickViewModal";

export default function CategoryProductsSection({
  title,
  subtitle,
  categoryName,
  products = [],
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!products || products.length === 0) return null;

  // Max 10 products for laptop/desktop
  const displayProducts = products.slice(0, 10);

  const handleOpenQuickView = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <Container>
        {/* Header */}
        <div className="flex items-end justify-between gap-3 mb-5">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              {subtitle || "FEATURED COLLECTION"}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {title || categoryName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Handpicked selection from {categoryName || "this category"}
            </p>
          </div>

          <Link
            href={`/product?category=${encodeURIComponent(categoryName || title)}`}
            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group transition whitespace-nowrap shrink-0 pb-0.5"
          >
            <span>View all</span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-0.5 transition-transform shrink-0"
            />
          </Link>
        </div>

        {/* Responsive Grid: 5 cols on lg/xl (10 cards / 2 rows), 2 cols on mobile (8 cards / 4 rows) */}
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
