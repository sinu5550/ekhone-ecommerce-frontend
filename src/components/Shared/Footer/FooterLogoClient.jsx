"use client";

import Image from "next/image";
import Link from "next/link";
import { useStoreSettings } from "@/lib/dataFetch";

export default function FooterLogoClient({ initialSettings = null }) {
  const { storeSettings } = useStoreSettings(initialSettings);
  const settings = storeSettings || initialSettings;

  const logoSrc = settings?.footerLogo || settings?.logo || "/ekhone.png";
  const hasBg = Boolean(settings?.footerLogoBg);

  return (
    <Link href="/" className="inline-block group">
      <div
        className={`relative transition-all ${
          hasBg
            ? "w-48 sm:w-60 h-16 sm:h-20 bg-white  rounded-xl shadow-xs border border-white/20 flex items-center justify-center"
            : "w-70 sm:w-80 h-28 sm:h-30 bg-transparent flex items-center justify-start -ml-5 -mb-6"
        }`}
      >
        <Image
          src={logoSrc}
          alt={settings?.siteTitle || "Ekhone"}
          fill
          priority={false}
          className={`object-contain transition-transform duration-200 group-hover:scale-[1.02]  ${
            hasBg ? "object-center" : "object-left"
          }`}
        />
      </div>
    </Link>
  );
}
