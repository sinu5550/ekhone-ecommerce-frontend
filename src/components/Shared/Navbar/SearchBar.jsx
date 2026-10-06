"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { trackSearch } from "@/utils/dataLayer";

export default function SearchBar({ categories = [] }) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    const containerRef = useRef(null);
    const catDropdownRef = useRef(null);

    // Debounced search query
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setIsLoading(false);
            setIsOpen(false);
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(async () => {
            try {
                let url = `/api/product?search=${encodeURIComponent(trimmed)}&limit=8`;
                if (selectedCategory && selectedCategory !== "All") {
                    url += `&categoryName=${encodeURIComponent(selectedCategory)}`;
                }
                const res = await apiClient(url);
                const items = Array.isArray(res) 
                    ? res 
                    : res?.products || res?.data?.products || res?.data || [];
                setResults(items);
                setIsOpen(true);
            } catch (err) {
                console.error("Search fetch error:", err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query, selectedCategory]);

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target)) {
                setIsCatDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const executeSearch = useCallback((searchQuery, category) => {
        const trimmed = (searchQuery || "").trim();
        if (!trimmed) return;

        setIsOpen(false);
        trackSearch(trimmed);

        let targetUrl = `/product?search=${encodeURIComponent(trimmed)}`;
        if (category && category !== "All") {
            targetUrl += `&category=${encodeURIComponent(category)}`;
        }
        router.push(targetUrl);
    }, [router]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        executeSearch(query, selectedCategory);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <form 
                onSubmit={handleSearchSubmit} 
                className="relative flex items-center bg-white border-2 border-primary rounded-full transition shadow-xs focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20"
            >
                {/* 1. Category Selector inside Search Bar */}
                <div ref={catDropdownRef} className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        className="flex items-center gap-1.5 pl-3.5 pr-2.5 sm:pl-4 sm:pr-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border-r border-slate-200/80 cursor-pointer h-full transition select-none"
                    >
                        <span className="max-w-[70px] sm:max-w-[90px] truncate">{selectedCategory}</span>
                        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isCatDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isCatDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 animate-in fade-in-50 duration-150">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory("All");
                                    setIsCatDropdownOpen(false);
                                }}
                                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                                    selectedCategory === "All" ? "text-primary font-bold bg-primary/5" : "text-slate-700"
                                }`}
                            >
                                <span>All Categories</span>
                                {selectedCategory === "All" && <Check size={13} className="text-primary" />}
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.id || cat.name}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(cat.name);
                                        setIsCatDropdownOpen(false);
                                    }}
                                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                                        selectedCategory === cat.name ? "text-primary font-bold bg-primary/5" : "text-slate-700"
                                    }`}
                                >
                                    <span className="truncate">{cat.name}</span>
                                    {selectedCategory === cat.name && <Check size={13} className="text-primary" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. Text Search Input */}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim() && (results.length > 0 || isLoading)) {
                            setIsOpen(true);
                        }
                    }}
                    placeholder="Search products, brands, categories..."
                    className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-3 pr-24 sm:pr-28 py-2.5 outline-none font-normal"
                />
                
                {/* Clear query button */}
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery("");
                            setResults([]);
                            setIsOpen(false);
                        }}
                        className="absolute right-20 sm:right-24 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                    >
                        <X size={15} />
                    </button>
                )}

                {/* 3. Search Button with Icon */}
                <button
                    type="submit"
                    className="absolute right-1.5 bg-primary hover:bg-primary/80 text-white px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition duration-200 shadow-sm cursor-pointer active:scale-95 shrink-0"
                >
                    {isLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <Search size={13} strokeWidth={2.4} />
                    )}
                    <span className="hidden sm:inline">Search</span>
                </button>
            </form>

            {/* Dropdown Live Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-50 duration-150">
                    {isLoading && results.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span>Finding matches for &quot;{query}&quot;...</span>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            <div className="p-2.5 px-4 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                <span>Products ({results.length})</span>
                                <span className="text-[10px] text-primary">Live Search</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                                {results.map((product) => {
                                    const img = Array.isArray(product.images) && product.images[0]
                                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
                                        : product.image || "/placeholder.png";

                                    const price = parseFloat(product.price || product.salePrice || 0);
                                    const targetLink = `/product/${product.slug || product.id}`;

                                    return (
                                        <Link
                                            key={product.id}
                                            href={targetLink}
                                            onClick={() => {
                                                setIsOpen(false);
                                                trackSearch(query.trim());
                                            }}
                                            className="p-3 px-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative">
                                                    <Image
                                                        src={img}
                                                        alt={product.productName || "Product"}
                                                        width={40}
                                                        height={40}
                                                        className="object-cover w-full h-full"
                                                        unoptimized={typeof img === 'string' && img.startsWith('http')}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                                        {product.productName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 truncate">
                                                        {product.brand?.name ? `${product.brand.name} • ` : ""}{product.subCategory?.category?.name || product.categoryName || `SKU: ${product.sku || "N/A"}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 pl-3">
                                                <span className="text-xs font-bold text-slate-900">
                                                    ৳{price.toLocaleString()}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => executeSearch(query, selectedCategory)}
                                className="w-full block p-3 text-center text-xs font-semibold text-primary hover:bg-primary-light/50 transition cursor-pointer"
                            >
                                View all matching products for &quot;{query}&quot; →
                            </button>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-xs text-slate-400">
                            No products found matching &quot;{query}&quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
