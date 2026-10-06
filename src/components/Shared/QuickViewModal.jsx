"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import {
  extractVariantOptions,
  findMatchingVariant,
  formatPrice,
} from "@/lib/variantHelpers";

export default function QuickViewModal({ product, isOpen, onClose }) {
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();

  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");

  const isVariantProduct =
    product?.productType === "variant" &&
    Array.isArray(product?.productVariants) &&
    product.productVariants.length > 0;

  // Extract unique variant options (Size, Color, etc.)
  const variantOptions = useMemo(() => {
    if (!product || !isVariantProduct) return [];
    return extractVariantOptions(product);
  }, [product, isVariantProduct]);

  // All gallery images
  const allGalleryImages = useMemo(() => {
    if (!product) return [];
    const baseImages = Array.isArray(product.images)
      ? product.images
      : [product.images || product.image].filter(Boolean);
    const variantImages = (product.productVariants || [])
      .map((v) => v.image)
      .filter(Boolean);
    return Array.from(new Set([...baseImages, ...variantImages]));
  }, [product]);

  // Initialize when modal opens or product changes
  useEffect(() => {
    if (!product) return;
    setQuantity(1);

    const initialImg = product.images?.[0] || product.image || "";
    setActiveImage(initialImg);

    if (isVariantProduct && product.productVariants.length > 0) {
      const defaultVar =
        product.productVariants.find((v) => v.isDefault) ||
        product.productVariants[0];
      setSelectedVariant(defaultVar);
      setSelectedAttributes(defaultVar.attributes || {});
      if (defaultVar.image) {
        setActiveImage(defaultVar.image);
      }
    } else {
      setSelectedVariant(null);
      setSelectedAttributes({});
    }
  }, [product, isVariantProduct, isOpen]);

  // Handle variant matching when attributes change
  useEffect(() => {
    if (!product || !isVariantProduct) return;
    const matching = findMatchingVariant(product, selectedAttributes);
    setSelectedVariant(matching);
    if (matching?.image) {
      setActiveImage(matching.image);
    }
  }, [selectedAttributes, product, isVariantProduct]);

  if (!isOpen || !product) return null;

  // Price calculation
  const basePrice =
    isVariantProduct && selectedVariant
      ? parseFloat(selectedVariant.price) || 0
      : parseFloat(product.price) || 0;

  const discountValue =
    parseFloat(product.discountValue) ||
    parseFloat(product.campaignInfo?.discountValue) ||
    0;
  let discountedPrice = basePrice;
  if (discountValue > 0) {
    if (
      product.discountType === "Fixed" ||
      product.campaignInfo?.discountType === "Fixed"
    ) {
      discountedPrice = Math.max(0, basePrice - discountValue);
    } else {
      const discountAmt = (basePrice * discountValue) / 100;
      discountedPrice = Math.max(0, basePrice - discountAmt);
    }
  }

  const availableQuantity = isVariantProduct
    ? (selectedVariant?.quantity ?? 0)
    : product.quantity || 0;

  const isAvailable = availableQuantity > 0 && product.status !== false;

  // Attribute selection handler
  const handleAttributeSelect = (attributeName, value) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!isAvailable) return;
    const item = {
      id: product.id,
      slug: product.slug,
      productName: product.productName,
      price: discountedPrice,
      originalPrice: basePrice,
      discountAmount: Math.max(0, basePrice - discountedPrice),
      discountValue: discountValue,
      discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
      campaignName: product.campaignInfo?.campaignName || null,
      campaignId: product.campaignInfo?.id || product.campaignId || null,
      images: [activeImage || product.images?.[0]].filter(Boolean),
      quantity,
      sku: selectedVariant ? selectedVariant.sku : product.sku,
      stockQuantity: availableQuantity || 999,
      insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ?? null,
      outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ?? null,
      ...(selectedVariant && {
        variantId: selectedVariant.id,
        variantAttributes: selectedVariant.attributes,
        variantType: Object.entries(selectedVariant.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", "),
      }),
    };
    addToCart(item, quantity, selectedVariant?.id);
    onClose();
  };

  // Buy Now -> Redirect to Checkout
  const handleProceedCheckout = () => {
    if (!isAvailable) return;
    const item = {
      id: product.id,
      slug: product.slug,
      productName: product.productName,
      price: discountedPrice,
      originalPrice: basePrice,
      discountAmount: Math.max(0, basePrice - discountedPrice),
      discountValue: discountValue,
      discountType: product.discountType || product.campaignInfo?.discountType || "Percentage",
      campaignName: product.campaignInfo?.campaignName || null,
      campaignId: product.campaignInfo?.id || product.campaignId || null,
      images: [activeImage || product.images?.[0]].filter(Boolean),
      quantity,
      sku: selectedVariant ? selectedVariant.sku : product.sku,
      stockQuantity: availableQuantity || 999,
      insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ?? null,
      outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ?? null,
      ...(selectedVariant && {
        variantId: selectedVariant.id,
        variantAttributes: selectedVariant.attributes,
        variantType: Object.entries(selectedVariant.attributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", "),
      }),
    };
    setBuyNowItem(item, quantity, selectedVariant?.id);
    toast.success("Proceeding to checkout...");
    onClose();
    router.push("/checkout");
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-100 z-10 flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer z-20"
        >
          <X size={17} />
        </button>

        <div className="overflow-y-auto p-5 sm:p-7 flex flex-col sm:flex-row gap-5 sm:gap-7">
          {/* Left: Image & Thumbnails */}
          <div className="sm:w-1/2 flex flex-col">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#F8F9FA] border border-slate-100 flex items-center justify-center">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.productName}
                  fill
                  priority
                  className="object-contain p-3"
                />
              ) : (
                <span className="text-xs text-slate-400">No Image</span>
              )}
            </div>

            {allGalleryImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {allGalleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border transition cursor-pointer shrink-0 ${activeImage === img ? "border-primary ring-2 ring-primary/20" : "border-slate-200 opacity-70 hover:opacity-100"}`}
                  >
                    <Image
                      src={img}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details, Variant Selector, Quantity, Actions */}
          <div className="sm:w-1/2 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {product.productName}
              </h2>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">
                  <span className="font-black">৳</span>
                  {discountedPrice.toLocaleString()}
                </span>
                {discountValue > 0 && basePrice > discountedPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ৳{basePrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isAvailable ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
                >
                  {isAvailable
                    ? `In Stock (${availableQuantity})`
                    : "Out of Stock"}
                </span>
              </div>

              {/* Variant Attributes (Size, Color, Model, etc.) */}
              {isVariantProduct &&
                variantOptions.map((opt) => {
                  return (
                    <div key={opt.attributeName} className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">
                          Select {opt.attributeName}:
                        </span>
                        {selectedAttributes[opt.attributeName] && (
                          <span className="text-xs font-bold text-primary">
                            {selectedAttributes[opt.attributeName]}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map((val) => {
                          const isSelected =
                            selectedAttributes[opt.attributeName] === val;
                          const isHexColor =
                            typeof val === "string" &&
                            /^#([0-9A-F]{3}){1,2}$/i.test(val.trim());

                          if (isHexColor) {
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  handleAttributeSelect(opt.attributeName, val)
                                }
                                className={`w-7 h-7 rounded-full border transition cursor-pointer ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : "border-slate-300"}`}
                                style={{ backgroundColor: val }}
                                title={val}
                              />
                            );
                          }

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() =>
                                handleAttributeSelect(opt.attributeName, val)
                              }
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                                isSelected
                                  ? "bg-primary text-white border-primary shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

              {/* Quantity Selector */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-700">
                  Quantity:
                </span>
                <div className="flex items-center border border-slate-200 w-fit rounded-lg bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="w-9 text-center text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(availableQuantity, q + 1))
                    }
                    disabled={quantity >= availableQuantity}
                    className="p-2 hover:bg-slate-50 text-slate-600 transition cursor-pointer disabled:opacity-30"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              {/* <button
                                onClick={handleAddToCart}
                                disabled={!isAvailable}
                                className="flex-1 py-2.5 px-3 rounded-xl border border-primary text-primary hover:bg-primary/5 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                            >
                                <ShoppingCart size={15} />
                                <span>Add to Cart</span>
                            </button> */}
              <button
                onClick={handleProceedCheckout}
                disabled={!isAvailable}
                className="flex-1 py-2.5 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 group "
              >
                <span>Proceed to Checkout</span>
                <ArrowRight
                  size={12}
                  className="group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
