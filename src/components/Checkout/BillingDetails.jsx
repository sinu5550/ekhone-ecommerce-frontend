// components/Checkout/BillingDetails.jsx
"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/apiClient";
import { divisions, districts, upazilas } from "@/lib/data";
import Link from "next/link";
import { Home, Briefcase, MapPin, Plus, Star, X, Truck, CreditCard, FileText, User, Phone, Mail } from "lucide-react";
import Swal from "sweetalert2";
import Image from "next/image";
import { FaLongArrowAltRight } from "react-icons/fa";
import { calculateDeliveryCharges } from "@/lib/deliveryCharge";

const BillingDetails = ({
  user = null,
  register,
  errors = {},
  watch,
  setValue,
  handleSubmit,
  onCheckoutSubmit,
  loading = false,
  setLoading,
  totalAmount = 0,
  placeOrderRef,
  cartItems = [],
  deliveryCharges: externalDeliveryCharges = null,
}) => {
  const [customerId, setCustomerId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredUpazilas, setFilteredUpazilas] = useState([]);

  const watchRecipientName = watch("recipientName");
  const watchPhoneNumber = watch("phoneNumber");
  const watchEmail = watch("email");
  const watchAddress = watch("address");
  const watchType = watch("type");
  const watchDivision = watch("division");
  const watchDistrict = watch("district");
  const watchUpazila = watch("upazila");
  const watchPayment = watch("payment");
  const watchShipping = watch("shipping");
  const watchNote = watch("note");

  // Restore cached guest shipping details on initial mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedDetails = localStorage.getItem("ekhone_checkout_shipping_details");
      if (savedDetails) {
        const parsed = JSON.parse(savedDetails);
        if (parsed && typeof parsed === "object") {
          if (!user?.fullName && parsed.recipientName) {
            setValue("recipientName", parsed.recipientName, { shouldDirty: true });
          }
          if (!user?.phone && parsed.phoneNumber) {
            setValue("phoneNumber", parsed.phoneNumber, { shouldDirty: true });
          }
          if (parsed.email) {
            setValue("email", parsed.email, { shouldDirty: true });
          }
          if (parsed.division) {
            setValue("division", parsed.division, { shouldDirty: true });
          }
          if (parsed.district) {
            setValue("district", parsed.district, { shouldDirty: true });
          }
          if (parsed.upazila) {
            setValue("upazila", parsed.upazila, { shouldDirty: true });
          }
          if (parsed.address) {
            setValue("address", parsed.address, { shouldDirty: true });
          }
          if (parsed.type) {
            setValue("type", parsed.type, { shouldDirty: true });
          }
        }
      }
    } catch (e) {
      console.error("Error restoring cached shipping details:", e);
    }

    if (user) {
      if (user.fullName) setValue("recipientName", user.fullName);
      if (user.phone) setValue("phoneNumber", user.phone);
      if (user.email) setValue("email", user.email);
    }
  }, [user, setValue]);

  // Debounced auto-save of entered shipping details to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      if (
        watchRecipientName ||
        watchPhoneNumber ||
        watchEmail ||
        watchAddress ||
        watchDivision ||
        watchDistrict ||
        watchUpazila
      ) {
        try {
          const toSave = {
            recipientName: watchRecipientName || "",
            phoneNumber: watchPhoneNumber || "",
            email: watchEmail || "",
            division: watchDivision || "",
            district: watchDistrict || "",
            upazila: watchUpazila || "",
            address: watchAddress || "",
            type: watchType || "Home",
          };
          localStorage.setItem("ekhone_checkout_shipping_details", JSON.stringify(toSave));
        } catch (e) {}
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    watchRecipientName,
    watchPhoneNumber,
    watchEmail,
    watchAddress,
    watchDivision,
    watchDistrict,
    watchUpazila,
    watchType,
  ]);

  // Fetch customer data and addresses if user is logged in
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!user?.email) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const result = await apiClient(
          `/api/customer/email/${encodeURIComponent(user.email)}`
        );
        let customerData = null;
        if (result && result.success !== undefined) {
          customerData = result.data;
        } else if (result && result.id) {
          customerData = result;
        } else if (result && result.customer) {
          customerData = result.customer;
        }

        if (customerData && customerData.id) {
          setCustomerId(customerData.id);
          setAddresses(customerData.customerAddresses || []);
          const defaultAddr = customerData.customerAddresses?.find(
            (addr) => addr.isDefault
          );
          if (defaultAddr) {
            setSelectedAddress(defaultAddr.id);
            prefillForm(defaultAddr);
          }
        } else {
          setCustomerId(null);
          setAddresses([]);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomerId(null);
        setAddresses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [user?.email]);

  // Filter districts based on division
  useEffect(() => {
    if (watchDivision) {
      const divisionData = divisions.find((div) => div.name === watchDivision);
      if (divisionData) {
        const districtList = districts.filter(
          (dist) => dist.division_id === divisionData.id
        );
        setFilteredDistricts(districtList);
        setValue("city", watchDivision);
      }
    } else {
      setFilteredDistricts([]);
      setValue("district", "");
      setValue("upazila", "");
      setFilteredUpazilas([]);
    }
  }, [watchDivision, setValue]);

  // Filter upazilas based on district and update inside/outside dhaka
  useEffect(() => {
    if (watchDistrict) {
      const districtData = districts.find(
        (dist) => dist.name === watchDistrict
      );
      if (districtData) {
        const upazilaList = upazilas
          .filter((upazila) => upazila.district_id === districtData.id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setFilteredUpazilas(upazilaList);
      }
      const isDhaka =
        watchDistrict.trim().toLowerCase() === "dhaka" ||
        watchDistrict.trim().toLowerCase() === "dhaka district";
      setValue("shipping", isDhaka ? "dhaka-city" : "outside", {
        shouldDirty: true,
      });
    } else {
      setFilteredUpazilas([]);
      setValue("upazila", "");
    }
  }, [watchDistrict, setValue]);

  const getIcon = (type) => {
    switch (type) {
      case "Home":
        return <Home className="w-3 h-3 text-[#102D50]" />;
      case "Office":
        return <Briefcase className="w-3 h-3 text-[#102D50]" />;
      default:
        return <MapPin className="w-3 h-3 text-[#102D50]" />;
    }
  };

  const prefillForm = (address) => {
    setValue("recipientName", address.recipientName || user?.fullName || "");
    setValue("phoneNumber", address.phoneNumber || user?.phone || "");
    setValue("address", address.address);
    setValue("upazila", address.upazila);
    setValue("postalCode", address.postalCode);
    setValue("district", address.district);
    setValue("division", address.division);
    setValue("city", address.city);
    setValue("country", address.country || "Bangladesh");
    setValue("type", address.type || "Home");
    if (address.district) {
      const isDhaka =
        address.district.trim().toLowerCase() === "dhaka" ||
        address.district.trim().toLowerCase() === "dhaka district";
      setValue("shipping", isDhaka ? "dhaka-city" : "outside", {
        shouldDirty: true,
      });
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address.id);
    prefillForm(address);
    setShowAllAddresses(false);
  };

  // Handle place order when saved address is selected
  const handlePlaceOrder = async () => {
    if (!customerId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Customer information is missing.",
        confirmButtonColor: "#F45116",
      });
      return;
    }
    if (!selectedAddress) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a shipping address",
        confirmButtonColor: "#F45116",
      });
      return;
    }

    const paymentMethod = watchPayment || "cod";
    const checkoutData = {
      customerId: customerId,
      customerAddressId: selectedAddress,
      note: watchNote || "",
      shippingMethod: watchShipping || "dhaka-city",
      paymentMethod: paymentMethod,
    };

    await onCheckoutSubmit(checkoutData);
  };

  // Handle save new address and checkout (Guest or New Address flow)
  const handleSaveAndCheckout = async (formData) => {
    try {
      const phoneNumber = (formData.phoneNumber || user?.phone || "").trim();
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const emailToUse = (
        user?.email ||
        formData.email ||
        (cleanPhone ? `guest_${cleanPhone}@ekhone.com` : "")
      ).trim();
      const recipientName = (
        formData.recipientName ||
        user?.fullName ||
        ""
      ).trim();

      if (!phoneNumber) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Please enter your phone number",
          confirmButtonColor: "#F45116",
        });
        return;
      }

      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
        /\/+$/,
        ""
      );

      // Step 1: Check if Customer already exists by email
      let targetCustomerId = customerId;

      if (!targetCustomerId && emailToUse) {
        try {
          const customerRes = await fetch(
            `${apiUrl}/api/customer/email/${encodeURIComponent(emailToUse)}`
          );
          const customerData = await customerRes.json();

          if (
            customerRes.ok &&
            customerData &&
            customerData.success &&
            customerData.data
          ) {
            targetCustomerId = customerData.data.id;
          } else if (customerRes.ok && customerData && customerData.id) {
            targetCustomerId = customerData.id;
          }
        } catch (e) {
          console.log("Customer lookup failed, creating new record");
        }
      }

      // Step 2: Create a new Customer record if not found
      if (!targetCustomerId) {
        const createCustomerRes = await fetch(`${apiUrl}/api/customer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: recipientName || "Guest Customer",
            email:
              emailToUse ||
              `guest_${cleanPhone || Date.now()}@ekhone.com`,
            phone: cleanPhone,
            status: true,
          }),
        });

        const createCustomerData = await createCustomerRes.json();

        if (
          createCustomerRes.ok &&
          (createCustomerData.data?.id || createCustomerData.id)
        ) {
          targetCustomerId =
            createCustomerData.data?.id || createCustomerData.id;
        } else if (
          createCustomerData.message?.includes("already exists") ||
          createCustomerRes.status === 409
        ) {
          targetCustomerId =
            createCustomerData.data?.id ||
            createCustomerData.id ||
            createCustomerData.customer?.id;
        }

        if (!targetCustomerId) {
          throw new Error(
            createCustomerData.message || "Failed to create customer record"
          );
        }
      }

      // Step 3: Add customer shipping address
      const addressPayload = {
        recipientName: recipientName,
        phoneNumber: phoneNumber,
        address: formData.address.trim(),
        upazila: formData.upazila,
        district: formData.district,
        division: formData.division,
        city: formData.city?.trim() || formData.division,
        postalCode: formData.postalCode?.trim() || "1200",
        country: "Bangladesh",
        isDefault: formData.isDefault !== undefined ? formData.isDefault : true,
        type: formData.type || "Home",
      };

      const createAddressRes = await fetch(
        `${apiUrl}/api/customer/${targetCustomerId}/addresses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressPayload),
        }
      );

      const createAddressData = await createAddressRes.json();
      if (
        !createAddressRes.ok &&
        !createAddressData.data &&
        !createAddressData.id
      ) {
        throw new Error(
          createAddressData.message || "Failed to create shipping address"
        );
      }

      const newAddressId =
        createAddressData.data?.id ||
        createAddressData.id ||
        createAddressData.addressId;

      const checkoutData = {
        customerId: targetCustomerId,
        customerAddressId: newAddressId,
        email: emailToUse,
        note: formData.note || "",
        shippingMethod: formData.shipping || "dhaka-city",
        paymentMethod: formData.payment || "cod",
      };

      await onCheckoutSubmit(checkoutData);
    } catch (error) {
      console.error("Checkout error:", error);
      if (setLoading) setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to process checkout",
        confirmButtonColor: "#F45116",
      });
    }
  };

  const scrollToFirstError = (formErrors) => {
    if (!formErrors) return;
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const errorElement = document.querySelector(
        `[name="${firstKey}"], #${firstKey}`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          try {
            errorElement.focus();
          } catch (e) {}
        }, 300);
      }
    }
  };

  // Assign placeOrderRef handler for OrderSummary's Place Order button
  if (placeOrderRef) {
    placeOrderRef.current = () => {
      if (setLoading) setLoading(true);
      if (
        user &&
        customerId &&
        addresses.length > 0 &&
        selectedAddress &&
        !isAddingNewAddress
      ) {
        handlePlaceOrder();
      } else {
        handleSubmit(handleSaveAndCheckout, (formErrors) => {
          if (setLoading) setLoading(false);
          scrollToFirstError(formErrors);
        })();
      }
    };
  }

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

  // Calculate dynamic delivery charges
  const deliveryCharges =
    externalDeliveryCharges || calculateDeliveryCharges(cartItems);

  // Render shipping and payment options (common for both flows)
  const renderShippingAndPayment = () => {
    const currentShipping = watchShipping || "dhaka-city";
    return (
      <>
        {/* Shipping Method */}
        <div className="mb-6">
          <p className="font-medium text-xs md:text-base mb-2 md:mb-3 flex items-center gap-2 text-gray-900">
            <Truck size={17} className="text-[#F45116]" />
            <span>Shipping Method</span>
          </p>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <label
              className={`flex items-center gap-2 p-2.5 md:p-3 border rounded-[8px] cursor-pointer transition-all text-xs md:text-sm ${
                currentShipping === "dhaka-city"
                  ? "border-[#F45116] bg-[#F45116]/5 font-semibold text-gray-900 shadow-xs"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="dhaka-city"
                {...register("shipping")}
                className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#F45116] accent-[#F45116] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Dhaka City</p>
              </div>
              <p className="font-semibold text-xs md:text-sm shrink-0 text-[#F45116]">
                {deliveryCharges.insideDhaka === 0
                  ? "Free"
                  : renderPrice(deliveryCharges.insideDhaka)}
              </p>
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 md:p-3 border rounded-[8px] cursor-pointer transition-all text-xs md:text-sm ${
                currentShipping === "outside"
                  ? "border-[#F45116] bg-[#F45116]/5 font-semibold text-gray-900 shadow-xs"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="outside"
                {...register("shipping")}
                className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#F45116] accent-[#F45116] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Outside Dhaka</p>
              </div>
              <p className="font-semibold text-xs md:text-sm shrink-0 text-[#F45116]">
                {deliveryCharges.outsideDhaka === 0
                  ? "Free"
                  : renderPrice(deliveryCharges.outsideDhaka)}
              </p>
            </label>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <p className="font-medium text-xs md:text-base mb-2 md:mb-3 flex items-center gap-2 text-gray-900">
            <CreditCard size={17} className="text-[#F45116]" />
            <span>Payment Method</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
            {/* Cash on Delivery */}
            <label
              className={`flex items-center gap-2.5 p-3 border rounded-[8px] cursor-pointer transition-all text-xs md:text-sm ${
                (watchPayment || "cod") === "cod"
                  ? "border-[#F45116] bg-[#F45116]/5 font-semibold text-gray-900 shadow-xs"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <input
                type="radio"
                value="cod"
                {...register("payment")}
                className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#F45116] accent-[#F45116] shrink-0"
                defaultChecked
              />
              <span className="text-xs md:text-sm text-gray-900 font-medium">
                Cash on Delivery
              </span>
            </label>

            {/* bKash Mobile Banking (Disabled) */}
            <label
              className="flex items-center justify-between gap-2.5 p-3 border border-gray-200 rounded-[8px] transition-all text-xs md:text-sm bg-gray-50 opacity-60 cursor-not-allowed select-none"
              title="bKash payment is currently unavailable"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  value="bkash"
                  disabled
                  className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-300 accent-gray-400 shrink-0 cursor-not-allowed"
                />
                <span className="text-xs md:text-sm text-gray-500 font-medium">
                  bKash
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium bg-gray-200/70 px-1.5 py-0.5 rounded">
                Unavailable
              </span>
            </label>

            {/* Nagad Mobile Banking (Disabled) */}
            <label
              className="flex items-center justify-between gap-2.5 p-3 border border-gray-200 rounded-[8px] transition-all text-xs md:text-sm bg-gray-50 opacity-60 cursor-not-allowed select-none"
              title="Nagad payment is currently unavailable"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  value="nagad"
                  disabled
                  className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-300 accent-gray-400 shrink-0 cursor-not-allowed"
                />
                <span className="text-xs md:text-sm text-gray-500 font-medium">
                  Nagad
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium bg-gray-200/70 px-1.5 py-0.5 rounded">
                Unavailable
              </span>
            </label>
          </div>
        </div>

        {/* Order Notes */}
        <div className="mb-6">
          <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900 flex items-center gap-1.5">
            <FileText size={15} className="text-[#F45116]" />
            <span>Order Notes (Optional)</span>
          </label>
          <textarea
            {...register("note")}
            placeholder="Special instructions for delivery, landmark, or timing..."
            className="w-full text-xs md:text-sm px-3 md:px-4 py-2 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all h-24 bg-white"
            rows={3}
          />
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F45116]"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6 text-gray-900">
        Shipping Address
      </h2>

      {/* User Info Display */}
      {user && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Logged in as: {user.fullName}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Link
              href="/profile"
              className="text-sm text-[#F45116] hover:underline font-medium"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      )}

      {/* Address Book View - When user has saved addresses */}
      {user && customerId && addresses.length > 0 && !isAddingNewAddress ? (
        <div className="space-y-6">
          {/* Selected Address Display */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-md font-bold text-gray-800">
                Selected Shipping Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAllAddresses(true)}
                className="text-sm text-[#F45116] hover:underline font-medium flex items-center gap-1"
              >
                Change Address <FaLongArrowAltRight className="text-xs" />
              </button>
            </div>
            {selectedAddress &&
              addresses.find((a) => a.id === selectedAddress) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-semibold">
                      {
                        addresses.find((a) => a.id === selectedAddress)
                          .recipientName
                      }
                    </p>
                  </div>
                  <p className="text-gray-700">
                    📞{" "}
                    {
                      addresses.find((a) => a.id === selectedAddress)
                        .phoneNumber
                    }
                  </p>
                  <p className="text-gray-600 text-sm">
                    📍 {addresses.find((a) => a.id === selectedAddress).address}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {addresses.find((a) => a.id === selectedAddress).upazila},{" "}
                    {addresses.find((a) => a.id === selectedAddress).district}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {addresses.find((a) => a.id === selectedAddress).division}
                  </p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-gray-100 rounded-full text-xs">
                    {getIcon(
                      addresses.find((a) => a.id === selectedAddress).type
                    )}
                    <span className="text-gray-700 font-semibold">
                      {addresses.find((a) => a.id === selectedAddress).type}
                    </span>
                  </div>
                </div>
              )}
          </div>

          {/* Add Address Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsAddingNewAddress(true)}
              className="flex items-center gap-2 px-4 py-2 text-[#F45116] border border-[#F45116] rounded-[8px] hover:bg-[#F45116]/5 transition-colors font-medium cursor-pointer text-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Address
            </button>
            {addresses.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllAddresses(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-200 rounded-[8px] hover:bg-gray-200 transition-colors font-medium cursor-pointer text-sm"
              >
                View All Addresses <FaLongArrowAltRight />
              </button>
            )}
          </div>

          {/* Shipping and Payment Options */}
          {renderShippingAndPayment()}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(handleSaveAndCheckout, (formErrors) => {
            if (setLoading) setLoading(false);
            scrollToFirstError(formErrors);
          })}
          className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-xs"
        >
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base md:text-lg text-gray-900 flex items-center gap-2">
                <MapPin size={18} className="text-[#F45116]" />
                <span>{user ? "Add New Shipping Address" : "Guest Shipping Details"}</span>
              </h3>
              {!user && (
                <Link
                  href="/login"
                  className="text-xs text-[#F45116] hover:underline font-semibold cursor-pointer"
                >
                  Already have an account? Log In
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-gray-900">
              <div>
                <label className="block mb-1 text-xs md:text-sm font-medium text-gray-900">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("recipientName", {
                    required: "Recipient Name is required",
                    minLength: { value: 2, message: "At least 2 characters" },
                  })}
                  placeholder="Full Name"
                  className="w-full text-xs md:text-sm placeholder:text-xs md:placeholder:text-sm px-3 md:px-4 py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all bg-white text-gray-900"
                />
                {errors.recipientName && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.recipientName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-xs md:text-sm font-medium text-gray-900">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^(?:\+88|01)?\d{9,11}$/,
                      message: "Valid BD phone number required",
                    },
                  })}
                  placeholder="01XXXXXXXXX"
                  className="w-full text-xs md:text-sm placeholder:text-xs md:placeholder:text-sm px-3 md:px-4 py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all bg-white text-gray-900"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-gray-900">
              <div>
                <label className="block mb-1 text-xs md:text-sm font-medium text-gray-900">
                  Email Address{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    (Optional)
                  </span>
                </label>
                <input
                  type="email"
                  {...register("email", {
                    validate: (value) => {
                      if (!value || value.trim() === "") return true;
                      return (
                        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                          value.trim()
                        ) || "Invalid email address"
                      );
                    },
                  })}
                  placeholder="your@email.com"
                  className="w-full text-xs md:text-sm placeholder:text-xs md:placeholder:text-sm px-3 md:px-4 py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all bg-white text-gray-900"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 h-10 md:h-11">
                  {[
                    { value: "Home", label: "Home", icon: Home },
                    { value: "Office", label: "Office", icon: Briefcase },
                    { value: "Other", label: "Other", icon: MapPin },
                  ].map(({ value, label, icon: Icon }) => {
                    const isSelected = (watchType || "Home") === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setValue("type", value, { shouldDirty: true })}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-[8px] border text-xs md:text-sm transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#F45116] bg-[#F45116]/10 text-[#F45116] font-bold shadow-xs"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={14} className={isSelected ? "text-[#F45116]" : "text-gray-400"} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <input type="hidden" {...register("country")} value="Bangladesh" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-xs md:text-sm">
              {/* Division */}
              <div>
                <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900">
                  Division <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("division", {
                    required: "Division is required",
                  })}
                  value={watchDivision || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("division", val, { shouldValidate: true });
                    setValue("district", "");
                    setValue("upazila", "");
                  }}
                  className="w-full text-xs md:text-sm font-normal text-gray-800 px-2.5 md:px-3 py-2 md:py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all cursor-pointer bg-white truncate"
                >
                  <option value="">Select Division</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.name}>
                      {division.name}
                    </option>
                  ))}
                </select>
                {errors.division && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.division.message}
                  </p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("district", {
                    required: "District is required",
                  })}
                  value={watchDistrict || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("district", val, { shouldValidate: true });
                    setValue("upazila", "");
                  }}
                  className="w-full text-xs md:text-sm font-normal text-gray-800 px-2.5 md:px-3 py-2 md:py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer bg-white truncate"
                  disabled={!watchDivision}
                >
                  <option value="">
                    {watchDivision ? "Select District" : "Select Division"}
                  </option>
                  {filteredDistricts.map((district) => (
                    <option key={district.id} value={district.name}>
                      {district.name}
                    </option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.district.message}
                  </p>
                )}
              </div>

              {/* Upazila / Thana */}
              <div>
                <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900">
                  Upazila / Thana <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("upazila", { required: "Upazila is required" })}
                  value={watch("upazila") || ""}
                  onChange={(e) => {
                    setValue("upazila", e.target.value, { shouldValidate: true });
                  }}
                  className="w-full text-xs md:text-sm font-normal text-gray-800 px-2.5 md:px-3 py-2 md:py-2.5 h-10 md:h-11 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer bg-white truncate"
                  disabled={!watchDistrict}
                >
                  <option value="">
                    {watchDistrict
                      ? "Select Upazila / Thana"
                      : "Select District First"}
                  </option>
                  {filteredUpazilas.map((upazila) => (
                    <option key={upazila.id} value={upazila.name}>
                      {upazila.name}
                    </option>
                  ))}
                </select>
                {errors.upazila && (
                  <p className="text-red-500 text-xs md:text-sm mt-1">
                    {errors.upazila.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-xs md:text-sm text-gray-900">
                Street Address <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("address", {
                  required: "Address is required",
                  minLength: { value: 6, message: "Please provide a detailed address" },
                })}
                placeholder="House No, Road No, Sector/Area, Village..."
                className="w-full text-xs md:text-sm placeholder:text-xs md:placeholder:text-sm px-3 md:px-4 py-2.5 border border-gray-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-all h-20 md:h-24 bg-white text-gray-900"
                rows={3}
              />
              {errors.address && (
                <p className="text-red-500 text-xs md:text-sm mt-1">
                  {errors.address.message}
                </p>
              )}
            </div>

            {user && customerId && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register("isDefault")}
                  className="h-4 w-4 text-[#F45116] accent-[#F45116] rounded"
                  defaultChecked={addresses.length === 0}
                />
                <label className="ml-2 text-xs md:text-sm text-gray-700">
                  Set as default shipping address
                </label>
              </div>
            )}
          </div>

          {/* Shipping and Payment Options in Form */}
          {renderShippingAndPayment()}
        </form>
      )}

      {/* Modal for existing address showing */}
      {showAllAddresses && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">
                  Select Shipping Address
                </h2>
                <button
                  onClick={() => setShowAllAddresses(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => {
                  const isSelected = selectedAddress === address.id;
                  return (
                    <div
                      key={address.id}
                      className={`relative bg-white rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
                        isSelected ? "border-[#F45116] shadow-md" : "border-gray-200 hover:border-[#F45116]/40"
                      }`}
                      onClick={() => handleAddressSelect(address)}
                    >
                      {address.isDefault && (
                        <div className="absolute -top-2.5 left-4 px-3 py-0.5 bg-gradient-to-r from-[#F45116] to-[#D9400B] text-white text-[11px] font-bold rounded-full shadow-sm flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> DEFAULT
                        </div>
                      )}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2">
                          {getIcon(address.type)}
                          <span className="font-bold text-gray-900 text-sm">
                            {address.type}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {address.recipientName}
                          </p>
                          <p className="text-gray-700 text-xs">
                            📞 {address.phoneNumber}
                          </p>
                        </div>
                        <div className="text-xs text-gray-600 space-y-0.5">
                          <p>{address.address}</p>
                          <p>
                            {address.upazila}, {address.district}
                          </p>
                          <p>
                            {address.division} - {address.postalCode}
                          </p>
                        </div>
                        <div className="flex items-center justify-center pt-2">
                          <div
                            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                              isSelected ? "border-[#F45116] bg-[#F45116]" : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowAllAddresses(false)}
                  disabled={!selectedAddress}
                  className="flex-1 py-3 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  Use Selected Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDetails;
