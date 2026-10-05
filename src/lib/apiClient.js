const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiClient(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const res = await fetch(url, config);
        if (!res.ok) {
            let errorData = {};
            try {
                errorData = await res.json();
            } catch (_) {}
            throw new Error(errorData.message || `Request failed with status ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error(`API Client Error (${url}):`, err.message);
        throw err;
    }
}
