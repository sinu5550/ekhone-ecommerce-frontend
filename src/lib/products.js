import { apiClient } from "@/lib/apiClient";

export async function getProducts(filters = {}, page = 1, limit = 10) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return await apiClient(`/api/product?${params.toString()}`, {
      tags: ["products"],
      revalidate: 15,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export const getProductsBySubCategory = (id, p = 1, l = 10) =>
  getProducts({ subCategoryId: id }, p, l);

export const getProductsBySubCategoryName = (name, p = 1, l = 10) =>
  getProducts({ subCategoryName: name }, p, l);

export const getProductsByCategoryName = (name, p = 1, l = 10) =>
  getProducts({ categoryName: name }, p, l);

export const getProductsByMainCategoryName = (name, p = 1, l = 10) =>
  getProducts({ mainCategoryName: name }, p, l);

export const getProductsByCategory = (id, p = 1, l = 10) =>
  getProducts({ categoryId: id }, p, l);

export const getProductsByMainCategory = (id, p = 1, l = 10) =>
  getProducts({ mainCategoryId: id }, p, l);

export async function getProductBySlug(slug) {
  try {
    const res = await apiClient(`/api/product/${slug}`, {
      tags: ["products", `product-${slug}`],
      revalidate: 15,
    });
    return res?.data || res?.product || res;
  } catch (error) {
    // If slug lookup failed and slug is a numeric ID, fallback to ID lookup
    if (/^\d+$/.test(slug)) {
      try {
        const idRes = await apiClient(`/api/product/id/${slug}`, {
          tags: ["products", `product-id-${slug}`],
          revalidate: 15,
        });
        return idRes?.data || idRes?.product || idRes;
      } catch (_) {}
    }
    return null;
  }
}

export async function getRelatedProducts(subCategoryId, currentProductId, limit = 8) {
  try {
    let products = [];
    if (subCategoryId) {
      const response = await getProducts({ subCategoryId }, 1, 16);
      const fetched = response?.products || response?.data?.products || response?.data || [];
      if (Array.isArray(fetched)) {
        products.push(...fetched);
      }
    }
    
    // Fallback if not enough related products
    if (products.length < limit) {
      const response = await getProducts({}, 1, 16);
      const fetched = response?.products || response?.data?.products || response?.data || [];
      if (Array.isArray(fetched)) {
        products.push(...fetched);
      }
    }

    // Filter out current product and remove duplicates
    const uniqueMap = new Map();
    products.forEach((p) => {
      const pId = p.id || p.productId;
      if (pId && pId !== currentProductId && !uniqueMap.has(pId)) {
        uniqueMap.set(pId, p);
      }
    });

    return Array.from(uniqueMap.values()).slice(0, limit);
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}
