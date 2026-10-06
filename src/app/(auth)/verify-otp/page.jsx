'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyOtp, resendOtp } from '@/lib/auth-helpers';
import Swal from 'sweetalert2';

const VerifyOtp = () => {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [isPasswordReset, setIsPasswordReset] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        // Get email from session storage
        const storedEmail = sessionStorage.getItem('verificationEmail');
        const resetFlag = sessionStorage.getItem('isPasswordReset') === 'true';

        if (!storedEmail) {
            router.push('/sign-up');
            return;
        }

        setEmail(storedEmail);
        setIsPasswordReset(resetFlag);
    }, [router]);

    useEffect(() => {
        // Countdown timer
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input for 6-digit OTP
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            await Swal.fire({
                icon: 'error',
                title: 'Invalid OTP',
                text: 'Please enter all 6 digits',
                confirmButtonColor: '#F45116'
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await verifyOtp(email, otpCode, isPasswordReset);

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Verified!',
                    text: isPasswordReset
                        ? 'Email verified! You can now reset your password.'
                        : 'Email verified successfully!',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Clear session storage
                sessionStorage.removeItem('verificationEmail');
                sessionStorage.removeItem('isPasswordReset');

                // Redirect
                if (isPasswordReset) {
                    router.push('/reset-password');
                } else {
                    router.push('/my-account');
                }
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: error.message || 'Invalid OTP. Please try again.',
                confirmButtonColor: '#F45116'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsLoading(true);
        try {
            await resendOtp(email);
            await Swal.fire({
                icon: 'success',
                title: 'Code Resent!',
                text: 'A new verification code has been sent to your email.',
                timer: 1500,
                showConfirmButton: false
            });

            setTimer(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']); // Reset to 6 empty strings
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'Failed to resend code. Please try again.',
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
                    Verify Your Email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    We've sent a 6-digit verification code to
                </p>
                <p className="text-primary font-semibold text-center text-sm mt-0.5">{email}</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-xl sm:px-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* OTP Input Fields - 6 digits */}
                        <div className="flex justify-center gap-2 sm:gap-2.5">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    disabled={isLoading}
                                    className="w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-bold bg-gray-50/50 border border-gray-200 rounded-[6px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors disabled:bg-gray-100"
                                />
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-[6px] text-white bg-primary hover:bg-[#D9400B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out uppercase cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </div>

                        {/* Resend Code */}
                        <div className="text-center pt-2">
                            {canResend ? (
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={isLoading}
                                    className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider disabled:text-gray-400 cursor-pointer"
                                >
                                    Resend Code
                                </button>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Resend code in <span className="font-semibold text-gray-700">{timer}s</span>
                                </p>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Wrong email?{' '}
                            <button
                                type="button"
                                onClick={() => router.push(isPasswordReset ? '/forgot-password' : '/sign-up')}
                                className="font-semibold text-primary hover:underline cursor-pointer"
                            >
                                Go back
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;
