"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Phone, MapPin, Truck, Bell, ChevronDown, Check, Loader2 } from "lucide-react";

export default function TopHeader({ contactData }) {
    const contact = contactData?.data || contactData || {};
    const phone = contact?.phone_number || "+880 1700-000000";

    const [location, setLocation] = useState("Locating...");
    const [isLocating, setIsLocating] = useState(true);
    const [language, setLanguage] = useState("EN"); // 'BN' | 'EN'
    const [currency, setCurrency] = useState("BDT ৳");

    const [isLangOpen, setIsLangOpen] = useState(false);
    const langRef = useRef(null);

    // Automatically locate customer's city and postal code
    useEffect(() => {
        let isMounted = true;

        const autoDetectLocation = async () => {
            // Check cache first in session
            try {
                const cachedLoc = sessionStorage.getItem("user_detected_location");
                if (cachedLoc) {
                    if (isMounted) {
                        setLocation(cachedLoc);
                        setIsLocating(false);
                    }
                    return;
                }
            } catch (_) {}

            // Try HTML5 Geolocation reverse geocoding with OpenStreetMap Nominatim
            if (typeof window !== "undefined" && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            const res = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                            );
                            if (res.ok) {
                                const data = await res.json();
                                const addr = data?.address || {};
                                const city = addr.city || addr.town || addr.suburb || addr.state_district || addr.county || "Dhaka";
                                const postcode = addr.postcode || "";
                                const formatted = postcode ? `${city} ${postcode}` : city;
                                
                                if (isMounted) {
                                    setLocation(formatted);
                                    setIsLocating(false);
                                    try {
                                        sessionStorage.setItem("user_detected_location", formatted);
                                    } catch (_) {}
                                }
                                return;
                            }
                        } catch (err) {
                            console.warn("Geolocation reverse geocoding error:", err);
                        }
                        fetchIpLocation();
                    },
                    (error) => {
                        // User denied or error -> fallback to IP geolocation
                        fetchIpLocation();
                    },
                    { timeout: 5000 }
                );
            } else {
                fetchIpLocation();
            }
        };

        // Fallback IP Geolocation via ipapi.co
        const fetchIpLocation = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                if (res.ok) {
                    const data = await res.json();
                    const city = data.city || "Dhaka";
                    const postal = data.postal || "";
                    const formatted = postal ? `${city} ${postal}` : `${city} 1209`;
                    if (isMounted) {
                        setLocation(formatted);
                        setIsLocating(false);
                        try {
                            sessionStorage.setItem("user_detected_location", formatted);
                        } catch (_) {}
                    }
                    return;
                }
            } catch (e) {
                console.warn("IP Geolocation error:", e);
            }

            // Ultimate safe fallback
            if (isMounted) {
                setLocation("Dhaka 1209");
                setIsLocating(false);
            }
        };

        autoDetectLocation();

        return () => {
            isMounted = false;
        };
    }, []);

    // Close language dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (langRef.current && !langRef.current.contains(e.target)) {
                setIsLangOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="bg-primary text-orange-100 text-[11px] py-1.5 border-b border-orange-700/40 hidden md:block select-none">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Left: Auto-located city & postal code, Track Order, Help Center, Hotline */}
                <div className="flex items-center gap-5">
                    {/* Auto-detected Delivery Location */}
                    <div className="flex items-center gap-1.5 text-orange-100">
                        <MapPin size={12} className="text-white animate-pulse" />
                        <span>Deliver to</span>
                        {isLocating ? (
                            <span className="flex items-center gap-1 text-orange-200/80 font-medium">
                                <Loader2 size={10} className="animate-spin text-white" />
                                <span>Locating...</span>
                            </span>
                        ) : (
                            <strong className="text-white font-semibold tracking-tight">
                                {location}
                            </strong>
                        )}
                    </div>

                    <div className="w-px h-3 bg-white/20" />

                    {/* Track Order */}
                    <Link
                        href="/track-order"
                        className="flex items-center gap-1.5 hover:text-white transition font-medium text-orange-100"
                    >
                        <Truck size={12} className="text-orange-200" />
                        <span>Track order</span>
                    </Link>

                    {/* Help Center */}
                    <Link
                        href="/faqs"
                        className="hover:text-white transition text-orange-100 font-medium"
                    >
                        Help center
                    </Link>

                    {/* Hotline for single-store direct support */}
                    <a
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-1 text-orange-100 hover:text-white transition font-medium"
                    >
                        <Phone size={11} className="text-orange-200" />
                        <span>Hotline: <strong className="text-white">{phone}</strong></span>
                    </a>
                </div>

                {/* Right: Notifications, Language Toggle, Currency */}
                <div className="flex items-center gap-5">
                    {/* Notifications button */}
                    <button
                        type="button"
                        className="flex items-center gap-1.5 hover:text-white transition cursor-pointer text-orange-100"
                    >
                        <Bell size={12} className="text-orange-200" />
                        <span>Notifications</span>
                    </button>

                    <div className="w-px h-3 bg-white/20" />

                    {/* Language Display (বাংলা / EN) */}
                    <div className="flex items-center text-white font-medium">
                        <span>বাংলা / EN</span>
                    </div>

                    <div className="w-px h-3 bg-white/20" />

                    {/* Currency */}
                    <div className="flex items-center gap-1 font-semibold text-white">
                        <span>{currency}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
