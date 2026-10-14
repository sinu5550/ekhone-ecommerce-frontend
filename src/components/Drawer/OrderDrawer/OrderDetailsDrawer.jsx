'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  Phone,
  User,
  CreditCard,
  FileText,
  AlertCircle,
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { clientPDFGenerator, getInvoiceNumber, printPDFBlob } from '@/lib/invoicePDF';
import toast from 'react-hot-toast';

export default function OrderDetailsDrawer({ isOpen, onClose, order: initialOrder, orderId }) {
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contactData, setContactData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      apiClient("/api/contact")
        .then((res) => {
          if (res) setContactData(res?.data || res);
        })
        .catch((err) => console.warn("[OrderDrawer] Error fetching contact details:", err?.message || err));
    }
  }, [isOpen]);

  const contactPhone =
    contactData?.phone_number ||
    contactData?.telephone ||
    contactData?.phone ||
    contactData?.data?.phone_number ||
    contactData?.data?.telephone ||
    contactData?.data?.phone ||
    "+8801768179927";
  const contactTel = `tel:${contactPhone.replace(/[^\d+]/g, "")}`;

  // Sync initialOrder or fetch order if needed
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrder && (initialOrder.id === orderId || !orderId)) {
      setOrder(initialOrder);
      setError(null);
      setLoading(false);
    } else if (orderId) {
      fetchOrder(orderId);
    }
  }, [isOpen, initialOrder, orderId]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchOrder = async (id) => {
    try {
      setLoading(true);
      setError(null);

      let orderData = null;

      // 1. Try direct fetch by order ID
      try {
        const result = await apiClient(`/api/order/${id}`);
        if (result && result.success && result.data) {
          orderData = result.data;
        } else if (result && result.id) {
          orderData = result;
        }
      } catch (err) {
        console.warn("[OrderDrawer] Direct fetch failed, trying fallback:", err?.message || err);
      }

      // 2. Fallback to order list query
      if (!orderData) {
        try {
          const listResult = await apiClient(`/api/order?limit=500`);
          const ordersList = listResult?.orders || listResult?.data || (Array.isArray(listResult) ? listResult : []);
          orderData = ordersList.find(
            (o) => String(o.id) === String(id) || String(o.orderNumber) === String(id)
          );
        } catch (listErr) {
          console.warn("[OrderDrawer] Order list fallback failed:", listErr?.message || listErr);
        }
      }

      // 3. Fallback to track status endpoint
      if (!orderData) {
        try {
          const trackResult = await apiClient(`/api/order/track-status/${id}`);
          const trackOrder = trackResult?.data || trackResult;
          if (trackOrder && trackOrder.id) {
            orderData = trackOrder;
          }
        } catch (trackErr) {
          console.warn("[OrderDrawer] Track status fallback failed:", trackErr?.message || trackErr);
        }
      }

      if (!orderData) {
        throw new Error("Unable to locate order details. Please try again.");
      }

      setOrder(orderData);
    } catch (err) {
      console.error("[OrderDrawer] Error fetching order:", err);
      setError(err?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const statusConfigs = {
      Pending: {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
        badgeBg: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4 text-yellow-600" />,
        label: "Pending",
        description: "Your order is awaiting confirmation",
      },
      Confirmed: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        badgeBg: "bg-blue-100 text-blue-800",
        icon: <CheckCircle className="w-4 h-4 text-blue-600" />,
        label: "Confirmed",
        description: "Your order has been confirmed and is being prepared",
      },
      Processing: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-800",
        badgeBg: "bg-purple-100 text-purple-800",
        icon: <Package className="w-4 h-4 text-purple-600" />,
        label: "Processing",
        description: "Your order is being processed and packed",
      },
      Shipped: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-800",
        badgeBg: "bg-indigo-100 text-indigo-800",
        icon: <Truck className="w-4 h-4 text-indigo-600" />,
        label: "Shipped",
        description: "Your order is on the way",
      },
      Delivered: {
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
        badgeBg: "bg-green-100 text-green-800",
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        label: "Delivered",
        description: "Your order has been delivered",
      },
      Cancelled: {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        badgeBg: "bg-red-100 text-red-800",
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        label: "Cancelled",
        description: "This order has been cancelled",
      },
    };

    return statusConfigs[status] || statusConfigs.Pending;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getItemImage = (item) => {
    if (item.productVariant?.image) return item.productVariant.image;
    if (item.variantImage) return item.variantImage;
    if (item.image) return item.image;
    if (item.product?.images) {
      if (Array.isArray(item.product.images) && item.product.images.length > 0) {
        return item.product.images[0];
      }
      if (typeof item.product.images === "string") {
        try {
          const parsed = JSON.parse(item.product.images);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        } catch (_) {
          return item.product.images;
        }
      }
    }
    return null;
  };

  const getItemVariantLabel = (item) => {
    const v = item.productVariant || item.variant;
    if (v) {
      if (v.attributes) {
        let attrs = v.attributes;
        if (typeof attrs === "string") {
          try { attrs = JSON.parse(attrs); } catch (_) {}
        }
        if (typeof attrs === "object" && attrs !== null) {
          const vals = Object.values(attrs).filter(Boolean);
          if (vals.length > 0) return vals.join(", ");
        }
      }
      if (v.variantName) return v.variantName;
      if (v.name) return v.name;
      if (v.color || v.size) return [v.color, v.size].filter(Boolean).join(", ");
    }
    if (item.variantType) return item.variantType;
    if (item.variantTitle) return item.variantTitle;
    if (item.attributes) {
      let attrs = item.attributes;
      if (typeof attrs === "string") {
        try { attrs = JSON.parse(attrs); } catch (_) {}
      }
      if (typeof attrs === "object" && attrs !== null) {
        const vals = Object.values(attrs).filter(Boolean);
        if (vals.length > 0) return vals.join(", ");
      }
    }
    return "";
  };

  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    if (!order) return;
    setDownloadingPDF(true);
    const invNum = getInvoiceNumber(order);
    const toastId = toast.loading("Generating PDF invoice...");

    try {
      const pdfBlob = await clientPDFGenerator.generateInvoice(order);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Invoice-${invNum}.pdf downloaded!`, { id: toastId });
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error(err.message || "Failed to generate invoice PDF", { id: toastId });
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!order) return;
    const toastId = toast.loading("Preparing invoice print...");
    try {
      const pdfBlob = await clientPDFGenerator.generateInvoice(order);
      printPDFBlob(pdfBlob);
      toast.success("Print dialog opened", { id: toastId });
    } catch (err) {
      console.warn("PDF print failed, falling back to browser print:", err);
      window.print();
      toast.dismiss(toastId);
    }
  };

  const statusConfig = order ? getStatusConfig(order.status) : null;
  const totalItemCount = (order?.orderItems?.length || 0) + (order?.bundleOrderItems?.length || 0);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div key="order-drawer-container" className="fixed inset-0 z-[99999] overflow-hidden flex justify-end">
            {/* Backdrop */}
          <motion.div
            key="order-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer z-[99999] no-print"
          />

          {/* Drawer Slide-Over Panel */}
          <motion.div
            key="order-drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative w-full max-w-2xl lg:max-w-3xl bg-white h-full h-[100dvh] max-h-[100dvh] flex flex-col shadow-2xl z-[100000] overflow-hidden font-outfit order-drawer-print"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-150 bg-white flex-shrink-0 no-print">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#F45116]/10 flex items-center justify-center text-[#F45116] flex-shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {order?.orderNumber ? `Order #${order.orderNumber}` : "Order Details"}
                    </h2>
                    {statusConfig && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.badgeBg}`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {order?.orderDate ? `Placed on ${formatDate(order.orderDate)}` : "View order information and status"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {order && (
                  <>
                    <button
                      onClick={handleDownloadPDF}
                      disabled={downloadingPDF}
                      title="Download PDF Invoice"
                      className="p-2 sm:px-3 sm:py-1.5 bg-[#F45116]/10 hover:bg-[#F45116] text-[#F45116] hover:text-white rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {downloadingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {downloadingPDF ? "Downloading..." : "PDF Invoice"}
                      </span>
                    </button>

                    <button
                      onClick={handlePrint}
                      title="Print invoice"
                      className="p-2 text-gray-600 hover:text-[#F45116] hover:bg-gray-100 rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-gray-50/40">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-[12px]" />
                  <div className="h-48 bg-gray-200 rounded-[12px]" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-36 bg-gray-200 rounded-[12px]" />
                    <div className="h-36 bg-gray-200 rounded-[12px]" />
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-[12px] p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-red-900 mb-1">Failed to Load Order</h3>
                  <p className="text-xs text-red-700 mb-4">{error}</p>
                  <button
                    onClick={() => orderId && fetchOrder(orderId)}
                    className="px-4 py-2 bg-[#F45116] text-white rounded-[6px] text-xs font-semibold uppercase tracking-wider hover:bg-[#D9400B] transition-colors cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : !order ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No order details available</p>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  {statusConfig && (
                    <div className={`p-4 rounded-[12px] border ${statusConfig.bg} ${statusConfig.border} flex items-start gap-3`}>
                      <div className="mt-0.5">{statusConfig.icon}</div>
                      <div>
                        <h4 className={`text-sm font-bold ${statusConfig.text}`}>
                          {statusConfig.label}
                        </h4>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {statusConfig.description} • Last updated {formatDate(order.updatedAt || order.orderDate)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Return Notice */}
                  <div className="bg-[#F45116]/5 border border-[#F45116]/10 rounded-[12px] p-3.5 text-xs text-gray-700 flex items-start gap-2.5 no-print">
                    <AlertCircle className="w-4 h-4 text-[#F45116] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">Need to Return a Product?</p>
                      <p className="mt-0.5 text-gray-600">
                        Please contact our support hotline directly at{" "}
                        <a href={contactTel} className="font-bold underline text-[#F45116] hover:text-[#D9400B]">
                          {contactPhone}
                        </a>.
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-[12px] border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#F45116]" />
                        <h3 className="text-sm font-bold text-gray-900">
                          Ordered Items ({totalItemCount})
                        </h3>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 p-4 space-y-3">
                      {order.orderItems?.map((item, idx) => {
                        const itemImg = getItemImage(item);
                        const variantLabel = getItemVariantLabel(item);

                        return (
                          <div key={item.id ? `order-item-${item.id}` : `order-item-${idx}`} className="pt-3 first:pt-0 flex gap-3.5">
                            <div className="w-14 h-14 bg-gray-50 rounded-[8px] border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {itemImg ? (
                                <Image
                                  src={itemImg}
                                  alt={item.product?.productName || "Product"}
                                  width={56}
                                  height={56}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                {item.product?.productName || "Product"}
                                {variantLabel && (
                                  <span className="ml-1.5 text-[#F45116] font-semibold text-xs">
                                    ({variantLabel})
                                  </span>
                                )}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <p className="text-[11px] text-gray-400">
                                  SKU: {item.sku || item.productVariant?.sku || item.product?.sku || "N/A"}
                                </p>
                                {variantLabel && (
                                  <span className="inline-flex items-center text-[10px] font-medium bg-[#F45116]/10 text-[#F45116] px-1.5 py-0.2 rounded">
                                    {variantLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                  Qty: {item.quantity}
                                </span>
                                <div className="text-right">
                                  <span className="text-[11px] text-gray-400 mr-2">
                                    {formatPrice(item.unitPrice)} × {item.quantity}
                                  </span>
                                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                                    {formatPrice(item.lineTotal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Bundle Items */}
                      {order.bundleOrderItems?.map((bundleItem, bIdx) => (
                        <div key={bundleItem.id ? `bundle-item-${bundleItem.id}` : `bundle-item-${bIdx}`} className="pt-3 first:pt-0 flex gap-3.5">
                          <div className="w-14 h-14 bg-gray-50 rounded-[8px] border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                              {bundleItem.bundle?.name || "Bundle Package"}
                            </h4>
                            <p className="text-[11px] text-[#F45116] font-semibold mt-0.5">
                              Bundle Package
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                Qty: {bundleItem.quantity}
                              </span>
                              <div className="text-right">
                                <span className="text-[11px] text-gray-400 mr-2">
                                  {formatPrice(bundleItem.unitPrice)} × {bundleItem.quantity}
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-gray-900">
                                  {formatPrice(bundleItem.lineTotal)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid: Order Summary & Shipping Address */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Financial Summary */}
                    <div className="bg-white rounded-[12px] border border-gray-200 p-4 space-y-3 shadow-xs">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                        Financial Summary
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium text-gray-800">{formatPrice(order.totalAmount)}</span>
                        </div>
                        {parseFloat(order.discount) > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Discount</span>
                            <span>- {formatPrice(order.discount)}</span>
                          </div>
                        )}
                        {parseFloat(order.voucher_promo) > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Voucher Promo</span>
                            <span>- {formatPrice(order.voucher_promo)}</span>
                          </div>
                        )}
                        {parseFloat(order.tax) > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Tax</span>
                            <span className="font-medium text-gray-800">{formatPrice(order.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                          <span>Shipping</span>
                          <span className="font-medium text-gray-800">{formatPrice(order.shippingCost)}</span>
                        </div>
                        <div className="border-t border-gray-150 pt-2 flex justify-between text-sm font-bold text-gray-900">
                          <span>Grand Total</span>
                          <span className="text-[#F45116]">{formatPrice(order.grandTotal)}</span>
                        </div>
                      </div>

                      {/* Payment info */}
                      <div className="border-t border-gray-100 pt-2.5 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Payment Method</span>
                          <span className="font-bold text-gray-800">{order.paymentMethod || "COD"}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Paid Amount</span>
                          <span className="font-semibold text-gray-800">{formatPrice(order.paidAmount)}</span>
                        </div>
                        {parseFloat(order.dueAmount) > 0 && (
                          <div className="flex justify-between text-red-600 font-semibold">
                            <span>Due Amount</span>
                            <span>{formatPrice(order.dueAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="bg-white rounded-[12px] border border-gray-200 p-4 space-y-3 shadow-xs">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center justify-between">
                          <span>Delivery Details</span>
                          <span className="text-[10px] text-gray-400 font-normal uppercase">
                            {order.shippingAddress.type || "Home"}
                          </span>
                        </h4>
                        <div className="space-y-2 text-xs text-gray-700">
                          <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            {order.shippingAddress.recipientName}
                          </p>
                          <p className="flex items-start gap-1.5 text-gray-600 leading-relaxed">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>
                              {order.shippingAddress.address}, {order.shippingAddress.upazila}, {order.shippingAddress.district}, {order.shippingAddress.division} {order.shippingAddress.postalCode ? `- ${order.shippingAddress.postalCode}` : ""}
                            </span>
                          </p>
                          <p className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <a href={`tel:${order.shippingAddress.phoneNumber}`} className="hover:text-[#F45116] font-medium">
                              {order.shippingAddress.phoneNumber}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-150 bg-white flex items-center justify-between gap-3 flex-shrink-0 no-print">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[6px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
              {order && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[6px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-[6px] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {downloadingPDF ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{downloadingPDF ? "Generating PDF..." : "Download Invoice"}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Print CSS */}
    <style jsx global>{`
      @media print {
        body * {
          visibility: hidden !important;
        }
        .order-drawer-print,
        .order-drawer-print * {
          visibility: visible !important;
        }
        .order-drawer-print {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: auto !important;
          max-height: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `}</style>
  </>
  );
}
