const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiClient(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("supabase_access_token")
            : null;

    const headers = {
        "Content-Type": "application/json",
        ...(token && {
            Authorization: `Bearer ${token}`,
        }),
        ...(options.headers || {}),
    };

    const config = {
        ...options,
        headers,
    };

    // If neither cache nor next revalidation is explicitly provided, default to ISR revalidation (15s)
    if (!config.cache && !config.next) {
        config.next = { revalidate: 15 };
    }

    try {
        const res = await fetch(url, config);
        if (!res.ok) {
            let errorData = {};
            try {
                errorData = await res.json();
            } catch (_) {}
            const err = new Error(errorData.message || `Request failed with status ${res.status}`);
            err.code = errorData.code;
            err.isDuplicate = errorData.isDuplicate;
            err.orderNumber = errorData.orderNumber;
            err.status = res.status;
            throw err;
        }
        return await res.json();
    } catch (err) {
        // If it's an aborted fetch (e.g. user typed a new character), or dynamic bailout, rethrow quietly
        if (
            err?.name === "AbortError" || 
            err?.message?.includes("aborted") || 
            err?.digest === "DYNAMIC_SERVER_USAGE" || 
            err?.message?.includes("Dynamic server usage") ||
            err?.code === "DUPLICATE_ORDER" ||
            err?.isDuplicate
        ) {
            throw err;
        }
        console.error(`API Client Error (${url}):`, err.message);
        throw err;
    }
}

