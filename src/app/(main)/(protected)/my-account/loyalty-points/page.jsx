"use client";

import { useUser } from "@/hooks/useUser";
import { apiClient } from "@/lib/apiClient";
import { ChevronRight, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaGift,
  FaHistory,
  FaInfoCircle,
  FaShoppingBag,
  FaSpinner,
  FaTrophy,
} from "react-icons/fa";

export default function LoyaltyPointsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  // Fetch customer ID first, then loyalty data
  useEffect(() => {
    if (user?.email) {
      fetchCustomerAndLoyaltyData();
    }
  }, [user]);

  const fetchCustomerAndLoyaltyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get customer ID from email
      const customerResult = await apiClient(
        `/api/customer/email/${encodeURIComponent(user.email)}`
      );

      let customerData = null;
      if (customerResult && customerResult.success !== undefined) {
        customerData = customerResult.data;
      } else if (customerResult && customerResult.id) {
        customerData = customerResult;
      }

      if (!customerData || !customerData.id) {
        setError(
          "Customer profile not found. Please complete your profile first."
        );
        setLoading(false);
        return;
      }

      setCustomerId(customerData.id);

      // Step 2: Try to fetch existing loyalty points
      try {
        const balanceResponse = await apiClient(
          `/api/loyalty-points/balance/${customerData.id}`
        );

        if (
          balanceResponse &&
          balanceResponse.success &&
          balanceResponse.data
        ) {
          // Step 3: Fetch transactions
          const transactionsResponse = await apiClient(
            `/api/loyalty-points/transactions/${customerData.id}?limit=20`
          );

          const loyaltyData = {
            ...balanceResponse.data,
            recentTransactions:
              transactionsResponse && transactionsResponse.success
                ? transactionsResponse.data
                : [],
          };
          setLoyaltyData(loyaltyData);
        } else {
          // Step 4: Initialize loyalty account if not found
          await initializeLoyaltyAccount(customerData.id);
        }
      } catch (apiError) {
        if (
          apiError.message.includes("404") ||
          apiError.message.includes("not found")
        ) {
          await initializeLoyaltyAccount(customerData.id);
        } else {
          // For other errors, calculate points from orders
          await calculateLoyaltyFromOrders(customerData.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch loyalty data:", error);
      setError(error.message || "Failed to load loyalty information");
    } finally {
      setLoading(false);
    }
  };

  const initializeLoyaltyAccount = async (customerId) => {
    try {
      const initResponse = await apiClient("/api/loyalty-points/initialize", {
        method: "POST",
        body: JSON.stringify({ customerId: parseInt(customerId) }), // Ensure it's a number
      });

      if (initResponse && initResponse.success) {
        // Fetch again after initialization
        const retryResponse = await apiClient(
          `/api/loyalty-points/balance/${customerId}`
        );
        if (retryResponse && retryResponse.success && retryResponse.data) {
          setLoyaltyData({
            ...retryResponse.data,
            recentTransactions: [],
          });
        } else {
          // Fallback to calculating from orders
          await calculateLoyaltyFromOrders(customerId);
        }
      } else {
        // Fallback to calculating from orders
        await calculateLoyaltyFromOrders(customerId);
      }
    } catch (initError) {
      console.error("Initialization error:", initError);
      // Fallback to calculating from orders
      await calculateLoyaltyFromOrders(customerId);
    }
  };

  const calculateLoyaltyFromOrders = async (customerId) => {
    try {
      // Fetch orders for this customer
      const ordersResponse = await apiClient(
        `/api/order/customer/${customerId}`
      );

      let orders = [];
      if (ordersResponse && ordersResponse.success && ordersResponse.data) {
        orders = ordersResponse.data;
      } else if (Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      }

      // Calculate points based on orders
      const deliveredOrders = orders.filter(
        (order) =>
          order.status === "Delivered" && parseFloat(order.grandTotal) >= 10000
      );

      const totalSpent = deliveredOrders.reduce(
        (sum, order) => sum + parseFloat(order.grandTotal),
        0
      );

      const earnedPoints = Math.floor(totalSpent / 1000);
      const availablePoints = earnedPoints;
      const canRedeem = availablePoints >= 500;

      const calculatedData = {
        balance: availablePoints,
        balanceInBDT: availablePoints, // 1 point = 1 BDT
        lifetimeEarned: earnedPoints,
        lifetimeRedeemed: 0,
        canRedeem,
        minRedemption: 500,
        recentTransactions: [],
        // Add mock transaction history based on orders
        recentTransactions: deliveredOrders.map((order) => ({
          id: `calc-${order.id}`,
          type: "EARNED",
          points: Math.floor(parseFloat(order.grandTotal) / 1000),
          description: `Earned from order #${order.orderNumber}`,
          order: {
            orderNumber: order.orderNumber,
            grandTotal: order.grandTotal,
          },
          createdAt: order.orderDate || new Date().toISOString(),
          balanceAfter: 0, // This would need to be calculated cumulatively
        })),
      };

      setLoyaltyData(calculatedData);
    } catch (orderError) {
      console.error("Error fetching orders:", orderError);
      // If all else fails, create empty data
      setLoyaltyData({
        balance: 0,
        balanceInBDT: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        canRedeem: false,
        minRedemption: 500,
        recentTransactions: [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-[#F45116]" />
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <FaTrophy className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-2">No loyalty data found</p>
          <p className="text-gray-500 mb-6">
            You need to make a purchase to earn loyalty points
          </p>
          <button
            onClick={() => router.push("/products")}
            className="inline-flex items-center gap-2 bg-secound text-white px-6 py-3 rounded hover:bg-secound-hover transition-colors"
          >
            <FaShoppingBag />
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case "EARNED":
        return <span className="text-green-600 font-bold">+</span>;
      case "REDEEMED":
        return <span className="text-red-600 font-bold">-</span>;
      case "REFUNDED":
        return <span className="text-blue-600 font-bold">↺</span>;
      case "ADJUSTED":
        return <span className="text-orange-600 font-bold">✎</span>;
      default:
        return <span className="text-gray-600">•</span>;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "EARNED":
        return "text-green-600";
      case "REDEEMED":
        return "text-red-600";
      case "REFUNDED":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.description) {
      return transaction.description;
    }

    switch (transaction.type) {
      case "EARNED":
        return `Earned from order #${
          transaction.order?.orderNumber || "unknown"
        }`;
      case "REDEEMED":
        return `Redeemed for order #${
          transaction.order?.orderNumber || "unknown"
        }`;
      case "REFUNDED":
        return `Points refunded`;
      default:
        return "Transaction";
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-8 rounded-[12px]">
      <div className="max-w-6xl mx-auto px-4 space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-teal-600 flex items-center gap-1">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/my-account" className="hover:text-teal-600">
          My Account
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span>My Loyalty Points</span>
      </div>
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-3xl font-bold text-gray-800 font-philosopher">
          My Loyalty Points
        </h1>
      </div>

      {/* Balance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Balance */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-[12px] p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FaTrophy className="text-3xl opacity-80" />
            <span className="text-sm opacity-90 bg-black/10 px-2 py-1 rounded-full">
              Current Balance
            </span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {loyaltyData.balance ? loyaltyData.balance.toLocaleString() : "0"}
          </div>
          <div className="text-lg opacity-90">
            ≈ ৳
            {loyaltyData.balanceInBDT
              ? loyaltyData.balanceInBDT.toLocaleString()
              : "0"}
          </div>
          {!loyaltyData.canRedeem && loyaltyData.minRedemption && (
            <div className="mt-4 text-xs bg-white/20 rounded px-3 py-2">
              Earn {loyaltyData.minRedemption - (loyaltyData.balance || 0)} more
              points to redeem
            </div>
          )}
          {loyaltyData.canRedeem && (
            <div className="mt-4 text-xs bg-white/20 rounded px-3 py-2">
              ✨ Ready to redeem!
            </div>
          )}
        </div>

        {/* Lifetime Earned */}
        <div className="bg-white rounded-[12px] p-6 shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <FaGift className="text-3xl text-green-600" />
            <span className="text-sm text-gray-600">Lifetime Earned</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {loyaltyData.lifetimeEarned
              ? loyaltyData.lifetimeEarned.toLocaleString()
              : "0"}
          </div>
          <div className="text-sm text-gray-600">Total points earned</div>
        </div>

        {/* Lifetime Redeemed */}
        <div className="bg-white rounded-[12px] p-6 shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <FaHistory className="text-3xl text-blue-600" />
            <span className="text-sm text-gray-600">Lifetime Redeemed</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {loyaltyData.lifetimeRedeemed
              ? loyaltyData.lifetimeRedeemed.toLocaleString()
              : "0"}
          </div>
          <div className="text-sm text-gray-600">Total points used</div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-[12px] p-6 mb-8">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-blue-600 text-xl mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-gray-800 mb-3">
              How Loyalty Points Work
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>
                  Earn <strong>1 point per ৳1,000</strong> spent on orders ≥
                  ৳10,000
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>
                  Points are credited after order is{" "}
                  <strong>delivered and paid</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>
                  Redeem points at <strong>1 point = ৳1</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>
                  Minimum{" "}
                  <strong>{loyaltyData.minRedemption || 500} points</strong>{" "}
                  required to redeem
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Use points at checkout to save on your purchases</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-[12px] shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaHistory />
              Recent Transactions
            </h2>
            <button
              onClick={fetchCustomerAndLoyaltyData}
              className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <FaSpinner className="text-xs" />
              Refresh
            </button>
          </div>
        </div>

        {loyaltyData.recentTransactions &&
        loyaltyData.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loyaltyData.recentTransactions.map((transaction, index) => {
                  // Calculate cumulative balance for calculated transactions
                  const balance = loyaltyData.recentTransactions
                    .slice(0, index + 1)
                    .reduce((sum, t) => sum + (t.points || 0), 0);

                  return (
                    <tr
                      key={transaction.id || `tx-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {transaction.createdAt
                          ? format(
                              new Date(transaction.createdAt),
                              "MMM dd, yyyy"
                            )
                          : "N/A"}
                        {transaction.createdAt && (
                          <div className="text-xs text-gray-400">
                            {format(new Date(transaction.createdAt), "hh:mm a")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                            transaction.type === "EARNED"
                              ? "bg-green-100 text-green-800"
                              : transaction.type === "REDEEMED"
                              ? "bg-red-100 text-red-800"
                              : transaction.type === "REFUNDED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="max-w-xs">
                          {getTransactionDescription(transaction)}
                        </div>
                        {transaction.order && (
                          <div className="text-xs text-gray-500 mt-1">
                            Order #{transaction.order.orderNumber} • ৳
                            {parseFloat(
                              transaction.order.grandTotal || 0
                            ).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {getTransactionIcon(transaction.type)}
                          {Math.abs(transaction.points || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right font-medium">
                        {transaction.balanceAfter
                          ? transaction.balanceAfter.toLocaleString()
                          : balance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <FaHistory className="text-4xl mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-2">Start shopping to earn points!</p>
            <button
              onClick={() => router.push("/products")}
              className="mt-4 inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors"
            >
              <FaShoppingBag />
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
