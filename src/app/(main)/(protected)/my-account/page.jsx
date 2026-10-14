'use client';

import { useUser } from "@/hooks/useUser";
import { ChevronRight, Home, Lock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { updatePassword } from "@/lib/auth-helpers";
import { useRouter } from "next/navigation";

// Skeleton loader matching the page layout
const AccountSkeleton = () => {
  return (
    <div className="w-full bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 text-gray-800 animate-pulse font-outfit border border-gray-100">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-12 h-4 bg-gray-200 rounded-[4px]" />
        <div className="w-4 h-4 bg-gray-200 rounded-full" />
        <div className="w-20 h-4 bg-gray-200 rounded-[4px]" />
      </div>

      {/* Title */}
      <div className="flex justify-between items-center gap-5 mb-8">
        <div className="w-40 h-8 bg-gray-200 rounded-[6px]" />
        <div className="w-20 h-6 bg-gray-200 rounded-full" />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-10">
        {/* Left: Info */}
        <div className="space-y-6">
          <div className="w-48 h-6 bg-gray-200 rounded-[6px] mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1">
                <div className="w-24 h-4 bg-gray-200 rounded-[4px]" />
                <div className="w-full h-11 bg-gray-100 rounded-[6px]" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Change Password */}
        <div className="space-y-6">
          <div className="w-48 h-6 bg-gray-200 rounded-[6px] mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="w-28 h-4 bg-gray-200 rounded-[4px]" />
                <div className="w-full h-11 bg-gray-100 rounded-[6px]" />
              </div>
            ))}
            <div className="w-full h-24 bg-gray-50 rounded-[6px]" />
            <div className="w-full h-12 bg-gray-200 rounded-[6px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

const MyAccount = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await updatePassword(newPassword, currentPassword);

      if (result.success) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update password. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !user) {
    return <AccountSkeleton />;
  }

  return (
    <div className="w-full bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 text-gray-800 font-outfit border border-gray-100">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-[#F45116] flex items-center gap-1 transition-colors duration-200">
          <Home className="w-4 h-4" />
          Home
        </Link>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-900 font-medium">My Account</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center gap-5 border-b border-gray-100 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          My Account
        </h1>
        <div>
          {user?.email_confirmed_at ? (
            <span className="text-[#137333] text-xs font-semibold px-3 py-1 bg-[#E6F4EA] border border-[#A3E2B8] rounded-full">
              ✓ Verified
            </span>
          ) : (
            <span className="text-[#C5221F] text-xs font-semibold px-3 py-1 bg-[#FCE8E6] border border-[#F5C2C1] rounded-full">
              ⚠ Not Verified
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mt-8">
        {/* Personal Information Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50">
              Personal Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="px-4 py-3 bg-gray-50/70 border border-gray-100 rounded-[6px] text-gray-900 font-medium text-sm">
                  {user?.user_metadata?.full_name || "Not provided"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Contact Number
                </label>
                <div className="px-4 py-3 bg-gray-50/70 border border-gray-100 rounded-[6px] text-gray-700 text-sm">
                  {user?.user_metadata?.phone || user?.phone || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-gray-50/70 border border-gray-100 rounded-[6px] text-gray-900 font-medium text-sm">
                  {user?.email || "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Account Created
                </label>
                <div className="px-4 py-3 bg-gray-50/70 border border-gray-100 rounded-[6px] text-gray-700 text-sm">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : "N/A"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Last Sign In
                </label>
                <div className="px-4 py-3 bg-gray-50/70 border border-gray-100 rounded-[6px] text-gray-700 text-sm">
                  {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-50 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#F45116]" />
              Change My Password
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-colors"
                  placeholder="Enter current password"
                  required
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-colors"
                  placeholder="Enter new password (min 6 chars)"
                  required
                  minLength={6}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#F45116] focus:border-[#F45116] transition-colors"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  disabled={isUpdating}
                />
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-[6px] border border-gray-100 text-xs text-gray-600 space-y-1.5">
                <p className="font-semibold text-gray-800">Password must contain:</p>
                <ul className="grid grid-cols-2 gap-y-1 gap-x-2">
                  <li className="flex items-center gap-1.5">• At least 6 characters</li>
                  <li className="flex items-center gap-1.5">• One uppercase letter</li>
                  <li className="flex items-center gap-1.5">• One lowercase letter</li>
                  <li className="flex items-center gap-1.5">• One number</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3 bg-[#F45116] text-white font-semibold rounded-[6px] hover:bg-[#D9400B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F45116] transition duration-150 ease-in-out uppercase text-sm tracking-wide shadow-sm cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {isUpdating ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
