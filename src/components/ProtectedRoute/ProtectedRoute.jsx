'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, getCurrentUser, refreshToken } from '@/lib/auth-helpers';

/**
 * Protected Route Hook
 * Use this hook in any page that requires authentication
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - Where to redirect if not authenticated (default: '/login')
 * @param {boolean} options.checkRole - Whether to check user role
 * @param {string[]} options.allowedRoles - Array of allowed roles (e.g., ['admin', 'user'])
 * @returns {Object} { user, loading, isAuthorized }
 */
export function useProtectedRoute(options = {}) {

    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    const {
        redirectTo = '/login',
        checkRole = false,
        allowedRoles = []
    } = options;

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check if user is authenticated
                if (!isAuthenticated()) {
                    console.log('❌ Not authenticated, redirecting to login...');

                    // Store the intended destination
                    sessionStorage.setItem('redirectAfterLogin', pathname);

                    router.push(redirectTo);
                    return;
                }

                // Get user data
                const currentUser = await getCurrentUser();

                if (!currentUser) {
                    console.log('❌ Failed to get user data, trying token refresh...');

                    // Try to refresh token
                    try {
                        await refreshToken();
                        const retryUser = await getCurrentUser();

                        if (!retryUser) {
                            throw new Error('Failed to get user after refresh');
                        }

                        setUser(retryUser);
                    } catch (refreshError) {
                        console.error('❌ Token refresh failed:', refreshError);

                        // Clear invalid tokens
                        localStorage.removeItem('supabase_access_token');
                        localStorage.removeItem('supabase_refresh_token');
                        localStorage.removeItem('supabase_user');

                        sessionStorage.setItem('redirectAfterLogin', pathname);
                        router.push(redirectTo);
                        return;
                    }
                } else {
                    setUser(currentUser);
                }

                // Check role if required
                if (checkRole && allowedRoles.length > 0) {
                    const userRole = currentUser?.user_metadata?.role || 'user';

                    if (!allowedRoles.includes(userRole)) {
                        console.log(`❌ User role "${userRole}" not authorized. Allowed roles:`, allowedRoles);
                        router.push('/unauthorized');
                        return;
                    }
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('❌ Auth check error:', error);
                router.push(redirectTo);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname, redirectTo, checkRole, JSON.stringify(allowedRoles)]);

    return { user, loading, isAuthorized };
}

/**
 * Protected Route Component Wrapper
 * Wrap your page component with this for automatic protection
 */
export function ProtectedRoute({
    children,
    redirectTo = '/login',
    loadingComponent = null,
    unauthorizedComponent = null,
    checkRole = false,
    allowedRoles = []
}) {
    const { user, loading, isAuthorized } = useProtectedRoute({
        redirectTo,
        checkRole,
        allowedRoles
    });

    // Show loading state
    if (loading) {
        if (loadingComponent) {
            return loadingComponent;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Show unauthorized state
    if (!isAuthorized) {
        if (unauthorizedComponent) {
            return unauthorizedComponent;
        }

        return null; // Will redirect automatically
    }

    // Render protected content with user data
    return <>{typeof children === 'function' ? children(user) : children}</>;
}

/**
 * Admin Only Route Component
 * Shorthand for role-based protection
 */
export function AdminRoute({ children, ...props }) {
    return (
        <ProtectedRoute
            checkRole={true}
            allowedRoles={['admin']}
            {...props}
        >
            {children}
        </ProtectedRoute>
    );
}

/**
 * Public Only Route (redirects authenticated users away)
 * Use for login/signup pages
 */
export function PublicOnlyRoute({ children, redirectTo = '/my-account' }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            if (isAuthenticated()) {
                // console.log('✅ User already authenticated, redirecting...');
                router.push(redirectTo);
            } else {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, redirectTo]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
