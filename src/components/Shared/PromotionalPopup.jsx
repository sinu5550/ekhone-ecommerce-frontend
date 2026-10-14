"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

export default function PromotionalPopup() {
  const pathname = usePathname();
  const isLandingOrCheckout = pathname?.startsWith("/landing") || pathname?.startsWith("/checkout");

  const [banner, setBanner] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || isLandingOrCheckout) return;

    // Check if user has already seen and closed or interacted with popup in this session
    const alreadyShown = sessionStorage.getItem("ekhone_popup_shown");
    if (alreadyShown) return;

    // Fetch active popup banner from backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${apiUrl}/api/popup-banner/active`)
      .then((res) => res.json())
      .then((data) => {
        const activeData = data?.data || data?.banner;
        if (activeData && activeData.image) {
          setBanner(activeData);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch promo banner:", err);
      });
  }, []);

  useEffect(() => {
    if (!banner) return;

    // Trigger on first scroll OR after a 4-second delay, whichever comes first
    let triggered = false;

    const triggerPopup = () => {
      if (triggered) return;
      triggered = true;
      setIsVisible(true);
      window.removeEventListener("scroll", handleScroll);
    };

    const handleScroll = () => {
      if (window.scrollY > 80) {
        triggerPopup();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    const timer = setTimeout(triggerPopup, 4000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [banner]);

  const handleClose = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("ekhone_popup_shown", "true");
    } catch (_) {}
  };

  if (!isVisible || !banner?.image) return null;

  const content = (
    <div className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-2xl bg-white select-none">
      <Image
        src={banner.image}
        alt={banner.title || "Special Promotion"}
        fill
        sizes="(max-width: 640px) 90vw, 420px"
        className="object-cover w-full h-full"
        priority
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      {/* Modal Container */}
      <div className="relative w-full max-w-[340px] sm:max-w-[520px] aspect-square rounded-2xl shadow-2xl transition-all scale-100 animate-in zoom-in-95 duration-300">
        {/* Floating Cross Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute -top-3.5 -right-3.5 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/90 text-white hover:bg-black hover:scale-110 active:scale-95 flex items-center justify-center shadow-xl border-2 border-white transition-all cursor-pointer"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* 1:1 Aspect ratio Image (No padding, rounded-2xl) */}
        {banner.link ? (
          <Link
            href={banner.link}
            onClick={handleClose}
            className="block w-full h-full group"
          >
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    </div>
  );
}
