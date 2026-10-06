'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth-helpers';
import Swal from 'sweetalert2';
import Link from 'next/link';

const ForgotPassword = () => {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const result = await requestPasswordReset(data.email);

            if (result.success) {
                // Store email for OTP verification
                sessionStorage.setItem('verificationEmail', data.email);
                sessionStorage.setItem('isPasswordReset', 'true');

                await Swal.fire({
                    icon: 'success',
                    title: 'Email Sent!',
                    text: 'Password reset code has been sent to your email.',
                    confirmButtonColor: '#F45116'
                });

                router.push('/verify-otp');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'Failed to send reset code. Please try again.',
                confirmButtonColor: '#F45116'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-160px)] bg-gray-50/50 flex flex-col justify-start md:justify-center py-8 md:py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-[#102D50] tracking-tight">
                    Forgot Password?
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address and we'll send you a code to reset your password
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-xl sm:px-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <input
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address"
                                    }
                                })}
                                type="email"
                                placeholder="yourname@example.com"
                                disabled={isLoading}
                                className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            />
                            {errors.email && (
                                <p className="mt-2 text-xs text-red-600">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-primary hover:bg-[#D9400B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out uppercase cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Remember your password?{' '}
                            <Link href="/login" className="font-semibold text-primary hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
