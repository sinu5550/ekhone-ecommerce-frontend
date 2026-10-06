import ProductCatalogClient from "@/components/Products/ProductCatalogClient";
import { apiClient } from "@/lib/apiClient";

export const metadata = {
    title: "Search Products - Ekhone",
    description: "Search products across all categories on Ekhone.",
};

export default async function SearchPage({ searchParams }) {
    const params = await searchParams;
    const initialSearch = params?.q || params?.search || "";
    const initialCategory = params?.category || params?.categoryName || "";

    let initialProducts = [];
    let initialCategories = [];

    // Fetch matching search products
    try {
        let endpoint = "/api/product?limit=50";
        if (initialSearch) {
            endpoint += `&search=${encodeURIComponent(initialSearch)}`;
        }
        if (initialCategory && initialCategory !== "All") {
            endpoint += `&categoryName=${encodeURIComponent(initialCategory)}`;
        }

        const res = await apiClient(endpoint, {
            next: { revalidate: 15, tags: ["products"] },
        });
        if (Array.isArray(res)) {
            initialProducts = res;
        } else if (res?.products && Array.isArray(res.products)) {
            initialProducts = res.products;
        } else if (res?.data?.products && Array.isArray(res.data.products)) {
            initialProducts = res.data.products;
        } else if (res?.data && Array.isArray(res.data)) {
            initialProducts = res.data;
        }
    } catch (err) {
        if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
            console.warn("SearchPage: Failed to fetch search products:", err.message);
        }
    }

    // Fetch categories
    try {
        const catRes = await apiClient("/api/categories", {
            next: { revalidate: 15, tags: ["categories"] },
        });
        if (Array.isArray(catRes)) {
            initialCategories = catRes;
        } else if (catRes?.data && Array.isArray(catRes.data)) {
            initialCategories = catRes.data;
        } else if (catRes?.categories && Array.isArray(catRes.categories)) {
            initialCategories = catRes.categories;
        }
    } catch (err) {
        if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
            console.warn("SearchPage: Failed to fetch categories:", err.message);
        }
    }

    return (
        <ProductCatalogClient
            initialProducts={initialProducts}
            initialCategories={initialCategories}
        />
    );
}
