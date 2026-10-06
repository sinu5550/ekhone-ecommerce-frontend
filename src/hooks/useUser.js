'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth-helpers';

export const useUser = () => {
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('supabase_user');
                return stored ? JSON.parse(stored) : null;
            } catch (e) {
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch (err) {
            const errorMessage = err?.message || 'Failed to fetch user';
            setError(errorMessage);
            console.error('Error fetching user:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Get user initials
    const getUserInitials = () => {
        if (!user) return '??';

        const fullName = user?.user_metadata?.full_name || user?.fullName || user?.email || '';
        const names = fullName.trim().split(' ');

        if (names.length >= 2) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    // Get avatar URL
    const getAvatarUrl = () => {
        return user?.user_metadata?.picture || user?.avatar || null;
    };

    // Get display name
    const getDisplayName = () => {
        if (!user) return 'User';
        return user?.user_metadata?.full_name || user?.fullName || user?.email?.split('@')[0] || 'User';
    };

    // Get user email
    const getUserEmail = () => {
        return user?.email || '';
    };

    // Check if user is logged in
    const isAuthenticated = () => {
        return !!user;
    };

    // Refresh user data
    const refreshUser = async () => {
        return await fetchUser();
    };

    // Initial fetch on mount and listen to changes
    useEffect(() => {
        fetchUser();

        const handleStorageChange = (e) => {
            if (e.key === 'supabase_access_token' || e.key === 'supabase_user') {
                fetchUser();
            }
        };

        const handleAuthChange = () => {
            fetchUser();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('authChange', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('authChange', handleAuthChange);
        };
    }, []);

    return {
        user,
        loading,
        error,
        fetchUser,
        getUserInitials,
        getAvatarUrl,
        getDisplayName,
        getUserEmail,
        isAuthenticated,
        refreshUser,
    };
};
