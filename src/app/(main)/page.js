import HomeHero from "@/components/Home/HomeHero";
import { apiClient } from "@/lib/apiClient";

export default async function HomePage() {
  let heroSliders = [];
  let featuredProducts = [];

  // 1. Fetch hero sliders configured by admin in CMS Hero Slider Manager
  try {
    const heroRes = await apiClient("/api/hero-sliders", {
      next: { revalidate: 30 }
    });
    if (Array.isArray(heroRes)) {
      heroSliders = heroRes;
    } else if (heroRes?.data && Array.isArray(heroRes.data)) {
      heroSliders = heroRes.data;
    }
  } catch (err) {
    console.warn("HomePage: Could not fetch hero sliders:", err.message);
  }

  // 2. Fetch products for fallback
  try {
    const res = await apiClient("/api/products?limit=8", {
      next: { revalidate: 60 }
    });
    if (Array.isArray(res)) {
      featuredProducts = res;
    } else if (res?.products && Array.isArray(res.products)) {
      featuredProducts = res.products;
    } else if (res?.data?.products && Array.isArray(res.data.products)) {
      featuredProducts = res.data.products;
    }
  } catch (err) {
    console.warn("HomePage: Could not fetch featured products:", err.message);
  }

  return (
    <div className="w-full bg-white pb-16">
      {/* 1. Evaly-style Hero Section configured from backend */}
      <HomeHero heroSliders={heroSliders} featuredProducts={featuredProducts} />
    </div>
  );
}
