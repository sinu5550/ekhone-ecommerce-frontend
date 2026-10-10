import useSWR from 'swr';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

const fetcher = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
        let errData = {};
        try {
            errData = await res.json();
        } catch (_) {}
        const error = new Error(errData.message || 'An error occurred while fetching data');
        error.status = res.status;
        throw error;
    }
    const json = await res.json();
    return Array.isArray(json) ? json : (json?.data || json?.categories || json);
};

export const useCategories = (fallbackData = []) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/categories`,
        fetcher,
        {
            fallbackData,
            revalidateOnFocus: false, // do not re-fetch whenever user clicks or focuses the tab
            revalidateOnReconnect: false,
            refreshInterval: 0, // disable aggressive background polling
            dedupingInterval: 60000, // cache for 1 minute in memory
        }
    );

    const categories = Array.isArray(data) ? data : (data?.data || data?.categories || []);

    return {
        categories,
        error,
        isLoading,
        isValidating,
        mutate,
    };
};

export const useContact = (fallbackData = null) => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/contact`,
        fetcher,
        {
            fallbackData,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            refreshInterval: 0, // disable aggressive background polling
            dedupingInterval: 60000, // cache for 1 minute in memory
        }
    );

    const contactData = data?.data || data || null;

    return {
        contactData,
        error,
        isLoading,
        isValidating,
        mutate,
    };
};
