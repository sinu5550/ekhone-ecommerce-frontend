import Link from "next/link";
import Image from "next/image";
import { Phone, ShoppingBag, ShieldCheck } from "lucide-react";

export default function LandingMinimalHeader({
  phone = "+8801969957888",
  onOrderClick,
}) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-amber-100/80 shadow-xs py-3">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="relative w-28 sm:w-32 h-9 sm:h-10">
          <Image
            src="/ekhone.png"
            alt="Ekhone"
            fill
            priority
            className="object-contain object-left"
          />
        </div>

        {/* Right Call & Quick Action */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
          >
            <Phone size={13} className="text-primary" />
            <span className="font-hind hidden sm:inline">{phone}</span>
            <span className="sm:hidden font-hind text-[11px]">কল করুন</span>
          </a>

          <button
            type="button"
            onClick={onOrderClick}
            className="px-4 sm:px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer animate-bounce hover:animate-none"
          >
            <ShoppingBag size={14} />
            <span>অর্ডার করুন</span>
          </button>
        </div>
      </div>
    </header>
  );
}
