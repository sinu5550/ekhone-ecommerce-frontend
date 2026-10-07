// components/Checkout/CheckoutClient.jsx
"use client";

import Container from "@/components/Shared/Container";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { IoIosArrowForward } from "react-icons/io";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { FaShoppingBag } from "react-icons/fa";
import { useCart } from "@/hooks/useCart";
import { useCartDrawer } from "@/context/CartDrawerContext";
import BillingDetails from "@/components/Checkout/BillingDetails";
import OrderSummary from "@/components/Checkout/OrderSummary";
import { calculateDeliveryCharges } from "@/lib/deliveryCharge";
import { getVariantDisplayLabel } from "@/lib/variantHelpers";
import { 
  trackBeginCheckout, 
  trackAddShippingInfo, 
  trackAddPaymentInfo, 
  trackPurchase 
} from "@/utils/dataLayer";

export default function CheckoutClient({ initialContact = null }) {
  const router = useRouter();
  const { openCartDrawer } = useCartDrawer();
  const {
    cart,
    loading: cartLoading,
    getBuyNowItem,
    clearBuyNowItem,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dynamic delivery charges calculated directly from checkout items
  const [deliveryCharges, setDeliveryCharges] = useState(() =>
    calculateDeliveryCharges([])
  );

  useEffect(() => {
    setDeliveryCharges(calculateDeliveryCharges(checkoutItems));
  }, [checkoutItems]);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Place Order handler ref to prevent re-render state loops
  const placeOrderRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      shipping: "dhaka-city",
      payment: "cod",
    },
  });

  // Load checkout items (Buy Now vs Regular Cart)
  useEffect(() => {
    if (cartLoading) return;

    const buyNow = getBuyNowItem();
    if (buyNow && (buyNow.productId || buyNow.id)) {
      setIsBuyNow(true);
      setCheckoutItems([buyNow]);
      trackBeginCheckout([buyNow]);
    } else {
      setIsBuyNow(false);
      setCheckoutItems(cart || []);
      if (cart && cart.length > 0) {
        trackBeginCheckout(cart);
      }
    }
    setIsLoaded(true);
  }, [cartLoading, cart, getBuyNowItem]);

  const getCheckoutTotal = useCallback(() => {
    return checkoutItems.reduce((total, item) => {
      const price = parseFloat(item.price || 0);
      const qty = item.quantity || 1;
      return total + price * qty;
    }, 0);
  }, [checkoutItems]);

  const handleCouponApplied = useCallback((coupon, discount) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(discount);
  }, []);

  const handleCouponRemoved = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }, []);

  // Handle removing item
  const handleRemoveItem = useCallback(
    (itemToRemove) => {
      if (isBuyNow) {
        clearBuyNowItem();
        setCheckoutItems([]);
        toast.success("Item removed from checkout");
        return;
      }

      const index = checkoutItems.findIndex((item) => {
        const itemRealId = item.productId || item.id;
        const targetId = itemToRemove.productId || itemToRemove.id;
        return (
          itemRealId === targetId &&
          (item.variantId || null) === (itemToRemove.variantId || null)
        );
      });

      if (index > -1) {
        removeFromCart(index);
        setCheckoutItems((prev) => prev.filter((_, idx) => idx !== index));
      }
    },
    [isBuyNow, clearBuyNowItem, checkoutItems, removeFromCart]
  );

  // Handle updating item quantity
  const handleUpdateQuantity = useCallback(
    (itemToUpdate, newQuantity) => {
      const quantity = parseInt(newQuantity);
      if (isNaN(quantity) || quantity < 1) {
        return handleRemoveItem(itemToUpdate);
      }

      // Stock Limit Check
      const rawStock = itemToUpdate.stockQuantity ?? itemToUpdate.availableQuantity;
      const stockLimit =
        rawStock != null && !isNaN(parseInt(rawStock)) && parseInt(rawStock) > 0
          ? parseInt(rawStock)
          : 999;

      if (isFinite(stockLimit) && stockLimit > 0 && quantity > stockLimit) {
        toast.error("Maximum available stock reached");
        return;
      }

      if (isBuyNow) {
        const updated = { ...itemToUpdate, quantity };
        setCheckoutItems([updated]);
        try {
          localStorage.setItem("ekhone_buy_now_item", JSON.stringify(updated));
        } catch (_) {}
        return;
      }

      const index = checkoutItems.findIndex((item) => {
        const itemRealId = item.productId || item.id;
        const targetId = itemToUpdate.productId || itemToUpdate.id;
        return (
          itemRealId === targetId &&
          (item.variantId || null) === (itemToUpdate.variantId || null)
        );
      });

      if (index > -1) {
        updateQuantity(index, quantity);
        setCheckoutItems((prev) =>
          prev.map((item, idx) => (idx === index ? { ...item, quantity } : item))
        );
      }
    },
    [isBuyNow, checkoutItems, handleRemoveItem, updateQuantity]
  );

  // Handle switching variant directly inside checkout page
  const handleSelectVariant = useCallback(
    (currentItem, newVariant) => {
      if (!newVariant) return;

      const baseVariantPrice = newVariant.price ? parseFloat(newVariant.price) : parseFloat(currentItem.originalPrice || currentItem.price || 0);
      const discountVal = parseFloat(currentItem.discountValue || 0);
      let calculatedPrice = baseVariantPrice;

      if (discountVal > 0) {
        if (currentItem.discountType === "Fixed") {
          calculatedPrice = Math.max(0, baseVariantPrice - discountVal);
        } else {
          const discAmt = (baseVariantPrice * discountVal) / 100;
          calculatedPrice = Math.max(0, baseVariantPrice - discAmt);
        }
      }

      const newDiscAmt = Math.max(0, baseVariantPrice - calculatedPrice);
      const newStock = newVariant.stockQuantity ?? newVariant.quantity ?? currentItem.stockQuantity;

      const updatedItem = {
        ...currentItem,
        variantId: newVariant.id,
        variantAttributes: newVariant.attributes || newVariant.variantAttributes || null,
        variantType: newVariant.title || newVariant.name || null,
        sku: newVariant.sku || currentItem.sku,
        price: calculatedPrice,
        originalPrice: baseVariantPrice,
        discountAmount: newDiscAmt,
        stockQuantity: newStock,
        image: newVariant.image || currentItem.image,
        images: newVariant.image ? [newVariant.image] : currentItem.images,
      };

      if (isBuyNow) {
        setCheckoutItems([updatedItem]);
        try {
          localStorage.setItem("ekhone_buy_now_item", JSON.stringify(updatedItem));
        } catch (_) {}
        return;
      }

      setCheckoutItems((prev) =>
        prev.map((item) => {
          const itemRealId = item.productId || item.id;
          const targetId = currentItem.productId || currentItem.id;
          if (itemRealId === targetId && (item.variantId || null) === (currentItem.variantId || null)) {
            return updatedItem;
          }
          return item;
        })
      );
    },
    [isBuyNow]
  );

  const onCheckoutSubmit = async (data) => {
    try {
      setLoading(true);
      const items = checkoutItems;

      if (items.length === 0) {
        toast.error("No items to checkout");
        return;
      }

      const customerId = data.customerId;
      if (!customerId) {
        toast.error("Customer information is required.");
        return;
      }

      if (!data.customerAddressId) {
        toast.error("Shipping address is required");
        return;
      }

      const shippingMethod = watch("shipping") || "dhaka-city";
      const resolvedCharges = deliveryCharges || calculateDeliveryCharges(items);
      const shippingCost =
        shippingMethod === "outside"
          ? resolvedCharges.outsideDhaka
          : resolvedCharges.insideDhaka;

      let subtotalBeforeDiscount = 0;
      let totalProductDiscount = 0;
      let totalVAT = 0;

      items.forEach((item) => {
        const quantity = parseInt(item.quantity || 1);
        const originalPrice = parseFloat(item.originalPrice || item.price || 0);
        const currentPrice = parseFloat(item.price || 0);

        subtotalBeforeDiscount += originalPrice * quantity;
        const discountPerUnit = originalPrice > currentPrice ? (originalPrice - currentPrice) : parseFloat(item.discountAmount || 0);
        totalProductDiscount += discountPerUnit * quantity;
      });

      const subtotalAfterDiscount = subtotalBeforeDiscount - totalProductDiscount;
      const couponDiscountAmount = couponDiscount || 0;

      let grandTotal =
        subtotalAfterDiscount + totalVAT + shippingCost - couponDiscountAmount;
      grandTotal = Math.max(0, grandTotal);

      const apiItems = items.map((item) => {
        const productId = parseInt(item.productId || item.id);
        const quantity = parseInt(item.quantity || 1);
        const originalPrice = parseFloat(item.originalPrice || item.price || 0);
        const unitPrice = parseFloat(item.price || 0);
        const isVariant =
          item.productType === "variant" || item.variantId || item.variantAttributes;

        const discountPerUnit = originalPrice > unitPrice ? (originalPrice - unitPrice) : parseFloat(item.discountAmount || 0);
        const totalDiscount = discountPerUnit * quantity;
        const lineTotal = unitPrice * quantity;

        const variantAttrs = item.variantAttributes || item.attributes || null;
        const variantLabel = getVariantDisplayLabel({ attributes: variantAttrs, color: item.color, size: item.size }) || null;
        let variantTypeStr =
          item.variantType || item.variantTitle || item.variantName || variantLabel || null;
        if (!variantTypeStr && variantAttrs && typeof variantAttrs === "object") {
          variantTypeStr = Object.entries(variantAttrs)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
        }

        const variantIdVal = item.variantId ? parseInt(item.variantId) : null;
        const mainProductName = item.productName || item.name || item.title || "";
        const formattedProductName = (variantIdVal || variantAttrs) && variantLabel && !mainProductName.toLowerCase().includes(variantLabel.toLowerCase())
          ? `${mainProductName} - ${variantLabel}`
          : mainProductName;

        const baseItem = {
          productId: productId,
          productName: formattedProductName,
          name: formattedProductName,
          sku: item.sku || null,
          quantity: quantity,
          unitPrice: unitPrice,
          price: unitPrice,
          discount: totalDiscount,
          discountValue: parseFloat(item.discountValue || 0),
          discountType: item.discountType || "Percentage",
          tax: 0,
          lineTotal: lineTotal,
          originalPrice: originalPrice,
          category: item.category || item.categoryName || item.subCategory?.category?.name,
          brand: item.brand || item.brandName || item.brand?.name,
          ...(variantIdVal && { variantId: variantIdVal, productVariantId: variantIdVal }),
          ...(variantAttrs && {
            variantAttributes: variantAttrs,
            attributes: variantAttrs,
            variantType: variantTypeStr || "",
          }),
        };

        if (isVariant || variantIdVal || variantAttrs) {
          if (variantIdVal) {
            baseItem.variantId = variantIdVal;
            baseItem.productVariantId = variantIdVal;
          }
          baseItem.variantAttributes = variantAttrs || {};
          baseItem.attributes = variantAttrs || {};
          baseItem.variantType = variantTypeStr || "";
          baseItem.productType = "variant";
        }

        return baseItem;
      });

      const orderPayload = {
        customerId: parseInt(customerId),
        shippingAddressId: parseInt(data.customerAddressId),
        paymentMethod:
          (watch("payment") || "cod") === "cod" ? "COD" : "OnlinePayment",
        totalAmount: Math.ceil(subtotalBeforeDiscount),
        discount: Math.ceil(totalProductDiscount),
        voucher_promo: Math.ceil(couponDiscountAmount),
        tax: Math.ceil(totalVAT),
        shippingCost: Math.ceil(shippingCost),
        grandTotal: Math.ceil(grandTotal),
        paidAmount: 0,
        dueAmount: Math.ceil(grandTotal),
        note: data.note || "",
        status: "Pending",
        items: apiItems,
        orderType: isBuyNow ? "buy_now" : "cart",
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscountAmount || 0,
        customerEmail: data.email || null,
      };

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
        /\/+$/,
        ""
      );

      const orderRes = await fetch(`${apiUrl}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const response = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(response.message || "Failed to submit order");
      }

      let orderData = null;
      let successMessage = "Order placed successfully";

      if (response && response.id && response.orderNumber) {
        orderData = response;
      } else if (response && response.success === true) {
        orderData = response.data || response;
        successMessage = response.message || successMessage;
      } else if (response && response.data && (response.data.id || response.data.orderNumber)) {
        orderData = response.data;
        successMessage = response.message || successMessage;
      } else {
        orderData = response;
      }

      if (!orderData || !orderData.id) {
        throw new Error("Order created but missing order ID");
      }

      // Track purchase event in DataLayer with real transaction/order data (deduplicated)
      trackPurchase(orderData, items);

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("last_order", JSON.stringify(orderData));
          sessionStorage.setItem("last_order", JSON.stringify(orderData));

          const existingOrders = JSON.parse(
            localStorage.getItem("guest_orders") || "[]"
          );
          existingOrders.unshift(orderData);
          localStorage.setItem("guest_orders", JSON.stringify(existingOrders));
        } catch (_) {}
      }

      if (isBuyNow) {
        clearBuyNowItem();
      } else {
        clearCart();
      }

      Swal.fire({
        icon: "success",
        title: "Order Placed Successfully!",
        html: `<p class="text-sm text-gray-600">Your Order <b>#${orderData.orderNumber || orderData.id}</b> has been received. Our team will contact you shortly.</p>`,
        confirmButtonText: "Continue Shopping",
        confirmButtonColor: "#F45116",
      }).then(() => {
        router.push("/");
      });
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="bg-[#FAF7F5] text-gray-900 min-h-screen">
        <Container className="py-10">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F45116]"></div>
          </div>
        </Container>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="bg-[#FAF7F5] text-gray-900 min-h-screen">
        <Container className="py-10">
          <div className="flex items-center gap-2 text-gray-700 mb-6 text-sm">
            <Link
              href="/"
              className="hover:underline hover:text-[#F45116] flex items-center gap-1 transition"
            >
              Home <IoIosArrowForward />
            </Link>
            <p className="font-semibold text-gray-900">Checkout</p>
          </div>

          <div className="text-center min-h-[50vh] flex flex-col items-center justify-center">
            <FaShoppingBag className="text-7xl text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No items to checkout
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to your cart before checkout.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-[#F45116] text-white rounded-xl font-bold hover:bg-[#D9400B] transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F5] text-gray-900 min-h-screen">
      <Container className="py-5 sm:py-8 md:py-10 pb-6 lg:pb-12 text-gray-900">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-700 text-xs md:text-sm mb-6">
          <Link
            href="/"
            className="hover:underline hover:text-[#F45116] flex items-center gap-1 transition"
          >
            Home <IoIosArrowForward size={12} />
          </Link>
          {!isBuyNow && (
            <button
              type="button"
              onClick={openCartDrawer}
              className="hover:underline hover:text-[#F45116] flex items-center gap-1 transition cursor-pointer text-gray-500"
            >
              Cart <IoIosArrowForward size={12} />
            </button>
          )}
          <p className="font-bold text-gray-900">Checkout</p>
        </div>

        {/* Mobile-only Products List Header (Shown at top before Shipping Address on Mobile) */}
        <div className="block lg:hidden mb-6">
          <OrderSummary
            cart={checkoutItems}
            getCartTotal={getCheckoutTotal}
            register={register}
            watch={watch}
            loading={loading}
            handleSubmit={handleSubmit}
            onCheckoutSubmit={onCheckoutSubmit}
            isBuyNow={isBuyNow}
            deliveryCharges={deliveryCharges}
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            appliedCoupon={appliedCoupon}
            couponDiscount={couponDiscount}
            placeOrderRef={placeOrderRef}
            onRemoveItem={handleRemoveItem}
            onUpdateQuantity={handleUpdateQuantity}
            onSelectVariant={handleSelectVariant}
            renderOnly="products"
          />
        </div>

        {/* Main Layout: Responsive 1-Column on Mobile, 2-Column on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Billing Details */}
          <div className="lg:col-span-7">
            <BillingDetails
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
              handleSubmit={handleSubmit}
              onCheckoutSubmit={onCheckoutSubmit}
              loading={loading}
              setLoading={setLoading}
              totalAmount={getCheckoutTotal()}
              deliveryCharges={deliveryCharges}
              placeOrderRef={placeOrderRef}
              cartItems={checkoutItems}
            />
          </div>

          {/* Right Column: Complete Order Summary (Sticky on Desktop) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
            {/* Products Section on Desktop (Hidden on Mobile) */}
            <div className="hidden lg:block">
              <OrderSummary
                cart={checkoutItems}
                getCartTotal={getCheckoutTotal}
                register={register}
                watch={watch}
                loading={loading}
                handleSubmit={handleSubmit}
                onCheckoutSubmit={onCheckoutSubmit}
                isBuyNow={isBuyNow}
                deliveryCharges={deliveryCharges}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
                appliedCoupon={appliedCoupon}
                couponDiscount={couponDiscount}
                placeOrderRef={placeOrderRef}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onSelectVariant={handleSelectVariant}
                renderOnly="products"
              />
            </div>

            {/* Order Calculations, Terms, and Place Order Button (Visible on both Mobile & Desktop) */}
            <OrderSummary
              cart={checkoutItems}
              getCartTotal={getCheckoutTotal}
              register={register}
              watch={watch}
              loading={loading}
              handleSubmit={handleSubmit}
              onCheckoutSubmit={onCheckoutSubmit}
              isBuyNow={isBuyNow}
              deliveryCharges={deliveryCharges}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              placeOrderRef={placeOrderRef}
              onRemoveItem={handleRemoveItem}
              onUpdateQuantity={handleUpdateQuantity}
              renderOnly="summary"
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
