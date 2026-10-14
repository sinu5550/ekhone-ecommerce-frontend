import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Clock,
  Gift,
  ChevronRight,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { apiClient } from "@/lib/apiClient";
import FooterLogoClient from "./FooterLogoClient";

export default async function Footer() {
  let contactData = null;
  try {
    const contactRes = await apiClient("/api/contact", {
      next: { revalidate: 15, tags: ["contact"] },
    });
    contactData = contactRes?.data || contactRes || {};
  } catch (e) {
    if (e?.digest !== "DYNAMIC_SERVER_USAGE" && !e?.message?.includes("Dynamic server usage")) {
      console.warn("Footer: Could not fetch /api/contact", e.message);
    }
  }

  let storeSettings = null;
  try {
    const settingsRes = await apiClient("/api/store-settings", {
      next: { revalidate: 15, tags: ["store-settings"] },
    });
    storeSettings = settingsRes?.data || settingsRes || null;
  } catch (_) {}

  const {
    address = "House #14, Road #3, Block B, Aftabnagar, Dhaka-1219",
    phone_number = "+8801969957888",
    primary_email = "info@ekhone.com",
    description = "Ekhone is your destination for authentic fashion, wearables, and premium lifestyle essentials in Bangladesh.",
    facebook,
    instagram,
    youtube,
    linkedIn,
    twitter,
  } = contactData || {};

  const trustBadges = [
    {
      icon: Truck,
      title: "Fastest Delivery",
      desc: "Prompt delivery to all 64 districts in Bangladesh",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      desc: "Friendly assistance anytime via phone & email",
    },
    {
      icon: CheckCircle2,
      title: "Authenticity",
      desc: "Our products are genuine and guaranteed to be 100% authentic",
    },
    {
      icon: Gift,
      title: "Special Rewards",
      desc: "Exclusive deals, coupons and rewards for our loyal customers",
    },
  ];

  const footerLinks = {
    shopping: [
      { label: "New Arrivals", href: "/new-arrival" },
      { label: "Flash Deals", href: "/discount-campaigns" },
      { label: "Combo Packs", href: "/bundle-products" },
      { label: "All Products", href: "/product" },
      { label: "Wishlist", href: "/wishlist" },
    ],
    customerCare: [
      { label: "Track Your Order", href: "/track-order" },
      { label: "Help & FAQs", href: "/faqs" },
      { label: "Find Store Locations", href: "/find-store" },
      { label: "Corporate Enquiries", href: "/corporate-enquiries" },
      { label: "Contact Us", href: "/contact-us" },
    ],
    policies: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Return & Refund Policy", href: "/return-policy" },
      { label: "Shipping Policy", href: "/shipping-policy" },
    ],
  };

  const socialLinks = [
    { icon: FaFacebookF, href: facebook || "https://facebook.com", label: "Facebook" },
    { icon: FaInstagram, href: instagram || "https://instagram.com", label: "Instagram" },
    { icon: FaYoutube, href: youtube || "https://youtube.com", label: "YouTube" },
    { icon: FaLinkedinIn, href: linkedIn || "https://linkedin.com", label: "LinkedIn" },
  ].filter(Boolean);

  return (
    <footer className="w-full bg-[#0a1c33] text-slate-300 font-sans border-t border-slate-700/60 transition-colors">
      {/* 1. TOP SECTION: Trust Features Ribbon with Vertical Divider Lines */}
      <div className="border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/60">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center px-6 py-9 group hover:bg-slate-800/30 transition-colors"
                >
                  {/* Subtle circular badge for icon */}
                  <div className="w-12 h-12 rounded-full border border-slate-600/70 bg-slate-800/60 flex items-center justify-center text-primary mb-4.5 group-hover:border-primary group-hover:scale-105 transition-all">
                    <Icon size={20} strokeWidth={1.75} />
                  </div>
                  <h4 className="text-xs font-semibold text-white tracking-[0.2em] uppercase mb-2">
                    {badge.title}
                  </h4>
                  <p className="text-[12px] text-slate-400 leading-relaxed max-w-[240px]">
                    {badge.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Brand Overview & Tagline */}
      <div className="border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="max-w-2xl ">
            {/* Logo */}
            <FooterLogoClient initialSettings={storeSettings} />

            {/* Sub-headline */}
            <h3 className="text-xl md:text-2xl font-medium text-white tracking-wide">
              Authentic Online Shopping in Bangladesh
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed max-w-xl">
              {description}
            </p>

            {/* Social Icons row with circular borders */}
            <div className="flex items-center gap-2.5 pt-2">
              {socialLinks.map((social, sIdx) => {
                const SIcon = social.icon;
                return (
                  <a
                    key={sIdx}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-8 h-8 rounded-full border border-slate-600/80 bg-slate-800/50 flex items-center justify-center text-slate-300 hover:text-white hover:border-primary hover:bg-primary transition-all duration-200"
                  >
                    <SIcon size={13} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LOWER SECTION: Link Columns (Popular Categories, Customer Care, Contact) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1: Popular Categories / Shop */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200 tracking-[0.22em] uppercase pb-3.5 mb-4 border-b border-slate-700/60">
              Popular Categories
            </h4>
            <ul className="space-y-2.5 text-[12px] uppercase tracking-wider">
              {footerLinks.shopping.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-primary transition-colors flex items-center justify-between py-0.5 group"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Customer Service */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200 tracking-[0.22em] uppercase pb-3.5 mb-4 border-b border-slate-700/60">
              Customer Service
            </h4>
            <ul className="space-y-2.5 text-[12px] uppercase tracking-wider">
              {footerLinks.customerCare.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-primary transition-colors flex items-center justify-between py-0.5 group"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Policies & Legal */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200 tracking-[0.22em] uppercase pb-3.5 mb-4 border-b border-slate-700/60">
              Policies & Legal
            </h4>
            <ul className="space-y-2.5 text-[12px] uppercase tracking-wider">
              {footerLinks.policies.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-primary transition-colors flex items-center justify-between py-0.5 group"
                  >
                    <span>{item.label}</span>
                    <ChevronRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200 tracking-[0.22em] uppercase pb-3.5 mb-4 border-b border-slate-700/60">
              Contact
            </h4>
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-relaxed text-slate-400">{address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-primary shrink-0" />
                <a
                  href={`tel:${phone_number.replace(/\s+/g, "")}`}
                  className="text-slate-400 hover:text-white transition tracking-wide"
                >
                  {phone_number}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-primary shrink-0" />
                <a
                  href={`mailto:${primary_email}`}
                  className="text-slate-400 hover:text-white transition"
                >
                  {primary_email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM COPYRIGHT BAR */}
      <div className="border-t border-slate-700/60 py-6 bg-[#071526]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Ekhone. All Rights Reserved.</p>
          <div className="flex items-center gap-5 text-[11px] uppercase tracking-wider text-slate-400">
            <Link href="/terms" className="hover:text-slate-200 transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/privacy-policy" className="hover:text-slate-200 transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/return-policy" className="hover:text-slate-200 transition-colors">Return Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
