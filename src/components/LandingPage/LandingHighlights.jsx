import Image from "next/image";
import { Sparkles, CheckCircle2 } from "lucide-react";

export default function LandingHighlights({ title, highlights }) {
    const list = Array.isArray(highlights) && highlights.length > 0 ? highlights : [];
    if (list.length === 0) return null;

    return (
        <section className="py-12 sm:py-16 bg-white border-b border-slate-100 font-hind">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold mb-2.5 border border-primary/20 shadow-2xs">
                        <Sparkles size={13} className="fill-primary" />
                        <span>PRODUCT GALLERY & FEATURES</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-secound tracking-tight">
                        {title || "পণ্যটির আকর্ষণীয় ব্যবহার ও বৈশিষ্ট্য"}
                    </h2>
                    <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-3" />
                </div>

                {/* Alternating Row Layout:
                    Row 1 (idx=0): Left Image, Right Details
                    Row 2 (idx=1): Right Image, Left Details
                    Row 3 (idx=2): Left Image, Right Details
                    ...
                */}
                <div className="space-y-12 sm:space-y-16">
                    {list.map((item, idx) => {
                        const isEven = idx % 2 === 0;

                        return (
                            <div
                                key={idx}
                                className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-6 sm:p-8 lg:p-10 shadow-xs hover:shadow-md transition-shadow"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                                    
                                    {/* Picture Column */}
                                    <div
                                        className={`lg:col-span-6 ${
                                            isEven ? "lg:order-1" : "lg:order-2"
                                        }`}
                                    >
                                        {item.image ? (
                                            <div className="min-h-[300px] sm:min-h-[360px] lg:min-h-[400px] w-full rounded-lg overflow-hidden bg-white/80 border border-slate-200/90 shadow-sm flex items-center justify-center p-4 group">
                                                <Image
                                                    src={item.image}
                                                    alt={item.title || "Product Gallery"}
                                                    width={0}
                                                    height={0}
                                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                                    className="w-auto h-auto max-w-full max-h-[360px] lg:max-h-[400px] object-contain rounded-lg group-hover:scale-[1.02] transition-transform duration-300"
                                                    unoptimized={item.image.startsWith("http")}
                                                />
                                            </div>
                                        ) : (
                                            <div className="min-h-[260px] w-full rounded-lg bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                                                <span className="text-xs font-medium">ছবির কোনো ফাইল যুক্ত করা হয়নি</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details Column (Renders TinyMCE HTML Rich Text) */}
                                    <div
                                        className={`lg:col-span-6 space-y-4 ${
                                            isEven ? "lg:order-2" : "lg:order-1"
                                        }`}
                                    >
                                        {item.title && (
                                            <div className="space-y-1.5">
                                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                                                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[11px]">
                                                        {idx + 1}
                                                    </span>
                                                    <span>বৈশিষ্ট্য ও বিবরণ</span>
                                                </div>
                                                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug">
                                                    {item.title}
                                                </h3>
                                            </div>
                                        )}

                                        {/* Description Content (Preserves multiline textarea breaks and renders cleanly) */}
                                        {item.desc && (
                                            item.desc.includes("<") && item.desc.includes(">") ? (
                                                <div
                                                    className="prose prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed font-hind
                                                        prose-headings:font-bold prose-headings:text-slate-900
                                                        prose-p:text-slate-600 prose-p:my-2
                                                        prose-strong:text-slate-900 prose-strong:font-bold"
                                                    dangerouslySetInnerHTML={{ __html: item.desc }}
                                                />
                                            ) : (
                                                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-hind whitespace-pre-line">
                                                    {item.desc}
                                                </p>
                                            )
                                        )}
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
