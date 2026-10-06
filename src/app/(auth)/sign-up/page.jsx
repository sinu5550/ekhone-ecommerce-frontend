'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useForm, Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from 'next/navigation';
import { signUp } from '@/lib/auth-helpers.js';
import { useUser } from '@/hooks/useUser';
import Swal from 'sweetalert2';
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { trackSignUp } from '@/utils/dataLayer';

const SignUp = () => {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    const { control, register, handleSubmit, formState: { errors }, reset } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!userLoading && user) {
            router.replace('/my-account');
        }
    }, [user, userLoading, router]);

    if (userLoading || user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Function to create customer in database
    const createCustomerInDatabase = async (userData, authUserId) => {
        try {
            const formattedPhone = userData.phone ? userData.phone.replace(/\D/g, '') : '';

            // Format data for API
            const customerData = {
                fullName: userData.fullName,
                email: userData.email,
                phone: formattedPhone,
                status: true,
                authUserId: authUserId || null
            };

            let response = null;
            try {
                response = await apiClient("/api/customer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(customerData),
                });
            } catch (apiErr) {
                // If customer profile already exists from a guest order, link authUserId if available
                if (apiErr.status === 409 || apiErr.message?.includes('already exists')) {
                    console.log('Customer profile already exists in DB (from guest order), linking profile...');
                    
                    let existingId = apiErr.responseData?.data?.id || apiErr.responseData?.id || apiErr.responseData?.customer?.id;
                    if (existingId && authUserId) {
                        try {
                            await apiClient(`/api/customer/${existingId}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ authUserId }),
                            });
                        } catch (updateErr) {}
                    }
                    
                    reset();
                    return;
                }
                throw apiErr;
            }

            if (response && (response.success || response.data || response.id)) {
                toast.success(response.message || "Customer profile linked successfully!");
                reset();
            } else {
                throw new Error(response?.message || "Failed to add customer");
            }
        } catch (error) {
            console.error("Error adding customer:", error);
            // Non-blocking for auth user creation
        }
    };

    // Main onSubmit function
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Step 1: Create auth account in Supabase / Auth Backend
            const authResult = await signUp(
                data.email,
                data.password,
                data.phone,
                data.fullName
            );

            if (authResult.success) {
                trackSignUp(data.email ? 'email' : 'phone');
                // Step 2: Create customer in your database
                try {
                    await createCustomerInDatabase(data, authResult.data?.user?.id);

                    // Store email for verification
                    sessionStorage.setItem('verificationEmail', data.email);
                    sessionStorage.setItem('isPasswordReset', 'false');

                    // Success message
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Account created! Please check email for verification code.',
                        confirmButtonColor: '#F45116',
                        showConfirmButton: true
                    });

                    // Redirect to OTP verification
                    router.push('/verify-otp');

                } catch (dbError) {
                    // If database fails but auth succeeded, show specific error
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Partial Success',
                        html: `
                            <div class="text-left">
                                <p>Authentication successful but profile creation failed.</p>
                                <p class="text-sm mt-2">Please verify your email first, then contact support to complete your profile.</p>
                            </div>
                        `,
                        confirmButtonColor: '#F45116'
                    });

                    // Still allow verification
                    sessionStorage.setItem('verificationEmail', data.email);
                    sessionStorage.setItem('isPasswordReset', 'false');
                    router.push('/verify-otp');
                }
            }
        } catch (error) {
            // Handle auth errors
            let errorMessage = error.message || 'Failed to create account';

            if (errorMessage.includes('already registered')) {
                errorMessage = 'This email is already registered. Please login instead.';
            }

            await Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
                confirmButtonColor: '#F45116',
                footer: errorMessage.includes('already registered')
                    ? '<a href="/login" style="color: #F45116; font-weight: 600;">Go to Login</a>'
                    : ''
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-160px)] bg-gray-50/50 flex flex-col justify-start md:justify-center py-8 md:py-16 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-[#102D50] tracking-tight">
                    Create Account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Join us today to enjoy faster checkouts, order tracking, and more
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-xl sm:px-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Full Name
                            </label>
                            <input
                                {...register("fullName", {
                                    required: "Full name is required",
                                    minLength: {
                                        value: 2,
                                        message: "Name must be at least 2 characters"
                                    }
                                })}
                                type="text"
                                placeholder="Your Name"
                                disabled={isLoading}
                                className="block w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                            />
                            {errors.fullName && (
                                <p className="mt-2 text-xs text-red-600">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Phone Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Phone Number
                            </label>
                            <Controller
                                name="phone"
                                control={control}
                                rules={{
                                    required: "Phone number is required"
                                }}
                                render={({ field }) => (
                                    <PhoneInput
                                        {...field}
                                        country={'bd'}
                                        enableSearch={true}
                                        containerClass="!w-full"
                                        inputClass="!w-full !py-2.5 !bg-gray-50/50 !border-gray-200 !rounded-[6px] !pl-12 !text-sm !text-gray-900 focus:!border-primary focus:!ring-primary"
                                        buttonClass="!bg-transparent !border-0 !rounded-l-[6px]"
                                        dropdownClass="!text-gray-900"
                                        searchClass="!text-gray-900"
                                        disabled={isLoading}
                                    />
                                )}
                            />
                            {errors.phone && (
                                <p className="mt-2 text-xs text-red-600">{errors.phone.message}</p>
                            )}
                        </div>

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

                        {/* Password Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 6,
                                            message: "Password must have at least 6 characters"
                                        }
                                    })}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create password"
                                    disabled={isLoading}
                                    className="block w-full pl-4 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-2 text-xs text-red-600">{errors.password.message}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-400 text-left">
                                Must be at least 6 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-primary hover:bg-[#D9400B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out uppercase cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
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

export default SignUp;
