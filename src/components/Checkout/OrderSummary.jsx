// components/Checkout/OrderSummary.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { FaBox, FaMinus, FaPlus } from "react-icons/fa";
import { FiCheck } from "react-icons/fi";
import { Trash2, ShoppingBag, Receipt, Truck, Tag, Percent, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { calculateDeliveryCharges } from "@/lib/deliveryCharge";
import { isHexColor, getColorName, getVariantColorInfo, getVariantDisplayLabel } from "@/lib/variantHelpers";

const getItemImage = (item) => {
  if (!item) return null;

  const rawImg =
    (Array.isArray(item.images) && item.images.length > 0)
      ? item.images[0]
      : item.image ||
        item.variantImage ||
        item.variant?.image ||
        item.product?.image ||
        (Array.isArray(item.product?.images) && item.product.images.length > 0
          ? item.product.images[0]
          : null) ||
        item.thumbnail ||
        item.photo;

  if (!rawImg) return null;

  if (typeof rawImg === "string") {
    return rawImg.trim() !== "" ? rawImg : null;
  }

  if (typeof rawImg === "object") {
    return rawImg.url || rawImg.image || rawImg.src || null;
  }

  return null;
};

const OrderSummary = ({
  cart = [],
  getCartTotal,
  register,
  watch,
  loading = false,
  handleSubmit,
  onCheckoutSubmit,
  cartType = "regular",
  isBuyNow = false,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon: externalAppliedCoupon = null,
  couponDiscount: externalCouponDiscount = 0,
  placeOrderRef,
  onRemoveItem,
  onUpdateQuantity,
  onSelectVariant,
  deliveryCharges: externalDeliveryCharges = null,
  renderOnly = null, // 'products' | 'summary' | null
}) => {
  const regularItems = cart.filter((item) => !item.isBundle);
  const bundleItems = cart.filter((item) => item.isBundle);

  // Terms & Conditions state (Checked by default)
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(externalAppliedCoupon);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // IntersectionObserver for Place Order button docking on mobile
  const mainButtonRef = React.useRef(null);
  const [isMainButtonInView, setIsMainButtonInView] = useState(true);

  useEffect(() => {
    const target = mainButtonRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainButtonInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setAppliedCoupon(externalAppliedCoupon);
  }, [externalAppliedCoupon]);

  // Format price helper with proper font-black Taka symbol
  const renderPrice = (price) => {
    if (price === null || price === undefined) return <span><span className="font-black">৳</span>0</span>;
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) return <span><span className="font-black">৳</span>0</span>;
    const ceilPrice = Math.ceil(priceNumber);
    return (
      <span>
        <span className="font-black">৳</span>
        {ceilPrice.toLocaleString("en-BD", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </span>
    );
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "৳0";
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) return "৳0";
    return `৳${Math.ceil(priceNumber).toLocaleString("en-BD")}`;
  };

  // Calculate totals
  const calculateTotals = useCallback(() => {
    let subtotalBeforeDiscount = 0;
    let totalProductDiscount = 0;
    let totalVAT = 0;

    cart.forEach((item) => {
      const quantity = parseInt(item.quantity || 1);
      const originalPrice = parseFloat(item.originalPrice || item.price || 0);
      const currentPrice = parseFloat(item.price || 0);

      subtotalBeforeDiscount += originalPrice * quantity;
      const discountPerUnit = originalPrice > currentPrice ? (originalPrice - currentPrice) : parseFloat(item.discountAmount || 0);
      totalProductDiscount += discountPerUnit * quantity;
    });

    const subtotalAfterDiscount = subtotalBeforeDiscount - totalProductDiscount;
    const shippingMethod = watch ? (watch("shipping") || "dhaka-city") : "dhaka-city";
    const currentCharges =
      externalDeliveryCharges || calculateDeliveryCharges(cart);
    const shippingCost =
      shippingMethod === "outside"
        ? currentCharges.outsideDhaka
        : currentCharges.insideDhaka;

    const calculateCouponDiscount = () => {
      if (!appliedCoupon) return 0;
      let discount = 0;
      const discountValue = parseFloat(appliedCoupon.discountValue || 0);

      if (appliedCoupon.discountType === "Fixed") {
        discount = discountValue;
      } else if (appliedCoupon.discountType === "Percentage") {
        discount = (subtotalAfterDiscount * discountValue) / 100;
        if (appliedCoupon.maxDiscountAmount) {
          const maxDiscount = parseFloat(appliedCoupon.maxDiscountAmount);
          if (discount > maxDiscount) discount = maxDiscount;
        }
      }
      return Math.min(discount, subtotalAfterDiscount);
    };

    const couponDiscount = externalCouponDiscount || calculateCouponDiscount();

    const finalTotal = Math.max(
      0,
      subtotalAfterDiscount +
        totalVAT +
        shippingCost -
        couponDiscount
    );

    return {
      subtotalBeforeDiscount,
      totalProductDiscount,
      totalVAT,
      subtotalAfterDiscount,
      shippingCost,
      couponDiscount,
      finalTotal,
    };
  }, [
    cart,
    watch,
    appliedCoupon,
    externalCouponDiscount,
    externalDeliveryCharges,
  ]);

  const totals = calculateTotals();

  // Render variant attributes & selector
  const renderVariantSection = (item) => {
    const availableVariants = Array.isArray(item.productVariants) && item.productVariants.length > 0
      ? item.productVariants
      : (Array.isArray(item.product?.productVariants) ? item.product.productVariants : []);

    const hasMultipleVariants = availableVariants.length > 1;

    return (
      <div className="mt-1.5 space-y-1.5">
        {/* If multiple variants exist, show clickable swatch/pill selector */}
        {hasMultipleVariants && onSelectVariant ? (
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-slate-700 block mb-1">
              Select Variant (ভ্যারিয়েন্ট পরিবর্তন করুন):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableVariants.map((v) => {
                const isSelected = (item.variantId || null) === v.id;
                const vColorInfo = getVariantColorInfo(v);
                const vDisplayLabel = getVariantDisplayLabel(v);
                const vRawPrice = parseFloat(v.price || item.originalPrice || item.price || 0);
                
                // Calculate discounted price for this variant
                const discountVal = parseFloat(item.discountValue || 0);
                let vEffectivePrice = vRawPrice;
                if (discountVal > 0) {
                  if (item.discountType === "Fixed") {
                    vEffectivePrice = Math.max(0, vRawPrice - discountVal);
                  } else {
                    const discAmt = (vRawPrice * discountVal) / 100;
                    vEffectivePrice = Math.max(0, vRawPrice - discAmt);
                  }
                }
                const hasVariantDiscount = vRawPrice > vEffectivePrice;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVariant(item, v)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#F45116] text-white border-[#F45116] shadow-xs font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {v.image ? (
                      <img
                        src={v.image}
                        alt={vDisplayLabel}
                        className="w-3.5 h-3.5 rounded object-cover"
                      />
                    ) : vColorInfo.hasColor ? (
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shadow-xs shrink-0 inline-block"
                        style={{ backgroundColor: vColorInfo.colorValue }}
                      />
                    ) : null}
                    <span>{vDisplayLabel}</span>
                    {vEffectivePrice > 0 && (
                      <span className={`text-[10px] font-medium ${isSelected ? "text-white/95" : "text-slate-600"}`}>
                        ৳{vEffectivePrice.toLocaleString()}
                        {hasVariantDiscount && (
                          <span className={`line-through ml-1 ${isSelected ? "text-white/60" : "text-slate-400"}`}>
                            ৳{vRawPrice.toLocaleString()}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Single variant or current active variant badge */
          item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(item.variantAttributes).map(([key, value]) => {
                const isHex = isHexColor(value);
                const friendlyValue = isHex ? getColorName(value) : value;

                return (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 text-[11px] bg-orange-50 text-[#F45116] border border-orange-200/60 px-2 py-0.5 rounded font-medium"
                  >
                    {isHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 inline-block"
                        style={{ backgroundColor: value }}
                      />
                    )}
                    <span>
                      {key}: {friendlyValue}
                    </span>
                  </span>
                );
              })}
            </div>
          )
        )}
      </div>
    );
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    // Coupon validation logic can be plugged here
    toast.error("Invalid coupon code");
  };

  if (cart.length === 0) {
    return (
      <div className="sticky top-6">
        <h2 className="text-lg md:text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-[#F45116]" size={22} />
          <span>Your Order</span>
        </h2>
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-xs">
          <div className="text-center py-8">
            <ShoppingBag className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Your cart is empty</p>
          </div>
        </div>
      </div>
    );
  }

  const renderProductsSection = () => (
    <div className="order-1">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 flex items-center gap-2">
        <ShoppingBag className="text-[#F45116]" size={22} />
        <span>Your Order</span>
      </h2>
      <div className="border border-gray-200 rounded-2xl p-4 sm:p-6 bg-white shadow-xs mb-6">
        {/* Products List - Flat list with subtle separation */}
        <div className="divide-y divide-gray-100">
          {regularItems.map((item, index) => {
            const quantity = parseInt(item.quantity || 1);
            const originalPrice = parseFloat(
              item.originalPrice || item.price || 0
            );
            const currentPrice = parseFloat(item.price || 0);
            const productDiscount = originalPrice - currentPrice;
            const campaignDiscount = parseFloat(item.discountAmount || 0);

            // In-stock limit
            const rawStock = item.stockQuantity ?? item.availableQuantity;
            const stockLimit =
              rawStock != null && !isNaN(parseInt(rawStock)) && parseInt(rawStock) > 0
                ? parseInt(rawStock)
                : 999;
            const isAtStockLimit = quantity >= stockLimit;

            return (
              <div
                key={`regular-${item.productId || item.id}-${item.variantId || index}`}
                className="bg-white py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex gap-3.5">
                  {/* Product Image */}
                  <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {getItemImage(item) ? (
                      <Image
                        src={getItemImage(item)}
                        alt={item.productName || item.name || "Product"}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <FaBox className="text-gray-300 text-xl" />
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                          {item.productName || item.name}
                        </h4>
                        {onRemoveItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer flex-shrink-0"
                            title="Remove item from checkout"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      {renderVariantSection(item)}
                      {item.campaignName && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <span className="inline-block text-[10px] bg-orange-100 text-[#F45116] px-2 py-0.5 rounded-md font-medium">
                            {item.campaignName}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 text-xs">
                      {/* Quantity Controls */}
                      {onUpdateQuantity ? (
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item, quantity - 1)}
                            disabled={quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <FaMinus size={8} />
                          </button>
                          <span className="px-2 font-bold text-gray-900 text-xs min-w-[20px] text-center select-none">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAtStockLimit) {
                                toast.error("Maximum available stock reached");
                                return;
                              }
                              onUpdateQuantity(item, quantity + 1);
                            }}
                            disabled={isAtStockLimit}
                            className={`w-6 h-6 flex items-center justify-center transition-colors ${
                              isAtStockLimit
                                ? "text-gray-300 cursor-not-allowed bg-gray-100"
                                : "text-gray-600 hover:text-black hover:bg-gray-200 cursor-pointer"
                            }`}
                            aria-label="Increase quantity"
                          >
                            <FaPlus size={8} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 font-medium">
                          Qty: <span className="text-gray-900 font-bold">{quantity}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="font-bold text-[#F45116] text-xs sm:text-sm">
                          {renderPrice(currentPrice * quantity)}
                        </span>
                        {originalPrice > currentPrice && (
                          <span className="text-[11px] text-gray-400 line-through">
                            {renderPrice(originalPrice * quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCalculationSection = () => (
    <div className="order-3">
      {/* Summary Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl space-y-3 border border-gray-200 shadow-xs">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-900">
          <Receipt className="text-[#F45116]" size={20} />
          <span>Order Summary</span>
        </h3>

        <div className="flex justify-between items-center text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <ShoppingBag size={15} className="text-gray-400" />
            Sub Total
          </span>
          <span className="font-semibold text-gray-900">
            {renderPrice(totals.subtotalBeforeDiscount)}
          </span>
        </div>

        {totals.totalProductDiscount > 0 && (
          <div className="flex justify-between items-center text-sm text-red-600">
            <span className="flex items-center gap-2">
              <Tag size={15} className="text-red-500" />
              Total Discount
            </span>
            <span className="font-semibold">
              -{renderPrice(totals.totalProductDiscount)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-gray-700">
          <span className="flex items-center gap-2">
            <Truck size={15} className="text-gray-400" />
            Shipping Charge
          </span>
          <span className="font-semibold text-gray-900">
            {totals.shippingCost === 0 ? "Free" : renderPrice(totals.shippingCost)}
          </span>
        </div>

        {totals.couponDiscount > 0 && (
          <div className="flex justify-between items-center text-sm text-green-600">
            <span className="flex items-center gap-2">
              <Percent size={15} className="text-green-600" />
              Coupon Discount
            </span>
            <span className="font-semibold">
              -{renderPrice(totals.couponDiscount)}
            </span>
          </div>
        )}

        <div className="border-t-2 border-gray-100 pt-3 mt-3 flex justify-between items-center text-lg font-bold">
          <span className="flex items-center gap-2 text-gray-900">
            <CreditCard size={18} className="text-[#F45116]" />
            Grand Total
          </span>
          <span className="text-[#F45116] text-xl font-extrabold">
            {renderPrice(totals.finalTotal)}
          </span>
        </div>
      </div>

      {/* Terms & Conditions Agreement Checkbox */}
      <div className="mt-4 mb-8 lg:mb-0 flex items-start gap-2.5 px-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs sm:text-sm text-gray-700 leading-snug">
          <div
            onClick={() => setTermsAgreed(!termsAgreed)}
            className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
              termsAgreed
                ? "bg-[#F45116] border border-[#F45116]"
                : "bg-white border border-gray-300 hover:border-[#F45116]"
            }`}
          >
            {termsAgreed && <FiCheck className="text-white text-[12px] stroke-[3]" />}
          </div>
          <span className="text-[13px]">
            I have read and agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              className="text-[#F45116] hover:underline font-medium"
            >
              Terms and Conditions
            </Link>
            ,{" "}
            <Link
              href="/privacy-policy"
              target="_blank"
              className="text-[#F45116] hover:underline font-medium"
            >
              Privacy Policy
            </Link>{" "}
            &amp;{" "}
            <Link
              href="/return-policy"
              target="_blank"
              className="text-[#F45116] hover:underline font-medium"
            >
              Refund Policy
            </Link>
            .
          </span>
        </label>
      </div>

      {/* Place Order Button - Desktop & Default */}
      <button
        ref={mainButtonRef}
        type="button"
        onClick={() => placeOrderRef?.current && placeOrderRef.current()}
        disabled={loading || !termsAgreed}
        className="w-full mt-6 py-3.5 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-xl font-bold text-base md:text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing...</span>
          </>
        ) : (
          "Place Order"
        )}
      </button>

      {/* Floating Place Order Action Button for Mobile - Visible ONLY when original button is NOT in view */}
      {!isMainButtonInView && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-[9999] lg:hidden">
          <button
            type="button"
            onClick={() => placeOrderRef?.current && placeOrderRef.current()}
            disabled={loading || !termsAgreed}
            className="w-full py-3.5 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-xl font-bold text-base transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wide flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span className="flex items-center gap-1">
                <span>Place Order •</span>
                <span className="font-black">৳</span>
                <span>{Math.ceil(totals.finalTotal).toLocaleString("en-BD")}</span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );

  if (renderOnly === "products") {
    return renderProductsSection();
  }

  if (renderOnly === "summary") {
    return renderCalculationSection();
  }

  return (
    <div className="sticky top-6 flex flex-col">
      {renderProductsSection()}
      {renderCalculationSection()}
    </div>
  );
};

export default OrderSummary;
