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
    ArrowRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default async function Footer() {
    let contactData = null;
    try {
        const contactRes = await apiClient("/api/contact", {
            cache: "no-store",
            next: { revalidate: 0 }
        });
        contactData = contactRes?.data || contactRes || {};
    } catch (e) {
        console.warn("Footer: Could not fetch /api/contact", e.message);
    }

    const {
        address = "House #14, Road #3, Block B, Aftabnagar, Dhaka-1219",
        phone_number = "+880 1700-000000",
        primary_email = "support@ekhone.com",
        description = "Ekhone is your destination for authentic fashion, wearables, and premium lifestyle essentials in Bangladesh.",
    } = contactData || {};

    const trustBadges = [
        {
            icon: Truck,
            title: "Fast Delivery",
            desc: "Prompt delivery to all 64 districts in Bangladesh"
        },
        {
            icon: ShieldCheck,
            title: "100% Genuine",
            desc: "Quality verified items with verified origin"
        },
        {
            icon: RotateCcw,
            title: "Easy Returns",
            desc: "Hassle-free 7 days replacement guarantee"
        },
        {
            icon: Headphones,
            title: "24/7 Dedicated Support",
            desc: "Friendly assistance anytime via phone & email"
        }
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
        ]
    };

    return (
        <footer className="w-full bg-secound text-slate-300">
            {/* 1. Trust & Benefit Badges Banner */}
            <div className="border-b border-secound-light/40 py-8 bg-secound-hover/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trustBadges.map((badge, idx) => {
                            const Icon = badge.icon;
                            return (
                                <div key={idx} className="flex items-center gap-3.5 p-3 rounded-xl bg-secound/40 border border-secound-light/30">
                                    <div className="w-11 h-11 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                        <Icon size={22} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                            {badge.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                            {badge.desc}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* 2. Main Footer Columns */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
                    {/* Brand Column (Span 2) */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="inline-block">
                            <div className="relative w-36 h-12 bg-white/95 rounded-lg px-2 py-1 flex items-center justify-center shadow-xs">
                                <Image
                                    src="/ekhone.png"
                                    alt="Ekhone"
                                    fill
                                    className="object-contain p-1"
                                />
                            </div>
                        </Link>

                        <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                            {description}
                        </p>

                        <div className="space-y-2.5 pt-2 text-xs">
                            <div className="flex items-start gap-2.5">
                                <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                                <span className="text-slate-300">{address}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Phone size={15} className="text-primary shrink-0" />
                                <a href={`tel:${phone_number.replace(/\s+/g, "")}`} className="hover:text-white transition font-mono">
                                    {phone_number}
                                </a>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <Mail size={15} className="text-primary shrink-0" />
                                <a href={`mailto:${primary_email}`} className="hover:text-white transition">
                                    {primary_email}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Shopping Links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-secound-light/40">
                            Shop
                        </h4>
                        <ul className="space-y-2 text-xs">
                            {footerLinks.shopping.map((item, idx) => (
                                <li key={idx}>
                                    <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span className="text-primary text-[10px]">›</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer Support Links */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-secound-light/40">
                            Customer Care
                        </h4>
                        <ul className="space-y-2 text-xs">
                            {footerLinks.customerCare.map((item, idx) => (
                                <li key={idx}>
                                    <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span className="text-primary text-[10px]">›</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Policies */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-1 border-b border-secound-light/40">
                            Policies & Legal
                        </h4>
                        <ul className="space-y-2 text-xs">
                            {footerLinks.policies.map((item, idx) => (
                                <li key={idx}>
                                    <Link href={item.href} className="hover:text-primary transition-colors flex items-center gap-1.5">
                                        <span className="text-primary text-[10px]">›</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* 3. Bottom Copyright Row */}
            <div className="border-t border-secound-light/30 py-6 bg-secound-hover">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <p>© {new Date().getFullYear()} Ekhone. All Rights Reserved.</p>
                    <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-slate-400">Cash on Delivery & Secure Online Payments Accepted</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
