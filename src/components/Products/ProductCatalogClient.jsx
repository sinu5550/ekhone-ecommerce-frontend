"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
    Search, 
    SlidersHorizontal, 
    X, 
    ChevronDown, 
    Check, 
    Loader2, 
    PackageSearch,
    ArrowUpDown,
    Filter
} from "lucide-react";
import Link from "next/link";
import Container from "@/components/Shared/Container";
import ProductCard from "@/components/Shared/ProductCard";
import QuickViewModal from "@/components/Shared/QuickViewModal";
import { apiClient } from "@/lib/apiClient";
import { trackViewItemList, trackSearch } from "@/utils/dataLayer";

function ProductCatalogContent({ initialProducts = [], initialCategories = [] }) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
    const urlCategory = searchParams.get("category") || searchParams.get("categoryName") || "";
    const urlSort = searchParams.get("sort") || "featured";

    const [products, setProducts] = useState(initialProducts);
    const [categories, setCategories] = useState(initialCategories);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchInput, setSearchInput] = useState(urlSearch);
    const [selectedCat, setSelectedCat] = useState(urlCategory || "All");
    const [sortBy, setSortBy] = useState(urlSort);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const isTypingRef = useRef(false);

    // Sync state when external URL params change (only if user isn't actively typing)
    useEffect(() => {
        if (!isTypingRef.current) {
            setSearchInput(urlSearch);
        }
        setSelectedCat(urlCategory || "All");
        setSortBy(urlSort);
    }, [urlSearch, urlCategory, urlSort]);

    // Live search on every keystroke with 200ms debounce
    useEffect(() => {
        if (searchInput === urlSearch) return;

        const timer = setTimeout(() => {
            isTypingRef.current = false;
            const params = new URLSearchParams(window.location.search);
            if (searchInput.trim()) {
                params.set("search", searchInput.trim());
            } else {
                params.delete("search");
                params.delete("q");
            }
            if (selectedCat && selectedCat !== "All") {
                params.set("category", selectedCat);
            } else {
                params.delete("category");
                params.delete("categoryName");
            }
            if (sortBy && sortBy !== "featured") {
                params.set("sort", sortBy);
            }

            const queryString = params.toString();
            router.replace(`/product${queryString ? `?${queryString}` : ""}`, { scroll: false });
        }, 200);

        return () => clearTimeout(timer);
    }, [searchInput, urlSearch, selectedCat, sortBy, router]);

    // Fetch products based on active filters
    useEffect(() => {
        let isMounted = true;
        const fetchFilteredProducts = async () => {
            setIsLoading(true);
            try {
                let endpoint = "/api/product?limit=100";
                if (urlSearch.trim()) {
                    endpoint += `&search=${encodeURIComponent(urlSearch.trim())}`;
                    trackSearch(urlSearch.trim());
                }
                if (urlCategory && urlCategory !== "All") {
                    endpoint += `&categoryName=${encodeURIComponent(urlCategory)}`;
                }

                const res = await apiClient(endpoint);
                const items = Array.isArray(res)
                    ? res
                    : res?.products || res?.data?.products || res?.data || [];

                if (isMounted) {
                    setProducts(items);
                    if (items.length > 0) {
                        trackViewItemList(items, urlSearch ? `Search: ${urlSearch}` : 'Product Catalog', 'catalog_grid');
                    }
                }
            } catch (err) {
                console.error("Failed to load catalog products:", err);
                if (isMounted) setProducts([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchFilteredProducts();

        return () => {
            isMounted = false;
        };
    }, [urlSearch, urlCategory]);

    // Fetch categories if not passed initially
    useEffect(() => {
        if (categories.length > 0) return;
        apiClient("/api/categories")
            .then((res) => {
                const cats = Array.isArray(res) ? res : res?.data || res?.categories || [];
                setCategories(cats);
            })
            .catch(() => {});
    }, [categories.length]);

    // Handle Quick View
    const handleOpenQuickView = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    // Push new query parameters to URL immediately
    const updateUrlParams = (newSearch, newCat, newSort) => {
        isTypingRef.current = false;
        const params = new URLSearchParams();
        if (newSearch && newSearch.trim()) {
            params.set("search", newSearch.trim());
        }
        if (newCat && newCat !== "All") {
            params.set("category", newCat);
        }
        if (newSort && newSort !== "featured") {
            params.set("sort", newSort);
        }

        const queryString = params.toString();
        router.push(`/product${queryString ? `?${queryString}` : ""}`);
    };

    const handleSearchChange = (val) => {
        isTypingRef.current = true;
        setSearchInput(val);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateUrlParams(searchInput, selectedCat, sortBy);
    };

    const handleCategoryChange = (catName) => {
        setSelectedCat(catName);
        updateUrlParams(searchInput, catName, sortBy);
        setIsFilterOpen(false);
    };

    const handleSortChange = (newSort) => {
        setSortBy(newSort);
        updateUrlParams(searchInput, selectedCat, newSort);
    };

    const clearAllFilters = () => {
        isTypingRef.current = false;
        setSearchInput("");
        setSelectedCat("All");
        setSortBy("featured");
        router.push("/product");
    };

    // Client-side sorting
    const sortedProducts = useMemo(() => {
        if (!products || !Array.isArray(products)) return [];
        const list = [...products];

        switch (sortBy) {
            case "price-low":
                return list.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
            case "price-high":
                return list.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
            case "newest":
                return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            case "name":
                return list.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
            case "featured":
            default:
                return list;
        }
    }, [products, sortBy]);

    const activeFilterCount = (urlSearch ? 1 : 0) + (urlCategory && urlCategory !== "All" ? 1 : 0);

    return (
        <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10">
            <Container>
                {/* 1. Breadcrumb & Title */}
                <div className="mb-6 sm:mb-8">
                    <nav className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Link href="/" className="hover:text-primary transition">Home</Link>
                        <span>/</span>
                        <Link href="/product" className="hover:text-primary transition">Products</Link>
                        {urlCategory && urlCategory !== "All" && (
                            <>
                                <span>/</span>
                                <span className="text-slate-900 font-medium">{urlCategory}</span>
                            </>
                        )}
                        {urlSearch && (
                            <>
                                <span>/</span>
                                <span className="text-slate-900 font-medium truncate max-w-[150px]">
                                    &ldquo;{urlSearch}&rdquo;
                                </span>
                            </>
                        )}
                    </nav>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {urlSearch ? `Search Results for "${urlSearch}"` : urlCategory && urlCategory !== "All" ? `${urlCategory} Collection` : "All Products"}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                {isLoading ? (
                                    "Updating search results..."
                                ) : (
                                    `Showing ${sortedProducts.length} ${sortedProducts.length === 1 ? "product" : "products"}`
                                )}
                            </p>
                        </div>

                        {/* Search & Sort Toolbar for Desktop */}
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64">
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    placeholder="Search by name, SKU, brand..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pl-9 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition shadow-xs"
                                />
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSearchChange("");
                                            updateUrlParams("", selectedCat, sortBy);
                                        }}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    >
                                        <X size={13} />
                                    </button>
                                )}
                            </form>

                            {/* Sort Dropdown */}
                            <div className="relative shrink-0">
                                <select
                                    value={sortBy}
                                    onChange={(e) => handleSortChange(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition cursor-pointer shadow-xs appearance-none pr-8"
                                >
                                    <option value="featured">Sort: Featured</option>
                                    <option value="newest">Sort: Newest First</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name">Name: A to Z</option>
                                </select>
                                <ArrowUpDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Mobile Filter Toggle Button */}
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="md:hidden bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs"
                            >
                                <Filter size={13} />
                                <span>Filter</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. Main Content Grid (Sidebar + Products) */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {/* Left Sidebar Categories (Desktop) */}
                    <div className="hidden md:block md:col-span-1 space-y-5">
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <SlidersHorizontal size={14} className="text-primary" />
                                    <span>Categories</span>
                                </h3>
                                {selectedCat !== "All" && (
                                    <button
                                        type="button"
                                        onClick={() => handleCategoryChange("All")}
                                        className="text-[11px] text-primary font-semibold hover:underline"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                                <button
                                    type="button"
                                    onClick={() => handleCategoryChange("All")}
                                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                                        selectedCat === "All"
                                            ? "bg-primary text-white font-bold shadow-xs"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <span>All Categories</span>
                                    {selectedCat === "All" && <Check size={14} />}
                                </button>

                                {categories.map((cat) => (
                                    <button
                                        key={cat.id || cat.name}
                                        type="button"
                                        onClick={() => handleCategoryChange(cat.name)}
                                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                                            selectedCat === cat.name
                                                ? "bg-primary text-white font-bold shadow-xs"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                        {selectedCat === cat.name && <Check size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active Filters Pill Box */}
                        {activeFilterCount > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Filters</span>
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="text-[11px] text-red-500 font-semibold hover:underline"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {urlSearch && (
                                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                            <span>Search: {urlSearch}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateUrlParams("", selectedCat, sortBy)}
                                                className="hover:text-red-500"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                    {urlCategory && urlCategory !== "All" && (
                                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                                            <span>{urlCategory}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryChange("All")}
                                                className="hover:text-primary-dark"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Filter Drawer */}
                    {isFilterOpen && (
                        <div className="fixed inset-0 z-50 md:hidden flex">
                            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsFilterOpen(false)} />
                            <div className="relative ml-auto w-4/5 max-w-sm bg-white h-full shadow-2xl p-5 flex flex-col z-10 animate-in slide-in-from-right duration-200">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Filter size={15} className="text-primary" />
                                        <span>Filter Products</span>
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsFilterOpen(false)}
                                        className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                            Search Keyword
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchInput}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                placeholder="Search products..."
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                            Categories
                                        </label>
                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => handleCategoryChange("All")}
                                                className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between ${
                                                    selectedCat === "All" ? "bg-primary text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                <span>All Categories</span>
                                                {selectedCat === "All" && <Check size={14} />}
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat.id || cat.name}
                                                    type="button"
                                                    onClick={() => handleCategoryChange(cat.name)}
                                                    className={`w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between ${
                                                        selectedCat === cat.name ? "bg-primary text-white font-bold" : "text-slate-700 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <span>{cat.name}</span>
                                                    {selectedCat === cat.name && <Check size={14} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                    >
                                        Reset All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateUrlParams(searchInput, selectedCat, sortBy);
                                            setIsFilterOpen(false);
                                        }}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 shadow-sm"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products Grid / Results Area */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-4">
                        {isLoading ? (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                                <Loader2 size={32} className="animate-spin text-primary mb-3" />
                                <h3 className="text-sm font-bold text-slate-800">Loading catalog products...</h3>
                                <p className="text-xs text-slate-400 mt-1">Please wait a moment.</p>
                            </div>
                        ) : sortedProducts.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                                {sortedProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onOpenQuickView={handleOpenQuickView}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 sm:p-16 flex flex-col items-center justify-center text-center shadow-xs">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                                    <PackageSearch size={32} />
                                </div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                    No products found
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-6">
                                    {urlSearch
                                        ? `We couldn't find any products matching "${urlSearch}". Try checking for spelling errors or searching with more general terms.`
                                        : "There are currently no products available in this selection."}
                                </p>
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full text-xs font-semibold transition shadow-sm"
                                >
                                    Browse All Products
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Container>

            {/* Quick View Modal */}
            <QuickViewModal
                product={selectedProduct}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedProduct(null);
                }}
            />
        </div>
    );
}

export default function ProductCatalogClient(props) {
    return (
        <Suspense
            fallback={
                <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-primary mb-2" />
                    <p className="text-xs text-slate-500">Loading catalog...</p>
                </div>
            }
        >
            <ProductCatalogContent {...props} />
        </Suspense>
    );
}
