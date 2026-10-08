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
  try {
    const res = await apiClient('/api/product?limit=200', {
      next: { revalidate: 3600 },
    });
    const products = Array.isArray(res) ? res : (res?.products || res?.data?.products || res?.data || []);
    if (Array.isArray(products)) {
      productUrls = products.map((prod) => ({
        url: `${baseUrl}/product/${prod.slug || prod.id}`,
        lastModified: prod.updatedAt ? new Date(prod.updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn("Failed to fetch products for sitemap:", err.message);
  }

  return [...staticPages, ...productUrls];
}
