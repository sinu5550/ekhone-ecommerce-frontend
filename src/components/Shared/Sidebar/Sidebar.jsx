'use client';

import { getCurrentUser, logout } from "@/lib/auth-helpers";
import {
    Loader2,
    LogOut,
    MapPin,
    ShoppingBag,
    User
} from 'lucide-react';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from "react-hot-toast";
import Swal from 'sweetalert2';

const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();

        // Listen for auth changes to update sidebar instantly
        const handleAuthChange = () => {
            fetchUser();
        };
        window.addEventListener('authChange', handleAuthChange);
        return () => window.removeEventListener('authChange', handleAuthChange);
    }, []);

    const menuItems = [
        { id: 'profile', label: 'My Profile', icon: User, path: "/my-account" },
        { id: 'address', label: 'Address Book', icon: MapPin, path: "/my-account/address-book" },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag, path: "/my-account/orders" },
    ];

    const isActive = (path) => {
        if (path === "/my-account") {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Logout?',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#F45116',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                setIsLoggingOut(true);
                await logout();
                toast.success('You have been successfully logged out');
                router.push('/login');
            } catch (error) {
                console.error('Logout error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to logout. Please try again.',
                    confirmButtonColor: '#F45116'
                });
            } finally {
                setIsLoggingOut(false);
            }
        }
    };

    const getUserInitials = () => {
        if (!user) return '??';
        const fullName = user?.user_metadata?.full_name || user?.email || '';
        const names = fullName.trim().split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    const getAvatarUrl = () => {
        return user?.user_metadata?.picture || null;
    };

    const getDisplayName = () => {
        if (!user) return 'Loading...';
        return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    };

    return (
        <div className="w-full bg-white rounded-[12px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-4 md:p-6 flex flex-col font-outfit border border-gray-100">
            {/* User Profile Section */}
            <div className="flex items-center gap-3 p-4 bg-[#F45116]/5 rounded-[12px] mb-6 flex-shrink-0">
                {loading ? (
                    <>
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                        </div>
                    </>
                ) : (
                    <>
                        {getAvatarUrl() ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#F45116]/20">
                                <img
                                    src={getAvatarUrl()}
                                    alt={getDisplayName()}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="w-12 h-12 bg-[#F45116] text-white rounded-full items-center justify-center hidden">
                                    <span className="font-bold text-lg">{getUserInitials()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-12 h-12 bg-[#F45116] text-white rounded-full flex items-center justify-center">
                                <span className="font-bold text-lg">{getUserInitials()}</span>
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-base">
                                {getDisplayName()}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">
                                {user?.email || 'My Profile Information'}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2 flex-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-[6px] transition-all duration-200 ${
                                active
                                    ? 'bg-[#F45116] text-white shadow-sm font-semibold'
                                    : 'bg-white hover:bg-[#F45116]/5 hover:text-[#F45116] text-gray-700'
                            }`}
                        >
                            <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-gray-500 group-hover:text-[#F45116]'}`} />
                            <span className="text-sm font-medium">
                                {item.label}
                            </span>
                            {active && (
                                <span className="ml-auto w-2 h-2 bg-white rounded-full"></span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-600 rounded-[6px] transition-colors duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogOut className="w-4 h-4" />
                            Logout
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
