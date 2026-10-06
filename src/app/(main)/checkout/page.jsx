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
            cache: "no-store",
            next: { revalidate: 0 }
        });
        contactData = contactRes?.data || contactRes || null;
    } catch (_) {}

    return <CheckoutClient initialContact={contactData} />;
}
