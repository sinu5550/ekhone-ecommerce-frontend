/**
 * Helper to dispatch abandoned order details to backend /api/order/abandoned
 * (which forwards it to BizMation failed/custom-ft endpoint).
 * Uses navigator.sendBeacon when available to guarantee transmission even if user closes the tab.
 */
export function sendAbandonedOrderBeacon(data) {
    if (typeof window === "undefined" || !data) return;

    const phone = data.phoneNumber || data.phone || "";
    // Only send if phone has at least 11 digits
    const cleanPhone = String(phone).replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 11) return;

    const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const endpoint = `${apiUrl}/api/order/abandoned`;
    const payload = JSON.stringify(data);

    try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
            const blob = new Blob([payload], { type: "application/json" });
            const queued = navigator.sendBeacon(endpoint, blob);
            if (queued) return;
        }

        // Fallback: standard fetch with keepalive: true
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
        }).catch(() => {});
    } catch (_) {}
}
