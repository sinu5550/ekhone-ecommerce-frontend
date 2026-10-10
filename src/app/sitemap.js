import { apiClient } from "@/lib/apiClient";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ekhone.com';

  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/product`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  let productUrls = [];
  let categoryUrls = [];

  // 1. Fetch products for sitemap
  try {
    const res = await apiClient('/api/product?limit=1000', {
      next: { revalidate: 3600 },
    });
    const products = Array.isArray(res) ? res : (res?.products || res?.data?.products || res?.data || []);
    if (Array.isArray(products)) {
      productUrls = products.map((prod) => ({
        url: `${baseUrl}/product/${prod.slug || prod.id}`,
        lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn("Failed to fetch products for sitemap:", err.message);
  }

  // 2. Fetch categories for sitemap
  try {
    const catRes = await apiClient('/api/categories', {
      next: { revalidate: 3600 },
    });
    const categories = Array.isArray(catRes) ? catRes : (catRes?.categories || catRes?.data?.categories || catRes?.data || []);
    if (Array.isArray(categories)) {
      categoryUrls = categories.map((cat) => ({
        url: `${baseUrl}/product?category=${encodeURIComponent(cat.name || cat.slug)}`,
        lastModified: cat.updatedAt ? new Date(cat.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.warn("Failed to fetch categories for sitemap:", err.message);
  }

  return [...staticPages, ...categoryUrls, ...productUrls];
}
