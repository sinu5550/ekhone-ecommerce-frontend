import { ShieldCheck, Sparkles, Truck, CheckCircle2, Award, HeartHandshake } from "lucide-react";

export default function LandingFeatures({ title, features }) {
    const list = Array.isArray(features) && features.length > 0 ? features : [
        { title: "১০০% অরিজিনাল প্রোডাক্ট", desc: "সরাসরি অথরাইজড চ্যানেল থেকে সংগৃহীত জেনুইন গ্যাজেট", icon: "shield" },
        { title: "লেটেস্ট টেকনোলজি ও প্রিমিয়াম বিল্ড", desc: "স্মার্ট ফিচার, টেকসই পারফর্মেন্স ও প্রিমিয়াম ডিজাইন", icon: "sparkles" },
        { title: "দ্রুততম হোম ডেলিভারি", desc: "সারাদেশে নিরাপদ ও দ্রুততম ক্যাশ অন ডেলিভারি সুবিধা", icon: "truck" },
        { title: "ওয়ারেন্টি ও চেক করার সুযোগ", desc: "ডেলিভারি ম্যানের সামনে চেক করে নেওয়ার পূর্ণ নিশ্চয়তা", icon: "check" },
    ];

    const getIcon = (type) => {
        switch (type) {
            case "shield": return ShieldCheck;
            case "truck": return Truck;
            case "check": return CheckCircle2;
            case "award": return Award;
            default: return Sparkles;
        }
    };

    return (
        <section className="py-12 sm:py-16 bg-white border-b border-slate-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
                    <span className="text-xs font-bold text-primary tracking-widest uppercase block mb-1">
                        Benefits & Highlights
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-secound tracking-tight">
                        {title || "কেন আমাদের পণ্য সেরা?"}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {list.map((item, idx) => {
                        const Icon = getIcon(item.icon);
                        return (
                            <div 
                                key={idx} 
                                className="p-6 rounded-lg bg-amber-50/40 border border-amber-100/80 hover:border-primary/40 hover:shadow-subtle transition-all duration-200 space-y-3 group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-white border border-amber-200/60 text-primary flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {item.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
