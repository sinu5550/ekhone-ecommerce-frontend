"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, ChevronDown, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";

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
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                let url = `/api/products?search=${encodeURIComponent(query.trim())}&limit=6`;
                if (selectedCategory && selectedCategory !== "All") {
                    url += `&category=${encodeURIComponent(selectedCategory)}`;
                }
                const res = await apiClient(url);
                const items = Array.isArray(res) ? res : res?.products || res?.data?.products || [];
                setResults(items);
                setIsOpen(true);
            } catch (err) {
                console.error("Search fetch error:", err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            setIsOpen(false);
            let targetUrl = `/product?search=${encodeURIComponent(query.trim())}`;
            if (selectedCategory && selectedCategory !== "All") {
                targetUrl += `&category=${encodeURIComponent(selectedCategory)}`;
            }
            router.push(targetUrl);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <form 
                onSubmit={handleSearchSubmit} 
                className="relative flex items-center bg-white border-2 border-primary rounded-full transition shadow-xs focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20"
            >
                {/* 1. Evaly-style 'All v' Category Selector inside Search Bar */}
                <div ref={catDropdownRef} className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        className="flex items-center gap-1.5 pl-4 pr-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border-r border-slate-200/80 cursor-pointer h-full transition"
                    >
                        <span className="max-w-[80px] truncate">{selectedCategory}</span>
                        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isCatDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isCatDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 animate-in fade-in-50 duration-150">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory("All");
                                    setIsCatDropdownOpen(false);
                                }}
                                className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition ${
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
                                    className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition ${
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
                    onFocus={() => query.trim() && setIsOpen(true)}
                    placeholder="Search phones, beauty, home & more..."
                    className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-3.5 pr-28 py-2.5 outline-none font-normal"
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
                        className="absolute right-24 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition"
                    >
                        <X size={15} />
                    </button>
                )}

                {/* 3. Search Button with Icon */}
                <button
                    type="submit"
                    className="absolute right-1.5 bg-primary hover:bg-primary/80 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition duration-200 shadow-sm cursor-pointer active:scale-95"
                >
                    {isLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                    ) : (
                        <Search size={13} strokeWidth={2.4} />
                    )}
                    <span>Search</span>
                </button>
            </form>

            {/* Dropdown Live Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in-50 duration-150">
                    {isLoading ? (
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
                            <div className="max-h-80 overflow-y-auto">
                                {results.map((product) => {
                                    const img = Array.isArray(product.images) && product.images[0]
                                        ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url)
                                        : product.image || "/placeholder.png";

                                    return (
                                        <Link
                                            key={product.id}
                                            href={`/product/${product.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="p-3 px-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
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
                                                    <p className="text-[11px] text-slate-400">
                                                        SKU: {product.sku || "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold text-slate-900">
                                                    ৳{parseFloat(product.price || product.salePrice || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                            <Link
                                href={`/product?search=${encodeURIComponent(query)}`}
                                onClick={() => setIsOpen(false)}
                                className="block p-3 text-center text-xs font-semibold text-primary hover:bg-primary-light/50 transition cursor-pointer"
                            >
                                View all matching products →
                            </Link>
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
