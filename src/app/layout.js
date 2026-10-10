import { Inter, Manrope, Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

import Script from "next/script";
import PageTracker from "@/components/Analytics/PageTracker";
import { CartDrawerProvider } from "@/context/CartDrawerContext";
import FloatingCart from "@/components/Cart/FloatingCart";
import AiAssistantWidget from "@/components/AiAssistant/AiAssistantWidget";
import WelcomeAudioPlayer from "@/components/AiAssistant/WelcomeAudioPlayer";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-PN7QTP68';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ekhone.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ekhone | Authentic Online Shopping in Bangladesh",
    template: "%s | Ekhone",
  },
  description: "Ekhone is the best online shopping destination in Bangladesh. Shop 100% authentic electronics, fashion, lifestyle products, home essentials & accessories at the best prices with cash on delivery and fast nationwide delivery.",
  keywords: [
    "ekhone",
    "ekhone bd",
    "ekhone.xyz",
    "ekhone online shop",
    "Ekhone - Best Online Shopping Experience",
    "online shopping bangladesh",
    "best online shopping site",
    "buy online bangladesh",
    "authentic products bangladesh",
    "electronics online shopping bd",
    "fashion online shop bd",
    "cash on delivery bangladesh",
    "fast delivery online shop bd",
  ],
  authors: [{ name: "Ekhone", url: SITE_URL }],
  creator: "Ekhone",
  publisher: "Ekhone",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: SITE_URL,
    siteName: "Ekhone",
    title: "Ekhone | Authentic Online Shopping in Bangladesh",
    description: "Discover genuine electronics, fashion, and lifestyle products with express delivery nationwide across Bangladesh.",
    images: [
      {
        url: "/ekhone.png",
        width: 1200,
        height: 630,
        alt: "Ekhone - Best Online Shopping Experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekhone | Authentic Online Shopping in Bangladesh",
    description: "Discover genuine electronics, fashion, and lifestyle products with express delivery nationwide across Bangladesh.",
    images: ["/ekhone.png"],
  },
  icons: {
    icon: "/ekhone.png",
    shortcut: "/ekhone.png",
    apple: "/ekhone.png",
  },
};

export default function RootLayout({ children }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": "Ekhone | Authentic Online Shopping in Bangladesh",
        "description": "Ekhone is Bangladesh's top e-commerce platform offering 100% authentic products with fast delivery nationwide.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${SITE_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": "Ekhone",
        "url": SITE_URL,
        "logo": `${SITE_URL}/ekhone.png`,
        "sameAs": [
          "https://www.facebook.com/ekhoneecommerce",
        ]
      }
    ]
  };

  return (
    <html lang="en">
      <head>
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${inter.variable} ${manrope.variable} ${hindSiliguri.variable} antialiased min-h-screen flex flex-col bg-white text-slate-800`}>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <PageTracker />
        <CartDrawerProvider>
          {children}
          <FloatingCart />
          <WelcomeAudioPlayer />
          <AiAssistantWidget />
        </CartDrawerProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
