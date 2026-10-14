"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Briefcase,
  Edit,
  Plus,
  Check,
  Trash2,
  MapPin,
  Phone,
  Star,
  User,
  HomeIcon,
  ChevronRight,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import Swal from "sweetalert2";
import AddressAddDrawer from "@/components/Drawer/AddressDrawer/AddressAddDrawer";
import AddressEditDrawer from "@/components/Drawer/AddressDrawer/AddressEditDrawer";
import { useUser } from "@/hooks/useUser";
import Link from "next/link";

// Skeleton Loader for Address Book page
const AddressBookSkeleton = () => {
  return (
    <div className="w-full bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 text-gray-800 animate-pulse font-outfit border border-gray-100 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-12 h-4 bg-gray-200 rounded-[4px]" />
        <div className="w-4 h-4 bg-gray-200 rounded-full" />
        <div className="w-20 h-4 bg-gray-200 rounded-[4px]" />
        <div className="w-4 h-4 bg-gray-200 rounded-full" />
        <div className="w-16 h-4 bg-gray-200 rounded-[4px]" />
      </div>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 bg-gray-50 border border-gray-100 rounded-[12px]">
        <div className="space-y-2">
          <div className="w-44 h-7 bg-gray-200 rounded-[6px]" />
          <div className="w-64 h-4 bg-gray-200 rounded-[4px]" />
        </div>
        <div className="w-44 h-11 bg-gray-200 rounded-[6px]" />
      </div>

      {/* Address Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-[12px] border border-gray-150 p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-150 rounded-[12px]" />
                <div className="space-y-1.5">
                  <div className="w-20 h-5 bg-gray-200 rounded-[4px]" />
                  <div className="w-16 h-3 bg-gray-150 rounded-[4px]" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-150 rounded-[4px]" />
                <div className="w-8 h-8 bg-gray-150 rounded-[4px]" />
              </div>
            </div>
            <div className="w-full h-[1px] bg-gray-100" />
            <div className="space-y-3">
              <div className="w-36 h-4 bg-gray-200 rounded-[4px]" />
              <div className="w-48 h-4 bg-gray-200 rounded-[4px]" />
              <div className="w-full h-4 bg-gray-150 rounded-[4px]" />
            </div>
            <div className="w-full h-[1px] bg-gray-100" />
            <div className="w-full h-10 bg-gray-50 rounded-[6px]" />
          </div>
        ))}
      </div>
    </div>
  );
};

const AddressBookPage = () => {
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState(null);

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
        } else {
          // If customer not found in DB, auto-create customer record
          try {
            const createResult = await apiClient("/api/customer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fullName:
                  user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  user?.email?.split("@")[0] ||
                  "Customer",
                email: user.email,
                phone: user?.phone || user?.user_metadata?.phone || "",
                status: true,
              }),
            });

            const created =
              createResult?.id
                ? createResult
                : createResult?.data || createResult?.customer;

            if (created && created.id) {
              setCustomerId(created.id);
              setAddresses(created.customerAddresses || []);
            } else {
              setCustomerId(null);
              setAddresses([]);
            }
          } catch (createErr) {
            console.warn("Auto-create customer on profile view:", createErr);
            setCustomerId(null);
            setAddresses([]);
          }
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setError(error.message || "Failed to load customer data");
        setCustomerId(null);
        setAddresses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [user?.email]);

  const fetchAddresses = async () => {
    try {
      let targetId = customerId;
      if (!targetId && user?.email) {
        const result = await apiClient(
          `/api/customer/email/${encodeURIComponent(user.email)}`
        );
        const customerData = result?.id ? result : (result?.data || null);
        if (customerData?.id) {
          targetId = customerData.id;
          setCustomerId(customerData.id);
        }
      }

      if (!targetId) return;

      const result = await apiClient(`/api/customer/${targetId}/addresses`);

      let addressData = null;
      if (result && result.success !== undefined) {
        addressData = result.data;
      } else if (Array.isArray(result)) {
        addressData = result;
      } else if (result?.customerAddresses) {
        addressData = result.customerAddresses;
      }

      setAddresses(addressData || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "Delete Address?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#C5221F",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        const deleteResult = await apiClient(
          `/api/customer/addresses/${addressId}`,
          {
            method: "DELETE",
          }
        );

        if (
          deleteResult &&
          (deleteResult.success ||
            deleteResult.message === "Address deleted successfully")
        ) {
          Swal.fire({
            icon: "success",
            title: "Deleted Successfully",
            text: "Address has been removed",
            confirmButtonColor: "#F45116",
            timer: 2000,
            showConfirmButton: false
          });
          await fetchAddresses();
        } else {
          throw new Error(deleteResult?.message || "Failed to delete address");
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error?.message || "Failed to delete address",
          confirmButtonColor: "#F45116"
        });
      }
    }
  };

  const handleSetDefault = async (addressId) => {
    try {
      const address = addresses.find((addr) => addr.id === addressId);
      if (!address) {
        throw new Error("Address not found");
      }

      const result = await apiClient(`/api/customer/addresses/${addressId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...address,
          isDefault: true,
        }),
      });

      if (
        result &&
        (result.id || result.success || result.message === "Address updated successfully")
      ) {
        Swal.fire({
          icon: "success",
          title: "Default Address Updated",
          confirmButtonColor: "#F45116",
          timer: 1500,
          showConfirmButton: false
        });
        await fetchAddresses();
      } else {
        throw new Error(result?.message || "Failed to set default address");
      }
    } catch (error) {
      console.error("Set default error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message || "Failed to set default address",
        confirmButtonColor: "#F45116"
      });
    }
  };

  const openEditDrawer = (address) => {
    setSelectedAddress(address);
    setShowEditDrawer(true);
  };

  const getIcon = (type) => {
    switch (type) {
      case "Home":
        return <Home className="w-5 h-5" />;
      case "Office":
        return <Briefcase className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Home":
        return {
          bg: "bg-[#F45116]/5",
          text: "text-[#F45116]",
          border: "border-[#F45116]/20",
        };
      case "Office":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          border: "border-blue-200",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  if (userLoading || isLoading) {
    return <AddressBookSkeleton />;
  }

  return (
    <div className="w-full bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 text-gray-800 font-outfit border border-gray-100">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-[#F45116] flex items-center gap-1 transition-colors duration-200">
            <HomeIcon className="w-4 h-4" />
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link href="/my-account" className="hover:text-[#F45116] transition-colors duration-200">
            My Account
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">My Address</span>
        </div>

        {/* Header Section */}
        <div className="bg-[#F45116]/5 p-4 rounded-[12px] border border-[#F45116]/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-900">
                Shipping Addresses
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Manage and organize your delivery locations
              </p>
            </div>

            <button
              onClick={() => setShowAddDrawer(true)}
              className="group flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-[6px] transition-all duration-300 font-semibold text-sm cursor-pointer shadow-sm w-full md:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="mt-4">
          {addresses.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-20 h-20 bg-[#F45116]/5 rounded-[24px] flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-[#F45116]" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Addresses Yet
              </h3>
              <p className="text-gray-500 mb-8 text-center max-w-sm text-sm">
                Get started by adding your first shipping address for seamless deliveries
              </p>
              <button
                onClick={() => setShowAddDrawer(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F45116] hover:bg-[#D9400B] text-white rounded-[6px] shadow-sm font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Your First Address
              </button>
            </div>
          ) : (
            /* Address Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {addresses.map((item) => {
                const typeColors = getTypeColor(item.type);

                return (
                  <div
                    key={item.id}
                    className={`relative bg-white rounded-[12px] border transition-all duration-200 hover:shadow-md ${
                      item.isDefault
                        ? "border-[#F45116] shadow-sm"
                        : "border-gray-200 hover:border-[#F45116]/40"
                    }`}
                  >
                    {/* Default Badge */}
                    {item.isDefault && (
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-[#F45116] text-white text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        DEFAULT ADDRESS
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`${typeColors.bg} w-11 h-11 rounded-[8px] flex items-center justify-center border ${typeColors.border}`}
                          >
                            <span className={typeColors.text}>
                              {getIcon(item.type)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">
                              {item.type}
                            </h3>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[11px] text-[#137333] font-semibold">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditDrawer(item)}
                            className="p-2 text-stone-600 hover:text-[#F45116] hover:bg-[#F45116]/5 rounded-[6px] transition-colors border border-gray-100 cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-[6px] transition-colors border border-gray-100 cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100"></div>

                      {/* Address Details */}
                      <div className="space-y-2 text-sm text-gray-700">
                        {item.recipientName && (
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-900 font-semibold">
                              {item.recipientName}
                            </p>
                          </div>
                        )}

                        {item.phoneNumber && (
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-600 font-medium">
                              {item.phoneNumber}
                            </p>
                          </div>
                        )}

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{item.address}</p>
                            <p className="text-xs text-gray-500">
                              {item.upazila}, {item.district}, {item.division} - {item.postalCode}
                            </p>
                            {item.city && (
                              <p className="text-xs text-gray-400">City: {item.city}</p>
                            )}
                            <p className="text-xs font-bold text-[#F45116] pt-0.5">
                              {item.country}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Set Default Button */}
                      {!item.isDefault && (
                        <>
                          <div className="border-t border-gray-100"></div>
                          <button
                            onClick={() => handleSetDefault(item.id)}
                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-[#F45116]/5 text-gray-700 hover:text-[#F45116] rounded-[6px] border border-gray-200 hover:border-[#F45116]/20 transition-all duration-200 text-xs font-bold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Set as Default
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <AddressAddDrawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onSuccess={fetchAddresses}
        customerId={customerId}
      />

      <AddressEditDrawer
        isOpen={showEditDrawer}
        onClose={() => {
          setShowEditDrawer(false);
          setSelectedAddress(null);
        }}
        address={selectedAddress}
        onSuccess={fetchAddresses}
      />
    </div>
  );
};

export default AddressBookPage;
