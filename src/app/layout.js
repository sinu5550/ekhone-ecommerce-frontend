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

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-PN7QTP68';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ekhone.com';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ekhone | Authentic Online Shopping in Bangladesh",
    template: "%s | Ekhone",
  },
  description: "Discover genuine electronics, fashion, and lifestyle products with express delivery nationwide across Bangladesh. 100% authentic products guaranteed.",
  keywords: [
    "online shopping bangladesh",
    "ekhone",
    "buy online dhaka",
    "authentic products bangladesh",
    "cash on delivery bangladesh",
    "best online shop bd",
  ],
  authors: [{ name: "Ekhone" }],
  creator: "Ekhone",
  publisher: "Ekhone",
  robots: {
    index: true,
    follow: true,
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
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ekhone Online Shopping",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ekhone | Authentic Online Shopping in Bangladesh",
    description: "Discover genuine electronics, fashion, and lifestyle products with express delivery nationwide across Bangladesh.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/ekhone.png",
  },
};

export default function RootLayout({ children }) {
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
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
