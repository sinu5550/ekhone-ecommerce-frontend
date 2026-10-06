'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { apiClient } from "@/lib/apiClient";

const AuthCallback = () => {
    const router = useRouter();
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Authenticating...');

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const supabase = createClient();
                setStatus('Checking authentication...');

                // Get the session from URL hash/query params
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('❌ Auth callback error:', sessionError);
                    setError('Authentication failed. Please try again.');
                    setTimeout(() => router.push('/login?error=auth_failed'), 2000);
                    return;
                }

                if (session && session.user) {
                    console.log('✅ OAuth session received:', session.user.email);

                    // Store tokens in localStorage
                    localStorage.setItem('supabase_access_token', session.access_token);
                    localStorage.setItem('supabase_refresh_token', session.refresh_token);
                    localStorage.setItem('supabase_user', JSON.stringify(session.user));

                    // Check if user already exists or is new
                    const isNewUser = session.user.created_at === session.user.last_sign_in_at;

                    if (isNewUser) {
                        console.log('🎉 New user signed up via OAuth');
                        setStatus('Creating your profile...');

                        // Create customer in your database
                        await createCustomerFromOAuth(session.user);
                    } else {
                        console.log('👋 Existing user logged in via OAuth');
                    }

                    // Success - redirect to account page
                    setTimeout(() => {
                        router.push('/my-account');
                    }, 1500);

                } else {
                    console.error('❌ No session found');
                    setError('No session found. Redirecting to login...');
                    setTimeout(() => router.push('/login'), 2000);
                }
            } catch (err) {
                console.error('❌ Callback handling error:', err);
                setError('Something went wrong. Please try again.');
                setTimeout(() => router.push('/login'), 2000);
            }
        };

        handleCallback();
    }, [router]);

    // Function to create customer from OAuth user
    const createCustomerFromOAuth = async (user) => {
        try {
            console.log('📝 Creating customer from OAuth user:', user);

            const { email, user_metadata, id: authUserId } = user;

            const customerData = {
                fullName: user_metadata?.full_name ||
                    user_metadata?.name ||
                    email?.split('@')[0] ||
                    'Customer',
                email: email,
                phone: '',
                status: true,
                authUserId: authUserId
            };

            const response = await apiClient("/api/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customerData),
            });

            if (response && (response.success || response.data || response.id)) {
                setStatus('Profile created! Redirecting...');
                return response;
            } else {
                setStatus('Profile partially created. Redirecting...');
            }
        } catch (error) {
            console.error('❌ Error creating customer from OAuth:', error);
            setStatus('Authentication successful! Redirecting...');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 py-16 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md w-full border border-gray-100">
                {!error ? (
                    <>
                        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-700 text-base font-semibold">{status}</p>

                        {status === 'Creating your profile...' && (
                            <div className="mt-4 space-y-2">
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-pulse"></div>
                                </div>
                                <p className="text-gray-400 text-xs">Setting up your account...</p>
                            </div>
                        )}

                        {status.includes('Redirecting') && (
                            <div className="mt-4">
                                <div className="h-1.5 w-full bg-orange-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-[progress_1s_ease-in-out]"></div>
                                </div>
                                <p className="text-gray-400 text-xs mt-2">Taking you to your account...</p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="bg-red-50 rounded-full h-14 w-14 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-red-600 text-base font-semibold">{error}</p>
                        <p className="text-gray-400 text-xs mt-2">You will be redirected shortly...</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
