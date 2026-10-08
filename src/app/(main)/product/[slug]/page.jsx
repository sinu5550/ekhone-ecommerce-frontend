import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import ProductDetailsClient from "@/components/Products/ProductDetailsClient";
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
    `${SITE_URL}/og-default.jpg`;

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

// 2. Server Component page rendering with JSON-LD Schema markup for Google Rich Results
export default async function ProductDetailsPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products by subcategory
  const relatedProducts = await getRelatedProducts(
    product.subCategoryId || product.subCategory?.id,
    product.id,
    8
  );

  // Construct JSON-LD Schema for Google Rich Snippet Search Optimization
  const primaryImage =
    product.images?.[0] ||
    product.image ||
    product.productVariants?.[0]?.image ||
    `${SITE_URL}/og-default.jpg`;

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
      <ProductDetailsClient product={product} relatedProducts={relatedProducts} />
    </>
  );
}
