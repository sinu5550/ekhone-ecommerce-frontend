"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaCheck } from "react-icons/fa6";
import { FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { ShieldCheck, Truck, RotateCcw, Heart } from "lucide-react";
import ProductImageGallery from "./ProductImageGallery";
import ProductTabs from "./ProductTabs";
import RelatedProductsSlider from "./RelatedProductsSlider";
import VariantSelector from "./VariantSelector";
import Container from "@/components/Shared/Container";
import toast from "react-hot-toast";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useContact } from "@/lib/dataFetch";
import {
  calculateVariantPrice,
  formatPrice,
  findMatchingVariant,
} from "@/lib/variantHelpers";

export default function ProductDetailsClient({
  product,
  relatedProducts = [],
}) {
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { contactData } = useContact();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  const isWishlisted = isInWishlist(product?.id);

  const getAllProductImages = () => {
    const baseImages = Array.isArray(product?.images) ? product.images : [];
    const variantImages = Array.isArray(product?.productVariants)
      ? product.productVariants.map((v) => v.image).filter(Boolean)
      : [];
    const combined = [...baseImages, ...variantImages];
    const filtered = combined.filter(
      (img) => typeof img === "string" && img.trim() !== ""
    );
    return Array.from(new Set(filtered));
  };

  const [displayImages, setDisplayImages] = useState(getAllProductImages());
  const isVariantProduct = product?.productType === "variant";

  // Check matching variant
  const getSelectedVariantStatus = () => {
    if (!isVariantProduct) return { exists: true, inStock: true };
    const matchingVariant = findMatchingVariant(product, selectedAttributes);
    return {
      exists: !!matchingVariant,
      inStock: matchingVariant ? matchingVariant.quantity > 0 : false,
      variant: matchingVariant,
    };
  };

  // Update display images when variant changes
  const updateDisplayImages = (variant) => {
    const allImages = getAllProductImages();
    if (variant?.image) {
      const filtered = allImages.filter((img) => img !== variant.image);
      setDisplayImages([variant.image, ...filtered]);
    } else {
      setDisplayImages(allImages);
    }
  };

  const handleVariantChange = (variant, attributes) => {
    setSelectedVariant(variant);
    setSelectedAttributes(attributes);
    if (variant) {
      updateDisplayImages(variant);
      setQuantity(1);
    }
  };

  // Price calculations
  let originalPrice = parseFloat(product?.price || 0);
  let discountValue = parseFloat(product?.discountValue || 0);
  if (product?.campaignInfo?.discountValue) {
    discountValue = parseFloat(product.campaignInfo.discountValue);
  }

  let baseVariantPrice = selectedVariant?.price
    ? parseFloat(selectedVariant.price)
    : originalPrice;

  let discountedPrice = baseVariantPrice;
  if (discountValue > 0) {
    if (product?.discountType === "Fixed" || product?.campaignInfo?.discountType === "Fixed") {
      discountedPrice = Math.max(0, baseVariantPrice - discountValue);
    } else {
      const discAmt = (baseVariantPrice * discountValue) / 100;
      discountedPrice = Math.max(0, baseVariantPrice - discAmt);
    }
  }

  const variantStatus = getSelectedVariantStatus();
  const availableQuantity = isVariantProduct
    ? (selectedVariant?.quantity ?? 0)
    : (product?.quantity ?? 99);

  const canAddToCart = isVariantProduct
    ? variantStatus.exists && variantStatus.inStock && product.status
    : availableQuantity > 0 && product.status;

  const currentSku = (isVariantProduct && selectedVariant?.sku) || product?.sku || "N/A";

  const validateVariantSelection = () => {
    if (!isVariantProduct) return true;
    if (!variantStatus.exists) {
      toast.error("This combination is not available. Please select another combination.");
      return false;
    }
    if (!variantStatus.inStock) {
      toast.error("This variant is out of stock. Please select another option.");
      return false;
    }
    return true;
  };

  const handleQuantityChange = (type) => {
    if (type === "increment" && quantity < availableQuantity && canAddToCart) {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrement" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // Handle Buy Now
  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateVariantSelection()) return;
    if (!canAddToCart) {
      toast.error("Product is not available for purchase");
      return;
    }

    setBuyNowLoading(true);
    try {
      const item = {
        ...product,
        price: discountedPrice,
        originalPrice: baseVariantPrice,
        discountAmount: Math.max(0, baseVariantPrice - discountedPrice),
        discountValue: discountValue,
        discountType: product.discountType || "Percentage",
        images: displayImages,
        image: displayImages[0] || product.image,
        quantity: quantity,
        sku: isVariantProduct ? selectedVariant?.sku : product.sku,
        stockQuantity: availableQuantity,
        ...(isVariantProduct && selectedVariant && {
          variantId: selectedVariant.id,
          variantAttributes: selectedAttributes,
          variantType: Object.entries(selectedAttributes || {})
            .map(([k, v]) => `${k}: ${v}`)
            .join(", "),
          productType: "variant",
        }),
      };

      setBuyNowItem(item, quantity, selectedVariant?.id || null);
      toast.success("Proceeding to checkout...");
      setTimeout(() => {
        router.push("/checkout?buyNow=true");
      }, 300);
    } catch (err) {
      toast.error("Failed to proceed with Buy Now");
    } finally {
      setBuyNowLoading(false);
    }
  };

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!validateVariantSelection()) return;
    if (!canAddToCart) {
      toast.error("Product is not available for purchase");
      return;
    }

    const item = {
      ...product,
      price: discountedPrice,
      originalPrice: baseVariantPrice,
      discountAmount: Math.max(0, baseVariantPrice - discountedPrice),
      discountValue: discountValue,
      discountType: product.discountType || "Percentage",
      images: displayImages,
      image: displayImages[0] || product.image,
      sku: isVariantProduct ? selectedVariant?.sku : product.sku,
      stockQuantity: availableQuantity,
      ...(isVariantProduct && selectedVariant && {
        variantId: selectedVariant.id,
        variantAttributes: selectedAttributes,
        variantType: Object.entries(selectedAttributes || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", "),
        productType: "variant",
      }),
    };

    addToCart(item, quantity, selectedVariant?.id || null);
    setIsInCart(true);
  };

  const supportPhone = (contactData?.phone_number || contactData?.telephone || "01909750608").replace(/\D/g, "");
  const whatsappNumber = supportPhone.startsWith("88") ? supportPhone : `88${supportPhone}`;

  return (
    <div className="bg-white py-4 md:py-8">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="text-xs md:text-sm text-gray-500 mb-5 flex items-center gap-1.5 md:gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#F45116] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/product" className="hover:text-[#F45116] transition-colors">
            Products
          </Link>
          {product.subCategory?.category?.name && (
            <>
              <span>/</span>
              <span className="text-gray-700">
                {product.subCategory.category.name}
              </span>
            </>
          )}
          <span>/</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-md">
            {product.productName}
          </span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="w-full">
            <ProductImageGallery
              images={displayImages}
              productName={product.productName}
            />
          </div>

          {/* Right Column: Product Information & Action Area */}
          <div className="space-y-4 md:space-y-5">
            {/* Category & SKU row */}
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 font-medium">
              <div>
                {[
                  product.subCategory?.category?.name,
                  product.subCategory?.name,
                ]
                  .filter(Boolean)
                  .join(" / ")}
              </div>
              {currentSku && (
                <div className="font-mono text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md text-xs">
                  SKU: <span className="font-bold text-gray-900">{currentSku}</span>
                </div>
              )}
            </div>

            {/* Product Name & Wishlist button */}
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {product.productName}
              </h1>
              <button
                type="button"
                onClick={() => {
                  if (isWishlisted) {
                    removeFromWishlist(product.id);
                  } else {
                    addToWishlist(product);
                  }
                }}
                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                className={`p-2.5 rounded-full border transition-all cursor-pointer shrink-0 ${
                  isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-500 shadow-xs"
                    : "bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50/50"
                }`}
              >
                <Heart
                  size={20}
                  className={`transition-transform duration-200 ${
                    isWishlisted ? "fill-rose-500 scale-110" : ""
                  }`}
                />
              </button>
            </div>

            {/* Price & Stock Badge Section */}
            <div className="py-3 border-y border-gray-100 flex items-center gap-3 md:gap-4 flex-wrap">
              <span className="text-2xl md:text-3xl font-black text-[#F45116]">
                ৳{formatPrice(discountedPrice)}
              </span>

              {discountValue > 0 && baseVariantPrice > discountedPrice && (
                <>
                  <span className="text-base md:text-lg text-gray-400 line-through font-medium">
                    ৳{formatPrice(baseVariantPrice)}
                  </span>
                  <span className="bg-[#E11D48] text-white text-xs font-bold px-2 py-0.5 rounded-lg shadow-xs">
                    -{Math.round(((baseVariantPrice - discountedPrice) / baseVariantPrice) * 100)}% OFF
                  </span>
                </>
              )}

              {/* In Stock status */}
              <div className="ml-auto">
                {isVariantProduct ? (
                  variantStatus.exists ? (
                    variantStatus.inStock ? (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                        In Stock ({availableQuantity})
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-semibold">
                        Out of Stock
                      </span>
                    )
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-semibold">
                      Combination Not Available
                    </span>
                  )
                ) : product.status && availableQuantity > 0 ? (
                  <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                    In Stock ({availableQuantity})
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 bg-red-100 text-red-600 rounded-full font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Variant Selector */}
            {isVariantProduct && (
              <div className="py-2 border-b border-gray-100">
                <VariantSelector
                  product={product}
                  onVariantChange={handleVariantChange}
                />
              </div>
            )}

            {/* Quantity Selector */}
            {canAddToCart && (
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs md:text-sm font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("decrement")}
                    className="px-3.5 py-2 hover:bg-gray-100 text-gray-700 transition-colors text-lg font-bold cursor-pointer"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-bold min-w-[44px] text-center text-sm">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange("increment")}
                    className="px-3.5 py-2 hover:bg-gray-100 text-gray-700 transition-colors text-lg font-bold cursor-pointer"
                    disabled={quantity >= availableQuantity}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons: 4 button layout exactly like Dazzling Diva */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={`py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs sm:text-sm border ${
                    isInCart
                      ? "bg-green-50 text-green-600 border-green-500 hover:bg-green-100"
                      : "bg-white text-[#F45116] border-[#F45116] hover:bg-[#F45116]/5"
                  } ${!canAddToCart ? "opacity-50 cursor-not-allowed" : "cursor-pointer shadow-xs active:scale-98"}`}
                >
                  {isInCart ? (
                    <>
                      <FaCheck /> Added to Cart
                    </>
                  ) : !variantStatus.exists ? (
                    "Not Available"
                  ) : !variantStatus.inStock ? (
                    "Out of Stock"
                  ) : (
                    "Add to Cart"
                  )}
                </button>

                {/* Buy Now */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!canAddToCart || buyNowLoading}
                  className={`py-3.5 px-4 rounded-xl font-bold text-white transition-all text-xs sm:text-sm flex items-center justify-center gap-2 bg-[#F45116] hover:bg-[#D9400B] shadow-md shadow-[#F45116]/20 active:scale-98 ${
                    !canAddToCart || buyNowLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  {buyNowLoading ? "Processing..." : "Buy Now"}
                </button>

                {/* Order on WhatsApp */}
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hi Ekhone! I want to order:\nProduct: ${product?.productName}\nSKU: ${currentSku}\nPrice: ৳${discountedPrice}\nQuantity: ${quantity}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#1ebd5a] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs sm:text-sm shadow-xs cursor-pointer active:scale-98"
                >
                  <FaWhatsapp size={18} />
                  <span>Order on WhatsApp</span>
                </a>

                {/* Call for Order */}
                <a
                  href={`tel:${supportPhone}`}
                  className="bg-[#102D50] hover:bg-[#0A1C33] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs sm:text-sm shadow-xs cursor-pointer active:scale-98"
                >
                  <FaPhoneAlt size={14} />
                  <span>Call to Order</span>
                </a>
              </div>
            </div>

            {/* Quick Benefits Guarantee Banner */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-center">
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <Truck className="w-4 h-4 mx-auto mb-1 text-[#F45116]" />
                <p className="text-[11px] font-bold text-gray-800">Fast Delivery</p>
                <p className="text-[10px] text-gray-500">2-4 Days All BD</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-green-600" />
                <p className="text-[11px] font-bold text-gray-800">100% Genuine</p>
                <p className="text-[10px] text-gray-500">Verified Quality</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <RotateCcw className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                <p className="text-[11px] font-bold text-gray-800">Easy Returns</p>
                <p className="text-[10px] text-gray-500">Instant on Delivery</p>
              </div>
            </div>

            {/* Short Description */}
            {product.description && (
              <div
                className="prose max-w-none text-xs sm:text-sm text-gray-600 leading-relaxed pt-2 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}
          </div>
        </div>

        {/* Product Details Tabs (Description, Specifications, Delivery) */}
        <div className="mt-12 md:mt-16">
          <ProductTabs product={product} selectedVariant={selectedVariant} />
        </div>

        {/* Related Products Slider */}
        <RelatedProductsSlider relatedProducts={relatedProducts} />
      </Container>
    </div>
  );
}
