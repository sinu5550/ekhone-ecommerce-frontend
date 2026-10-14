
'use client';

import { ProtectedRoute } from "@/components/ProtectedRoute/ProtectedRoute";
import { UserProvider } from "@/context/UserContext";
import { Loader2 } from 'lucide-react';



export default function ProtectedLayout({ children }) {
    return (
        <ProtectedRoute
            redirectTo="/login"
            loadingComponent={
                <div className="min-h-screen flex items-center justify-center bg-stone-50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-[#F45116] mx-auto mb-4" />
                        <p className="text-gray-700 text-lg font-medium">Loading...</p>
                        <p className="text-gray-500 text-sm mt-2">Please wait while we verify your session</p>
                    </div>
                </div>
            }
        >
            {(user) => (
                <UserProvider user={user}>
                    <div className="min-h-screen">
                        {children}
                    </div>
                </UserProvider>
            )}
        </ProtectedRoute>
    );
};