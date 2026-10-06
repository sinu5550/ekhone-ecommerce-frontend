import { createClient } from '@/utils/supabase/client.js';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

// Sign Up
export async function signUp(email, password, phone, fullName) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/signup`, {
            email,
            password,
            phone,
            fullName
        });

        console.log('✅ Sign up response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Sign up error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Sign up failed');
    }
}

// Resend OTP
export async function resendOtp(email) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/resend-otp`, {
            email
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to resend OTP');
    }
}

// Verify OTP
export async function verifyOtp(email, otp, isPasswordReset = false) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
            email,
            otp,
            isPasswordReset
        });

        if (response.data.success && response.data.data?.session) {
            // Store session in localStorage
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);

            // Store user data
            localStorage.setItem('supabase_user', JSON.stringify(response.data.data.user));

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('authChange'));
            }
        }

        return response.data;
    } catch (error) {
        console.error('❌ OTP verification error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'OTP verification failed');
    }
}

// Login with Email/Password
export async function login(email, password) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password
        });

        if (response.data.success && response.data.data?.session) {
            // Store session in localStorage
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);

            // Store user data
            localStorage.setItem('supabase_user', JSON.stringify(response.data.data.user));

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('authChange'));
            }
        }

        return response.data;
    } catch (error) {
        console.error('❌ Login error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
}

// Login with Phone
export async function loginWithMobile(phone, password) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/login`, {
            phone,
            password
        });

        if (response.data.success && response.data.data?.session) {
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);
            localStorage.setItem('supabase_user', JSON.stringify(response.data.data.user));

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('authChange'));
            }
        }

        return response.data;
    } catch (error) {
        console.error('❌ Mobile login error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Login failed');
    }
}

// Request Password Reset
export async function requestPasswordReset(email) {
    try {
        const response = await axios.post(`${API_URL}/api/auth/request-password-reset`, {
            email
        });

        return response.data;
    } catch (error) {
        console.error('❌ Password reset request error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Password reset request failed');
    }
}

// Update Password
export async function updatePassword(newPassword) {
    try {
        const token = localStorage.getItem('supabase_access_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.put(
            `${API_URL}/api/auth/update-password`,
            { newPassword },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Password update error:', error.response?.data);
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Password update failed');
    }
}

// Logout
export async function logout() {
    try {
        const token = localStorage.getItem('supabase_access_token');

        if (token) {
            try {
                await axios.post(
                    `${API_URL}/api/auth/logout`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
            } catch (ignore) {}
        }

        // Clear all auth data
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('supabase_user');
        sessionStorage.clear();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('authChange'));
        }

        return { success: true };
    } catch (error) {
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('supabase_user');
        sessionStorage.clear();

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('authChange'));
        }

        console.error('❌ Logout error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Logout failed');
    }
}

// Get Current User
export async function getCurrentUser() {
    try {
        const token = localStorage.getItem('supabase_access_token');

        if (!token) {
            return null;
        }

        const response = await axios.get(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data?.data?.user || response.data?.user || null;
    } catch (error) {
        // If token is invalid, clear it
        if (error.response?.status === 401) {
            localStorage.removeItem('supabase_access_token');
            localStorage.removeItem('supabase_refresh_token');
            localStorage.removeItem('supabase_user');
        }

        return null;
    }
}

// Refresh Token
export async function refreshToken() {
    try {
        const refresh_token = localStorage.getItem('supabase_refresh_token');

        if (!refresh_token) {
            throw new Error('No refresh token found');
        }

        const response = await axios.post(`${API_URL}/api/auth/refresh-token`, {
            refreshToken: refresh_token
        });

        if (response.data.success && response.data.data?.session) {
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);
        }

        return response.data;
    } catch (error) {
        console.error('❌ Token refresh error:', error.response?.data);
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('supabase_user');
        throw new Error(error.response?.data?.error || 'Token refresh failed');
    }
}

// Social Auth (Google)
export async function socialAuth(provider) {
    const supabase = createClient();

    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: `${window.location.origin}/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Social auth error:', error);
        throw error;
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('supabase_access_token');
    const user = localStorage.getItem('supabase_user');
    return !!(token && user);
}

// Get stored user data
export function getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
        const userStr = localStorage.getItem('supabase_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
    }
}
