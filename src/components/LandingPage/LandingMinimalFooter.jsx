import Image from "next/image";
import { Phone, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export default function LandingMinimalFooter({ phone = "+880 1700-000000" }) {
    return (
        <footer id="landing-footer" className="w-full bg-[#0d223c] text-slate-300 py-10 border-t border-slate-700/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-6">
                {/* Logo in light badge */}
                <div className="inline-block bg-white rounded-lg px-4 py-1.5 shadow-sm">
                    <div className="relative w-28 h-8">
                        <Image
                            src="/ekhone.png"
                            alt="Ekhone"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    আমরা শতভাগ আসল ও যাচাইকৃত কোয়ালিটির পণ্য সরবরাহ করি। যেকোন প্রয়োজনে সরাসরি আমাদের হটলাইনে যোগাযোগ করতে পারেন।
                </p>

                {/* Hotline Bar */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white text-xs font-semibold">
                    <Phone size={14} className="text-primary" />
                    <span>হটলাইন হেল্পলাইন:</span>
                    <a href={`tel:${phone.replace(/\s+/g, "")}`} className="font-hind text-primary font-bold hover:underline">
                        {phone}
                    </a>
                </div>

                {/* Badges */}
                <div className="flex items-center justify-center gap-6 text-[11px] text-slate-400 pt-2 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <Truck size={13} className="text-primary" /> সারা বাংলাদেশে ক্যাশ অন ডেলিভারি
                    </span>
                    <span className="flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-primary" /> ১০০% সুরক্ষিত কেনাকাটা
                    </span>
                    <span className="flex items-center gap-1.5">
                        <RotateCcw size={13} className="text-primary" /> সহজ রিটার্ন পলিসি
                    </span>
                </div>

                {/* Copyright */}
                <div className="pt-6 border-t border-slate-700/40 text-[11px] text-slate-400">
                    © {new Date().getFullYear()} Ekhone. সর্বস্বত্ব সংরক্ষিত।
                </div>
            </div>
        </footer>
    );
}
