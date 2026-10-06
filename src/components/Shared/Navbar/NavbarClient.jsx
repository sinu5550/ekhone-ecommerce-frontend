"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
    Menu, 
    X, 
    ShoppingCart, 
    Heart, 
    User, 
    ChevronDown, 
    Layers, 
    ArrowRight,
    MapPin,
    Truck,
    HelpCircle
} from "lucide-react";
import TopHeader from "./TopHeader";
import SearchBar from "./SearchBar";
import { useCategories, useContact } from "@/lib/dataFetch";
import { useUser } from "@/hooks/useUser";

export default function NavbarClient({ categories: initialCategories = [], contactData: initialContact = null }) {
    const pathname = usePathname();
    const { user, getDisplayName, getUserInitials, getUserEmail } = useUser();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [activeHoverCategory, setActiveHoverCategory] = useState(null);
    const dropdownRef = useRef(null);

    // Live SWR updates on tab focus / interval without manual page refresh
    const { categories } = useCategories(initialCategories);
    const { contactData } = useContact(initialContact);

    // Scroll state for sticky shadow
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsCategoryDropdownOpen(false);
    }, [pathname]);

    // Close category dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsCategoryDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Active category for preview in mega dropdown
    const currentCategory = activeHoverCategory || categories[0] || null;

    // Categories to show in the horizontal category bar
    const categoryBarItems = categories.slice(0, 9);

    return (
        <>
            {/* 1. Top Header (Static, scrolls off screen) */}
            <TopHeader contactData={contactData} />

            {/* 2. Full Navbar Client (Sticky to top of viewport) */}
            <header className="sticky top-0 z-50 w-full bg-white shadow-xs">
                {/* Main Middle Navigation Bar */}
                <div className={`transition-all duration-200 border-b border-slate-100 ${isScrolled ? "py-2.5 bg-white/95 backdrop-blur-md " : "py-3 bg-white"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 md:gap-8">
                    {/* Left: Mobile Menu Toggle & Brand Logo */}
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen(prev => !prev)}
                            className="lg:hidden p-2 text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>

                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-28 sm:w-36 h-9 sm:h-10">
                                <Image
                                    src="/ekhone.png"
                                    alt="Ekhone"
                                    fill
                                    priority
                                    className="object-contain object-left transition-transform duration-200 group-hover:scale-[1.02]"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Center: Evaly-style Search Bar with 'All v' Category Select and Search Button */}
                    <div className="flex-1 min-w-0 hidden md:block">
                        <SearchBar categories={categories} />
                    </div>

                    {/* Right: Sign in, Wishlist, Cart Actions (Evaly aesthetic) */}
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        {/* User / Sign in dynamic check */}
                        {user ? (
                            <div className="relative group/account">
                                <Link
                                    href="/my-account"
                                    className="flex flex-col items-center justify-center text-slate-700 hover:text-primary transition cursor-pointer group"
                                >
                                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                                        {getUserInitials()}
                                    </div>
                                    <span className="text-[11px] font-medium mt-0.5 max-w-[60px] truncate">
                                        {getDisplayName()}
                                    </span>
                                </Link>

                                {/* Dropdown menu */}
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover/account:opacity-100 group-hover/account:visible transition-all duration-200 z-50">
                                    <div className="px-4 py-2 border-b border-slate-100">
                                        <p className="text-[10px] text-slate-400">Signed in as</p>
                                        <p className="text-xs font-semibold text-slate-800 truncate">{getUserEmail()}</p>
                                    </div>
                                    <Link
                                        href="/my-account"
                                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                                    >
                                        My Profile
                                    </Link>
                                    <Link
                                        href="/my-account/orders"
                                        className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                                    >
                                        My Orders
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const { logout } = await import('@/lib/auth-helpers');
                                            await logout();
                                            window.location.href = '/login';
                                        }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1 pt-2 cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex flex-col items-center justify-center text-slate-700 hover:text-primary transition cursor-pointer group"
                            >
                                <User size={20} strokeWidth={1.8} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[11px] font-medium mt-0.5">Sign in</span>
                            </Link>
                        )}

                        {/* Wishlist */}
                        <Link
                            href="/wishlist"
                            className="relative flex flex-col items-center justify-center text-slate-700 hover:text-primary transition cursor-pointer group"
                        >
                            <div className="relative">
                                <Heart size={20} strokeWidth={1.8} className="group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    0
                                </span>
                            </div>
                            <span className="text-[11px] font-medium mt-0.5">Wishlist</span>
                        </Link>

                        {/* Cart */}
                        <Link
                            href="/cart"
                            className="relative flex flex-col items-center justify-center text-slate-700 hover:text-primary transition cursor-pointer group"
                        >
                            <div className="relative">
                                <ShoppingCart size={20} strokeWidth={1.8} className="group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    0
                                </span>
                            </div>
                            <span className="text-[11px] font-medium mt-0.5">Cart</span>
                        </Link>
                    </div>
                </div>

                {/* Mobile Search Bar Row */}
                <div className="px-4 pt-2 md:hidden">
                    <SearchBar categories={categories} />
                </div>
            </div>

            {/* 3. Bottom Category Strip (Evaly-style: [ = All Categories v ] + Category Links) */}
            <div className="border-b border-slate-200/90 bg-white hidden lg:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
                    {/* All Categories Button with Rounded Dark Pill */}
                    <div 
                        ref={dropdownRef}
                        className="relative py-2.5"
                    >
                        <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-md transition cursor-pointer shadow-xs"
                        >
                            <Menu size={16} className="text-white" />
                            <span>All Categories</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 text-white ${isCategoryDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {/* Mega Categories Dropdown */}
                        {isCategoryDropdownOpen && (
                            <div 
                                className="absolute top-full left-0 w-[720px] bg-white rounded-xl shadow-2xl border border-slate-200 flex overflow-hidden z-50 animate-in fade-in-50 duration-150"
                                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
                            >
                                {/* Left: Categories list */}
                                <div className="w-60 bg-slate-50 border-r border-slate-100 py-2 max-h-96 overflow-y-auto">
                                    {categories.map((cat) => {
                                        const isHovered = currentCategory?.id === cat.id;
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/product?category=${encodeURIComponent(cat.name)}`}
                                                onMouseEnter={() => setActiveHoverCategory(cat)}
                                                className={`flex items-center justify-between px-4 py-2.5 text-xs font-medium transition cursor-pointer ${
                                                    isHovered 
                                                        ? "bg-white text-primary font-bold border-l-4 border-primary shadow-xs" 
                                                        : "text-slate-700 hover:text-primary hover:bg-white"
                                                }`}
                                            >
                                                <span className="truncate">{cat.name}</span>
                                                <ArrowRight size={12} className={`transition-transform ${isHovered ? "translate-x-1 opacity-100" : "opacity-30"}`} />
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Right: Subcategories preview */}
                                <div className="flex-1 p-5 max-h-96 overflow-y-auto">
                                    {currentCategory ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                <div>
                                                    <h4 className="text-xs font-bold text-secound uppercase tracking-wider">
                                                        {currentCategory.name}
                                                    </h4>
                                                    <p className="text-[11px] text-slate-400">Popular items and subcategories</p>
                                                </div>
                                                <Link
                                                    href={`/product?category=${encodeURIComponent(currentCategory.name)}`}
                                                    className="text-[11px] text-primary hover:underline font-semibold"
                                                >
                                                    View All ({currentCategory.subCategories?.length || 0}) →
                                                </Link>
                                            </div>

                                            {currentCategory.subCategories && currentCategory.subCategories.length > 0 ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    {currentCategory.subCategories.map((sub) => (
                                                        <Link
                                                            key={sub.id}
                                                            href={`/product?subCategory=${encodeURIComponent(sub.name)}`}
                                                            className="p-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-600 hover:text-primary transition flex items-center justify-between group"
                                                        >
                                                            <span className="truncate">{sub.name}</span>
                                                            <span className="text-[10px] text-slate-300 group-hover:text-primary">→</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 py-6 text-center">
                                                    No subcategories under {currentCategory.name}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 text-center py-8">
                                            Select a category to view items
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Category Links Row with Horizontal Scrolling on Overflow & Pill Hover */}
                    <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1.5 scroll-smooth">
                        {categoryBarItems.length > 0 ? (
                            categoryBarItems.map((cat) => (
                                <Link
                                    key={cat.id || cat.name}
                                    href={`/product?category=${encodeURIComponent(cat.name)}`}
                                    className="whitespace-nowrap px-3.5 py-2 rounded-md text-xs font-normal text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 cursor-pointer shrink-0"
                                >
                                    {cat.name}
                                </Link>
                            ))
                        ) : (
                            <>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Electronics & Gadget</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Fashion</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Appliances</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Mobiles & Tablets</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Kitchen & Dining</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Travel Accessories</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Bags & Luggage</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Personal Care</Link>
                                <Link href="/product" className="whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all duration-150 shrink-0">Food & Grocery</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            </header>

            {/* 4. Mobile Navigation Drawer */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col z-50 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="relative w-32 h-9">
                                <Image
                                    src="/ekhone.png"
                                    alt="Ekhone"
                                    fill
                                    className="object-contain object-left"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Categories in Mobile Drawer */}
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
                                    <Layers size={12} /> All Categories
                                </p>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/product?category=${encodeURIComponent(cat.name)}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-700 hover:text-primary hover:bg-slate-50 transition"
                                    >
                                        <span>{cat.name}</span>
                                        <ArrowRight size={12} className="text-slate-300" />
                                    </Link>
                                ))}
                            </div>

                            {/* Utility Links */}
                            <div className="space-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
                                <Link
                                    href="/track-order"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                                >
                                    <Truck size={15} className="text-primary" />
                                    <span>Track Your Order</span>
                                </Link>
                                <Link
                                    href={user ? "/my-account" : "/login"}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700"
                                >
                                    <User size={15} className="text-primary" />
                                    <span>{user ? `My Account (${getDisplayName()})` : "Sign in / Create Account"}</span>
                                </Link>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-center text-slate-500">
                            <p className="font-semibold text-slate-700">Need Help?</p>
                            <p className="font-mono text-primary font-bold mt-0.5">
                                {contactData?.phone_number || "+880 1700-000000"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
