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
            revalidateOnFocus: true, // auto re-fetches as soon as user switches back to tab
            revalidateOnReconnect: true,
            refreshInterval: 10000, // checks every 10s automatically
            dedupingInterval: 2000,
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
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            refreshInterval: 30000,
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
