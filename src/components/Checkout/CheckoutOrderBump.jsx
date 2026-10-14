"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Flame, CheckSquare, Square, Package, Eye, ZoomIn, X } from "lucide-react";
import { getVariantDisplayLabel, getVariantColorInfo } from "@/lib/variantHelpers";

export default function CheckoutOrderBump({
  bumpConfig,
  includeBump,
  setIncludeBump,
  selectedBumpVariant,
  setSelectedBumpVariant,
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  if (!bumpConfig || !bumpConfig.product) {
    return null;
  }

  const {
    product: bumpProduct,
    title = "স্পেশাল অ্যাড-অন অফার!",
    subtitle = "মূল পণ্যের সাথে একই পার্সেল ডেলিভারিতে পাচ্ছেন আকর্ষণীয় অতিরিক্ত ছাড়!",
    discount = 0,
    price: configuredBumpPrice = null,
  } = bumpConfig;

  const bumpVariants = Array.isArray(bumpProduct.productVariants)
    ? bumpProduct.productVariants
    : [];

  // Calculate pricing:
  // If admin explicitly set a custom Order Bump Price (orderBumpPrice), prioritize it!
  const hasConfiguredPrice =
    configuredBumpPrice !== null &&
    configuredBumpPrice !== undefined &&
    !isNaN(parseFloat(configuredBumpPrice)) &&
    parseFloat(configuredBumpPrice) > 0;

  const rawPrice = hasConfiguredPrice
    ? parseFloat(configuredBumpPrice)
    : selectedBumpVariant?.price
    ? parseFloat(selectedBumpVariant.price)
    : parseFloat(bumpProduct.salePrice || bumpProduct.price || 0);

  const bumpUnitPrice = rawPrice;
  const bumpDiscount = parseFloat(discount || 0);

  // Determine display image
  const getProductImage = () => {
    if (selectedBumpVariant?.image) return selectedBumpVariant.image;
    if (Array.isArray(bumpProduct.images) && bumpProduct.images.length > 0) {
      const img = bumpProduct.images[0];
      return typeof img === "string" ? img : img?.url || null;
    }
    if (typeof bumpProduct.images === "string" && bumpProduct.images.trim()) {
      try {
        const parsed = JSON.parse(bumpProduct.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          return typeof first === "string" ? first : first?.url || null;
        }
      } catch (_) {
        return bumpProduct.images;
      }
    }
    return bumpProduct.image || null;
  };

  const displayImage = getProductImage();

  return (
    <>
      <div
        onClick={() => setIncludeBump(!includeBump)}
        className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden select-none mb-6 shadow-sm ${
          includeBump
            ? "border-[#F45116] bg-gradient-to-r from-amber-50/80 to-orange-50/70 shadow-md ring-2 ring-[#F45116]/20"
            : "border-dashed border-amber-400 bg-amber-50/40 hover:bg-amber-50/70 hover:border-[#F45116]/70"
        }`}
      >
        {/* Flash Offer Badge Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-[#F45116] to-[#D9400B] text-white shadow-md ring-2 ring-[#F45116]/20 tracking-tight">
            <Flame size={15} className="animate-pulse text-amber-200 shrink-0 fill-amber-200" />
            <span className="font-extrabold drop-shadow-xs">এক ক্লিকে যোগ করুন (স্পেশাল অফার)</span>
          </span>

          {bumpDiscount > 0 && (
            <span className="inline-flex items-center text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
              ৳{bumpDiscount} অতিরিক্ত ছাড়!
            </span>
          )}
        </div>

        <div className="flex items-start gap-3.5">
          {/* Checkbox Icon */}
          <div className="mt-1 shrink-0 text-[#F45116]">
            {includeBump ? (
              <CheckSquare size={22} className="text-[#F45116] fill-[#F45116]/10" />
            ) : (
              <Square size={22} className="text-slate-400 hover:text-slate-600 transition-colors" />
            )}
          </div>

          {/* Bump Product Thumbnail with zoom */}
          <div
            className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden relative shrink-0 p-1 flex items-center justify-center cursor-zoom-in group shadow-xs hover:border-[#F45116]/60 transition"
            title="ছবি বড় করে দেখতে ক্লিক করুন"
            onClick={(e) => {
              e.stopPropagation();
              if (displayImage) {
                setLightboxImg(displayImage);
                setIsLightboxOpen(true);
              }
            }}
          >
            {displayImage ? (
              <>
                <Image
                  src={displayImage}
                  alt={bumpProduct.productName || "Order Bump"}
                  fill
                  className="object-contain p-0.5 group-hover:scale-105 transition-transform duration-200"
                  unoptimized={typeof displayImage === "string" && displayImage.startsWith("http")}
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                  <ZoomIn size={16} className="text-white drop-shadow-md" />
                </div>
              </>
            ) : (
              <Package size={24} className="text-[#F45116]/60 m-auto" />
            )}
          </div>

          {/* Bump Content Info */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
              {title || "স্পেশাল অ্যাড-অন অফার!"}
            </h4>

            {/* Product Name Badge */}
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                <Package size={12} className="text-[#F45116]" />
                <span className="truncate max-w-[240px] sm:max-w-none">{bumpProduct.productName}</span>
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
              {subtitle || "মূল পণ্যের সাথে একই পার্সেল ডেলিভারিতে পাচ্ছেন আকর্ষণীয় অতিরিক্ত ছাড়!"}
            </p>

            {/* Price Badge & Status */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-[#F45116]">
                + ৳{Math.ceil(bumpUnitPrice).toLocaleString()}
              </span>
              {bumpProduct.price && parseFloat(bumpProduct.price) > bumpUnitPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  ৳{Math.ceil(parseFloat(bumpProduct.price)).toLocaleString()}
                </span>
              )}
              <span
                className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md transition ${
                  includeBump ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {includeBump ? "✓ যোগ করা হয়েছে" : "+ যোগ করতে ক্লিক করুন"}
              </span>
            </div>

            {/* Bump Product Variants Selection if multiple variants exist */}
            {bumpVariants.length > 0 && (
              <div
                className="mt-2.5 pt-2 border-t border-slate-200/80"
                onClick={(e) => e.stopPropagation()}
              >
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-700 block mb-1">
                  ভ্যারিয়েন্ট / সাইজ / কালার পছন্দ করুন:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {bumpVariants.map((v) => {
                    const isSelected = selectedBumpVariant?.id === v.id;
                    const label = getVariantDisplayLabel(v);
                    const colorInfo = getVariantColorInfo(v);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedBumpVariant(v);
                          if (!includeBump) setIncludeBump(true);
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer border flex items-center gap-1 ${
                          isSelected
                            ? "bg-[#F45116] text-white border-[#F45116] shadow-xs font-bold"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {v.image ? (
                          <img
                            src={v.image}
                            alt={label}
                            className="w-3.5 h-3.5 rounded object-cover"
                          />
                        ) : colorInfo.hasColor ? (
                          <span
                            className="w-3 h-3 rounded-full border border-black/20 shrink-0 inline-block"
                            style={{ backgroundColor: colorInfo.colorValue }}
                          />
                        ) : null}
                        <span>{label}</span>
                        {v.price && !hasConfiguredPrice && (
                          <span className={`text-[10px] ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                            (৳{Math.ceil(parseFloat(v.price))})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-3 right-3 p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer transition z-10"
            >
              <X size={18} />
            </button>
            <div className="w-full h-80 relative flex items-center justify-center">
              <Image
                src={lightboxImg}
                alt={bumpProduct.productName || "Preview"}
                fill
                className="object-contain"
                unoptimized={typeof lightboxImg === "string" && lightboxImg.startsWith("http")}
              />
            </div>
            <p className="mt-3 text-sm font-bold text-gray-800 text-center">
              {bumpProduct.productName}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
