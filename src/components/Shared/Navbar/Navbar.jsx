import { apiClient } from "@/lib/apiClient";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
    let categories = [];
    let contactData = null;

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
        console.warn("Navbar: Could not fetch categories:", e.message);
    }

    try {
        const contactRes = await apiClient("/api/contact", {
            cache: "no-store",
            next: { revalidate: 0 }
        });
        contactData = contactRes?.data || contactRes || null;
    } catch (e) {
        console.warn("Navbar: Could not fetch contact info:", e.message);
    }

    return (
        <NavbarClient 
            categories={categories} 
            contactData={contactData} 
        />
    );
}
