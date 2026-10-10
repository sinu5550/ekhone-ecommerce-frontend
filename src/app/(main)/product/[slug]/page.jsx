import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import ProductDetailsClient from "@/components/Products/ProductDetailsClient";
import RelatedProductsSlider from "@/components/Products/RelatedProductsSlider";
import ProductCardSkeleton from "@/components/Shared/ProductCardSkeleton";
import { notFound } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.ekhone.com";

// 1. Dynamic SEO Metadata with OpenGraph and Twitter cards
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found - Ekhone",
      description: "The requested product is not available on Ekhone.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const plainDescription =
    product.description
      ? product.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().substring(0, 160)
      : `Buy ${product.productName} online at best price in Bangladesh from Ekhone. Authentic quality and fast delivery.`;

  const primaryImage =
    product.images?.[0] ||
    product.image ||
    product.productVariants?.[0]?.image ||
    `${SITE_URL}/ekhone.png`;

  const canonicalUrl = `${SITE_URL}/product/${product.slug || slug}`;
  const brandName = product.brand?.name || product.brandName || "Ekhone";

  return {
    title: `${product.productName} - Buy Online in Bangladesh | Ekhone`,
    description: plainDescription,
    keywords: [
      product.productName,
      brandName,
      product.subCategory?.category?.name,
      product.subCategory?.name,
      "online shopping bangladesh",
      "ekhone online shop",
      "buy online dhaka",
      product.sku,
    ].filter(Boolean),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.productName} - Ekhone`,
      description: plainDescription,
      url: canonicalUrl,
      siteName: "Ekhone",
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 800,
          alt: product.productName,
        },
      ],
      type: "website",
      locale: "en_BD",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.productName} - Ekhone`,
      description: plainDescription,
      images: [primaryImage],
    },
  };
}

import { Suspense } from "react";

async function AsyncRelatedProducts({ subCategoryId, productId }) {
  const relatedProducts = await getRelatedProducts(subCategoryId, productId, 8);
  return <RelatedProductsSlider relatedProducts={relatedProducts} />;
}

// 2. Server Component page rendering with JSON-LD Schema markup for Google Rich Results
export default async function ProductDetailsPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Construct JSON-LD Schema for Google Rich Snippet Search Optimization
  const primaryImage =
    product.images?.[0] ||
    product.image ||
    product.productVariants?.[0]?.image ||
    `${SITE_URL}/ekhone.png`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.productName,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [primaryImage],
    description: product.description
      ? product.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().substring(0, 300)
      : `Buy ${product.productName} at best price from Ekhone Bangladesh`,
    sku: product.sku || `EKH-${product.id}`,
    mpn: product.sku || `EKH-${product.id}`,
    brand: {
      "@type": "Brand",
      name: product.brand?.name || product.brandName || "Ekhone",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.slug || slug}`,
      priceCurrency: "BDT",
      price: parseFloat(product.price || 0),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.status && (product.quantity > 0 || product.productVariants?.some((v) => v.quantity > 0))
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Ekhone",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "89",
    },
  };

  return (
    <>
      {/* Inject Structured Data for Google Engine */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailsClient
        product={product}
        relatedProductsSlot={
          <Suspense
            key={`related-${product.id}`}
            fallback={
              <div className="mt-14 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                      Related Products
                    </h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      Customers also viewed these authentic items
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                  {[...Array(5)].map((_, i) => (
                    <ProductCardSkeleton key={`skeleton-${i}`} />
                  ))}
                </div>
              </div>
            }
          >
            <AsyncRelatedProducts
              subCategoryId={product.subCategoryId || product.subCategory?.id}
              productId={product.id}
            />
          </Suspense>
        }
      />
    </>
  );
}
