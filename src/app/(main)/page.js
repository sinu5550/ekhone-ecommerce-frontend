import HomeHero from "@/components/Home/HomeHero";
import ShopCategorySection from "@/components/Home/ShopCategorySection";
import NewArrivalSection from "@/components/Home/NewArrivalSection";
import CategoryProductsSection from "@/components/Home/CategoryProductsSection";
import AllProductsSection from "@/components/Home/AllProductsSection";
import { apiClient } from "@/lib/apiClient";

export default async function HomePage() {
  let heroSliders = [];
  let categories = [];
  let groupedProducts = {};
  let newArrivalProducts = [];
  let allProducts = [];

  // 1. Fetch hero sliders
  try {
    const heroRes = await apiClient("/api/hero-sliders", {
      next: { revalidate: 15, tags: ["hero-sliders"] },
    });
    if (Array.isArray(heroRes)) {
      heroSliders = heroRes;
    } else if (heroRes?.data && Array.isArray(heroRes.data)) {
      heroSliders = heroRes.data;
    }
  } catch (err) {
    if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
      console.warn("HomePage: Could not fetch hero sliders:", err.message);
    }
  }

  // 2. Fetch Categories
  try {
    const catRes = await apiClient("/api/categories", {
      next: { revalidate: 15, tags: ["categories"] },
    });
    if (Array.isArray(catRes)) {
      categories = catRes;
    } else if (catRes?.data && Array.isArray(catRes.data)) {
      categories = catRes.data;
    } else if (catRes?.categories && Array.isArray(catRes.categories)) {
      categories = catRes.categories;
    }
  } catch (err) {
    if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
      console.warn("HomePage: Could not fetch categories:", err.message);
    }
  }

  // 3. Fetch Grouped Products by Category (/api/product/grouped)
  try {
    const groupedRes = await apiClient("/api/product/grouped", {
      next: { revalidate: 15, tags: ["products"] },
    });
    groupedProducts = groupedRes?.data || groupedRes || {};
  } catch (err) {
    if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
      console.warn("HomePage: Could not fetch grouped products:", err.message);
    }
  }

  // 4. Fetch New Arrival Products (/api/product/new)
  try {
    const newRes = await apiClient("/api/product/new", {
      next: { revalidate: 15, tags: ["products"] },
    });
    if (Array.isArray(newRes)) {
      newArrivalProducts = newRes;
    } else if (newRes?.data?.products && Array.isArray(newRes.data.products)) {
      newArrivalProducts = newRes.data.products;
    } else if (newRes?.products && Array.isArray(newRes.products)) {
      newArrivalProducts = newRes.products;
    }
  } catch (err) {
    if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
      console.warn("HomePage: Could not fetch new products:", err.message);
    }
  }

  // 5. Fetch All Products (Catalog) (/api/product?limit=20)
  try {
    const prodRes = await apiClient("/api/product?limit=20", {
      next: { revalidate: 15, tags: ["products"] },
    });
    if (Array.isArray(prodRes)) {
      allProducts = prodRes;
    } else if (prodRes?.products && Array.isArray(prodRes.products)) {
      allProducts = prodRes.products;
    } else if (
      prodRes?.data?.products &&
      Array.isArray(prodRes.data.products)
    ) {
      allProducts = prodRes.data.products;
    }
  } catch (err) {
    if (err?.digest !== "DYNAMIC_SERVER_USAGE" && !err?.message?.includes("Dynamic server usage")) {
      console.warn("HomePage: Could not fetch all products:", err.message);
    }
  }

  // Build category showcase list: for each active category, find its products from groupedProducts or allProducts
  const activeCategories = (categories || []).filter((c) => c.status !== false);

  const categoryShowcase = activeCategories
    .map((category) => {
      // Find products for this category
      let catProducts = groupedProducts[category.name] || [];
      if (!catProducts || catProducts.length === 0) {
        catProducts = allProducts.filter(
          (p) =>
            p.subCategory?.category?.id === category.id ||
            p.subCategory?.category?.name?.toLowerCase() ===
              category.name?.toLowerCase() ||
            p.category?.id === category.id ||
            p.categoryName?.toLowerCase() === category.name?.toLowerCase(),
        );
      }
      return {
        category,
        products: catProducts,
      };
    })
    .filter((item) => item.products && item.products.length > 0);

  return (
    <div className="w-full bg-white pb-16 space-y-2">
      {/* 1. Hero Slider Banner */}
      <HomeHero
        heroSliders={heroSliders}
        featuredProducts={allProducts.slice(0, 8)}
      />

      {/* 2. Shop By Category (Icon / Image Grid) */}
      <ShopCategorySection categories={categories} />

      {/* 4. New Arrivals Section */}
      <NewArrivalSection
        products={
          newArrivalProducts.length > 0
            ? newArrivalProducts
            : allProducts.slice(0, 10)
        }
      />

      {/* 3. Category-Wise Product Showcases (For each Category with products) */}
      {categoryShowcase.map(({ category, products }) => (
        <CategoryProductsSection
          key={category.id}
          categoryName={category.name}
          title={category.name}
          subtitle="EXPLORE CATEGORY"
          products={products}
        />
      ))}

      {/* 5. All Products (The Full Catalogue) */}
      <AllProductsSection products={allProducts} />
    </div>
  );
}
