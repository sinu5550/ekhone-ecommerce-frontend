import Link from "next/link";
import Navbar from "@/components/Shared/Navbar/Navbar";
import Footer from "@/components/Shared/Footer/Footer";
import { apiClient } from "@/lib/apiClient";
import { 
    Home, 
    ShoppingBag, 
    Compass, 
    Sparkles,
    Flame
} from "lucide-react";

export const metadata = {
    title: "404 - Page Not Found | Ekhone",
    description: "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
};

export default async function NotFound() {
    let categories = [];

    try {
        const catRes = await apiClient("/api/categories", {
            cache: "no-store",
            next: { revalidate: 0 }
        });
        if (Array.isArray(catRes)) {
            categories = catRes;
        } else if (catRes?.data && Array.isArray(catRes.data)) {
            categories = catRes.data;
        } else if (catRes?.categories && Array.isArray(catRes.categories)) {
            categories = catRes.categories;
        }
    } catch (e) {
        console.warn("NotFound: Could not fetch categories:", e.message);
    }

    // Default fallback categories if database returns empty
    const displayCategories = categories.length > 0 ? categories : [
        { id: 1, name: "Electronics & Gadget" },
        { id: 2, name: "Fashion" },
        { id: 3, name: "Appliances" },
        { id: 4, name: "Mobiles & Tablets" },
        { id: 5, name: "Kitchen & Dining" },
        { id: 6, name: "Personal Care" }
    ];

    return (
        <>
            <Navbar />
            <main className="min-h-[75vh] flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-orange-50/30 px-4 py-16 sm:pb-24 sm:pt-12 relative overflow-hidden font-hind">
                {/* Background Decorative Ambient Blobs */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-2xl w-full mx-auto text-center relative z-10 space-y-8">
                    
                    {/* Sweet 404 Hero Illustration & Badge */}
                    <div className="relative inline-block">
                        <div className="relative flex items-center justify-center">
                            {/* Big Stylized Gradient 404 Numbers */}
                            <span className="text-8xl sm:text-9xl md:text-[11rem] font-black tracking-tighter bg-gradient-to-r from-primary via-[#D9400B] to-[#102D50] bg-clip-text text-transparent select-none leading-none drop-shadow-sm font-sans">
                                404
                            </span>

                            {/* Floating Cute Compass/Package Badge in the middle */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-orange-100/80 animate-bounce duration-1000">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-[#D9400B] text-white flex items-center justify-center shadow-md">
                                    <Compass size={24} className="animate-spin duration-3000" />
                                </div>
                            </div>
                        </div>

                        {/* Status Chip */}
                        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-bold tracking-tight mt-2">
                            <Sparkles size={14} className="text-primary animate-pulse" />
                            <span>পৃষ্ঠাটি খুঁজে পাওয়া যায়নি (Page Not Found)</span>
                        </div>
                    </div>

                    {/* Friendly Bengali Title & Description with Hind Siliguri typography */}
                    <div className="space-y-2.5 max-w-lg mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
                            দুঃখিত! আপনি ভুল ঠিকানায় চলে এসেছেন
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                            আপনি যে পেজটি খুঁজছেন তা হয়তো সরানো হয়েছে, লিংকটি পরিবর্তিত হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ আছে।
                        </p>
                    </div>

                    {/* Quick Action Navigation Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            href="/"
                            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <Home size={16} />
                            <span>হোম পেজে ফিরে যান</span>
                        </Link>

                        <Link
                            href="/product"
                            className="px-6 py-3 bg-[#102D50] hover:bg-[#0A1C33] text-white rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                        >
                            <ShoppingBag size={16} />
                            <span>সব পণ্য দেখুন</span>
                        </Link>
                    </div>

                    {/* Live Dynamic Categories Fetched from Database */}
                    <div className="pt-6 border-t border-slate-200/80 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 flex items-center justify-center gap-1.5">
                            <Flame size={14} className="text-primary" />
                            <span>আমাদের ক্যাটাগরিগুলো ব্রাউজ করুন:</span>
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            {displayCategories.map((cat) => (
                                <Link
                                    key={cat.id || cat.name}
                                    href={`/product?category=${encodeURIComponent(cat.name)}`}
                                    className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200/90 text-xs font-medium text-slate-700 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-150 cursor-pointer shadow-2xs"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Help & Support note */}
                    <div className="text-[12px] text-slate-400">
                        কোনো সহায়তার প্রয়োজন হলে আমাদের{" "}
                        <Link href="/faqs" className="text-primary font-bold hover:underline">
                            হেল্প সেন্টার
                        </Link>{" "}
                        অথবা হটলাইনে যোগাযোগ করতে পারেন।
                    </div>

                </div>
            </main>
            <Footer />
        </>
    );
}
