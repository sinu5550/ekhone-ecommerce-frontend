'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/auth-helpers';
import { Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';
import Link from 'next/link';

const ResetPassword = () => {
    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const password = watch('password');

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const result = await updatePassword(data.password);

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Your password has been reset successfully.',
                    confirmButtonColor: '#F45116'
                });

                router.push('/login');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'Failed to reset password. Please try again.',
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
                    Reset Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Create a new password for your account
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-xl sm:px-10">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 6,
                                            message: "Password must be at least 6 characters"
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                            message: "Password must contain uppercase, lowercase, and number"
                                        }
                                    })}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter new password"
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
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    {...register("confirmPassword", {
                                        required: "Please confirm your password",
                                        validate: (value) =>
                                            value === password || "Passwords do not match"
                                    })}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm new password"
                                    disabled={isLoading}
                                    className="block w-full pl-4 pr-10 py-2.5 bg-gray-50/50 border border-gray-200 rounded-[6px] text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                                    disabled={isLoading}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-2 text-xs text-red-600">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Password Requirements */}
                        <div className="bg-gray-50/80 p-3.5 rounded-[6px] border border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password must contain:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• At least 6 characters</li>
                                <li>• One uppercase letter</li>
                                <li>• One lowercase letter</li>
                                <li>• One number</li>
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-primary hover:bg-[#D9400B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out uppercase cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
