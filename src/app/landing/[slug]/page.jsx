import { notFound } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import DynamicLandingClient from "@/components/LandingPage/DynamicLandingClient";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const res = await apiClient(`/api/landing-page/slug/${slug}`, {
            next: { revalidate: 60 }
        });
        if (res.success && res.data) {
            const lp = res.data;
            return {
                title: `${lp.pageTitle} | Ekhone`,
                description: lp.subTitle || "অর্ডার করুন ক্যাশ অন ডেলিভারিতে সারাদেশে।",
                openGraph: {
                    title: lp.pageTitle,
                    description: lp.subTitle || "",
                    images: Array.isArray(lp.bannerImages) && lp.bannerImages[0] ? [lp.bannerImages[0]] : [],
                }
            };
        }
    } catch (_) {}

    return {
        title: "Product Landing Page | Ekhone",
    };
}

export default async function LandingPageDynamicRoute({ params }) {
    const { slug } = await params;

    let landingPageData = null;
    let contactData = null;

    try {
        const res = await apiClient(`/api/landing-page/slug/${slug}`, {
            next: { revalidate: 30 }
        });
        if (res.success && res.data) {
            landingPageData = res.data;
        }
    } catch (e) {
        console.error("Landing page fetch error:", e.message);
    }

    try {
        const contactRes = await apiClient("/api/contact", {
            next: { revalidate: 60 }
        });
        contactData = contactRes?.data || contactRes || null;
    } catch (e) {
        console.warn("LandingPageDynamicRoute: Could not fetch contact data:", e.message);
    }

    if (!landingPageData || !landingPageData.isPublished) {
        notFound();
    }

    return (
        <DynamicLandingClient 
            landingPage={landingPageData} 
            contactData={contactData}
        />
    );
}
