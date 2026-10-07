import { Suspense } from "react";
import CheckoutClient from "@/components/Checkout/CheckoutClient";
import { apiClient } from "@/lib/apiClient";

export const metadata = {
    title: "Checkout | Ekhone",
    description: "Complete your order with Cash on Delivery across Bangladesh on Ekhone.",
};

export default async function CheckoutPage() {
    let contactData = null;
    try {
        const contactRes = await apiClient("/api/contact", {
            next: { revalidate: 15, tags: ['contact'] }
        });
        contactData = contactRes?.data || contactRes || null;
    } catch (_) {}

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5]">
                <div className="w-8 h-8 border-3 border-[#F45116] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutClient initialContact={contactData} />
        </Suspense>
    );
}
